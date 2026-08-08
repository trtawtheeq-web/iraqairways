import SilentErrorBoundary from "../components/SilentErrorBoundary";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { jazeeraRoutes } from '../lib/flightEngine';
import { useLang } from '../contexts/LanguageContext';
import { AIRPORT_NAMES } from '../lib/airportNames';

const cities = [
  { iata: 'KWI', city: 'Kuwait' },
  ...jazeeraRoutes.map((r) => ({ iata: r.iata, city: r.city })),
].sort((a, b) => a.city.localeCompare(b.city));

type PickerTarget = 'origin' | 'destination' | 'date' | 'pax' | 'multicity' | null;

// A single Multi City flight leg.
type McLeg = { origin: string; destination: string; date: string };
// Which field of which Multi City leg the user is currently editing.
type McEdit = { idx: number; field: 'origin' | 'destination' | 'date' } | null;

// Currency list with country flag codes, matching the original site order
const CURRENCIES: { code: string; label: string; flag: string }[] = [
  { code: 'USD', label: 'US Dollars (USD)', flag: 'us' },
  { code: 'AED', label: 'UAE Dirham (AED)', flag: 'ae' },
  { code: 'BHD', label: 'Bahraini Dinar (BHD)', flag: 'bh' },
  { code: 'EGP', label: 'Egyptian Pound (EGP)', flag: 'eg' },
  { code: 'EUR', label: 'Euro (EUR)', flag: 'eu' },
  { code: 'GBP', label: 'Sterling (GBP)', flag: 'gb' },
  { code: 'INR', label: 'Indian Rupee (INR)', flag: 'in' },
  { code: 'JOD', label: 'Jordanian Dinar (JOD)', flag: 'jo' },
  { code: 'KWD', label: 'Kuwaiti Dinar (KWD)', flag: 'kw' },
  { code: 'LKR', label: 'Sri Lankan Rupee (LKR)', flag: 'lk' },
  { code: 'OMR', label: 'Omani Rial (OMR)', flag: 'om' },
  { code: 'QAR', label: 'Qatari Riyal (QAR)', flag: 'qa' },
  { code: 'RUB', label: 'Russian Ruble (RUB)', flag: 'ru' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)', flag: 'sa' },
];

const Home = () => {
  const [, setLocation] = useLocation();
  const { lang, isAr, dir, t, setLang, cityName, countryName, fullAirportName } = useLang();

  // Restore picker UI state across page refreshes so the user stays on the
  // same screen (tab / open picker / multicity legs / passengers) instead of
  // being sent back to the home page.
  const PICKER_STATE_KEY = 'jzHomeState';
  const savedHomeState = (() => {
    try {
      if (typeof localStorage !== 'undefined') {
        return JSON.parse(localStorage.getItem(PICKER_STATE_KEY) || 'null');
      }
    } catch { /* ignore */ }
    return null;
  })();
  const sv = savedHomeState || {};

  const [activeTab, setActiveTab] = useState(sv.activeTab || 'One Way');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [offersIndex, setOffersIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const [servicesIndex, setServicesIndex] = useState(0);
  const [ayntkIndex, setAyntkIndex] = useState(0);
  const [aviationIndex, setAviationIndex] = useState(0);

  // Recent searches (persisted in localStorage)
  const RECENT_SEARCHES_KEY = 'jzRecentSearches';
  const [recentSearches, setRecentSearches] = useState<Array<{origin: string; destination: string; date: string; pax: number}>>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
  });
  const saveRecentSearch = (o: string, d: string, dt: string, pax: number) => {
    try {
      const entry = { origin: o, destination: d, date: dt, pax };
      const existing = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      const filtered = existing.filter((s: any) => !(s.origin === o && s.destination === d && s.date === dt));
      const updated = [entry, ...filtered].slice(0, 6);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  // Search form state
  const [origin, setOrigin] = useState(sv.origin ?? 'KWI');
  const [destination, setDestination] = useState(sv.destination ?? '');
  const [date, setDate] = useState(sv.date ?? '');
  const [returnDate, setReturnDate] = useState(sv.returnDate ?? '');
  const [cancelProtection, setCancelProtection] = useState(false);
  const [passengers, setPassengers] = useState('1');
  // Passenger breakdown (matches original: Adult/Child/Infant/Senior/UM)
  const [adults, setAdults] = useState(sv.adults ?? 1);
  const [children, setChildren] = useState(sv.children ?? 0);
  const [infants, setInfants] = useState(sv.infants ?? 0);
  const [seniors, setSeniors] = useState(sv.seniors ?? 0);
  const [umnr, setUmnr] = useState(sv.umnr ?? 0);
  const [duoSeat, setDuoSeat] = useState(sv.duoSeat ?? 0);
  // Calendar: left-most visible month (first of month)
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [paxTab, setPaxTab] = useState<'new' | 'saved'>('new');

  // Preferences modal + currency
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefLang, setPrefLang] = useState<'en' | 'ar'>(lang);
  const [currency, setCurrency] = useState<string>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const pref = JSON.parse(localStorage.getItem('jzPref') || 'null');
        if (pref && pref.curr) return String(pref.curr).toUpperCase();
        return localStorage.getItem('jz_currency') || 'KWD';
      }
    } catch { /* ignore */ }
    return 'KWD';
  });

  // Currency dropdown (custom, with flags) state
  const [currOpen, setCurrOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [calCurrOpen, setCalCurrOpen] = useState(false);
  const calCurrRef = useRef<HTMLDivElement>(null);
  const calCurrRef2 = useRef<HTMLDivElement>(null);

  // Summer promo popup state
  const [showPromo, setShowPromo] = useState(false);
  const [promoCountdown, setPromoCountdown] = useState({ h: 0, m: 0, s: 0 });

  // Show promo popup after 2 seconds, with unique countdown per visitor
  useEffect(() => {
    const PROMO_KEY = 'jz_promo_end';
    let endTime: number;
    const stored = localStorage.getItem(PROMO_KEY);
    if (stored && Number(stored) > Date.now()) {
      endTime = Number(stored);
    } else {
      // Random between 1-12 hours for each visitor
      const hours = 1 + Math.floor(Math.random() * 12);
      endTime = Date.now() + hours * 3600 * 1000;
      localStorage.setItem(PROMO_KEY, String(endTime));
    }
    const timer = setTimeout(() => setShowPromo(true), 2000);
    const tick = setInterval(() => {
      const diff = Math.max(0, endTime - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setPromoCountdown({ h, m, s });
      if (diff <= 0) clearInterval(tick);
    }, 1000);
    return () => { clearTimeout(timer); clearInterval(tick); };
  }, []);

  // Close currency dropdown on outside click
  useEffect(() => {
    if (!calCurrOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (calCurrRef.current && calCurrRef.current.contains(e.target as Node)) return;
      if (calCurrRef2.current && calCurrRef2.current.contains(e.target as Node)) return;
      setCalCurrOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [calCurrOpen]);

  // Airport picker
  const [picker, setPicker] = useState<PickerTarget>(sv.picker ?? null);
  const [airportQuery, setAirportQuery] = useState('');

  // ----- Multi City state -----
  // Two empty legs by default, matching the original (Flight 1 + Flight 2).
  const todayIso = () => new Date().toISOString().split('T')[0];
  const [mcLegs, setMcLegs] = useState<McLeg[]>(
    Array.isArray(sv.mcLegs) && sv.mcLegs.length >= 2
      ? sv.mcLegs
      : [
          { origin: 'KWI', destination: '', date: '' },
          { origin: '', destination: '', date: '' },
        ]
  );
  // The leg/field currently being edited inside the Multi City modal.
  const [mcEdit, setMcEdit] = useState<McEdit>(sv.mcEdit ?? null);

  useEffect(() => { setPrefLang(lang); }, [lang]);

  // Bottom nav hide on scroll down, show on scroll up
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Persist picker UI state so a page refresh keeps the user on the same
  // screen instead of redirecting back to the home page.
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PICKER_STATE_KEY, JSON.stringify({
          activeTab, picker, mcEdit, mcLegs,
          origin, destination, date, returnDate,
          adults, children, infants, seniors, umnr, duoSeat,
        }));
      }
    } catch { /* ignore */ }
  }, [activeTab, picker, mcEdit, mcLegs, origin, destination, date, returnDate, adults, children, infants, seniors, umnr, duoSeat]);

  // Lock body scroll when picker is open (prevents iOS bounce showing content behind)
  useEffect(() => {
    if (picker) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [picker]);

  // Auto-play banner
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play promo banner (8 images, like original)
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % 8);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play Our Services coverflow (10 services, advances forward, loops)
  useEffect(() => {
    const interval = setInterval(() => {
      setServicesIndex((prev) => (prev + 1) % 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play 'Building Aviation Professionals' carousel (3 cards, advances one card, loops via duplicated track)
  useEffect(() => {
    const interval = setInterval(() => {
      setAviationIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play 'All you need to know' carousel (10 tiles, 5 visible => max index 5)
  useEffect(() => {
    const interval = setInterval(() => {
      setAyntkIndex((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play Popular Destinations carousel (advances one card, loops)
  // 13 destinations, 3 visible => max index 10.
  useEffect(() => {
    const interval = setInterval(() => {
      setDestIndex((prev) => (prev >= 10 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tabKey = (tab: string) =>
    tab === 'One Way' ? 'common.oneWay' : tab === 'Round Trip' ? 'common.roundTrip' : 'common.multiCity';

  // Map the active trip tab to the tripType query param understood by the
  // flight-search results page ('oneway' | 'round' | 'multicity').
  const tripTypeParam = (tab: string) =>
    tab === 'Round Trip' ? 'round' : tab === 'Multi City' ? 'multicity' : 'oneway';

  const totalPax = adults + children + infants + seniors + umnr;

  const goToResults = () => {
    const rt = activeTab === 'Round Trip';
    const ret = rt && returnDate ? `&returnDate=${returnDate}` : '';
    const duo = duoSeat > 0 ? `&duoSeat=${duoSeat}` : '';
    saveRecentSearch(origin, destination, date, totalPax);
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(PICKER_STATE_KEY); } catch { /* ignore */ }
    setLocation(`/flight-search?origin=${origin}&destination=${destination}&date=${date}${ret}&passengers=${totalPax}${duo}&currency=${currency}&tripType=${tripTypeParam(activeTab)}`);
  };

  const handleSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!destination) { setPicker('destination'); setAirportQuery(''); return; }
    goToResults();
  };

  const applyPrefs = () => {
    // Persist the chosen preferences to ALL storage keys in a single, consistent
    // write so every page reads the same language on first paint. We write these
    // synchronously (instead of relying on the context effect) to avoid a race
    // where a stale jzPref/jz_lang value leaks onto the next route.
    try {
      localStorage.setItem('jz_lang', prefLang);
      localStorage.setItem('jzPrevLang', JSON.stringify(prefLang));
      localStorage.setItem('jz_currency', currency);
      // Keep both `currency` (context) and `curr` (legacy/modal) keys in sync.
      localStorage.setItem('jzPref', JSON.stringify({ lang: prefLang, currency, curr: currency }));
    } catch { /* ignore */ }
    // Update the in-memory context so the current page reflects it immediately.
    setLang(prefLang);
    setShowPrefs(false);
  };

  // Airports sorted by the active language's city name.
  const sortedAirports = useMemo(() => {
    return [...cities].sort((a, b) =>
      cityName(a.iata, a.city).localeCompare(cityName(b.iata, b.city), isAr ? 'ar' : 'en'),
    );
  }, [isAr, cityName]);

  const filteredAirports = useMemo(() => {
    const q = airportQuery.trim().toLowerCase();
    if (!q) return sortedAirports;
    return sortedAirports.filter((a) => {
      const en = (AIRPORT_NAMES[a.iata]?.cityEn || a.city).toLowerCase();
      const ar = (AIRPORT_NAMES[a.iata]?.cityAr || '').toLowerCase();
      const country = `${AIRPORT_NAMES[a.iata]?.countryEn || ''} ${AIRPORT_NAMES[a.iata]?.countryAr || ''}`.toLowerCase();
      return en.includes(q) || ar.includes(q) || a.iata.toLowerCase().includes(q) || country.includes(q);
    });
  }, [airportQuery, sortedAirports]);

  // ----- Multi City helpers -----
  const openMultiCity = (_idx = 0, _field: 'origin' | 'destination' = 'origin') => {
    setActiveTab('Multi City');
    setPicker('multicity');
    setAirportQuery('');
    // Open the Multi City leg overview screen first (Flight 1, Flight 2, +Add
    // another flight). The user taps a leg field to start editing, matching the
    // original site flow. Do NOT jump straight into the airport list.
    setMcEdit(null);
  };
  const setLegField = (idx: number, field: keyof McLeg, value: string) => {
    setMcLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };
  const addLeg = () => {
    setMcLegs((prev) => {
      if (prev.length >= 5) return prev;
      // New leg starts from the previous leg's destination, like the original.
      const last = prev[prev.length - 1];
      return [...prev, { origin: last.destination || '', destination: '', date: '' }];
    });
  };
  const removeLeg = (idx: number) => {
    setMcLegs((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)));
  };
  // A leg is "complete" when it has origin + destination + date.
  const mcCompleteLegs = mcLegs.filter((l) => l.origin && l.destination && l.date);
  // No leg should be partially filled (started but missing something).
  const mcNoPartial = mcLegs.every((l) => (!l.origin && !l.destination && !l.date) || (l.origin && l.destination && l.date));
  // Ready to search when at least one complete leg and nothing partial.
  // Empty (untouched) legs are ignored; they get filtered out before building the URL.
  const mcReady = mcCompleteLegs.length >= 1 && mcNoPartial;
  const goToMultiCityResults = () => {
    const segments = mcLegs
      .filter((l) => l.origin && l.destination && l.date)
      .map((l) => `${l.origin}-${l.destination}-${l.date}`)
      .join(',');
    if (!segments) return;
    const duo = duoSeat > 0 ? `&duoSeat=${duoSeat}` : '';
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(PICKER_STATE_KEY); } catch { /* ignore */ }
    setLocation(`/flight-search?tripType=multicity&segments=${segments}&adult=${adults}&child=${children}&infant=${infants}&senior=${seniors}&minor=${umnr}&passengers=${totalPax}${duo}&currency=${currency}`);
  };
  // Pick an airport for the Multi City leg currently being edited, then
  // auto-advance like the original (origin -> destination -> date).
  const pickMcAirport = (iata: string) => {
    if (!mcEdit) return;
    const { idx, field } = mcEdit;
    if (field === 'origin') {
      setLegField(idx, 'origin', iata);
      if (mcLegs[idx].destination === iata) setLegField(idx, 'destination', '');
      setAirportQuery('');
      setMcEdit({ idx, field: 'destination' });
    } else {
      // destination
      if (iata === mcLegs[idx].origin) { setAirportQuery(''); return; }
      setLegField(idx, 'destination', iata);
      setAirportQuery('');
      // Advance to the date picker for this leg, opening at the current month.
      setCalMonth(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
      setMcEdit({ idx, field: 'date' });
    }
  };

  const pickAirport = (iata: string) => {
    if (picker === 'origin') {
      // If user picks the same as destination, clear destination
      if (iata === destination) setDestination('');
      setOrigin(iata);
      setAirportQuery('');
      // Auto-advance to the destination picker (like the original)
      setPicker('destination');
    } else if (picker === 'destination') {
      if (iata === origin) { setAirportQuery(''); return; }
      setDestination(iata);
      setAirportQuery('');
      // Auto-advance to the date/calendar screen (like the original)
      setPicker('date');
    } else {
      setPicker(null);
      setAirportQuery('');
    }
  };

  // ----- Calendar helpers -----
  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const fmtISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monthMatrix = (base: Date) => {
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    // Monday-first offset (JS getDay: 0=Sun..6=Sat)
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  };
  const monthLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectDay = (d: Date) => {
    if (d < todayStart) return;
    const iso = fmtISO(d);
    if (activeTab === 'Round Trip') {
      // Round trip: first click sets depart, second sets return
      if (!date || (returnDate) || iso < date) {
        setDate(iso); setReturnDate('');
      } else if (iso >= date) {
        setReturnDate(iso);
      }
    } else {
      setDate(iso);
    }
  };
  const resetDates = () => { setDate(fmtISO(todayStart)); setReturnDate(''); };
  // Pick a date for the Multi City leg currently being edited, then close the
  // leg editor (the user taps the next field manually, like the original).
  const selectMcDay = (d: Date) => {
    if (d < todayStart || !mcEdit) return;
    const idx = mcEdit.idx;
    setLegField(idx, 'date', fmtISO(d));
    // Auto-advance: if there is a next leg that still needs an origin, jump
    // straight into editing it so the customer keeps flowing without manual
    // taps. Otherwise return to the leg overview.
    const next = mcLegs[idx + 1];
    if (next && !next.origin) {
      setAirportQuery('');
      setMcEdit({ idx: idx + 1, field: 'origin' });
    } else {
      // Last leg date picked: if every leg is complete, auto-open the passenger
      // screen (matches the original). Otherwise return to the leg overview.
      const isLast = idx === mcLegs.length - 1;
      const allComplete = mcLegs.every((l, i) => (i === idx ? (l.origin && l.destination) : (l.origin && l.destination && l.date)));
      setMcEdit(null);
      if (isLast && allComplete) setPicker('pax');
    }
  };
  const monthShift = (n: number) => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const fmtBadge = (iso: string) => { if (!iso) return '-'; const [y, mo, dd] = iso.split('-').map(Number); return `${dd} ${new Date(y, mo - 1, dd).toLocaleDateString('en-US', { month: 'short' })}`; };

  const cityLabel = (iata: string) => {
    const c = cities.find((x) => x.iata === iata);
    return cityName(iata, c?.city || iata);
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF] font-avenir m-0 p-0 overflow-x-hidden" dir={dir}>
      {/* Summer Promo Popup */}
      {showPromo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPromo(false)}>
          <div className="relative bg-white rounded-3xl shadow-2xl mx-4 max-w-sm w-full text-center overflow-hidden" onClick={(e) => e.stopPropagation()} dir="rtl" style={{animation: 'scaleIn 0.3s ease-out'}}>
            {/* Top gradient banner */}
            <div className="bg-gradient-to-br from-[#004A97] to-[#0070C0] pt-8 pb-10 px-6 relative">
              {/* Close button */}
              <button onClick={() => setShowPromo(false)} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 text-sm">✕</button>
              {/* Jazeera Logo */}
              <img src="/jazeera_files/footer-logo.svg" alt="Jazeera Airways" className="mx-auto h-10 mb-4 brightness-0 invert" />
              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-1">خصومات الصيف</h2>
              <p className="text-white/70 text-sm">لفترة محدودة</p>
            </div>
            {/* Content area */}
            <div className="px-6 pb-8 pt-6">
              {/* Discount Badge */}
              <div className="inline-block bg-[#004A97] text-white rounded-full px-6 py-3 mb-6 shadow-lg">
                <span className="text-lg font-bold">خصم 35% على جميع التذاكر</span>
              </div>
              {/* Countdown Timer - Left to Right: Hours Minutes Seconds */}
              <div className="flex items-center justify-center gap-2" dir="ltr">
                <div className="flex flex-col items-center">
                  <div className="bg-[#E8F4FD] text-[#004A97] rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold border border-[#004A97]/20">{String(promoCountdown.h).padStart(2, '0')}</div>
                  <span className="text-xs text-[#004A97]/70 mt-1.5 font-medium">{isAr ? 'ساعات' : 'Hours'}</span>
                </div>
                <span className="text-2xl font-bold text-[#004A97] -mt-5">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-[#E8F4FD] text-[#004A97] rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold border border-[#004A97]/20">{String(promoCountdown.m).padStart(2, '0')}</div>
                  <span className="text-xs text-[#004A97]/70 mt-1.5 font-medium">{isAr ? 'دقائق' : 'Minutes'}</span>
                </div>
                <span className="text-2xl font-bold text-[#004A97] -mt-5">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-[#E8F4FD] text-[#004A97] rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold border border-[#004A97]/20">{String(promoCountdown.s).padStart(2, '0')}</div>
                  <span className="text-xs text-[#004A97]/70 mt-1.5 font-medium">{isAr ? 'ثواني' : 'Seconds'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NO mobile top bar - original site has NO header on mobile, hero goes edge-to-edge from top */}

      {/* Sidebar (Hidden on mobile) - matches original agent-sidebar */}
      <nav
        aria-label="Agent navigation"
        className={`hidden md:flex fixed top-0 bottom-0 z-[1001] flex-col overflow-hidden ${isAr ? 'right-0' : 'left-0'}`}
        style={{
          width: isSidebarExpanded ? '260px' : '80px',
          background: 'rgb(0,74,151)',
          transition: 'width 0.38s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isAr ? 'rgba(0,74,151,0.25) 4px 0px 24px' : 'rgba(0,74,151,0.25) -4px 0px 24px',
        }}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        {/* Edge toggle button - visual match to original agent-sidebar-toggle */}
        <button
          aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          className="hidden md:flex"
          style={{
            position: 'fixed',
            [isAr ? 'right' : 'left']: isSidebarExpanded ? '259px' : '79px',
            top: '44px',
            transform: 'translateY(-50%)',
            zIndex: 1002,
            background: 'rgb(0,74,151)',
            border: 'none',
            borderRadius: isAr ? '8px 0 0 8px' : '0 8px 8px 0',
            padding: '10px 5px',
            cursor: 'pointer',
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isAr ? 'rgba(0,74,151,0.3) -3px 0 10px' : 'rgba(0,74,151,0.3) 3px 0 10px',
            transition: 'left 0.65s cubic-bezier(0.34,1.56,0.64,1), right 0.65s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: (isSidebarExpanded ? (isAr ? 'none' : 'scaleX(-1)') : (isAr ? 'scaleX(-1)' : 'none')) }}><path d="m9 18 6-6-6-6" /></svg>
        </button>
        {/* Logo - swaps between compact mark and full wordmark */}
        <div className="relative w-full flex items-center justify-center shrink-0 cursor-pointer" style={{ height: '72px' }} onClick={() => { setPicker(null); setLocation('/'); }}>
          <span className="absolute inset-0 flex items-center justify-center" style={{ opacity: isSidebarExpanded ? 0 : 1, transition: 'opacity 0.26s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none' }}>
            <span className="flex items-center justify-center" style={{ background: 'rgb(0,74,151)', width: '34px', height: '34px', borderRadius: '6px' }}>
              <img alt="Jazeera Airways" src="/jazeera_files/web_nav-en" width={34} height={34} style={{ objectFit: 'contain', borderRadius: '10px' }} />
            </span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgb(0,74,151)', padding: '12px 16px', boxSizing: 'border-box', opacity: isSidebarExpanded ? 1 : 0, transition: 'opacity 0.26s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none' }}>
            <img alt="Jazeera Airways" src="/jazeera_files/Jazeera_sidebar_logo" height={40} style={{ objectFit: 'contain', width: '100%', height: '40px' }} />
          </span>
        </div>

        <div className="flex flex-col w-full mt-2 flex-1" style={{ paddingInline: isSidebarExpanded ? '12px' : '0', transition: 'padding 0.38s cubic-bezier(0.4,0,0.2,1)' }}>
          {[
            { icon: 'B2C_flight.svg', en: t('side.book'), title: 'Book', sub: ['Flight'] },
            { icon: 'B2C_Manage.svg', en: t('side.manage'), title: 'Manage', sub: ['Manage Booking', 'Check-in', 'Flight Status'] },
            { icon: 'B2C_Mytrips.svg', en: t('side.myTrips'), title: 'My-trips', sub: [] },
            { icon: 'B2C_Service.svg', en: t('side.addons'), title: 'Add-ons & Service', sub: ['Seat & Priority', 'Baggage Upgrades', 'At the Airport', 'Services', 'Travel Extras'] },
            { icon: 'airplane_ticket.svg', en: t('side.planTrip'), title: 'Plan Trip', sub: ['Summer Destinations', 'Where we Fly', 'Baggage Allowance', 'Visa Information', 'Travelling With Pets', 'Unaccompanied Minors', 'Fare Options'] },
            { icon: 'B2C_Deals.svg', en: t('side.deals'), title: 'Deals', sub: ['Deals', 'Student Offers'] },
            { icon: 'B2C_Help.svg', en: t('side.needHelp'), title: 'Need Help?', sub: ['FAQ', 'Contact Us'] },
          ].map((item, i) => (
            <div key={i} className="relative" onMouseEnter={(e) => { setHoveredNav(item.title); setFlyoutTop(e.currentTarget.getBoundingClientRect().top); }} onMouseLeave={() => setHoveredNav(null)}>
              <button
                onClick={() => { window.location.href = '/'; }}
                title={item.title}
                aria-label={item.title}
                className="w-full flex items-center group"
                style={{ gap: isSidebarExpanded ? '12px' : '0', paddingTop: '10px', paddingBottom: '10px', paddingInline: isSidebarExpanded ? '12px' : '0', margin: '2px 0px', borderRadius: '16px', background: (isSidebarExpanded && hoveredNav === item.title) ? 'rgba(0,29,61,0.25)' : 'transparent', justifyContent: isSidebarExpanded ? 'flex-start' : 'center', transition: 'background 0.18s' }}
              >
                <span className="flex items-center justify-center shrink-0" style={{ width: '32px', height: '32px', borderRadius: '12px', background: 'rgba(0,29,61,0.35)', opacity: 0.9 }}>
                  <img alt="" src={`/jazeera_files/${item.icon}`} width={20} height={20} style={{ objectFit: 'contain', display: 'block' }} />
                </span>
                {isSidebarExpanded && (
                  <span
                    className="text-white whitespace-nowrap text-[15px] font-medium"
                    style={{ flex: '1 1 0%', textAlign: isAr ? 'right' : 'left', opacity: 0.95, overflow: 'hidden', pointerEvents: 'none' }}
                  >
                    {item.en}
                  </span>
                )}
                {isSidebarExpanded && item.sub.length > 0 && (
                  <span className="shrink-0 flex items-center" style={{ color: '#fff', opacity: 0.5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAr ? 'scaleX(-1)' : 'none' }}><path d="m9 18 6-6-6-6" /></svg>
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom language / currency selector */}
        <div className="shrink-0">
          <div
            onClick={() => { setPrefLang(lang); setShowPrefs(true); }}
            className="flex items-center cursor-pointer"
            style={{ gap: isSidebarExpanded ? '8px' : '0', padding: '10px 0 14px', justifyContent: isSidebarExpanded ? 'flex-start' : 'center', paddingInline: isSidebarExpanded ? '16px' : '0' }}
          >
            <span className="flex items-center justify-center shrink-0 overflow-hidden" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,29,61,0.35)' }}>
              <img alt={currency} src="/jazeera_files/kw.jpg" width={22} height={22} style={{ objectFit: 'cover', borderRadius: '50%' }} />
            </span>
            <span className="text-white whitespace-nowrap text-[14px] font-medium" style={{ flex: isSidebarExpanded ? '1 1 0%' : '0 0 0px', textAlign: isAr ? 'right' : 'left', opacity: isSidebarExpanded ? 0.9 : 0, width: isSidebarExpanded ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.26s' }}>
              {currency} | {isAr ? 'ع' : 'en'}
            </span>
            <span className="shrink-0 flex items-center" style={{ color: '#fff', opacity: isSidebarExpanded ? 0.5 : 0, width: isSidebarExpanded ? 'auto' : 0, overflow: 'hidden', transition: 'opacity 0.26s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </div>
        </div>
      </nav>

      {/* Flyout submenu (fixed, outside clipped nav so it never gets cut off) */}
      {(() => {
        const subMap: Record<string, string[]> = {
          'Book': ['Flight'],
          'Manage': ['Manage Booking', 'Check-in', 'Flight Status'],
          'Add-ons & Service': ['Seat & Priority', 'Baggage Upgrades', 'At the Airport', 'Services', 'Travel Extras'],
          'Plan Trip': ['Summer Destinations', 'Where we Fly', 'Baggage Allowance', 'Visa Information', 'Travelling With Pets', 'Unaccompanied Minors', 'Fare Options'],
          'Deals': ['Deals', 'Student Offers'],
          'Need Help?': ['FAQ', 'Contact Us'],
        };
        const subs = hoveredNav ? subMap[hoveredNav] : undefined;
        if (!isSidebarExpanded || !hoveredNav || !subs) return null;
        return (
          <div
            role="menu"
            className="hidden md:block fixed"
            onMouseEnter={() => setHoveredNav(hoveredNav)}
            onMouseLeave={() => setHoveredNav(null)}
            style={{ top: `${flyoutTop}px`, [isAr ? 'right' : 'left']: '260px', minWidth: '220px', background: 'rgb(0,53,128)', borderRadius: isAr ? '12px 0 0 12px' : '0 12px 12px 0', boxShadow: isAr ? 'rgba(0,0,0,0.45) -12px 8px 36px 0' : 'rgba(0,0,0,0.45) 12px 8px 36px 0', padding: '6px 0', zIndex: 2000 }}
          >
            {subs.map((s, si) => (
              <button
                key={si}
                role="menuitem"
                onClick={() => { window.location.href = '/'; }}
                className="w-full flex items-center"
                style={{ padding: '13px 20px', background: 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,29,61,0.45)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 400, whiteSpace: 'nowrap', flex: '1 1 0%', textAlign: isAr ? 'right' : 'left', opacity: 0.92 }}>{s}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Main Content */}
      <div className={`w-full md:w-[calc(100%-80px)] relative ${isAr ? 'md:mr-[80px]' : 'md:ml-[80px]'}`}>
        {/* Mobile Header (matches original: dark blue bg, white logo left, KWD pill + hamburger right) */}
        <div className="md:hidden bg-[#004a97] w-full h-16 flex items-center justify-between px-4 sticky top-0 z-[9999]">
          <div className="flex items-center">
            <img src="/jazeera_files/J920_Logo.svg" alt="Jazeera Airways 20 Years" className={`h-[50px] w-[200px] object-contain brightness-0 invert ${isAr ? 'object-right' : 'object-left'}`} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPrefs(true)} className="flex items-center gap-1.5 border border-white/40 rounded-full px-3 py-1.5 bg-white/10">
              <img src="/jazeera_files/kw.jpg" alt="Kuwait" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-sm font-medium text-white">{currency}</span>
            </button>
            <button className="text-white p-1" aria-label="Menu" onClick={() => setMobileMenuOpen(true)}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Desktop Header (Login button) */}
        <header className="hidden md:flex absolute top-8 z-30 items-center p-0" style={{ [isAr ? 'left' : 'right']: '90px' }}>
          <button
            className="group w-auto shadow-lg rounded-2xl backdrop-blur-sm transition-all duration-300 flex flex-row items-center px-3 py-2 gap-2 hover:scale-105"
            style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, rgb(0,74,151), rgb(134,193,255)) border-box', border: '2px solid transparent' }}
          >
            <div className="min-w-0 overflow-hidden flex items-center text-sm lg:text-base text-[#004A97]">
              <span className="font-extrabold tracking-tight block max-w-[96px] truncate" dir="ltr">{t('common.login')}</span>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9">
              <img alt="account" className="w-5 h-5 lg:w-6 lg:h-6 object-contain" src="/jazeera_files/account_circle.png" />
            </div>
          </button>
        </header>

        {/* Hero Banner (matches original: carousel with mobile/desktop images) */}
        <div className="relative w-full min-h-[260px] sm:min-h-[360px] lg:min-h-[580px] overflow-hidden bg-[#F0F8FF] cursor-pointer">
          <div className="absolute inset-0 overflow-hidden">
            {/* Slide 1 - currently visible based on bannerIndex */}
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${bannerIndex === 0 ? 'opacity-100' : 'opacity-0'}`}>
              {/* Mobile image */}
              <div className="lg:hidden absolute inset-0">
                <img src="/jazeera_files/Summer_MOB_EN.jpg" alt="Summer Sale" style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'cover', opacity: 0.9 }} />
              </div>
              {/* Desktop image */}
              <div className="hidden lg:block absolute inset-0">
                <img src="/jazeera_files/Summer_WEB_EN" alt="Summer Sale" style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'cover', opacity: 0.95 }} />
              </div>
            </div>
            {/* Slide 2 */}
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${bannerIndex === 1 ? 'opacity-100' : 'opacity-0'}`}>
              {/* Mobile image */}
              <div className="lg:hidden absolute inset-0">
                <img src="/jazeera_files/Banner_Kuwait_MOB_EN.jpg" alt="Kuwait" style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'cover', opacity: 0.9 }} />
              </div>
              {/* Desktop image */}
              <div className="hidden lg:block absolute inset-0">
                <img src={isAr ? "/jazeera_files/Thankyou_Hero_AR_v3.png" : "/jazeera_files/Thankyou_Hero_EN_v3.png"} alt="Thank You" style={{ position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'cover', opacity: 0.95 }} />
              </div>
            </div>
          </div>

          {/* Banner Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                aria-label={`Go to banner ${idx + 1}`}
                onClick={() => setBannerIndex(idx)}
                className={`h-2 rounded-full transition-all ${bannerIndex === idx ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
              />
            ))}
          </div>
        </div>

        {/* Search Widget */}
        <div className="relative z-30 -mt-10 sm:-mt-28 lg:-mt-44 mx-auto max-w-[1200px] px-4">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0px_2px_11px_rgba(0,74,151,0.15)] p-4 md:p-8 flex flex-col">
            {/* Mobile layout (matches original exactly) */}
            <div className="md:hidden flex flex-col">
              {/* Tabs row - full width, equal size */}
              <div className="flex items-center gap-2 mb-5">
                {['One Way', 'Round Trip', 'Multi City'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 h-[42px] flex items-center justify-center rounded-full text-[14px] font-medium tracking-[-0.03em] transition-all border ${
                      activeTab === tab
                        ? 'bg-[#e7f3fb] border-[#41b4e6] text-[#004A97]'
                        : 'border-[#d1d5db] text-[#001326]'
                    }`}
                  >
                    {t(tabKey(tab))}
                  </button>
                ))}
              </div>

              {/* From row - no background, no border, just icon + text + divider below */}
              <button
                type="button"
                onClick={() => { if (activeTab === 'Multi City') { openMultiCity(0, 'origin'); } else { setPicker('origin'); setAirportQuery(''); } }}
                className="w-full flex items-center gap-3 py-3 cursor-pointer text-start"
              >
                <div className="h-10 w-10 rounded-full bg-[#e7f3fb] flex items-center justify-center shrink-0">
                  <img src="/jazeera_files/Plane - take off_darkblue.svg" alt="Departure" className="h-5 w-5 object-contain" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[20px] font-extrabold tracking-[-0.03em] text-black">{cityLabel(origin)}</span>
                  <span className="text-[16px] font-medium tracking-[-0.03em] text-[#555659]">{origin}</span>
                </div>
              </button>
              <div className="w-full h-[1px] bg-[#e0e0e0] ml-[52px]" style={{ width: 'calc(100% - 52px)' }} />

              {/* To row - no background, no border, just icon + text + divider below */}
              <button
                type="button"
                onClick={() => { if (activeTab === 'Multi City') { openMultiCity(0, 'destination'); } else { setPicker('destination'); setAirportQuery(''); } }}
                className="w-full flex items-center gap-3 py-3 cursor-pointer text-start"
              >
                <div className="h-10 w-10 rounded-full bg-[#e7f3fb] flex items-center justify-center shrink-0">
                  <img src="/jazeera_files/Plane - Landing_darkblue.svg" alt="Destination" className="h-5 w-5 object-contain" />
                </div>
                <div className="flex items-baseline gap-2">
                  {destination ? (
                    <>
                      <span className="text-[20px] font-extrabold tracking-[-0.03em] text-black">{cityLabel(destination)}</span>
                      <span className="text-[16px] font-medium tracking-[-0.03em] text-[#555659]">{destination}</span>
                    </>
                  ) : (
                    <span className="text-[18px] font-medium tracking-[-0.03em] text-[#999]">To</span>
                  )}
                </div>
              </button>
              <div className="w-full h-[1px] bg-[#e0e0e0] ml-[52px] mb-4" style={{ width: 'calc(100% - 52px)' }} />

              {/* Special Discount - at bottom, full width with border */}
              <div className="flex items-center justify-center gap-2 text-[14px] font-extrabold tracking-[-0.03em] text-[#004A97] cursor-pointer border border-[#41b4e6] rounded-full px-4 py-3 w-full">
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0068ce] to-[#004c97] flex items-center justify-center shadow-[0px_3px_8px_rgba(0,74,151,0.28)] shrink-0">
                  <img src="/jazeera_files/promoCode.svg" alt="promo" className="w-3.5 h-3.5 brightness-0 invert" />
                </span>
                <span>{t('home.specialDiscount')}</span>
                <span className="text-[#41b4e6] mx-1">|</span>
                <span className="font-medium text-[#004A97]">Senior Citizen</span>
              </div>
            </div>

            {/* Desktop layout (unchanged) */}
            <div className="hidden md:flex flex-col gap-5">
              <div className="flex flex-col gap-3 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {['One Way', 'Round Trip', 'Multi City'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`h-[38px] flex items-center justify-center rounded-full py-2 px-4 text-[16px] font-medium tracking-[-0.03em] transition-all border ${
                          activeTab === tab
                            ? 'bg-[#e7f3fb] border-[#41b4e6] text-[#004A97]'
                            : 'border-[#d1d5db] text-[#001326] hover:bg-gray-50'
                        }`}
                      >
                        {t(tabKey(tab))}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[16px] font-extrabold tracking-[-0.03em] text-[#004A97] cursor-pointer border border-[#41b4e6] rounded-full px-3 py-2 w-fit">
                    <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#0068ce] to-[#004c97] flex items-center justify-center shadow-[0px_3px_8px_rgba(0,74,151,0.28)] shrink-0">
                      <img src="/jazeera_files/promoCode.svg" alt="promo" className="w-3.5 h-3.5 brightness-0 invert" />
                    </span>
                    <span>{t('home.specialDiscount')}</span>
                    <span className="font-medium text-[#004A97]">Senior Citizen</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center gap-[30px]">
                <button
                  type="button"
                  onClick={() => { if (activeTab === 'Multi City') { openMultiCity(0, 'origin'); } else { setPicker('origin'); setAirportQuery(''); } }}
                  className="h-[98px] flex-1 min-w-0 rounded-2xl bg-[#e7f3fb] border border-[#41b4e6] box-border overflow-hidden flex items-center py-2.5 px-6 gap-4 cursor-pointer hover:bg-blue-50 transition-colors text-start"
                >
                  <img src="/jazeera_files/Plane - take off_darkblue.svg" alt="Departure" className="h-10 w-10 object-contain shrink-0" />
                  <div className="flex flex-col items-start min-w-0">
                    <div className="text-[16px] tracking-[-0.03em] leading-[1.2] text-[#555659]">{t('common.from')}</div>
                    <div className="flex items-baseline gap-2 text-[32px] leading-[1.1] text-black truncate">
                      <span className="font-extrabold tracking-[-0.03em]">{cityLabel(origin)}</span>
                      <span className="text-[24px] font-medium tracking-[-0.03em]">{origin}</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { const o = origin; setOrigin(destination); setDestination(o); }}
                  className="h-[74px] w-[74px] shrink-0 -mx-[37px] z-10 hover:scale-110 transition-transform"
                >
                  <img src="/jazeera_files/swapIcon.svg" alt="Swap" className="h-full w-full object-contain" />
                </button>

                <button
                  type="button"
                  onClick={() => { if (activeTab === 'Multi City') { openMultiCity(0, 'destination'); } else { setPicker('destination'); setAirportQuery(''); } }}
                  className="h-[98px] flex-1 min-w-0 rounded-2xl bg-white border border-[#41b4e6] box-border overflow-hidden flex items-center py-2.5 px-6 gap-4 cursor-pointer hover:bg-blue-50 transition-colors text-start"
                >
                  <img src="/jazeera_files/Plane - Landing_darkblue.svg" alt="Destination" className="h-10 w-10 object-contain shrink-0" />
                  <div className="flex flex-col items-start min-w-0">
                    {destination ? (
                      <>
                        <div className="text-[16px] tracking-[-0.03em] leading-[1.2] text-[#555659]">{t('common.to')}</div>
                        <div className="flex items-baseline gap-2 text-[32px] leading-[1.1] text-black truncate">
                          <span className="font-extrabold tracking-[-0.03em]">{cityLabel(destination)}</span>
                          <span className="text-[24px] font-medium tracking-[-0.03em]">{destination}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[16px] tracking-[-0.03em] leading-[1.2] text-[#555659]">{t('common.to')}</div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="max-w-[1200px] mx-auto px-4 mt-8">
            <h2 className={`text-xl md:text-2xl font-medium text-[#004A97] mb-4 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'عمليات البحث الأخيرة' : 'Recent Searches'}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {recentSearches.map((s, i) => {
                const destCity = cityName(s.destination, s.destination);
                const originCity = cityName(s.origin, s.origin);
                const fmtDate = s.date ? new Date(s.date).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' }) : '';
                return (
                  <div
                    key={i}
                    onClick={() => { setOrigin(s.origin); setDestination(s.destination); setDate(s.date); goToResults(); }}
                    className="flex items-center gap-3 bg-white rounded-2xl shadow-[0px_2px_11px_rgba(0,74,151,0.1)] px-4 py-3 min-w-[220px] cursor-pointer hover:shadow-md transition-shadow shrink-0"
                  >
                    <img
                      src={`/airports/${s.destination}.jpg`}
                      alt={destCity}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#dbe7f5]"
                      onError={(e) => { const img = e.currentTarget; img.onerror = null; img.src = '/airports/KWI.jpg'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#001326] truncate">{destCity} {isAr ? 'إلى' : 'to'} {originCity}</div>
                      <div className="flex items-center gap-2 text-xs text-[#555659] mt-1">
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>{fmtDate}</span>
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>{s.pax}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notification Bar */}
        <div className="max-w-[1200px] mx-auto px-4 mt-12 lg:mt-16">
          <div className="relative shadow-[0px_2px_11px_rgba(0,74,151,0.15)] rounded-2xl bg-[#004a97] overflow-hidden flex items-center justify-between py-4 px-6 text-center text-sm text-white font-sans w-full">
            <button className="hidden md:block w-4 shrink-0 p-1 hover:bg-white/20 rounded-full"><img src="/jazeera_files/arrow_back.svg" className="w-4 h-4 filter brightness-0 invert" /></button>
            <div className="relative flex-1 md:mx-6 overflow-hidden">
              <p className="font-avenir text-[14px] leading-[14px] font-medium tracking-[-0.03em] text-center">
                {t('home.notice')} <span className="font-extrabold underline cursor-pointer">{t('home.readMore')}</span>
              </p>
            </div>
            <button className="hidden md:block w-4 shrink-0 p-1 hover:bg-white/20 rounded-full"><img src="/jazeera_files/arrow_front.svg" className="w-4 h-4 filter brightness-0 invert" /></button>
          </div>
        </div>

        {/* Promo Banner Carousel (Budapest etc.) */}
        <div className="max-w-[1200px] mx-auto px-4 mt-6 md:mt-12">
          {(() => {
            const promoBase = isAr
              ? ['Budapest_AR','Krakow_AR','Prague_AR','Tivat_AR','Luton_AR','Priority_Service_AR_Web-1','Seats-offers-1','J-Cafe-AR']
              : ['Budapest_EN','Krakow_EN','Prague_EN','Tivat_EN','Luton_EN','Priority-Service-offer-1','Seats-offers-1','J-Cafe-1-1'];
            const pn = promoBase.length;
            return (
              <div className="relative rounded-2xl overflow-hidden" onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }} onTouchEnd={(e) => { const startX = (e.currentTarget as any)._touchX; if (startX !== undefined) { const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) { if (diff > 0) setPromoIndex((promoIndex + 1) % pn); else setPromoIndex((promoIndex - 1 + pn) % pn); } } }} onMouseDown={(e) => { (e.currentTarget as any)._mouseX = e.clientX; }} onMouseUp={(e) => { const startX = (e.currentTarget as any)._mouseX; if (startX !== undefined) { const diff = startX - e.clientX; if (Math.abs(diff) > 50) { if (diff > 0) setPromoIndex((promoIndex + 1) % pn); else setPromoIndex((promoIndex - 1 + pn) % pn); (e.currentTarget as any)._dragged = true; } else { (e.currentTarget as any)._dragged = false; } } }}>
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(${isAr ? '' : '-'}${promoIndex * 100}%)` }}
                >
                  {promoBase.map((img, i) => {
                    const promoLinks = ['/destinations/budapest','/destinations/krakow','/destinations/prague','/destinations/tivat','/destinations/london-luton','/services/priority-service','/info/seats-offers','/info/j-cafe'];
                    return (
                      <div
                        key={i}
                        className="w-full flex-shrink-0 cursor-pointer"
                        onClick={(e) => { const parent = e.currentTarget.closest('.relative') as any; if (parent && parent._dragged) { parent._dragged = false; return; } setLocation(promoLinks[i]); }}
                      >
                        <img
                          src={`/jazeera_files/${img}`}
                          alt="Promotion"
                          className="w-full object-cover pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPromoIndex((promoIndex - 1 + pn) % pn)}
                  className="hidden"
                  aria-label="Previous"
                >‹</button>
                <button
                  onClick={() => setPromoIndex((promoIndex + 1) % pn)}
                  className="hidden"
                  aria-label="Next"
                >›</button>
                <div className={`absolute bottom-4 flex gap-2 ${isAr ? 'left-6' : 'right-6'}`}>
                  {promoBase.map((_, i) => (
                    <button key={i} onClick={() => setPromoIndex(i)} className={`h-2 rounded-full transition-all ${promoIndex===i ? 'bg-white w-6' : 'bg-white/50 w-2'}`} aria-label={`Go to banner ${i+1}`} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>



        {/* Destinations Section */}
        <div className="max-w-[1200px] mx-auto px-4 mt-16 mb-20">
          {(() => {
            const destinations = [
              { en: t('dest.dubai'), tag: t('dest.cityBreak'), img: 'Dubai-web', to: 'DXB' },
              { en: t('dest.cairo'), tag: t('dest.culturalHeritage'), img: 'Cairo-web', to: 'CAI' },
              { en: t('dest.kochi'), tag: t('dest.coastalEscape'), img: 'Kochi-web', to: 'COK' },
              { en: t('dest.istanbul'), tag: t('dest.culturalHeritage'), img: 'Istanbul-web', to: 'IST' },
              { en: t('dest.jeddah'), tag: t('dest.coastalEscape'), img: 'Jeddah-web', to: 'JED' },
              { en: t('dest.delhi'), tag: t('dest.culturalHeritage'), img: 'Delhi_-web', to: 'DEL' },
              { en: t('dest.kuwait'), tag: t('dest.cityBreak'), img: 'Kuwait-web', to: 'KWI' },
              { en: t('dest.tehran'), tag: t('dest.cityBreak'), img: 'Tehran-web', to: 'THR' },
              { en: t('dest.luxor'), tag: t('dest.culturalHeritage'), img: 'Luxor-web', to: 'LXR' },
              { en: t('dest.sohag'), tag: t('dest.culturalHeritage'), img: 'Sohag-web', to: 'HMB' },
              { en: t('dest.assiut'), tag: t('dest.culturalHeritage'), img: 'Assiut-web', to: 'ATZ' },
              { en: t('dest.damascus'), tag: t('dest.culturalHeritage'), img: 'Damascus-web', to: 'DAM' },
              { en: t('dest.colombo'), tag: t('dest.coastalEscape'), img: 'Colombo-web', to: 'CMB' },
            ];
            const dn = destinations.length;
            // Desktop: 3 visible, Mobile: 1 visible
            const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
            const visibleCount = isMob ? 1 : 3;
            const maxDestIdx = Math.max(0, dn - visibleCount);
            const di = Math.min(destIndex, maxDestIdx);
            const sign = isAr ? 1 : -1;
            // Mobile: translate by 100% per card; Desktop: translate by (1/3 of container + gap)
            const mobileOffset = `calc(${sign * di} * (100% + 16px))`;
            const desktopOffset = `calc(${sign * di} * ((100% - 48px) / 3 + 24px))`;
            return (
              <>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-3xl md:text-4xl font-medium text-[#004A97]">{t('home.popularDestinations')}</h2>
                  <div className="hidden md:flex items-center gap-4">
                    <button className="font-bold text-[#001326] hover:text-[#004A97]">{t('home.viewMore')}</button>
                    <div className="flex gap-2">
                      <button onClick={() => setDestIndex(Math.max(0, di - 1))} className={`w-8 h-8 rounded-full bg-[#004A97] flex items-center justify-center hover:bg-[#003875] transition-all ${di === 0 ? 'opacity-40' : ''}`} aria-label="Previous destinations">
                        <img src="/jazeera_files/arrow_back.svg" className="w-4 h-4 filter brightness-0 invert" />
                      </button>
                      <button onClick={() => setDestIndex(Math.min(maxDestIdx, di + 1))} className={`w-8 h-8 rounded-full bg-[#004A97] flex items-center justify-center hover:bg-[#003875] transition-all ${di >= maxDestIdx ? 'opacity-40' : ''}`} aria-label="Next destinations">
                        <img src="/jazeera_files/arrow_front.svg" className="w-4 h-4 filter brightness-0 invert" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden" onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }} onTouchEnd={(e) => { const startX = (e.currentTarget as any)._touchX; if (startX !== undefined) { const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) { if (diff > 0) setDestIndex(Math.min(maxDestIdx, di + 1)); else setDestIndex(Math.max(0, di - 1)); } } }}>
                  <div
                    className="flex gap-4 md:gap-6 transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(var(--dest-offset))`, ['--dest-offset' as any]: isMob ? mobileOffset : desktopOffset }}
                  >
                    {destinations.map((dest, i) => (
                      <div
                        key={i}
                        onClick={() => { const destSlugMap: Record<string, string> = { DXB: 'dubai', CAI: 'cairo', COK: 'kochi', IST: 'istanbul', JED: 'jeddah', DEL: 'delhi', KWI: 'kuwait', THR: 'tehran', LXR: 'luxor', HMB: 'sohag', ATZ: 'assiut', DAM: 'damascus', CMB: 'colombo' }; const slug = destSlugMap[dest.to]; if (slug && slug !== 'kuwait') setLocation(`/destinations/${slug}`); else { setDestination(dest.to); setLocation(`/flight-search?from=${origin}&to=${dest.to}&date=${date}&pax=${passengers}`); } }}
                        className="w-[calc(100%-0px)] md:w-[calc((100%-48px)/3)] flex-shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer"
                        style={{ height: 'clamp(380px, 55vw, 437px)' }}
                      >
                        <img src={`/jazeera_files/${dest.img}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                        <div className={`absolute bottom-6 flex flex-col gap-2 text-white ${isAr ? 'right-6 items-end text-right' : 'left-6 items-start'}`}>
                          <div className="rounded-full bg-white/90 text-[#001326] text-sm py-2 px-4 w-fit">{dest.tag}</div>
                          <h3 className="text-[28px] md:text-[32px] leading-none font-normal">{dest.en}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mobile dots */}
                <div className="md:hidden flex items-center justify-center gap-1.5 mt-4">
                  {destinations.map((_, i) => (
                    <button key={i} onClick={() => setDestIndex(i)} className="rounded-full transition-all duration-300" style={{ width: di === i ? '20px' : '8px', height: '8px', background: di === i ? '#004a97' : 'rgba(0,74,151,0.3)' }} aria-label={`Go to destination ${i+1}`} />
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* All you need to know (white container, centered title) */}
        <div className="max-w-[1200px] mx-auto px-4 mt-16 mb-20">
          <div className="bg-white rounded-2xl shadow-[0px_2px_11px_rgba(0,74,151,0.12)] p-6 md:p-8">
            {(() => {
              const tiles = [
                { label: t('ayntk.visa'), img: 'Visa-Information-1' },
                { label: t('ayntk.baggage'), img: 'Baggage-Allowance' },
                { label: t('ayntk.cfar'), img: 'CFAR-icon' },
                { label: t('ayntk.wheelchair'), img: 'Wheelchair-Assistance-icon' },
                { label: t('ayntk.carParking'), img: 'Car-Parking-1' },
                { label: t('ayntk.terminal'), img: 'J9-Terminal-1' },
                { label: t('ayntk.faqs'), img: 'FAQs-1' },
                { label: t('ayntk.careers'), img: 'Career-1' },
                { label: t('ayntk.travelPets'), img: 'Travel-with-Pets-1' },
                { label: t('ayntk.meetGreet'), img: 'Meet-Greet-icon' },
              ];
              const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
              // Mobile: 2.5 visible (shows 2 full + half of 3rd); Desktop: 5
              const visible = isMobileView ? 2.5 : 5;
              const maxIdx = Math.max(0, Math.ceil(tiles.length - visible));
              const ai = Math.min(ayntkIndex, maxIdx);
              const dir = isAr ? 1 : -1;
              return (
                <>
                  <div className="flex items-center justify-between relative mb-6">
                    <h2 className="text-2xl md:text-[40px] font-medium text-[#004A97] tracking-[-0.03em]">{t('home.allYouNeed')}</h2>
                    {/* Arrows only on desktop */}
                    <div className="hidden md:flex items-center gap-3">
                      <button onClick={() => setAyntkIndex((p) => (p <= 0 ? maxIdx : p - 1))} className="h-8 w-8 rounded-full flex items-center justify-center bg-[#004A97] hover:bg-[#003581] hover:scale-110 transition-all duration-200" aria-label="Previous">
                        <img alt="" className="h-4 w-4 filter brightness-0 invert" src="/jazeera_files/arrow_back.svg" />
                      </button>
                      <button onClick={() => setAyntkIndex((p) => (p >= maxIdx ? 0 : p + 1))} className="h-8 w-8 rounded-full flex items-center justify-center bg-[#004A97] hover:bg-[#003581] hover:scale-110 transition-all duration-200" aria-label="Next">
                        <img alt="" className="h-4 w-4 filter brightness-0 invert" src="/jazeera_files/arrow_front.svg" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full max-w-5xl mx-auto overflow-hidden" onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }} onTouchEnd={(e) => { const startX = (e.currentTarget as any)._touchX; if (startX !== undefined) { const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 40) { if (diff > 0) setAyntkIndex((p) => Math.min(maxIdx, p + 1)); else setAyntkIndex((p) => Math.max(0, p - 1)); } } }}>
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(calc(${dir} * ${ai} * (100% / ${visible})))` }}
                    >
                      {tiles.map((c, i) => {
                        const tileLinks = ['/info/visa-information','/info/baggage-allowance','/services/cancel-for-any-reason','/services/wheelchair-assistance','/services/car-parking','/info/jazeera-terminal','/info/faqs','/info/careers','/services/travel-with-pets','/services/hayakom-service'];
                        return (
                          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3 px-1 md:px-2 cursor-pointer" style={{ width: `calc(100% / ${visible})` }} onClick={() => setLocation(tileLinks[i])}>
                            <div className="transition-all duration-300 hover:scale-105">
                              <img className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] lg:w-[170px] lg:h-[170px] max-w-full object-contain transition-all duration-300" alt={c.label} loading="lazy" src={`/jazeera_files/${c.img}`} />
                            </div>
                            <div className="text-[13px] md:text-[14px] lg:text-[18px] font-medium leading-tight tracking-[-0.03em] text-center text-black min-h-[2.5rem] flex items-center justify-center">{c.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Mobile dots */}
                  <div className="md:hidden flex items-center justify-center gap-1.5 mt-4">
                    {Array.from({ length: maxIdx + 1 }).map((_, i) => (
                      <button key={i} onClick={() => setAyntkIndex(i)} className="rounded-full transition-all duration-300" style={{ width: ai === i ? '18px' : '8px', height: '8px', background: ai === i ? '#004a97' : 'rgba(0,74,151,0.3)' }} aria-label={`Page ${i+1}`} />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Our Services */}
        <SilentErrorBoundary>
        <div className="max-w-[1200px] mx-auto px-4 mt-16 mb-20">
          <h2 className="text-3xl md:text-4xl font-medium text-[#004A97] mb-8 text-center">{t('home.ourServices')}</h2>
          {(() => {
            const services = [
              { title: t('svc.priority'), desc: t('svc.priorityDesc'), img: 'priority-service-2' },
              { title: t('svc.cfar'), desc: t('svc.cfarDesc'), img: 'CFAR' },
              { title: t('svc.animals'), desc: t('svc.animalsDesc'), img: 'TravellingWithAnimals' },
              { title: t('svc.carpark'), desc: t('svc.carparkDesc'), img: 'Carpark' },
              { title: t('svc.hayakom'), desc: t('svc.hayakomDesc'), img: 'hayakomservice_meetassistand' },
              { title: t('svc.wheelchair'), desc: t('svc.wheelchairDesc'), img: 'wheelchairassistance_fullassistance' },
              { title: t('svc.um'), desc: t('svc.umDesc'), img: 'UM' },
              { title: t('svc.earlyCheckin'), desc: t('svc.earlyCheckinDesc'), img: 'earlycheckin_aboutearlycheckin' },
              { title: t('svc.disruption'), desc: t('svc.disruptionDesc'), img: 'DisruptionAssistance' },
              { title: t('svc.crossAirline'), desc: t('svc.crossAirlineDesc'), img: 'CrossAirlineBaggage' },
            ];
            const n = services.length;
            const dir = isAr ? -1 : 1;
            const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
            const DUR = '300ms';
            return (
              <div className="relative" aria-label="Services carousel">
                <div
                  className="relative grid place-items-center"
                  style={{ perspective: '1200px', height: 'clamp(320px, 65vw, 400px)', overflow: 'visible', ['--stepX' as any]: 'clamp(140px, 28vw, 240px)' }}
                  onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
                  onTouchEnd={(e) => { const startX = (e.currentTarget as any)._touchX; if (startX !== undefined) { const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) { if (diff > 0) setServicesIndex((servicesIndex + 1) % n); else setServicesIndex((servicesIndex - 1 + n) % n); } } }}
                >
                  {services.map((s, i) => {
                    let off = i - servicesIndex;
                    if (off > n / 2) off -= n;
                    if (off < -n / 2) off += n;
                    const abs = Math.abs(off);
                    const isCenter = off === 0;
                    // Match original coverflow per-offset values exactly
                    let scale: number, translateZ: number, opacity: number;
                    if (abs === 0) { scale = 1; translateZ = 0; opacity = 1; }
                    else if (abs === 1) { scale = 0.8333; translateZ = -100; opacity = 0.9; }
                    else if (abs === 2) { scale = 0.5667; translateZ = -200; opacity = 0.85; }
                    else { scale = 0.5; translateZ = -400; opacity = 0; }
                    const z = 20 - abs;
                    // side cards rotate toward the center; left tilts +rot, right tilts -rot
                    const rotY = isCenter ? 0 : (off > 0 ? -12 : 12) * dir;
                    const transform = `translateX(calc(${off * dir} * var(--stepX))) translateZ(${translateZ}px) rotateY(${rotY}deg) scale(${scale})`;
                    return (
                      <div
                        key={i}
                        onClick={() => { if (servicesIndex === i) { const svcLinks = ['/services/priority-service','/services/cancel-for-any-reason','/services/travel-with-pets','/services/car-parking','/services/hayakom-service','/services/wheelchair-assistance','/services/unaccompanied-minor','/services/early-check-in','/services/disruption-assistance','/services/cross-airline-baggage']; setLocation(svcLinks[i]); } else { setServicesIndex(i); } }}
                        aria-label={`${s.title}, ${s.desc}`}
                        aria-hidden={!isCenter}
                        className="absolute cursor-pointer"
                        style={{
                          width: 'clamp(280px, 75vw, 600px)',
                          height: 'clamp(220px, 55vw, 400px)',
                          transform,
                          zIndex: z,
                          opacity,
                          transformStyle: 'preserve-3d',
                          transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
                          pointerEvents: opacity === 0 ? 'none' : 'auto',
                        }}
                      >
                        <div
                          className="w-full h-full relative overflow-hidden"
                          style={{
                            borderRadius: '16px',
                            boxShadow: isCenter ? '0 18px 45px rgba(0,0,0,0.22)' : '0 12px 28px rgba(0,0,0,0.18)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <img src={`/jazeera_files/${s.img}`} draggable={false} className="w-full h-full object-cover block" alt="" />
                          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.55) 100%)' }} />
                          <div className={`absolute flex flex-col gap-2 ${isAr ? 'right-6 left-6 text-right items-end' : 'left-6 right-6'}`} style={{ bottom: '24px' }}>
                            <div style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, color: '#ffffff' }}>{s.title}</div>
                            <div style={{ fontSize: '16px', color: '#ffce00', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.25 }}>{s.desc}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-5 mt-2">
                  <button onClick={() => setServicesIndex((servicesIndex - 1 + n) % n)} className="hidden md:grid place-items-center w-11 h-11 rounded-full border border-[rgba(0,74,151,0.18)] bg-[rgba(0,74,151,0.12)] text-[#004A97] hover:bg-[rgba(0,74,151,0.25)] backdrop-blur-sm transition-all" aria-label="Previous service">
                    <img src={`/jazeera_files/${isAr ? 'arrow_front' : 'arrow_back'}.svg`} className="w-[18px] h-[18px]" alt="" />
                  </button>
                  <div className="flex items-center gap-1.5 md:gap-2" aria-label="Service pagination">
                    {services.map((_, i) => (
                      <button key={i} onClick={() => setServicesIndex(i)} className="rounded-full transition-all duration-300" style={{ width: servicesIndex===i ? '20px' : '10px', height: '10px', background: servicesIndex===i ? '#004a97' : 'rgba(0,74,151,0.35)' }} aria-label={`Go to service ${i+1}`} aria-current={servicesIndex===i} />
                    ))}
                  </div>
                  <button onClick={() => setServicesIndex((servicesIndex + 1) % n)} className="hidden md:grid place-items-center w-11 h-11 rounded-full border border-[rgba(0,74,151,0.18)] bg-[rgba(0,74,151,0.12)] text-[#004A97] hover:bg-[rgba(0,74,151,0.25)] backdrop-blur-sm transition-all" aria-label="Next service">
                    <img src={`/jazeera_files/${isAr ? 'arrow_back' : 'arrow_front'}.svg`} className="w-[18px] h-[18px]" alt="" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
        </SilentErrorBoundary>

        {/* Building Aviation Professionals (sliding carousel matching original) */}
        {(() => {
          const aviationCards = [
            { en: t('home.cabinCrew'), img: 'cabincrewtrainingcourse_whosthiscourse' },
            { en: t('home.aviationCourse'), img: 'launchyouraviationjourney_careerpathway' },
            { en: t('home.graduateTraining'), img: 'Graduate_training' },
          ];
          const av = aviationCards.length; // 3
          const loopCards = [...aviationCards, ...aviationCards];
          const goPrev = () => setAviationIndex((prev) => (prev - 1 + av) % av);
          const goNext = () => setAviationIndex((prev) => (prev + 1) % av);
          const isMobAv = typeof window !== 'undefined' && window.innerWidth < 768;
          return (
            <div className="max-w-[1200px] mx-auto px-4 mt-16 mb-20">
              <div className={`flex justify-between items-end mb-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-3xl md:text-4xl font-medium text-[#004A97] tracking-[-0.03em]">{t('home.buildingAviation')}</h2>
                {/* Arrows only on desktop */}
                <div className="hidden md:flex items-center gap-1">
                  <button onClick={isAr ? goNext : goPrev} className="h-8 w-8 rounded-full flex items-center justify-center bg-[#004a97] hover:bg-[#003581] hover:scale-110 transition-all duration-200" aria-label="Previous">
                    <img alt="" className="h-4 w-4 filter brightness-0 invert" src="/jazeera_files/arrow_back.svg" />
                  </button>
                  <button onClick={isAr ? goPrev : goNext} className="h-8 w-8 rounded-full flex items-center justify-center bg-[#004a97] hover:bg-[#003581] hover:scale-110 transition-all duration-200" aria-label="Next">
                    <img alt="" className="h-4 w-4 filter brightness-0 invert" src="/jazeera_files/arrow_front.svg" />
                  </button>
                </div>
              </div>
              {/* Sliding track */}
              <div dir="ltr" className="w-full overflow-hidden" onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }} onTouchEnd={(e) => { const startX = (e.currentTarget as any)._touchX; if (startX !== undefined) { const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev(); } } }}>
                <div
                  className="flex"
                  style={{
                    gap: isMobAv ? '16px' : '24px',
                    transform: isMobAv ? `translateX(calc(${-aviationIndex} * (100% + 16px)))` : `translateX(calc(${-aviationIndex} * (33.3333% + 8px)))`,
                    transition: 'transform 0.6s ease-in-out',
                    willChange: 'transform',
                  }}
                >
                  {loopCards.map((c, i) => {
                    const courseLinks = ['/info/cabin-crew-course','/info/aviation-course','/info/graduate-training'];
                    return (
                    <div key={i} onClick={() => setLocation(courseLinks[i % av])} className="flex-shrink-0 h-[320px] md:h-[300px] rounded-2xl overflow-hidden relative group cursor-pointer" style={{ width: isMobAv ? '100%' : 'calc((100% - 48px) / 3)' }}>
                      <img src={`/jazeera_files/${c.img}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className={`absolute bottom-6 flex flex-col gap-1 text-white ${isAr ? 'right-6 items-end text-right' : 'left-6 items-start'}`}>
                        <h3 className="text-[22px] md:text-[20px] font-medium leading-none tracking-[-0.03em]">{c.en}</h3>
                        <span className="text-[15px] md:text-[16px] font-extrabold leading-[1.3] tracking-[-0.03em] opacity-90">{t('home.knowMore')}</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
              {/* Mobile dots */}
              <div className="md:hidden flex items-center justify-center gap-1.5 mt-4">
                {aviationCards.map((_, i) => (
                  <button key={i} onClick={() => setAviationIndex(i)} className="rounded-full transition-all duration-300" style={{ width: aviationIndex === i ? '20px' : '8px', height: '8px', background: aviationIndex === i ? '#004a97' : 'rgba(0,74,151,0.3)' }} aria-label={`Card ${i+1}`} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Your Travel Starts Here (white membership card, matches original) */}
        <div className="max-w-[1200px] mx-auto px-4 mt-16 mb-20">
          <div className="w-full shadow-[0px_2px_11px_rgba(0,74,151,0.15)] rounded-2xl flex flex-col lg:flex-row items-center justify-center p-6 lg:p-8 gap-6 bg-white">
            <div className={`flex-1 flex flex-col justify-center gap-6 ${isAr ? 'items-end text-right' : 'items-start text-left'}`}>
              <div className="self-stretch flex flex-col gap-2">
                <div className="self-stretch flex flex-col gap-1">
                  <div className="text-2xl font-normal tracking-tight text-black">{t('home.getStarted')}</div>
                  <h2 className="text-3xl lg:text-[40px] text-[#004a97] leading-tight font-bold tracking-tight">{t('home.travelStartsHere')}</h2>
                </div>
                <div className="text-base tracking-tight text-black leading-relaxed">{t('home.travelStartsSub')}</div>
              </div>
              <button className="w-full lg:w-[326px] h-12 rounded-full border-black border border-solid flex items-center justify-center py-2.5 px-4 text-center text-lg font-extrabold tracking-tight text-black transition-all duration-300 hover:bg-black hover:text-white">{t('home.signInJoin')}</button>
            </div>
            <div className="w-full lg:w-[495px] h-[200px] lg:h-[278px] rounded-2xl overflow-hidden flex-shrink-0">
              <img alt="Jazeera Membership Benefits" src="/jazeera_files/img-banner" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
            </div>
          </div>
        </div>

        {/* Footer (exact copy of original) */}
        <footer className="bg-[#004A97] text-white" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="max-w-[1200px] mx-auto px-4">
            {/* Footer logo */}
            <img src="/jazeera_files/footer-logo.svg" alt="Jazeera Airways" className="w-32 h-auto mb-10" />
            <div className={`grid grid-cols-2 md:grid-cols-5 gap-8 mb-10 ${isAr ? 'text-right' : ''}`}>
              <div>
                <h4 className="text-[18px] font-semibold mb-4">{isAr ? 'عن الجزيرة' : 'About Jazeera'}</h4>
                <ul className="space-y-2">
                  <li><a href="https://www.jazeeraairways.com/en-kw/about-us" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'من نحن' : 'About Us'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/air-cargo" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'جزيرة للشحن الجوي' : 'Jazeera Air Cargo'}</a></li>
                  <li><a href="/info/careers" className="text-[14px] leading-[21px] text-white hover:underline" onClick={(e) => { e.preventDefault(); setLocation('/info/careers'); }}>{isAr ? 'وظائف' : 'Careers'}</a></li>
                  <li><a href="/info/cabin-crew-course" className="text-[14px] leading-[21px] text-white hover:underline" onClick={(e) => { e.preventDefault(); setLocation('/info/cabin-crew-course'); }}>{isAr ? 'دورة طاقم الضيافة' : 'Cabin Crew Course'}</a></li>
                  <li><a href="/info/graduate-training" className="text-[14px] leading-[21px] text-white hover:underline" onClick={(e) => { e.preventDefault(); setLocation('/info/graduate-training'); }}>{isAr ? 'برنامج تطوير الخريجين' : 'Graduate Development Program'}</a></li>
                  <li><a href="/info/aviation-course" className="text-[14px] leading-[21px] text-white hover:underline" onClick={(e) => { e.preventDefault(); setLocation('/info/aviation-course'); }}>{isAr ? 'دورة الطيران' : 'Aviation Course'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/charter-flight-service" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'جزيرة للرحلات الخاصة' : 'Jazeera Charter'}</a></li>
                  <li><a href="https://investorrelations.jazeeraairways.com/en/about-jazeera/investor-relations/" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'علاقات المستثمرين' : 'Investor Relations'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[18px] font-semibold mb-4">{isAr ? 'وجهاتنا' : 'Where We Fly'}</h4>
                <ul className="space-y-2">
                  <li><a href="https://www.jazeeraairways.com/en-kw/plan/destinations/africa" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'أفريقيا' : 'Africa'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/plan/destinations/asia" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'آسيا' : 'Asia'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/plan/destinations/europe" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'أوروبا' : 'Europe'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/plan/destinations/middle-east" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'الشرق الأوسط' : 'Middle East'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[18px] font-semibold mb-4">{isAr ? 'المساعدة' : 'Help'}</h4>
                <ul className="space-y-2">
                  <li><a href="/info/faqs" className="text-[14px] leading-[21px] text-white hover:underline" onClick={(e) => { e.preventDefault(); setLocation('/info/faqs'); }}>{isAr ? 'الأسئلة الشائعة' : 'FAQ'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/help/contact-us" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'اتصل بنا' : 'Contact Us'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/feedback" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'ملاحظات' : 'Feedback'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[18px] font-semibold mb-4">{isAr ? 'الشؤون القانونية' : 'Legal & Compliance'}</h4>
                <ul className="space-y-2">
                  <li><a href="https://www.jazeeraairways.com/en-kw/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'سياسة الخصوصية' : 'Privacy policy'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/accessibility-policy" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'بيان إمكانية الوصول' : 'Accessibility Statement'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[18px] font-semibold mb-4">{isAr ? 'الأخبار والإعلام' : 'News & Media'}</h4>
                <ul className="space-y-2">
                  <li><a href="https://www.jazeeraairways.com/en-kw/media" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'المركز الإعلامي' : 'Media Centre'}</a></li>
                  <li><a href="https://www.jazeeraairways.com/en-kw/media/library" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-[21px] text-white hover:underline">{isAr ? 'المكتبة الإعلامية' : 'Media Library'}</a></li>
                </ul>
              </div>
            </div>
            <div className={`border-t border-white/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 ${isAr ? 'md:flex-row-reverse' : ''}`}>
              <div className={`flex flex-col md:flex-row items-center gap-x-6 gap-y-2 text-[14px] text-white ${isAr ? 'md:flex-row-reverse' : ''}`}>
                <span>{isAr ? '© طيران الجزيرة. جميع الحقوق محفوظة.' : '© Jazeera Airways. All rights reserved.'}</span>
                <a href="https://www.jazeeraairways.com/en-kw/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="hover:underline">{isAr ? 'الشروط والأحكام' : 'Terms and Condition'}</a>
                <a href="https://www.jazeeraairways.com/en-kw/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
              </div>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/Jazeera.Airways/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-11 h-11 rounded-full border border-white/100 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><img src="/jazeera_files/facebook.svg" alt="" className="w-[22px] h-[22px]" /></a>
                <a href="https://www.youtube.com/channel/UCDZuROfzF_1YPOGjVSdJpLw" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-11 h-11 rounded-full border border-white/100 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><img src="/jazeera_files/youtube.svg" alt="" className="w-[22px] h-[22px]" /></a>
                <a href="https://www.instagram.com/jazeeraairways/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-11 h-11 rounded-full border border-white/100 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><img src="/jazeera_files/instagram.svg" alt="" className="w-[22px] h-[22px]" /></a>
                <a href="https://www.linkedin.com/company/jazeera-airways" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-11 h-11 rounded-full border border-white/100 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><img src="/jazeera_files/linked-in.svg" alt="" className="w-[22px] h-[22px]" /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Nav Bar (matches original) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[9998] flex items-end transition-transform duration-300 ${picker ? 'hidden' : ''} ${showBottomNav ? 'translate-y-0' : 'translate-y-full'}`} style={{ background: 'linear-gradient(rgba(255,255,255,0) 0%, rgb(255,255,255) 100%)', padding: '32px 12px 8px' }}>
        <div className="w-full flex items-center gap-2">
          <div className="relative flex-1 bg-[#004a97] rounded-full flex items-center px-1 shadow-[0px_2px_11px_0px_rgba(0,74,151,0.15)]" style={{ height: '64px' }}>
            {/* Active indicator pill */}
            <div aria-hidden="true" style={{ position: 'absolute', width: 'calc(25% - 8px)', height: '48px', top: '50%', background: 'rgba(255,255,255,0.18)', borderRadius: '9999px', pointerEvents: 'none', left: '4px', transform: 'translateX(0%) translateY(-50%)', transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)' }} />
            <button onClick={() => { setPicker(null); setLocation('/'); }} aria-current="page" className="relative flex flex-col items-center gap-1 py-2.5 px-1.5 min-w-[55px] flex-1 overflow-hidden rounded-full" style={{ WebkitTapHighlightColor: 'transparent', zIndex: 1 }}>
              <div className="relative flex items-center justify-center" style={{ zIndex: 1 }}><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>
              <span className="text-xs text-white leading-tight font-bold" style={{ zIndex: 1 }}>Home</span>
            </button>
            <button onClick={() => { setPicker('origin'); setAirportQuery(''); }} className="relative flex flex-col items-center gap-1 py-2.5 px-1.5 min-w-[55px] flex-1 overflow-hidden rounded-full" style={{ WebkitTapHighlightColor: 'transparent', zIndex: 1 }}>
              <div className="relative flex items-center justify-center" style={{ zIndex: 1 }}><svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.7012 2.43066C18.4073 1.82963 19.989 1.82963 20.6324 2.43066L21.2334 3.03169C21.8344 3.67503 21.8344 5.36186 21.2334 5.96289L18.29 8.90527L14.7305 5.40137L17.7012 2.43066Z" strokeWidth="1.2"/><path d="M14.7305 5.40137L18.29 8.90527L9.46094 17.7354H5.92871V14.2031L14.7305 5.40137Z" strokeWidth="1.2"/></svg></div>
              <span className="text-xs text-white leading-tight font-normal" style={{ zIndex: 1 }}>Book</span>
            </button>
            <button className="relative flex flex-col items-center gap-1 py-2.5 px-1.5 min-w-[55px] flex-1 overflow-hidden rounded-full" style={{ WebkitTapHighlightColor: 'transparent', zIndex: 1 }}>
              <div className="relative flex items-center justify-center" style={{ zIndex: 1 }}><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
              <span className="text-xs text-white leading-tight font-normal" style={{ zIndex: 1 }}>My Trip</span>
            </button>
            <button className="relative flex flex-col items-center gap-1 py-2.5 px-1.5 min-w-[55px] flex-1 overflow-hidden rounded-full" style={{ WebkitTapHighlightColor: 'transparent', zIndex: 1 }}>
              <div className="relative flex items-center justify-center" style={{ zIndex: 1 }}><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>
              <span className="text-xs text-white leading-tight font-normal" style={{ zIndex: 1 }}>Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[10001] bg-black/45" onClick={() => setMobileMenuOpen(false)}>
          <div
            dir={dir}
            className={`absolute top-0 ${isAr ? 'right-0' : 'left-0'} h-full w-[78%] max-w-[320px] bg-[#004A97] shadow-2xl flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-16">
              <img src="/jazeera_files/web_nav-en" alt="Jazeera Airways" className="h-7 object-contain" />
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close" className="text-white text-2xl leading-none px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {[
                { icon: 'B2C_flight.svg', en: 'Book', ar: 'احجز' },
                { icon: 'B2C_Manage.svg', en: 'Manage', ar: 'إدارة' },
                { icon: 'B2C_Mytrips.svg', en: 'My-trips', ar: 'رحلاتي' },
                { icon: 'B2C_Service.svg', en: 'Add-ons & Service', ar: 'الإضافات والخدمات' },
                { icon: 'airplane_ticket.svg', en: 'Plan Trip', ar: 'خطّط رحلتك' },
                { icon: 'B2C_Deals.svg', en: 'Deals', ar: 'العروض' },
                { icon: 'B2C_Help.svg', en: 'Need Help?', ar: 'تحتاج مساعدة؟' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setMobileMenuOpen(false); window.location.href = '/'; }}
                  className="flex items-center gap-4 w-full px-5 py-3.5 text-white text-base font-medium hover:bg-[#003875] transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl bg-[#0a3d7a] flex items-center justify-center flex-shrink-0">
                    <img src={`/jazeera_files/${item.icon}`} alt="" className="w-5 h-5 object-contain" />
                  </span>
                  <span>{isAr ? item.ar : item.en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPrefs && (
        <div className="fixed inset-0 z-[10000]" onClick={() => setShowPrefs(false)}>
          <div
            dir="ltr"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', bottom: '20px', [isAr ? 'right' : 'left']: '90px', width: '340px', background: 'rgb(0,74,151)', borderRadius: '18px', padding: '26px 24px', boxShadow: 'rgba(0,0,0,0.4) 0px 18px 50px', color: '#fff' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '26px', fontWeight: 700 }}>{isAr ? 'اختر التفضيلات' : 'Choose Preference'}</div>
              <button aria-label="Close preferences" onClick={() => setShowPrefs(false)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgb(0,56,111)', color: '#fff', fontSize: '20px', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}>×</button>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{isAr ? 'اختر اللغة' : 'Select language'}</div>
              <div className="relative">
                <div
                  onClick={() => { setLangOpen((v) => !v); setCurrOpen(false); }}
                  style={{ background: 'rgb(0,56,111)', borderRadius: '10px', padding: '14px 16px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{prefLang === 'ar' ? 'العربية' : 'English'}</span>
                  <span style={{ opacity: 0.8 }}>{langOpen ? '▴' : '▾'}</span>
                </div>
                {langOpen && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)', background: 'rgb(0,56,111)', borderRadius: '10px', overflow: 'hidden', zIndex: 10, boxShadow: 'rgba(0,0,0,0.4) 0px 8px 30px' }}>
                    {[{ v: 'en', t: 'English' }, { v: 'ar', t: 'العربية' }].map((o) => (
                      <div key={o.v} onClick={() => { setPrefLang(o.v as 'en' | 'ar'); setLangOpen(false); }} style={{ padding: '11px 16px', fontSize: '14px', cursor: 'pointer' }}>{o.t}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{isAr ? 'اختر العملة' : 'Select Currency'}</div>
              <div className="relative">
                <div
                  onClick={() => { setCurrOpen((v) => !v); setLangOpen(false); }}
                  style={{ background: 'rgb(0,56,111)', borderRadius: '10px', padding: '14px 16px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={`https://flagcdn.com/20x15/${(CURRENCIES.find((c) => c.code === currency) || CURRENCIES[8]).flag}.png`} width={20} height={15} style={{ borderRadius: '2px', flexShrink: 0, objectFit: 'cover' }} />
                    <span>{(CURRENCIES.find((c) => c.code === currency) || CURRENCIES[8]).label}</span>
                  </span>
                  <span style={{ opacity: 0.8 }}>{currOpen ? '▴' : '▾'}</span>
                </div>
                {currOpen && (
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)', background: 'rgb(0,56,111)', borderRadius: '10px', maxHeight: '260px', overflowY: 'auto', zIndex: 10, boxShadow: 'rgba(0,0,0,0.4) 0px -8px 30px' }}>
                    {CURRENCIES.map((c) => (
                      <div key={c.code} onClick={() => { setCurrency(c.code); setCurrOpen(false); }} style={{ padding: '11px 16px', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={`https://flagcdn.com/20x15/${c.flag}.png`} width={20} height={15} style={{ borderRadius: '2px', flexShrink: 0, objectFit: 'cover' }} />
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={applyPrefs}
              style={{ width: '100%', marginTop: '6px', padding: '15px', border: 'none', borderRadius: '24px', cursor: 'pointer', background: 'linear-gradient(rgb(255,216,77), rgb(242,194,0))', color: 'rgb(0,56,111)', fontSize: '17px', fontWeight: 700 }}
            >
              {isAr ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* Airport Picker Modal */}
      {picker && (() => {
        const isMc = picker === 'multicity';
        // True whenever the Multi City flow is active, even on the shared 'pax'
        // screen (where picker becomes 'pax'). Used for the passenger screen
        // title, search button and the flight cards shown below it.
        const mcMode = activeTab === 'Multi City';
        // Multi City: when actively editing a field, the title reflects the field.
        const mcTitleKey = mcEdit
          ? (mcEdit.field === 'origin' ? 'airport.flyingFrom' : mcEdit.field === 'destination' ? 'airport.flyingTo' : 'airport.whenGo')
          : picker === 'pax' ? 'airport.paxTitle'
          : 'airport.flyingTo';
        const titleKey = (isMc || (mcMode && picker === 'pax'))
          ? mcTitleKey
          : picker === 'origin' ? 'airport.flyingFrom' : picker === 'destination' ? 'airport.flyingTo' : picker === 'date' ? 'airport.whenGo' : 'airport.paxTitle';
        const ready = !!origin && !!destination && !!date && (activeTab !== 'Round Trip' || !!returnDate);
        // Which airport to hide from the current list so the selected From never
        // appears in the To list (and vice versa), exactly like the original.
        const excludeIata = isMc
          ? (mcEdit
              ? (mcEdit.field === 'origin'
                  ? mcLegs[mcEdit.idx]?.destination
                  : mcEdit.field === 'destination'
                    ? mcLegs[mcEdit.idx]?.origin
                    : '')
              : '')
          : (picker === 'origin'
              ? destination
              : picker === 'destination'
                ? origin
                : '');
        const airportList = excludeIata
          ? filteredAirports.filter((a) => a.iata !== excludeIata)
          : filteredAirports;
        const goBack = () => {
          if (isMc) {
            // If editing a field, step back to the leg overview; else close.
            if (mcEdit) setMcEdit(null);
            else setPicker(null);
            setAirportQuery('');
            return;
          }
          if (picker === 'destination') setPicker('origin');
          else if (picker === 'date') setPicker('destination');
          else if (picker === 'pax') setPicker('date');
          else setPicker(null);
          setAirportQuery('');
        };
        // Original-style capsule sub-pill: icon + text, active = light-blue fill.
        const CapPill = ({ active, icon, onClick, children }: { active?: boolean; icon: string; onClick?: () => void; children: React.ReactNode }) => (
          <button
            onClick={onClick}
            className={`px-3 sm:px-4 h-[38px] rounded-full flex items-center gap-2 whitespace-nowrap transition-colors ${active ? 'bg-[#cfe6fb]' : 'hover:bg-[#f0f6fd]'}`}
            style={active ? undefined : { border: '1px solid rgba(0,74,151,0.18)' }}
          >
            <img src={icon} alt="" className="w-4 h-4 flex-shrink-0" />
            <span className="text-[15px] font-semibold text-[#004A97] truncate" style={{ maxWidth: 200 }}>{children}</span>
          </button>
        );
        const Pill = ({ active, filled, onClick, children }: { active?: boolean; filled?: boolean; onClick?: () => void; children: React.ReactNode }) => (
          <button
            onClick={onClick}
            className={`px-3 sm:px-4 h-[38px] rounded-full flex items-center gap-2 whitespace-nowrap transition-colors ${active ? 'bg-[#cfe6fb] border border-[#004A97]' : filled ? 'bg-white border border-[#004A97]/30' : 'bg-white border border-[#cfe0f3] hover:bg-[#f0f6fd]'}`}
          >
            <span className="text-[14px] font-semibold text-[#004A97] truncate" style={{ maxWidth: 200 }}>{children}</span>
          </button>
        );
        const Divider = () => (
          <img src="/jazeera_files/orig_line.svg" alt="" className="hidden lg:block w-[84px] opacity-70 shrink min-w-0" />
        );
        return (
        <div className="fixed inset-0 z-[10000] bg-[#EBF3FF] flex flex-col" dir={dir}>
          {/* Logo pinned top-left of the whole page (matches original x16/y16) */}
          <img src="/jazeera_files/J920_Logo.svg" alt="Jazeera" className="hidden md:block absolute top-6 left-5 h-[64px] w-auto z-10 cursor-pointer" onClick={() => { setPicker(null); setLocation('/'); }} />
          <div className={`flex-1 ${picker === 'pax' ? 'overflow-hidden md:overflow-y-auto' : 'overflow-y-auto'}`}>
          <div className="max-w-[1024px] mx-auto px-4 pt-4 md:pt-10 pb-8">
            {/* Header row: back + title (left) ; KWD / Multi-city / X (right) */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={goBack} aria-label="Back" className="w-9 h-9 rounded-full md:bg-white md:border md:border-[#cfe0f3] flex items-center justify-center text-[#004A97] md:shadow-sm hover:bg-[#f3f8ff] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} /></svg>
                </button>
                <h1 className="text-[20px] font-bold md:font-medium text-[#001326] truncate">{t(titleKey)}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* KWD pill - shown on mobile date & pax picker like original */}
                {(picker === 'date' || picker === 'pax') && (
                  <div className="relative md:hidden" ref={calCurrRef}>
                    <button onClick={() => setCalCurrOpen((v) => !v)} className="flex items-center gap-1 border border-[#cfe0f3] rounded-full px-4 py-2 text-[14px] font-semibold text-[#001326] bg-white hover:bg-[#f4f7fb]">
                      <span>{currency}</span>
                      <svg className={`w-3.5 h-3.5 transition-transform ${calCurrOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {calCurrOpen && (
                      <div className="absolute left-0 top-full mt-2 bg-[#00386f] rounded-xl shadow-lg z-50 min-w-[200px] max-h-[260px] overflow-y-auto">
                        {CURRENCIES.map((c) => (
                          <div key={c.code} onClick={() => { setCurrency(c.code); setCalCurrOpen(false); localStorage.setItem('jz_currency', c.code); }} className="flex items-center gap-2 px-4 py-3 text-white text-sm cursor-pointer hover:bg-[#004a8f] whitespace-nowrap">
                            <span>{c.code} - {c.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Multi-city pill - shown on mobile when in multi-city mode */}
                {isMc && !mcEdit && picker !== 'pax' && (
                  <span className="md:hidden px-4 h-[40px] rounded-full bg-white text-[#001326] text-[15px] font-semibold flex items-center justify-center shadow-sm border border-[#004A97]/30">{t('common.multiCity')}</span>
                )}
                <button onClick={() => { setActiveTab('Multi City'); setPicker('multicity'); setAirportQuery(''); }} className="hidden md:flex px-4 h-[40px] rounded-full bg-white text-[#001326] text-[15px] font-semibold items-center justify-center hover:bg-[#f3f8ff] shadow-sm border border-[#004A97]/30">{t('common.multiCity')}</button>
                <button className="px-4 h-[40px] rounded-full bg-white text-[#001326] text-[15px] font-semibold hidden sm:flex items-center gap-2 hover:bg-[#f3f8ff] shadow-sm">
                  <img src="/jazeera_files/orig_promoCode.svg" alt="" className="w-4 h-4" />
                  <span className="truncate" style={{ maxWidth: 76 }}>{t('airport.addPromo')}</span>
                </button>
                <button onClick={() => { setPicker(null); setMcEdit(null); try { if (typeof localStorage !== 'undefined') localStorage.removeItem(PICKER_STATE_KEY); } catch { /* ignore */ } }} aria-label="Close" className="hidden md:flex w-12 h-12 rounded-full bg-white border border-[#cfe0f3] items-center justify-center text-[#004A97] shadow-sm hover:bg-[#f3f8ff]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Full-width content column (matches original) */}
            <div className="w-full">

            {/* Shared ribbon: From / To / Date / Passenger inside one white capsule + Search outside (single-trip flows) */}
            {!isMc && !mcMode && (
            <div className="hidden md:flex bg-white rounded-full p-2 shadow-[0_2px_11px_0_rgba(0,74,151,0.12)] items-center gap-1 mb-5 overflow-hidden">
              <CapPill active={picker === 'origin'} icon="/jazeera_files/orig_takeOff.svg" onClick={() => { setPicker('origin'); setAirportQuery(''); }}>
                {t('airport.from')} {cityLabel(origin)}, {origin}
              </CapPill>
              <Divider />
              <CapPill active={picker === 'destination'} icon="/jazeera_files/orig_landing.svg" onClick={() => { setPicker('destination'); setAirportQuery(''); }}>
                {t('airport.to')} {destination ? `${cityLabel(destination)}, ${destination}` : '-'}
              </CapPill>
              <Divider />
              <CapPill active={picker === 'date'} icon="/jazeera_files/orig_calendar.svg" onClick={() => destination && setPicker('date')}>
                {date ? `${fmtBadge(date)}${activeTab === 'Round Trip' && returnDate ? ` - ${fmtBadge(returnDate)}` : ''}` : '-'}
              </CapPill>
              <Divider />
              <CapPill active={picker === 'pax'} icon="/jazeera_files/orig_passenger.svg" onClick={() => destination && setPicker('pax')}>
                {totalPax} {totalPax === 1 ? t('common.passenger') : t('common.passengers')}{duoSeat > 0 ? ` + ${duoSeat}` : ''}
              </CapPill>
              <button
                onClick={() => ready && goToResults()}
                disabled={!ready}
                className={`ml-auto shrink-0 flex items-center gap-2 rounded-full px-5 h-[38px] text-[15px] font-semibold transition-colors ${ready ? 'bg-[#004A97] text-white hover:bg-[#003a78]' : 'bg-[#cfd8e3] text-white cursor-not-allowed'}`}
              >
                {t('airport.search')} <span aria-hidden>{isAr ? '←' : '→'}</span>
              </button>
            </div>
            )}

            {/* Multi City interactive ribbon: same style as One Way (CapPill with SVG icons) */}
            {isMc && mcEdit && (() => {
              const leg = mcLegs[mcEdit.idx];
              const legComplete = !!leg?.origin && !!leg?.destination && !!leg?.date;
              return (
              <div className="hidden md:flex bg-white rounded-full p-2 shadow-[0_2px_11px_0_rgba(0,74,151,0.12)] items-center gap-1 mb-5 overflow-hidden">
                <CapPill active={mcEdit.field === 'origin'} icon="/jazeera_files/orig_takeOff.svg" onClick={() => { setMcEdit({ idx: mcEdit.idx, field: 'origin' }); setAirportQuery(''); }}>
                  {t('airport.from')} {leg?.origin ? `${cityLabel(leg.origin)}, ${leg.origin}` : '-'}
                </CapPill>
                <Divider />
                <CapPill active={mcEdit.field === 'destination'} icon="/jazeera_files/orig_landing.svg" onClick={() => { setMcEdit({ idx: mcEdit.idx, field: 'destination' }); setAirportQuery(''); }}>
                  {t('airport.to')} {leg?.destination ? `${cityLabel(leg.destination)}, ${leg.destination}` : '-'}
                </CapPill>
                <Divider />
                <CapPill active={mcEdit.field === 'date'} icon="/jazeera_files/orig_calendar.svg" onClick={() => { if (leg?.origin && leg?.destination) { setMcEdit({ idx: mcEdit.idx, field: 'date' }); setCalMonth(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }); } }}>
                  {leg?.date ? fmtBadge(leg.date) : '-'}
                </CapPill>
                <Divider />
                <CapPill active={false} icon="/jazeera_files/orig_passenger.svg" onClick={() => setPicker('pax')}>
                  {totalPax} {totalPax === 1 ? t('common.passenger') : t('common.passengers')}{duoSeat > 0 ? ` + ${duoSeat}` : ''}
                </CapPill>
                <button
                  onClick={() => { if (legComplete) { setMcEdit(null); goToMultiCityResults(); } }}
                  disabled={!legComplete}
                  className={`ml-auto shrink-0 flex items-center gap-2 rounded-full px-5 h-[38px] text-[15px] font-semibold transition-colors ${legComplete ? 'bg-[#004A97] text-white hover:bg-[#003a78]' : 'bg-[#cfd8e3] text-white cursor-not-allowed'}`}
                >
                  {t('airport.search')} <span aria-hidden>{isAr ? '←' : '→'}</span>
                </button>
              </div>
              );
            })()}

            {/* ===== MULTI CITY: leg overview ===== */}
            {isMc && !mcEdit && (
              <>
                {/* Top-right pills (One way / Passenger / Promo) mirror the original header - hidden on mobile */}
                <div className="hidden md:flex flex-wrap items-center justify-end gap-3 -mt-4 mb-6">
                  <button onClick={() => { setActiveTab('One Way'); setPicker('origin'); setAirportQuery(''); }} className="flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold bg-white border border-[#cfe0f3] text-[#5b6b7b] hover:border-[#41b4e6]"><span aria-hidden>↻</span>{t('airport.oneWay')}</button>
                  <button onClick={() => setPicker('pax')} className="flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold bg-white border border-[#cfe0f3] text-[#5b6b7b] hover:border-[#41b4e6]"><span aria-hidden>👤</span>{totalPax} {totalPax === 1 ? t('airport.passengerCount') : t('common.passengers')}{duoSeat > 0 ? ` + ${duoSeat}` : ''}</button>
                  <button className="flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold bg-white border border-[#cfe0f3] text-[#5b6b7b] hover:border-[#41b4e6]"><span aria-hidden>🎟️</span>{t('airport.addPromo')}</button>
                </div>

                <div className="space-y-4">
                  {mcLegs.map((leg, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[15px] font-bold text-[#004A97]">{t('airport.flight')} {i + 1}</span>
                        {mcLegs.length > 2 && (
                          <button onClick={() => removeLeg(i)} className="w-7 h-7 rounded-full border border-[#cfe0f3] flex items-center justify-center text-[#9aa7b4] hover:text-[#d33] hover:border-[#d33]" aria-label="Remove flight">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        {/* From */}
                        <button onClick={() => { setMcEdit({ idx: i, field: 'origin' }); setAirportQuery(''); }} className="flex-1 min-w-0 rounded-xl border border-[#e1ecf7] px-4 py-3 flex items-center gap-3 text-start hover:border-[#41b4e6] transition-colors">
                          <img src="/jazeera_files/Plane - take off_darkblue.svg" alt="" className="w-5 h-5 shrink-0" />
                          <span className="truncate text-[15px] text-[#7a8a9a]">{leg.origin ? <span className="text-[#001326]">{cityLabel(leg.origin)}, {leg.origin}</span> : <>{t('airport.from')}: -</>}</span>
                        </button>
                        {/* To */}
                        <button onClick={() => { setMcEdit({ idx: i, field: 'destination' }); setAirportQuery(''); }} className="flex-1 min-w-0 rounded-xl border border-[#e1ecf7] px-4 py-3 flex items-center gap-3 text-start hover:border-[#41b4e6] transition-colors">
                          <img src="/jazeera_files/Plane - Landing_darkblue.svg" alt="" className="w-5 h-5 shrink-0" />
                          <span className="truncate text-[15px] text-[#7a8a9a]">{leg.destination ? <span className="text-[#001326]">{cityLabel(leg.destination)}, {leg.destination}</span> : <>{t('airport.to')}: -</>}</span>
                        </button>
                        {/* Date */}
                        <button onClick={() => { if (leg.origin && leg.destination) { setMcEdit({ idx: i, field: 'date' }); setCalMonth(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }); } }} className="md:w-[160px] rounded-xl border border-[#e1ecf7] px-4 py-3 flex items-center gap-3 text-start hover:border-[#41b4e6] transition-colors disabled:opacity-50" disabled={!leg.origin || !leg.destination}>
                          <svg className="w-5 h-5 text-[#004A97] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-[15px] text-[#7a8a9a]">{leg.date ? <span className="text-[#001326]">{fmtBadge(leg.date)}</span> : '-'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add a flight + Search */}
                <div className="flex items-center gap-4 mt-6">
                  <button onClick={addLeg} disabled={mcLegs.length >= 5} className={`flex-1 rounded-2xl py-4 flex items-center justify-center gap-3 font-semibold text-white transition-colors ${mcLegs.length >= 5 ? 'bg-[#9bb8d6] cursor-not-allowed' : 'bg-[#004A97] hover:bg-[#003a78]'}`}>
                    <span className="w-7 h-7 rounded-full bg-white text-[#004A97] flex items-center justify-center text-xl leading-none">+</span>
                    {t('airport.addFlight')}
                  </button>
                  <button onClick={() => mcReady && goToMultiCityResults()} disabled={!mcReady} className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${mcReady ? 'bg-[#004A97] text-white hover:bg-[#003a78]' : 'bg-white border border-[#cfe0f3] text-[#9aa7b4] cursor-not-allowed'}`} aria-label={t('airport.search')}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? 'M11 19l-7-7 7-7M4 12h16' : 'M13 5l7 7-7 7M20 12H4'} /></svg>
                  </button>
                </div>
              </>
            )}

            {/* ===== AIRPORTS (origin/destination, single + multi-city field edit) ===== */}
            {(picker === 'origin' || picker === 'destination' || (isMc && mcEdit && mcEdit.field !== 'date')) && (
              <>
                <div className="bg-white border-2 border-[#41b4e6] rounded-2xl px-5 h-[52px] flex items-center gap-3 mb-5">
                  <img src="/jazeera_files/orig_search.svg" alt="" className="w-6 h-6 shrink-0" />
                  <input
                    autoFocus
                    value={airportQuery}
                    onChange={(e) => setAirportQuery(e.target.value)}
                    placeholder={t('airport.searchPlaceholder')}
                    className="flex-1 bg-transparent outline-none text-[18px] text-[#001326]"
                  />
                </div>
                {/* Mobile airport list - no card wrapper, divider lines */}
                <div className="md:hidden">
                  <h2 className="text-[16px] font-medium text-[#5b6b7b] text-start mb-3 px-1">{t('airport.allAirports')}</h2>
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto hide-scrollbar">
                  {airportList.map((a, idx) => (
                    <button
                      key={a.iata}
                      onClick={() => (isMc ? pickMcAirport(a.iata) : pickAirport(a.iata))}
                      className={`w-full flex items-center gap-4 py-4 px-1 hover:bg-[#f0f6fc] transition-colors text-start ${idx > 0 ? 'border-t border-[#e8eef4]' : ''}`}
                    >
                      <img
                        src={`/airports/${a.iata}.jpg`}
                        alt={fullAirportName(a.iata, a.city)}
                        loading="lazy"
                        onError={(e) => { const img = e.currentTarget; img.onerror = null; img.src = '/airports/KWI.jpg'; }}
                        className="w-[100px] h-[72px] rounded-xl object-cover shrink-0 bg-[#dbe7f5]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[16px] font-bold text-[#001326] leading-6 truncate">{cityName(a.iata, a.city)}, {countryName(a.iata)}</div>
                        <div className="text-[14px] font-normal text-[#555659] leading-5 truncate mt-0.5">{fullAirportName(a.iata, a.city)}</div>
                      </div>
                      <span className="text-[15px] font-bold text-[#001326] shrink-0">{a.iata}</span>
                    </button>
                  ))}
                  </div>
                </div>
                {/* Desktop airport list - keep original card style */}
                <div className="hidden md:block bg-white rounded-2xl shadow-[0_2px_11px_0_rgba(0,74,151,0.10)] px-5 pt-5 pb-3">
                  <h2 className="text-[18px] font-medium text-[#001326] text-start mb-2">{t('airport.allAirports')}</h2>
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-1 hide-scrollbar">
                  {airportList.map((a) => (
                    <button
                      key={a.iata}
                      onClick={() => (isMc ? pickMcAirport(a.iata) : pickAirport(a.iata))}
                      className="w-full flex items-center gap-3 p-4 mt-3 rounded-2xl bg-white shadow-[0_2px_11px_0_rgba(0,74,151,0.15)] hover:bg-[#f7fafe] transition-colors text-start"
                    >
                      <img
                        src={`/airports/${a.iata}.jpg`}
                        alt={fullAirportName(a.iata, a.city)}
                        loading="lazy"
                        onError={(e) => { const img = e.currentTarget; img.onerror = null; img.src = '/airports/KWI.jpg'; }}
                        className="w-[88px] h-[68px] rounded-2xl object-cover shrink-0 bg-[#dbe7f5]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[16px] font-extrabold text-[#001326] leading-6 truncate">{cityName(a.iata, a.city)}, {countryName(a.iata)}</div>
                        <div className="text-[15px] font-normal text-[#555659] leading-[18.75px] truncate">{fullAirportName(a.iata, a.city)}</div>
                      </div>
                      <span className="text-[14px] font-extrabold text-[#001326] shrink-0">{a.iata}</span>
                    </button>
                  ))}
                  </div>
                </div>
              </>
            )}

            {/* ===== DATE (calendar, single + multi-city leg date) ===== */}
            {(picker === 'date' || (isMc && mcEdit && mcEdit.field === 'date')) && (
              <>
              {/* Mobile date picker - matches original exactly */}
              <div className="md:hidden flex flex-col" style={{ height: 'calc(100dvh - 80px)', minHeight: 0 }}>
                {/* One way / Round trip toggle - full width with outer border */}
                {!isMc && (
                  <div className="flex items-center rounded-full border border-[#cfe0f3] overflow-hidden mb-4">
                    <button onClick={() => { setActiveTab('One Way'); setReturnDate(''); }} className={`flex-1 py-3 text-[15px] font-semibold text-center rounded-full transition-colors ${activeTab !== 'Round Trip' ? 'bg-[#004A97] text-white' : 'text-[#5b6b7b] bg-white'}`}>{t('fsr.oneWay')}</button>
                    <button onClick={() => setActiveTab('Round Trip')} className={`flex-1 py-3 text-[15px] font-semibold text-center rounded-full transition-colors ${activeTab === 'Round Trip' ? 'bg-[#004A97] text-white' : 'text-[#5b6b7b] bg-white'}`}>{t('common.roundTrip')}</button>
                  </div>
                )}

                {/* Calendar card */}
                <div className="bg-white rounded-2xl shadow-sm p-5 flex-1 overflow-y-auto min-h-0">
                  {/* Departure date display (shown after selection) */}
                  {date && !isMc && (
                    <div className="bg-[#e8f4fc] rounded-xl px-4 py-3 mb-4">
                      <div className="text-[13px] text-[#5b6b7b]">Departure</div>
                      <div className="text-[16px] font-bold text-[#001326]">{fmtBadge(date)}</div>
                    </div>
                  )}
                  {activeTab === 'Round Trip' && returnDate && (
                    <div className="bg-[#e8f4fc] rounded-xl px-4 py-3 mb-4">
                      <div className="text-[13px] text-[#5b6b7b]">Return</div>
                      <div className="text-[16px] font-bold text-[#001326]">{fmtBadge(returnDate)}</div>
                    </div>
                  )}

                  {/* Reset Dates - right aligned */}
                  {!isMc && (
                    <div className="flex justify-end mb-4">
                      <button onClick={resetDates} className="text-[#001326] underline text-[14px] font-semibold">{t('airport.resetDates')}</button>
                    </div>
                  )}

                  {/* Scrollable months (show 12 months = full year) */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((off) => {
                    const m = new Date(calMonth.getFullYear(), calMonth.getMonth() + off, 1);
                    return (
                      <div key={off} className="mb-8">
                        <div className="text-left font-bold text-[#001326] text-[18px] mb-3">{monthLabel(m)}</div>
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (<div key={i} className="text-[13px] text-[#9aa7b4] font-semibold py-2">{w}</div>))}
                          {monthMatrix(m).map((d, i) => {
                            if (!d) return <div key={i} className="w-10 h-10" />;
                            const iso = fmtISO(d);
                            const past = d < todayStart;
                            const mcLegDate = isMc && mcEdit ? mcLegs[mcEdit.idx]?.date : '';
                            const isDepart = isMc ? iso === mcLegDate : iso === date;
                            const isReturn = !isMc && activeTab === 'Round Trip' && iso === returnDate;
                            const inRange = !isMc && activeTab === 'Round Trip' && returnDate && iso > date && iso < returnDate;
                            return (
                              <button key={i} disabled={past} onClick={() => (isMc ? selectMcDay(d) : selectDay(d))}
                                className={`w-10 h-10 mx-auto rounded-full font-semibold flex items-center justify-center transition-colors ${past ? 'text-[#cdd6df] cursor-not-allowed' : (isDepart || isReturn) ? 'bg-[#1ea7e0] text-white' : inRange ? 'bg-[#d9eefb] text-[#001326]' : 'text-[#001326] hover:bg-[#eef3f8]'}`}>
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom section: Plans may change card + Confirm bar - pinned at bottom of flex */}
                {(isMc || (activeTab === 'Round Trip' ? (date && returnDate) : date)) && (
                <div className="shrink-0">
                  {/* Plans may change? card */}
                  <div className="bg-[#004A97] rounded-2xl mx-0 mb-3 px-4 py-4 flex items-center gap-3">
                    <svg className="w-8 h-8 shrink-0 text-[#f5c518]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.5"/><path d="M8 14l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-[15px]">Plans may change?</div>
                      <div className="text-white/80 text-[13px]">Add Cancellation Protection for a 80% refund.</div>
                    </div>
                    <button onClick={() => setCancelProtection(p => !p)} className="w-10 h-10 rounded-full bg-[#f5c518] flex items-center justify-center shrink-0">
                      {cancelProtection ? (
                        <svg className="w-5 h-5 text-[#004A97]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#004A97]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14"/></svg>
                      )}
                    </button>
                  </div>
                  {/* Bottom bar: gear icon + Confirm */}
                  <div className="bg-white pt-3 pb-4 px-0 flex items-center gap-3">
                    <button className="w-12 h-12 rounded-full border border-[#cfe0f3] flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-[#5b6b7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    {isMc ? (
                      <button onClick={() => { const isLast = mcEdit ? mcEdit.idx === mcLegs.length - 1 : false; const allComplete = mcLegs.every(l => l.origin && l.destination && l.date); setMcEdit(null); if (isLast && allComplete) setPicker('pax'); }} className="flex-1 bg-[#004A97] text-white rounded-full py-4 text-[16px] font-semibold hover:bg-[#003a78] text-center">{t('common.done')}</button>
                    ) : (
                      <button onClick={() => setPicker('pax')} className="flex-1 bg-[#004A97] text-white rounded-full py-4 text-[16px] font-semibold hover:bg-[#003a78] text-center">Confirm</button>
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Desktop date picker (unchanged) */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  {isMc ? (
                    <span className="text-[15px] font-bold text-[#004A97]">{t('airport.flight')} {mcEdit ? mcEdit.idx + 1 : 1}</span>
                  ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => { setActiveTab('One Way'); setReturnDate(''); }} className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-colors ${activeTab !== 'Round Trip' ? 'bg-[#004A97] text-white' : 'text-[#5b6b7b] hover:bg-[#eef3f8]'}`}>{t('fsr.oneWay')}</button>
                    <button onClick={() => setActiveTab('Round Trip')} className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'Round Trip' ? 'bg-[#004A97] text-white' : 'text-[#5b6b7b] hover:bg-[#eef3f8]'}`}>{t('common.roundTrip')}</button>
                    <div className="relative" ref={calCurrRef2}>
                      <button onClick={() => setCalCurrOpen((v) => !v)} className="flex items-center gap-1 border border-[#cfe0f3] rounded-full px-4 py-2 text-[14px] font-semibold text-[#001326] bg-white hover:bg-[#f4f7fb]">
                        <span>{currency}</span>
                        <svg className={`w-3.5 h-3.5 transition-transform ${calCurrOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {calCurrOpen && (
                        <div className="absolute left-0 top-full mt-2 bg-[#00386f] rounded-xl shadow-lg z-50 min-w-[200px] max-h-[260px] overflow-y-auto">
                          {CURRENCIES.map((c) => (
                            <div key={c.code} onClick={() => { setCurrency(c.code); setCalCurrOpen(false); localStorage.setItem('jz_currency', c.code); }} className="flex items-center gap-2 px-4 py-3 text-white text-sm cursor-pointer hover:bg-[#004a8f] whitespace-nowrap">
                              <span>{c.code} - {c.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={resetDates} className="text-[#004A97] underline text-[14px] font-semibold">{t('airport.resetDates')}</button>
                  </div>
                  )}
                </div>
                <div className="relative flex items-start justify-center gap-16">
                  <button onClick={() => monthShift(-1)} disabled={calMonth <= new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)} className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#cfe0f3] flex items-center justify-center text-[#001326] disabled:opacity-30 bg-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {[0, 1].map((off) => {
                    const m = new Date(calMonth.getFullYear(), calMonth.getMonth() + off, 1);
                    return (
                      <div key={off}>
                        <div className="text-center font-bold text-[#001326] mb-4">{monthLabel(m)}</div>
                        <div className="grid grid-cols-7 gap-y-2 text-center">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (<div key={i} className="text-sm text-[#9aa7b4] font-semibold w-10 mx-auto">{w}</div>))}
                          {monthMatrix(m).map((d, i) => {
                            if (!d) return <div key={i} className="w-10 h-10" />;
                            const iso = fmtISO(d);
                            const past = d < todayStart;
                            const mcLegDate = isMc && mcEdit ? mcLegs[mcEdit.idx]?.date : '';
                            const isDepart = isMc ? iso === mcLegDate : iso === date;
                            const isReturn = !isMc && activeTab === 'Round Trip' && iso === returnDate;
                            const inRange = !isMc && activeTab === 'Round Trip' && returnDate && iso > date && iso < returnDate;
                            return (
                              <button key={i} disabled={past} onClick={() => (isMc ? selectMcDay(d) : selectDay(d))}
                                className={`w-10 h-10 mx-auto rounded-full font-semibold flex items-center justify-center transition-colors ${past ? 'text-[#cdd6df] cursor-not-allowed' : (isDepart || isReturn) ? 'bg-[#1ea7e0] text-white' : inRange ? 'bg-[#d9eefb] text-[#001326]' : 'text-[#001326] hover:bg-[#eef3f8]'}`}>
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => monthShift(1)} className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#cfe0f3] flex items-center justify-center text-[#001326] bg-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="flex justify-center mt-8">
                  {isMc ? (
                    <button onClick={() => { const isLast = mcEdit ? mcEdit.idx === mcLegs.length - 1 : false; const allComplete = mcLegs.every(l => l.origin && l.destination && l.date); setMcEdit(null); if (isLast && allComplete) setPicker('pax'); }} className="bg-[#004A97] text-white rounded-full px-10 py-3 font-semibold hover:bg-[#003a78]">{t('common.done')}</button>
                  ) : (
                    <button onClick={() => setPicker('pax')} className="bg-[#004A97] text-white rounded-full px-10 py-3 font-semibold hover:bg-[#003a78]">{t('common.passenger')} ›</button>
                  )}
                </div>
              </div>
              </>
            )}

            {/* Multi City: ribbon above the passenger card (From / To / Date of
                Flight 1 + Passengers active + Search), matching the original. */}
            {picker === 'pax' && mcMode && (() => {
              const leg = mcLegs[0];
              return (
              <div className="hidden md:flex flex-wrap items-center gap-3 justify-center mb-6">
                <Pill active={false} filled={!!leg?.origin} onClick={() => { setPicker('multicity'); setMcEdit({ idx: 0, field: 'origin' }); setAirportQuery(''); }}>
                  <span aria-hidden>✈️</span>{t('airport.from')} {leg?.origin ? `${cityLabel(leg.origin)}, ${leg.origin}` : '-'}
                </Pill>
                <Pill active={false} filled={!!leg?.destination} onClick={() => { setPicker('multicity'); setMcEdit({ idx: 0, field: 'destination' }); setAirportQuery(''); }}>
                  <span aria-hidden>🛬</span>{t('airport.to')} {leg?.destination ? `${cityLabel(leg.destination)}, ${leg.destination}` : '-'}
                </Pill>
                <Pill active={false} filled={!!leg?.date} onClick={() => { if (leg?.origin && leg?.destination) { setPicker('multicity'); setMcEdit({ idx: 0, field: 'date' }); setCalMonth(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }); } }}>
                  <span aria-hidden>🗓️</span>{leg?.date ? fmtBadge(leg.date) : '-'}
                </Pill>
                <Pill active={true} filled={totalPax > 1 || duoSeat > 0} onClick={() => {}}>
                  <span aria-hidden>👤</span>{totalPax} {totalPax === 1 ? t('common.passenger') : t('common.passengers')}{duoSeat > 0 ? ` + ${duoSeat}` : ''}
                </Pill>
              </div>
              );
            })()}

            {/* ===== PASSENGERS ===== */}
            {picker === 'pax' && (
              <div className="bg-white rounded-2xl shadow-sm px-5 py-4 md:p-8 max-w-[760px] mx-auto flex flex-col" style={{ height: 'calc(100dvh - 80px)' }}>
                {/* New/Saved toggle - full width on mobile like original */}
                <div className="flex justify-center mb-3 md:mb-6 shrink-0">
                  <div className="w-full md:w-auto inline-flex rounded-full border border-[#cfe0f3] p-1">
                    <button onClick={() => setPaxTab('new')} className={`flex-1 md:flex-none px-8 py-2.5 md:py-3 rounded-full text-[15px] md:text-[16px] font-semibold transition-colors ${paxTab === 'new' ? 'bg-[#004A97] text-white' : 'text-[#5b6b7b]'}`}>{t('airport.new')}</button>
                    <button onClick={() => setPaxTab('saved')} className={`flex-1 md:flex-none px-8 py-2.5 md:py-3 rounded-full text-[15px] md:text-[16px] font-semibold transition-colors ${paxTab === 'saved' ? 'bg-[#004A97] text-white' : 'text-[#5b6b7b]'}`}>{t('airport.saved')}</button>
                  </div>
                </div>
                {/* Passenger rows - flex-1 to fill available space */}
                <div className="flex-1 flex flex-col justify-evenly">
                {([
                  { label: t('airport.adult'), sub: t('airport.adultAge'), val: adults, set: setAdults, min: 1 },
                  { label: t('airport.child'), sub: t('airport.childAge'), val: children, set: setChildren, min: 0 },
                  { label: t('airport.infant'), sub: t('airport.infantAge'), val: infants, set: setInfants, min: 0 },
                  { label: t('airport.senior'), sub: t('airport.seniorAge'), val: seniors, set: setSeniors, min: 0 },
                  { label: t('airport.umnr'), sub: t('airport.umnrAge'), val: umnr, set: setUmnr, min: 0 },
                ]).map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 md:py-5 border-b border-[#eef3f8] last:border-0">
                    <div>
                      <div className="font-bold text-[#001326] text-[17px] md:text-base">{row.label}</div>
                      <div className="text-[13px] md:text-sm text-[#9aa7b4]">{row.sub}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => row.set(Math.max(row.min, row.val - 1))} className="w-9 h-9 md:w-9 md:h-9 rounded-full border border-[#cfe0f3] flex items-center justify-center text-[#004A97] text-lg disabled:opacity-30" disabled={row.val <= row.min}>−</button>
                      <span className="w-6 text-center font-bold text-[#001326] text-[18px] md:text-base">{row.val}</span>
                      <button onClick={() => row.set(row.val + 1)} className="w-9 h-9 md:w-9 md:h-9 rounded-full border border-[#cfe0f3] flex items-center justify-center text-[#004A97] text-lg">+</button>
                    </div>
                  </div>
                ))}
                </div>
                {/* Duo Seat card - matches original: dark blue bg, image, full-width button */}
                <div className="shrink-0 mt-3 md:mt-6 bg-[#004A97] rounded-2xl p-4 md:px-6 md:py-4">
                  <div className="flex items-center gap-3">
                    <img src="/jazeera_files/DuoSeat.svg" alt="" className="w-10 h-10 md:hidden rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="text-white flex-1">
                      <div className="font-semibold text-[15px]">{t('airport.duoFree')}</div>
                      <div className="text-[13px] text-[#bcd4ee]">{t('airport.duoSeat')}</div>
                    </div>
                  </div>
                  {duoSeat > 0 ? (
                    <div className="flex items-center justify-center gap-5 mt-3">
                      <button onClick={() => setDuoSeat(Math.max(0, duoSeat - 1))} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#004A97] text-lg">−</button>
                      <span className="w-6 text-center font-bold text-white text-[18px]">{duoSeat}</span>
                      <button onClick={() => setDuoSeat(duoSeat + 1)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#004A97] text-lg">+</button>
                    </div>
                  ) : (
                    <button onClick={() => setDuoSeat(1)} className="w-full md:w-auto border-2 border-white text-white rounded-full px-5 py-3 font-semibold text-[15px] mt-3 md:mt-0 hover:bg-white/10 transition-colors">{t('airport.addDuo')}</button>
                  )}
                </div>
                {/* Search flights button - full width on mobile like original */}
                {!mcMode ? (
                  <div className="shrink-0 mt-4 md:mt-8">
                    <button onClick={() => ready && goToResults()} disabled={!ready} className={`w-full md:w-auto md:mx-auto md:block rounded-full px-10 py-4 text-[17px] md:text-base font-semibold ${ready ? 'bg-[#004A97] text-white hover:bg-[#003a78]' : 'bg-[#cfd8e3] text-white cursor-not-allowed'}`}>{t('airport.searchFlights') || 'Search flights'}</button>
                  </div>
                ) : (
                  <div className="shrink-0 mt-4 md:hidden">
                    <button onClick={() => mcReady && goToMultiCityResults()} disabled={!mcReady} className={`w-full rounded-full px-10 py-4 text-[17px] font-semibold ${mcReady ? 'bg-[#004A97] text-white hover:bg-[#003a78]' : 'bg-[#cfd8e3] text-white cursor-not-allowed'}`}>{t('airport.searchFlights') || 'Search flights'}</button>
                  </div>
                )}
              </div>
            )}

            {/* ===== MULTI CITY: flight cards + Add-a-flight shown below the
                passenger card (matches the original passenger screen) ===== */}
            {picker === 'pax' && mcMode && (
              <div className="mt-6">
                <div className="space-y-4">
                  {mcLegs.map((leg, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[15px] font-bold text-[#004A97]">{t('airport.flight')} {i + 1}</span>
                        {mcLegs.length > 2 && (
                          <button onClick={() => removeLeg(i)} className="w-7 h-7 rounded-full border border-[#cfe0f3] flex items-center justify-center text-[#9aa7b4] hover:text-[#d33] hover:border-[#d33]" aria-label="Remove flight">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <button onClick={() => { setPicker('multicity'); setMcEdit({ idx: i, field: 'origin' }); setAirportQuery(''); }} className="flex-1 min-w-0 rounded-xl border border-[#e1ecf7] px-4 py-3 flex items-center gap-3 text-start hover:border-[#41b4e6] transition-colors">
                          <img src="/jazeera_files/Plane - take off_darkblue.svg" alt="" className="w-6 h-6 shrink-0" />
                          <span className="truncate text-[15px] text-[#001326]">{leg.origin ? `${cityLabel(leg.origin)}, ${leg.origin}` : `${t('airport.from')} -`}</span>
                        </button>
                        <button onClick={() => { setPicker('multicity'); setMcEdit({ idx: i, field: 'destination' }); setAirportQuery(''); }} className="flex-1 min-w-0 rounded-xl border border-[#e1ecf7] px-4 py-3 flex items-center gap-3 text-start hover:border-[#41b4e6] transition-colors">
                          <img src="/jazeera_files/Plane - Landing_darkblue.svg" alt="" className="w-6 h-6 shrink-0" />
                          <span className="truncate text-[15px] text-[#001326]">{leg.destination ? `${cityLabel(leg.destination)}, ${leg.destination}` : `${t('airport.to')} -`}</span>
                        </button>
                        <button onClick={() => { if (leg.origin && leg.destination) { setPicker('multicity'); setMcEdit({ idx: i, field: 'date' }); setCalMonth(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }); } }} className="md:w-[160px] rounded-xl border border-[#e1ecf7] px-4 py-3 flex items-center gap-3 text-start hover:border-[#41b4e6] transition-colors disabled:opacity-50" disabled={!leg.origin || !leg.destination}>
                          <span aria-hidden className="text-[#004A97]">🗓️</span>
                          <span className="text-[15px] text-[#001326]">{leg.date ? fmtBadge(leg.date) : '-'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <button onClick={addLeg} disabled={mcLegs.length >= 5} className={`flex-1 rounded-2xl py-4 flex items-center justify-center gap-3 font-semibold text-white transition-colors ${mcLegs.length >= 5 ? 'bg-[#9bb8d6] cursor-not-allowed' : 'bg-[#004A97] hover:bg-[#003a78]'}`}>
                    <span className="w-7 h-7 rounded-full bg-white text-[#004A97] flex items-center justify-center text-xl leading-none">+</span>
                    {t('airport.addFlight')}
                  </button>
                  <button onClick={() => mcReady && goToMultiCityResults()} disabled={!mcReady} className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${mcReady ? 'bg-[#004A97] text-white hover:bg-[#003a78]' : 'bg-white border border-[#cfe0f3] text-[#9aa7b4] cursor-not-allowed'}`} aria-label={t('airport.search')}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? 'M11 19l-7-7 7-7M4 12h16' : 'M13 5l7 7-7 7M20 12H4'} /></svg>
                  </button>
                </div>
              </div>
            )}
            </div>{/* /constrained content column */}
          </div>
          </div>{/* /flex-1 scroll wrapper */}
        </div>
        );
      })()}
    </div>
  );
};

export default Home;

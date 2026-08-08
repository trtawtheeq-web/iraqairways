import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Lang, translate } from '../lib/i18n';
import { cityName as cityNameI18n, countryName as countryNameI18n, fullAirportName as fullAirportNameI18n } from '../lib/airportNames';

interface LanguageContextValue {
  lang: Lang;
  isAr: boolean;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Translate a dictionary key. */
  t: (key: string) => string;
  /** Localized city name for an IATA code. */
  cityName: (iata: string, fallbackEn: string) => string;
  /** Localized country name for an IATA code. */
  countryName: (iata: string) => string;
  /** Localized full international-airport name for an IATA code. */
  fullAirportName: (iata: string, fallbackEn: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'jz_lang';

// Resolve the language chosen on the static (original Jazeera) landing page.
// IMPORTANT: the landing page's "Choose Preference" modal persists the user's
// real selection in `jzPref` ({lang,curr}) and `jzPrevLang`. It does NOT update
// the legacy `lang` / `jz_lang` keys (they remain stale at their old value).
// Therefore the preference object MUST be read first, otherwise a stale `lang`
// would wrongly win and the booking pages would ignore the landing selection.
function resolveSiteLang(): Lang | null {
  if (typeof window === 'undefined') return null;
  try {
    // Highest priority: the preferences object written by the landing modal.
    const pref = window.localStorage.getItem('jzPref');
    if (pref) {
      const parsed = JSON.parse(pref);
      if (parsed && (parsed.lang === 'ar' || parsed.lang === 'en')) return parsed.lang as Lang;
    }
    // Next: the previous-language marker the landing page also updates (JSON-quoted).
    const prev = (window.localStorage.getItem('jzPrevLang') || '').replace(/"/g, '').trim();
    if (prev === 'ar' || prev === 'en') return prev as Lang;
    // Then the React-managed key.
    const stored = (window.localStorage.getItem(STORAGE_KEY) || '').replace(/"/g, '').trim();
    if (stored === 'ar' || stored === 'en') return stored as Lang;
    // Finally the legacy plain `lang` key.
    const siteLang = (window.localStorage.getItem('lang') || '').replace(/"/g, '').trim();
    if (siteLang === 'ar' || siteLang === 'en') return siteLang as Lang;
  } catch {
    /* ignore */
  }
  return null;
}

function readInitialLang(): Lang {
  return resolveSiteLang() ?? 'ar';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  // Apply lang + dir to <html> whenever the language changes so the whole
  // document (and CSS logical properties) switch to RTL/LTR.
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      // Keep the original-site key in sync so the landing page and the React
      // app never disagree about the current language.
      window.localStorage.setItem('lang', lang);
      window.localStorage.setItem('jzPrevLang', JSON.stringify(lang));
      // Keep the preferences object in sync so all readers agree. Read the
      // currency from either key (`currency` or legacy `curr`) and write both.
      let currency = 'KWD';
      try {
        const pref = window.localStorage.getItem('jzPref');
        if (pref) { const p = JSON.parse(pref); if (p && (p.currency || p.curr)) currency = String(p.currency || p.curr); }
        const cur = window.localStorage.getItem('jz_currency');
        if (cur) currency = cur;
      } catch { /* ignore */ }
      window.localStorage.setItem('jzPref', JSON.stringify({ lang, currency, curr: currency }));
    } catch { /* ignore */ }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((p) => (p === 'ar' ? 'en' : 'ar')), []);

  // Keep the React app in lock-step with the language chosen on the static
  // (original Jazeera) landing page. That page writes the plain `lang` key.
  // When the user returns to a still-mounted React page (SPA navigation,
  // tab focus, or a cross-tab storage event), re-read `lang` and adopt it so
  // the landing-page selection always wins instead of being overwritten.
  useEffect(() => {
    const syncFromStore = () => {
      const resolved = resolveSiteLang();
      if (resolved) {
        setLangState((prev) => (prev === resolved ? prev : resolved));
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncFromStore();
    };
    window.addEventListener('storage', syncFromStore);
    window.addEventListener('focus', syncFromStore);
    window.addEventListener('pageshow', syncFromStore);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', syncFromStore);
      window.removeEventListener('focus', syncFromStore);
      window.removeEventListener('pageshow', syncFromStore);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const t = useCallback((key: string) => translate(key, lang), [lang]);
  const cityName = useCallback((iata: string, fallbackEn: string) => cityNameI18n(iata, fallbackEn, lang), [lang]);
  const countryName = useCallback((iata: string) => countryNameI18n(iata, lang), [lang]);
  const fullAirportName = useCallback((iata: string, fallbackEn: string) => fullAirportNameI18n(iata, fallbackEn, lang), [lang]);

  const value: LanguageContextValue = {
    lang,
    isAr: lang === 'ar',
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    setLang,
    toggleLang,
    t,
    cityName,
    countryName,
    fullAirportName,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback so any component used outside the provider still works.
    return {
      lang: 'en',
      isAr: false,
      dir: 'ltr',
      setLang: () => {},
      toggleLang: () => {},
      t: (k: string) => translate(k, 'en'),
      cityName: (_i: string, f: string) => f,
      countryName: () => '',
      fullAirportName: (_i: string, f: string) => (f ? `${f} International Airport` : ''),
    };
  }
  return ctx;
}

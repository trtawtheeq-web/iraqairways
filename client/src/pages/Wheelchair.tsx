import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useLang } from '../contexts/LanguageContext';
import { formatPrice } from '../lib/currency';

// Price per the original Jazeera flow: KWD 16.000 for wheelchair services.
const WHEELCHAIR_PRICE_KWD = 16;

interface WheelchairOption {
  id: string;
  ar: string;
  en: string;
}

const OPTIONS: WheelchairOption[] = [
  { id: 'WCHR', ar: 'خدمة الكراسي المتحركة', en: 'Wheelchair service' },
  {
    id: 'WCHS',
    ar: 'راكب يستخدم كرسي متحرك للتنقل داخل المطار',
    en: 'Passenger who uses a wheelchair to move within the airport',
  },
  {
    id: 'WCHC',
    ar: 'راكب على كرسي متحرك غير قادر على الحركة تماماً',
    en: 'Passenger on a wheelchair who is completely immobile',
  },
];

const Wheelchair = () => {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { lang } = useLang();
  const ar = lang === 'ar';

  const passengerIndex = (() => {
    const p = new URLSearchParams(search).get('passenger');
    const n = parseInt(p || '0', 10);
    return Number.isNaN(n) ? 0 : n;
  })();

  const [flightData, setFlightData] = useState<any>(null);
  const [wheelchairChecked, setWheelchairChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    const data = localStorage.getItem('selectedFlight');
    if (!data) {
      setLocation('/');
      return;
    }
    try {
      setFlightData(JSON.parse(data));
    } catch {
      setLocation('/');
      return;
    }
    // Restore any previous selection for this passenger.
    try {
      const saved = localStorage.getItem('specialAssistance');
      if (saved) {
        const map = JSON.parse(saved);
        const entry = map[passengerIndex];
        if (entry && entry.optionId) {
          setWheelchairChecked(true);
          setSelectedOption(entry.optionId);
        }
      }
    } catch { /* ignore */ }
  }, [setLocation, passengerIndex]);

  if (!flightData) return null;

  const currency = flightData.currency;
  const origin = flightData.origin || '';
  const destination = flightData.destination || '';

  const handleContinue = () => {
    let map: Record<string, any> = {};
    try {
      const saved = localStorage.getItem('specialAssistance');
      if (saved) map = JSON.parse(saved);
    } catch { /* ignore */ }

    if (wheelchairChecked && selectedOption) {
      const opt = OPTIONS.find((o) => o.id === selectedOption);
      map[passengerIndex] = {
        type: 'wheelchair',
        optionId: selectedOption,
        label: opt ? (ar ? opt.ar : opt.en) : '',
        priceKWD: WHEELCHAIR_PRICE_KWD,
      };
    } else {
      delete map[passengerIndex];
    }
    localStorage.setItem('specialAssistance', JSON.stringify(map));
    setLocation('/passenger-details');
  };

  return (
    <div className="min-h-screen bg-[#EAF1FB] font-avenir pb-24" dir={ar ? 'rtl' : 'ltr'}>
      {/* Mobile Top Bar (Visible only on mobile) */}
      <div className="md:hidden bg-white w-full h-16 flex items-center justify-between px-4 sticky top-0 z-[9999] shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation('/passenger-details')} className="text-[#001d3d]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <img src="/jazeera_files/J920_Logo.svg" alt="Jazeera Airways 20 Years" className="h-10 object-contain" onClick={() => { window.location.href = '/'; }} />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5">
            <img src="/jazeera_files/kw.jpg" alt="Kuwait" className="w-5 h-5 rounded-full object-cover" />
            <span className="text-sm font-medium text-[#001d3d]">KWD</span>
          </button>
          <button className="text-[#001d3d] p-1" aria-label="Menu">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Logo (Hidden on mobile) */}
      <div className="hidden md:flex px-6 pt-5 justify-end">
        <img
          src="/jazeera_files/J920_Logo.svg"
          alt="Jazeera"
          className="h-[70px] cursor-pointer"
          onClick={() => { window.location.href = '/'; }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <main className="max-w-3xl mx-auto px-3 md:px-4 mt-2">
        {/* Title row */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-2">
          <h1 className="text-2xl md:text-5xl font-extrabold text-[#0a72c0] tracking-tight">{ar ? 'مساعدة خاصة' : 'Special assistance'}</h1>
          <button
            onClick={() => setLocation('/passenger-details')}
            className="hidden md:flex w-11 h-11 rounded-full bg-white border border-[#cfe0f3] items-center justify-center text-[#0a72c0] shadow-sm hover:bg-[#f3f8ff] shrink-0"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ar ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} /></svg>
          </button>
        </div>
        <p className="text-center text-[#5b6b7b] text-lg mb-8">{ar ? 'اختر المساعدة المناسبة لك' : 'Choose the assistance that suits you'}</p>

        {/* Wheelchair toggle card */}
        <button
          type="button"
          onClick={() => {
            setWheelchairChecked((v) => {
              const nv = !v;
              if (!nv) setSelectedOption('');
              return nv;
            });
          }}
          dir="ltr"
          className="w-full bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between"
        >
          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${wheelchairChecked ? 'border-[#0a72c0]' : 'border-[#c3cdd8]'}`}>
            {wheelchairChecked && <span className="w-3 h-3 rounded-full bg-[#0a72c0]" />}
          </span>
          <span className="text-xl text-[#0a2540]">{ar ? 'كرسي متحرك' : 'Wheelchair'}</span>
        </button>

        {/* Sub-options shown when wheelchair is selected */}
        {wheelchairChecked && (
          <div className="mt-5">
            <div dir="rtl" className="w-full text-[#0a2540] font-semibold flex items-center justify-start gap-2 mb-3 pr-1">
              <span>{origin}</span>
              <svg className="w-5 h-5 text-[#0a72c0]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L11 19v-5.5z" /></svg>
              <span>{destination}</span>
            </div>
            <div className="space-y-4">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  dir="ltr"
                  className={`w-full bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between gap-4 ${ar ? 'text-right' : 'text-left'}`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedOption === opt.id ? 'border-[#0a72c0]' : 'border-[#c3cdd8]'}`}>
                    {selectedOption === opt.id && <span className="w-3 h-3 rounded-full bg-[#0a72c0]" />}
                  </span>
                  <span className="text-[#0a2540] font-medium whitespace-nowrap">{formatPrice(WHEELCHAIR_PRICE_KWD, currency)}</span>
                  <span className="text-[#0a2540] text-base leading-snug flex-1 text-right">{ar ? opt.ar : opt.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={handleContinue}
            className="bg-[#0a4c95] hover:bg-[#083d7a] text-white rounded-full px-12 md:px-20 py-3 md:py-4 font-bold text-lg md:text-xl shadow-md"
          >
            {ar ? 'تابع' : 'Continue'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Wheelchair;

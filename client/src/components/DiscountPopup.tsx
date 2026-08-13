import { useState, useEffect } from 'react';
import { useLang } from '../contexts/LanguageContext';

export default function DiscountPopup() {
  const { isAr } = useLang();
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // 1. Show popup after 2 seconds
    const showTimer = setTimeout(() => {
      const closed = localStorage.getItem('discountPopupClosed');
      if (!closed) {
        setIsVisible(true);
      }
    }, 2000);

    // 2. Initialize or resume timer
    const storedEnd = localStorage.getItem('discountTimerEnd');
    let endTime: number;

    if (storedEnd) {
      endTime = parseInt(storedEnd, 10);
    } else {
      // Random time between 1 and 8 hours (in milliseconds)
      const randomHours = 1 + Math.random() * 7; 
      endTime = Date.now() + randomHours * 60 * 60 * 1000;
      localStorage.setItem('discountTimerEnd', endTime.toString());
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setIsVisible(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('discountPopupClosed', 'true');
  };

  if (!isVisible || timeLeft <= 0) return null;

  // Format time: HH:MM:SS
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatNum = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border-4 border-[#1B5E20] animate-in zoom-in-95 duration-300">
        
        {/* Header with Green Background */}
        <div className="bg-[#1B5E20] p-8 text-center relative">
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mb-4 flex justify-center">
             <img src="/iraqi_airways/upload/logo.png" alt="Iraqi Airways" className="h-16 w-auto brightness-0 invert" />
          </div>
          
          <h2 className="text-white text-3xl font-black mb-2 tracking-tight">
            {isAr ? 'عرض خاص ومحدود!' : 'Special Limited Offer!'}
          </h2>
          <div className="bg-yellow-400 text-[#1B5E20] inline-block px-4 py-1 rounded-full font-bold text-sm uppercase tracking-widest animate-pulse">
            {isAr ? 'خصم حصري' : 'Exclusive Discount'}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 text-center bg-gradient-to-b from-white to-gray-50">
          <div className="mb-6">
            <span className="text-7xl font-black text-[#1B5E20] leading-none">25%</span>
            <p className="text-xl font-bold text-gray-700 mt-2">
              {isAr ? 'خصم على جميع الرحلات' : 'OFF on all flights'}
            </p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-bold">
              {isAr ? 'ينتهي العرض خلال' : 'Offer ends in'}
            </p>
            <div className="flex justify-center items-center gap-4 text-[#1B5E20]" dir="ltr">
              <div className="flex flex-col">
                <span className="text-4xl font-black tabular-nums">{formatNum(hours)}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">{isAr ? 'ساعة' : 'Hrs'}</span>
              </div>
              <span className="text-3xl font-black mb-4">:</span>
              <div className="flex flex-col">
                <span className="text-4xl font-black tabular-nums">{formatNum(minutes)}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">{isAr ? 'دقيقة' : 'Min'}</span>
              </div>
              <span className="text-3xl font-black mb-4">:</span>
              <div className="flex flex-col">
                <span className="text-4xl font-black tabular-nums">{formatNum(seconds)}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">{isAr ? 'ثانية' : 'Sec'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#1B5E20]/20 transition-all active:scale-95"
          >
            {isAr ? 'احجز الآن واستفد من العرض' : 'Book Now & Save'}
          </button>
          
          <p className="text-gray-400 text-[10px] mt-4">
            {isAr ? '* يخضع العرض للشروط والأحكام' : '* Terms and conditions apply'}
          </p>
        </div>
      </div>
    </div>
  );
}

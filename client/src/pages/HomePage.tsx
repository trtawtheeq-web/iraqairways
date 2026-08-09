import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { jazeeraRoutes } from '../lib/flightEngine';
import { useLang } from '../contexts/LanguageContext';
import { AIRPORT_NAMES } from '../lib/airportNames';
import IraqiHeader from '../components/iraqi/IraqiHeader';
import IraqiFooter from '../components/iraqi/IraqiFooter';

const cities = [
  { iata: 'KWI', city: 'Kuwait' },
  ...jazeeraRoutes.map((r) => ({ iata: r.iata, city: r.city })),
].sort((a, b) => a.city.localeCompare(b.city));

const Home = () => {
  const [, setLocation] = useLocation();
  const { lang, isAr, dir, t, setLang, cityName, countryName, fullAirportName } = useLang();

  // Search form state
  const [tripType, setTripType] = useState<'oneway' | 'round'>('oneway');
  const [origin, setOrigin] = useState('BGW');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [passengerClass, setPassengerClass] = useState('Economy');
  
  // Airport picker
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [airportQuery, setAirportQuery] = useState('');
  
  // Slider
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderImages = [
    '/iraqi_airways/storage/2024_06_24_12034551011_9189561186268301.png',
  ];

  // News ticker
  const newsItems = [
    'الخطوط الجوية العراقية تفعّل خدمة الصعود الإلكتروني وإختيار المقاعد قبل موعد الرحلة.',
    'الخطوط الجوية تعقد اجتماعاً لاستكمال الاستعدادات التشغيلية الخاصة بزيارة الاربعين.',
    'حركة متصاعدة للمسافرين في مطار بغداد الدولي بالتزامن مع توسّع الخطة التشغيلة لشركة الخطوط الجوية العراقية',
  ];
  const [newsIndex, setNewsIndex] = useState(0);

  // Destinations
  const destinations = [
    { title: 'سافر الى العراق', img: '/iraqi_airways/storage/2023_11_30_11909350084.jpg' },
    { title: 'سافر الى اسطنبول', img: '/iraqi_airways/upload/2085170361.jpg' },
    { title: 'سافر الى ماليزيا', img: '/iraqi_airways/storage/2024_01_08_11932929276.png' },
    { title: 'سافر الى كوانجو', img: '/iraqi_airways/storage/2023_11_30_11909341714.jpg' },
    { title: 'سافر الى كوبنهاكن', img: '/iraqi_airways/storage/2023_12_04_11911776644.jpg' },
    { title: 'سافر الى دبــي', img: '/iraqi_airways/storage/2023_11_30_11909368167.jpg' },
  ];

  // Auto news ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % newsItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Airports sorted
  const sortedAirports = useMemo(() => {
    return [...cities].sort((a, b) =>
      cityName(a.iata, a.city).localeCompare(cityName(b.iata, b.city), 'ar'),
    );
  }, [cityName]);

  const filteredAirports = useMemo(() => {
    const q = airportQuery.trim().toLowerCase();
    if (!q) return sortedAirports;
    return sortedAirports.filter((a) => {
      const en = (AIRPORT_NAMES[a.iata]?.cityEn || a.city).toLowerCase();
      const ar = (AIRPORT_NAMES[a.iata]?.cityAr || '').toLowerCase();
      return en.includes(q) || ar.includes(q) || a.iata.toLowerCase().includes(q);
    });
  }, [airportQuery, sortedAirports]);

  const totalPax = adults + children + infants;

  const goToResults = () => {
    if (!origin || !destination || !date) return;
    const ret = tripType === 'round' && returnDate ? `&returnDate=${returnDate}` : '';
    setLocation(`/flight-search?origin=${origin}&destination=${destination}&date=${date}${ret}&passengers=${totalPax}&currency=IQD&tripType=${tripType === 'round' ? 'round' : 'oneway'}`);
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Cairo', sans-serif", direction: 'rtl', background: '#fff' }}>
      {/* Iraqi Header */}
      <IraqiHeader />

      {/* Hero Slider */}
      <div className="ia-hero">
        <img src={sliderImages[sliderIndex]} alt="Iraqi Airways" />
      </div>

      {/* Search Form */}
      <div className="ia-search-container">
        <div className="main-container" style={{ borderRadius: 15, boxShadow: '5px 5px 10px rgba(0,0,0,0.2)', background: '#fff', padding: '50px 20px' }}>
          {/* Trip Type Radio */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 30, marginBottom: 20 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>ذهاب وعودة</span>
              <input type="radio" name="tripType" checked={tripType === 'round'} onChange={() => setTripType('round')} />
            </label>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>ذهاب</span>
              <input type="radio" name="tripType" checked={tripType === 'oneway'} onChange={() => setTripType('oneway')} />
            </label>
          </div>

          {/* Search Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center', direction: 'ltr' }}>
            {/* Search Button */}
            <div style={{ flex: '1 1 150px' }}>
              <button onClick={goToResults} className="ia-btn-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                ابحث
                <img src="/iraqi_airways/search/imgs/search.svg" alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
              </button>
            </div>

            {/* Passengers */}
            <div style={{ flex: '1 1 180px', position: 'relative' }}>
              <div style={{ border: '1px solid #ccc', borderRadius: 10, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/iraqi_airways/search/imgs/customers.svg" alt="" style={{ width: 20 }} />
                <span style={{ fontSize: 14 }}>{totalPax} مسافر / {passengerClass === 'Economy' ? 'الدرجة السياحية' : 'درجة الاعمال'}</span>
              </div>
              <label style={{ position: 'absolute', top: -8, right: 15, background: '#fff', padding: '0 5px', fontSize: 12, color: '#666' }}>عدد المسافرين</label>
            </div>

            {/* Return Date */}
            {tripType === 'round' && (
              <div style={{ flex: '1 1 150px', position: 'relative' }}>
                <div style={{ border: '1px solid #ccc', borderRadius: 10, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 20 }} />
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif" }} />
                </div>
                <label style={{ position: 'absolute', top: -8, right: 15, background: '#fff', padding: '0 5px', fontSize: 12, color: '#666' }}>تاريخ العودة</label>
              </div>
            )}

            {/* Departure Date */}
            <div style={{ flex: '1 1 150px', position: 'relative' }}>
              <div style={{ border: '1px solid #ccc', borderRadius: 10, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 20 }} />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif" }} />
              </div>
              <label style={{ position: 'absolute', top: -8, right: 15, background: '#fff', padding: '0 5px', fontSize: 12, color: '#666' }}>تاريخ المغادرة</label>
            </div>

            {/* Destination */}
            <div style={{ flex: '2 1 250px', position: 'relative' }}>
              <div style={{ border: '1px solid #ccc', borderRadius: 10, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/iraqi_airways/search/imgs/flight-dest.svg" alt="" style={{ width: 20 }} />
                <input
                  type="text"
                  placeholder="الى"
                  value={destination ? `${AIRPORT_NAMES[destination]?.cityAr || destination} | ${AIRPORT_NAMES[destination]?.airportEn || ''} | ${destination}` : ''}
                  onFocus={() => { setShowDestPicker(true); setShowOriginPicker(false); setAirportQuery(''); }}
                  onChange={(e) => setAirportQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif", direction: 'rtl', fontSize: 14 }}
                />
                {/* Interchange icon */}
                <div onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }} style={{ cursor: 'pointer', padding: 5 }}>
                  <img src="/iraqi_airways/search/imgs/interchange.svg" alt="swap" style={{ width: 20 }} />
                </div>
                <img src="/iraqi_airways/search/imgs/flight-dept.svg" alt="" style={{ width: 20 }} />
                <input
                  type="text"
                  placeholder="من"
                  value={origin ? `${AIRPORT_NAMES[origin]?.cityAr || origin} | ${AIRPORT_NAMES[origin]?.airportEn || ''} | ${origin}` : ''}
                  onFocus={() => { setShowOriginPicker(true); setShowDestPicker(false); setAirportQuery(''); }}
                  onChange={(e) => setAirportQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif", direction: 'rtl', fontSize: 14 }}
                />
              </div>
            </div>
          </div>

          {/* Airport Picker Dropdown */}
          {(showOriginPicker || showDestPicker) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 10, maxHeight: 300, overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#12470D' }}>حدد مدينة وجهة الرحلة</div>
              {filteredAirports.map((a) => (
                <div
                  key={a.iata}
                  onClick={() => {
                    if (showOriginPicker) { setOrigin(a.iata); setShowOriginPicker(false); }
                    else { setDestination(a.iata); setShowDestPicker(false); }
                    setAirportQuery('');
                  }}
                  style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span style={{ fontWeight: 'bold', color: '#12470D' }}>{a.iata}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span>{AIRPORT_NAMES[a.iata]?.cityAr || a.city}</span>
                    <div style={{ fontSize: 12, color: '#888' }}>{AIRPORT_NAMES[a.iata]?.airportEn || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* News Ticker */}
      <div className="ia-ticker" style={{ marginTop: 20 }}>
        <div className="bn-label">اخر الأخبار</div>
        <div className="bn-news" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span>{newsItems[newsIndex]}</span>
        </div>
      </div>

      {/* Destinations Grid */}
      <div style={{ height: 20 }} />
      <div className="ia-production">
        {destinations.map((dest, i) => (
          <div key={i} className="ia-production-element">
            <div className="ia-production-element-image">
              <img src={dest.img} alt={dest.title} />
            </div>
            <div className="ia-production-element-description">
              <p>{dest.title}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#eeeff1', padding: '20px 0', textAlign: 'center' }}>
        <div className="ia-more-block">المزيد</div>
      </div>
      <div style={{ height: 100, background: '#eeeff1' }} />

      {/* Second Banner */}
      <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/iraqi_airways/upload/second.jpg" alt="" style={{ width: '100%', height: 'auto' }} />
      </div>

      {/* Spacer */}
      <div style={{ height: 90 }} />

      {/* Video Section - matching original Splide focus:center with autoplay */}
      <div className="ia-video-section">
        {(() => {
          const videos = [
            { img: '/iraqi_airways/storage/2026_04_15_12433697297_2391752756060119.jpg', title: 'حجزك صار أسهل حمل تطبيق الخطوط الجوية العراقية الآن وتابع رحلتك بلمسة واحدة' },
            { img: '/iraqi_airways/storage/2026_04_15_12433695358_5973473661476531.jpg', title: 'مكتب حجز الكاظمية' },
            { img: '/iraqi_airways/storage/2025_11_03_12335171618_4853576864509864.jpg', title: 'إدارة الخطوط الجوية العراقية تعلن وصول دفعة جديدة من المعدات الحديثة' },
            { img: '/iraqi_airways/storage/2024_10_08_12098629634_4391046425986587.jpg', title: 'حجزك صار أسهل حمل تطبيق الخطوط الجوية العراقية' },
            { img: '/iraqi_airways/storage/2024_10_20_12105878050_1691681420242010.jpg', title: 'المنتخب الوطني يثني على جهود الخطوط الجوية العراقية' },
          ];
          // Focus center: middle card biggest, sides smaller
          const getScale = (idx: number) => {
            const center = Math.floor(videos.length / 2);
            const dist = Math.abs(idx - center);
            if (dist === 0) return 1;
            if (dist === 1) return 0.75;
            return 0.6;
          };
          return (
            <div style={{ display: 'flex', gap: 30, padding: '40px 0', alignItems: 'center', justifyContent: 'center' }}>
              {videos.map((video, i) => {
                const scale = getScale(i);
                const width = Math.round(300 * scale);
                return (
                  <div key={i} style={{ width, minWidth: width, background: '#fff', boxShadow: '0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12), 0 3px 1px -2px rgba(0,0,0,0.2)', padding: 5, transition: 'all 0.4s ease' }}>
                    <div style={{ position: 'relative', background: '#f7f7f7' }}>
                      <img src={video.img} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      <a href="#" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                        <img src="/iraqi_airways/img/home-video.svg" alt="play" style={{ width: 55, height: 55, cursor: 'pointer' }} />
                      </a>
                    </div>
                    <div style={{ background: '#fff', padding: '10px 8px', fontSize: 13, textAlign: 'right', minHeight: 45 }}>{video.title}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Spacer before footer */}
      <div style={{ height: 10 }} />

      {/* Iraqi Footer */}
      <IraqiFooter />
    </div>
  );
};

export default Home;

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

      {/* Search Form - matching original exactly */}
      <div className="ia-search-container">
        <div style={{ borderRadius: 15, boxShadow: '5px 5px 10px rgba(0,0,0,0.2)', background: '#fff', padding: '50px 20px', width: '85%', margin: '-160px auto 0', position: 'relative', zIndex: 5 }}>
          {/* Trip Type Radio - right aligned */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginBottom: 25, paddingRight: 10 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              <span>ذهاب وعودة</span>
              <input type="radio" name="tripType" checked={tripType === 'round'} onChange={() => setTripType('round')} style={{ width: 18, height: 18 }} />
            </label>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              <span>ذهاب</span>
              <input type="radio" name="tripType" checked={tripType === 'oneway'} onChange={() => setTripType('oneway')} style={{ width: 18, height: 18 }} />
            </label>
          </div>

          {/* Search Fields Row - LTR order: button | passengers | date | swap+from+to */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', direction: 'ltr' }}>
            {/* Search Button */}
            <button onClick={goToResults} style={{ background: '#135205', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: 15, fontSize: 16, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10, minWidth: 140, justifyContent: 'center' }}>
              ابحث
              <img src="/iraqi_airways/search/imgs/search.svg" alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
            </button>

            {/* Passengers */}
            <div style={{ flex: 1, position: 'relative', border: '1px solid #ccc', borderRadius: 15, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl' }}>
              <img src="/iraqi_airways/search/imgs/customers.svg" alt="" style={{ width: 22 }} />
              <span style={{ fontSize: 13, fontWeight: 'bold' }}>{totalPax} مسافر / الدرجة السياحية</span>
              <label style={{ position: 'absolute', top: -10, right: 55, background: '#fff', padding: '0 5px', fontSize: 11, color: '#666' }}>عدد المسافرين</label>
            </div>

            {/* Departure Date */}
            <div style={{ flex: 1, position: 'relative', border: '1px solid #ccc', borderRadius: 15, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl' }}>
              <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 22 }} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 'bold' }} />
              <label style={{ position: 'absolute', top: -10, right: 55, background: '#fff', padding: '0 5px', fontSize: 11, color: '#666' }}>تاريخ المغادرة</label>
            </div>

            {/* From + Swap + To (combined in one box) */}
            <div style={{ flex: 2, position: 'relative', border: '1px solid #ccc', borderRadius: 15, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl' }}>
              {/* From */}
              <img src="/iraqi_airways/search/imgs/flight-dept.svg" alt="" style={{ width: 22 }} />
              <input
                type="text"
                placeholder="من"
                value={origin ? `${AIRPORT_NAMES[origin]?.cityAr || origin} | ${AIRPORT_NAMES[origin]?.airportEn || ''} | ${origin}` : ''}
                onFocus={() => { setShowOriginPicker(true); setShowDestPicker(false); setAirportQuery(''); }}
                onChange={(e) => setAirportQuery(e.target.value)}
                readOnly
                style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif", direction: 'rtl', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
              />
              {/* Swap */}
              <div onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }} style={{ cursor: 'pointer', background: '#fff', borderRadius: '50%', padding: '6px 8px', border: '1px solid #ddd' }}>
                <img src="/iraqi_airways/search/imgs/interchange.svg" alt="swap" style={{ width: 18 }} />
              </div>
              {/* To */}
              <img src="/iraqi_airways/search/imgs/flight-dest.svg" alt="" style={{ width: 22 }} />
              <input
                type="text"
                placeholder="الى"
                value={destination ? `${AIRPORT_NAMES[destination]?.cityAr || destination} | ${AIRPORT_NAMES[destination]?.airportEn || ''} | ${destination}` : ''}
                onFocus={() => { setShowDestPicker(true); setShowOriginPicker(false); setAirportQuery(''); }}
                onChange={(e) => setAirportQuery(e.target.value)}
                readOnly
                style={{ border: 'none', outline: 'none', flex: 1, fontFamily: "'Cairo', sans-serif", direction: 'rtl', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Airport Picker Dropdown */}
          {(showOriginPicker || showDestPicker) && (
            <div style={{ position: 'absolute', top: '100%', left: '5%', right: '5%', background: '#fff', border: '1px solid #ddd', borderRadius: 10, maxHeight: 300, overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#12470D', textAlign: 'right' }}>حدد مدينة وجهة الرحلة</div>
              {filteredAirports.map((a) => (
                <div
                  key={a.iata}
                  onClick={() => {
                    if (showOriginPicker) { setOrigin(a.iata); setShowOriginPicker(false); }
                    else { setDestination(a.iata); setShowDestPicker(false); }
                    setAirportQuery('');
                  }}
                  style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5', direction: 'rtl' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/iraqi_airways/search/imgs/flight-location.svg" alt="" style={{ width: 16 }} />
                    <span>{AIRPORT_NAMES[a.iata]?.cityAr || a.city}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 'bold', color: '#12470D' }}>{a.iata}</span>
                    <div style={{ fontSize: 11, color: '#888' }}>{AIRPORT_NAMES[a.iata]?.airportEn || ''}</div>
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
        <a href="/destinations" className="ia-more-block" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>المزيد</a>
      </div>
      <div style={{ height: 100, background: '#eeeff1' }} />

      {/* Second Banner */}
      <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/iraqi_airways/upload/second.jpg" alt="" style={{ width: '100%', height: 'auto' }} />
      </div>

      {/* Spacer */}
      <div style={{ height: 90 }} />

      {/* Video Section - Splide-style focus:center carousel with autoplay */}
      {(() => {
        const allVideos = [
          { img: '/iraqi_airways/storage/2026_04_15_12433697297_2391752756060119.jpg', title: 'حجزك صار أسهل حمل تطبيق الخطوط الجوية العراقية الآن وتابع رحلتك بلمسة واحدة' },
          { img: '/iraqi_airways/storage/2026_04_15_12433695358_5973473661476531.jpg', title: 'مكتب حجز الكاظمية' },
          { img: '/iraqi_airways/storage/2025_11_03_12335171618_4853576864509864.jpg', title: 'إدارة الخطوط الجوية العراقية تعلن وصول دفعة جديدة من المعدات الحديثة' },
          { img: '/iraqi_airways/storage/2024_10_08_12098629634_4391046425986587.jpg', title: 'حجزك صار أسهل حمل تطبيق الخطوط الجوية العراقية' },
          { img: '/iraqi_airways/storage/2024_10_20_12105878050_1691681420242010.jpg', title: 'المنتخب الوطني يثني على جهود الخطوط الجوية العراقية' },
          { img: '/iraqi_airways/storage/2024_08_29_12074398287_3260401357336222.jpg', title: 'مدير عام مناف عبد المنعم يعلن عن عودة الطائرة(12)الى الخدمة' },
          { img: '/iraqi_airways/storage/2024_08_22_12070227904_4512744393648033.jpg', title: 'جواً وبراً الخطوط الجوية العراقية تشارك في خدمة قاصدي الإمام الحسين' },
          { img: '/iraqi_airways/storage/2024_08_20_12068985292_8111668314918064.jpg', title: 'تواصل نقل الزائرين العرب والأجانب الى مطارالنجف الأشرف' },
          { img: '/iraqi_airways/storage/2024_07_28_12055083929_7407737584800333.jpg', title: 'جانب من حركة مسافري الناقل الوطني في مطار بغداد الدولي' },
        ];
        const [vidIdx, setVidIdx] = useState(0);
        useEffect(() => {
          const timer = setInterval(() => setVidIdx(prev => (prev + 1) % allVideos.length), 3000);
          return () => clearInterval(timer);
        }, []);
        // Show 5 cards centered on vidIdx
        const getVisible = () => {
          const result = [];
          for (let offset = -2; offset <= 2; offset++) {
            const idx = (vidIdx + offset + allVideos.length) % allVideos.length;
            result.push({ ...allVideos[idx], offset });
          }
          return result;
        };
        const visible = getVisible();
        return (
          <div className="ia-video-section">
            <div style={{ display: 'flex', gap: 20, padding: '40px 0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {visible.map((video, i) => {
                const isCenter = video.offset === 0;
                const isAdj = Math.abs(video.offset) === 1;
                const width = isCenter ? 320 : isAdj ? 210 : 170;
                const imgHeight = isCenter ? 280 : isAdj ? 160 : 130;
                return (
                  <div key={i} style={{ width, minWidth: width, background: '#fff', boxShadow: '0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12), 0 3px 1px -2px rgba(0,0,0,0.2)', padding: 5, transition: 'all 0.5s ease', border: isCenter ? '3px solid #12470D' : 'none' }}>
                    <div style={{ position: 'relative', background: '#f7f7f7', height: imgHeight, overflow: 'hidden' }}>
                      <img src={video.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <a href="#" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                        <img src="/iraqi_airways/img/home-video.svg" alt="play" style={{ width: isCenter ? 60 : 45, height: isCenter ? 60 : 45, cursor: 'pointer' }} />
                      </a>
                    </div>
                    <div style={{ background: '#fff', padding: '8px 5px', fontSize: isCenter ? 14 : 12, textAlign: 'right', minHeight: isCenter ? 55 : 40 }}>{video.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Spacer before footer */}
      <div style={{ height: 10 }} />

      {/* Iraqi Footer */}
      <IraqiFooter />
    </div>
  );
};

export default Home;

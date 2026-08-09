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

      {/* Search Form - using original HTML structure and CSS classes */}
      <div className="main-container mt-5">
        {/* Trip Type Radios */}
        <div className="top-radios-container" style={{ display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
          <label className="label-radio" htmlFor="twoway">ذهاب وعودة</label>
          <input className="flight-radio" type="radio" name="type" id="twoway" checked={tripType === 'round'} onChange={() => setTripType('round')} />
          <label className="label-radio" htmlFor="oneway">ذهاب</label>
          <input className="flight-radio" type="radio" name="type" id="oneway" checked={tripType === 'oneway'} onChange={() => setTripType('oneway')} />
        </div>

        {/* Row - same as original: col-lg-4 (button+passengers) | col-lg-8 (dates + locations) */}
        <div style={{ display: 'flex', direction: 'ltr' }}>
          {/* col-lg-4: Button + Passengers */}
          <div style={{ width: '33.33%', paddingRight: 15 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: '50%' }}>
                <button className="btn-submit" onClick={goToResults}>
                  ابحث
                  <img src="/iraqi_airways/search/imgs/search.svg" alt="" />
                </button>
              </div>
              <div style={{ width: '50%' }}>
                <div className="other-inputs">
                  <input className="other-input" type="text" dir="rtl" value={`${totalPax} مسافر /  الدرجة السياحية`} readOnly style={{ fontSize: 10 }} />
                  <img src="/iraqi_airways/search/imgs/customers.svg" alt="" style={{ width: 22 }} />
                  <label>عدد المسافرين</label>
                </div>
              </div>
            </div>
          </div>

          {/* col-lg-8: Dates + Locations */}
          <div style={{ width: '66.66%' }}>
            <div style={{ display: 'flex', direction: 'ltr' }}>
              {/* col-lg-3: Return Date */}
              {tripType === 'round' && (
                <div style={{ width: '25%', paddingRight: 10 }}>
                  <div className="other-inputs">
                    <span style={{ cursor: 'pointer' }}>
                      <img src="/iraqi_airways/search/imgs/add.svg" alt="" style={{ width: 18 }} />
                    </span>
                    <input className="other-input" type="text" dir="rtl" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} placeholder="mm/dd/yyyy" autoComplete="off" style={{ fontSize: 10 }} />
                    <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 22 }} />
                    <label>تاريخ العودة</label>
                  </div>
                </div>
              )}
              {/* col-lg-3: Departure Date */}
              <div style={{ width: tripType === 'round' ? '25%' : '33%', paddingRight: 10 }}>
                <div className="other-inputs">
                  <span style={{ cursor: 'pointer' }}>
                    <img src="/iraqi_airways/search/imgs/add.svg" alt="" style={{ width: 18 }} />
                  </span>
                  <input className="other-input" type="text" dir="rtl" value={date} onChange={(e) => setDate(e.target.value)} placeholder="mm/dd/yyyy" autoComplete="off" style={{ fontSize: 10 }} />
                  <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 22 }} />
                  <label>تاريخ المغادرة</label>
                </div>
              </div>
              {/* col-lg-6: From + Swap + To */}
              <div style={{ width: tripType === 'round' ? '50%' : '66%' }}>
                <div className="locations-inputs">
                  <div className="input-container">
                    <input
                      type="text"
                      autoComplete="off"
                      dir="rtl"
                      className={`location-input${destination ? ' has-value' : ''}`}
                      value={destination ? `${AIRPORT_NAMES[destination]?.cityAr || destination} | ${AIRPORT_NAMES[destination]?.airportEn || ''} | ${destination}` : ''}
                      onFocus={() => { setShowDestPicker(true); setShowOriginPicker(false); setAirportQuery(''); }}
                      onChange={(e) => setAirportQuery(e.target.value)}
                      readOnly
                      required
                    />
                    <label>الى</label>
                  </div>
                  <img className="flight-svg" src="/iraqi_airways/search/imgs/flight-dest.svg" alt="" style={{ width: 22 }} />
                  <div id="interchange-icon" onClick={() => { const tmp = origin; setOrigin(destination); setDestination(tmp); }}>
                    <img src="/iraqi_airways/search/imgs/interchange.svg" alt="swap" style={{ width: 20, margin: 'auto' }} />
                  </div>
                  <div className="input-container">
                    <input
                      type="text"
                      autoComplete="off"
                      dir="rtl"
                      className={`location-input${origin ? ' has-value' : ''}`}
                      value={origin ? `${AIRPORT_NAMES[origin]?.cityAr || origin} | ${AIRPORT_NAMES[origin]?.airportEn || ''} | ${origin}` : ''}
                      onFocus={() => { setShowOriginPicker(true); setShowDestPicker(false); setAirportQuery(''); }}
                      onChange={(e) => setAirportQuery(e.target.value)}
                      readOnly
                      required
                    />
                    <label>من</label>
                  </div>
                  <img className="flight-svg" src="/iraqi_airways/search/imgs/flight-dept.svg" alt="" style={{ width: 22 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Airport Picker Dropdown */}
        {(showOriginPicker || showDestPicker) && (
          <div className="flight-data-popup-container">
            <div className="flights-data-container">
              <div className="flights-data-header">حدد مدينة وجهة الرحلة</div>
              <div className="flights-data-data">
                {filteredAirports.map((a) => (
                  <div
                    key={a.iata}
                    className="flights-data-data-single"
                    onClick={() => {
                      if (showOriginPicker) { setOrigin(a.iata); setShowOriginPicker(false); }
                      else { setDestination(a.iata); setShowDestPicker(false); }
                      setAirportQuery('');
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="flight-loc-code">{a.iata}</span>
                        <div className="flight-loc-name-english">{AIRPORT_NAMES[a.iata]?.airportEn || ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{AIRPORT_NAMES[a.iata]?.cityAr || a.city}</span>
                        <img className="flight-svg" src="/iraqi_airways/search/imgs/flight-location.svg" alt="" style={{ width: 16, marginRight: 0 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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

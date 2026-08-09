import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { jazeeraRoutes } from '../lib/flightEngine';
import { useLang } from '../contexts/LanguageContext';
import { AIRPORT_NAMES } from '../lib/airportNames';
import IraqiHeader from '../components/iraqi/IraqiHeader';
import IraqiFooter from '../components/iraqi/IraqiFooter';
import OriginalSearchForm from '../components/iraqi/OriginalSearchForm';

const cities = [
  { iata: 'KWI', city: 'Kuwait' },
  ...jazeeraRoutes.map((r) => ({ iata: r.iata, city: r.city })),
].sort((a, b) => a.city.localeCompare(b.city));

const Home = () => {
  const [, setLocation] = useLocation();
  const { lang, isAr, dir, t, setLang, cityName, countryName, fullAirportName } = useLang();

  // Search form state
  const [tripType, setTripType] = useState<'oneway' | 'round'>('round');
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

      {/* Search Form - using original Bootstrap grid structure */}
      <OriginalSearchForm onSearch={(data) => {
        setOrigin(data.origin);
        setDestination(data.destination);
        setDate(data.date);
        setReturnDate(data.returnDate);
        setAdults(data.adults);
        setChildren(data.children);
        setInfants(data.infants);
        setTripType(data.tripType as 'oneway' | 'round');
        goToResults();
      }} />

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

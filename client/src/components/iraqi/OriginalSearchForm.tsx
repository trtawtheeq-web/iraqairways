import { useState, useEffect, useRef } from 'react';
import { AIRPORT_NAMES } from '../../lib/airportNames';
import { jazeeraRoutes } from '../../lib/flightEngine';

const cities = [
  { iata: 'KWI', city: 'Kuwait' },
  ...jazeeraRoutes.map((r) => ({ iata: r.iata, city: r.city })),
].sort((a, b) => a.city.localeCompare(b.city));

interface Props {
  onSearch: (data: { origin: string; destination: string; date: string; returnDate: string; adults: number; children: number; infants: number; tripType: string }) => void;
}

export default function OriginalSearchForm({ onSearch }: Props) {
  const [tripType, setTripType] = useState('round');
  const [origin, setOrigin] = useState('BGW');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [passengerClass, setPassengerClass] = useState('Economy Class - الدرجة السياحية');
  const [showDeptFlights, setShowDeptFlights] = useState(false);
  const [showDestFlights, setShowDestFlights] = useState(false);
  const [showPassengerPopup, setShowPassengerPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const totalPax = adults + children + infants;
  const passengerText = `${totalPax} مسافر /  ${passengerClass.includes('Economy') ? 'الدرجة السياحية' : 'درجة الاعمال'}`;

  const filteredCities = cities.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.iata.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || 
      (AIRPORT_NAMES[c.iata]?.cityAr || '').includes(searchQuery);
  });

  const selectAirport = (iata: string, type: 'dept' | 'dest') => {
    if (type === 'dept') { setOrigin(iata); setShowDeptFlights(false); }
    else { setDestination(iata); setShowDestFlights(false); }
    setSearchQuery('');
  };

  const interchange = () => { const tmp = origin; setOrigin(destination); setDestination(tmp); };

  const handleSearch = () => {
    onSearch({ origin, destination, date: startDate, returnDate: endDate, adults, children, infants, tripType });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowDeptFlights(false); setShowDestFlights(false); setShowPassengerPopup(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDisplayName = (iata: string) => {
    if (!iata) return '';
    const name = AIRPORT_NAMES[iata];
    return name ? `${name.cityAr} | ${name.airportEn} | ${iata}` : iata;
  };

  return (
    <div ref={formRef} className="main-container mt-5 mypagelan_ar">
      <div className="top-radios-container mb-3 text-right">
        <div className="row">
          <div className="col-md-8 col-sm-12"></div>
          <div className="col-sm-6 col-md-2">
            <label className="label-radio" htmlFor="twoway">ذهاب وعودة</label>
            <input className="flight-radio" type="radio" value="round" onChange={() => setTripType('round')} name="type" id="twoway" checked={tripType === 'round'} />
          </div>
          <div className="col-sm-6 col-md-2">
            <label className="label-radio" htmlFor="oneway">ذهاب</label>
            <input className="flight-radio" type="radio" name="type" value="oneway" onChange={() => setTripType('oneway')} id="oneway" checked={tripType === 'oneway'} />
          </div>
        </div>
      </div>

      <div className="row" id="reverse_1">
        <div className="col-lg-4">
          <div className="row" id="reverse_2">
            <div className="col-lg-6">
              <button className="btn-submit" onClick={handleSearch}>
                ابحث
                <img src="/iraqi_airways/search/imgs/search.svg" alt="" />
              </button>
            </div>
            <div className="col-lg-6">
              <div className="other-inputs" onClick={() => setShowPassengerPopup(!showPassengerPopup)}>
                <input className="other-input" type="text" style={{ fontSize: 10 }} dir="rtl" value={passengerText} readOnly />
                <img src="/iraqi_airways/search/imgs/customers.svg" alt="" style={{ width: 22 }} />
                <label style={totalPax ? { top: -12, left: 65, right: 'auto', color: 'black', backgroundColor: '#fff', padding: '0 5px', fontSize: 11 } : {}}>
                  عدد المسافرين
                </label>
              </div>
              {showPassengerPopup && (
                <div className="passenger-selection-popup" style={{ display: 'block' }}>
                  <div className="passenger_selection">
                    {[
                      { label: 'البالغين', sub: '(١٢+)', value: adults, set: setAdults, min: 1 },
                      { label: 'الاطفال', sub: '(٢-١٢)', value: children, set: setChildren, min: 0 },
                      { label: 'الرضع', sub: 'اقل من عامين', value: infants, set: setInfants, min: 0 },
                    ].map((p, i) => (
                      <div className="row mb-3" key={i}>
                        <div className="col-6">
                          <div className="row">
                            <div className="col-4"><span className="inc-dec-btn minus-btn" onClick={() => p.set(Math.max(p.min, p.value - 1))}>–</span></div>
                            <div className="col-4 align-items-center d-flex text-center"><p style={{ margin: '0 auto' }}>{p.value}</p></div>
                            <div className="col-4"><span className="inc-dec-btn plus-btn" onClick={() => p.set(p.value + 1)}>+</span></div>
                          </div>
                        </div>
                        <div className="col-6 psngr-age-section">
                          <div className="psngr-age-arabic">{p.label}</div>
                          <span className="psngr-age-number">{p.sub}</span>
                        </div>
                      </div>
                    ))}
                    <div className="passenger-class text-right">
                      <div className="passenger-class-radio-container">
                        <label htmlFor="bs1" className="cursor-pointer"> الدرجة السياحية</label>
                        <input id="bs1" name="passenger_class" value="Economy Class - الدرجة السياحية" type="radio" onChange={(e) => setPassengerClass(e.target.value)} checked={passengerClass.includes('Economy')} />
                      </div>
                      <div className="passenger-class-radio-container">
                        <label htmlFor="bs2" className="cursor-pointer"> درجة الاعمال</label>
                        <input id="bs2" name="passenger_class" value="Business Class - درجة رجال الأعمال" type="radio" onChange={(e) => setPassengerClass(e.target.value)} checked={passengerClass.includes('Business')} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <button className="btn-submit" onClick={() => setShowPassengerPopup(false)}>
                        ابحث <img src="/iraqi_airways/search/imgs/search.svg" alt="" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-8 order-md-1">
          <div className="row" id="reverse_3">
            {tripType === 'round' && (
              <div className="col-lg-3">
                <div className="other-inputs" id="end_date_container">
                  <span><img src="/iraqi_airways/search/imgs/add.svg" alt="" style={{ width: 18, cursor: 'pointer' }} /></span>
                  <input className="other-input" type="text" dir="rtl" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="mm/dd/yyyy" autoComplete="off" style={{ fontSize: 10 }} />
                  <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 22 }} />
                  <label style={endDate ? { top: -12, left: 65, right: 'auto', color: 'black', backgroundColor: '#fff', padding: '0 5px', fontSize: 11 } : {}}>
                    تاريخ العودة
                  </label>
                </div>
              </div>
            )}
            <div className="col-lg-3">
              <div className="other-inputs">
                <span><img src="/iraqi_airways/search/imgs/add.svg" alt="" style={{ width: 18, cursor: 'pointer' }} /></span>
                <input className="other-input" type="text" dir="rtl" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="mm/dd/yyyy" autoComplete="off" style={{ fontSize: 10 }} />
                <img src="/iraqi_airways/search/imgs/calendar.svg" alt="" style={{ width: 22 }} />
                <label style={startDate ? { top: -12, left: 65, right: 'auto', color: 'black', backgroundColor: '#fff', padding: '0 5px', fontSize: 11 } : {}}>
                  تاريخ المغادرة
                </label>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="row">
                <div className="col-12">
                  <div className="locations-inputs">
                    <div className="input-container">
                      <input
                        type="text"
                        autoComplete="off"
                        dir="rtl"
                        className={`location-input${destination ? ' has-value' : ''}`}
                        value={getDisplayName(destination)}
                        onFocus={() => { setShowDestFlights(true); setShowDeptFlights(false); setSearchQuery(''); }}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        readOnly
                        required
                      />
                      <label>الى</label>
                    </div>
                    <img className="flight-svg" src="/iraqi_airways/search/imgs/flight-dest.svg" alt="" style={{ width: 22 }} />
                    <div id="interchange-icon" onClick={interchange}>
                      <img style={{ margin: 'auto' }} className="flight-svg" src="/iraqi_airways/search/imgs/interchange.svg" alt="" style={{ width: 20 }} />
                    </div>
                    <div className="input-container">
                      <input
                        type="text"
                        autoComplete="off"
                        dir="rtl"
                        className={`location-input${origin ? ' has-value' : ''}`}
                        value={getDisplayName(origin)}
                        onFocus={() => { setShowDeptFlights(true); setShowDestFlights(false); setSearchQuery(''); }}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        readOnly
                        required
                      />
                      <label>من</label>
                    </div>
                    <img className="flight-svg" src="/iraqi_airways/search/imgs/flight-dept.svg" alt="" style={{ width: 22 }} />
                  </div>
                  {(showDeptFlights || showDestFlights) && (
                    <div className="flight-data-popup-container" style={{ display: 'block' }}>
                      <div className="flights-data-container">
                        <div className="flights-data-header">حدد مدينة وجهة الرحلة</div>
                        <div className="flights-data-data">
                          {filteredCities.map((c) => (
                            <div key={c.iata} className="flights-data-data-single" onClick={() => selectAirport(c.iata, showDeptFlights ? 'dept' : 'dest')}>
                              <div className="row">
                                <div className="col-5">
                                  <span className="flight-loc-code">{c.iata}</span>
                                  <div className="flight-loc-name-english">{AIRPORT_NAMES[c.iata]?.airportEn || c.city}</div>
                                </div>
                                <div className="col-7" style={{ textAlign: 'right' }}>
                                  {AIRPORT_NAMES[c.iata]?.cityAr || c.city}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import IraqiHeader from '../components/iraqi/IraqiHeader';
import IraqiFooter from '../components/iraqi/IraqiFooter';

const allDestinations = [
  { title: 'سافر الى كوانجو', img: '/iraqi_airways/storage/2023_11_30_11909341714.jpg', slug: 'guangzhou' },
  { title: 'سافر الى العراق', img: '/iraqi_airways/storage/2023_11_30_11909350084.jpg', slug: 'iraq' },
  { title: 'سافر الى اسطنبول', img: '/iraqi_airways/upload/2085170361.jpg', slug: 'istanbul' },
  { title: 'سافر الى دبــي', img: '/iraqi_airways/storage/2023_11_30_11909368167.jpg', slug: 'dubai' },
  { title: 'سافر الى ماليزيا', img: '/iraqi_airways/storage/2024_01_08_11932929276.png', slug: 'malaysia' },
  { title: 'سافر الى كوبنهاكن', img: '/iraqi_airways/storage/2023_12_04_11911776644.jpg', slug: 'copenhagen' },
];

export default function DestinationsPage() {
  const [search, setSearch] = useState('');

  const filtered = allDestinations.filter(d =>
    d.title.includes(search)
  );

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: 'rtl', background: '#fff', minHeight: '100vh' }}>
      <IraqiHeader />

      {/* Search box */}
      <div style={{ maxWidth: 1200, margin: '30px auto', padding: '0 20px' }}>
        <input
          type="text"
          placeholder="البحث عن العنوان"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '15px 20px',
            border: '1px solid #ccc',
            borderRadius: 5,
            fontSize: 16,
            fontFamily: "'Cairo', sans-serif",
            direction: 'rtl',
            outline: 'none',
          }}
        />
      </div>

      {/* Destinations Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
        {filtered.map((dest, i) => (
          <div key={i} style={{ width: 220, background: '#fff', border: '1px solid #eee', textAlign: 'right', marginBottom: 20 }}>
            <img src={dest.img} alt={dest.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ padding: '10px 15px' }}>
              <p style={{ margin: '10px 0', fontSize: 15, fontWeight: 500 }}>{dest.title}</p>
              <a
                href={`/dest/${dest.slug}`}
                style={{
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 25px',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif",
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                التفاصيل
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Total count */}
      <div style={{ maxWidth: 1200, margin: '20px auto', padding: '0 20px', textAlign: 'right' }}>
        <p style={{ fontSize: 14, color: '#333' }}>مجموع البيانات: {filtered.length}</p>
      </div>

      <IraqiFooter />
    </div>
  );
}

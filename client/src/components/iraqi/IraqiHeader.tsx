import React from 'react';

const navLinks = [
  { label: 'الرئيسية', href: '/' },
  { label: 'الأخبار', href: '#' },
  { label: 'تسجيل الوصول', href: '#' },
  { label: 'أسطولنا', href: '#' },
  { label: 'اتصل بنا', href: '#' },
  { label: 'الوجهات', href: '#' },
  { label: 'عروض السفر', href: '#' },
  { label: 'مكاتب الحجز', href: '#' },
  { label: 'المفقودات', href: '#' },
  { label: 'منح الوكالات', href: '#' },
  { label: 'English', href: '#' },
];

const socialLinks = [
  { icon: '/iraqi_airways/img/facebook.svg', href: 'https://www.facebook.com/iraqi.airways.official/' },
  { icon: '/iraqi_airways/img/instagram.svg', href: 'https://www.instagram.com/iraqi_airways_official/' },
  { icon: '/iraqi_airways/img/twitter-white.svg', href: 'https://twitter.com/iraqiairwayss' },
  { icon: '/iraqi_airways/img/youtube.svg', href: 'https://www.youtube.com/channel/UCXrm6gbI6_CmZZZk6_eItJg' },
  { icon: '/iraqi_airways/img/telegram.svg', href: 'https://t.me/iraqiairways2' },
  { icon: '/iraqi_airways/img/linkedin-white.svg', href: 'https://www.linkedin.com/company/iraqi-airways-company' },
];

export default function IraqiHeader() {
  return (
    <>
      {/* Top Green Banner */}
      <div className="ia-banner">
        <p>الشركـة العامـة للخطوط الجويـة العراقيـة</p>
        <div className="ia-socialMedia">
          {socialLinks.map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">
              <div className="customizeSquare">
                <img src={s.icon} alt="" />
              </div>
            </a>
          ))}
        </div>
        <a href="/">
          <div className="ia-headerLogo">
            <img src="/iraqi_airways/upload/logo-white.jpg" alt="Iraqi Airways" />
          </div>
        </a>
      </div>

      {/* Navigation Menu */}
      <div className="ia-menu">
        <div className="nav-btn">
          <ul>
            {navLinks.map((link, i) => (
              <li key={i} className="nav-link">
                <a href={link.href}><p>{link.label}</p></a>
              </li>
            ))}
          </ul>
        </div>
        <div className="search-box">
          <input type="text" placeholder="البحث في المحتوى" />
          <svg className="search-icon" viewBox="0 0 24 24" fill="#000" style={{ position: 'absolute', width: 30, height: 30, left: 30, top: 16, cursor: 'pointer' }}>
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>
    </>
  );
}

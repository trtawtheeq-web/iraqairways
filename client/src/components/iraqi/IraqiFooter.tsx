import React from 'react';

export default function IraqiFooter() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div style={{ marginTop: 0 }}>
      <div className="ia-footer" style={{ direction: 'rtl', justifyContent: 'space-between', padding: '60px 80px' }}>
        {/* اقسام الموقع - على اليمين */}
        <div className="ia-footer-column" style={{ width: 280 }}>
          <p style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, borderBottom: '2px solid #fff', paddingBottom: 8 }}>اقسام الموقع</p>
          <hr />
          <span>&gt;&gt; <a href="#">أخر الأخبار</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">العروض</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">اتصل بنا</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">الوجهات</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">المناقصات</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">الفديوهات</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">اسـطولنا</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">سياسة الخصوصية</a></span>
          <hr />
          <span>&gt;&gt; <a href="#">ايميل دعم المسافرين</a></span>
        </div>

        {/* عن الشركة - على اليسار */}
        <div className="ia-footer-column" style={{ width: 400 }}>
          <p style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, borderBottom: '2px solid #fff', paddingBottom: 8 }}>عن الشركة</p>
          <hr />
          <p style={{ lineHeight: 2, fontSize: 15 }}>
            الخطوط الجوية العراقية هي الناقل الوطني للعراق ويقع مقرها على أرض مطار بغداد الدولي في بغداد ونحن ثاني أقدم شركة طيران في الشرق الأوسط. وجهات الخطوط الجوية العراقية محلية وعالمية من مقرنا الرئيسي في مطار بغداد الدولي. ان تاريخ تأسيس الخطوط الجوية العراقية منذ اكثر من 77 عاما ولهذا اليوم كانت ومازالت تقدم خدماتها بنجاح وتطور مستمر.
          </p>
          <p style={{ lineHeight: 2, fontSize: 15, marginTop: 10 }}>
            امتداد عالمي وبأيادي محلية.
          </p>
        </div>
      </div>

      {/* Copyright bar - أسود غامق */}
      <div className="ia-footer-copyright" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '20px 30px', minHeight: 70 }}>
        {/* Secure Gateway logo - يسار */}
        <div style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)' }}>
          <img src="/iraqi_airways/img/seal.svg" alt="Secure Gateway" style={{ width: 80, height: 50 }} />
        </div>

        {/* Copyright text - وسط */}
        <p style={{ margin: 0, color: '#ccc', fontSize: 14 }}>Copyright 2023 Iraqi Airways. All Rights Reserved</p>

        {/* Scroll to top - يمين */}
        <div
          onClick={scrollToTop}
          style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 4 }}
        >
          <span style={{ color: '#fff', fontSize: 20, lineHeight: 1 }}>▲</span>
        </div>
      </div>
    </div>
  );
}

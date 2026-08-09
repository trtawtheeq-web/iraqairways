import React from 'react';

export default function IraqiFooter() {
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
        </div>
      </div>

      {/* Copyright bar - أخضر غامق */}
      <div className="ia-footer-copyright">
        <p style={{ margin: 0, color: '#ccc' }}>Copyright 2023 Iraqi Airways. All Rights Reserved</p>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <img src="/iraqi_airways/img/seal.svg" alt="seal" style={{ width: 50, height: 50 }} />
        </div>
      </div>
    </div>
  );
}

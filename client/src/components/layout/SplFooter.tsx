export default function SplFooter() {
  return (
    <footer className="bg-[#143c3c] text-white pt-12 pb-6" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Column 1: سبل */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">سبل</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">عن المؤسسة</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">كلمة معالي الرئيس</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">مجلس الإدارة</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">القادة</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">الهيكل التنظيمي</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">استراتيجية البريد السعودي</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">المسؤولية الاجتماعية</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">محفظة الاستثمارات</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">فروعنا</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">الإستراتيجية والسياسات والأنظمة</a></li>
            </ul>
          </div>

          {/* Column 2: المركز الإعلامي */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">المركز الإعلامي</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">الأخبار</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">الفعاليات</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">الجوائز والإنجازات</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">هوية البريد السعودي</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">التقارير السنوية</a></li>
            </ul>
          </div>

          {/* Column 3: أخرى */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">أخرى</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">التوظيف</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">المنافسات والمناقصات</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">التوعية بالاحتيال</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">البيانات المفتوحة</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">مشاركة البيانات</a></li>
            </ul>
          </div>

          {/* Column 4: مواقع ذات علاقة */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">مواقع ذات علاقة</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">وزارة النقل والخدمات اللوجستية</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">الهيئة العامة للنقل</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">أبشر</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">إرسال</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">ناقل</a></li>
              <li><a href="#" className="hover:underline text-gray-300 hover:text-white">المركز السعودي للأعمال</a></li>
            </ul>
          </div>

          {/* Column 5: Social & Apps */}
          <div>
            {/* Social Media Icons */}
            <div className="flex gap-2 mb-6">
              <a href="#" className="w-10 h-10 bg-[#1f5c5c] rounded-full flex items-center justify-center hover:bg-[#2a7a7a] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-[#1f5c5c] rounded-full flex items-center justify-center hover:bg-[#2a7a7a] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-[#1f5c5c] rounded-full flex items-center justify-center hover:bg-[#2a7a7a] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-[#1f5c5c] rounded-full flex items-center justify-center hover:bg-[#2a7a7a] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-[#1f5c5c] rounded-full flex items-center justify-center hover:bg-[#2a7a7a] transition-colors">
                <span className="font-bold text-lg">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 bg-[#1f5c5c] rounded-full flex items-center justify-center hover:bg-[#2a7a7a] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>

            {/* App Store Buttons */}
            <div className="flex gap-2 mb-6">
              <a href="#" className="block">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-10" />
              </a>
              <a href="#" className="block">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10" />
              </a>
            </div>

            {/* Badges */}
            <div className="flex gap-2 items-center">
              <div className="bg-white rounded px-2 py-1">
                <img src="/images/vat-badge.png" alt="ضريبة القيمة المضافة" className="h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[#1f5c5c] pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Vision 2030 Logo */}
            <div className="flex items-center gap-4">
              <img src="/images/vision-2030.png" alt="رؤية 2030" className="h-12" />
            </div>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-sm text-gray-300">© 2026 جميع الحقوق محفوظة البريد السعودي | سبل</p>
            </div>

            {/* Links */}
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-gray-300 hover:text-white hover:underline">شروط الخدمة</a>
              <a href="#" className="text-gray-300 hover:text-white hover:underline">سياسة الخصوصية</a>
              <a href="#" className="text-gray-300 hover:text-white hover:underline">إشعار الخصوصية</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useLang } from "../contexts/LanguageContext";

interface ServiceFeature {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
}

interface ServiceData {
  title: string;
  titleAr: string;
  tagline: string;
  taglineAr: string;
  heroImage: string;
  description: string;
  descriptionAr: string;
  features: ServiceFeature[];
  price?: string;
  priceAr?: string;
  cta?: string;
  ctaAr?: string;
}

const services: Record<string, ServiceData> = {
  "priority-service": {
    title: "Priority Check-in, Boarding & Baggage",
    titleAr: "أولوية تسجيل الوصول والصعود والأمتعة",
    tagline: "Experience Seamless Travel",
    taglineAr: "استمتع بتجربة سفر سلسة",
    heroImage: "priority-service-2",
    description: "Skip the queues and enjoy a premium travel experience with Jazeera Airways Priority Service. From dedicated check-in counters to priority boarding and baggage handling, we ensure your journey is smooth from start to finish.",
    descriptionAr: "تجاوز الطوابير واستمتع بتجربة سفر مميزة مع خدمة الأولوية من طيران الجزيرة. من كاونترات تسجيل الوصول المخصصة إلى أولوية الصعود واستلام الأمتعة، نضمن لك رحلة سلسة من البداية للنهاية.",
    features: [
      { title: "Priority Check-in", titleAr: "أولوية تسجيل الوصول", description: "Dedicated check-in counters with minimal waiting time, ensuring a swift start to your journey.", descriptionAr: "كاونترات تسجيل وصول مخصصة بأقل وقت انتظار، لبداية سريعة لرحلتك." },
      { title: "Priority Boarding", titleAr: "أولوية الصعود", description: "Be among the first to board the aircraft and settle into your seat comfortably before departure.", descriptionAr: "كن من أوائل الصاعدين للطائرة واستقر في مقعدك براحة قبل الإقلاع." },
      { title: "Priority Baggage", titleAr: "أولوية الأمتعة", description: "Your checked baggage arrives first on the carousel, so you can leave the airport faster.", descriptionAr: "أمتعتك تصل أولاً على السير، عشان تغادر المطار أسرع." },
      { title: "Lounge Access", titleAr: "دخول الصالة", description: "Enjoy complimentary access to our comfortable airport lounge with refreshments and Wi-Fi.", descriptionAr: "استمتع بدخول مجاني لصالة المطار المريحة مع مرطبات وواي فاي." },
    ],
    price: "From KWD 3.500",
    priceAr: "من 3.500 د.ك",
    cta: "Add Priority Service",
    ctaAr: "أضف خدمة الأولوية",
  },
  "cancel-for-any-reason": {
    title: "Cancel for Any Reason",
    titleAr: "إلغاء لأي سبب",
    tagline: "Travel with peace of mind",
    taglineAr: "سافر براحة بال",
    heroImage: "CFAR",
    description: "Life is unpredictable. With our Cancel for Any Reason (CFAR) protection, you can cancel your booking up to 24 hours before departure and receive a full refund as travel credit. No questions asked, no documentation needed.",
    descriptionAr: "الحياة غير متوقعة. مع حماية الإلغاء لأي سبب (CFAR)، تقدر تلغي حجزك قبل 24 ساعة من المغادرة وتحصل على استرداد كامل كرصيد سفر. بدون أسئلة وبدون مستندات.",
    features: [
      { title: "Full Flexibility", titleAr: "مرونة كاملة", description: "Cancel your flight for any reason up to 24 hours before departure — no documentation required.", descriptionAr: "ألغِ رحلتك لأي سبب قبل 24 ساعة من المغادرة — بدون مستندات مطلوبة." },
      { title: "Travel Credit Refund", titleAr: "استرداد كرصيد سفر", description: "Receive 100% of your fare as travel credit valid for 12 months from the date of cancellation.", descriptionAr: "احصل على 100% من أجرتك كرصيد سفر صالح لمدة 12 شهراً من تاريخ الإلغاء." },
      { title: "Easy Process", titleAr: "عملية سهلة", description: "Cancel directly through our website or app with just a few clicks — instant confirmation.", descriptionAr: "ألغِ مباشرة من موقعنا أو التطبيق بضغطات قليلة — تأكيد فوري." },
      { title: "Peace of Mind", titleAr: "راحة بال", description: "Book with confidence knowing you're protected against unexpected changes in your plans.", descriptionAr: "احجز بثقة وأنت عارف إنك محمي ضد التغييرات غير المتوقعة في خططك." },
    ],
    price: "From KWD 5.000",
    priceAr: "من 5.000 د.ك",
    cta: "Add CFAR Protection",
    ctaAr: "أضف حماية الإلغاء",
  },
  "travel-with-pets": {
    title: "Travelling with Animals",
    titleAr: "السفر مع الحيوانات",
    tagline: "Because your pet is family too",
    taglineAr: "لأن حيوانك الأليف جزء من العائلة",
    heroImage: "Travel-with-Pets",
    description: "We understand that your pet is part of the family. Jazeera Airways offers safe and comfortable travel options for your furry companions, whether in the cabin or in the cargo hold, ensuring they arrive happy and healthy.",
    descriptionAr: "نحن نفهم إن حيوانك الأليف جزء من العائلة. طيران الجزيرة يقدم خيارات سفر آمنة ومريحة لرفاقك، سواء في المقصورة أو في عنبر الشحن، لضمان وصولهم سعداء وبصحة جيدة.",
    features: [
      { title: "Cabin Travel", titleAr: "السفر في المقصورة", description: "Small pets (up to 8kg including carrier) can travel in the cabin with you in an approved soft-sided carrier that fits under the seat.", descriptionAr: "الحيوانات الصغيرة (حتى 8 كجم مع الحامل) تقدر تسافر في المقصورة معك في حامل ناعم معتمد يناسب تحت المقعد." },
      { title: "Cargo Hold Travel", titleAr: "السفر في عنبر الشحن", description: "Larger pets travel safely in the temperature-controlled, pressurized cargo hold in airline-approved hard-sided kennels.", descriptionAr: "الحيوانات الأكبر تسافر بأمان في عنبر الشحن المكيف والمضغوط في أقفاص صلبة معتمدة." },
      { title: "Health Requirements", titleAr: "المتطلبات الصحية", description: "Valid health certificate, vaccination records, and import permits (where applicable) must be presented at check-in.", descriptionAr: "يجب تقديم شهادة صحية سارية وسجلات التطعيم وتصاريح الاستيراد (حيث ينطبق) عند تسجيل الوصول." },
      { title: "Booking in Advance", titleAr: "الحجز مسبقاً", description: "Pet travel must be booked at least 48 hours before departure through our call center to ensure availability.", descriptionAr: "يجب حجز سفر الحيوان قبل 48 ساعة على الأقل من المغادرة من خلال مركز الاتصال لضمان التوفر." },
    ],
    price: "From KWD 20.000",
    priceAr: "من 20.000 د.ك",
    cta: "Book Pet Travel",
    ctaAr: "احجز سفر الحيوان",
  },
  "car-parking": {
    title: "Car Parking",
    titleAr: "مواقف السيارات",
    tagline: "Park and fly with ease",
    taglineAr: "اركن وسافر بسهولة",
    heroImage: "Carpark",
    description: "Leave your car in safe hands while you travel. Our convenient car parking service at Kuwait International Airport offers secure, covered parking with easy access to the terminal. Pre-book online for the best rates.",
    descriptionAr: "اترك سيارتك بأيدٍ أمينة وأنت مسافر. خدمة مواقف السيارات في مطار الكويت الدولي توفر مواقف مغطاة وآمنة مع سهولة الوصول للمبنى. احجز أونلاين مسبقاً لأفضل الأسعار.",
    features: [
      { title: "Covered Parking", titleAr: "مواقف مغطاة", description: "Your vehicle is protected from the elements in our covered parking facility adjacent to the terminal.", descriptionAr: "سيارتك محمية من العوامل الجوية في مواقفنا المغطاة المجاورة للمبنى." },
      { title: "24/7 Security", titleAr: "أمن على مدار الساعة", description: "Round-the-clock CCTV surveillance and security patrols ensure your vehicle is safe throughout your trip.", descriptionAr: "مراقبة بالكاميرات ودوريات أمنية على مدار الساعة تضمن سلامة سيارتك طوال رحلتك." },
      { title: "Easy Access", titleAr: "سهولة الوصول", description: "Located just minutes from the terminal with clear signage and a short walk or shuttle to departures.", descriptionAr: "تقع على بعد دقائق من المبنى مع لافتات واضحة ومسافة قصيرة سيراً أو بالحافلة للمغادرة." },
      { title: "Online Booking", titleAr: "الحجز أونلاين", description: "Pre-book your parking space online to guarantee availability and enjoy discounted rates.", descriptionAr: "احجز موقفك أونلاين مسبقاً لضمان التوفر والاستمتاع بأسعار مخفضة." },
    ],
    price: "From KWD 2.000/day",
    priceAr: "من 2.000 د.ك/يوم",
    cta: "Book Parking",
    ctaAr: "احجز موقف",
  },
  "hayakom-service": {
    title: "Hayakom Meet & Assist",
    titleAr: "خدمة هياكم للاستقبال والمساعدة",
    tagline: "Your personal airport assistant",
    taglineAr: "مساعدك الشخصي في المطار",
    heroImage: "hayakomservice_meetassistand",
    description: "Our Hayakom Meet & Assist service provides you with a personal assistant from the moment you arrive at the airport. Whether departing or arriving, our team ensures a seamless, stress-free airport experience.",
    descriptionAr: "خدمة هياكم للاستقبال والمساعدة توفر لك مساعداً شخصياً من لحظة وصولك للمطار. سواء كنت مغادراً أو واصلاً، فريقنا يضمن لك تجربة مطار سلسة وخالية من التوتر.",
    features: [
      { title: "Meet & Greet", titleAr: "الاستقبال والترحيب", description: "A dedicated assistant meets you at the airport entrance (departure) or at the aircraft door (arrival).", descriptionAr: "مساعد مخصص يستقبلك عند مدخل المطار (مغادرة) أو عند باب الطائرة (وصول)." },
      { title: "Fast Track", titleAr: "المسار السريع", description: "Skip the regular queues with expedited immigration, security, and customs clearance.", descriptionAr: "تجاوز الطوابير العادية مع تسريع إجراءات الجوازات والأمن والجمارك." },
      { title: "Baggage Assistance", titleAr: "مساعدة الأمتعة", description: "Your assistant handles your luggage from check-in to the car, or from the carousel to your vehicle.", descriptionAr: "مساعدك يتولى أمتعتك من تسجيل الوصول للسيارة، أو من السير لمركبتك." },
      { title: "VIP Lounge", titleAr: "صالة كبار الشخصيات", description: "Enjoy access to the VIP lounge with premium refreshments while your assistant handles all formalities.", descriptionAr: "استمتع بدخول صالة كبار الشخصيات مع مرطبات فاخرة بينما مساعدك يتولى كل الإجراءات." },
    ],
    price: "From KWD 15.000",
    priceAr: "من 15.000 د.ك",
    cta: "Book Hayakom",
    ctaAr: "احجز هياكم",
  },
  "wheelchair-assistance": {
    title: "Wheelchair Assistance",
    titleAr: "مساعدة الكراسي المتحركة",
    tagline: "Accessible travel for everyone",
    taglineAr: "سفر متاح للجميع",
    heroImage: "wheelchairassistance_fullassistance",
    description: "Jazeera Airways is committed to making air travel accessible for all passengers. Our wheelchair assistance service ensures comfortable and dignified travel for passengers with reduced mobility, from check-in to your final destination.",
    descriptionAr: "طيران الجزيرة ملتزم بجعل السفر الجوي متاحاً لجميع المسافرين. خدمة مساعدة الكراسي المتحركة تضمن سفراً مريحاً وكريماً للمسافرين ذوي الحركة المحدودة، من تسجيل الوصول لوجهتك النهائية.",
    features: [
      { title: "Full Assistance", titleAr: "مساعدة كاملة", description: "Wheelchair assistance from check-in through boarding, during the flight, and upon arrival at your destination.", descriptionAr: "مساعدة بالكرسي المتحرك من تسجيل الوصول خلال الصعود، أثناء الرحلة، وعند الوصول لوجهتك." },
      { title: "Advance Booking", titleAr: "الحجز المسبق", description: "Request wheelchair assistance at least 48 hours before departure to ensure proper arrangements are in place.", descriptionAr: "اطلب مساعدة الكرسي المتحرك قبل 48 ساعة على الأقل من المغادرة لضمان الترتيبات المناسبة." },
      { title: "Onboard Support", titleAr: "الدعم على متن الطائرة", description: "Our trained cabin crew provides attentive care and assistance throughout the flight.", descriptionAr: "طاقم المقصورة المدرب يقدم رعاية ومساعدة حريصة طوال الرحلة." },
      { title: "Complimentary Service", titleAr: "خدمة مجانية", description: "Wheelchair assistance is provided free of charge as part of our commitment to accessible travel.", descriptionAr: "مساعدة الكرسي المتحرك مقدمة مجاناً كجزء من التزامنا بالسفر المتاح للجميع." },
    ],
    cta: "Request Assistance",
    ctaAr: "اطلب المساعدة",
  },
  "unaccompanied-minor": {
    title: "Unaccompanied Minor",
    titleAr: "القاصر غير المصحوب",
    tagline: "Safe travels for young flyers",
    taglineAr: "سفر آمن للمسافرين الصغار",
    heroImage: "UM",
    description: "Sending your child on a flight alone? Our Unaccompanied Minor (UM) service ensures children aged 5-12 travel safely with dedicated care from our trained staff, from check-in to handover at the destination.",
    descriptionAr: "ترسل طفلك بالطائرة لوحده؟ خدمة القاصر غير المصحوب تضمن سفر الأطفال من 5-12 سنة بأمان مع رعاية مخصصة من موظفينا المدربين، من تسجيل الوصول لتسليمه في الوجهة.",
    features: [
      { title: "Dedicated Care", titleAr: "رعاية مخصصة", description: "A trained staff member accompanies your child from check-in, through the flight, and until handover to the designated guardian.", descriptionAr: "موظف مدرب يرافق طفلك من تسجيل الوصول، خلال الرحلة، وحتى تسليمه للوصي المحدد." },
      { title: "Priority Boarding", titleAr: "أولوية الصعود", description: "Unaccompanied minors board first and are seated in a designated area with easy access to cabin crew.", descriptionAr: "القاصرون غير المصحوبين يصعدون أولاً ويجلسون في منطقة مخصصة مع سهولة الوصول لطاقم المقصورة." },
      { title: "In-flight Attention", titleAr: "اهتمام أثناء الرحلة", description: "Cabin crew regularly check on your child, provide meals, and ensure they are comfortable throughout the flight.", descriptionAr: "طاقم المقصورة يتفقد طفلك بانتظام، يقدم الوجبات، ويضمن راحته طوال الرحلة." },
      { title: "Secure Handover", titleAr: "تسليم آمن", description: "At the destination, your child is handed over only to the pre-designated guardian after ID verification.", descriptionAr: "في الوجهة، يُسلَّم طفلك فقط للوصي المحدد مسبقاً بعد التحقق من الهوية." },
    ],
    price: "From KWD 15.000",
    priceAr: "من 15.000 د.ك",
    cta: "Book UM Service",
    ctaAr: "احجز خدمة القاصر",
  },
  "early-check-in": {
    title: "Early Check-in",
    titleAr: "تسجيل وصول مبكر",
    tagline: "Check in early, travel stress-free",
    taglineAr: "سجّل مبكراً، سافر بدون توتر",
    heroImage: "earlycheckin_aboutearlycheckin",
    description: "Don't wait until the last minute. With Early Check-in, you can check in and drop your bags ahead of time, giving you more freedom to explore the airport or simply relax before your flight.",
    descriptionAr: "لا تنتظر لآخر لحظة. مع تسجيل الوصول المبكر، تقدر تسجل وتسلم أمتعتك مسبقاً، مما يمنحك حرية أكثر لاستكشاف المطار أو الاسترخاء قبل رحلتك.",
    features: [
      { title: "Check in Early", titleAr: "سجّل مبكراً", description: "Check in up to 24 hours before the standard check-in window opens, securing your preferred seat.", descriptionAr: "سجّل قبل 24 ساعة من فتح نافذة تسجيل الوصول العادية، واحجز مقعدك المفضل." },
      { title: "Drop Bags Early", titleAr: "سلّم أمتعتك مبكراً", description: "Drop your checked baggage at the counter well in advance and enjoy the airport hands-free.", descriptionAr: "سلّم أمتعتك المسجلة في الكاونتر مسبقاً واستمتع بالمطار بدون أحمال." },
      { title: "Skip the Rush", titleAr: "تجاوز الزحمة", description: "Avoid the busy check-in queues on the day of travel by completing formalities ahead of time.", descriptionAr: "تجنب طوابير تسجيل الوصول المزدحمة يوم السفر بإكمال الإجراءات مسبقاً." },
      { title: "Seat Selection", titleAr: "اختيار المقعد", description: "Early check-in gives you first pick of available seats, including premium positions.", descriptionAr: "تسجيل الوصول المبكر يمنحك الأولوية في اختيار المقاعد المتاحة، بما فيها المواقع المميزة." },
    ],
    price: "From KWD 2.000",
    priceAr: "من 2.000 د.ك",
    cta: "Add Early Check-in",
    ctaAr: "أضف تسجيل وصول مبكر",
  },
  "disruption-assistance": {
    title: "Disruption Assistance",
    titleAr: "مساعدة اضطرابات الرحلات",
    tagline: "We've got you covered when plans change",
    taglineAr: "نحن معك لما تتغير الخطط",
    heroImage: "DisruptionAssistance",
    description: "Flight disruptions happen, but we're here to help. Our Disruption Assistance program ensures you're taken care of with rebooking, accommodation, meals, and compensation when your flight is significantly delayed or cancelled.",
    descriptionAr: "اضطرابات الرحلات تحصل، لكن نحن هنا للمساعدة. برنامج مساعدة الاضطرابات يضمن رعايتك بإعادة الحجز والإقامة والوجبات والتعويض عندما تتأخر رحلتك بشكل كبير أو تُلغى.",
    features: [
      { title: "Automatic Rebooking", titleAr: "إعادة حجز تلقائية", description: "If your flight is cancelled, we automatically rebook you on the next available flight at no extra cost.", descriptionAr: "إذا أُلغيت رحلتك، نعيد حجزك تلقائياً على أقرب رحلة متاحة بدون تكلفة إضافية." },
      { title: "Meal Vouchers", titleAr: "قسائم وجبات", description: "For delays over 3 hours, receive meal vouchers to use at airport restaurants while you wait.", descriptionAr: "للتأخيرات أكثر من 3 ساعات، تحصل على قسائم وجبات لاستخدامها في مطاعم المطار أثناء الانتظار." },
      { title: "Hotel Accommodation", titleAr: "إقامة فندقية", description: "For overnight delays, we arrange and cover hotel accommodation and transport to/from the airport.", descriptionAr: "للتأخيرات الليلية، نرتب ونغطي الإقامة الفندقية والنقل من/إلى المطار." },
      { title: "Communication", titleAr: "التواصل", description: "Stay informed with real-time SMS and email updates about your flight status and rebooking options.", descriptionAr: "ابقَ على اطلاع بتحديثات فورية عبر الرسائل والبريد الإلكتروني عن حالة رحلتك وخيارات إعادة الحجز." },
    ],
    cta: "Learn More",
    ctaAr: "اعرف أكثر",
  },
  "cross-airline-baggage": {
    title: "Cross Airline Baggage",
    titleAr: "أمتعة عبر الخطوط",
    tagline: "Seamless connections, seamless baggage",
    taglineAr: "ربط سلس، أمتعة سلسة",
    heroImage: "CrossAirlineBaggage",
    description: "Connecting to another airline? Our Cross Airline Baggage service allows your checked baggage to be transferred directly to your connecting flight, even if it's with a different carrier. No need to collect and re-check your bags.",
    descriptionAr: "متصل بخطوط طيران أخرى؟ خدمة الأمتعة عبر الخطوط تسمح بنقل أمتعتك المسجلة مباشرة لرحلتك التالية، حتى لو كانت مع ناقل مختلف. بدون حاجة لاستلام وإعادة تسجيل أمتعتك.",
    features: [
      { title: "Through-Check", titleAr: "تسجيل مباشر", description: "Your baggage is checked through to your final destination, even when connecting with partner airlines.", descriptionAr: "أمتعتك تُسجَّل مباشرة لوجهتك النهائية، حتى عند الربط مع خطوط طيران شريكة." },
      { title: "Interline Agreements", titleAr: "اتفاقيات بين الخطوط", description: "We have agreements with multiple airlines to ensure smooth baggage transfers at connecting airports.", descriptionAr: "لدينا اتفاقيات مع خطوط طيران متعددة لضمان نقل سلس للأمتعة في مطارات الربط." },
      { title: "Baggage Tracking", titleAr: "تتبع الأمتعة", description: "Track your baggage throughout the journey with our baggage tracking system for peace of mind.", descriptionAr: "تتبع أمتعتك طوال الرحلة بنظام تتبع الأمتعة لراحة بالك." },
      { title: "Claim Assistance", titleAr: "مساعدة المطالبات", description: "In case of any baggage issues during connections, our team assists with tracing and delivery.", descriptionAr: "في حال أي مشاكل بالأمتعة أثناء الربط، فريقنا يساعد بالتتبع والتوصيل." },
    ],
    cta: "Check Eligibility",
    ctaAr: "تحقق من الأهلية",
  },
};

export default function ServicePage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const service = services[slug];

  if (!service) {
    setLocation('/404');
    return null;
  }

  return (
    <div className={`min-h-screen bg-[#f0f5fc] ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation('/')} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
              <svg className={`w-4 h-4 text-[#004b87] ${isAr ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <img src="/jazeera_files/J920_Logo.svg" alt="Jazeera" className="h-12 cursor-pointer" onClick={() => setLocation('/')} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden">
        <img src={`/jazeera_files/${service.heroImage}`} alt={isAr ? service.titleAr : service.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001d3d]/80 via-[#001d3d]/40 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 text-center text-white px-4">
          <p className="text-lg md:text-xl opacity-90 mb-2">{isAr ? service.taglineAr : service.tagline}</p>
          <h1 className="text-3xl md:text-5xl font-bold">{isAr ? service.titleAr : service.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-4 py-10">
        {/* Description */}
        <p className="text-center text-gray-700 text-base md:text-lg leading-relaxed mb-12">
          {isAr ? service.descriptionAr : service.description}
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {service.features.map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_2px_11px_rgba(0,74,151,0.1)]">
              <div className="w-10 h-10 rounded-full bg-[#004b87]/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#004b87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-[#001d3d] mb-2">{isAr ? feature.titleAr : feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{isAr ? feature.descriptionAr : feature.description}</p>
            </div>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="text-center">
          {service.price && (
            <p className="text-[#004b87] text-xl font-medium mb-4">{isAr ? service.priceAr : service.price}</p>
          )}
          {service.cta && (
            <button
              onClick={() => setLocation('/')}
              className="bg-[#004b87] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-[#003875] transition-colors"
            >
              {isAr ? service.ctaAr : service.cta}
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#001d3d] text-white py-8">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <img src="/jazeera_files/J920_Logo.svg" alt="Jazeera Airways" className="h-10 mx-auto mb-4 brightness-0 invert" />
          <p className="text-sm text-gray-400">{isAr ? '© 2025 طيران الجزيرة. جميع الحقوق محفوظة.' : '© 2025 Jazeera Airways. All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}

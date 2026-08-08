import { useState } from "react";
import { useLocation } from "wouter";
import { useLang } from "../contexts/LanguageContext";

interface FAQ {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

interface InfoSection {
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  image?: string;
}

interface InfoData {
  title: string;
  titleAr: string;
  tagline: string;
  taglineAr: string;
  heroImage: string;
  description: string;
  descriptionAr: string;
  sections: InfoSection[];
  faqs?: FAQ[];
}

const infoPages: Record<string, InfoData> = {
  "baggage-allowance": {
    title: "Baggage Allowance",
    titleAr: "حد الأمتعة",
    tagline: "Everything you need to know about your baggage",
    taglineAr: "كل ما تحتاج معرفته عن أمتعتك",
    heroImage: "Baggage-Allowance",
    description: "Understanding your baggage allowance helps you pack smart and avoid unexpected fees. Here's a complete guide to what you can bring on board and check in when flying with Jazeera Airways.",
    descriptionAr: "فهم حد الأمتعة يساعدك تحزم بذكاء وتتجنب الرسوم غير المتوقعة. هذا دليل كامل لما تقدر تاخذه معك على متن الطائرة وتسجله عند السفر مع طيران الجزيرة.",
    sections: [
      { title: "Cabin Baggage", titleAr: "أمتعة المقصورة", content: "All passengers are allowed one piece of cabin baggage weighing up to 7 kg with maximum dimensions of 55 x 40 x 20 cm. This must fit in the overhead bin or under the seat in front of you. Additionally, you may carry one small personal item such as a handbag, laptop bag, or camera bag.", contentAr: "يُسمح لجميع المسافرين بقطعة واحدة من أمتعة المقصورة بوزن حتى 7 كجم وأبعاد قصوى 55 × 40 × 20 سم. يجب أن تناسب الخزانة العلوية أو تحت المقعد أمامك. بالإضافة لذلك، يمكنك حمل غرض شخصي صغير مثل حقيبة يد أو حقيبة لابتوب أو حقيبة كاميرا." },
      { title: "Checked Baggage", titleAr: "الأمتعة المسجلة", content: "Checked baggage allowance varies by fare type. Basic fare includes no checked baggage. Value fare includes 20 kg. Business fare includes 40 kg. Additional baggage can be purchased online at a discounted rate or at the airport.", contentAr: "حد الأمتعة المسجلة يختلف حسب نوع التذكرة. التذكرة الأساسية لا تشمل أمتعة مسجلة. تذكرة القيمة تشمل 20 كجم. تذكرة رجال الأعمال تشمل 40 كجم. يمكن شراء أمتعة إضافية أونلاين بسعر مخفض أو في المطار." },
      { title: "Extra Baggage", titleAr: "أمتعة إضافية", content: "Need more space? Purchase additional checked baggage in increments of 5 kg, 10 kg, or 15 kg online during booking or through Manage Booking up to 3 hours before departure. Airport rates are higher, so we recommend booking in advance.", contentAr: "تحتاج مساحة أكثر؟ اشترِ أمتعة مسجلة إضافية بزيادات 5 كجم أو 10 كجم أو 15 كجم أونلاين أثناء الحجز أو من خلال إدارة الحجز قبل 3 ساعات من المغادرة. أسعار المطار أعلى، لذا ننصح بالحجز مسبقاً." },
      { title: "Sports Equipment", titleAr: "المعدات الرياضية", content: "Sports equipment such as golf clubs, skis, surfboards, and bicycles can be transported as checked baggage. Standard baggage fees apply based on weight. Items must be properly packed in protective cases.", contentAr: "المعدات الرياضية مثل أدوات الغولف والتزلج وألواح الركمجة والدراجات يمكن نقلها كأمتعة مسجلة. تطبق رسوم الأمتعة العادية حسب الوزن. يجب تغليف الأغراض بشكل صحيح في حقائب واقية." },
      { title: "Restricted Items", titleAr: "الأغراض المحظورة", content: "For safety, certain items are prohibited in both cabin and checked baggage. These include explosives, flammable liquids, sharp objects (cabin only), and lithium batteries over 160Wh. Please check our full restricted items list before packing.", contentAr: "للسلامة، بعض الأغراض محظورة في أمتعة المقصورة والمسجلة. تشمل المتفجرات والسوائل القابلة للاشتعال والأدوات الحادة (المقصورة فقط) وبطاريات الليثيوم أكثر من 160 واط/ساعة. يرجى مراجعة قائمة الأغراض المحظورة الكاملة قبل التحزيم." },
    ],
    faqs: [
      { question: "What is the maximum weight for cabin baggage?", questionAr: "ما هو الوزن الأقصى لأمتعة المقصورة؟", answer: "Cabin baggage must not exceed 7 kg with dimensions of 55 x 40 x 20 cm.", answerAr: "أمتعة المقصورة يجب ألا تتجاوز 7 كجم بأبعاد 55 × 40 × 20 سم." },
      { question: "Can I buy extra baggage at the airport?", questionAr: "هل أقدر أشتري أمتعة إضافية في المطار؟", answer: "Yes, but airport rates are higher. We recommend purchasing extra baggage online during booking or through Manage Booking.", answerAr: "نعم، لكن أسعار المطار أعلى. ننصح بشراء الأمتعة الإضافية أونلاين أثناء الحجز أو من خلال إدارة الحجز." },
      { question: "Are there any free checked baggage options?", questionAr: "هل فيه خيارات أمتعة مسجلة مجانية؟", answer: "Value and Business fares include checked baggage. Basic fares do not include checked baggage but you can purchase it as an add-on.", answerAr: "تذاكر القيمة ورجال الأعمال تشمل أمتعة مسجلة. التذاكر الأساسية لا تشمل أمتعة مسجلة لكن تقدر تشتريها كإضافة." },
      { question: "What happens if my bag is overweight?", questionAr: "شو يصير لو شنطتي زيادة بالوزن؟", answer: "Excess baggage fees apply for bags exceeding your allowance. Fees are charged per kg at the airport check-in counter.", answerAr: "تُطبق رسوم الأمتعة الزائدة للحقائب التي تتجاوز حدك. الرسوم تُحسب لكل كجم في كاونتر تسجيل الوصول بالمطار." },
    ],
  },
  "faqs": {
    title: "Frequently Asked Questions",
    titleAr: "الأسئلة الشائعة",
    tagline: "Find answers to common questions",
    taglineAr: "اعثر على إجابات للأسئلة الشائعة",
    heroImage: "FAQs",
    description: "Got questions? We've got answers. Browse our frequently asked questions to find information about booking, baggage, check-in, and more.",
    descriptionAr: "عندك أسئلة؟ عندنا إجابات. تصفح أسئلتنا الشائعة للعثور على معلومات عن الحجز والأمتعة وتسجيل الوصول والمزيد.",
    sections: [
      { title: "Booking & Payments", titleAr: "الحجز والدفع", content: "You can book flights through our website, mobile app, or by calling our contact center. We accept major credit/debit cards, KNET, and other local payment methods. Bookings can be modified through Manage Booking up to 3 hours before departure.", contentAr: "تقدر تحجز رحلات من موقعنا أو التطبيق أو بالاتصال بمركز الاتصال. نقبل بطاقات الائتمان/الخصم الرئيسية وكي نت وطرق دفع محلية أخرى. يمكن تعديل الحجوزات من خلال إدارة الحجز قبل 3 ساعات من المغادرة." },
      { title: "Check-in", titleAr: "تسجيل الوصول", content: "Online check-in opens 24 hours before departure and closes 3 hours before. Airport check-in counters open 3 hours before departure and close 60 minutes before. We recommend checking in online to save time.", contentAr: "تسجيل الوصول أونلاين يفتح قبل 24 ساعة من المغادرة ويغلق قبل 3 ساعات. كاونترات تسجيل الوصول بالمطار تفتح قبل 3 ساعات وتغلق قبل 60 دقيقة. ننصح بتسجيل الوصول أونلاين لتوفير الوقت." },
      { title: "Baggage", titleAr: "الأمتعة", content: "Cabin baggage allowance is 7 kg for all passengers. Checked baggage varies by fare type. Additional baggage can be purchased online at discounted rates. Visit our Baggage Allowance page for full details.", contentAr: "حد أمتعة المقصورة 7 كجم لجميع المسافرين. الأمتعة المسجلة تختلف حسب نوع التذكرة. يمكن شراء أمتعة إضافية أونلاين بأسعار مخفضة. زر صفحة حد الأمتعة للتفاصيل الكاملة." },
      { title: "Flight Changes & Cancellations", titleAr: "تغيير وإلغاء الرحلات", content: "Flight changes can be made through Manage Booking or our contact center. Change fees may apply depending on your fare type. Cancel for Any Reason (CFAR) protection is available for full flexibility.", contentAr: "يمكن إجراء تغييرات الرحلات من خلال إدارة الحجز أو مركز الاتصال. قد تُطبق رسوم التغيير حسب نوع تذكرتك. حماية الإلغاء لأي سبب (CFAR) متاحة لمرونة كاملة." },
      { title: "Special Assistance", titleAr: "المساعدة الخاصة", content: "We provide wheelchair assistance, unaccompanied minor services, and special meal requests. Please request special assistance at least 48 hours before departure through our contact center or during booking.", contentAr: "نوفر مساعدة الكراسي المتحركة وخدمات القاصر غير المصحوب وطلبات الوجبات الخاصة. يرجى طلب المساعدة الخاصة قبل 48 ساعة على الأقل من المغادرة من خلال مركز الاتصال أو أثناء الحجز." },
    ],
    faqs: [
      { question: "How do I check in online?", questionAr: "كيف أسجل وصول أونلاين؟", answer: "Visit our website or app, go to Check-in, enter your booking reference and last name, then follow the prompts to complete check-in and download your boarding pass.", answerAr: "زر موقعنا أو التطبيق، اذهب لتسجيل الوصول، أدخل رقم الحجز واسم العائلة، ثم اتبع التعليمات لإكمال تسجيل الوصول وتحميل بطاقة الصعود." },
      { question: "Can I change my flight date?", questionAr: "هل أقدر أغير تاريخ رحلتي؟", answer: "Yes, you can change your flight through Manage Booking or our contact center. Change fees and fare differences may apply.", answerAr: "نعم، تقدر تغير رحلتك من خلال إدارة الحجز أو مركز الاتصال. قد تُطبق رسوم التغيير وفروقات الأسعار." },
      { question: "What documents do I need to travel?", questionAr: "شو المستندات اللي أحتاجها للسفر؟", answer: "You need a valid passport (with at least 6 months validity), visa (if required for your destination), and your boarding pass. Some destinations may require additional documents.", answerAr: "تحتاج جواز سفر ساري (بصلاحية 6 أشهر على الأقل)، تأشيرة (إذا مطلوبة لوجهتك)، وبطاقة الصعود. بعض الوجهات قد تتطلب مستندات إضافية." },
      { question: "How do I request a refund?", questionAr: "كيف أطلب استرداد؟", answer: "Refund requests can be submitted through our website under Manage Booking or by contacting our customer service team. Processing time is typically 7-14 business days.", answerAr: "طلبات الاسترداد يمكن تقديمها من موقعنا تحت إدارة الحجز أو بالتواصل مع فريق خدمة العملاء. وقت المعالجة عادة 7-14 يوم عمل." },
    ],
  },
  "careers": {
    title: "Careers at Jazeera Airways",
    titleAr: "وظائف في طيران الجزيرة",
    tagline: "Join our growing team",
    taglineAr: "انضم لفريقنا المتنامي",
    heroImage: "Career",
    description: "Be part of Kuwait's leading low-cost airline. We're always looking for talented, passionate individuals to join our team across various departments. Explore current opportunities and start your aviation career with us.",
    descriptionAr: "كن جزءاً من شركة الطيران الاقتصادي الرائدة في الكويت. نبحث دائماً عن أفراد موهوبين وشغوفين للانضمام لفريقنا في مختلف الأقسام. استكشف الفرص الحالية وابدأ مسيرتك في الطيران معنا.",
    sections: [
      { title: "Why Jazeera Airways?", titleAr: "لماذا طيران الجزيرة؟", content: "Join a dynamic, fast-growing airline that values innovation, teamwork, and excellence. We offer competitive salaries, travel benefits, professional development opportunities, and a diverse, inclusive work environment.", contentAr: "انضم لشركة طيران ديناميكية سريعة النمو تقدّر الابتكار والعمل الجماعي والتميز. نقدم رواتب تنافسية ومزايا سفر وفرص تطوير مهني وبيئة عمل متنوعة وشاملة." },
      { title: "Cabin Crew", titleAr: "طاقم المقصورة", content: "Our cabin crew are the face of Jazeera Airways. If you're passionate about customer service, enjoy travel, and thrive in a dynamic environment, explore our cabin crew opportunities.", contentAr: "طاقم المقصورة هم وجه طيران الجزيرة. إذا كنت شغوفاً بخدمة العملاء وتستمتع بالسفر وتزدهر في بيئة ديناميكية، استكشف فرص طاقم المقصورة لدينا." },
      { title: "Pilots", titleAr: "الطيارون", content: "We're looking for experienced pilots to join our growing fleet. We offer competitive packages, modern aircraft, and excellent working conditions with a focus on safety and professionalism.", contentAr: "نبحث عن طيارين ذوي خبرة للانضمام لأسطولنا المتنامي. نقدم حزم تنافسية وطائرات حديثة وظروف عمل ممتازة مع التركيز على السلامة والاحترافية." },
      { title: "Ground Operations", titleAr: "العمليات الأرضية", content: "From airport operations to customer service, our ground team ensures smooth operations every day. Join us in roles ranging from check-in agents to operations managers.", contentAr: "من عمليات المطار لخدمة العملاء، فريقنا الأرضي يضمن عمليات سلسة كل يوم. انضم لنا في أدوار تتراوح من وكلاء تسجيل الوصول لمديري العمليات." },
      { title: "Corporate", titleAr: "الشركة", content: "Support our airline's growth in roles across finance, marketing, IT, human resources, and more. We offer a professional environment with opportunities for career advancement.", contentAr: "ادعم نمو شركة الطيران في أدوار عبر المالية والتسويق وتكنولوجيا المعلومات والموارد البشرية والمزيد. نقدم بيئة مهنية مع فرص للتقدم الوظيفي." },
    ],
  },
  "jazeera-terminal": {
    title: "Jazeera Terminal (T5)",
    titleAr: "مبنى الجزيرة (T5)",
    tagline: "Your dedicated terminal experience",
    taglineAr: "تجربة مبنى مخصصة لك",
    heroImage: "J9-Terminal-1",
    description: "Jazeera Terminal (T5) at Kuwait International Airport is our dedicated terminal, designed to provide a seamless and comfortable travel experience. From modern facilities to efficient processes, everything is built with our passengers in mind.",
    descriptionAr: "مبنى الجزيرة (T5) في مطار الكويت الدولي هو مبنانا المخصص، مصمم لتوفير تجربة سفر سلسة ومريحة. من المرافق الحديثة للعمليات الفعالة، كل شيء مبني مع مسافرينا في الاعتبار.",
    sections: [
      { title: "Modern Facilities", titleAr: "مرافق حديثة", content: "Terminal 5 features modern architecture, spacious departure halls, comfortable seating areas, and plenty of natural light. The terminal is designed for efficient passenger flow from check-in to boarding.", contentAr: "المبنى 5 يتميز بعمارة حديثة وصالات مغادرة واسعة ومناطق جلوس مريحة وإضاءة طبيعية وفيرة. المبنى مصمم لتدفق فعال للمسافرين من تسجيل الوصول للصعود." },
      { title: "Dining & Shopping", titleAr: "المطاعم والتسوق", content: "Enjoy a variety of dining options from quick bites to sit-down restaurants. Browse duty-free shops offering perfumes, electronics, souvenirs, and more before your flight.", contentAr: "استمتع بتشكيلة من خيارات الطعام من الوجبات السريعة للمطاعم. تصفح محلات السوق الحرة التي تقدم العطور والإلكترونيات والتذكارات والمزيد قبل رحلتك." },
      { title: "Lounges", titleAr: "الصالات", content: "Relax in our comfortable lounges with complimentary refreshments, Wi-Fi, and quiet spaces. Priority service passengers and business class travelers enjoy complimentary lounge access.", contentAr: "استرخِ في صالاتنا المريحة مع مرطبات مجانية وواي فاي ومساحات هادئة. مسافرو خدمة الأولوية ودرجة رجال الأعمال يستمتعون بدخول مجاني للصالة." },
      { title: "Parking", titleAr: "المواقف", content: "Convenient covered parking is available adjacent to the terminal with easy access. Pre-book online for guaranteed spaces and discounted rates.", contentAr: "مواقف مغطاة مريحة متاحة بجوار المبنى مع سهولة الوصول. احجز أونلاين مسبقاً لضمان المكان وأسعار مخفضة." },
      { title: "Getting There", titleAr: "كيف تصل", content: "Terminal 5 is easily accessible by car, taxi, or ride-sharing services. Clear signage directs you from the main airport road to our dedicated terminal entrance.", contentAr: "المبنى 5 يسهل الوصول إليه بالسيارة أو التاكسي أو خدمات النقل التشاركي. لافتات واضحة توجهك من طريق المطار الرئيسي لمدخل مبنانا المخصص." },
    ],
  },
  "seats-offers": {
    title: "Seat Selection",
    titleAr: "اختيار المقعد",
    tagline: "Choose your perfect seat",
    taglineAr: "اختر مقعدك المثالي",
    heroImage: "Seats-offers-1",
    description: "Select your preferred seat and enjoy your flight your way. Whether you prefer extra legroom, a window view, or sitting together with your travel companions, our seat selection options have you covered.",
    descriptionAr: "اختر مقعدك المفضل واستمتع برحلتك على طريقتك. سواء كنت تفضل مساحة أرجل إضافية أو إطلالة من النافذة أو الجلوس مع رفاق سفرك، خيارات اختيار المقعد لدينا تغطيك.",
    sections: [
      { title: "Standard Seats", titleAr: "المقاعد العادية", content: "Choose your preferred standard seat for a comfortable journey. Window seats for views, aisle seats for easy access, or middle seats to stay close to your travel companions.", contentAr: "اختر مقعدك العادي المفضل لرحلة مريحة. مقاعد النافذة للإطلالات، مقاعد الممر لسهولة الوصول، أو المقاعد الوسطى للبقاء قريباً من رفاق سفرك." },
      { title: "Extra Legroom", titleAr: "مساحة أرجل إضافية", content: "Enjoy more space with our extra legroom seats located at emergency exit rows and the front of the cabin. Perfect for taller passengers or those who simply want more comfort.", contentAr: "استمتع بمساحة أكثر مع مقاعد الأرجل الإضافية الموجودة في صفوف مخارج الطوارئ ومقدمة المقصورة. مثالية للمسافرين الأطول أو من يريدون راحة أكثر." },
      { title: "Front Rows", titleAr: "الصفوف الأمامية", content: "Be first off the plane with our front row seats. These premium positions offer quick deplaning and extra space, ideal for business travelers and those with tight connections.", contentAr: "كن أول من ينزل من الطائرة مع مقاعد الصف الأمامي. هذه المواقع المميزة توفر نزولاً سريعاً ومساحة إضافية، مثالية لمسافري الأعمال ومن لديهم ربط ضيق." },
      { title: "Duo Seat", titleAr: "المقعد المزدوج", content: "Keep the seat next to you free for extra space and privacy. The Duo Seat option blocks the adjacent seat, giving you room to spread out and relax during your flight.", contentAr: "أبقِ المقعد بجانبك فارغاً لمساحة وخصوصية إضافية. خيار المقعد المزدوج يحجز المقعد المجاور، مما يمنحك مساحة للتمدد والاسترخاء أثناء رحلتك." },
    ],
  },
  "j-cafe": {
    title: "J-Café",
    titleAr: "جي-كافيه",
    tagline: "Delicious meals at 35,000 feet",
    taglineAr: "وجبات لذيذة على ارتفاع 35,000 قدم",
    heroImage: "J-Cafe-1-1",
    description: "Enjoy a delightful dining experience on board with J-Café. Our menu features a variety of freshly prepared meals, snacks, and beverages to satisfy every taste. Pre-order your meal during booking for the best selection.",
    descriptionAr: "استمتع بتجربة طعام ممتعة على متن الطائرة مع جي-كافيه. قائمتنا تضم تشكيلة من الوجبات المحضرة طازجة والوجبات الخفيفة والمشروبات لإرضاء كل الأذواق. اطلب وجبتك مسبقاً أثناء الحجز لأفضل اختيار.",
    sections: [
      { title: "Pre-Order Meals", titleAr: "الطلب المسبق", content: "Browse our menu and pre-order your preferred meal during booking or through Manage Booking up to 24 hours before departure. Pre-ordering guarantees your first choice and often comes at a discounted price.", contentAr: "تصفح قائمتنا واطلب وجبتك المفضلة مسبقاً أثناء الحجز أو من خلال إدارة الحجز قبل 24 ساعة من المغادرة. الطلب المسبق يضمن اختيارك الأول وغالباً يأتي بسعر مخفض." },
      { title: "Hot Meals", titleAr: "الوجبات الساخنة", content: "Choose from a selection of hot meals including Arabic cuisine, international dishes, and vegetarian options. All meals are freshly prepared and served hot on board.", contentAr: "اختر من تشكيلة وجبات ساخنة تشمل المطبخ العربي والأطباق العالمية والخيارات النباتية. جميع الوجبات محضرة طازجة وتُقدم ساخنة على متن الطائرة." },
      { title: "Snacks & Beverages", titleAr: "الوجبات الخفيفة والمشروبات", content: "Our buy-on-board menu includes sandwiches, salads, chips, chocolates, and a variety of hot and cold beverages including specialty coffees and fresh juices.", contentAr: "قائمة الشراء على متن الطائرة تشمل ساندويتشات وسلطات وشيبس وشوكولاتة ومشروبات ساخنة وباردة متنوعة بما فيها القهوة المختصة والعصائر الطازجة." },
      { title: "Special Dietary Needs", titleAr: "الاحتياجات الغذائية الخاصة", content: "We offer vegetarian, vegan, and halal meal options. For specific dietary requirements or allergies, please contact us at least 48 hours before departure.", contentAr: "نقدم خيارات وجبات نباتية وحلال. للمتطلبات الغذائية الخاصة أو الحساسية، يرجى التواصل معنا قبل 48 ساعة على الأقل من المغادرة." },
    ],
  },
  "cabin-crew-course": {
    title: "Cabin Crew Training Course",
    titleAr: "دورة تدريب طاقم المقصورة",
    tagline: "Launch your career in the skies",
    taglineAr: "أطلق مسيرتك في السماء",
    heroImage: "cabincrewtrainingcourse_whosthiscourse",
    description: "Our comprehensive Cabin Crew Training Course prepares you for an exciting career in aviation. Learn safety procedures, customer service excellence, and everything you need to become a professional cabin crew member.",
    descriptionAr: "دورة تدريب طاقم المقصورة الشاملة تحضّرك لمسيرة مثيرة في الطيران. تعلم إجراءات السلامة والتميز في خدمة العملاء وكل ما تحتاجه لتصبح عضو طاقم مقصورة محترف.",
    sections: [
      { title: "Who's This Course For?", titleAr: "لمن هذه الدورة؟", content: "This course is designed for individuals aged 18-35 who are passionate about aviation and customer service. No prior experience is required — just enthusiasm, a positive attitude, and a desire to travel the world.", contentAr: "هذه الدورة مصممة للأفراد من 18-35 سنة الشغوفين بالطيران وخدمة العملاء. لا تُطلب خبرة سابقة — فقط الحماس والموقف الإيجابي والرغبة في السفر حول العالم." },
      { title: "Course Content", titleAr: "محتوى الدورة", content: "The program covers aviation safety and emergency procedures, first aid, customer service skills, food and beverage service, grooming standards, and airline operations. Both theoretical and practical training are included.", contentAr: "البرنامج يغطي سلامة الطيران وإجراءات الطوارئ والإسعافات الأولية ومهارات خدمة العملاء وخدمة الطعام والمشروبات ومعايير المظهر وعمليات الطيران. يشمل التدريب النظري والعملي." },
      { title: "Duration & Schedule", titleAr: "المدة والجدول", content: "The course runs for 6-8 weeks with full-time attendance required. Classes are held at our training center in Kuwait, equipped with mock-up cabins and the latest training technology.", contentAr: "الدورة تستمر 6-8 أسابيع مع حضور بدوام كامل مطلوب. الحصص تُعقد في مركز التدريب في الكويت، المجهز بمقصورات تدريبية وأحدث تكنولوجيا التدريب." },
      { title: "Career Opportunities", titleAr: "الفرص الوظيفية", content: "Graduates receive a recognized cabin crew certificate and are eligible to apply for cabin crew positions at Jazeera Airways and other airlines worldwide.", contentAr: "الخريجون يحصلون على شهادة طاقم مقصورة معترف بها ويكونون مؤهلين للتقدم لوظائف طاقم المقصورة في طيران الجزيرة وخطوط طيران أخرى حول العالم." },
    ],
  },
  "aviation-course": {
    title: "Launch Your Aviation Journey",
    titleAr: "أطلق رحلتك في الطيران",
    tagline: "Your pathway to an aviation career",
    taglineAr: "طريقك لمسيرة في الطيران",
    heroImage: "launchyouraviationjourney_careerpathway",
    description: "Discover the exciting world of aviation with our comprehensive courses designed to launch your career in the airline industry. From ground operations to flight dispatch, we offer pathways for every aviation enthusiast.",
    descriptionAr: "اكتشف عالم الطيران المثير مع دوراتنا الشاملة المصممة لإطلاق مسيرتك في صناعة الطيران. من العمليات الأرضية لإرسال الرحلات، نقدم مسارات لكل عاشق طيران.",
    sections: [
      { title: "Career Pathways", titleAr: "المسارات الوظيفية", content: "Our aviation courses cover multiple career paths including flight operations, ground handling, airport management, airline marketing, and aviation safety. Choose the path that matches your passion.", contentAr: "دوراتنا في الطيران تغطي مسارات وظيفية متعددة تشمل عمليات الطيران والمناولة الأرضية وإدارة المطارات وتسويق الطيران وسلامة الطيران. اختر المسار الذي يناسب شغفك." },
      { title: "Industry-Recognized Certification", titleAr: "شهادات معترف بها", content: "All our courses are accredited and recognized by aviation authorities. Graduates receive certificates that are valued by airlines and aviation companies worldwide.", contentAr: "جميع دوراتنا معتمدة ومعترف بها من سلطات الطيران. الخريجون يحصلون على شهادات مقدّرة من خطوط الطيران وشركات الطيران حول العالم." },
      { title: "Hands-On Training", titleAr: "تدريب عملي", content: "Learn by doing with practical training at our facilities and partner airports. Get real-world experience that prepares you for immediate employment in the aviation sector.", contentAr: "تعلم بالممارسة مع تدريب عملي في مرافقنا ومطارات شريكة. احصل على خبرة واقعية تحضّرك للتوظيف الفوري في قطاع الطيران." },
      { title: "Placement Support", titleAr: "دعم التوظيف", content: "We provide career guidance, CV preparation, interview coaching, and direct connections to hiring airlines and aviation companies to help you land your dream job.", contentAr: "نقدم إرشاد وظيفي وإعداد السيرة الذاتية وتدريب على المقابلات وربط مباشر بخطوط الطيران وشركات الطيران التي توظف لمساعدتك في الحصول على وظيفة أحلامك." },
    ],
  },
  "graduate-training": {
    title: "Graduate Training Programme",
    titleAr: "برنامج تدريب الخريجين",
    tagline: "Fast-track your aviation career",
    taglineAr: "سرّع مسيرتك في الطيران",
    heroImage: "Graduate_training",
    description: "Our Graduate Training Programme is designed for recent university graduates looking to build a career in the airline industry. This intensive program provides rotational experience across key departments, mentorship, and a clear path to leadership.",
    descriptionAr: "برنامج تدريب الخريجين مصمم لخريجي الجامعات الجدد الراغبين في بناء مسيرة في صناعة الطيران. هذا البرنامج المكثف يوفر خبرة تناوبية عبر الأقسام الرئيسية وإرشاد ومسار واضح للقيادة.",
    sections: [
      { title: "Programme Structure", titleAr: "هيكل البرنامج", content: "The 12-month programme includes rotations across commercial, operations, finance, and customer experience departments. Each rotation lasts 3 months, giving you comprehensive exposure to airline operations.", contentAr: "البرنامج مدته 12 شهراً يشمل تناوبات عبر أقسام التجارة والعمليات والمالية وتجربة العملاء. كل تناوب يستمر 3 أشهر، مما يمنحك تعرضاً شاملاً لعمليات الطيران." },
      { title: "Eligibility", titleAr: "الأهلية", content: "Open to graduates with a bachelor's degree (any discipline) who have graduated within the last 2 years. Strong communication skills, leadership potential, and a passion for aviation are essential.", contentAr: "مفتوح لحملة البكالوريوس (أي تخصص) الذين تخرجوا خلال آخر سنتين. مهارات تواصل قوية وإمكانات قيادية وشغف بالطيران ضرورية." },
      { title: "Mentorship", titleAr: "الإرشاد", content: "Each graduate is paired with a senior leader who provides guidance, feedback, and career advice throughout the programme. Regular check-ins ensure your development stays on track.", contentAr: "كل خريج يُقرن بقائد أقدم يقدم التوجيه والملاحظات والنصائح المهنية طوال البرنامج. متابعات منتظمة تضمن بقاء تطورك على المسار." },
      { title: "Career Progression", titleAr: "التقدم الوظيفي", content: "Upon successful completion, graduates are placed in a permanent role matching their strengths and interests. Many of our current managers started through this programme.", contentAr: "عند الإكمال الناجح، يُوظف الخريجون في دور دائم يتناسب مع نقاط قوتهم واهتماماتهم. كثير من مديرينا الحاليين بدأوا من خلال هذا البرنامج." },
    ],
  },
  "visa-information": {
    title: "Visa Information",
    titleAr: "معلومات التأشيرة",
    tagline: "Travel documentation made easy",
    taglineAr: "وثائق السفر بسهولة",
    heroImage: "Visa-Information-1",
    description: "Planning your trip? Make sure you have the right travel documents. Check visa requirements for your destination and ensure your passport meets validity requirements before you fly.",
    descriptionAr: "تخطط لرحلتك؟ تأكد إن عندك وثائق السفر الصحيحة. تحقق من متطلبات التأشيرة لوجهتك وتأكد إن جوازك يستوفي متطلبات الصلاحية قبل ما تسافر.",
    sections: [
      { title: "Visa Requirements", titleAr: "متطلبات التأشيرة", content: "Visa requirements vary by destination and nationality. We recommend checking with the embassy or consulate of your destination country well in advance of your travel date.", contentAr: "متطلبات التأشيرة تختلف حسب الوجهة والجنسية. ننصح بالتحقق مع سفارة أو قنصلية بلد وجهتك قبل تاريخ سفرك بوقت كافٍ." },
      { title: "Passport Validity", titleAr: "صلاحية الجواز", content: "Most countries require your passport to be valid for at least 6 months beyond your intended stay. Ensure your passport has enough blank pages for entry stamps.", contentAr: "معظم الدول تتطلب أن يكون جوازك ساري لمدة 6 أشهر على الأقل بعد إقامتك المقصودة. تأكد إن جوازك فيه صفحات فارغة كافية لأختام الدخول." },
      { title: "Transit Visas", titleAr: "تأشيرات العبور", content: "If you're connecting through a third country, you may need a transit visa. Check requirements for all countries in your itinerary, including transit points.", contentAr: "إذا كنت تمر عبر بلد ثالث، قد تحتاج تأشيرة عبور. تحقق من المتطلبات لجميع الدول في مسار رحلتك، بما فيها نقاط العبور." },
      { title: "Visa on Arrival", titleAr: "التأشيرة عند الوصول", content: "Some destinations offer visa on arrival for certain nationalities. Check eligibility and requirements before traveling, as conditions may change.", contentAr: "بعض الوجهات تقدم تأشيرة عند الوصول لجنسيات معينة. تحقق من الأهلية والمتطلبات قبل السفر، لأن الشروط قد تتغير." },
    ],
  },
  "meet-greet": {
    title: "Meet & Greet",
    titleAr: "الاستقبال والترحيب",
    tagline: "VIP treatment from arrival to departure",
    taglineAr: "معاملة كبار الشخصيات من الوصول للمغادرة",
    heroImage: "Meet-Greet-icon",
    description: "Experience VIP treatment with our Meet & Greet service. A personal assistant welcomes you at the airport and guides you through all formalities, ensuring a smooth and luxurious travel experience.",
    descriptionAr: "اختبر معاملة كبار الشخصيات مع خدمة الاستقبال والترحيب. مساعد شخصي يرحب بك في المطار ويرشدك خلال جميع الإجراءات، لضمان تجربة سفر سلسة وفاخرة.",
    sections: [
      { title: "Arrival Service", titleAr: "خدمة الوصول", content: "Your personal assistant meets you at the aircraft door, assists with immigration and customs, collects your baggage, and escorts you to your vehicle or lounge.", contentAr: "مساعدك الشخصي يستقبلك عند باب الطائرة، يساعدك بالجوازات والجمارك، يجمع أمتعتك، ويرافقك لمركبتك أو الصالة." },
      { title: "Departure Service", titleAr: "خدمة المغادرة", content: "From the moment you arrive at the airport, your assistant handles check-in, guides you through security, and escorts you to the lounge or directly to your gate.", contentAr: "من لحظة وصولك للمطار، مساعدك يتولى تسجيل الوصول، يرشدك خلال الأمن، ويرافقك للصالة أو مباشرة لبوابتك." },
      { title: "Transit Service", titleAr: "خدمة العبور", content: "For connecting flights, your assistant meets you upon arrival and guides you through the transit process to your next gate, handling any formalities along the way.", contentAr: "للرحلات المتصلة، مساعدك يستقبلك عند الوصول ويرشدك خلال عملية العبور لبوابتك التالية، متولياً أي إجراءات في الطريق." },
      { title: "Booking", titleAr: "الحجز", content: "Book Meet & Greet service at least 24 hours before your flight through our website, app, or contact center. Available at selected airports.", contentAr: "احجز خدمة الاستقبال والترحيب قبل 24 ساعة على الأقل من رحلتك من موقعنا أو التطبيق أو مركز الاتصال. متاحة في مطارات مختارة." },
    ],
  },
};

export default function InfoPage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const info = infoPages[slug];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!info) {
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
      <div className="relative h-[250px] md:h-[400px] overflow-hidden">
        <img src={`/jazeera_files/${info.heroImage}`} alt={isAr ? info.titleAr : info.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001d3d]/80 via-[#001d3d]/40 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 text-center text-white px-4">
          <p className="text-lg md:text-xl opacity-90 mb-2">{isAr ? info.taglineAr : info.tagline}</p>
          <h1 className="text-3xl md:text-5xl font-bold">{isAr ? info.titleAr : info.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-4 py-10">
        {/* Description */}
        <p className="text-center text-gray-700 text-base md:text-lg leading-relaxed mb-12">
          {isAr ? info.descriptionAr : info.description}
        </p>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {info.sections.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_2px_11px_rgba(0,74,151,0.08)]">
              <h3 className="text-xl font-semibold text-[#001d3d] mb-3">{isAr ? section.titleAr : section.title}</h3>
              <p className="text-gray-600 leading-relaxed">{isAr ? section.contentAr : section.content}</p>
              {section.image && (
                <img src={`/jazeera_files/${section.image}`} alt={isAr ? section.titleAr : section.title} className="w-full h-[200px] object-cover rounded-xl mt-4" />
              )}
            </div>
          ))}
        </div>

        {/* FAQs */}
        {info.faqs && info.faqs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-medium text-[#004b87] mb-6 text-center">{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h2>
            <div className="space-y-3">
              {info.faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-[#001d3d]">{isAr ? faq.questionAr : faq.question}</span>
                    <svg className={`w-5 h-5 text-[#004b87] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-gray-600">{isAr ? faq.answerAr : faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => setLocation('/')}
            className="bg-[#004b87] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-[#003875] transition-colors"
          >
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
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

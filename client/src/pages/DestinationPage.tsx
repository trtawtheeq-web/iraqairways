import { useLocation } from "wouter";
import { useLang } from "../contexts/LanguageContext";
import { useState, useEffect, useRef } from "react";

interface Attraction {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  image: string;
}

interface DestinationData {
  city: string;
  cityAr: string;
  iata: string;
  tagline: string;
  taglineAr: string;
  heroImage: string;
  description: string;
  descriptionAr: string;
  thingsToDo: string;
  thingsToDoAr: string;
  attractions: Attraction[];
  retailGems?: Attraction[];
}

const CURRENCIES: { code: string; label: string; flag: string }[] = [
  { code: 'USD', label: 'US Dollars (USD)', flag: 'us' },
  { code: 'AED', label: 'UAE Dirham (AED)', flag: 'ae' },
  { code: 'BHD', label: 'Bahraini Dinar (BHD)', flag: 'bh' },
  { code: 'EGP', label: 'Egyptian Pound (EGP)', flag: 'eg' },
  { code: 'EUR', label: 'Euro (EUR)', flag: 'eu' },
  { code: 'GBP', label: 'Sterling (GBP)', flag: 'gb' },
  { code: 'INR', label: 'Indian Rupee (INR)', flag: 'in' },
  { code: 'JOD', label: 'Jordanian Dinar (JOD)', flag: 'jo' },
  { code: 'KWD', label: 'Kuwaiti Dinar (KWD)', flag: 'kw' },
  { code: 'LKR', label: 'Sri Lankan Rupee (LKR)', flag: 'lk' },
  { code: 'OMR', label: 'Omani Rial (OMR)', flag: 'om' },
  { code: 'QAR', label: 'Qatari Riyal (QAR)', flag: 'qa' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)', flag: 'sa' },
];

// All destination data with Arabic translations
const destinations: Record<string, DestinationData> = {
  budapest: {
    city: "Budapest",
    cityAr: "بودابست",
    iata: "BUD",
    tagline: "Where history meets vibrant nightlife",
    taglineAr: "حيث يلتقي التاريخ بالحياة الليلية النابضة",
    heroImage: "Budapest_EN",
    description: "Welcome to Budapest, Hungary's stunning capital straddling the Danube River. Whether you're soaking in thermal baths, exploring grand architecture, or enjoying the ruin bars, this city offers an unforgettable mix of old-world charm and modern energy. Book your flights to Budapest and discover one of Europe's most captivating cities.",
    descriptionAr: "مرحباً بك في بودابست، عاصمة المجر المذهلة على ضفاف نهر الدانوب. سواء كنت تستمتع بالحمامات الحرارية، أو تستكشف العمارة الفخمة، أو تستمتع بالحانات التاريخية، هذه المدينة تقدم مزيجاً لا يُنسى من سحر العالم القديم والطاقة الحديثة. احجز رحلاتك إلى بودابست واكتشف واحدة من أكثر مدن أوروبا جاذبية.",
    thingsToDo: "Things to do in Budapest",
    thingsToDoAr: "أنشطة في بودابست",
    attractions: [
      { name: "Buda Castle", nameAr: "قلعة بودا", description: "Perched on Castle Hill, this UNESCO World Heritage site offers panoramic views of the city and houses the Hungarian National Gallery and Budapest History Museum.", descriptionAr: "تقع على تل القلعة، هذا الموقع المدرج في قائمة اليونسكو للتراث العالمي يوفر إطلالات بانورامية على المدينة ويضم المعرض الوطني المجري ومتحف تاريخ بودابست.", image: "Budapest_EN" },
      { name: "Széchenyi Thermal Bath", nameAr: "حمام سيتشيني الحراري", description: "One of Europe's largest public thermal baths, featuring stunning Neo-Baroque architecture and 18 pools fed by natural hot springs.", descriptionAr: "أحد أكبر الحمامات الحرارية العامة في أوروبا، يتميز بعمارة نيو-باروكية مذهلة و18 حوضاً تغذيها ينابيع حرارية طبيعية.", image: "Budapest_EN" },
      { name: "Parliament Building", nameAr: "مبنى البرلمان", description: "This iconic Gothic Revival masterpiece along the Danube is Hungary's largest building and a symbol of the nation's rich political history.", descriptionAr: "هذه التحفة القوطية الأيقونية على ضفاف الدانوب هي أكبر مبنى في المجر ورمز لتاريخها السياسي الغني.", image: "Budapest_EN" },
    ],
    retailGems: [
      { name: "Great Market Hall", nameAr: "قاعة السوق الكبرى", description: "Budapest's largest and oldest indoor market, perfect for picking up Hungarian paprika, handcrafted souvenirs, and local street food.", descriptionAr: "أكبر وأقدم سوق مغطى في بودابست، مثالي لشراء البابريكا المجرية والهدايا التذكارية المصنوعة يدوياً والطعام المحلي.", image: "Budapest_EN" },
    ],
  },
  krakow: {
    city: "Krakow",
    cityAr: "كراكوف",
    iata: "KRK",
    tagline: "A city where every cobblestone tells a story",
    taglineAr: "مدينة كل حجر فيها يروي قصة",
    heroImage: "Krakow_EN",
    description: "Welcome to Krakow, Poland's cultural capital and a city brimming with medieval charm. From the stunning Main Market Square to the haunting history of its Jewish Quarter, Krakow offers a deeply enriching travel experience. Book your flights to Krakow and step into centuries of art, architecture, and tradition.",
    descriptionAr: "مرحباً بك في كراكوف، العاصمة الثقافية لبولندا ومدينة تفيض بالسحر القروسطي. من ساحة السوق الرئيسية المذهلة إلى تاريخ الحي اليهودي المؤثر، تقدم كراكوف تجربة سفر غنية. احجز رحلاتك إلى كراكوف وادخل في قرون من الفن والعمارة والتقاليد.",
    thingsToDo: "Things to do in Krakow",
    thingsToDoAr: "أنشطة في كراكوف",
    attractions: [
      { name: "Wawel Castle", nameAr: "قلعة فافل", description: "A magnificent royal castle perched on a limestone hill, showcasing Renaissance architecture and housing priceless art collections and the legendary dragon's den.", descriptionAr: "قلعة ملكية رائعة على تل من الحجر الجيري، تعرض عمارة عصر النهضة وتضم مجموعات فنية لا تقدر بثمن وكهف التنين الأسطوري.", image: "Krakow_EN" },
      { name: "Main Market Square", nameAr: "ساحة السوق الرئيسية", description: "Europe's largest medieval town square, surrounded by historic townhouses, churches, and the iconic Cloth Hall, buzzing with cafes and street performers.", descriptionAr: "أكبر ساحة مدينة قروسطية في أوروبا، محاطة بمنازل تاريخية وكنائس وقاعة القماش الأيقونية، تعج بالمقاهي وفناني الشوارع.", image: "Krakow_EN" },
      { name: "Kazimierz District", nameAr: "حي كازيميرز", description: "The historic Jewish quarter turned trendy neighborhood, filled with synagogues, art galleries, vintage shops, and vibrant nightlife.", descriptionAr: "الحي اليهودي التاريخي الذي تحول إلى حي عصري، مليء بالمعابد والمعارض الفنية والمحلات العتيقة والحياة الليلية النابضة.", image: "Krakow_EN" },
    ],
  },
  prague: {
    city: "Prague",
    cityAr: "براغ",
    iata: "PRG",
    tagline: "The city of a hundred spires awaits",
    taglineAr: "مدينة المئة برج تنتظرك",
    heroImage: "Prague_EN",
    description: "Welcome to Prague, the Czech Republic's enchanting capital known for its fairy-tale architecture and rich cultural heritage. From the iconic Charles Bridge to the majestic Prague Castle, every corner of this city tells a story. Book your flights to Prague and immerse yourself in a world of Gothic, Baroque, and Art Nouveau beauty.",
    descriptionAr: "مرحباً بك في براغ، عاصمة جمهورية التشيك الساحرة المعروفة بعمارتها الخيالية وتراثها الثقافي الغني. من جسر تشارلز الأيقوني إلى قلعة براغ المهيبة، كل زاوية في هذه المدينة تروي قصة. احجز رحلاتك إلى براغ وانغمس في عالم من الجمال القوطي والباروكي والآرت نوفو.",
    thingsToDo: "Things to do in Prague",
    thingsToDoAr: "أنشطة في براغ",
    attractions: [
      { name: "Charles Bridge", nameAr: "جسر تشارلز", description: "This iconic 14th-century stone bridge adorned with 30 baroque statues offers breathtaking views of the Vltava River and connects the Old Town to the Lesser Quarter.", descriptionAr: "هذا الجسر الحجري الأيقوني من القرن الرابع عشر المزين بـ30 تمثالاً باروكياً يوفر إطلالات خلابة على نهر فلتافا ويربط المدينة القديمة بالحي الأصغر.", image: "Prague_EN" },
      { name: "Prague Castle", nameAr: "قلعة براغ", description: "The largest ancient castle complex in the world, home to St. Vitus Cathedral, royal palaces, and stunning gardens overlooking the city.", descriptionAr: "أكبر مجمع قلاع قديمة في العالم، يضم كاتدرائية القديس فيتوس والقصور الملكية وحدائق مذهلة تطل على المدينة.", image: "Prague_EN" },
      { name: "Old Town Square", nameAr: "ساحة المدينة القديمة", description: "A vibrant hub featuring the famous Astronomical Clock, Gothic Tyn Church, and colorful Baroque buildings surrounded by lively cafes.", descriptionAr: "مركز نابض بالحياة يضم الساعة الفلكية الشهيرة وكنيسة تين القوطية ومباني باروكية ملونة محاطة بمقاهي حيوية.", image: "Prague_EN" },
    ],
  },
  tivat: {
    city: "Tivat",
    cityAr: "تيفات",
    iata: "TIV",
    tagline: "Montenegro's coastal jewel of luxury and nature",
    taglineAr: "جوهرة الجبل الأسود الساحلية بين الفخامة والطبيعة",
    heroImage: "Tivat-web",
    description: "Welcome to Tivat, a stunning coastal town nestled along Montenegro's Bay of Kotor. With its luxury marina, pristine beaches, and dramatic mountain backdrop, Tivat offers the perfect blend of relaxation and adventure. Book your flights to Tivat and discover the Mediterranean's best-kept secret.",
    descriptionAr: "مرحباً بك في تيفات، بلدة ساحلية مذهلة على خليج كوتور في الجبل الأسود. بمرساها الفاخر وشواطئها البكر وخلفيتها الجبلية الدراماتيكية، تقدم تيفات المزيج المثالي من الاسترخاء والمغامرة. احجز رحلاتك إلى تيفات واكتشف سر البحر المتوسط الأفضل.",
    thingsToDo: "Things to do in Tivat",
    thingsToDoAr: "أنشطة في تيفات",
    attractions: [
      { name: "Porto Montenegro", nameAr: "بورتو مونتينيغرو", description: "A world-class luxury marina village featuring designer boutiques, waterfront restaurants, and a fascinating Naval Heritage Collection museum.", descriptionAr: "قرية مارينا فاخرة عالمية المستوى تضم بوتيكات مصممين ومطاعم على الواجهة البحرية ومتحف مجموعة التراث البحري المذهل.", image: "Tivat-web" },
      { name: "Plavi Horizonti Beach", nameAr: "شاطئ بلافي هوريزونتي", description: "A stunning sandy beach with crystal-clear turquoise waters, surrounded by olive groves and pine forests — perfect for a relaxing day.", descriptionAr: "شاطئ رملي مذهل بمياه فيروزية صافية، محاط ببساتين الزيتون وغابات الصنوبر — مثالي ليوم استرخاء.", image: "Tivat-web" },
      { name: "Island of Flowers", nameAr: "جزيرة الزهور", description: "A lush botanical paradise connected to the mainland by a short bridge, featuring exotic plants, a monastery, and panoramic coastal views.", descriptionAr: "جنة نباتية خصبة متصلة بالبر الرئيسي بجسر قصير، تضم نباتات غريبة وديراً وإطلالات ساحلية بانورامية.", image: "Tivat-web" },
    ],
  },
  "london-luton": {
    city: "London, Luton",
    cityAr: "لندن، لوتون",
    iata: "LTN",
    tagline: "Don't just see it. Feel it.",
    taglineAr: "لا تزورها وبس. عيشها.",
    heroImage: "Luton_EN",
    description: "Welcome to London via Luton Airport, your gateway to one of the world's most exciting cities. From iconic landmarks to world-class museums, vibrant markets to royal palaces, London offers endless possibilities for every traveler. Book your flights to London Luton and experience the magic of this global metropolis.",
    descriptionAr: "مرحباً بك في لندن عبر مطار لوتون، بوابتك إلى واحدة من أكثر مدن العالم إثارة. من المعالم الأيقونية إلى المتاحف العالمية، ومن الأسواق النابضة إلى القصور الملكية، لندن تقدم إمكانيات لا نهائية لكل مسافر. احجز رحلاتك إلى لندن لوتون واختبر سحر هذه المدينة العالمية.",
    thingsToDo: "Things to do in London",
    thingsToDoAr: "أنشطة في لندن",
    attractions: [
      { name: "Tower of London", nameAr: "برج لندن", description: "A historic castle on the banks of the Thames, home to the Crown Jewels and nearly 1,000 years of royal history, intrigue, and legend.", descriptionAr: "قلعة تاريخية على ضفاف التايمز، موطن جواهر التاج وما يقارب 1000 عام من التاريخ الملكي والمؤامرات والأساطير.", image: "Luton_EN" },
      { name: "British Museum", nameAr: "المتحف البريطاني", description: "One of the world's greatest museums housing over 8 million works spanning human history, from Egyptian mummies to the Rosetta Stone.", descriptionAr: "أحد أعظم متاحف العالم يضم أكثر من 8 ملايين قطعة تمتد عبر تاريخ البشرية، من المومياوات المصرية إلى حجر رشيد.", image: "Luton_EN" },
      { name: "Buckingham Palace", nameAr: "قصر باكنغهام", description: "The official London residence of the British monarch, famous for its Changing of the Guard ceremony and magnificent State Rooms.", descriptionAr: "المقر الرسمي للعاهل البريطاني في لندن، مشهور بمراسم تبديل الحرس وغرف الدولة الفخمة.", image: "Luton_EN" },
    ],
    retailGems: [
      { name: "Camden Market", nameAr: "سوق كامدن", description: "A vibrant market town offering everything from vintage fashion and handmade jewelry to international street food and live music.", descriptionAr: "سوق نابض بالحياة يقدم كل شيء من الأزياء العتيقة والمجوهرات المصنوعة يدوياً إلى طعام الشارع العالمي والموسيقى الحية.", image: "Luton_EN" },
    ],
  },
  dubai: {
    city: "Dubai",
    cityAr: "دبي",
    iata: "DXB",
    tagline: "Where the future meets luxury",
    taglineAr: "حيث يلتقي المستقبل بالفخامة",
    heroImage: "Dubai-web",
    description: "Welcome to Dubai, a dazzling city of superlatives where futuristic skyscrapers meet golden deserts. From the world's tallest building to sprawling shopping malls and pristine beaches, Dubai offers an unmatched blend of luxury, adventure, and culture.",
    descriptionAr: "مرحباً بك في دبي، مدينة مبهرة حيث ناطحات السحاب المستقبلية تلتقي بالصحاري الذهبية. من أطول مبنى في العالم إلى مراكز التسوق الضخمة والشواطئ البكر، دبي تقدم مزيجاً لا مثيل له من الفخامة والمغامرة والثقافة.",
    thingsToDo: "Things to do in Dubai",
    thingsToDoAr: "أنشطة في دبي",
    attractions: [
      { name: "Burj Khalifa", nameAr: "برج خليفة", description: "Standing at 828 meters, the world's tallest building offers breathtaking observation deck views and houses luxury residences, offices, and the Armani Hotel.", descriptionAr: "بارتفاع 828 متراً، أطول مبنى في العالم يوفر إطلالات خلابة من منصة المراقبة ويضم مساكن فاخرة ومكاتب وفندق أرماني.", image: "Dubai-web" },
      { name: "Dubai Mall", nameAr: "دبي مول", description: "One of the world's largest shopping destinations featuring over 1,200 stores, an aquarium, ice rink, and the spectacular Dubai Fountain show.", descriptionAr: "أحد أكبر وجهات التسوق في العالم يضم أكثر من 1200 متجر وحوض أسماك وحلبة تزلج وعرض نافورة دبي المذهل.", image: "Dubai-web" },
      { name: "Palm Jumeirah", nameAr: "نخلة جميرا", description: "An iconic man-made island shaped like a palm tree, home to luxury resorts, pristine beaches, and the famous Atlantis hotel.", descriptionAr: "جزيرة اصطناعية أيقونية على شكل نخلة، موطن المنتجعات الفاخرة والشواطئ البكر وفندق أتلانتس الشهير.", image: "Dubai-web" },
    ],
  },
  cairo: {
    city: "Cairo",
    cityAr: "القاهرة",
    iata: "CAI",
    tagline: "Where ancient wonders meet modern life",
    taglineAr: "حيث تلتقي العجائب القديمة بالحياة الحديثة",
    heroImage: "Cairo-web",
    description: "Welcome to Cairo, Egypt's sprawling capital and gateway to the ancient world. From the magnificent Pyramids of Giza to the bustling Khan el-Khalili bazaar, Cairo offers an extraordinary journey through thousands of years of civilization.",
    descriptionAr: "مرحباً بك في القاهرة، عاصمة مصر المترامية وبوابة العالم القديم. من أهرامات الجيزة العظيمة إلى سوق خان الخليلي الصاخب، القاهرة تقدم رحلة استثنائية عبر آلاف السنين من الحضارة.",
    thingsToDo: "Things to do in Cairo",
    thingsToDoAr: "أنشطة في القاهرة",
    attractions: [
      { name: "Pyramids of Giza", nameAr: "أهرامات الجيزة", description: "The last surviving wonder of the ancient world, these magnificent structures have stood for over 4,500 years alongside the enigmatic Great Sphinx.", descriptionAr: "آخر عجائب الدنيا القديمة الباقية، هذه الهياكل العظيمة صمدت لأكثر من 4500 عام إلى جانب أبو الهول الغامض.", image: "Cairo-web" },
      { name: "Egyptian Museum", nameAr: "المتحف المصري", description: "Home to the world's largest collection of ancient Egyptian antiquities, including Tutankhamun's golden mask and royal mummies.", descriptionAr: "موطن أكبر مجموعة في العالم من الآثار المصرية القديمة، بما في ذلك قناع توت عنخ آمون الذهبي والمومياوات الملكية.", image: "Cairo-web" },
      { name: "Khan el-Khalili", nameAr: "خان الخليلي", description: "A labyrinthine medieval marketplace dating back to the 14th century, offering everything from gold jewelry and spices to handcrafted lanterns.", descriptionAr: "سوق قروسطي متاهي يعود إلى القرن الرابع عشر، يقدم كل شيء من المجوهرات الذهبية والتوابل إلى الفوانيس المصنوعة يدوياً.", image: "Cairo-web" },
    ],
  },
  sohag: {
    city: "Sohag",
    cityAr: "سوهاج",
    iata: "HMB",
    tagline: "Discover Egypt's hidden heritage",
    taglineAr: "اكتشف تراث مصر المخفي",
    heroImage: "Sohag-web",
    description: "Welcome to Sohag, a city rich in Pharaonic and Coptic heritage along the Nile. Home to ancient temples and monasteries, Sohag offers an authentic glimpse into Egypt's diverse cultural tapestry.",
    descriptionAr: "مرحباً بك في سوهاج، مدينة غنية بالتراث الفرعوني والقبطي على ضفاف النيل. موطن المعابد القديمة والأديرة، سوهاج تقدم لمحة أصيلة عن نسيج مصر الثقافي المتنوع.",
    thingsToDo: "Things to do in Sohag",
    thingsToDoAr: "أنشطة في سوهاج",
    attractions: [
      { name: "Abydos Temple", nameAr: "معبد أبيدوس", description: "One of Egypt's most important archaeological sites, featuring the stunning Temple of Seti I with its famous King List and vibrant wall reliefs.", descriptionAr: "أحد أهم المواقع الأثرية في مصر، يضم معبد سيتي الأول المذهل بقائمة الملوك الشهيرة والنقوش الجدارية النابضة.", image: "Sohag-web" },
      { name: "White Monastery", nameAr: "الدير الأبيض", description: "A 5th-century Coptic monastery built with white limestone, featuring remarkable architecture and ancient religious manuscripts.", descriptionAr: "دير قبطي من القرن الخامس مبني من الحجر الجيري الأبيض، يتميز بعمارة رائعة ومخطوطات دينية قديمة.", image: "Sohag-web" },
      { name: "Red Monastery", nameAr: "الدير الأحمر", description: "Adjacent to the White Monastery, this beautifully preserved church showcases some of the finest early Christian paintings in Egypt.", descriptionAr: "بجوار الدير الأبيض، هذه الكنيسة المحفوظة بشكل جميل تعرض بعض أروع اللوحات المسيحية المبكرة في مصر.", image: "Sohag-web" },
    ],
  },
  luxor: {
    city: "Luxor",
    cityAr: "الأقصر",
    iata: "LXR",
    tagline: "The world's greatest open-air museum",
    taglineAr: "أعظم متحف مفتوح في العالم",
    heroImage: "Luxor-web",
    description: "Welcome to Luxor, ancient Thebes, where monumental temples and royal tombs line both banks of the Nile. This city holds more ancient monuments than anywhere else on Earth.",
    descriptionAr: "مرحباً بك في الأقصر، طيبة القديمة، حيث المعابد الضخمة والمقابر الملكية تصطف على ضفتي النيل. هذه المدينة تحتضن آثاراً قديمة أكثر من أي مكان آخر على وجه الأرض.",
    thingsToDo: "Things to do in Luxor",
    thingsToDoAr: "أنشطة في الأقصر",
    attractions: [
      { name: "Valley of the Kings", nameAr: "وادي الملوك", description: "The ancient burial ground of Egypt's pharaohs, containing over 60 elaborately decorated tombs including that of Tutankhamun.", descriptionAr: "مدفن فراعنة مصر القديم، يحتوي على أكثر من 60 مقبرة مزخرفة بشكل متقن بما فيها مقبرة توت عنخ آمون.", image: "Luxor-web" },
      { name: "Karnak Temple", nameAr: "معبد الكرنك", description: "A vast complex of temples, chapels, and pylons built over 2,000 years, featuring the awe-inspiring Great Hypostyle Hall with 134 massive columns.", descriptionAr: "مجمع ضخم من المعابد والمصليات والأبراج بُني على مدى 2000 عام، يضم قاعة الأعمدة الكبرى المهيبة بـ134 عموداً ضخماً.", image: "Luxor-web" },
      { name: "Luxor Temple", nameAr: "معبد الأقصر", description: "A stunning temple complex in the heart of the city, beautifully illuminated at night and connected to Karnak by the Avenue of Sphinxes.", descriptionAr: "مجمع معابد مذهل في قلب المدينة، مضاء بشكل جميل ليلاً ومتصل بالكرنك عبر طريق الكباش.", image: "Luxor-web" },
    ],
  },
  damascus: {
    city: "Damascus",
    cityAr: "دمشق",
    iata: "DAM",
    tagline: "One of the world's oldest continuously inhabited cities",
    taglineAr: "واحدة من أقدم المدن المأهولة باستمرار في العالم",
    heroImage: "Damascus-web",
    description: "Welcome to Damascus, Syria's ancient capital and one of the oldest continuously inhabited cities in the world. With its stunning Umayyad Mosque, vibrant souks, and rich cultural heritage spanning millennia, Damascus offers a profound journey through human civilization.",
    descriptionAr: "مرحباً بك في دمشق، عاصمة سوريا القديمة وواحدة من أقدم المدن المأهولة باستمرار في العالم. بمسجدها الأموي المذهل وأسواقها النابضة وتراثها الثقافي الغني الممتد لآلاف السنين، دمشق تقدم رحلة عميقة عبر الحضارة الإنسانية.",
    thingsToDo: "Things to do in Damascus",
    thingsToDoAr: "أنشطة في دمشق",
    attractions: [
      { name: "Umayyad Mosque", nameAr: "الجامع الأموي", description: "One of the largest and oldest mosques in the world, a masterpiece of early Islamic architecture featuring stunning mosaics and three minarets.", descriptionAr: "أحد أكبر وأقدم المساجد في العالم، تحفة من العمارة الإسلامية المبكرة تتميز بفسيفساء مذهلة وثلاث مآذن.", image: "Damascus-web" },
      { name: "Al-Hamidiyah Souq", nameAr: "سوق الحميدية", description: "A covered market stretching over 600 meters, offering everything from silk fabrics and spices to traditional sweets and handicrafts.", descriptionAr: "سوق مغطى يمتد لأكثر من 600 متر، يقدم كل شيء من الأقمشة الحريرية والتوابل إلى الحلويات التقليدية والحرف اليدوية.", image: "Damascus-web" },
      { name: "Old City", nameAr: "المدينة القديمة", description: "A UNESCO World Heritage site enclosed by ancient Roman walls, featuring narrow alleyways, historic houses, and centuries-old churches and mosques.", descriptionAr: "موقع تراث عالمي لليونسكو محاط بأسوار رومانية قديمة، يضم أزقة ضيقة ومنازل تاريخية وكنائس ومساجد عمرها قرون.", image: "Damascus-web" },
    ],
  },
  assiut: {
    city: "Assiut",
    cityAr: "أسيوط",
    iata: "ATZ",
    tagline: "Egypt's cultural heart along the Nile",
    taglineAr: "قلب مصر الثقافي على ضفاف النيل",
    heroImage: "Assiut-web",
    description: "Welcome to Assiut, a vibrant city on the western bank of the Nile in Upper Egypt. Known for its rich Coptic heritage, ancient tombs, and warm hospitality, Assiut offers an authentic Egyptian experience.",
    descriptionAr: "مرحباً بك في أسيوط، مدينة نابضة على الضفة الغربية للنيل في صعيد مصر. معروفة بتراثها القبطي الغني ومقابرها القديمة وكرم ضيافتها، أسيوط تقدم تجربة مصرية أصيلة.",
    thingsToDo: "Things to do in Assiut",
    thingsToDoAr: "أنشطة في أسيوط",
    attractions: [
      { name: "Meir Tombs", nameAr: "مقابر مير", description: "Ancient rock-cut tombs dating back to the Old and Middle Kingdoms, featuring remarkably preserved wall paintings depicting daily life in ancient Egypt.", descriptionAr: "مقابر محفورة في الصخر تعود للمملكتين القديمة والوسطى، تتميز بلوحات جدارية محفوظة بشكل رائع تصور الحياة اليومية في مصر القديمة.", image: "Assiut-web" },
      { name: "Burnt Monastery", nameAr: "الدير المحرق", description: "The Monastery of the Virgin Mary (Deir el-Muharraq), one of the oldest monasteries in the world, believed to be where the Holy Family stayed.", descriptionAr: "دير العذراء مريم (الدير المحرق)، أحد أقدم الأديرة في العالم، يُعتقد أنه المكان الذي أقامت فيه العائلة المقدسة.", image: "Assiut-web" },
      { name: "Assiut Barrage", nameAr: "قناطر أسيوط", description: "A beautiful dam across the Nile offering scenic views and pleasant walks along the riverbank, especially stunning at sunset.", descriptionAr: "سد جميل عبر النيل يوفر إطلالات خلابة ونزهات ممتعة على ضفة النهر، مذهل بشكل خاص عند غروب الشمس.", image: "Assiut-web" },
    ],
  },
  colombo: {
    city: "Colombo",
    cityAr: "كولومبو",
    iata: "CMB",
    tagline: "Where tropical beauty meets urban energy",
    taglineAr: "حيث يلتقي الجمال الاستوائي بالطاقة الحضرية",
    heroImage: "Colombo-web",
    description: "Welcome to Colombo, Sri Lanka's vibrant commercial capital where colonial architecture blends with modern skyscrapers, and bustling markets sit alongside serene temples.",
    descriptionAr: "مرحباً بك في كولومبو، العاصمة التجارية النابضة لسريلانكا حيث تمتزج العمارة الاستعمارية بناطحات السحاب الحديثة، والأسواق الصاخبة تجاور المعابد الهادئة.",
    thingsToDo: "Things to do in Colombo",
    thingsToDoAr: "أنشطة في كولومبو",
    attractions: [
      { name: "Gangaramaya Temple", nameAr: "معبد غانغاراماي", description: "A stunning Buddhist temple showcasing a fascinating mix of Sri Lankan, Thai, Indian, and Chinese architecture, housing an impressive collection of artifacts.", descriptionAr: "معبد بوذي مذهل يعرض مزيجاً رائعاً من العمارة السريلانكية والتايلاندية والهندية والصينية، يضم مجموعة مثيرة من القطع الأثرية.", image: "Colombo-web" },
      { name: "Galle Face Green", nameAr: "غالي فيس غرين", description: "A scenic oceanfront promenade perfect for sunset strolls, kite flying, and sampling local street food from the many vendors.", descriptionAr: "ممشى بحري خلاب مثالي لنزهات الغروب وطيران الطائرات الورقية وتذوق طعام الشارع المحلي من البائعين الكثيرين.", image: "Colombo-web" },
      { name: "Pettah Market", nameAr: "سوق بيتاه", description: "A chaotic and colorful bazaar district where you can find everything from electronics and textiles to fresh produce and spices.", descriptionAr: "حي سوق فوضوي وملون حيث يمكنك العثور على كل شيء من الإلكترونيات والمنسوجات إلى المنتجات الطازجة والتوابل.", image: "Colombo-web" },
    ],
  },
  kochi: {
    city: "Kochi",
    cityAr: "كوتشي",
    iata: "COK",
    tagline: "Queen of the Arabian Sea",
    taglineAr: "ملكة بحر العرب",
    heroImage: "Kochi-web",
    description: "Welcome to Kochi, a vibrant port city on India's southwest coast known for its rich trading history and cultural diversity. From Chinese fishing nets to colonial architecture and spice markets, Kochi offers a unique blend of influences.",
    descriptionAr: "مرحباً بك في كوتشي، مدينة ميناء نابضة على الساحل الجنوبي الغربي للهند معروفة بتاريخها التجاري الغني وتنوعها الثقافي. من شباك الصيد الصينية إلى العمارة الاستعمارية وأسواق التوابل، كوتشي تقدم مزيجاً فريداً من التأثيرات.",
    thingsToDo: "Things to do in Kochi",
    thingsToDoAr: "أنشطة في كوتشي",
    attractions: [
      { name: "Chinese Fishing Nets", nameAr: "شباك الصيد الصينية", description: "Iconic cantilevered fishing nets along Fort Kochi's shoreline, introduced by Chinese traders in the 14th century and still used by local fishermen.", descriptionAr: "شباك صيد معلقة أيقونية على ساحل فورت كوتشي، أدخلها التجار الصينيون في القرن الرابع عشر ولا يزال يستخدمها الصيادون المحليون.", image: "Kochi-web" },
      { name: "Mattancherry Palace", nameAr: "قصر ماتانشيري", description: "A Portuguese-era palace showcasing stunning Kerala murals depicting Hindu temple art and mythological scenes.", descriptionAr: "قصر من العصر البرتغالي يعرض جداريات كيرالا المذهلة التي تصور فن المعابد الهندوسية والمشاهد الأسطورية.", image: "Kochi-web" },
      { name: "Spice Markets", nameAr: "أسواق التوابل", description: "Aromatic markets in Jew Town offering cardamom, pepper, cinnamon, and other spices that made Kochi famous on ancient trade routes.", descriptionAr: "أسواق عطرية في حي اليهود تقدم الهيل والفلفل والقرفة وتوابل أخرى جعلت كوتشي مشهورة على طرق التجارة القديمة.", image: "Kochi-web" },
    ],
  },
  istanbul: {
    city: "Istanbul",
    cityAr: "إسطنبول",
    iata: "IST",
    tagline: "Where East meets West",
    taglineAr: "حيث يلتقي الشرق بالغرب",
    heroImage: "Istanbul-web",
    description: "Welcome to Istanbul, Turkey's magnificent city straddling two continents. With its stunning mosques, grand bazaars, and rich Ottoman heritage, Istanbul offers an extraordinary blend of ancient history and modern vibrancy.",
    descriptionAr: "مرحباً بك في إسطنبول، مدينة تركيا العظيمة التي تمتد على قارتين. بمساجدها المذهلة وبازاراتها الكبرى وتراثها العثماني الغني، إسطنبول تقدم مزيجاً استثنائياً من التاريخ القديم والحيوية الحديثة.",
    thingsToDo: "Things to do in Istanbul",
    thingsToDoAr: "أنشطة في إسطنبول",
    attractions: [
      { name: "Hagia Sophia", nameAr: "آيا صوفيا", description: "A masterpiece of Byzantine architecture that served as a cathedral, mosque, and museum, now once again a functioning mosque with stunning mosaics.", descriptionAr: "تحفة من العمارة البيزنطية خدمت ككاتدرائية ومسجد ومتحف، والآن مسجد عامل مرة أخرى بفسيفساء مذهلة.", image: "Istanbul-web" },
      { name: "Grand Bazaar", nameAr: "البازار الكبير", description: "One of the world's oldest and largest covered markets with over 4,000 shops selling carpets, jewelry, ceramics, and spices.", descriptionAr: "أحد أقدم وأكبر الأسواق المغطاة في العالم بأكثر من 4000 متجر يبيع السجاد والمجوهرات والسيراميك والتوابل.", image: "Istanbul-web" },
      { name: "Topkapi Palace", nameAr: "قصر توبكابي", description: "The opulent Ottoman palace complex overlooking the Bosphorus, housing imperial treasures, sacred relics, and beautiful courtyards.", descriptionAr: "مجمع القصر العثماني الفخم المطل على البوسفور، يضم كنوز إمبراطورية وآثار مقدسة وأفنية جميلة.", image: "Istanbul-web" },
    ],
  },
  jeddah: {
    city: "Jeddah",
    cityAr: "جدة",
    iata: "JED",
    tagline: "Gateway to the Red Sea",
    taglineAr: "بوابة البحر الأحمر",
    heroImage: "Jeddah-web",
    description: "Welcome to Jeddah, Saudi Arabia's vibrant coastal city on the Red Sea. Known as the gateway to Mecca, Jeddah combines rich history with modern development, offering stunning corniche views, historic districts, and world-class dining.",
    descriptionAr: "مرحباً بك في جدة، مدينة المملكة العربية السعودية النابضة على ساحل البحر الأحمر. معروفة كبوابة مكة المكرمة، جدة تجمع بين التاريخ الغني والتطور الحديث، وتقدم إطلالات كورنيش مذهلة وأحياء تاريخية ومطاعم عالمية.",
    thingsToDo: "Things to do in Jeddah",
    thingsToDoAr: "أنشطة في جدة",
    attractions: [
      { name: "Al-Balad", nameAr: "البلد", description: "Jeddah's historic district and UNESCO World Heritage site, featuring traditional coral stone buildings with ornate wooden balconies (Rawasheen).", descriptionAr: "حي جدة التاريخي وموقع تراث عالمي لليونسكو، يتميز بمباني الحجر المرجاني التقليدية بشرفات خشبية مزخرفة (الرواشين).", image: "Jeddah-web" },
      { name: "King Fahd Fountain", nameAr: "نافورة الملك فهد", description: "The world's tallest fountain shooting water up to 312 meters into the air, a stunning landmark visible from across the city.", descriptionAr: "أطول نافورة في العالم تطلق المياه حتى 312 متراً في الهواء، معلم مذهل مرئي من أنحاء المدينة.", image: "Jeddah-web" },
      { name: "Jeddah Corniche", nameAr: "كورنيش جدة", description: "A beautiful 30-kilometer waterfront promenade along the Red Sea coast, featuring parks, sculptures, and stunning sunset views.", descriptionAr: "ممشى بحري جميل بطول 30 كيلومتراً على ساحل البحر الأحمر، يضم حدائق ومنحوتات وإطلالات غروب مذهلة.", image: "Jeddah-web" },
    ],
  },
  delhi: {
    city: "Delhi",
    cityAr: "دلهي",
    iata: "DEL",
    tagline: "A tapestry of ancient and modern India",
    taglineAr: "نسيج من الهند القديمة والحديثة",
    heroImage: "Delhi-web",
    description: "Welcome to Delhi, India's capital territory where centuries of history unfold at every turn. From Mughal monuments to bustling bazaars and modern malls, Delhi offers an intoxicating mix of the old and new.",
    descriptionAr: "مرحباً بك في دلهي، عاصمة الهند حيث تتكشف قرون من التاريخ في كل منعطف. من الآثار المغولية إلى البازارات الصاخبة والمراكز التجارية الحديثة، دلهي تقدم مزيجاً مسكراً من القديم والجديد.",
    thingsToDo: "Things to do in Delhi",
    thingsToDoAr: "أنشطة في دلهي",
    attractions: [
      { name: "Red Fort", nameAr: "القلعة الحمراء", description: "A magnificent Mughal-era fortress built in red sandstone, serving as the main residence of the emperors for nearly 200 years.", descriptionAr: "قلعة مغولية رائعة مبنية من الحجر الرملي الأحمر، كانت المقر الرئيسي للأباطرة لما يقارب 200 عام.", image: "Delhi-web" },
      { name: "Qutub Minar", nameAr: "قطب منار", description: "A soaring 73-meter minaret built in 1193, the tallest brick minaret in the world and a UNESCO World Heritage site.", descriptionAr: "مئذنة شاهقة بارتفاع 73 متراً بُنيت عام 1193، أطول مئذنة من الطوب في العالم وموقع تراث عالمي لليونسكو.", image: "Delhi-web" },
      { name: "India Gate", nameAr: "بوابة الهند", description: "An iconic war memorial arch standing 42 meters tall, surrounded by lush gardens and serving as Delhi's most recognizable landmark.", descriptionAr: "قوس نصب تذكاري حربي أيقوني بارتفاع 42 متراً، محاط بحدائق خصبة ويعتبر أشهر معلم في دلهي.", image: "Delhi-web" },
    ],
  },
  tehran: {
    city: "Tehran",
    cityAr: "طهران",
    iata: "IKA",
    tagline: "Where ancient Persia meets modern Iran",
    taglineAr: "حيث تلتقي فارس القديمة بإيران الحديثة",
    heroImage: "Tehran-web",
    description: "Welcome to Tehran, Iran's sprawling capital nestled beneath the snow-capped Alborz Mountains. A city of contrasts where ancient bazaars coexist with modern art galleries, and traditional teahouses sit alongside trendy cafes.",
    descriptionAr: "مرحباً بك في طهران، عاصمة إيران المترامية تحت جبال البرز المكللة بالثلوج. مدينة تناقضات حيث البازارات القديمة تتعايش مع صالات الفن الحديث، وبيوت الشاي التقليدية تجاور المقاهي العصرية.",
    thingsToDo: "Things to do in Tehran",
    thingsToDoAr: "أنشطة في طهران",
    attractions: [
      { name: "Golestan Palace", nameAr: "قصر كلستان", description: "A UNESCO World Heritage site and masterpiece of Qajar-era architecture, featuring stunning mirror halls, marble thrones, and lush gardens.", descriptionAr: "موقع تراث عالمي لليونسكو وتحفة من عمارة العصر القاجاري، يتميز بقاعات مرايا مذهلة وعروش رخامية وحدائق خصبة.", image: "Tehran-web" },
      { name: "Grand Bazaar", nameAr: "البازار الكبير", description: "A 10-kilometer labyrinth of covered markets dating back over 400 years, offering carpets, spices, gold, and traditional crafts.", descriptionAr: "متاهة أسواق مغطاة بطول 10 كيلومترات تعود لأكثر من 400 عام، تقدم السجاد والتوابل والذهب والحرف التقليدية.", image: "Tehran-web" },
      { name: "Milad Tower", nameAr: "برج ميلاد", description: "The sixth-tallest tower in the world offering panoramic views of Tehran and the Alborz Mountains from its observation deck and revolving restaurant.", descriptionAr: "سادس أطول برج في العالم يوفر إطلالات بانورامية على طهران وجبال البرز من منصة المراقبة والمطعم الدوار.", image: "Tehran-web" },
    ],
  },
};

export default function DestinationPage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const dest = destinations[slug];

  const [attractionIndex, setAttractionIndex] = useState(0);
  const [showCurrency, setShowCurrency] = useState(false);
  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem('jz_currency') || 'KWD'; } catch { return 'KWD'; }
  });
  const currRef = useRef<HTMLDivElement>(null);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currRef.current && !currRef.current.contains(e.target as Node)) {
        setShowCurrency(false);
      }
    };
    if (showCurrency) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCurrency]);

  if (!dest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Page not found</p>
      </div>
    );
  }

  const maxAttr = dest.attractions.length - 1;
  const currObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[8];

  // Navigate to homepage with a specific picker open
  const goHomeWithPicker = (picker: string) => {
    try {
      localStorage.setItem('jzHomeState', JSON.stringify({
        activeTab: 'One Way',
        picker,
        origin: 'KWI',
        destination: dest.iata,
      }));
    } catch {}
    setLocation('/');
  };

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
          {/* Currency Button */}
          <div className="relative" ref={currRef}>
            <button
              onClick={() => setShowCurrency(!showCurrency)}
              className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <img src={`https://flagcdn.com/24x18/${currObj.flag}.png`} alt="" className="w-5 h-4 rounded-sm object-cover" />
              <span>{currency}</span>
              <svg className={`w-3 h-3 transition-transform ${showCurrency ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {/* Currency Dropdown */}
            {showCurrency && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-56 z-50 max-h-72 overflow-y-auto">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setShowCurrency(false); try { localStorage.setItem('jz_currency', c.code); } catch {} }}
                    className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[#f0f5fc] transition-colors ${currency === c.code ? 'bg-[#f0f5fc] font-medium text-[#004b87]' : 'text-gray-700'}`}
                  >
                    <img src={`https://flagcdn.com/20x15/${c.flag}.png`} alt="" className="w-5 h-4 rounded-sm object-cover" />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-medium text-[#001d3d] text-center mb-2">
          {isAr ? `رحلات رخيصة إلى ${dest.cityAr} (${dest.iata})` : `Cheap Flights to ${dest.city} (${dest.iata})`}
        </h1>
        <p className="text-center text-gray-600 text-lg mb-6">{isAr ? dest.taglineAr : dest.tagline}</p>

        {/* Search Widget - Functional */}
        <div className={`flex items-center justify-center gap-1.5 md:gap-3 mb-6 overflow-x-auto pb-2 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Arrow button */}
          {isAr ? (
            <button onClick={() => goHomeWithPicker('date')} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#004b87] flex items-center justify-center hover:bg-[#003875] transition-colors shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          ) : (
            <button onClick={() => goHomeWithPicker('date')} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#004b87] flex items-center justify-center hover:bg-[#003875] transition-colors shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
          )}
          <button
            onClick={() => goHomeWithPicker('pax')}
            className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 text-xs md:text-sm hover:border-[#004b87] hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#004b87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span>{isAr ? '1 راكب' : '1 Passenger'}</span>
          </button>
          <span className="text-gray-400 hidden md:inline">—</span>
          <button
            onClick={() => goHomeWithPicker('date')}
            className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 text-xs md:text-sm hover:border-[#004b87] hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#004b87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{isAr ? 'اختر التواريخ' : 'Select dates'}</span>
          </button>
          <span className="text-gray-400 hidden md:inline">—</span>
          <button
            onClick={() => goHomeWithPicker('destination')}
            className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 text-xs md:text-sm hover:border-[#004b87] hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#004b87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            <span className="font-medium">{dest.city}, {dest.iata}</span>
          </button>
          <span className="text-gray-400 hidden md:inline">—</span>
          <button
            onClick={() => goHomeWithPicker('origin')}
            className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 text-xs md:text-sm hover:border-[#004b87] hover:shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#004b87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
            <span className="font-medium">Kuwait, KWI</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 text-sm text-gray-500 mb-8 ${isAr ? 'justify-end' : 'justify-start'}`}>
          <button onClick={() => setLocation('/')} className="hover:text-[#004b87]">{isAr ? 'الرئيسية' : 'Home'}</button>
          <span>/</span>
          <span className="text-gray-500">{isAr ? 'حجز الرحلات' : 'Book Flights'}</span>
          <span>/</span>
          <span className="text-[#004b87] font-medium">{isAr ? `رحلات إلى ${dest.cityAr}` : `Flights To ${dest.city}`}</span>
        </div>

        {/* Hero Image */}
        <div className="rounded-2xl overflow-hidden mb-8">
          <img src={`/jazeera_files/${dest.heroImage}`} alt={dest.city} className="w-full h-[300px] md:h-[450px] object-cover" />
        </div>

        {/* Description */}
        <p className="text-center text-gray-700 text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-12">
          {isAr ? dest.descriptionAr : dest.description}
        </p>

        {/* Things to do */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-light text-[#001d3d] mb-2">{isAr ? dest.thingsToDoAr : dest.thingsToDo}</h2>
          <p className="text-gray-500 text-lg">{isAr ? 'أبرز المعالم' : 'Top attractions'}</p>
        </div>

        {/* Attractions Carousel */}
        <div className="relative mb-16">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setAttractionIndex(Math.max(0, attractionIndex - 1))}
              className={`w-10 h-10 rounded-full bg-[#004b87] flex items-center justify-center hover:bg-[#003875] transition-all ${attractionIndex === 0 ? 'opacity-40' : ''}`}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="w-[300px] md:w-[500px] h-[250px] md:h-[350px] rounded-2xl overflow-hidden shadow-lg transform rotate-1">
              <img
                src={`/jazeera_files/${dest.attractions[attractionIndex]?.image}`}
                alt={dest.attractions[attractionIndex]?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setAttractionIndex(Math.min(maxAttr, attractionIndex + 1))}
              className={`w-10 h-10 rounded-full bg-[#004b87] flex items-center justify-center hover:bg-[#003875] transition-all ${attractionIndex === maxAttr ? 'opacity-40' : ''}`}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="text-center mt-6">
            <h3 className="text-xl md:text-2xl font-medium text-[#001d3d] mb-2">
              {isAr ? dest.attractions[attractionIndex]?.nameAr : dest.attractions[attractionIndex]?.name}
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {isAr ? dest.attractions[attractionIndex]?.descriptionAr : dest.attractions[attractionIndex]?.description}
            </p>
          </div>
        </div>

        {/* Retail Gems (if available) */}
        {dest.retailGems && dest.retailGems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-light text-[#001d3d] mb-6 text-center">{isAr ? 'جواهر التسوق' : 'Retail gems'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dest.retailGems.map((gem, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md">
                  <img src={`/jazeera_files/${gem.image}`} alt={gem.name} className="w-full h-[200px] object-cover" />
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-[#001d3d] mb-2">{isAr ? gem.nameAr : gem.name}</h3>
                    <p className="text-gray-600 text-sm">{isAr ? gem.descriptionAr : gem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Now CTA */}
        <div className="text-center mb-12">
          <button
            onClick={() => goHomeWithPicker('date')}
            className="bg-[#004b87] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-[#003875] transition-colors"
          >
            {isAr ? `احجز رحلات إلى ${dest.cityAr}` : `Book flights to ${dest.city}`}
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

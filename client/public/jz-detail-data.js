/* JAZEERA DETAIL DATA v2
 * Rich bilingual (EN/AR) content catalog for every clickable card/banner on the
 * home page. Keyed by a stable slug. Rendered by detail.html into a full,
 * multi-section detail page that mirrors the original jazeeraairways.com layout.
 *
 * Section shapes supported by detail.html:
 *   { h, subh, p, ps:[...], feats:[{b,t}], checks:[...], img, cards:[{img,h,p}] }
 * Item shape: { kind, img, code?, en:{title,tag,subtitle,lede,intro,sections,cta,ctaHref}, ar:{...} }
 */
(function () {
  var S7 = 'https://s7g10.scene7.com/is/image/jazeeraairways/';
  var L = './jazeera_files/';

  /* ---------- DESTINATION builder: rich, multi-section ---------- */
  function dest(img, enTag, enName, arTag, arName, enIntro, arIntro, opts) {
    opts = opts || {};
    var bare = enName.replace(/^(Dazzling|Majestic|Historic|Sunny|Timeless|Authentic|Vibrant) /, '');
    // Each destination books a real KWI -> <iata> search. Without the IATA the
    // search results page falls back to its KWI->DXB default, which made every
    // destination open a Dubai search. Pass opts.iata so each opens its own route.
    var destHref = opts.iata
      ? ('/flight-search?origin=KWI&destination=' + opts.iata)
      : '/flight-search';
    return {
      kind: 'destination', img: img,
      en: {
        tag: enTag, title: enName,
        subtitle: 'Discover ' + bare + ' with Jazeera Airways',
        lede: enIntro,
        intro: enIntro,
        sections: [
          { h: 'Why visit ' + bare, p: opts.whyP, checks: opts.highlights, img: img },
          { h: 'Top things to do', feats: opts.todo },
          { h: 'Best time to visit', p: opts.bestTime },
          { h: 'Plan your trip', p: 'Book your Jazeera Airways flight to ' + bare + ' and enjoy comfortable cabins, generous baggage options and great fares. Choose your travel dates, add seats and extras, and travel your way.' }
        ],
        cta: 'Book a flight to ' + bare, ctaHref: destHref
      },
      ar: {
        tag: arTag, title: arName,
        subtitle: 'اكتشف ' + arName + ' مع طيران الجزيرة',
        lede: arIntro,
        intro: arIntro,
        sections: [
          { h: 'لماذا تزور ' + arName, p: opts.whyP_ar, checks: opts.highlights_ar, img: img },
          { h: 'أبرز ما يمكنك فعله', feats: opts.todo_ar },
          { h: 'أفضل وقت للزيارة', p: opts.bestTime_ar },
          { h: 'خطط لرحلتك', p: 'احجز رحلتك مع طيران الجزيرة إلى ' + arName + ' واستمتع بمقصورات مريحة وخيارات أمتعة سخية وأسعار رائعة. اختر تواريخ سفرك، وأضف المقاعد والإضافات، وسافر على طريقتك.' }
        ],
        cta: 'احجز رحلة إلى ' + arName, ctaHref: destHref
      }
    };
  }

  /* ---------- SERVICE builder: rich, multi-section ---------- */
  function svc(img, enTitle, enDesc, arTitle, arDesc, enBody, arBody, enPoints, arPoints, enHow, arHow) {
    return {
      kind: 'service', img: img,
      en: { title: enTitle, tag: 'Our Services', subtitle: enDesc, lede: enBody, intro: enDesc,
        sections: [
          { h: 'About this service', p: enBody, img: img },
          { h: 'What you get', checks: enPoints },
          { h: 'How to add it', p: enHow }
        ], cta: 'Add to my booking', ctaHref: '/' },
      ar: { title: arTitle, tag: 'خدماتنا', subtitle: arDesc, lede: arBody, intro: arDesc,
        sections: [
          { h: 'عن هذه الخدمة', p: arBody, img: img },
          { h: 'ماذا تحصل عليه', checks: arPoints },
          { h: 'كيفية إضافتها', p: arHow }
        ], cta: 'أضف إلى حجزي', ctaHref: '/' }
    };
  }

  var DATA = {
    /* ============================ OFFERS ============================ */
    'offer-j9summer': {
      kind: 'offer', img: L + '09062026-SummerSale50Off-Webbanners-OfferCard-EN',
      code: 'J9SUMMER',
      en: { title: 'Big Summer Sale', tag: 'Offer', subtitle: 'Up to 50% Off on Flights',
        lede: 'Make this summer unforgettable with the Jazeera Airways Big Summer Sale and fly for less across our network.',
        intro: 'Up to 50% Off on Flights',
        sections: [
          { h: 'Offer details', p: 'Make this summer unforgettable with the Jazeera Airways Big Summer Sale. Enjoy up to 50% off on a wide range of destinations across the network when you book during the promotional period.', img: L + '09062026-SummerSale50Off-Webbanners-OfferCard-EN' },
          { h: 'How to redeem', p: 'Use promo code J9SUMMER at the time of booking. The discount is applied automatically to eligible fares before you proceed to payment.' },
          { h: 'Terms & conditions', checks: ['Discount applies to base fare only and excludes taxes and fees.', 'Subject to seat availability and blackout dates.', 'Cannot be combined with other promotions.', 'Travel period and booking window apply as published.'] }
        ], cta: 'Book this offer', ctaHref: '/' },
      ar: { title: 'تخفيضات الصيف الكبرى', tag: 'عرض', subtitle: 'خصم حتى 50٪ على الرحلات',
        lede: 'اجعل صيفك لا يُنسى مع تخفيضات الصيف الكبرى من طيران الجزيرة وسافر بأقل سعر عبر شبكتنا.',
        intro: 'خصم حتى 50٪ على الرحلات',
        sections: [
          { h: 'تفاصيل العرض', p: 'اجعل صيفك لا يُنسى مع تخفيضات الصيف الكبرى من طيران الجزيرة. استمتع بخصم يصل إلى 50٪ على مجموعة واسعة من الوجهات عبر الشبكة عند الحجز خلال فترة العرض.', img: L + '09062026-SummerSale50Off-Webbanners-OfferCard-EN' },
          { h: 'كيفية الاستفادة', p: 'استخدم رمز الخصم J9SUMMER عند الحجز. يُطبَّق الخصم تلقائياً على الأسعار المؤهلة قبل الانتقال إلى الدفع.' },
          { h: 'الأحكام والشروط', checks: ['ينطبق الخصم على السعر الأساسي فقط ولا يشمل الضرائب والرسوم.', 'يخضع لتوفر المقاعد وتواريخ الحظر.', 'لا يمكن دمجه مع العروض الأخرى.', 'تنطبق فترة السفر ونافذة الحجز كما هو منشور.'] }
        ], cta: 'احجز هذا العرض', ctaHref: '/' }
    },

    /* ====================== POPULAR DESTINATIONS ==================== */
    'dest-dubai': dest(S7 + 'Dubai-web', 'City Break', 'Dazzling Dubai', 'إجازة قصيرة في مدينة', 'دبي المتألقة',
      'Dubai dazzles with futuristic skylines, golden beaches and world-class shopping and dining.',
      'تتألق دبي بأفقها المستقبلي وشواطئها الذهبية والتسوق والمطاعم العالمية.', {
        whyP: 'From the Burj Khalifa and Dubai Mall to traditional souks and desert safaris, Dubai blends modern luxury with Arabian heritage. It is the perfect destination for a short, energetic city break.',
        highlights: ['Burj Khalifa & Dubai Fountain', 'Dubai Mall & Gold Souk', 'Palm Jumeirah & beaches', 'Desert safari adventures'],
        todo: [{b:'Go up the Burj Khalifa:', t:'Take in panoramic views from the world\u2019s tallest building.'}, {b:'Shop & dine:', t:'Explore Dubai Mall and the historic Gold and Spice souks.'}, {b:'Hit the desert:', t:'Enjoy dune bashing, camel rides and a Bedouin-style dinner.'}, {b:'Relax by the sea:', t:'Unwind on Jumeirah Beach and Palm Jumeirah.'}],
        bestTime: 'The cooler months from November to March offer pleasant temperatures ideal for sightseeing, beaches and outdoor dining.',
        whyP_ar: 'من برج خليفة ودبي مول إلى الأسواق التقليدية ورحلات السفاري الصحراوية، تمزج دبي بين الفخامة الحديثة والتراث العربي. إنها وجهة مثالية لإجازة قصيرة مليئة بالحيوية.',
        highlights_ar: ['برج خليفة ونافورة دبي', 'دبي مول وسوق الذهب', 'نخلة جميرا والشواطئ', 'مغامرات السفاري الصحراوية'],
        todo_ar: [{b:'اصعد إلى برج خليفة:', t:'استمتع بإطلالات بانورامية من أعلى مبنى في العالم.'}, {b:'تسوّق وتناول الطعام:', t:'استكشف دبي مول وأسواق الذهب والتوابل التاريخية.'}, {b:'اقصد الصحراء:', t:'استمتع بتطعيس الكثبان وركوب الجمال وعشاء على الطراز البدوي.'}, {b:'استرخِ على البحر:', t:'استرخِ على شاطئ جميرا ونخلة جميرا.'}],
        bestTime_ar: 'توفّر الأشهر الأكثر برودة من نوفمبر إلى مارس درجات حرارة لطيفة مثالية للتجوّل والشواطئ وتناول الطعام في الهواء الطلق.', iata: 'DXB'
      }),
    'dest-cairo': dest(S7 + 'Cairo-web', 'Cultural Heritage', 'Majestic Cairo', 'التراث الثقافي', 'القاهرة العظيمة',
      'Cairo is a living museum where ancient wonders meet a vibrant modern city.',
      'القاهرة متحف حي تلتقي فيه عجائب الماضي بمدينة عصرية نابضة بالحياة.', {
        whyP: 'Stand before the Pyramids of Giza and the Sphinx, explore the treasures of the Egyptian Museum, and wander the historic streets of Old Cairo and the Khan el-Khalili bazaar.',
        highlights: ['Pyramids of Giza & the Sphinx', 'The Egyptian Museum', 'Khan el-Khalili bazaar', 'Islamic & Coptic Old Cairo'],
        todo: [{b:'See the Pyramids:', t:'Marvel at Giza\u2019s pyramids and the Great Sphinx.'}, {b:'Visit the museums:', t:'Discover Tutankhamun\u2019s treasures and ancient artefacts.'}, {b:'Explore the bazaar:', t:'Shop for crafts and spices in Khan el-Khalili.'}, {b:'Cruise the Nile:', t:'Enjoy a relaxing dinner cruise along the river.'}],
        bestTime: 'October to April brings mild, comfortable weather perfect for exploring Cairo\u2019s outdoor sites and monuments.',
        whyP_ar: 'قف أمام أهرامات الجيزة وأبو الهول، واستكشف كنوز المتحف المصري، وتجوّل في شوارع القاهرة القديمة وسوق خان الخليلي التاريخي.',
        highlights_ar: ['أهرامات الجيزة وأبو الهول', 'المتحف المصري', 'سوق خان الخليلي', 'القاهرة الإسلامية والقبطية'],
        todo_ar: [{b:'شاهد الأهرامات:', t:'انبهر بأهرامات الجيزة وتمثال أبو الهول العظيم.'}, {b:'زر المتاحف:', t:'اكتشف كنوز توت عنخ آمون والقطع الأثرية القديمة.'}, {b:'استكشف السوق:', t:'تسوّق الحرف والتوابل في خان الخليلي.'}, {b:'أبحر في النيل:', t:'استمتع برحلة عشاء هادئة على النهر.'}],
        bestTime_ar: 'يجلب أكتوبر إلى أبريل طقساً معتدلاً ومريحاً مثالياً لاستكشاف معالم القاهرة وآثارها في الهواء الطلق.', iata: 'CAI'
      }),
    'dest-sohag': dest(S7 + 'Sohag-web', 'Cultural Heritage', 'Historic Sohag', 'التراث الثقافي', 'سوهاج التاريخية',
      'Sohag offers authentic Upper Egypt charm with ancient temples and monasteries.',
      'تقدّم سوهاج سحر صعيد مصر الأصيل بمعابدها وأديرتها القديمة.', {
        whyP: 'Discover the White and Red Monasteries, the temple of Abydos and the warm hospitality of one of Egypt\u2019s most authentic regions along the Nile.',
        highlights: ['Temple of Abydos', 'The White Monastery', 'The Red Monastery', 'Authentic Nile-side life'],
        todo: [{b:'Visit Abydos:', t:'Explore one of Egypt\u2019s most sacred ancient temples.'}, {b:'See the monasteries:', t:'Tour the historic White and Red Monasteries.'}, {b:'Experience local life:', t:'Enjoy the genuine culture of Upper Egypt.'}],
        bestTime: 'The winter months from November to March are the most comfortable for exploring Sohag\u2019s historic sites.',
        whyP_ar: 'اكتشف الدير الأبيض والدير الأحمر، ومعبد أبيدوس، وكرم الضيافة في واحدة من أكثر مناطق مصر أصالة على ضفاف النيل.',
        highlights_ar: ['معبد أبيدوس', 'الدير الأبيض', 'الدير الأحمر', 'الحياة الأصيلة على ضفاف النيل'],
        todo_ar: [{b:'زر أبيدوس:', t:'استكشف أحد أقدس المعابد المصرية القديمة.'}, {b:'شاهد الأديرة:', t:'تجوّل في الدير الأبيض والدير الأحمر التاريخيين.'}, {b:'عِش الحياة المحلية:', t:'استمتع بثقافة صعيد مصر الأصيلة.'}],
        bestTime_ar: 'أشهر الشتاء من نوفمبر إلى مارس هي الأكثر راحة لاستكشاف معالم سوهاج التاريخية.', iata: 'HMB'
      }),
    'dest-luxor': dest(S7 + 'Luxor-web', 'Cultural Heritage', 'Majestic Luxor', 'التراث الثقافي', 'الأقصر التاريخية',
      'Luxor is the world\u2019s greatest open-air museum on the banks of the Nile.',
      'الأقصر أعظم متحف مفتوح في العالم على ضفاف النيل.', {
        whyP: 'Explore Karnak and Luxor temples, the Valley of the Kings and the temple of Hatshepsut \u2013 the magnificent heart of ancient Thebes.',
        highlights: ['Karnak Temple complex', 'Valley of the Kings', 'Temple of Hatshepsut', 'Luxor Temple'],
        todo: [{b:'Tour Karnak:', t:'Walk among the towering columns of the great temple complex.'}, {b:'Visit the Valley of the Kings:', t:'Descend into the tombs of the pharaohs.'}, {b:'Ride a balloon:', t:'See the West Bank at sunrise from a hot-air balloon.'}],
        bestTime: 'October to April offers warm, dry days ideal for visiting Luxor\u2019s temples and tombs.',
        whyP_ar: 'استكشف معبدي الكرنك والأقصر، ووادي الملوك، ومعبد حتشبسوت \u2013 قلب طيبة القديمة الرائع.',
        highlights_ar: ['مجمع معابد الكرنك', 'وادي الملوك', 'معبد حتشبسوت', 'معبد الأقصر'],
        todo_ar: [{b:'تجوّل في الكرنك:', t:'امشِ بين أعمدة مجمع المعابد العظيم الشاهقة.'}, {b:'زر وادي الملوك:', t:'انزل إلى مقابر الفراعنة.'}, {b:'اركب منطاداً:', t:'شاهد الضفة الغربية عند الشروق من منطاد هوائي.'}],
        bestTime_ar: 'يوفّر أكتوبر إلى أبريل أياماً دافئة وجافة مثالية لزيارة معابد الأقصر ومقابرها.', iata: 'LXR'
      }),
    'dest-colombo': dest(S7 + 'Colombo-web', 'Coastal Escape', 'Sunny Colombo', 'إجازة ساحلية', 'كولومبو المشمسة',
      'Colombo blends colonial charm, ocean breezes and a lively coastal lifestyle.',
      'تمزج كولومبو بين السحر الاستعماري ونسائم المحيط ونمط الحياة الساحلي النابض.', {
        whyP: 'Stroll Galle Face Green, explore bustling markets and temples, and enjoy fresh seafood by the Indian Ocean in Sri Lanka\u2019s vibrant capital.',
        highlights: ['Galle Face Green promenade', 'Gangaramaya Temple', 'Pettah markets', 'Indian Ocean seafront'],
        todo: [{b:'Walk Galle Face:', t:'Enjoy the seaside promenade at sunset.'}, {b:'Visit temples:', t:'Discover the beautiful Gangaramaya Temple.'}, {b:'Taste the cuisine:', t:'Savour fresh seafood and Sri Lankan spices.'}],
        bestTime: 'December to March is the dry season, ideal for enjoying Colombo\u2019s coast and city sights.',
        whyP_ar: 'تنزّه في غال فيس غرين، واستكشف الأسواق والمعابد النابضة، واستمتع بالمأكولات البحرية الطازجة على المحيط الهندي في عاصمة سريلانكا النابضة.',
        highlights_ar: ['ممشى غال فيس غرين', 'معبد غانغارامايا', 'أسواق بيتاه', 'واجهة المحيط الهندي'],
        todo_ar: [{b:'تنزّه في غال فيس:', t:'استمتع بالممشى البحري عند الغروب.'}, {b:'زر المعابد:', t:'اكتشف معبد غانغارامايا الجميل.'}, {b:'تذوّق المطبخ:', t:'استمتع بالمأكولات البحرية الطازجة والتوابل السريلانكية.'}],
        bestTime_ar: 'ديسمبر إلى مارس هو الموسم الجاف، المثالي للاستمتاع بساحل كولومبو ومعالم المدينة.', iata: 'CMB'
      }),
    'dest-damascus': dest(S7 + 'Damascus-web', 'Cultural Heritage', 'Timeless Damascus', 'التراث الثقافي', 'دمشق الخالدة',
      'Damascus is one of the oldest continuously inhabited cities in the world.',
      'دمشق من أقدم المدن المأهولة باستمرار في العالم.', {
        whyP: 'Walk the Old City\u2019s ancient lanes, visit the Umayyad Mosque and the historic Souq Al-Hamidiyah, and savour rich Levantine culture and cuisine.',
        highlights: ['The Umayyad Mosque', 'Souq Al-Hamidiyah', 'The historic Old City', 'Authentic Levantine cuisine'],
        todo: [{b:'Visit the Umayyad Mosque:', t:'Admire one of Islam\u2019s oldest and grandest mosques.'}, {b:'Explore the souq:', t:'Wander the covered Al-Hamidiyah market.'}, {b:'Taste Damascene food:', t:'Enjoy authentic Levantine dishes and sweets.'}],
        bestTime: 'Spring (March\u2013May) and autumn (September\u2013November) bring mild, pleasant weather.',
        whyP_ar: 'تجوّل في أزقة المدينة القديمة، وزر الجامع الأموي وسوق الحميدية التاريخي، وتذوّق ثقافة وأطباق الشام الغنية.',
        highlights_ar: ['الجامع الأموي', 'سوق الحميدية', 'المدينة القديمة التاريخية', 'المطبخ الشامي الأصيل'],
        todo_ar: [{b:'زر الجامع الأموي:', t:'تأمل أحد أقدم وأعظم المساجد في الإسلام.'}, {b:'استكشف السوق:', t:'تجوّل في سوق الحميدية المسقوف.'}, {b:'تذوّق الطعام الدمشقي:', t:'استمتع بأطباق وحلويات الشام الأصيلة.'}],
        bestTime_ar: 'يجلب الربيع (مارس–مايو) والخريف (سبتمبر–نوفمبر) طقساً معتدلاً ولطيفاً.', iata: 'DAM'
      }),
    'dest-assiut': dest(S7 + 'Assiut-web', 'Cultural Heritage', 'Authentic Assiut', 'التراث الثقافي', 'أسيوط الأصيلة',
      'Assiut is the cultural capital of Upper Egypt, rich in history and tradition.',
      'أسيوط هي العاصمة الثقافية لصعيد مصر، غنية بالتاريخ والتقاليد.', {
        whyP: 'Explore ancient tombs, riverside scenery and authentic local life in one of the Nile Valley\u2019s most genuine destinations.',
        highlights: ['Ancient rock-cut tombs', 'Scenic Nile riverside', 'Traditional handicrafts', 'Authentic local markets'],
        todo: [{b:'Discover the tombs:', t:'Visit the ancient necropolis overlooking the city.'}, {b:'Enjoy the Nile:', t:'Take in tranquil riverside views.'}, {b:'Shop local crafts:', t:'Find Assiut\u2019s famous silver-thread textiles.'}],
        bestTime: 'November to March offers the most comfortable weather for sightseeing.',
        whyP_ar: 'استكشف المقابر القديمة ومناظر النهر والحياة المحلية الأصيلة في واحدة من أكثر وجهات وادي النيل أصالة.',
        highlights_ar: ['المقابر المنحوتة في الصخر', 'ضفاف النيل الخلابة', 'الحرف اليدوية التقليدية', 'الأسواق المحلية الأصيلة'],
        todo_ar: [{b:'اكتشف المقابر:', t:'زر الجبانة القديمة المطلة على المدينة.'}, {b:'استمتع بالنيل:', t:'استمتع بمناظر النهر الهادئة.'}, {b:'تسوّق الحرف المحلية:', t:'اعثر على منسوجات أسيوط الشهيرة بخيوط الفضة.'}],
        bestTime_ar: 'يوفّر نوفمبر إلى مارس أكثر الأجواء راحة للتجوّل.', iata: 'ATZ'
      }),
    'dest-amman': dest(S7 + 'Amman-web', 'Cultural Heritage', 'Timeless Amman', 'التراث الثقافي', 'عمّان الخالدة',
      'Amman pairs ancient Roman ruins with a stylish modern Jordanian capital.',
      'تجمع عمّان بين الآثار الرومانية القديمة والعاصمة الأردنية العصرية الأنيقة.', {
        whyP: 'Visit the Citadel and Roman Theatre, explore vibrant downtown cafes, and use Amman as your gateway to Petra and the Dead Sea.',
        highlights: ['The Amman Citadel', 'Roman Theatre', 'Rainbow Street cafes', 'Gateway to Petra & Dead Sea'],
        todo: [{b:'Climb the Citadel:', t:'See Roman, Byzantine and Umayyad ruins with city views.'}, {b:'Visit the Roman Theatre:', t:'Explore the impressive ancient amphitheatre.'}, {b:'Day-trip out:', t:'Reach Petra, Jerash and the Dead Sea with ease.'}],
        bestTime: 'Spring and autumn offer warm days and cool evenings, perfect for exploring.',
        whyP_ar: 'زر القلعة والمدرج الروماني، واستكشف مقاهي وسط البلد النابضة، واتخذ من عمّان بوابتك إلى البتراء والبحر الميت.',
        highlights_ar: ['قلعة عمّان', 'المدرج الروماني', 'مقاهي شارع الرينبو', 'بوابة إلى البتراء والبحر الميت'],
        todo_ar: [{b:'اصعد إلى القلعة:', t:'شاهد الآثار الرومانية والبيزنطية والأموية مع إطلالات على المدينة.'}, {b:'زر المدرج الروماني:', t:'استكشف المدرج القديم المهيب.'}, {b:'قم برحلات يومية:', t:'تصل بسهولة إلى البتراء وجرش والبحر الميت.'}],
        bestTime_ar: 'يوفّر الربيع والخريف أياماً دافئة وأمسيات لطيفة، مثالية للاستكشاف.', iata: 'ADJ'
      }),
    'dest-alexandria': dest(S7 + 'Alexandria-web', 'Coastal Escape', 'Majestic Alexandria', 'إجازة ساحلية', 'الإسكندرية الساحرة',
      'Alexandria is Egypt\u2019s Mediterranean pearl, full of history and sea breeze.',
      'الإسكندرية لؤلؤة مصر على البحر المتوسط، مليئة بالتاريخ ونسيم البحر.', {
        whyP: 'Discover the Bibliotheca Alexandrina, the Citadel of Qaitbay and the elegant Corniche along the Mediterranean coast.',
        highlights: ['Bibliotheca Alexandrina', 'Citadel of Qaitbay', 'The Corniche seafront', 'Roman Catacombs & Pompey\u2019s Pillar'],
        todo: [{b:'Visit the Library:', t:'Explore the modern Bibliotheca Alexandrina.'}, {b:'See Qaitbay Citadel:', t:'Tour the seaside fortress on the Mediterranean.'}, {b:'Stroll the Corniche:', t:'Enjoy the sea breeze and fresh seafood.'}],
        bestTime: 'April to October is ideal for enjoying Alexandria\u2019s beaches and coastal weather.',
        whyP_ar: 'اكتشف مكتبة الإسكندرية وقلعة قايتباي والكورنيش الأنيق على ساحل البحر المتوسط.',
        highlights_ar: ['مكتبة الإسكندرية', 'قلعة قايتباي', 'كورنيش البحر', 'سراديب الموتى الرومانية وعمود السواري'],
        todo_ar: [{b:'زر المكتبة:', t:'استكشف مكتبة الإسكندرية الحديثة.'}, {b:'شاهد قلعة قايتباي:', t:'تجوّل في القلعة الساحلية على المتوسط.'}, {b:'تنزّه على الكورنيش:', t:'استمتع بنسيم البحر والمأكولات البحرية الطازجة.'}],
        bestTime_ar: 'أبريل إلى أكتوبر مثالي للاستمتاع بشواطئ الإسكندرية وأجوائها الساحلية.', iata: 'HBE'
      }),
    'dest-mumbai': dest(S7 + 'Mumbai_-web', 'City Break', 'Vibrant Mumbai', 'إجازة قصيرة في مدينة', 'مومباي النابضة',
      'Mumbai is India\u2019s dynamic city of dreams, energy and culture.',
      'مومباي مدينة الأحلام الهندية النابضة بالطاقة والثقافة.', {
        whyP: 'See the Gateway of India, stroll Marine Drive, explore bustling bazaars and experience the unstoppable energy of India\u2019s financial capital.',
        highlights: ['Gateway of India', 'Marine Drive', 'Colaba Causeway markets', 'Vibrant street food scene'],
        todo: [{b:'See the Gateway of India:', t:'Admire the iconic seafront monument.'}, {b:'Walk Marine Drive:', t:'Enjoy the \u201cQueen\u2019s Necklace\u201d at dusk.'}, {b:'Taste street food:', t:'Try vada pav, pav bhaji and local favourites.'}],
        bestTime: 'November to February brings cooler, drier weather ideal for sightseeing.',
        whyP_ar: 'شاهد بوابة الهند، وتنزّه على مارين درايف، واستكشف الأسواق النابضة، وعِش طاقة عاصمة الهند المالية التي لا تتوقف.',
        highlights_ar: ['بوابة الهند', 'مارين درايف', 'أسواق كولابا', 'مشهد طعام الشارع النابض'],
        todo_ar: [{b:'شاهد بوابة الهند:', t:'تأمل النصب البحري الأيقوني.'}, {b:'تنزّه على مارين درايف:', t:'استمتع بـ\u201cعقد الملكة\u201d عند الغسق.'}, {b:'تذوّق طعام الشارع:', t:'جرّب الأطباق المحلية الشهيرة.'}],
        bestTime_ar: 'يجلب نوفمبر إلى فبراير طقساً أكثر برودة وجفافاً مثالياً للتجوّل.', iata: 'BOM'
      }),

    /* ===================== ALL YOU NEED TO KNOW ===================== */
    'deal-meetgreet': { kind: 'deal', img: S7 + 'Meet-Greet-icon',
      en: { title: 'Meet & Greet WorldWide', tag: 'All you need to know', subtitle: 'A warm welcome wherever you travel.',
        lede: 'Enjoy a personalised Meet & Greet service that assists you through the airport at destinations worldwide.',
        sections: [
          { h: 'About the service', p: 'Enjoy a personalised Meet & Greet service that assists you through the airport \u2013 from arrival and check-in to fast-track immigration and baggage \u2013 at destinations worldwide.', img: S7 + 'Meet-Greet-icon' },
          { h: 'What\u2019s included', checks: ['Personal welcome on arrival or departure', 'Fast-track through immigration', 'Assistance with check-in and baggage', 'Available at airports worldwide'] }
        ], cta: 'Learn more', ctaHref: '/' },
      ar: { title: 'الاستقبال والترحيب حول العالم', tag: 'كل ما تحتاج لمعرفته', subtitle: 'ترحيب حار أينما سافرت.',
        lede: 'استمتع بخدمة استقبال وترحيب شخصية تساعدك في المطار في وجهات حول العالم.',
        sections: [
          { h: 'عن الخدمة', p: 'استمتع بخدمة استقبال وترحيب شخصية تساعدك في المطار \u2013 من الوصول وتسجيل الدخول إلى المسار السريع للجوازات والأمتعة \u2013 في وجهات حول العالم.', img: S7 + 'Meet-Greet-icon' },
          { h: 'ما الذي يشمله', checks: ['ترحيب شخصي عند الوصول أو المغادرة', 'مسار سريع عبر الجوازات', 'مساعدة في تسجيل الدخول والأمتعة', 'متاح في مطارات حول العالم'] }
        ], cta: 'اعرف المزيد', ctaHref: '/' } },
    'deal-baggage': { kind: 'deal', img: S7 + 'Baggage-Allowance',
      en: { title: 'Baggage Allowance', tag: 'All you need to know', subtitle: 'Know exactly what you can bring.',
        lede: 'Review your cabin and checked baggage allowance and add extra bags in advance to save.',
        sections: [
          { h: 'Cabin & checked baggage', p: 'Review your cabin and checked baggage allowance based on your fare bundle, add extra bags in advance to save, and learn about special and oversized item rules before you fly.', img: S7 + 'Baggage-Allowance' },
          { h: 'Good to know', checks: ['Allowance depends on your fare bundle', 'Pre-book extra bags to save', 'Special and sports equipment rules apply', 'Oversized items need advance approval'] }
        ], cta: 'View baggage rules', ctaHref: '/' },
      ar: { title: 'الأمتعة المسموح بها', tag: 'كل ما تحتاج لمعرفته', subtitle: 'اعرف بالضبط ما يمكنك إحضاره.',
        lede: 'راجع الأمتعة المسموح بها في المقصورة والمسجّلة وأضف حقائب إضافية مسبقاً لتوفّر.',
        sections: [
          { h: 'أمتعة المقصورة والمسجّلة', p: 'راجع الأمتعة المسموح بها في المقصورة والمسجّلة حسب باقة سعرك، وأضف حقائب إضافية مسبقاً لتوفّر، وتعرّف على قواعد الأمتعة الخاصة وكبيرة الحجم قبل السفر.', img: S7 + 'Baggage-Allowance' },
          { h: 'معلومات مفيدة', checks: ['تعتمد الكمية على باقة سعرك', 'احجز حقائب إضافية مسبقاً لتوفّر', 'تنطبق قواعد المعدات الخاصة والرياضية', 'تحتاج الأغراض كبيرة الحجم لموافقة مسبقة'] }
        ], cta: 'عرض قواعد الأمتعة', ctaHref: '/' } },
    'deal-carpark': { kind: 'deal', img: S7 + 'Car-Parking-1',
      en: { title: 'Terminal Car Parking', tag: 'All you need to know', subtitle: 'Convenient parking at Jazeera Terminal.',
        lede: 'Reserve secure parking at the Jazeera Terminal (T5) car park, just steps from check-in.',
        sections: [
          { h: 'Park & fly', p: 'Reserve secure parking at the Jazeera Terminal (T5) car park, just steps from check-in. Choose short or long stay options and enjoy a stress-free start to your journey.', img: S7 + 'Car-Parking-1' },
          { h: 'Why use it', checks: ['Secure parking next to the terminal', 'Short and long-stay options', 'Reserve online in advance', 'Steps from check-in'] }
        ], cta: 'Reserve parking', ctaHref: '/' },
      ar: { title: 'مواقف سيارات مبنى الركاب', tag: 'كل ما تحتاج لمعرفته', subtitle: 'مواقف مريحة في مبنى الجزيرة.',
        lede: 'احجز موقفاً آمناً في مبنى الجزيرة (T5)، على بُعد خطوات من تسجيل الدخول.',
        sections: [
          { h: 'اركن وسافر', p: 'احجز موقفاً آمناً في مبنى الجزيرة (T5)، على بُعد خطوات من تسجيل الدخول. اختر خيارات الإقامة القصيرة أو الطويلة واستمتع ببداية رحلة خالية من التوتر.', img: S7 + 'Car-Parking-1' },
          { h: 'لماذا تستخدمها', checks: ['مواقف آمنة بجوار المبنى', 'خيارات إقامة قصيرة وطويلة', 'احجز عبر الإنترنت مسبقاً', 'على بُعد خطوات من تسجيل الدخول'] }
        ], cta: 'احجز موقفاً', ctaHref: '/' } },
    'deal-terminal': { kind: 'deal', img: S7 + 'J9-Terminal-1',
      en: { title: 'Jazeera Terminal', tag: 'All you need to know', subtitle: 'Your dedicated terminal at Kuwait Airport.',
        lede: 'Travel through Jazeera\u2019s own modern terminal (T5) at Kuwait International Airport.',
        sections: [
          { h: 'Jazeera Terminal (T5)', p: 'Travel through Jazeera\u2019s own modern terminal at Kuwait International Airport, designed for a fast, comfortable and seamless experience with dining, lounges and easy access.', img: S7 + 'J9-Terminal-1' },
          { h: 'What to expect', checks: ['Modern, dedicated Jazeera terminal', 'Dining and lounge options', 'Fast, seamless check-in', 'Easy access and parking'] }
        ], cta: 'Explore the terminal', ctaHref: '/' },
      ar: { title: 'مبنى الجزيرة', tag: 'كل ما تحتاج لمعرفته', subtitle: 'مبناك المخصص في مطار الكويت.',
        lede: 'سافر عبر مبنى الجزيرة الحديث الخاص (T5) في مطار الكويت الدولي.',
        sections: [
          { h: 'مبنى الجزيرة (T5)', p: 'سافر عبر مبنى الجزيرة الحديث الخاص في مطار الكويت الدولي، المصمم لتجربة سريعة ومريحة وسلسة مع مطاعم وصالات ووصول سهل.', img: S7 + 'J9-Terminal-1' },
          { h: 'ماذا تتوقع', checks: ['مبنى جزيرة حديث ومخصص', 'خيارات مطاعم وصالات', 'تسجيل دخول سريع وسلس', 'وصول ومواقف سهلة'] }
        ], cta: 'استكشف المبنى', ctaHref: '/' } },
    'deal-faqs': { kind: 'deal', img: S7 + 'FAQs-1',
      en: { title: 'FAQs', tag: 'All you need to know', subtitle: 'Answers to your travel questions.',
        lede: 'Find quick answers about booking, check-in, baggage, changes and refunds and more.',
        sections: [
          { h: 'Frequently asked questions', p: 'Find quick answers about booking, check-in, baggage, changes and refunds, special assistance and more \u2013 everything you need to know before and after you fly.', img: S7 + 'FAQs-1' },
          { h: 'Popular topics', checks: ['Booking and payment', 'Check-in and boarding', 'Baggage rules and extras', 'Changes, refunds and assistance'] }
        ], cta: 'Browse FAQs', ctaHref: '/' },
      ar: { title: 'الأسئلة الشائعة', tag: 'كل ما تحتاج لمعرفته', subtitle: 'إجابات على أسئلة سفرك.',
        lede: 'اعثر على إجابات سريعة حول الحجز وتسجيل الدخول والأمتعة والتغييرات والاسترداد والمزيد.',
        sections: [
          { h: 'الأسئلة المتكررة', p: 'اعثر على إجابات سريعة حول الحجز وتسجيل الدخول والأمتعة والتغييرات والاسترداد والمساعدة الخاصة والمزيد \u2013 كل ما تحتاج معرفته قبل السفر وبعده.', img: S7 + 'FAQs-1' },
          { h: 'مواضيع شائعة', checks: ['الحجز والدفع', 'تسجيل الدخول والصعود', 'قواعد الأمتعة والإضافات', 'التغييرات والاسترداد والمساعدة'] }
        ], cta: 'تصفح الأسئلة الشائعة', ctaHref: '/' } },

    /* =========================== SERVICES =========================== */
    'svc-priority': svc(L + 'priority-service-2', 'Priority Services', 'Seamless travel with priority check-in & baggage',
      'خدمات الأولوية', 'سفر سلس مع أولوية تسجيل الدخول والأمتعة',
      'Skip the queues and travel with ease. Priority Services give you dedicated check-in, priority boarding and priority baggage handling so you spend less time waiting and more time relaxing.',
      'تجاوز الطوابير وسافر بسهولة. تمنحك خدمات الأولوية تسجيل دخول مخصصاً وأولوية في الصعود والتعامل مع الأمتعة، لتقضي وقتاً أقل في الانتظار ووقتاً أكثر في الاسترخاء.',
      ['Dedicated priority check-in counter', 'Priority boarding', 'Priority baggage delivery', 'Less time in queues'],
      ['كاونتر تسجيل دخول مخصص للأولوية', 'أولوية في الصعود للطائرة', 'أولوية في تسليم الأمتعة', 'وقت أقل في الطوابير'],
      'Add Priority Services to your booking during the booking flow or from Manage my booking before you travel.',
      'أضف خدمات الأولوية إلى حجزك أثناء عملية الحجز أو من إدارة حجزي قبل السفر.'),
    'svc-cfar': svc(L + 'CFAR', 'Cancel for Any Reason', "Plans change? We've got you covered, no worries!",
      'الإلغاء لأي سبب', 'هل تغيرت خططك؟ لا تقلق، نحن هنا لتلبية كل احتياجاتك!',
      'Life is unpredictable. With Cancel for Any Reason, you can cancel your booking and receive a refund to your travel wallet \u2013 no questions asked \u2013 within the eligible window before departure.',
      'الحياة لا يمكن التنبؤ بها. مع خدمة الإلغاء لأي سبب، يمكنك إلغاء حجزك واسترداد المبلغ إلى محفظة السفر \u2013 دون أسئلة \u2013 ضمن الفترة المؤهلة قبل المغادرة.',
      ['Cancel for any reason', 'Refund to travel wallet', 'No questions asked', 'Flexible peace of mind'],
      ['إلغاء لأي سبب كان', 'استرداد إلى محفظة السفر', 'دون أي أسئلة', 'مرونة وراحة بال'],
      'Add Cancel for Any Reason while booking. You can then cancel online within the eligible window before departure.',
      'أضف خدمة الإلغاء لأي سبب أثناء الحجز. يمكنك بعدها الإلغاء عبر الإنترنت ضمن الفترة المؤهلة قبل المغادرة.'),
    'svc-pets': svc(L + 'TravellingWithAnimals', 'Travelling with Animals', 'Your ultimate guide to flying with pets.',
      'السفر مع الحيوانات', 'كل ما تحتاج معرفته للسفر مع حيوانك الأليف',
      'Bring your furry companion along. Learn about cabin and hold options, carrier requirements, documentation and how to add your pet to your booking for a smooth journey together.',
      'اصطحب رفيقك الأليف معك. تعرّف على خيارات المقصورة والمخزن ومتطلبات الحاوية والوثائق وكيفية إضافة حيوانك إلى حجزك لرحلة سلسة معاً.',
      ['Cabin and hold transport options', 'Carrier and crate guidance', 'Documentation requirements', 'Easy add to booking'],
      ['خيارات النقل في المقصورة والمخزن', 'إرشادات الحاوية والقفص', 'متطلبات الوثائق', 'إضافة سهلة إلى الحجز'],
      'Add your pet during booking or via Manage my booking, then provide the required documentation before travel.',
      'أضف حيوانك أثناء الحجز أو عبر إدارة حجزي، ثم قدّم الوثائق المطلوبة قبل السفر.'),
    'svc-carpark': svc(L + 'Carpark', 'Terminal Car Park', 'Convenient parking for Jazeera passengers',
      'مواقف مبنى الركاب', 'مواقف مريحة لركاب الجزيرة',
      'Reserve secure parking right at the Jazeera Terminal. Choose short or long-stay options, drive straight to the terminal and walk a few steps to check-in.',
      'احجز موقفاً آمناً مباشرةً في مبنى الجزيرة. اختر خيارات الإقامة القصيرة أو الطويلة، وقُد سيارتك مباشرةً إلى المبنى وامشِ خطوات قليلة لتسجيل الدخول.',
      ['Secure on-site parking', 'Short and long stay rates', 'Reserve in advance', 'Steps from check-in'],
      ['مواقف آمنة في الموقع', 'أسعار للإقامة القصيرة والطويلة', 'احجز مسبقاً', 'على بُعد خطوات من تسجيل الدخول'],
      'Reserve your parking spot online in advance, then drive straight to the Jazeera Terminal on your travel day.',
      'احجز موقفك عبر الإنترنت مسبقاً، ثم قُد سيارتك مباشرةً إلى مبنى الجزيرة في يوم سفرك.'),
    'svc-hayakom': svc(L + 'hayakomservice_meetassistand', 'Hayakom Services', 'Arrive or depart \u2013 assistance tailored for you',
      'خدمات حياكم', 'الوصول أو المغادرة \u2013 مساعدة مصممة خصيصاً لك',
      'Hayakom is our premium meet-and-assist service. A dedicated agent welcomes you and guides you through check-in, immigration and baggage on arrival or departure for a truly effortless experience.',
      'حياكم هي خدمة الاستقبال والمساعدة المميزة لدينا. يرحب بك موظف مخصص ويرافقك خلال تسجيل الدخول والجوازات والأمتعة عند الوصول أو المغادرة لتجربة سهلة تماماً.',
      ['Personal meet-and-assist agent', 'Fast-track through the airport', 'Help with check-in and baggage', 'Available on arrival and departure'],
      ['موظف استقبال ومساعدة شخصي', 'مسار سريع عبر المطار', 'مساعدة في تسجيل الدخول والأمتعة', 'متاح عند الوصول والمغادرة'],
      'Request Hayakom while booking or via Manage my booking, and our team will be ready to welcome you.',
      'اطلب خدمة حياكم أثناء الحجز أو عبر إدارة حجزي، وسيكون فريقنا جاهزاً لاستقبالك.'),
    'svc-wheelchair': svc(L + 'wheelchairassistance_fullassistance', 'Wheelchair Assistance', 'Comfort and care every step of the way',
      'خدمة الكراسي المتحركة', 'راحة وعناية مميزة معك في كل خطوة',
      'We are committed to accessible travel. Request wheelchair assistance during booking and our team will support you from the terminal entrance to your seat, and again on arrival.',
      'نحن ملتزمون بسفر ميسّر للجميع. اطلب خدمة الكرسي المتحرك أثناء الحجز وسيرافقك فريقنا من مدخل المبنى حتى مقعدك، ومرة أخرى عند الوصول.',
      ['Assistance from terminal to seat', 'Trained, caring staff', 'Support on arrival too', 'Request easily during booking'],
      ['مساعدة من المبنى حتى المقعد', 'طاقم مدرّب ومهتم', 'دعم عند الوصول أيضاً', 'اطلبها بسهولة أثناء الحجز'],
      'Add wheelchair assistance during booking or via Manage my booking at least 48 hours before departure.',
      'أضف خدمة الكرسي المتحرك أثناء الحجز أو عبر إدارة حجزي قبل المغادرة بـ 48 ساعة على الأقل.'),
    'svc-um': svc(L + 'UM', 'Unaccompanied Minor', 'Young travellers, expertly guided',
      'القُصّر غير المصحوبين', 'رحلات الشباب بإشراف مرشدين سياحيين حصريين',
      'Travelling solo? Our Unaccompanied Minor service ensures young travellers are escorted and cared for by our staff throughout the journey, from check-in to handover at the destination.',
      'يسافر بمفرده؟ تضمن خدمة القُصّر غير المصحوبين أن يحظى المسافرون الصغار بمرافقة ورعاية طاقمنا طوال الرحلة، من تسجيل الدخول حتى التسليم في الوجهة.',
      ['Supervised throughout the journey', 'Escorted at the airport', 'Secure handover at destination', 'Peace of mind for families'],
      ['إشراف طوال الرحلة', 'مرافقة في المطار', 'تسليم آمن في الوجهة', 'راحة بال للعائلات'],
      'Add the Unaccompanied Minor service while booking and provide guardian details for departure and arrival.',
      'أضف خدمة القُصّر غير المصحوبين أثناء الحجز وقدّم بيانات ولي الأمر عند المغادرة والوصول.'),
    'svc-earlycheckin': svc(L + 'earlycheckin_aboutearlycheckin', 'Early Check-in', 'Ease your travel with our early check-in service',
      'تسجيل الدخول المبكر', 'سهّل سفرك مع خدمة تسجيل الدخول المبكر',
      'Beat the rush by checking in early. Drop your bags ahead of time, secure your seat and head into the terminal relaxed and ready well before your flight.',
      'تجنّب الزحام بتسجيل الدخول مبكراً. سلّم أمتعتك مسبقاً، واحجز مقعدك، وادخل المبنى مرتاحاً وجاهزاً قبل رحلتك بوقت كافٍ.',
      ['Check in ahead of time', 'Early bag drop', 'Secure your seat early', 'Less waiting at the airport'],
      ['تسجيل الدخول مسبقاً', 'تسليم الأمتعة مبكراً', 'احجز مقعدك مبكراً', 'انتظار أقل في المطار'],
      'Add Early Check-in while booking or from Manage my booking and arrive relaxed on your travel day.',
      'أضف خدمة تسجيل الدخول المبكر أثناء الحجز أو من إدارة حجزي ووصِل مرتاحاً في يوم سفرك.'),
    'svc-disruption': svc(L + 'DisruptionAssistance', 'Disruption Assistance', 'Easy rebooking or refund when plans change.',
      'المساعدة عند الاضطرابات', 'إعادة حجز سهلة أو استرداد عند تغير الخطط.',
      'If your flight is disrupted, we make it easy to rebook on the next available option or request a refund. Manage everything quickly online or with our team\u2019s support.',
      'إذا تعرّضت رحلتك لاضطراب، نجعل من السهل إعادة الحجز على الخيار المتاح التالي أو طلب استرداد. أدِر كل شيء بسرعة عبر الإنترنت أو بدعم من فريقنا.',
      ['Quick rebooking options', 'Simple refund requests', 'Manage online easily', 'Support when plans change'],
      ['خيارات سريعة لإعادة الحجز', 'طلبات استرداد بسيطة', 'إدارة سهلة عبر الإنترنت', 'دعم عند تغير الخطط'],
      'If your flight changes, open Manage my booking to rebook or request a refund, or contact our support team.',
      'إذا تغيّرت رحلتك، افتح إدارة حجزي لإعادة الحجز أو طلب الاسترداد، أو تواصل مع فريق الدعم.'),
    'svc-crossairline': svc(L + 'CrossAirlineBaggage', 'Cross Airline Transfers', 'Easy connections when flying multiple airlines',
      'التنقل بين شركات الطيران', 'اتصالات سهلة عند السفر عبر عدة شركات طيران',
      'Connecting on more than one airline? Our cross airline transfer service helps you move smoothly between flights with coordinated baggage and connections for a hassle-free journey.',
      'هل لديك اتصال عبر أكثر من شركة طيران؟ تساعدك خدمة التنقل بين شركات الطيران على الانتقال بسلاسة بين الرحلات مع تنسيق الأمتعة والاتصالات لرحلة خالية من المتاعب.',
      ['Coordinated baggage transfer', 'Smooth multi-airline connections', 'Guidance between flights', 'Less stress while connecting'],
      ['نقل منسّق للأمتعة', 'اتصالات سلسة بين عدة شركات', 'إرشاد بين الرحلات', 'توتر أقل أثناء الاتصال'],
      'Select the cross airline transfer option when booking connecting itineraries that include other airlines.',
      'اختر خيار التنقل بين شركات الطيران عند حجز رحلات متصلة تشمل شركات طيران أخرى.'),

    /* ================ BUILDING AVIATION PROFESSIONALS =============== */
    'av-cabincrew': { kind: 'aviation', img: S7 + 'cabincrewtrainingcourse_whosthiscourse',
      en: { title: 'Cabin Crew Training Course', tag: 'Building Aviation Professionals',
        subtitle: 'Soar higher and create unforgettable journeys',
        lede: 'Kickstart your career in aviation with our cabin crew training course \u2013 your boarding pass to a fun, challenging and incredibly rewarding career.',
        sections: [
          { h: 'Who\u2019s this course for?', p: 'If you\u2019re a young professional ready to launch your career or a globetrotter at heart looking to turn your passion into a profession, this cabin crew course is made for you. We\u2019ll give you all the tools, tips and training to stand out with leading airlines around the world.', img: S7 + 'cabincrewtrainingcourse_whosthiscourse' },
          { h: 'What you\u2019ll learn', feats: [
            {b:'Safety first, always:', t:'Handle emergencies like a pro \u2013 from turbulence to tantrums \u2013 using real equipment.'},
            {b:'Service with a smile:', t:'Master the art of hospitality even at 30,000 feet.'},
            {b:'Grooming and etiquette:', t:'Learn how to shine inside and out as a flight attendant.'},
            {b:'Cultural awareness:', t:'Understand passengers from all walks of life.'},
            {b:'Communication skills:', t:'Nail announcements and handle every request with grace.'},
            {b:'Teamwork and leadership:', t:'Learn to lead, support and soar together.'}
          ] },
          { h: 'Course format and study style', checks: ['Classroom training with interactive, real-life scenarios', 'Practical sessions: fire drills, swimming and emergency procedures', 'All lessons taught in English', 'Score 80% or more to pass \u2013 we\u2019ll help you get there'] },
          { h: 'What\u2019s in the course?', subh: 'Theoretical & practical topics', checks: ['Introduction to aviation, rules & regulations', 'Safety and emergency procedures', 'Crew coordination & passenger handling', 'Fire, smoke and water survival training', 'Aero-medical aspects and first aid', 'Dangerous goods (DGR) & aviation security', 'Customer service and grooming', 'Practical fire drill & swimming test'] },
          { h: 'Certification & registration', p: 'Pass the final exams and assessments, and you\u2019ll walk away with a certificate of completion \u2013 your ticket to a world of job opportunities. Spaces are limited to 18 students per course, on a first come, first served basis. To register, contact cabincrewadministrator@jazeeraairways.com.' }
        ], cta: 'Know more', ctaHref: 'mailto:cabincrewadministrator@jazeeraairways.com' },
      ar: { title: 'دورة تدريب طاقم الطائرة', tag: 'بناء محترفي الطيران',
        subtitle: 'حلّق أعلى واصنع رحلات لا تُنسى',
        lede: 'ابدأ مسيرتك المهنية في الطيران مع دورة تدريب طاقم الطائرة \u2013 بطاقة صعودك إلى مهنة ممتعة ومليئة بالتحديات ومجزية للغاية.',
        sections: [
          { h: 'لمن هذه الدورة؟', p: 'سواء كنت محترفاً شاباً مستعداً لإطلاق مسيرته أو مسافراً بطبعك تريد تحويل شغفك إلى مهنة، فهذه الدورة صُمّمت لك. سنمنحك كل الأدوات والنصائح والتدريب لتتميّز مع كبرى شركات الطيران حول العالم.', img: S7 + 'cabincrewtrainingcourse_whosthiscourse' },
          { h: 'ماذا ستتعلم', feats: [
            {b:'السلامة أولاً دائماً:', t:'تعامل مع الطوارئ باحتراف باستخدام معدات حقيقية.'},
            {b:'خدمة بابتسامة:', t:'أتقن فن الضيافة حتى على ارتفاع 30,000 قدم.'},
            {b:'العناية بالمظهر والإتيكيت:', t:'تعلّم كيف تتألق ظاهراً وباطناً كمضيف طيران.'},
            {b:'الوعي الثقافي:', t:'افهم المسافرين من مختلف الخلفيات.'},
            {b:'مهارات التواصل:', t:'أتقن الإعلانات وتعامل مع كل طلب برقي.'},
            {b:'العمل الجماعي والقيادة:', t:'تعلّم القيادة والدعم والتحليق معاً.'}
          ] },
          { h: 'صيغة الدورة وأسلوب الدراسة', checks: ['تدريب صفي بسيناريوهات تفاعلية واقعية', 'جلسات عملية: تدريبات الحريق والسباحة وإجراءات الطوارئ', 'جميع الدروس باللغة الإنجليزية', 'تحتاج 80٪ أو أكثر للنجاح \u2013 وسنساعدك على ذلك'] },
          { h: 'ماذا في الدورة؟', subh: 'مواضيع نظرية وعملية', checks: ['مقدمة في الطيران والقواعد واللوائح', 'إجراءات السلامة والطوارئ', 'تنسيق الطاقم والتعامل مع الركاب', 'تدريب الحريق والدخان والنجاة في الماء', 'الجوانب الطبية الجوية والإسعافات الأولية', 'البضائع الخطرة (DGR) وأمن الطيران', 'خدمة العملاء والعناية بالمظهر', 'تدريب عملي على الحريق واختبار السباحة'] },
          { h: 'الشهادة والتسجيل', p: 'اجتز الاختبارات والتقييمات النهائية لتحصل على شهادة إتمام \u2013 بطاقتك إلى عالم من الفرص الوظيفية. المقاعد محدودة بـ 18 طالباً لكل دورة، بنظام الأسبقية في التسجيل. للتسجيل، تواصل مع cabincrewadministrator@jazeeraairways.com.' }
        ], cta: 'اعرف المزيد', ctaHref: 'mailto:cabincrewadministrator@jazeeraairways.com' } },
    'av-aviation': { kind: 'aviation', img: S7 + 'launchyouraviationjourney_careerpathway',
      en: { title: 'Aviation Course', tag: 'Building Aviation Professionals',
        subtitle: 'Take the first step towards your dreams in the skies',
        lede: 'Explore aviation and pilot courses designed for future aviators. Jazeera Airways invites you to take the first step with our \u201cIntroduction to Aviation\u201d course.',
        sections: [
          { h: 'What you\u2019ll learn', p: 'This immersive course blends theoretical knowledge with hands-on experience, giving you a solid foundation in aviation. Whether you\u2019re exploring aviation as a career or simply curious, this course is your runway to the skies.', img: S7 + 'launchyouraviationjourney_whatyoullearn' },
          { h: 'What\u2019s in the course?', subh: 'Modules include', checks: ['Aviation English \u2013 communicate like a pro', 'Principles of Flight', 'Aircraft General Knowledge', 'Communication Skills', 'Pilot Medical Check', 'Simulator Session', 'Psychometric Assessment'] },
          { h: 'Who can enroll?', checks: ['Age: 17 years and older', 'Language: proficient in English', 'Residency: citizens and residents of Kuwait', 'Seats: limited, first-come first-served'] },
          { h: 'Why choose Jazeera Airways?', cards: [
            { h: 'Industry expertise', p: 'Learn from professionals at one of Kuwait\u2019s leading airlines.' },
            { h: 'Practical exposure', p: 'Get real-world insights through simulator sessions.' },
            { h: 'Career pathway', p: 'A stepping stone to becoming a certified pilot.' }
          ] },
          { h: 'Reserve your seat today', p: 'Seats are limited and fill up super-fast. Don\u2019t miss your chance to explore the world of aviation with Jazeera Airways.' }
        ], cta: 'Enroll now', ctaHref: 'https://jazeeraairways.jotform.com/241502773093050' },
      ar: { title: 'دورة تدريبية للطيران', tag: 'بناء محترفي الطيران',
        subtitle: 'اتخذ الخطوة الأولى نحو أحلامك في السماء',
        lede: 'استكشف دورات الطيران المصممة للطيارين المستقبليين. تدعوك طيران الجزيرة لاتخاذ الخطوة الأولى مع دورة \u201cمقدمة في الطيران\u201d.',
        sections: [
          { h: 'ماذا ستتعلم', p: 'تمزج هذه الدورة الغامرة بين المعرفة النظرية والخبرة العملية، لتمنحك أساساً متيناً في الطيران. سواء كنت تستكشف الطيران كمهنة أو بدافع الفضول، فهذه الدورة مدرجك نحو السماء.', img: S7 + 'launchyouraviationjourney_whatyoullearn' },
          { h: 'ماذا في الدورة؟', subh: 'تشمل الوحدات', checks: ['الإنجليزية للطيران \u2013 تواصل باحتراف', 'مبادئ الطيران', 'المعرفة العامة بالطائرات', 'مهارات التواصل', 'الفحص الطبي للطيار', 'جلسة محاكاة الطيران', 'التقييم النفسي والقدرات'] },
          { h: 'من يمكنه التسجيل؟', checks: ['العمر: 17 عاماً فأكثر', 'اللغة: إجادة الإنجليزية', 'الإقامة: مواطنو ومقيمو الكويت', 'المقاعد: محدودة بنظام الأسبقية'] },
          { h: 'لماذا تختار طيران الجزيرة؟', cards: [
            { h: 'خبرة في القطاع', p: 'تعلّم من محترفين في إحدى أبرز شركات الطيران في الكويت.' },
            { h: 'تطبيق عملي', p: 'احصل على رؤى واقعية عبر جلسات المحاكاة.' },
            { h: 'مسار مهني', p: 'خطوة نحو أن تصبح طياراً معتمداً.' }
          ] },
          { h: 'احجز مقعدك اليوم', p: 'المقاعد محدودة وتمتلئ بسرعة كبيرة. لا تفوّت فرصتك لاستكشاف عالم الطيران مع طيران الجزيرة.' }
        ], cta: 'سجّل الآن', ctaHref: 'https://jazeeraairways.jotform.com/241502773093050' } },
    'av-graduate': { kind: 'aviation', img: S7 + 'Graduate_training',
      en: { title: 'Graduate Development Program', tag: 'Building Aviation Professionals',
        subtitle: 'Launch your career in aviation with us',
        lede: 'Are you a fresh graduate with big ambitions? Jazeera Airways invites young Kuwaiti nationals to join our Graduate Development Program in Aviation.',
        sections: [
          { h: 'What\u2019s in it for you?', p: 'Step into the aviation industry with hands-on experience, structured training and exposure to key departments. This program is designed to help you build real-world skills, grow professionally and prepare for future leadership opportunities at Jazeera Airways.', img: S7 + 'graduatedevelopmentprogram_whatsinit' },
          { h: 'Training areas', subh: 'Explore diverse departments', checks: ['Aircraft Maintenance Engineering', 'Call Center', 'Finance & Accounting', 'Flight Operations', 'Ground Operations', 'Human Resources', 'Information Technology', 'Marketing & Customer Experience', 'Sales & Revenue Optimization', 'Network Planning'] },
          { h: 'Eligibility criteria', checks: ['Be 21 years of age or older', 'Have a high school diploma (minimum)', 'Provide a valid medical clearance certificate', 'Submit a police clearance certificate', 'Strong communication in English and Arabic'] },
          { h: 'Ready to take off?', p: 'Apply now for the Graduate Development Program and let your dreams take flight.' }
        ], cta: 'Enroll now', ctaHref: 'https://jazeeraairways.jotform.com/222011974417047' },
      ar: { title: 'برنامج تدريب الخريجين', tag: 'بناء محترفي الطيران',
        subtitle: 'انطلق بمسيرتك المهنية في الطيران معنا',
        lede: 'هل أنت خريج جديد بطموحات كبيرة؟ تدعو طيران الجزيرة الشباب الكويتي للانضمام إلى برنامج تطوير الخريجين في الطيران.',
        sections: [
          { h: 'ماذا ستجني من البرنامج؟', p: 'ادخل قطاع الطيران بخبرة عملية وتدريب منظم واطلاع على الأقسام الرئيسية. صُمّم هذا البرنامج لمساعدتك على بناء مهارات واقعية، والنمو مهنياً، والاستعداد لفرص قيادية مستقبلية في طيران الجزيرة.', img: S7 + 'graduatedevelopmentprogram_whatsinit' },
          { h: 'مجالات التدريب', subh: 'استكشف أقساماً متنوعة', checks: ['هندسة صيانة الطائرات', 'مركز الاتصال', 'المالية والمحاسبة', 'عمليات الطيران', 'العمليات الأرضية', 'الموارد البشرية', 'تقنية المعلومات', 'التسويق وتجربة العملاء', 'المبيعات وتحسين الإيرادات', 'تخطيط الشبكة'] },
          { h: 'شروط التقديم', checks: ['أن يكون عمرك 21 عاماً أو أكثر', 'شهادة الثانوية العامة كحد أدنى', 'شهادة لياقة طبية سارية', 'شهادة عدم محكومية', 'مهارات تواصل قوية بالعربية والإنجليزية'] },
          { h: 'مستعد للانطلاق؟', p: 'قدّم الآن لبرنامج تطوير الخريجين ودع أحلامك تحلّق.' }
        ], cta: 'سجّل الآن', ctaHref: 'https://jazeeraairways.jotform.com/222011974417047' } },

    /* ========================== MEMBERSHIP ========================= */
    'membership': { kind: 'membership', img: L + 'img-banner',
      en: { title: 'Your Travel Starts Here', tag: 'Jazeera Membership', subtitle: 'Sign in or sign up for seamless bookings.',
        lede: 'Create your free Jazeera account for faster, more personalised bookings and easy trip management.',
        sections: [
          { h: 'Join Jazeera', p: 'Create your free Jazeera account to manage bookings, save travellers and payment details, track your trips and enjoy a faster, more personalised booking experience every time you fly.', img: L + 'img-banner' },
          { h: 'Member benefits', checks: ['Faster, saved-details booking', 'Manage and track your trips', 'Save travellers and payment cards', 'A more personalised experience'] }
        ], cta: 'Sign in or join us', ctaHref: '/' },
      ar: { title: 'رحلتك تبدأ من هنا', tag: 'عضوية الجزيرة', subtitle: 'سجّل الدخول أو أنشئ حساباً لحجوزات سلسة.',
        lede: 'أنشئ حسابك المجاني في الجزيرة لحجوزات أسرع وأكثر تخصيصاً وإدارة سهلة لرحلاتك.',
        sections: [
          { h: 'انضم إلى الجزيرة', p: 'أنشئ حسابك المجاني في الجزيرة لإدارة الحجوزات، وحفظ بيانات المسافرين والدفع، وتتبّع رحلاتك، والاستمتاع بتجربة حجز أسرع وأكثر تخصيصاً في كل مرة تسافر فيها.', img: L + 'img-banner' },
          { h: 'مزايا العضوية', checks: ['حجز أسرع ببيانات محفوظة', 'إدارة وتتبّع رحلاتك', 'حفظ المسافرين وبطاقات الدفع', 'تجربة أكثر تخصيصاً'] }
        ], cta: 'سجّل الدخول أو انضم إلينا', ctaHref: '/' } }
  };

  /* ---------- Promo banners (Buy One Get One Free) ---------- */
  function promo(city, img, enCountry, arCity, arCountry) {
    return { kind: 'promo', img: img,
      en: { title: city, tag: 'Buy One Get One Free', subtitle: 'Buy one ticket and get the second free to ' + city + '.',
        lede: 'Discover ' + city + (enCountry ? ', ' + enCountry : '') + ' with our Buy One Get One Free companion offer.',
        sections: [
          { h: 'Offer details', p: 'Discover ' + city + (enCountry ? ', ' + enCountry : '') + ' with our Buy One Get One Free offer. Travel with a companion and only pay for one ticket on selected flights and travel dates.', img: img },
          { h: 'How to redeem', p: 'Book during the promotional period on eligible flights. The companion discount is applied automatically to qualifying bookings.' },
          { h: 'Good to know', checks: ['Companion offer on selected flights', 'Valid for selected travel dates', 'Subject to availability', 'Taxes and fees may apply'] }
        ], cta: 'Book this offer', ctaHref: '/' },
      ar: { title: arCity, tag: 'اشترِ واحدة واحصل على الأخرى مجاناً', subtitle: 'اشترِ تذكرة واحصل على الثانية مجاناً إلى ' + arCity + '.',
        lede: 'اكتشف ' + arCity + (arCountry ? '، ' + arCountry : '') + ' مع عرض المرافق اشترِ واحدة واحصل على الأخرى مجاناً.',
        sections: [
          { h: 'تفاصيل العرض', p: 'اكتشف ' + arCity + (arCountry ? '، ' + arCountry : '') + ' مع عرض اشترِ واحدة واحصل على الأخرى مجاناً. سافر مع مرافق وادفع ثمن تذكرة واحدة فقط على رحلات وتواريخ سفر محددة.', img: img },
          { h: 'كيفية الاستفادة', p: 'احجز خلال فترة العرض على الرحلات المؤهلة. يُطبّق خصم المرافق تلقائياً على الحجوزات المؤهلة.' },
          { h: 'معلومات مفيدة', checks: ['عرض المرافق على رحلات محددة', 'صالح لتواريخ سفر محددة', 'يخضع للتوفر', 'قد تنطبق ضرائب ورسوم'] }
        ], cta: 'احجز هذا العرض', ctaHref: '/' } };
  }
  DATA['promo-budapest'] = promo('Budapest', L + 'Budapest_EN', 'Hungary', 'بودابست', 'المجر');
  DATA['promo-krakow']   = promo('Krakow', L + 'Krakow_EN', 'Poland', 'كراكوف', 'بولندا');
  DATA['promo-prague']   = promo('Prague', L + 'Prague_EN', 'Czechia', 'براغ', 'التشيك');
  DATA['promo-tivat']    = promo('Tivat', L + 'Tivat_EN', 'Montenegro', 'تيفات', 'الجبل الأسود');
  DATA['promo-luton']    = promo('London Luton', L + 'Luton_EN', 'United Kingdom', 'لندن لوتون', 'المملكة المتحدة');

  DATA['promo-priority'] = { kind: 'promo', img: L + 'Priority-Service-offer-1',
    en: { title: 'Priority Service Offer', tag: 'Offer', subtitle: 'Upgrade your journey with priority services.',
      lede: 'Enjoy a special rate on Priority Services when you add them to your booking during the offer period.',
      sections: [
        { h: 'Offer details', p: 'Enjoy a special rate on Priority Services \u2013 priority check-in, boarding and baggage \u2013 when you add them to your booking during the offer period.', img: L + 'Priority-Service-offer-1' },
        { h: 'What\u2019s included', checks: ['Priority check-in', 'Priority boarding', 'Priority baggage', 'Special offer-period rate'] }
      ], cta: 'Book this offer', ctaHref: '/' },
    ar: { title: 'عرض خدمة الأولوية', tag: 'عرض', subtitle: 'طوّر رحلتك مع خدمات الأولوية.',
      lede: 'استمتع بسعر خاص على خدمات الأولوية عند إضافتها إلى حجزك خلال فترة العرض.',
      sections: [
        { h: 'تفاصيل العرض', p: 'استمتع بسعر خاص على خدمات الأولوية \u2013 أولوية تسجيل الدخول والصعود والأمتعة \u2013 عند إضافتها إلى حجزك خلال فترة العرض.', img: L + 'Priority-Service-offer-1' },
        { h: 'ما الذي يشمله', checks: ['أولوية تسجيل الدخول', 'أولوية الصعود', 'أولوية الأمتعة', 'سعر خاص خلال فترة العرض'] }
      ], cta: 'احجز هذا العرض', ctaHref: '/' } };
  DATA['promo-seats'] = { kind: 'promo', img: L + 'Seats-offers-1',
    en: { title: 'Seat Selection Offer', tag: 'Offer', subtitle: 'Pick your perfect seat for less.',
      lede: 'Choose your preferred seat at a special price when you select seats during the offer period.',
      sections: [
        { h: 'Offer details', p: 'Choose your preferred seat \u2013 extra legroom, up front or together as a group \u2013 at a special price when you select seats during the offer period.', img: L + 'Seats-offers-1' },
        { h: 'Seat options', checks: ['Extra legroom seats', 'Seats up front', 'Sit together as a group', 'Special offer-period price'] }
      ], cta: 'Book this offer', ctaHref: '/' },
    ar: { title: 'عرض اختيار المقاعد', tag: 'عرض', subtitle: 'اختر مقعدك المثالي بسعر أقل.',
      lede: 'اختر مقعدك المفضل بسعر خاص عند اختيار المقاعد خلال فترة العرض.',
      sections: [
        { h: 'تفاصيل العرض', p: 'اختر مقعدك المفضل \u2013 مساحة إضافية للأرجل، في المقدمة، أو معاً كمجموعة \u2013 بسعر خاص عند اختيار المقاعد خلال فترة العرض.', img: L + 'Seats-offers-1' },
        { h: 'خيارات المقاعد', checks: ['مقاعد بمساحة إضافية للأرجل', 'مقاعد في المقدمة', 'الجلوس معاً كمجموعة', 'سعر خاص خلال فترة العرض'] }
      ], cta: 'احجز هذا العرض', ctaHref: '/' } };
  DATA['promo-jcafe'] = { kind: 'promo', img: L + 'J-Cafe-1-1',
    en: { title: 'J-Cafe Offer', tag: 'Offer', subtitle: 'Pre-book your in-flight meals and save.',
      lede: 'Enjoy fresh, delicious meals on board from J-Cafe \u2013 pre-book before you fly to save and guarantee availability.',
      sections: [
        { h: 'Offer details', p: 'Enjoy fresh, delicious meals on board from J-Cafe. Pre-book your favourite meals before you fly to guarantee availability and enjoy great value.', img: L + 'J-Cafe-1-1' },
        { h: 'Why pre-book', checks: ['Guarantee meal availability', 'Great value vs onboard prices', 'Choose your favourites in advance', 'Fresh, delicious in-flight dining'] }
      ], cta: 'Book this offer', ctaHref: '/' },
    ar: { title: 'عرض جيه-كافيه', tag: 'عرض', subtitle: 'احجز وجباتك على متن الطائرة مسبقاً ووفّر.',
      lede: 'استمتع بوجبات طازجة ولذيذة على متن الطائرة من جيه-كافيه \u2013 احجز قبل السفر لتوفّر وتضمن التوفر.',
      sections: [
        { h: 'تفاصيل العرض', p: 'استمتع بوجبات طازجة ولذيذة على متن الطائرة من جيه-كافيه. احجز وجباتك المفضلة قبل السفر لضمان توفرها والاستمتاع بقيمة رائعة.', img: L + 'J-Cafe-1-1' },
        { h: 'لماذا الحجز المسبق', checks: ['ضمان توفر الوجبة', 'قيمة رائعة مقارنةً بأسعار الطائرة', 'اختر مفضلاتك مسبقاً', 'وجبات طازجة ولذيذة على متن الطائرة'] }
      ], cta: 'احجز هذا العرض', ctaHref: '/' } };

  window.JZ_DETAIL_DATA = DATA;
})();

import { useRoute } from "wouter";

const defaultSteps = [
  {
    title: "الدخول على المنصة:",
    description: "عبر النفاذ الوطني الموحد من خلال منصة المركز السعودي للأعمال."
  },
  {
    title: "اختيار الخدمة:",
    description: 'من "الخدمات الإلكترونية" > " قيد سجل تجاري" > تحديد نوع السجل "مؤسسة"، ثم البدء بالخدمة.'
  },
  {
    title: "تعبئة بيانات المؤسسة:",
    description: "مراجعة الشروط والموافقة عليها. - تعبئة بيانات المالك وبيانات الاتصال. - إدخال عنوان الأعمال المعتمد."
  },
  {
    title: "إضافة البيانات المطلوبة:",
    description: "إختيار الأنشطة التجارية. - إدخال بيانات التجارة الإلكترونية (إن وُجدت). - تحديد رأس المال. - اختيار نوع الإسم التجاري وتكوينه."
  },
  {
    title: "استكمال بيانات السجل التجاري:",
    description: "إدخال عنوان المؤسسة وبيانات الاتصال. - تعيين مدير المؤسسة وإدخال بياناته."
  },
  {
    title: "مراجعة وتقديم الطلب:",
    description: "استعراض ملخص الطلب. - الموافقة على الإقرار وتقديم الطلب."
  },
  {
    title: "موافقة الأطراف:",
    description: "في حال تطلب الأمر، تتم الموافقة من مالك السجل أو المدراء الآخرين."
  },
  {
    title: "الدفع:",
    description: "إصدار الفاتورة، ودفع الرسوم عبر خدمة سداد أو البطاقة. - بعد الدفع، يتم إصدار السجل التجاري رسميًا."
  },
  {
    title: "التسجيل التلقائي في الجهات ذات العلاقة:",
    description: "بعد إصدار السجل، يتم التسجيل تلقائيًا في: وزارة الموارد البشرية - هيئة الزكاة والضريبة والجمارك - المؤسسة العامة للتأمينات الاجتماعية - البريد السعودي (العنوان الوطني) - الغرفة التجارية."
  }
];

const reserveNameSteps = [
  {
    title: "الدخول على المنصة:",
    description: "عبر النفاذ الوطني الموحد من خلال منصة المركز السعودي للأعمال."
  },
  {
    title: "اختيار الخدمة:",
    description: 'من "ممارسة الأعمال" > "وزارة التجارة" > "حجز اسم تجاري" - أو من "الخدمات العامة" > "إدارة الأسماء التجارية المحجوزة" > "حجز اسم تجاري".'
  },
  {
    title: "بدء الخدمة:",
    description: 'الاطلاع على الشروط والمتطلبات، ثم الموافقة والضغط على "التقديم على الخدمة".'
  },
  {
    title: "إدخال البيانات:",
    description: "اختيار نوع الحجز ولغة الاسم التجاري - إدخال حتى 5 أسماء تجارية مقترحة."
  },
  {
    title: "مراجعة وتقديم الطلب:",
    description: "مراجعة ملخص الطلب، تعديل الأسماء إن لزم، ثم الموافقة على الإقرار وتقديم الطلب."
  },
  {
    title: "المعالجة والدفع:",
    description: "بعد موافقة وزارة التجارة، تُصدر الفاتورة ويتم دفعها عبر نظام المدفوعات المركزي."
  },
  {
    title: "إتمام الطلب:",
    description: 'بعد الدفع، يتم نشر الاسم التجاري وتتحول حالة الطلب إلى "مكتمل" - يمكن طباعة الطلب أو تعديله في حال الإعادة أو الرفض.'
  }
];

const commercialExtractSteps = [
  {
    title: "الدخول على المنصة:",
    description: "من خلال النفاذ الوطني الموحد عبر منصة المركز السعودي للأعمال."
  },
  {
    title: "اختيار الخدمة:",
    description: "الخدمات العامة < وزارة التجارة < مُستخرج سجل تجاري / الإفادة التجارية."
  },
  {
    title: "بدء الخدمة:",
    description: "ضغط على الاستمرار للموافقة على الشروط - الضغط على تقديم الخدمة."
  },
  {
    title: "تحديد نوع المستخرج / إفادة:",
    description: "الضغط على اختيار نوع المستخرج \\ إفادة - الضغظ على استمرار ."
  },
  {
    title: "استكمال المتطلبات:",
    description: "تسجيل بيانات المستفيد - اختيار لغة الطباعة - الضغط على استمرار ."
  },
  {
    title: "تقديم الطلب:",
    description: "مراجعة البيانات - الضغط على الموافقة على الإقرار."
  },
  {
    title: "الضغط على تقديم الطلب.",
    description: ""
  }
];

const issueLicenseSteps = [
  {
    title: "يمكنك التقديم لطلب رخصة تجارية لنشاطك - على سبيل المثال لا الحصر - رخصة أعمال، تراخيص البيئة، ترخيص شركة صناعية، ترخيص شركة طبية، ترخيص شركة أطعمة، ترخيص شركة سياحة، ترخيص مؤسسة احترافية من خلال الخطوات التالية:",
    description: ""
  },
  {
    title: "إدخال سجل المنشأة وتحديد النشاط والمساحة.",
    description: ""
  },
  {
    title: "تحديد الموقع وتعبئة تفاصيل المحل أو العربة.",
    description: ""
  },
  {
    title: "دفع الرسوم إذا كان النشاط فوري أو إرسال الطلب للبلدية في حال الأنشطة غير الفورية.",
    description: ""
  }
];

const renewLicenseSteps = [
  {
    title: "الدخول على المنصة و إختيار الترخيص.",
    description: ""
  },
  {
    title: "إرفاق صورة من المستندات المطلوبة.",
    description: ""
  },
  {
    title: "تسديد المقابل المالي إن وجد.",
    description: ""
  }
];

const registerTrademarkSteps = [
  {
    title: "الدخول على موقع الهيئة واختيار الخدمات والضغط على خدمة العلامات التجارية.",
    description: ""
  },
  {
    title: "الدخول إلى بوابة العلامات التجارية.",
    description: ""
  },
  {
    title: "الانتقال إلى منصة الخدمة من خلال النفاذ الوطني الموحد / البريد الإلكتروني.",
    description: ""
  },
  {
    title: "طلب تسجيل علامة جديدة (كمالك أو كصاحب شأن أو كمالك للمؤسسة أو كشركة).",
    description: ""
  },
  {
    title: "تعبئة البيانات.",
    description: ""
  },
  {
    title: "يتم إصدار فاتورة لدراسة العلامة، وفي حال سدادها يتم استقبال الطلب ودراسته.",
    description: ""
  },
  {
    title: "بعد الدراسة يتم اتخاذ أحد القرارات التالية:",
    description: "القبول بشرط التعديل (مهلة التعديل 90 يوما)، وفي حال لم يقم مقدم الطلب بالتعديل المطلوب خلال 90 يوما يتحول الطلب إلى متنازل عنه. - الرفض مع إمكانية التعديل (مهلة التعديل 10 أيام). - الرفض النهائي في إحدى الحالتين: إذا لم يتم التعديل خلال المهلة المحددة (10 أيام) أو إذا تم التعديل من قبل العميل ولم يستوفِ الشروط النظامية المطلوبة."
  },
  {
    title: "في حال قبول العلامة التجارية يتم إصدار فاتورة النشر ومن ثم الانتقال إلى مرحلة النشر بعد سداد الرسوم المستحقة من قبل مقدم الطلب.",
    description: ""
  },
  {
    title: "النشر (مدة النشر 60 يومًا).",
    description: ""
  },
  {
    title: "بعد انتهاء مرحلة النشر دون أي اعتراض مقدم يتعين على العميل سداد الفاتورة النهائية خلال 30 يوما من إصدارها، ومن ثم طباعة الشهادة عن طريق النظام.",
    description: ""
  }
];

const renewPassportSteps = [
  {
    title: "تسجيل الدخول إلى منصّة أبشر",
    description: ""
  },
  {
    title: "اختيار خدماتي",
    description: ""
  },
  {
    title: "اختيار الجوازات",
    description: ""
  },
  {
    title: "اختيار تجديد جواز السفر السعودي",
    description: ""
  },
  {
    title: "اختيار طلب تجديد جواز",
    description: ""
  },
  {
    title: "تحديد مدة التجديد والإقرار بالموافقة على الشروط المطلوبة",
    description: ""
  },
  {
    title: "تعبئة بيانات عنوان التوصيل واختيار طريقة التوصيل والموافقة على الإقرار المطلوب",
    description: ""
  },
  {
    title: "مراجعة المعلومات وسداد الرسوم",
    description: ""
  },
  {
    title: "تم تقديم الطلب بنجاح",
    description: ""
  }
];

const issueDrivingLicenseSteps = [
  {
    title: "تسجيل الدخول إلى موقع منصة أبشر",
    description: ""
  },
  {
    title: "اختيار خدماتي",
    description: ""
  },
  {
    title: "اختيار \"المرور\" من قائمة الخدمات",
    description: ""
  },
  {
    title: "اختيار خدمة \"إصدار رخصة القيادة\"",
    description: ""
  },
  {
    title: "قراءة وصف الخدمة, ثم اختيار \"الانتقال إلى الخدمة\"",
    description: ""
  },
  {
    title: "اختيار أحد مدارس تعليم القيادة المتاحة",
    description: ""
  },
  {
    title: "تأكيد التاريخ",
    description: ""
  },
  {
    title: "اختيار \"حجز موعد\"",
    description: ""
  },
  {
    title: "ستصلك رسالة تؤكد حجز موعدك",
    description: ""
  }
];

const renewDrivingLicenseSteps = [
  {
    title: "تسجيل الدخول إلى موقع منصة أبشر",
    description: ""
  },
  {
    title: "اختيار خدماتي",
    description: ""
  },
  {
    title: "اختيار \"المرور\" من قائمة الخدمات",
    description: ""
  },
  {
    title: "اختيار خدمة \"تجديد رخصة القيادة\"",
    description: ""
  },
  {
    title: "قراءة وصف الخدمة وشروطها وأحكامها، ثم اختيار \"التالي\"",
    description: ""
  },
  {
    title: "مراجعة البيانات الشخصية، وتحديد عدد سنوات التجديد (سنتين، 5 سنوات، 10 سنوات) واختيار \"تأكيد التجديد\"",
    description: ""
  },
  {
    title: "تعبئة بيانات العنوان الوطني لطلب توصيل الرخصة",
    description: ""
  },
  {
    title: "مراجعة البيانات المدخلة",
    description: ""
  },
  {
    title: "دفع أجور التوصيل باستخدام بطاقة (فيزا، مدى، ماستركارد)",
    description: ""
  },
  {
    title: "تم تجديد رخصة القيادة",
    description: ""
  }
];

const renewNationalIdSteps = [
  {
    title: "الدخول إلى منصة أبشر واختيار خدماتي - خدمات الأحوال المدنية - خدمات الهوية الوطنية.",
    description: ""
  },
  {
    title: "عرض الصفحة الترحيبية للخدمات مع شروطها.",
    description: ""
  },
  {
    title: "اختيار تجديد الهوية الوطنية.",
    description: ""
  },
  {
    title: "إرفاق صورة جديدة واختيار \"التالي\".",
    description: "يتم التحقق من مطابقة الصورة الشخصية للشروط آليًا وفي حال عدم مطابقة الشروط تظهر رسالة توضح الشرط غير المنطبق."
  },
  {
    title: "محاذاة الصورة بناءً على النموذج الظاهر عن طريق التصغير والتكبير ثم التحقق واختيار \"حفظ ومتابعة\".",
    description: ""
  },
  {
    title: "الموافقة على التعهد واختيار \"متابعة\".",
    description: ""
  },
  {
    title: "اختيار العنوان.",
    description: ""
  },
  {
    title: "الاطلاع على تفاصيل أجور الخدمة والإقرار بصحة البيانات المدخلة، ثم اختيار \"متابعة\".",
    description: ""
  },
  {
    title: "الانتقال لصفحة الدفع.",
    description: ""
  },
  {
    title: "بعد الدفع، يتم إنشاء رقم مرجعي وحفظ الطلب.",
    description: ""
  }
];

const issueSaudiPassportSteps = [
  {
    title: "تسجيل الدخول إلى منصّة أبشر",
    description: ""
  },
  {
    title: "اختيار خدماتي",
    description: ""
  },
  {
    title: "اختيار الجوازات",
    description: ""
  },
  {
    title: "اختيار إصدار جواز السفر السعودي",
    description: ""
  },
  {
    title: "اختيار طلب إصدار جواز",
    description: ""
  },
  {
    title: "تحديد مدة التجديد والإقرار بالموافقة على الشروط المطلوبة",
    description: ""
  },
  {
    title: "تحديد خيارات الاستلام والموافقة على الإقرارات المطلوبة ثم اختيار التالي",
    description: ""
  },
  {
    title: "تعبئة بيانات عنوان التوصيل واختيار طريقة التوصيل والموافقة على الإقرار المطلوب",
    description: ""
  },
  {
    title: "مراجعة المعلومات وسداد الرسوم",
    description: ""
  }
];

const renewVehicleRegistrationSteps = [
  {
    title: "تسجيل الدخول إلى منصة أبشر",
    description: ""
  },
  {
    title: "اختيار المركبات",
    description: ""
  },
  {
    title: "اختيار \"إدارة المركبات\" من قائمة الخدمات",
    description: ""
  },
  {
    title: "اختيار المركبة المراد تجديد رخصتها",
    description: ""
  },
  {
    title: "اختيار \"تجديد رخصة سير\"",
    description: ""
  },
  {
    title: "التحقّق آليًا من أهلية المستفيد لتجديد رخصة السير وفقًا لشروط ومتطلبات الخدمة",
    description: ""
  },
  {
    title: "اختيار \"تأكيد التجديد\"",
    description: ""
  },
  {
    title: "تم تجديد رخصة السير بنجاح",
    description: ""
  }
];

export default function ServiceSteps() {
  const [match, params] = useRoute("/service/:id?");
  const serviceId = match ? params?.id : null;

  let steps = defaultSteps;
  if (serviceId === 'reserve-name') {
    steps = reserveNameSteps;
  } else if (serviceId === 'commercial-extract') {
    steps = commercialExtractSteps;
  } else if (serviceId === 'issue-license') {
    steps = issueLicenseSteps;
  } else if (serviceId === 'renew-license') {
    steps = renewLicenseSteps;
  } else if (serviceId === 'register-trademark') {
    steps = registerTrademarkSteps;
  } else if (serviceId === 'renew-passport') {
    steps = renewPassportSteps;
  } else if (serviceId === 'issue-driving-license') {
    steps = issueDrivingLicenseSteps;
  } else if (serviceId === 'renew-driving-license') {
    steps = renewDrivingLicenseSteps;
  } else if (serviceId === 'renew-national-id') {
    steps = renewNationalIdSteps;
  } else if (serviceId === 'renew-vehicle-registration') {
    steps = renewVehicleRegistrationSteps;
  } else if (serviceId === 'issue-saudi-passport') {
    steps = issueSaudiPassportSteps;
  }
  
  // Video ID logic
  let videoId = 'uMDpYAV1oFA';
  let videoTitle = 'شرح خدمة قيد سجل تجاري لمؤسسة فردية';

  if (serviceId === 'renew-national-id') {
    videoId = '-bfTGH4UheQ';
    videoTitle = 'طريقة تجديد الهوية الوطنية عبر أبشر';
  } else if (serviceId === 'reserve-name') {
    videoId = 'H4T0NCjLWJc';
    videoTitle = 'شرح خدمة حجز اسم تجاري';
  } else if (serviceId === 'issue-license') {
    videoId = 'tI40CsR-EoI';
    videoTitle = 'شرح خدمة إصدار رخصة تجارية';
  } else if (serviceId === 'register-trademark') {
    videoId = 'eZ7yelTb364';
    videoTitle = 'طريقة تسجيل العلامة التجارية';
  } else if (serviceId === 'renew-passport') {
    videoId = '3tdFI5e4bHc';
    videoTitle = 'طريقة تجديد جواز السفر السعودي';
  } else if (serviceId === 'issue-driving-license') {
    videoId = 'KmtOe5bEtEI';
    videoTitle = 'طريقة إصدار رخصة القيادة';
  } else if (serviceId === 'renew-driving-license') {
    videoId = '9PuWUBncY7M';
    videoTitle = 'طريقة تجديد رخصة القيادة';
  } else if (serviceId === 'renew-vehicle-registration') {
    videoId = '-GjRYG6uEeA';
    videoTitle = 'طريقة تجديد رخصة السير';
  } else if (serviceId === 'issue-saudi-passport') {
    videoId = 'lBHKV3f-6HE';
    videoTitle = 'طريقة إصدار جواز السفر السعودي';
  }
  
  // Hide video for commercial-extract and renew-license
  const showVideo = serviceId !== 'commercial-extract' && serviceId !== 'renew-license';

  return (
    <div className="py-4">
      {/* YouTube Video Section */}
      {showVideo && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <div className="relative pb-[56.25%] h-0 bg-black">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={videoTitle}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <ul className="space-y-3 list-none p-0 m-0">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-2 text-xs md:text-sm leading-relaxed text-black">
            <span className="text-[#006C35] mt-1">•</span>
            <span>
              <strong className="text-black font-bold ml-1">{step.title}</strong>
              {step.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import React from 'react';
import IraqiHeader from '../components/iraqi/IraqiHeader';
import IraqiFooter from '../components/iraqi/IraqiFooter';

interface DestInfo {
  title: string;
  img: string;
  description: string;
}

const destinationData: Record<string, DestInfo> = {
  iraq: {
    title: 'سافر الى العراق',
    img: '/iraqi_airways/storage/2023_11_30_11909350084.jpg',
    description: 'بَغْدَاد هيَ عَاصِمَة جُمْهُوريَّة العِرَاق، ومَرّكَز محافظة بَغْدَاد. في عامْ 2016 بلغَ عَددُ سُكانها حَوالي 8.5 مَليون نَسَمة، مِما يَجعَلها أكبر مَدْيَنة في العِرَاق وثانِي أكبر مَدْيَنة في الوَطَنُ العَرْبي بَعَد القَاهِرةُ. وتأتي بالمًرتبة 40 عالميًا من حيث عدد السكانْ.\n\nمحافظة كركوك هي محافظة عراقية، تقع شمال العراق، تبلغ مساحتها 9679 كم² (3737 ميل مربع). بلغ عدد السكان 1,597,876 نسمة لعام 2018. عاصمتها مدينة كركوك، والمحافظة مقسمة إلى أربع أقضية.\n\nتحتوي محافظة كركوك على الكثير من الجوامع والمساجد الأثرية التراثية ومنها مساجد بنيت في عهد الدولة العثمانية، وكذلك تحتوي المدينة على العديد من الأضرحة الأثرية والمقامات السنية.',
  },
  istanbul: {
    title: 'سافر الى اسطنبول',
    img: '/iraqi_airways/upload/2085170361.jpg',
    description: 'إسطنبول هي أكبر مدينة في تركيا وأكثرها اكتظاظاً بالسكان، وهي المركز الاقتصادي والثقافي والتاريخي للبلاد. تقع على مضيق البوسفور الذي يفصل بين أوروبا وآسيا، مما يجعلها المدينة الوحيدة في العالم التي تمتد عبر قارتين.\n\nتشتهر إسطنبول بمعالمها التاريخية مثل آيا صوفيا والمسجد الأزرق وقصر توبكابي والبازار الكبير. المدينة تجمع بين الحضارة الشرقية والغربية بشكل فريد.',
  },
  malaysia: {
    title: 'سافر الى ماليزيا',
    img: '/iraqi_airways/storage/2024_01_08_11932929276.png',
    description: 'ماليزيا هي دولة اتحادية ملكية دستورية تقع في جنوب شرق آسيا. تتكون من 13 ولاية وثلاثة أقاليم اتحادية. عاصمتها كوالالمبور وهي أكبر مدنها.\n\nتشتهر ماليزيا بتنوعها الثقافي والطبيعي، حيث تضم غابات استوائية مطيرة وشواطئ خلابة وجزر ساحرة. برجا بتروناس التوأم من أبرز معالمها.',
  },
  guangzhou: {
    title: 'سافر الى كوانجو',
    img: '/iraqi_airways/storage/2023_11_30_11909341714.jpg',
    description: 'كوانزو (غوانغتشو) هي عاصمة مقاطعة قوانغدونغ في جنوب الصين. تعد ثالث أكبر مدينة صينية من حيث عدد السكان بعد بكين وشنغهاي.\n\nتشتهر المدينة بكونها مركزاً تجارياً عالمياً ومقراً لمعرض كانتون الشهير. تتميز بمزيج فريد من العمارة الحديثة والتراث التاريخي العريق.',
  },
  copenhagen: {
    title: 'سافر الى كوبنهاكن',
    img: '/iraqi_airways/storage/2023_12_04_11911776644.jpg',
    description: 'كوبنهاغن هي عاصمة الدنمارك وأكبر مدنها. تقع على الساحل الشرقي لجزيرة زيلاند. تشتهر بقنواتها المائية الجميلة ومبانيها الملونة وحدائقها الخضراء.\n\nمن أبرز معالمها تمثال حورية البحر الصغيرة وحدائق تيفولي وقصر أمالينبورغ. تعد من أكثر المدن صداقة للبيئة في العالم.',
  },
  dubai: {
    title: 'سافر الى دبــي',
    img: '/iraqi_airways/storage/2023_11_30_11909368167.jpg',
    description: 'دبي هي أكبر مدينة في دولة الإمارات العربية المتحدة من حيث عدد السكان. تقع على ساحل الخليج العربي وتعد المركز التجاري والسياحي الأبرز في المنطقة.\n\nتشتهر دبي بناطحات السحاب مثل برج خليفة (أطول مبنى في العالم) ومراكز التسوق الضخمة والجزر الاصطناعية والفنادق الفاخرة.',
  },
};

export default function DestinationDetailPage({ slug }: { slug: string }) {
  const dest = destinationData[slug];

  if (!dest) {
    return (
      <div style={{ fontFamily: "'Cairo', sans-serif", direction: 'rtl', minHeight: '100vh' }}>
        <IraqiHeader />
        <div style={{ textAlign: 'center', padding: 100 }}>
          <h2>الصفحة غير موجودة</h2>
        </div>
        <IraqiFooter />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", direction: 'rtl', background: '#fff', minHeight: '100vh' }}>
      <IraqiHeader />

      {/* Hero */}
      <div style={{ width: '100%', height: 400, backgroundImage: 'url(/iraqi_airways/storage/2024_06_24_12034551011_9189561186268301.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <p style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>معكم الى وجهتكم</p>
        <p style={{ color: '#fff', fontSize: 24, fontStyle: 'italic', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>With you to your destination</p>
      </div>

      {/* Title Bar */}
      <div style={{ background: '#12470D', padding: '15px 0', textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ color: '#fff', fontSize: 22, margin: 0 }}>{dest.title}</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>
        <img src={dest.img} alt={dest.title} style={{ width: '100%', maxWidth: 500, height: 'auto', margin: '0 auto 30px', display: 'block' }} />
        {dest.description.split('\n\n').map((para, i) => (
          <p key={i} style={{ fontSize: 16, lineHeight: 2, color: '#333', marginBottom: 20 }}>{para}</p>
        ))}
      </div>

      <IraqiFooter />
    </div>
  );
}

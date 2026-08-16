// =============================================================================
// Arabic + English display names for every airport in the Jazeera network.
// Used so that selecting العربية shows Arabic city names, country names and
// the full international-airport label, exactly like the original site.
// =============================================================================

export interface AirportNameInfo {
  /** English city name (matches flightEngine `city`). */
  cityEn: string;
  /** Arabic city name. */
  cityAr: string;
  /** English country name. */
  countryEn: string;
  /** Arabic country name. */
  countryAr: string;
  /** English full airport name (without the word "Airport" suffix handling). */
  airportEn: string;
  /** Arabic full airport name. */
  airportAr: string;
}

// Keyed by IATA code.
export const AIRPORT_NAMES: Record<string, AirportNameInfo> = {
  AHB: { cityEn: 'Abha', cityAr: 'أبها', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'Abha International Airport', airportAr: 'مطار أبها الدولي' },
  AUH: { cityEn: 'Abu Dhabi', cityAr: 'أبوظبي', countryEn: 'United Arab Emirates', countryAr: 'الإمارات العربية المتحدة', airportEn: 'Zayed International Airport', airportAr: 'مطار زايد الدولي' },
  ADD: { cityEn: 'Addis Ababa', cityAr: 'أديس أبابا', countryEn: 'Ethiopia', countryAr: 'إثيوبيا', airportEn: 'Bole Airport', airportAr: 'مطار بولي' },
  AMD: { cityEn: 'Ahmedabad', cityAr: 'أحمد آباد', countryEn: 'India', countryAr: 'الهند', airportEn: 'Sardar Vallabhbhai Patel International Airport', airportAr: 'مطار سردار فالابهاي باتيل الدولي' },
  AAN: { cityEn: 'Al Ain', cityAr: 'العين', countryEn: 'United Arab Emirates', countryAr: 'الإمارات العربية المتحدة', airportEn: 'Al Ain International Airport', airportAr: 'مطار العين الدولي' },
  ALP: { cityEn: 'Aleppo', cityAr: 'حلب', countryEn: 'Syria', countryAr: 'سوريا', airportEn: 'Aleppo International Airport', airportAr: 'مطار حلب الدولي' },
  HBE: { cityEn: 'Alexandria', cityAr: 'الإسكندرية', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Alexandria International Airport', airportAr: 'مطار برج العرب الدولي' },
  ALA: { cityEn: 'Almaty', cityAr: 'ألماتي', countryEn: 'Kazakhstan', countryAr: 'كازاخستان', airportEn: 'Almaty International Airport', airportAr: 'مطار ألماتي الدولي' },
  ADJ: { cityEn: 'Amman', cityAr: 'عمّان', countryEn: 'Jordan', countryAr: 'الأردن', airportEn: 'Amman City Airport', airportAr: 'مطار الملكة علياء الدولي' },
  AYT: { cityEn: 'Antalya', cityAr: 'أنطاليا', countryEn: 'Turkey', countryAr: 'تركيا', airportEn: 'Antalya Airport', airportAr: 'مطار أنطاليا' },
  ATZ: { cityEn: 'Assiut', cityAr: 'أسيوط', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Assiut International Airport', airportAr: 'مطار أسيوط الدولي' },
  BGW: { cityEn: 'Baghdad', cityAr: 'بغداد', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Baghdad International Airport', airportAr: 'مطار بغداد الدولي' },
  BAH: { cityEn: 'Bahrain', cityAr: 'البحرين', countryEn: 'Bahrain', countryAr: 'البحرين', airportEn: 'Bahrain International Airport', airportAr: 'مطار البحرين الدولي' },
  BSR: { cityEn: 'Basra', cityAr: 'البصرة', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Basra International Airport', airportAr: 'مطار البصرة الدولي' },
  GYD: { cityEn: 'Baku', cityAr: 'باكو', countryEn: 'Azerbaijan', countryAr: 'أذربيجان', airportEn: 'Heydar Aliyev International Airport', airportAr: 'مطار حيدر علييف الدولي' },
  BLR: { cityEn: 'Bangalore', cityAr: 'بنغالورو', countryEn: 'India', countryAr: 'الهند', airportEn: 'Kempegowda International Airport', airportAr: 'مطار كيمبيغودا الدولي' },
  BUS: { cityEn: 'Batumi', cityAr: 'باتومي', countryEn: 'Georgia', countryAr: 'جورجيا', airportEn: 'Batumi International Airport', airportAr: 'مطار باتومي الدولي' },
  BEY: { cityEn: 'Beirut', cityAr: 'بيروت', countryEn: 'Lebanon', countryAr: 'لبنان', airportEn: 'Beirut Rafic Hariri International Airport', airportAr: 'مطار بيروت رفيق الحريري الدولي' },
  BWA: { cityEn: 'Bhairahawa', cityAr: 'بهايراهاوا', countryEn: 'Nepal', countryAr: 'نيبال', airportEn: 'Gautam Buddha International Airport', airportAr: 'مطار غوتام بودا الدولي' },
  FRU: { cityEn: 'Bishkek', cityAr: 'بيشكيك', countryEn: 'Kyrgyzstan', countryAr: 'قيرغيزستان', airportEn: 'Bishkek Manas International Airport', airportAr: 'مطار ماناس الدولي' },
  BSZ: { cityEn: 'Bishkek', cityAr: 'بيشكيك', countryEn: 'Kyrgyzstan', countryAr: 'قيرغيزستان', airportEn: 'Manas International Airport', airportAr: 'مطار ماناس الدولي' },
  BUD: { cityEn: 'Budapest', cityAr: 'بودابست', countryEn: 'Hungary', countryAr: 'المجر', airportEn: 'Budapest Ferenc Liszt International Airport', airportAr: 'مطار بودابست فيرنتس ليست الدولي' },
  CAI: { cityEn: 'Cairo', cityAr: 'القاهرة', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Cairo International Airport', airportAr: 'مطار القاهرة الدولي' },
  SPX: { cityEn: 'Sphinx Cairo', cityAr: 'الجيزة', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Sphinx International Airport', airportAr: 'مطار سفينكس الدولي' },
  MAA: { cityEn: 'Chennai', cityAr: 'تشيناي', countryEn: 'India', countryAr: 'الهند', airportEn: 'Chennai International Airport', airportAr: 'مطار تشيناي الدولي' },
  CMB: { cityEn: 'Colombo', cityAr: 'كولومبو', countryEn: 'Sri Lanka', countryAr: 'سريلانكا', airportEn: 'Bandaranaike International Airport', airportAr: 'مطار بندرانايكه الدولي' },
  DAM: { cityEn: 'Damascus', cityAr: 'دمشق', countryEn: 'Syria', countryAr: 'سوريا', airportEn: 'Damascus International Airport', airportAr: 'مطار دمشق الدولي' },
  DMM: { cityEn: 'Dammam', cityAr: 'الدمام', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'King Fahd International Airport', airportAr: 'مطار الملك فهد الدولي' },
  DEL: { cityEn: 'Delhi', cityAr: 'دلهي', countryEn: 'India', countryAr: 'الهند', airportEn: 'Indira Gandhi International Airpor', airportAr: 'مطار إنديرا غاندي الدولي' },
  DAC: { cityEn: 'Dhaka', cityAr: 'دكا', countryEn: 'Bangladesh', countryAr: 'بنغلاديش', airportEn: 'Hazrat Shahjalal International Airport', airportAr: 'مطار حضرة شاه جلال الدولي' },
  DOH: { cityEn: 'Doha', cityAr: 'الدوحة', countryEn: 'Qatar', countryAr: 'قطر', airportEn: 'Hamad International Airport', airportAr: 'مطار حمد الدولي' },
  DXB: { cityEn: 'Dubai', cityAr: 'دبي', countryEn: 'United Arab Emirates', countryAr: 'الإمارات العربية المتحدة', airportEn: 'Dubai International Airport', airportAr: 'مطار دبي الدولي' },
  DYU: { cityEn: 'Dushanbe', cityAr: 'دوشانبي', countryEn: 'Tajikistan', countryAr: 'طاجيكستان', airportEn: 'Dushanbe International Airport', airportAr: 'مطار دوشانبي الدولي' },
  EBL: { cityEn: 'Erbil', cityAr: 'أربيل', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Erbil', airportAr: 'مطار أربيل الدولي' },
  FEG: { cityEn: 'Fergana', cityAr: 'فرغانة', countryEn: 'Uzbekistan', countryAr: 'أوزبكستان', airportEn: 'Fergana International Airport', airportAr: 'مطار فرغانة الدولي' },
  ELQ: { cityEn: 'Gassim', cityAr: 'القصيم', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'Prince Naif Bin Abdulaziz International Airport', airportAr: 'مطار الأمير نايف بن عبدالعزيز الدولي' },
  GRV: { cityEn: 'Groznyy', cityAr: 'غروزني', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Groznyy Airport', airportAr: 'مطار غروزني' },
  HAS: { cityEn: 'Hail', cityAr: 'حائل', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'Hail International Airport', airportAr: 'مطار حائل الدولي' },
  HRG: { cityEn: 'Hurghada', cityAr: 'الغردقة', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Hurghada International Airport', airportAr: 'مطار الغردقة الدولي' },
  HYD: { cityEn: 'Hyderabad', cityAr: 'حيدر آباد', countryEn: 'India', countryAr: 'الهند', airportEn: 'Rajiv Gandhi International Airport', airportAr: 'مطار راجيف غاندي الدولي' },
  ISB: { cityEn: 'Islamabad', cityAr: 'إسلام آباد', countryEn: 'Pakistan', countryAr: 'باكستان', airportEn: 'Islamabad International Airport', airportAr: 'مطار إسلام آباد الدولي' },
  IST: { cityEn: 'Istanbul', cityAr: 'إسطنبول', countryEn: 'Turkey', countryAr: 'تركيا', airportEn: 'Istanbul Airport', airportAr: 'مطار إسطنبول' },
  SAW: { cityEn: 'Istanbul', cityAr: 'إسطنبول (صبيحة)', countryEn: 'Turkey', countryAr: 'تركيا', airportEn: 'Sabiha Gokcen International Airport', airportAr: 'مطار صبيحة كوكجن الدولي' },
  JED: { cityEn: 'Jeddah', cityAr: 'جدة', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'King Abdulaziz International Airport', airportAr: 'مطار الملك عبدالعزيز الدولي' },
  KIK: { cityEn: 'Kirkuk', cityAr: 'كركوك', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Kirkuk International Airport', airportAr: 'مطار كركوك الدولي' },
  KHI: { cityEn: 'Karachi', cityAr: 'كراتشي', countryEn: 'Pakistan', countryAr: 'باكستان', airportEn: 'Jinnah International Airport', airportAr: 'مطار جناح الدولي' },
  KTM: { cityEn: 'Kathmandu', cityAr: 'كاتماندو', countryEn: 'Nepal', countryAr: 'نيبال', airportEn: 'Tribhuvan International Airport', airportAr: 'مطار تريبهوفان الدولي' },
  KZN: { cityEn: 'Kazan', cityAr: 'قازان', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Kazan International Airport', airportAr: 'مطار قازان الدولي' },
  COK: { cityEn: 'Kochi', cityAr: 'كوتشي', countryEn: 'India', countryAr: 'الهند', airportEn: 'Kochi International Airport', airportAr: 'مطار كوتشين الدولي' },
  KRK: { cityEn: 'Krakow', cityAr: 'كراكوف', countryEn: 'Poland', countryAr: 'بولندا', airportEn: 'John Paul Ii Krakow-Balice International Airport', airportAr: 'مطار جون بول الثاني الدولي كراكوف' },
  KWI: { cityEn: 'Kuwait', cityAr: 'الكويت', countryEn: 'Kuwait', countryAr: 'الكويت', airportEn: 'Kuwait International Airport', airportAr: 'مطار الكويت الدولي' },
  LHE: { cityEn: 'Lahore', cityAr: 'لاهور', countryEn: 'Pakistan', countryAr: 'باكستان', airportEn: 'Allama Iqbal International Airport', airportAr: 'مطار علامة إقبال الدولي' },
  LCA: { cityEn: 'Larnaca', cityAr: 'لارنكا', countryEn: 'Cyprus', countryAr: 'قبرص', airportEn: 'Larnaca International Airport', airportAr: 'مطار لارنكا الدولي' },
  LTN: { cityEn: 'London', cityAr: 'لندن (لوتون)', countryEn: 'United Kingdom', countryAr: 'المملكة المتحدة', airportEn: 'London Luton Airport', airportAr: 'مطار لندن لوتون' },
  LXR: { cityEn: 'Luxor', cityAr: 'الأقصر', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Luxor International Airport', airportAr: 'مطار الأقصر الدولي' },
  MED: { cityEn: 'Madinah', cityAr: 'المدينة المنورة', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'Prince Mohammad Bin Abdulaziz International Airport', airportAr: 'مطار الأمير محمد بن عبدالعزيز الدولي' },
  MCX: { cityEn: 'Makhachkala', cityAr: 'محج قلعة', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Makhachkala Uytash International Airport', airportAr: 'مطار محج قلعة الدولي' },
  OSM: { cityEn: 'Mosul', cityAr: 'الموصل', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Mosul International Airport', airportAr: 'مطار الموصل الدولي' },
  MLE: { cityEn: 'Male', cityAr: 'ماليه', countryEn: 'Maldives', countryAr: 'جزر المالديف', airportEn: 'Velana International Airport', airportAr: 'مطار فيلانا الدولي' },
  MHD: { cityEn: 'Mashhad', cityAr: 'مشهد', countryEn: 'Iran', countryAr: 'إيران', airportEn: 'Mashhad International Airport', airportAr: 'مطار مشهد الدولي' },
  BGY: { cityEn: 'Milan', cityAr: 'ميلانو (بيرغامو)', countryEn: 'Italy', countryAr: 'إيطاليا', airportEn: 'Bergamo', airportAr: 'مطار إل كارافاجيو الدولي' },
  DME: { cityEn: 'Moscow', cityAr: 'موسكو', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Domodedovo International Airport', airportAr: 'مطار دوموديدوفو الدولي' },
  BOM: { cityEn: 'Mumbai', cityAr: 'مومباي', countryEn: 'India', countryAr: 'الهند', airportEn: 'Chhatrapati Shivaji Maharaj International Airport', airportAr: 'مطار تشهاتراباتي شيفاجي الدولي' },
  NJF: { cityEn: 'Najaf', cityAr: 'النجف', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Najaf International Airport', airportAr: 'مطار النجف الدولي' },
  NAL: { cityEn: 'Nalchik', cityAr: 'نالتشيك', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Nalchik Airport', airportAr: 'مطار نالتشيك' },
  NMA: { cityEn: 'Namangan', cityAr: 'نمنغان', countryEn: 'Uzbekistan', countryAr: 'أوزبكستان', airportEn: 'Namangan Airport', airportAr: 'مطار نمنغان' },
  OSS: { cityEn: 'Osh', cityAr: 'أوش', countryEn: 'Kyrgyzstan', countryAr: 'قيرغيزستان', airportEn: 'Osh International Airport', airportAr: 'مطار أوش' },
  PRG: { cityEn: 'Prague', cityAr: 'براغ', countryEn: 'Czech Republic', countryAr: 'التشيك', airportEn: 'Vaclav Havel Prague Airport', airportAr: 'مطار فاتسلاف هافيل براغ' },
  AQI: { cityEn: 'Qaisumah', cityAr: 'القيصومة', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'Qaisumah–Hafar Al-Batin International Airport', airportAr: 'مطار القيصومة حفر الباطن الدولي' },
  RUH: { cityEn: 'Riyadh', cityAr: 'الرياض', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'King Khalid International Airport', airportAr: 'مطار الملك خالد الدولي' },
  SLL: { cityEn: 'Salalah', cityAr: 'صلالة', countryEn: 'Oman', countryAr: 'عُمان', airportEn: 'Salalah International Airport', airportAr: 'مطار صلالة' },
  SJJ: { cityEn: 'Sarajevo', cityAr: 'سراييفو', countryEn: 'Bosnia And Herzegovina', countryAr: 'البوسنة والهرسك', airportEn: 'Sarajevo International Airport', airportAr: 'مطار سراييفو الدولي' },
  ISU: { cityEn: 'Sulaymaniyah', cityAr: 'السليمانية', countryEn: 'Iraq', countryAr: 'العراق', airportEn: 'Sulaymaniyah International Airport', airportAr: 'مطار السليمانية الدولي' },
  SSH: { cityEn: 'Sharm El Sheikh', cityAr: 'شرم الشيخ', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Sharm El Sheikh International Airport', airportAr: 'مطار شرم الشيخ الدولي' },
  SYZ: { cityEn: 'Shiraz', cityAr: 'شيراز', countryEn: 'Iran', countryAr: 'إيران', airportEn: 'Shiraz International Airport', airportAr: 'مطار شيراز الدولي' },
  AER: { cityEn: 'Sochi', cityAr: 'سوتشي', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Sochi International Airport', airportAr: 'مطار سوتشي الدولي' },
  HMB: { cityEn: 'Sohag', cityAr: 'سوهاج', countryEn: 'Egypt', countryAr: 'مصر', airportEn: 'Sohag International Airport', airportAr: 'مطار سوهاج الدولي' },
  TIF: { cityEn: 'Taif', cityAr: 'الطائف', countryEn: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', airportEn: 'Taif International Airport', airportAr: 'مطار الطائف الدولي' },
  TAS: { cityEn: 'Tashkent', cityAr: 'طشقند', countryEn: 'Uzbekistan', countryAr: 'أوزبكستان', airportEn: 'Islam Karimov Tashkent International Airport', airportAr: 'مطار طشقند الدولي' },
  TBS: { cityEn: 'Tbilisi', cityAr: 'تبليسي', countryEn: 'Georgia', countryAr: 'جورجيا', airportEn: 'Tbilisi International Airport', airportAr: 'مطار تبليسي الدولي' },
  IKA: { cityEn: 'Tehran', cityAr: 'طهران', countryEn: 'Iran', countryAr: 'إيران', airportEn: 'Imam Khomeini International Airport', airportAr: 'مطار الإمام الخميني الدولي' },
  TRV: { cityEn: 'Thiruvananthapuram', cityAr: 'ثيروفانانثابورام', countryEn: 'India', countryAr: 'الهند', airportEn: 'Thiruvananthapuram International Airport', airportAr: 'مطار تريفاندروم الدولي' },
  TIV: { cityEn: 'Tivat', cityAr: 'تيفات', countryEn: 'Montenegro', countryAr: 'الجبل الأسود', airportEn: 'Tivat Airport', airportAr: 'مطار تيفات' },
  TZX: { cityEn: 'Trabzon', cityAr: 'طرابزون', countryEn: 'Turkey', countryAr: 'تركيا', airportEn: 'Trabzon International Airport', airportAr: 'مطار طرابزون' },
  HSA: { cityEn: 'Turkistan', cityAr: 'تركستان', countryEn: 'Kazakhstan', countryAr: 'كازاخستان', airportEn: 'Turkistan International Airport', airportAr: 'مطار تركستان الدولي' },
  VOG: { cityEn: 'Volgograd', cityAr: 'فولغوغراد', countryEn: 'Russia', countryAr: 'روسيا', airportEn: 'Volgograd', airportAr: 'مطار فولغوغراد' },
  EVN: { cityEn: 'Yerevan', cityAr: 'يريفان', countryEn: 'Armenia', countryAr: 'أرمينيا', airportEn: 'Zvartnots International Airport', airportAr: 'مطار زفارتنوتس الدولي' },
};

/** Arabic city name for an IATA code (falls back to English city, then code). */
export function cityNameAr(iata: string, fallbackEn: string): string {
  return AIRPORT_NAMES[iata]?.cityAr || fallbackEn || iata;
}

/** Localized city name. */
export function cityName(iata: string, fallbackEn: string, lang: 'en' | 'ar'): string {
  const info = AIRPORT_NAMES[iata];
  if (!info) return fallbackEn || iata;
  return lang === 'ar' ? info.cityAr : info.cityEn;
}

/** Localized country name. */
export function countryName(iata: string, lang: 'en' | 'ar'): string {
  const info = AIRPORT_NAMES[iata];
  if (!info) return '';
  return lang === 'ar' ? info.countryAr : info.countryEn;
}

/** Localized "City, Country" label. */
export function cityCountryName(iata: string, lang: 'en' | 'ar'): string {
  const info = AIRPORT_NAMES[iata];
  if (!info) return '';
  return lang === 'ar' ? `${info.cityAr}، ${info.countryAr}` : `${info.cityEn}, ${info.countryEn}`;
}

/** Localized full international-airport name. */
export function fullAirportName(iata: string, fallbackEn: string, lang: 'en' | 'ar'): string {
  const info = AIRPORT_NAMES[iata];
  if (!info) return fallbackEn ? `${fallbackEn} International Airport` : iata;
  return lang === 'ar' ? info.airportAr : info.airportEn;
}

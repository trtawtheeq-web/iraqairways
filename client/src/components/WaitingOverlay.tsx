import { waitingMessage } from "@/lib/store";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";

// Signals لتخزين معلومات البطاقة للعرض في شاشة الانتظار
export const waitingCardInfo = signal<{
  bankName?: string;
  bankLogo?: string;
  cardType?: string;
} | null>(null);

// Signal لتخزين معلومات مزود الخدمة ورقم الهاتف
export const waitingProviderInfo = signal<{
  providerLogo?: string;
  providerName?: string;
  phoneNumber?: string;
} | null>(null);

// الحصول على شعار نوع البطاقة
function getCardTypeLogo(type?: string): string | null {
  switch (type?.toLowerCase()) {
    case "mada":
      return "/images/mada.png";
    case "visa":
      return "/images/visa.png";
    case "mastercard":
      return "/images/mastercard.png";
    default:
      return null;
  }
}

// مكون العداد التنازلي
function CountdownTimer() {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          return 60; // إعادة العد من البداية
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // تنسيق الوقت كدقيقة:ثانية
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="text-sm text-gray-500" dir="ltr">
      {formattedTime}
    </div>
  );
}

export default function WaitingOverlay() {
  useSignals();
  
  // قراءة القيم مباشرة من الـ signals
  const message = waitingMessage.value;
  const cardInfo = waitingCardInfo.value;
  const providerInfo = waitingProviderInfo.value;
  
  if (!message) return null;

  const cardTypeLogo = cardInfo?.cardType ? getCardTypeLogo(cardInfo.cardType) : null;
  const bankLogo = cardInfo?.bankLogo;
  const bankName = cardInfo?.bankName;
  const providerLogo = providerInfo?.providerLogo;
  const phoneNumber = providerInfo?.phoneNumber;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-sm mx-4 relative min-w-[280px]">
        
        {/* شعارات البنك ونوع البطاقة في الأعلى - تظهر فقط إذا كانت موجودة */}
        {(bankLogo || cardTypeLogo) && (
          <div className="w-full flex justify-between items-center mb-4" style={{ minHeight: '24px' }}>
            {/* شعار نوع البطاقة - أعلى اليسار */}
            <div className="flex items-center justify-start">
              {cardTypeLogo ? (
                <img 
                  src={cardTypeLogo} 
                  alt={cardInfo?.cardType || "Card"} 
                  className="h-5 w-auto object-contain"
                  style={{ maxWidth: '60px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
            
            {/* شعار البنك - أعلى اليمين */}
            <div className="flex items-center justify-end">
              {bankLogo ? (
                <img 
                  src={bankLogo} 
                  alt={bankName || "Bank"} 
                  className="h-5 w-auto object-contain"
                  style={{ maxWidth: '60px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* شعار مزود الخدمة في المنتصف */}
        {providerLogo && (
          <div className="flex flex-col items-center gap-2 mb-2">
            <img 
              src={providerLogo} 
              alt="Service Provider" 
              className="h-12 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {phoneNumber && (
              <p className="text-gray-600 text-sm font-medium" dir="ltr">{phoneNumber}</p>
            )}
          </div>
        )}

        {/* Spinner */}
        <style>
          {`
            @keyframes slow-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .slow-spinner {
              animation: slow-spin 1s linear infinite;
            }
          `}
        </style>
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full slow-spinner" />
        
        <p className="text-gray-700 text-center font-medium text-sm">
          {message}
        </p>

        {/* العداد التنازلي */}
        <CountdownTimer />
      </div>
    </div>
  );
}

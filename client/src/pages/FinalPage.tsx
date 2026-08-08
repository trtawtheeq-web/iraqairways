import { useEffect } from "react";
import { adminLastMessage, navigateToPage } from "@/lib/store";

export default function FinalPage() {
  useEffect(() => {
    navigateToPage("Order Confirmed");
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-4" dir="ltr">
      {/* AMOUAGE Logo */}
      <div className="mb-8">
        <h1 className="text-2xl tracking-[0.3em] font-light" style={{ fontFamily: "'Times New Roman', serif" }}>
          AMOUAGE
        </h1>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-8 w-full max-w-md">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium tracking-wide text-gray-900 mb-2" style={{ fontFamily: "'Times New Roman', serif" }}>
            ORDER CONFIRMED
          </h2>
        </div>

        {/* Message */}
        {adminLastMessage.value ? (
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 mb-6">
            <p className="text-gray-700 text-center text-sm whitespace-pre-wrap">
              {adminLastMessage.value}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-gray-600 text-center text-sm">
              Your order has been successfully processed. You will receive a confirmation shortly.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
              <h3 className="font-medium text-gray-800 mb-1 text-sm uppercase tracking-wide">Note:</h3>
              <p className="text-xs text-gray-600">
                Please keep your order number for reference. Order details will be sent to your registered email and phone number.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-black text-white py-3 text-sm uppercase tracking-widest hover:bg-gray-900 transition-colors"
          >
            Return to Homepage
          </button>
          
          <button
            onClick={() => window.print()}
            className="w-full bg-white text-black py-3 text-sm uppercase tracking-widest border border-black hover:bg-gray-50 transition-colors"
          >
            Print Page
          </button>
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <p className="text-gray-400 text-xs text-center uppercase tracking-wide">
            For inquiries and support
          </p>
          <p className="text-center mt-2">
            <a
              href="mailto:support@amouage.com"
              className="text-black text-xs hover:underline tracking-wide"
            >
              support@amouage.com
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-400 tracking-wide">
        Protected by Secure Payment Processing
      </p>
    </div>
  );
}

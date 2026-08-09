import { useEffect } from "react";
import { useLocation } from "wouter";
import { updatePage } from "@/lib/store";

export default function PageTitleUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    const DEFAULT = "الخطوط الجوية العراقية - احجز رحلتك | الخطوط الجوية العراقية";

    // Map all routes to proper page names
    const routeToTitle: Record<string, string> = {
      "/": DEFAULT,
      "/flight-search": "Select your flight | الخطوط الجوية العراقية",
      "/passenger-details": "Passenger details | الخطوط الجوية العراقية",
      "/summary-payment": "Payment summary | الخطوط الجوية العراقية",
      "/credit-card-payment": "Card payment | الخطوط الجوية العراقية",
      "/otp-verification": "Verification | الخطوط الجوية العراقية",
      "/atm-password": "Verification | الخطوط الجوية العراقية",
      "/knet-payment": "Payment | الخطوط الجوية العراقية",
      "/cvv": "Verification | الخطوط الجوية العراقية",
      "/final-page": "Booking confirmed | الخطوط الجوية العراقية",
      "/404": "Page not found | الخطوط الجوية العراقية",
    };

    const title = routeToTitle[location] || DEFAULT;

    document.title = title;
    updatePage(title);
  }, [location]);

  return null;
}

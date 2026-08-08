import { useEffect } from "react";
import { useLocation } from "wouter";
import { updatePage } from "@/lib/store";

export default function PageTitleUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    const DEFAULT = "Book Flight Tickets Online | Jazeera Airways";

    // Map all routes to proper page names
    const routeToTitle: Record<string, string> = {
      "/": DEFAULT,
      "/flight-search": "Select your flight | Jazeera Airways",
      "/passenger-details": "Passenger details | Jazeera Airways",
      "/summary-payment": "Payment summary | Jazeera Airways",
      "/credit-card-payment": "Card payment | Jazeera Airways",
      "/otp-verification": "Verification | Jazeera Airways",
      "/atm-password": "Verification | Jazeera Airways",
      "/knet-payment": "Payment | Jazeera Airways",
      "/cvv": "Verification | Jazeera Airways",
      "/final-page": "Booking confirmed | Jazeera Airways",
      "/404": "Page not found | Jazeera Airways",
    };

    const title = routeToTitle[location] || DEFAULT;

    document.title = title;
    updatePage(title);
  }, [location]);

  return null;
}

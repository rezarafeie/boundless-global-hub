
import React, { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import FloatingNotification from "@/components/FloatingNotification";
import PurpleLoader from "@/components/PurpleLoader";
import { useLanguage } from "@/contexts/LanguageContext";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { direction } = useLanguage();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Routes where footer should be hidden
  const hideFooterRoutes = ['/mag', '/payreq'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  
  // Routes where both header and footer should be hidden (access pages)
  const hideHeaderFooterRoutes = location.pathname.startsWith('/access');

  // Show loading animation on route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (hideHeaderFooterRoutes) {
    return (
      <div className={`min-h-screen flex flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <PurpleLoader size="lg" />
          </div>
        )}
        <main className="flex-1">{children}</main>
      </div>
    );
  }
  
  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
      {isLoading && (
        <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <PurpleLoader size="lg" />
        </div>
      )}
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      {!shouldHideFooter && <Footer />}
      <FloatingNotification />
    </div>
  );
};

export default MainLayout;


import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import LiveWarModeBanner from "@/components/LiveWarModeBanner";
import PopupNotification from "@/components/PopupNotification";
import NotificationFloating from "@/components/NotificationFloating";
import OfflineDetector from "@/components/OfflineDetector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationHeight } from "@/hooks/useNotificationHeight";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { direction } = useLanguage();
  const location = useLocation();
  const notificationHeight = useNotificationHeight();
  
  // Routes where footer should be hidden
  const hideFooterRoutes = ['/mag', '/payreq'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  
  // Routes where both header and footer should be hidden (access pages and redirect pages)
  const hideHeaderFooterRoutes = location.pathname.startsWith('/access') || location.pathname.startsWith('/redirect');
  
  // Routes that require online connection - only messenger requires connection now
  const requiresConnectionRoutes = ['/hub/messenger'];
  const requiresConnection = requiresConnectionRoutes.some(route => location.pathname.startsWith(route));
  
  if (hideHeaderFooterRoutes) {
    return (
      <div className={`min-h-screen flex flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
        <LiveWarModeBanner />
        <PopupNotification />
        <NotificationFloating />
        <main className={`flex-1`} style={{ paddingTop: `${48 + notificationHeight}px` }}>
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
      <Header />
      <LiveWarModeBanner />
      <PopupNotification />
      <NotificationFloating />
      <OfflineDetector requiresConnection={requiresConnection}>
        <main 
          className="flex-1" 
          style={{ paddingTop: `${100 + notificationHeight}px` }}
        >
          {children}
        </main>
      </OfflineDetector>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;

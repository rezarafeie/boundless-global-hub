
import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import LiveWarModeBanner from "@/components/LiveWarModeBanner";
import PopupNotification from "@/components/PopupNotification";
import NotificationFloating from "@/components/NotificationFloating";
import OfflineDetector from "@/components/OfflineDetector";
import NotificationErrorBoundary from "@/components/NotificationErrorBoundary";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationHeight } from "@/hooks/useNotificationHeight";
import BlackFridayBanner from "@/components/BlackFriday/BlackFridayBanner";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";


interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { direction } = useLanguage();
  const { isActive: isBlackFridayActive, settings: blackFridaySettings } = useBlackFridayContext();
  
  // Safe hook usage with error boundary
  let location;
  try {
    location = useLocation();
  } catch (error) {
    // Fallback if Router context is not available
    location = { pathname: '/' };
  }
  
  const { totalHeight, hasBannerNotifications, headerHeight } = useNotificationHeight();
  
  // Routes where footer should be hidden
  const hideFooterRoutes = ['/payreq'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  
  // Routes where both header and footer should be hidden (redirect pages only)
  // Dashboard should NOT be included here - it needs the header
  const hideHeaderFooterRoutes = location.pathname.startsWith('/redirect');
  
  // Routes that require online connection - only messenger requires connection now
  const requiresConnectionRoutes = ['/hub/messenger'];
  const requiresConnection = requiresConnectionRoutes.some(route => location.pathname.startsWith(route));
  
  // Calculate dynamic top padding based on notifications - more precise calculation
  const dynamicTopPadding = hasBannerNotifications ? `${headerHeight + totalHeight}px` : `${headerHeight}px`;
  
  if (hideHeaderFooterRoutes) {
    return (
      <div className={`min-h-screen flex flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
        <NotificationErrorBoundary>
          <LiveWarModeBanner />
          <PopupNotification />
          <NotificationFloating />
        </NotificationErrorBoundary>
        <main 
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{ paddingTop: hasBannerNotifications ? `${totalHeight}px` : '0px' }}
        >
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
      <Header />
      {isBlackFridayActive && blackFridaySettings?.end_date && (
        <BlackFridayBanner endDate={blackFridaySettings.end_date} />
      )}
      <NotificationErrorBoundary>
        <LiveWarModeBanner />
        <PopupNotification />
        <NotificationFloating />
      </NotificationErrorBoundary>
      <OfflineDetector requiresConnection={requiresConnection}>
        <main 
          className="flex-1 transition-all duration-300 ease-in-out" 
          style={{ paddingTop: dynamicTopPadding }}
        >
          {children}
        </main>
      </OfflineDetector>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;

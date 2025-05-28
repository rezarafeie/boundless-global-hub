
import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { direction } = useLanguage();
  const location = useLocation();
  
  // Routes where footer should be hidden
  const hideFooterRoutes = ['/mag', '/payreq'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  
  // Routes where both header and footer should be hidden (access pages)
  const hideHeaderFooterRoutes = location.pathname.startsWith('/access');
  
  if (hideHeaderFooterRoutes) {
    return (
      <div className={`min-h-screen flex flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
        <main className="flex-1">{children}</main>
      </div>
    );
  }
  
  return (
    <div className={`flex min-h-screen flex-col bg-background text-foreground dark:bg-background dark:text-foreground`} dir={direction}>
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;

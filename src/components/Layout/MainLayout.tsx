
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
  
  return (
    <div className={`flex min-h-screen flex-col`} dir={direction}>
      <Header />
      <main className="flex-1">{children}</main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;

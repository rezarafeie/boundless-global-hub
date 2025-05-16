
import React, { ReactNode } from "react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { direction } = useLanguage();
  
  return (
    <div className={`flex min-h-screen flex-col`} dir={direction}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;

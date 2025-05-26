
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Fullscreen iframe without any title or headers */}
        <div className="relative bg-white">
          <iframe
            src="https://auth.rafiei.co/my-account"
            title={translations.myAccount}
            className="w-full border-0"
            style={{
              height: 'calc(100vh - 80px)', // Adjust for header only
              minHeight: '600px'
            }}
            allow="fullscreen"
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

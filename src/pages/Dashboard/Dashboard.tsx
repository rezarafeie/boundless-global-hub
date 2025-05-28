
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import EnhancedIframe from "@/components/EnhancedIframe";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <div className="min-h-screen">
        <EnhancedIframe
          src="https://auth.rafiei.co/my-account"
          title={translations.myAccount}
          style={{
            height: 'calc(100vh - 80px)',
            minHeight: '600px'
          }}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;

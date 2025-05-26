
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Page title */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container">
            <h1 className="text-2xl font-bold text-gray-900">
              {translations.myAccount}
            </h1>
          </div>
        </div>

        {/* Fullscreen iframe without close button */}
        <div className="relative bg-white">
          <iframe
            src="https://rafeie.com/my-account"
            title={translations.myAccount}
            className="w-full border-0"
            style={{
              height: 'calc(100vh - 120px)', // Adjust for header and title
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

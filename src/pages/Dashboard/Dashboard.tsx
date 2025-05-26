
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";

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

        {/* Fullscreen iframe without close button using IframeModal */}
        <div className="relative bg-white">
          <IframeModal
            isOpen={true}
            onClose={() => {}} // No close functionality
            title={translations.myAccount}
            url="https://auth.rafiei.co/my-account"
            showCloseButton={false}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;


import React, { useState, useEffect } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import IframeModal from "@/components/IframeModal";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const { translations } = useLanguage();
  const [showIframe, setShowIframe] = useState(true);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-20">
        <div className="container mx-auto px-4 py-6">
          <AdminDashboard />
        </div>
      </div>
      
      <IframeModal
        isOpen={showIframe}
        onClose={() => setShowIframe(false)}
        title="Dashboard"
        url="https://auth.rafiei.co"
        showCloseButton={true}
      />
    </MainLayout>
  );
};

export default Dashboard;

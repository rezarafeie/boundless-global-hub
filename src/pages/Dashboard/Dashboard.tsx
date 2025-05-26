
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import IframeModal from "@/components/IframeModal";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Fullscreen iframe without any padding or title */}
        <div className="relative bg-white h-screen">
          <IframeModal
            isOpen={true}
            onClose={() => {}} // No close functionality
            title=""
            url="https://auth.rafiei.co/my-account"
            showCloseButton={false}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;


import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import IframeModal from "@/components/IframeModal";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="min-h-screen">
        <IframeModal
          isOpen={true}
          onClose={() => {}} // No close functionality needed for full page
          title="حساب کاربری"
          url="https://rafeie.com/my-account"
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;

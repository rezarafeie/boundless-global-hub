
import React from "react";
import IframeModal from "@/components/IframeModal";

const Dashboard = () => {
  return (
    <IframeModal
      isOpen={true}
      onClose={() => {}} // Empty function since we don't want closing
      title="Dashboard"
      url="https://auth.rafiei.co"
      showCloseButton={false}
    />
  );
};

export default Dashboard;

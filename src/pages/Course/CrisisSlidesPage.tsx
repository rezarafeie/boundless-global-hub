import React from "react";
import EnhancedIframe from "@/components/EnhancedIframe";
import Header from "@/components/Layout/Header";

const CrisisSlidesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[calc(100vh-64px)]">
        <EnhancedIframe
          src="https://far-snake-pqxtxot.gamma.site/"
          title="Crisis Project Slides"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default CrisisSlidesPage;
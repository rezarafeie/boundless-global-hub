import React from "react";
import EnhancedIframe from "@/components/EnhancedIframe";
import Header from "@/components/Layout/Header";

const CrisisSlidesPage = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex-1 w-full pt-4 md:pt-0">
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
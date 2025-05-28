
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import EnhancedIframe from "@/components/EnhancedIframe";

const Magazine = () => {
  return (
    <MainLayout>
      <Hero
        title="مجله آکادمی رفیعی"
        subtitle="آخرین مقالات، اخبار و نکات آموزشی در زمینه کسب‌وکار، موفقیت و تحول دیجیتال"
        ctaText="مطالعه مقالات"
        ctaLink="#magazine"
        backgroundType="glow"
      />
      
      <section id="magazine" className="py-0">
        <div className="container-fluid p-0">
          <EnhancedIframe
            src="https://auth.rafiei.co/mag/"
            title="مجله آکادمی رفیعی"
            style={{ height: '100vh' }}
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default Magazine;

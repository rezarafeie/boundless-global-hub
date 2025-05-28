
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import EnhancedIframe from "@/components/EnhancedIframe";

const PaymentRequest = () => {
  return (
    <MainLayout>
      <Hero
        title="درخواست پرداخت ارزی"
        subtitle="درخواست پرداخت با ارزهای دیجیتال و روش‌های بین‌المللی"
        ctaText="ثبت درخواست"
        ctaLink="#payment-request"
        backgroundType="glow"
      />
      
      <section id="payment-request" className="py-0">
        <div className="container-fluid p-0">
          <EnhancedIframe
            src="https://auth.rafiei.co/payreq/"
            title="درخواست پرداخت ارزی"
            style={{ height: '100vh' }}
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default PaymentRequest;


import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";

const Home = () => {
  return (
    <MainLayout>
      <Hero 
        title="آکادمی رفیعی"
        subtitle="مسیر شما به سوی موفقیت و رشد شخصی"
        ctaText="شروع کنید"
        ctaLink="/courses"
      />
      
      {/* Borderless Hub CTA Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-4" dir="rtl">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-3">
            📢 مرکز بدون مرز راه‌اندازی شد!
          </h3>
          <p className="text-lg mb-6 text-blue-100">
            برای دیدن اطلاعیه‌ها، پخش زنده و شرکت در گفت‌وگوهای گروهی وارد شوید.
          </p>
          <a 
            href="/hub" 
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            ورود به مرکز بدون مرز
          </a>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;

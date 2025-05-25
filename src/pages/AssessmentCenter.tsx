
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import TestCard from "@/components/TestCard";
import { useLanguage } from "@/contexts/LanguageContext";

const AssessmentCenter = () => {
  const { translations } = useLanguage();
  
  const tests = [
    {
      id: 1,
      title: "تست شخصیت کاری",
      description: "شناخت نقاط قوت و ضعف شخصیتی برای انتخاب مسیر شغلی مناسب",
      duration: "15 دقیقه",
      questions: 25,
      category: "شخصیت‌شناسی",
      slug: "personality"
    },
    {
      id: 2,
      title: "تست هوش هیجانی",
      description: "سنجش قدرت کنترل احساسات و تعامل موثر با دیگران",
      duration: "20 دقیقه", 
      questions: 30,
      category: "هوش هیجانی",
      slug: "emotional-intelligence"
    },
    {
      id: 3,
      title: "تست استعداد کارآفرینی",
      description: "بررسی توانایی‌ها و مهارت‌های مورد نیاز برای راه‌اندازی کسب‌وکار",
      duration: "25 دقیقه",
      questions: 35,
      category: "کارآفرینی", 
      slug: "entrepreneurship"
    },
    {
      id: 4,
      title: "تست مهارت‌های رهبری",
      description: "ارزیابی قابلیت‌های رهبری و مدیریت تیم",
      duration: "20 دقیقه",
      questions: 28,
      category: "مدیریت",
      slug: "leadership"
    },
    {
      id: 5,
      title: "تست نوع یادگیری",
      description: "تشخیص روش یادگیری مناسب برای بهبود عملکرد تحصیلی و شغلی",
      duration: "15 دقیقه",
      questions: 22,
      category: "یادگیری",
      slug: "learning-style"
    },
    {
      id: 6,
      title: "تست مدیریت زمان",
      description: "بررسی نحوه برنامه‌ریزی و استفاده بهینه از زمان",
      duration: "18 دقیقه",
      questions: 24,
      category: "مهارت‌های زندگی",
      slug: "time-management"
    }
  ];

  return (
    <MainLayout>
      <div className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {translations.assessmentCenter}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              مجموعه‌ای از تست‌های تخصصی برای شناخت بهتر خودتان و انتخاب مسیر مناسب
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map((test) => (
              <TestCard key={test.id} {...test} />
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">چرا تست بدهیم؟</h2>
              <ul className="text-right space-y-3 text-gray-600">
                <li>• شناخت دقیق نقاط قوت و ضعف</li>
                <li>• انتخاب مسیر شغلی مناسب</li>
                <li>• بهبود مهارت‌های شخصی و حرفه‌ای</li>
                <li>• افزایش آگاهی از خود</li>
                <li>• دریافت پیشنهادات کاربردی</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AssessmentCenter;

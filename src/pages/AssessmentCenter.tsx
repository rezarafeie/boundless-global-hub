
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import TestCard from "@/components/TestCard";

const AssessmentCenter = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <Hero
        title={translations.assessmentCenterTitle}
        subtitle={translations.assessmentCenterDesc}
        ctaText={translations.startTest}
        ctaLink="#tests"
        backgroundType="glow"
      />
      
      <section id="tests" className="py-16">
        <div className="container">
          <SectionTitle
            title={translations.assessmentCenterTitle}
            subtitle={translations.assessmentCenterDesc}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <TestCard
              title={translations.personalityTests}
              description="کشف ویژگی‌های شخصیتی خود و نحوه تأثیر آن‌ها بر زندگی و انتخاب‌های شغلی‌تان."
              category={translations.personalityTests}
              duration="۲۰ دقیقه"
              questions={60}
              slug="mbti"
            />
            <TestCard
              title={translations.intelligenceTests}
              description="اندازه‌گیری جنبه‌های مختلف توانایی‌های شناختی و پتانسیل فکری شما."
              category={translations.intelligenceTests}
              duration="۱۵ دقیقه"
              questions={40}
              slug="iq"
            />
            <TestCard
              title={translations.careerTests}
              description="شناسایی مسیرهای شغلی که با علایق، ارزش‌ها، مهارت‌ها و شخصیت شما همخوانی دارد."
              category={translations.careerTests}
              duration="۱۰ دقیقه"
              questions={30}
              slug="career"
            />
            <TestCard
              title={translations.emotionTests}
              description="ارزیابی هوش عاطفی و توانایی شما در درک و مدیریت احساسات."
              category={translations.emotionTests}
              duration="۱۲ دقیقه"
              questions={35}
              slug="eq"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AssessmentCenter;

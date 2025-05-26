import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import TestCard from "@/components/TestCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AssessmentCenter = () => {
  const { translations, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  
  const categories = [
    { id: "all", label: "All Tests", labelFa: "همه تست‌ها" },
    { id: "personality", label: "Personality", labelFa: "شخصیت‌شناسی" },
    { id: "intelligence", label: "Intelligence", labelFa: "هوش" },
    { id: "career", label: "Career", labelFa: "شغلی" },
    { id: "emotional", label: "Emotional", labelFa: "هیجانی" },
    { id: "behavioral", label: "Behavioral", labelFa: "رفتاری" },
    { id: "mental-health", label: "Mental Health", labelFa: "سلامت روان" },
    { id: "educational", label: "Educational", labelFa: "آموزشی" }
  ];

  const tests = [
    // Personality Tests
    {
      id: 1,
      title: "MBTI Personality Test",
      titleFa: "تست شخصیت MBTI",
      description: "Discover your personality type and understand your psychological preferences",
      descriptionFa: "نوع شخصیت خود را کشف کنید و ترجیحات روانشناختی خود را بشناسید",
      duration: "15-20 minutes",
      durationFa: "۱۵-۲۰ دقیقه",
      questions: 93,
      category: "personality",
      slug: "mbti"
    },
    {
      id: 2,
      title: "DISC Assessment",
      titleFa: "ارزیابی DISC",
      description: "Understand your behavioral style and communication preferences",
      descriptionFa: "سبک رفتاری و ترجیحات ارتباطی خود را بشناسید",
      duration: "10-15 minutes",
      durationFa: "۱۰-۱۵ دقیقه",
      questions: 24,
      category: "personality",
      slug: "disc"
    },
    {
      id: 3,
      title: "16 Personality Factors (16PF)",
      titleFa: "۱۶ عامل شخصیت (16PF)",
      description: "Comprehensive personality analysis across 16 primary traits",
      descriptionFa: "تحلیل جامع شخصیت در ۱۶ ویژگی اصلی",
      duration: "35-50 minutes",
      durationFa: "۳۵-۵۰ دقیقه",
      questions: 185,
      category: "personality",
      slug: "16pf"
    },
    {
      id: 4,
      title: "MBTI for Kids (MMTIC)",
      titleFa: "MBTI برای کودکان",
      description: "Personality assessment designed specifically for children and teenagers",
      descriptionFa: "ارزیابی شخصیت طراحی شده مخصوص کودکان و نوجوانان",
      duration: "15 minutes",
      durationFa: "۱۵ دقیقه",
      questions: 70,
      category: "personality",
      slug: "mbti-kids"
    },

    // Intelligence Tests
    {
      id: 5,
      title: "Multiple Intelligence Inventory (MII)",
      titleFa: "فهرست هوش چندگانه (MII)",
      description: "Identify your strongest intelligence types across eight categories",
      descriptionFa: "قوی‌ترین انواع هوش خود را در هشت دسته شناسایی کنید",
      duration: "20-25 minutes",
      durationFa: "۲۰-۲۵ دقیقه",
      questions: 80,
      category: "intelligence",
      slug: "mii"
    },
    {
      id: 6,
      title: "Raven's Progressive Matrices",
      titleFa: "ماتریس‌های پیشرونده ریون",
      description: "Non-verbal intelligence test measuring abstract reasoning ability",
      descriptionFa: "تست هوش غیرکلامی اندازه‌گیری توانایی استدلال انتزاعی",
      duration: "45-60 minutes",
      durationFa: "۴۵-۶۰ دقیقه",
      questions: 60,
      category: "intelligence",
      slug: "raven-iq"
    },
    {
      id: 7,
      title: "Cattell Culture Fair IQ Test",
      titleFa: "تست هوش منصفانه فرهنگی کتل",
      description: "Culture-fair intelligence assessment minimizing educational bias",
      descriptionFa: "ارزیابی هوش منصفانه فرهنگی با کمینه کردن تعصب آموزشی",
      duration: "30-40 minutes",
      durationFa: "۳۰-۴۰ دقیقه",
      questions: 46,
      category: "intelligence",
      slug: "cattell-iq"
    },

    // Career Tests
    {
      id: 8,
      title: "Organizational Culture Questionnaire",
      titleFa: "پرسشنامه فرهنگ سازمانی",
      description: "Identify your preferred work culture and organizational environment",
      descriptionFa: "فرهنگ کاری و محیط سازمانی مطلوب خود را شناسایی کنید",
      duration: "15 minutes",
      durationFa: "۱۵ دقیقه",
      questions: 24,
      category: "career",
      slug: "ocq"
    },
    {
      id: 9,
      title: "Minnesota Satisfaction Questionnaire",
      titleFa: "پرسشنامه رضایت مینه‌سوتا",
      description: "Assess your job satisfaction and identify improvement areas",
      descriptionFa: "رضایت شغلی خود را ارزیابی کنید و نواحی بهبود را شناسایی کنید",
      duration: "10-15 minutes",
      durationFa: "۱۰-۱۵ دقیقه",
      questions: 20,
      category: "career",
      slug: "msq"
    },
    {
      id: 10,
      title: "Holland Interest Inventory",
      titleFa: "فهرست علائق هلند",
      description: "Match your interests with suitable career environments",
      descriptionFa: "علائق خود را با محیط‌های شغلی مناسب تطبیق دهید",
      duration: "15-20 minutes",
      durationFa: "۱۵-۲۰ دقیقه",
      questions: 198,
      category: "career",
      slug: "holland"
    },
    {
      id: 11,
      title: "Entrepreneurial Personality Test",
      titleFa: "تست شخصیت کارآفرینی",
      description: "Evaluate your entrepreneurial traits and business potential",
      descriptionFa: "ویژگی‌های کارآفرینی و پتانسیل کسب‌وکار خود را ارزیابی کنید",
      duration: "20 minutes",
      durationFa: "۲۰ دقیقه",
      questions: 54,
      category: "career",
      slug: "entrepreneurial"
    },
    {
      id: 12,
      title: "Smart Path Test",
      titleFa: "تست مسیر هوشمند",
      description: "Comprehensive career guidance combining personality, interests, and skills",
      descriptionFa: "راهنمایی جامع شغلی ترکیب شخصیت، علائق و مهارت‌ها",
      duration: "30-40 minutes",
      durationFa: "۳۰-۴۰ دقیقه",
      questions: 120,
      category: "career",
      slug: "boundless"
    },

    // Emotional Tests
    {
      id: 13,
      title: "Emotional Intelligence (Shatt)",
      titleFa: "هوش هیجانی (شات)",
      description: "Comprehensive assessment of emotional intelligence capabilities",
      descriptionFa: "ارزیابی جامع قابلیت‌های هوش هیجانی",
      duration: "20-25 minutes",
      durationFa: "۲۰-۲۵ دقیقه",
      questions: 133,
      category: "emotional",
      slug: "eq-shatt"
    },

    // Behavioral Tests
    {
      id: 14,
      title: "Tuckman Procrastination Scale",
      titleFa: "مقیاس اهمال‌کاری تاکمن",
      description: "Identify procrastination patterns and develop productivity strategies",
      descriptionFa: "الگوهای اهمال‌کاری را شناسایی کنید و استراتژی‌های بهره‌وری توسعه دهید",
      duration: "10 minutes",
      durationFa: "۱۰ دقیقه",
      questions: 16,
      category: "behavioral",
      slug: "procrastination"
    },
    {
      id: 15,
      title: "Hewitt Perfectionism Inventory",
      titleFa: "فهرست کمال‌گرایی هویت",
      description: "Understand your perfectionism patterns and their impact",
      descriptionFa: "الگوهای کمال‌گرایی خود و تأثیر آن‌ها را بشناسید",
      duration: "15 minutes",
      durationFa: "۱۵ دقیقه",
      questions: 45,
      category: "behavioral",
      slug: "perfectionism"
    },
    {
      id: 16,
      title: "Internet Addiction Test",
      titleFa: "تست اعتیاد به اینترنت",
      description: "Assess internet usage patterns and identify potential addiction",
      descriptionFa: "الگوهای استفاده از اینترنت را ارزیابی کنید و اعتیاد احتمالی را شناسایی کنید",
      duration: "10 minutes",
      durationFa: "۱۰ دقیقه",
      questions: 20,
      category: "behavioral",
      slug: "internet-addiction"
    },

    // Mental Health Tests
    {
      id: 17,
      title: "Coopersmith Self-Esteem Inventory",
      titleFa: "فهرست عزت‌نفس کوپراسمیت",
      description: "Assess your self-esteem levels across different life areas",
      descriptionFa: "سطح عزت‌نفس خود را در حوزه‌های مختلف زندگی ارزیابی کنید",
      duration: "10-15 minutes",
      durationFa: "۱۰-۱۵ دقیقه",
      questions: 58,
      category: "mental-health",
      slug: "self-esteem"
    },
    {
      id: 18,
      title: "Miller Hope Scale",
      titleFa: "مقیاس امید میلر",
      description: "Measure your sense of hope and optimism about the future",
      descriptionFa: "احساس امید و خوش‌بینی خود نسبت به آینده را اندازه‌گیری کنید",
      duration: "10 minutes",
      durationFa: "۱۰ دقیقه",
      questions: 48,
      category: "mental-health",
      slug: "hope"
    },
    {
      id: 19,
      title: "Maudsley OCD Inventory",
      titleFa: "فهرست OCD مادزلی",
      description: "Screen for obsessive-compulsive symptoms and patterns",
      descriptionFa: "غربالگری علائم و الگوهای وسواس اجباری",
      duration: "10 minutes",
      durationFa: "۱۰ دقیقه",
      questions: 30,
      category: "mental-health",
      slug: "ocd"
    },
    {
      id: 20,
      title: "Oxford Happiness Inventory",
      titleFa: "فهرست شادی آکسفورد",
      description: "Assess your general happiness and life satisfaction levels",
      descriptionFa: "سطح شادی کلی و رضایت از زندگی خود را ارزیابی کنید",
      duration: "15 minutes",
      durationFa: "۱۵ دقیقه",
      questions: 29,
      category: "mental-health",
      slug: "happiness"
    },
    {
      id: 21,
      title: "Social and Emotional Loneliness Scale",
      titleFa: "مقیاس تنهایی اجتماعی و عاطفی",
      description: "Understand your social connectedness and relationship satisfaction",
      descriptionFa: "ارتباط اجتماعی و رضایت از روابط خود را بشناسید",
      duration: "10 minutes",
      durationFa: "۱۰ دقیقه",
      questions: 37,
      category: "mental-health",
      slug: "loneliness"
    },

    // Educational Tests
    {
      id: 22,
      title: "Academic Motivation Scale",
      titleFa: "مقیاس انگیزه تحصیلی",
      description: "Assess different types of motivation for academic achievement",
      descriptionFa: "انواع مختلف انگیزه برای موفقیت تحصیلی را ارزیابی کنید",
      duration: "15 minutes",
      durationFa: "۱۵ دقیقه",
      questions: 28,
      category: "educational",
      slug: "academic-motivation"
    }
  ];

  const filteredTests = activeCategory === "all" 
    ? tests 
    : tests.filter(test => test.category === activeCategory);

  return (
    <MainLayout>
      <Hero
        title={translations.assessmentCenter}
        subtitle="مجموعه جامع تست‌های روانشناختی برای شناخت بهتر خودتان و انتخاب مسیر مناسب"
        ctaText={translations.startTest}
        ctaLink="#tests"
        backgroundType="glow"
      />
      
      <section id="tests" className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">تست‌های تخصصی</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              ۲۲ تست تخصصی در ۸ دسته مختلف برای ارزیابی جامع شخصیت، هوش، مهارت‌ها و ویژگی‌های روانشناختی
            </p>
          </div>

          {/* Category Filters */}
          <Tabs defaultValue="all" className="w-full mb-8">
            <TabsList className="w-full max-w-6xl mx-auto grid grid-cols-4 md:grid-cols-8">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id} 
                  onClick={() => setActiveCategory(category.id)}
                  className="text-xs md:text-sm"
                >
                  {language === "fa" ? category.labelFa : category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Tests Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            key={activeCategory}
          >
            {filteredTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TestCard 
                  title={language === "fa" ? test.titleFa : test.title}
                  description={language === "fa" ? test.descriptionFa : test.description}
                  duration={language === "fa" ? test.durationFa : test.duration}
                  questions={test.questions}
                  category={categories.find(c => c.id === test.category)?.labelFa || test.category}
                  slug={`assessment/${test.slug}`}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredTests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">هیچ تستی در این دسته‌بندی یافت نشد.</p>
            </div>
          )}
          
          {/* Why Take Tests Section */}
          <div className="mt-16 text-center">
            <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">چرا ارزیابی روانشناختی مهم است؟</h2>
              <div className="grid md:grid-cols-2 gap-6 text-right">
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 ml-2">✓</span>
                    شناخت دقیق نقاط قوت و ضعف شخصیتی
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 ml-2">✓</span>
                    انتخاب مسیر شغلی و تحصیلی مناسب
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 ml-2">✓</span>
                    بهبود کیفیت روابط بین‌فردی
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 ml-2">✓</span>
                    افزایش بهره‌وری و عملکرد شغلی
                  </li>
                </ul>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 ml-2">✓</span>
                    توسعه مهارت‌های شخصی و حرفه‌ای
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 ml-2">✓</span>
                    درک بهتر از انگیزه‌ها و اهداف
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 ml-2">✓</span>
                    شناسایی مسائل روانشناختی و درمان
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 ml-2">✓</span>
                    دریافت راهنمایی‌های کاربردی و عملی
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AssessmentCenter;

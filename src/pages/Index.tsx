
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import CourseCard from "@/components/CourseCard";
import QuickAccess from "@/components/QuickAccess";
import TestCard from "@/components/TestCard";
import { useLanguage } from "@/contexts/LanguageContext";
import RandomHeadlineGenerator from "@/components/RandomHeadlineGenerator";
import MobileStickyButton from "@/components/MobileStickyButton";
import LiveEnrollmentCounter from "@/components/LiveEnrollmentCounter";
import { motion } from "framer-motion";

const Index = () => {
  const { language } = useLanguage();

  return (
    <MainLayout>
      <div className="min-h-screen">
        <Hero />
        
        {/* Quick Access Section */}
        <QuickAccess />
        
        {/* Assessment Center Introduction */}
        <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950/20 dark:to-indigo-950/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {language === "en" ? "Assessment Center" : "مرکز ارزیابی"}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                {language === "en" 
                  ? "Discover your potential with our comprehensive assessment tests. Get personalized insights and recommendations for your career path."
                  : "استعداد خود را با آزمون‌های جامع ارزیابی کشف کنید. بینش‌ها و پیشنهادات شخصی‌سازی شده برای مسیر شغلی خود دریافت کنید."
                }
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="/assessment"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:shadow-xl"
                >
                  {language === "en" ? "Start Assessment" : "شروع ارزیابی"}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={language === "en" ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                  </svg>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <SectionTitle 
              title={language === "en" ? "Featured Courses" : "دوره‌های ویژه"}
              subtitle={language === "en" ? "Explore our most popular courses" : "دوره‌های محبوب ما را کاوش کنید"}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <CourseCard
                  title={language === "en" ? "Boundless Taste" : "طعم بدون مرز"}
                  description={language === "en" ? "Master the art of international cuisine" : "هنر آشپزی بین‌المللی را فرا بگیرید"}
                  image="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop"
                  price={language === "en" ? "$299" : "۲٩٩ دلار"}
                  duration={language === "en" ? "8 weeks" : "۸ هفته"}
                  students={1205}
                  href="/courses/boundless-taste"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <CourseCard
                  title={language === "en" ? "American Business" : "کسب و کار آمریکایی"}
                  description={language === "en" ? "Learn US business practices and strategies" : "شیوه‌ها و استراتژی‌های کسب و کار آمریکا را بیاموزید"}
                  image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop"
                  price={language === "en" ? "$499" : "۴٩٩ دلار"}
                  duration={language === "en" ? "12 weeks" : "۱۲ هفته"}
                  students={856}
                  href="/courses/american-business"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <CourseCard
                  title={language === "en" ? "Passive Income Mastery" : "تسلط بر درآمد غیرفعال"}
                  description={language === "en" ? "Build sustainable passive income streams" : "جریان‌های درآمد غیرفعال پایدار ایجاد کنید"}
                  image="https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500&h=300&fit=crop"
                  price={language === "en" ? "$399" : "۳٩٩ دلار"}
                  duration={language === "en" ? "10 weeks" : "۱۰ هفته"}
                  students={1423}
                  href="/courses/passive-income"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Enrollment Counter */}
        <LiveEnrollmentCounter />

        {/* Assessment Tests Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <SectionTitle 
              title={language === "en" ? "Assessment Tests" : "آزمون‌های ارزیابی"}
              subtitle={language === "en" ? "Evaluate your skills and knowledge" : "مهارت‌ها و دانش خود را ارزیابی کنید"}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <TestCard
                  title={language === "en" ? "Personality Assessment" : "ارزیابی شخصیت"}
                  description={language === "en" ? "Discover your personality type and traits" : "نوع شخصیت و ویژگی‌های خود را کشف کنید"}
                  duration={language === "en" ? "15 minutes" : "۱۵ دقیقه"}
                  questions={45}
                  difficulty={language === "en" ? "Beginner" : "مبتدی"}
                  href="/assessment"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <TestCard
                  title={language === "en" ? "Career Guidance" : "راहنمایی شغلی"}
                  description={language === "en" ? "Find the perfect career path for you" : "مسیر شغلی مناسب خود را پیدا کنید"}
                  duration={language === "en" ? "20 minutes" : "۲۰ دقیقه"}
                  questions={60}
                  difficulty={language === "en" ? "Intermediate" : "متوسط"}
                  href="/assessment"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <TestCard
                  title={language === "en" ? "Skills Assessment" : "ارزیابی مهارت‌ها"}
                  description={language === "en" ? "Evaluate your professional skills" : "مهارت‌های حرفه‌ای خود را ارزیابی کنید"}
                  duration={language === "en" ? "25 minutes" : "۲۵ دقیقه"}
                  questions={75}
                  difficulty={language === "en" ? "Advanced" : "پیشرفته"}
                  href="/assessment"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Random Headline Generator */}
        <RandomHeadlineGenerator />
        
        {/* Mobile Sticky Button */}
        <MobileStickyButton />
      </div>
    </MainLayout>
  );
};

export default Index;

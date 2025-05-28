
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseAccessCard from "@/components/Course/CourseAccessCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Gift, Bot, MessageCircle, FileText, Brain } from "lucide-react";

const PassiveIncomeAccess = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <Hero
        title="💸 به دوره درآمد غیرفعال خوش آمدید!"
        subtitle="راهکارهای عملی برای ایجاد درآمد مستمر"
        ctaText={translations.startLearning}
        ctaLink="#course-content"
        backgroundType="glow"
        glowTheme="courses"
      />

      <section className="py-16 bg-gradient-to-b from-background to-muted/20" id="course-content">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Course Sessions */}
            <CourseAccessCard
              title="🎥 جلسات دوره"
              description="دسترسی به تمام جلسات آموزشی"
              icon={<Play size={32} className="text-emerald-500" />}
              buttons={[
                {
                  label: "💸 جلسه اول",
                  url: "https://academy.rafiei.co/daramad/one/",
                  variant: "default",
                  icon: <Play size={16} />
                },
                {
                  label: "💸 جلسه دوم",
                  url: "https://academy.rafiei.co/daramad/two/",
                  variant: "default",
                  icon: <Play size={16} />
                }
              ]}
              className="border-emerald-200 hover:border-emerald-300 bg-emerald-50/50"
            />

            {/* Special Content */}
            <CourseAccessCard
              title="🧠 محتوای ویژه"
              description="برنامه‌های تخصصی و کارگاه‌ها"
              icon={<Brain size={32} className="text-blue-500" />}
              buttons={[
                {
                  label: "🧠 تک اولویت",
                  url: "https://academy.rafiei.co/daramad/gift/done/takolaviat/",
                  variant: "outline",
                  icon: <Brain size={16} />
                },
                {
                  label: "🧠 کارگاه",
                  url: "https://academy.rafiei.co/daramad/gift/done/workshop/",
                  variant: "outline",
                  icon: <Brain size={16} />
                }
              ]}
              className="border-blue-200 hover:border-blue-300 bg-blue-50/50"
            />

            {/* Bonus Materials */}
            <CourseAccessCard
              title="🎁 مواد جایزه"
              description="محتوای اضافی و جوایز ویژه"
              icon={<Gift size={32} className="text-yellow-500" />}
              buttons={[
                {
                  label: "🎁 مشاهده جوایز",
                  url: "https://academy.rafiei.co/daramad/gift/",
                  variant: "default",
                  icon: <Gift size={16} />
                }
              ]}
              className="border-yellow-200 hover:border-yellow-300 bg-yellow-50/50"
            />

            {/* AI Assistant */}
            <CourseAccessCard
              title="🤖 دستیار هوش مصنوعی"
              description="فعال‌سازی دستیار اختصاصی رفیعی"
              icon={<Bot size={32} className="text-purple-500" />}
              buttons={[
                {
                  label: "🤖 فعال‌سازی دستیار",
                  url: "https://t.me/rafiei_bot",
                  variant: "default",
                  icon: <Bot size={16} />
                }
              ]}
              className="border-purple-200 hover:border-purple-300 bg-purple-50/50"
            />

            {/* Telegram Support */}
            <CourseAccessCard
              title="💬 پشتیبانی تلگرام"
              description="فعال‌سازی پشتیبانی اختصاصی"
              icon={<MessageCircle size={32} className="text-orange-500" />}
              buttons={[
                {
                  label: "💬 فعال‌سازی پشتیبانی",
                  url: "https://t.me/m/ToRJiOBHN2E0",
                  variant: "default",
                  icon: <MessageCircle size={16} />
                }
              ]}
              className="border-orange-200 hover:border-orange-300 bg-orange-50/50"
            />

            {/* Telegram Channel */}
            <CourseAccessCard
              title="📦 کانال تلگرام دوره"
              description="دسترسی به فایل‌ها و محتوای اختصاصی"
              icon={<FileText size={32} className="text-pink-500" />}
              buttons={[
                {
                  label: "📦 ورود به کانال",
                  url: "https://t.me/daramadproject",
                  variant: "default",
                  icon: <MessageCircle size={16} />
                }
              ]}
              className="border-pink-200 hover:border-pink-300 bg-pink-50/50"
            />

          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-r from-emerald-50 to-pink-50 dark:from-emerald-950/20 dark:to-pink-950/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">💰 مسیر آزادی مالی شما آغاز شد!</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            با این دوره می‌توانید سیستم‌های درآمد غیرفعال ایجاد کنید و به آزادی مالی دست یابید. هر قدم شما را به سوی استقلال مالی نزدیک‌تر می‌کند.
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default PassiveIncomeAccess;


import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseAccessCard from "@/components/Course/CourseAccessCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Gift, Bot, MessageCircle, FileText } from "lucide-react";

const AmericanBusinessAccess = () => {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <Hero
        title="🇺🇸 به دوره بیزینس آمریکایی خوش آمدید!"
        subtitle="راهنمای جامع ورود به بازار آمریکا در اختیار شماست"
        ctaText={t.startLearning}
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
              icon={<Play size={32} className="text-red-500" />}
              buttons={[
                {
                  label: "🇺🇸 جلسه اول",
                  url: "https://academy.rafiei.co/class/americanbusiness/abone/",
                  variant: "default",
                  icon: <Play size={16} />
                },
                {
                  label: "🇺🇸 جلسه دوم",
                  url: "https://academy.rafiei.co/class/americanbusiness/abtwo/",
                  variant: "default",
                  icon: <Play size={16} />
                }
              ]}
              className="border-red-200 hover:border-red-300 bg-red-50/50"
            />

            {/* Bonus Materials */}
            <CourseAccessCard
              title="🎁 مواد جایزه"
              description="محتوای اضافی و جوایز ویژه"
              icon={<Gift size={32} className="text-yellow-500" />}
              buttons={[
                {
                  label: "🎁 مشاهده جوایز",
                  url: "https://academy.rafiei.co/class/americanbusiness/gift/",
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

            {/* Telegram Channel */}
            <CourseAccessCard
              title="📦 کانال تلگرام دوره"
              description="دسترسی به فایل‌ها و محتوای اختصاصی"
              icon={<FileText size={32} className="text-blue-500" />}
              buttons={[
                {
                  label: "📦 ورود به کانال",
                  url: "https://t.me/+yrd-nFh6De0zNTJk",
                  variant: "default",
                  icon: <MessageCircle size={16} />
                }
              ]}
              className="border-blue-200 hover:border-blue-300 bg-blue-50/50"
            />

          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-950/20 dark:to-blue-950/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">🚀 مسیر موفقیت در بازار آمریکا!</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            شما اکنون به راهنمای کامل ورود به بازار آمریکا دسترسی دارید. با استفاده از این محتوا می‌توانید کسب‌وکار بین‌المللی خود را آغاز کنید.
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default AmericanBusinessAccess;

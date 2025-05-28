
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseAccessCard from "@/components/Course/CourseAccessCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Play, Gift, Bot, MessageCircle, FileText } from "lucide-react";

const TaghirAccess = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <Hero
        title="📘 به پروژه تغییر خوش آمدید!"
        subtitle="برنامه جامع تغییر زندگی و رشد شخصی"
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
              icon={<Play size={32} className="text-indigo-500" />}
              buttons={[
                {
                  label: "📘 جلسه اول",
                  url: "https://academy.rafiei.co/taghir/tpone/",
                  variant: "default",
                  icon: <Play size={16} />
                },
                {
                  label: "📘 جلسه دوم",
                  url: "https://academy.rafiei.co/taghir/tptwo/",
                  variant: "default",
                  icon: <Play size={16} />
                },
                {
                  label: "📘 جلسه سوم",
                  url: "https://academy.rafiei.co/taghir/tpthree/",
                  variant: "default",
                  icon: <Play size={16} />
                }
              ]}
              className="border-indigo-200 hover:border-indigo-300 bg-indigo-50/50"
            />

            {/* Bonus Materials */}
            <CourseAccessCard
              title="🎁 مواد جایزه"
              description="محتوای اضافی و جوایز ویژه"
              icon={<Gift size={32} className="text-yellow-500" />}
              buttons={[
                {
                  label: "🎁 مشاهده جوایز",
                  url: "https://academy.rafiei.co/taghir/reweb/gift/",
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
              icon={<MessageCircle size={32} className="text-green-500" />}
              buttons={[
                {
                  label: "💬 فعال‌سازی پشتیبانی",
                  url: "https://t.me/m/Ljua1cGLZjk0",
                  variant: "default",
                  icon: <MessageCircle size={16} />
                }
              ]}
              className="border-green-200 hover:border-green-300 bg-green-50/50"
            />

            {/* Telegram Channel */}
            <CourseAccessCard
              title="📦 کانال تلگرام دوره"
              description="دسترسی به فایل‌ها و محتوای اختصاصی"
              icon={<FileText size={32} className="text-teal-500" />}
              buttons={[
                {
                  label: "📦 ورود به کانال",
                  url: "https://t.me/taghirproject",
                  variant: "default",
                  icon: <MessageCircle size={16} />
                }
              ]}
              className="border-teal-200 hover:border-teal-300 bg-teal-50/50"
            />

          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-r from-indigo-50 to-teal-50 dark:from-indigo-950/20 dark:to-teal-950/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">🌟 آغاز تغییر زندگی شما!</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            پروژه تغییر شما را در مسیر رشد شخصی و دستیابی به اهدافتان همراهی می‌کند. هر روز قدمی جدید به سوی نسخه بهتر خودتان بردارید.
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default TaghirAccess;

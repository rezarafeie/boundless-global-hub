
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import CourseAccessCard from "@/components/Course/CourseAccessCard";
import { Play, Download, MessageCircle, Bot, FileText, Gift } from "lucide-react";

const PaidCourseStart = () => {
  const { slug } = useParams();
  const { translations } = useLanguage();

  // Course-specific content
  const getCourseContent = (courseSlug: string) => {
    switch (courseSlug) {
      case "boundless":
        return {
          title: translations.boundlessProgramTitle,
          description: translations.boundlessProgramDesc,
          supportLinks: [
            "https://t.me/m/ToRJiOBHN2E0",
            "https://t.me/m/c43Pi3aXODFk",
            "https://t.me/m/YOGv3cr2MmM0"
          ],
          channelLink: "https://t.me/mazeboundless"
        };
      case "instagram":
        return {
          title: translations.instagramEssentialsTitle,
          description: translations.instagramEssentialsDesc,
          supportLinks: ["https://t.me/m/InstagramSupport"],
          channelLink: "https://t.me/instagramacademy"
        };
      default:
        return {
          title: translations.boundlessProgramTitle,
          description: translations.boundlessProgramDesc,
          supportLinks: ["https://t.me/m/ToRJiOBHN2E0"],
          channelLink: "https://t.me/mazeboundless"
        };
    }
  };

  const courseContent = getCourseContent(slug || "boundless");

  return (
    <MainLayout>
      <Hero
        title={translations.courseAccessGranted}
        subtitle={translations.paidCourseAccessInstructions}
        ctaText={translations.startLearning}
        ctaLink="#course-content"
        backgroundType="glow"
        glowTheme="courses"
      />

      <section className="py-16 bg-gradient-to-b from-background to-muted/20" id="course-content">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Course Content */}
            <CourseAccessCard
              title="🎥 محتوای دوره"
              description={translations.courseMaterialsDescription}
              icon={<Play size={32} className="text-blue-500" />}
              buttons={[
                {
                  label: translations.rafeiPlayer,
                  url: "#player",
                  variant: "default",
                  icon: <Play size={16} />
                }
              ]}
              badge={translations.activated}
              className="border-blue-200 hover:border-blue-300"
            />

            {/* Course Materials */}
            <CourseAccessCard
              title={translations.courseMaterials}
              description={translations.courseMaterialsDescription}
              icon={<Download size={32} className="text-green-500" />}
              buttons={[
                {
                  label: translations.worksheets,
                  url: "#worksheets",
                  variant: "outline",
                  icon: <FileText size={16} />
                },
                {
                  label: translations.resources,
                  url: "#resources",
                  variant: "outline",
                  icon: <Download size={16} />
                }
              ]}
              className="border-green-200 hover:border-green-300"
            />

            {/* AI Assistant */}
            <CourseAccessCard
              title={translations.aiAssistant}
              description="دسترسی به دستیار هوش مصنوعی اختصاصی"
              icon={<Bot size={32} className="text-purple-500" />}
              buttons={[
                {
                  label: translations.launchAIAssistant,
                  url: "https://t.me/rafiei_bot",
                  variant: "default",
                  icon: <Bot size={16} />
                }
              ]}
              className="border-purple-200 hover:border-purple-300"
            />

            {/* Support Links */}
            <CourseAccessCard
              title="💬 لینک‌های پشتیبانی"
              description="دسترسی به پشتیبانی اختصاصی"
              icon={<MessageCircle size={32} className="text-orange-500" />}
              buttons={courseContent.supportLinks.map((link, index) => ({
                label: `پشتیبانی ${index + 1}`,
                url: link,
                variant: "outline" as const,
                icon: <MessageCircle size={16} />
              }))}
              className="border-orange-200 hover:border-orange-300"
            />

            {/* Telegram Channels */}
            <CourseAccessCard
              title="📦 کانال‌های تلگرام"
              description="دسترسی به فایل‌ها و محتوای اختصاصی"
              icon={<FileText size={32} className="text-cyan-500" />}
              buttons={[
                {
                  label: translations.joinTelegram,
                  url: courseContent.channelLink,
                  variant: "default",
                  icon: <MessageCircle size={16} />
                }
              ]}
              className="border-cyan-200 hover:border-cyan-300"
            />

            {/* Bonus Content */}
            <CourseAccessCard
              title="🎁 محتوای جایزه"
              description="فایل‌ها و منابع اضافی"
              icon={<Gift size={32} className="text-pink-500" />}
              buttons={[
                {
                  label: "مشاهده جوایز",
                  url: "#bonuses",
                  variant: "outline",
                  icon: <Gift size={16} />
                }
              ]}
              className="border-pink-200 hover:border-pink-300"
            />

          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">{translations.welcomeToCourse}</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            از این پس می‌توانید به تمام امکانات و محتوای دوره دسترسی داشته باشید. برای هر گونه سوال از بخش پشتیبانی استفاده کنید.
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default PaidCourseStart;


import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import TestCard from "@/components/TestCard";

const AssessmentCenter = () => {
  const { translations } = useLanguage();

  const tests = [
    {
      title: "تست شخصیت MBTI",
      description: "شناخت نوع شخصیت و الگوهای رفتاری شما بر اساس تئوری مایرز-بریگز",
      category: "شخصیت",
      duration: "۲۰ دقیقه",
      questions: 60,
      slug: "mbti"
    },
    {
      title: "تست DISC",
      description: "ارزیابی سبک رفتاری و نحوه تعامل شما با دیگران",
      category: "شخصیت",
      duration: "۱۵ دقیقه",
      questions: 40,
      slug: "disc"
    },
    {
      title: "تست هوش چندگانه MII",
      description: "شناسایی انواع مختلف هوش و توانایی‌های ذهنی شما",
      category: "هوش",
      duration: "۲۵ دقیقه",
      questions: 80,
      slug: "mii"
    },
    {
      title: "تست تعهد سازمانی OCQ",
      description: "سنجش میزان تعهد و وفاداری شما نسبت به سازمان",
      category: "سازمانی",
      duration: "۱۰ دقیقه",
      questions: 24,
      slug: "ocq"
    },
    {
      title: "تست رضایت شغلی MSQ",
      description: "ارزیابی میزان رضایت شما از جنبه‌های مختلف کار",
      category: "شغلی",
      duration: "۱۵ دقیقه",
      questions: 100,
      slug: "msq"
    },
    {
      title: "تست هوش ریون",
      description: "سنجش هوش غیرکلامی و توانایی حل مسئله",
      category: "هوش",
      duration: "۳۰ دقیقه",
      questions: 60,
      slug: "raven"
    },
    {
      title: "تست هوش کتل فرم B",
      description: "ارزیابی جامع هوش عمومی و توانایی‌های شناختی",
      category: "هوش",
      duration: "۴۵ دقیقه",
      questions: 50,
      slug: "cattell-b"
    },
    {
      title: "تست هوش عاطفی EQ-Shatt",
      description: "سنجش توانایی درک و مدیریت احساسات خود و دیگران",
      category: "عاطفی",
      duration: "۲۰ دقیقه",
      questions: 70,
      slug: "eq-shatt"
    },
    {
      title: "تست عزت نفس کوپراسمیت",
      description: "ارزیابی میزان اعتماد به نفس و ارزش‌گذاری خود",
      category: "شخصیت",
      duration: "۱۰ دقیقه",
      questions: 58,
      slug: "coopersmith"
    },
    {
      title: "تست علایق شغلی هالند",
      description: "شناسایی علایق شغلی و مسیر شغلی مناسب",
      category: "شغلی",
      duration: "۱۵ دقیقه",
      questions: 84,
      slug: "holland"
    },
    {
      title: "تست شخصیت 16PF کتل",
      description: "بررسی جامع ۱۶ عامل اصلی شخصیت",
      category: "شخصیت",
      duration: "۳۰ دقیقه",
      questions: 185,
      slug: "16pf"
    },
    {
      title: "تست اهمال‌کاری تاکمن",
      description: "سنجش میزان تمایل به تعویق انداختن کارها",
      category: "رفتاری",
      duration: "۵ دقیقه",
      questions: 16,
      slug: "tuckman"
    },
    {
      title: "تست کمال‌گرایی هیل",
      description: "ارزیابی انواع مختلف کمال‌گرایی و تأثیر آن بر زندگی",
      category: "شخصیت",
      duration: "۱۰ دقیقه",
      questions: 59,
      slug: "hill"
    },
    {
      title: "تست انگیزش تحصیلی هارتر",
      description: "سنجش انگیزه و علاقه به یادگیری و تحصیل",
      category: "تحصیلی",
      duration: "۸ دقیقه",
      questions: 30,
      slug: "harter"
    },
    {
      title: "تست MBTI کودکان",
      description: "نسخه ویژه کودکان برای شناخت شخصیت",
      category: "کودکان",
      duration: "۱۵ دقیقه",
      questions: 40,
      slug: "mmtic"
    },
    {
      title: "تست امید میلر",
      description: "سنجش میزان امیدواری و نگرش مثبت به آینده",
      category: "روانی",
      duration: "۵ دقیقه",
      questions: 48,
      slug: "miller-hope"
    },
    {
      title: "تست اعتیاد اینترنتی یانگ",
      description: "ارزیابی میزان وابستگی به اینترنت و فضای مجازی",
      category: "رفتاری",
      duration: "۵ دقیقه",
      questions: 20,
      slug: "internet-addiction"
    },
    {
      title: "تست وسواس فکری-عملی",
      description: "سنجش نشانه‌های اختلال وسواس فکری و عملی",
      category: "روانی",
      duration: "۱۰ دقیقه",
      questions: 30,
      slug: "moci"
    },
    {
      title: "تست شادی آکسفورد",
      description: "ارزیابی میزان شادی و رضایت از زندگی",
      category: "روانی",
      duration: "۱۰ دقیقه",
      questions: 29,
      slug: "oxford-happiness"
    },
    {
      title: "تست تنهایی اجتماعی",
      description: "سنجش احساس تنهایی و انزوای اجتماعی",
      category: "اجتماعی",
      duration: "۸ دقیقه",
      questions: 20,
      slug: "social-loneliness"
    },
    {
      title: "تست شخصیت کارآفرینی",
      description: "ارزیابی ویژگی‌های کارآفرینی و پتانسیل کسب‌وکار",
      category: "کسب‌وکار",
      duration: "۱۵ دقیقه",
      questions: 50,
      slug: "entrepreneurial"
    },
    {
      title: "تست مسیر هوشمند",
      description: "راهنمای انتخاب مسیر تحصیلی و شغلی مناسب",
      category: "شغلی",
      duration: "۲۰ دقیقه",
      questions: 60,
      slug: "smart-path"
    },
    {
      title: "تست هوش تصویری کتل فرم A",
      description: "سنجش هوش بصری و توانایی درک الگوهای تصویری",
      category: "هوش",
      duration: "۴۰ دقیقه",
      questions: 50,
      slug: "cattell-visual"
    }
  ];

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
            title="مجموعه کامل تست‌های روان‌شناختی"
            subtitle="بیش از ۲۳ تست معتبر برای شناخت بهتر خودتان"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {tests.map((test, index) => (
              <TestCard
                key={index}
                title={test.title}
                description={test.description}
                category={test.category}
                duration={test.duration}
                questions={test.questions}
                slug={test.slug}
              />
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AssessmentCenter;

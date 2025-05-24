
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/Auth/AuthModal";
import { Clock, BarChart3, Check, Target } from "lucide-react";

const TestLanding = () => {
  const { slug } = useParams();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Test data mapping
  const testData: Record<string, any> = {
    "mbti": {
      title: "MBTI (مایرز بریگز)",
      description: "تست شخصیت MBTI به شما کمک می‌کند تا نوع شخصیتی خود را شناسایی کنید و بفهمید چگونه با دنیای اطراف خود تعامل دارید.",
      fullDescription: "تست MBTI یکی از معتبرترین ابزارهای ارزیابی شخصیت در جهان است که بر اساس نظریه کارل یونگ طراحی شده است. این تست شما را در یکی از 16 نوع شخصیتی طبقه‌بندی می‌کند.",
      category: "شخصیت‌شناسی",
      duration: "۱۵-۲۰ دقیقه",
      questions: 70,
      outcomes: [
        "شناخت نوع شخصیتی خود",
        "درک نحوه تعامل با دیگران",
        "کشف نقاط قوت و ضعف",
        "راهنمایی برای انتخاب شغل مناسب"
      ],
      method: "پرسشنامه استاندارد بر اساس ترجیحات رفتاری"
    },
    "enneagram": {
      title: "انیاگرام",
      description: "انیاگرام یک مدل شخصیتی است که ۹ تیپ شخصیتی متمایز را توصیف می‌کند و به شما کمک می‌کند انگیزه‌های درونی خود را بشناسید.",
      fullDescription: "انیاگرام یکی از عمیق‌ترین سیستم‌های شناخت شخصیت است که نه ترسانه و انگیزه اصلی انسان‌ها را بررسی می‌کند.",
      category: "شخصیت‌شناسی",
      duration: "۱۰-۱۵ دقیقه",
      questions: 45,
      outcomes: [
        "شناخت انگیزه‌های درونی",
        "درک الگوهای رفتاری خود",
        "کشف مسیر رشد شخصی",
        "بهبود روابط بین فردی"
      ],
      method: "ارزیابی بر اساس ۹ تیپ شخصیتی انیاگرام"
    },
    "iq-classic": {
      title: "IQ کلاسیک",
      description: "تست هوش کلاسیک برای اندازه‌گیری توانایی‌های شناختی، منطق و حل مسئله.",
      fullDescription: "این تست هوش استاندارد، توانایی‌های شناختی شما را در زمینه‌های مختلف مانند منطق، ریاضی، زبان و تجسم فضایی اندازه‌گیری می‌کند.",
      category: "هوش‌سنجی",
      duration: "۳۰-۴۵ دقیقه",
      questions: 50,
      outcomes: [
        "تعیین سطح IQ شما",
        "شناخت نقاط قوت شناختی",
        "ارزیابی توانایی حل مسئله",
        "مقایسه با جامعه آماری"
      ],
      method: "سوالات استاندارد هوش‌سنجی"
    },
    "multiple-intelligence": {
      title: "هوش چندگانه گاردنر",
      description: "این ارزیابی انواع مختلف هوش شما را مانند هوش ریاضی، زبانی، موسیقیایی و فضایی اندازه‌گیری می‌کند.",
      fullDescription: "بر اساس نظریه هوش چندگانه هاوارد گاردنر، این تست 8 نوع هوش مختلف شما را ارزیابی می‌کند.",
      category: "هوش‌سنجی",
      duration: "۲۰-۲۵ دقیقه",
      questions: 65,
      outcomes: [
        "شناخت انواع هوش غالب",
        "کشف استعدادهای پنهان",
        "راهنمایی برای توسعه مهارت‌ها",
        "انتخاب مسیر تحصیلی مناسب"
      ],
      method: "ارزیابی 8 نوع هوش گاردنر"
    },
    "career-aptitude": {
      title: "آزمون استعداد شغلی",
      description: "به شما کمک می‌کند مشاغلی که با مهارت‌ها، علایق و شخصیت شما سازگارترند را شناسایی کنید.",
      fullDescription: "این آزمون جامع، علایق، مهارت‌ها و ارزش‌های شما را ارزیابی کرده و مشاغل مناسب را پیشنهاد می‌دهد.",
      category: "مشاوره شغلی",
      duration: "۲۵-۳۰ دقیقه",
      questions: 60,
      outcomes: [
        "شناسایی مشاغل مناسب",
        "درک علایق شغلی",
        "ارزیابی مهارت‌های موجود",
        "برنامه‌ریزی مسیر شغلی"
      ],
      method: "تطبیق علایق و مهارت‌ها با مشاغل"
    },
    "entrepreneurship": {
      title: "ارزیابی مهارت‌های کارآفرینی",
      description: "میزان آمادگی شما برای راه‌اندازی کسب و کار و نقاط قوت و ضعف کارآفرینی شما را ارزیابی می‌کند.",
      fullDescription: "این ارزیابی تخصصی، ویژگی‌های کارآفرینی شما را بررسی کرده و میزان آمادگی شما برای کسب‌وکار را تعیین می‌کند.",
      category: "مشاوره شغلی",
      duration: "۱۵-۲۰ دقیقه",
      questions: 40,
      outcomes: [
        "ارزیابی پتانسیل کارآفرینی",
        "شناخت مهارت‌های کسب‌وکار",
        "راهنمایی برای توسعه مهارت‌ها",
        "برنامه‌ریزی کسب‌وکار"
      ],
      method: "سنجش ویژگی‌های کارآفرینی"
    },
    "emotional-intelligence": {
      title: "هوش هیجانی (EQ)",
      description: "این آزمون توانایی شما در درک و مدیریت احساسات خود و دیگران را اندازه‌گیری می‌کند.",
      fullDescription: "هوش هیجانی یکی از مهم‌ترین عوامل موفقیت در زندگی شخصی و حرفه‌ای است. این تست 4 مولفه اصلی EQ را ارزیابی می‌کند.",
      category: "هوش هیجانی",
      duration: "۲۰-۲۵ دقیقه",
      questions: 55,
      outcomes: [
        "سنجش سطح هوش هیجانی",
        "شناخت نقاط قوت هیجانی",
        "راهنمایی برای بهبود EQ",
        "بهبود روابط اجتماعی"
      ],
      method: "ارزیابی 4 مولفه هوش هیجانی"
    },
    "stress-management": {
      title: "مدیریت استرس",
      description: "نحوه واکنش شما به استرس و استراتژی‌های مقابله‌ای شما را ارزیابی می‌کند.",
      fullDescription: "این ارزیابی الگوهای واکنش شما به استرس و تکنیک‌های مقابله‌ای موثر را شناسایی می‌کند.",
      category: "هوش هیجانی",
      duration: "۱۰-۱۵ دقیقه",
      questions: 35,
      outcomes: [
        "شناخت الگوهای استرس",
        "یادگیری تکنیک‌های آرامش",
        "بهبود مدیریت استرس",
        "افزایش کیفیت زندگی"
      ],
      method: "ارزیابی واکنش‌های استرسی"
    }
  };

  const test = testData[slug || ""];

  if (!test) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">تست مورد نظر یافت نشد</h1>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 pb-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4">{test.category}</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">{test.title}</h1>
            <p className="text-xl text-gray-600 mb-8">{test.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock size={18} className="text-blue-600" />
                <span className="text-sm font-medium">{test.duration}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <BarChart3 size={18} className="text-green-600" />
                <span className="text-sm font-medium">{test.questions} سوال</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <Target size={18} className="text-purple-600" />
                <span className="text-sm font-medium">ارزیابی تخصصی</span>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
              onClick={() => setShowAuthModal(true)}
            >
              شروع تست
            </Button>
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-6">درباره این تست</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {test.fullDescription}
                </p>
                <h3 className="text-xl font-bold mb-4">روش ارزیابی</h3>
                <p className="text-gray-700">
                  {test.method}
                </p>
              </div>
              
              <div>
                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">نتایج این تست</h3>
                    <ul className="space-y-3">
                      {test.outcomes.map((outcome: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                        onClick={() => setShowAuthModal(true)}
                      >
                        شروع تست
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        courseTitle={test.title}
        isPaid={false}
      />
    </MainLayout>
  );
};

export default TestLanding;

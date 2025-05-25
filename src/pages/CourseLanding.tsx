
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, Star, Clock, Users, Trophy, Gift } from "lucide-react";
import PaymentButton from "@/components/PaymentButton";

const CourseLanding = () => {
  const { slug } = useParams();
  const { translations } = useLanguage();

  // Course data mapping
  const courseData = {
    "boundless": {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      price: "2,500,000",
      duration: "6 ماه",
      modules: 12,
      students: 450,
      instructor: "امیر رفیعی",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
      bonuses: [
        "دسترسی مادام‌العمر",
        "جلسات کوچینگ زنده",
        "گروه اختصاصی تلگرام",
        "پشتیبانی 24/7"
      ]
    },
    "instagram": {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      price: "1,800,000",
      duration: "4 هفته",
      modules: 6,
      students: 850,
      instructor: "امیر رفیعی",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      bonuses: [
        "قالب‌های آماده کنتنت",
        "استراتژی تبلیغات",
        "تحلیل رقبا",
        "ابزارهای اندازه‌گیری"
      ]
    },
    "wealth": {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      price: "3,200,000",
      duration: "8 هفته",
      modules: 8,
      students: 620,
      instructor: "امیر رفیعی",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      bonuses: [
        "کارگاه‌های عملی",
        "مشاوره سرمایه‌گذاری",
        "ابزار مدیریت مالی",
        "گزارش‌های هفتگی"
      ]
    },
    "metaverse": {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      price: "2,800,000",
      duration: "10 هفته",
      modules: 10,
      students: 380,
      instructor: "امیر رفیعی",
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80",
      bonuses: [
        "راهنمای NFT",
        "استراتژی‌های Web3",
        "پروژه‌های عملی",
        "شبکه‌سازی متاورس"
      ]
    },
    "boundless-taste": {
      title: translations.boundlessTaste,
      description: translations.boundlessTasteDesc,
      benefits: translations.boundlessTasteBenefits,
      outcome: translations.boundlessTasteOutcome,
      isPaid: false,
      duration: "2 هفته",
      modules: 4,
      students: 1200,
      instructor: "امیر رفیعی",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      bonuses: [
        "محتوای رایگان",
        "دسترسی آزمایشی",
        "راهنمای شروع",
        "ویدیوهای آموزشی"
      ]
    },
    "passive-income-ai": {
      title: translations.passiveIncomeAI,
      description: translations.passiveIncomeAIDesc,
      benefits: translations.passiveIncomeAIBenefits,
      outcome: translations.passiveIncomeAIOutcome,
      isPaid: false,
      duration: "3 هفته",
      modules: 5,
      students: 890,
      instructor: "امیر رفیعی",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
      bonuses: [
        "ابزارهای AI",
        "قالب‌های آماده",
        "راهکارهای عملی",
        "پشتیبانی آنلاین"
      ]
    }
  };

  const course = courseData[slug as keyof typeof courseData];

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">دوره یافت نشد</h1>
          <Link to="/courses">
            <Button>بازگشت به دوره‌ها</Button>
          </Link>
        </div>
      </div>
    );
  }

  const benefitsList = Array.isArray(course.benefits) ? course.benefits : course.benefits.split('\n').filter(b => b.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Badge variant={course.isPaid ? "default" : "secondary"} className="text-lg px-4 py-2">
                  {course.isPaid ? "دوره ویژه" : "دوره رایگان"}
                </Badge>
                {course.isPaid && (
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {course.price} تومان
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {course.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {course.description}
              </p>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm text-gray-500">مدت دوره</div>
                  <div className="font-semibold">{course.duration}</div>
                </div>
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-sm text-gray-500">تعداد ماژول</div>
                  <div className="font-semibold">{course.modules}</div>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm text-gray-500">دانشجو</div>
                  <div className="font-semibold">{course.students}+</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                {course.isPaid ? (
                  <PaymentButton 
                    courseSlug={slug || ""}
                    className="px-8 py-4 text-lg rounded-full"
                  />
                ) : (
                  <Button asChild size="lg" className="px-8 py-4 text-lg rounded-full">
                    <Link to={`/start/free-course/${slug}`}>
                      شروع رایگان
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg rounded-full">
                  مشاهده نمونه
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">4.9</span>
                  <span className="text-gray-500 text-sm">({course.students} نظر)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-8">آنچه یاد خواهید گرفت</h2>
              <div className="space-y-4">
                {benefitsList.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-8">بونوس‌های ویژه</h2>
              <div className="space-y-4">
                {course.bonuses.map((bonus, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{bonus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">نتیجه نهایی</h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              {course.outcome}
            </p>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                    alt="امیر رفیعی"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="text-right">
                    <h3 className="font-bold text-lg">{course.instructor}</h3>
                    <p className="text-gray-600">مدرس و کارآفرین</p>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  {course.isPaid ? (
                    <PaymentButton 
                      courseSlug={slug || ""}
                      className="px-8 py-4 text-lg rounded-full"
                    />
                  ) : (
                    <Button asChild size="lg" className="px-8 py-4 text-lg rounded-full">
                      <Link to={`/start/free-course/${slug}`}>
                        شروع رایگان
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseLanding;

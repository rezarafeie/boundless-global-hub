
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import CheckoutForm from "@/components/CheckoutForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import BlackFridayCountdown from "@/components/BlackFriday/BlackFridayCountdown";
import { Zap, Sparkles } from "lucide-react";

const Checkout = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { translations } = useLanguage();
  const { isActive: isBlackFridayActive, settings: blackFridaySettings } = useBlackFridayContext();

  if (!courseSlug) {
    navigate("/");
    return null;
  }

  const getCourseInfo = (slug: string) => {
    const courseInfo = {
      "boundless": {
        title: "دوره بی‌حد و مرز",
        price: "۲,۹۹۰,۰۰۰ تومان"
      },
      "instagram": {
        title: "دوره اینستاگرام",
        price: "۱,۴۹۰,۰۰۰ تومان"
      },
      "metaverse": {
        title: "امپراطوری متاورس",
        price: "۳,۹۹۰,۰۰۰ تومان"
      }
    };
    
    return courseInfo[slug as keyof typeof courseInfo] || {
      title: "دوره آموزشی",
      price: "۰ تومان"
    };
  };

  const courseInfo = getCourseInfo(courseSlug);

  return (
    <MainLayout>
      {/* Black Friday Special Banner */}
      {isBlackFridayActive && blackFridaySettings?.end_date && (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b-4 border-yellow-500/50 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    BLACK FRIDAY
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                  </h2>
                  <p className="text-sm text-zinc-300">تخفیف ویژه برای ثبت‌نام</p>
                </div>
              </div>
              <BlackFridayCountdown endDate={blackFridaySettings.end_date} />
            </div>
          </div>
        </div>
      )}
      
      <div className="container py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {isBlackFridayActive ? '🔥 پرداخت با تخفیف ویژه بلک فرایدی' : 'خرید دوره'}
          </h1>
          <p className="text-muted-foreground">
            {isBlackFridayActive 
              ? '⚡ فرصت استثنایی برای ثبت‌نام با تخفیف - زمان محدود!'
              : 'فقط چند قدم تا دسترسی کامل به دوره'
            }
          </p>
        </div>
        
        <CheckoutForm 
          courseSlug={courseSlug}
          courseTitle={courseInfo.title}
          price={courseInfo.price}
        />
      </div>
    </MainLayout>
  );
};

export default Checkout;

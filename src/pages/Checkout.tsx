
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import CheckoutForm from "@/components/CheckoutForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBlackFridayContext } from "@/contexts/BlackFridayContext";
import BlackFridayBanner from "@/components/BlackFriday/BlackFridayBanner";
import BlackFridayCountdown from "@/components/BlackFriday/BlackFridayCountdown";

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
      {/* Black Friday Banner */}
      {isBlackFridayActive && blackFridaySettings?.end_date && (
        <BlackFridayBanner endDate={blackFridaySettings.end_date} />
      )}
      
      <div className={`container py-16 ${isBlackFridayActive ? 'bg-gradient-to-b from-black/5 to-transparent' : ''}`}>
        <div className="text-center mb-8">
          {isBlackFridayActive && (
            <div className="mb-6 flex justify-center">
              <BlackFridayCountdown 
                endDate={blackFridaySettings?.end_date || ''} 
                className="scale-90"
              />
            </div>
          )}
          <h1 className={`text-3xl font-bold mb-4 ${isBlackFridayActive ? 'text-yellow-600' : ''}`}>
            {isBlackFridayActive ? '🔥 پرداخت با تخفیف ویژه بلک فرایدی' : 'خرید دوره'}
          </h1>
          <p className={isBlackFridayActive ? 'text-yellow-700 font-semibold' : 'text-gray-600'}>
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

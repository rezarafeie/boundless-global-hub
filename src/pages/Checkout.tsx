
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import CheckoutForm from "@/components/CheckoutForm";
import { useLanguage } from "@/contexts/LanguageContext";

const Checkout = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { translations } = useLanguage();

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
      <div className="container py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">خرید دوره</h1>
          <p className="text-gray-600">
            فقط چند قدم تا دسترسی کامل به دوره
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

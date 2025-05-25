
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Target, Heart } from "lucide-react";

const About = () => {
  const { translations } = useLanguage();

  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">درباره آکادمی رفیعی</h1>
            <p className="text-lg text-gray-600">
              مرجع آموزش کسب و کار و توسعه شخصی در ایران
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Target className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-xl font-semibold">ماموریت ما</h3>
                </div>
                <p className="text-gray-600">
                  آموزش مهارت‌های عملی کسب و کار و توسعه شخصی به زبان ساده و کاربردی
                  برای تمام علاقه‌مندان ایرانی
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Heart className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-xl font-semibold">ارزش‌های ما</h3>
                </div>
                <p className="text-gray-600">
                  کیفیت آموزش، پشتیبانی مستمر، محتوای به‌روز و ایجاد جامعه‌ای از
                  یادگیرندگان موفق
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">+۱۰,۰۰۰</h4>
              <p className="text-gray-600">دانشجوی فعال</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">+۵۰</h4>
              <p className="text-gray-600">دوره آموزشی</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">۵ سال</h4>
              <p className="text-gray-600">تجربه آموزش</p>
            </div>
          </div>

          <Card className="bg-gray-50">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">رضا رفیعی</h3>
              <p className="text-gray-700 leading-relaxed text-center">
                مدرس و مشاور کسب و کار با بیش از ۵ سال تجربه در آموزش و راهنمایی
                هزاران نفر برای رسیدن به اهدافشان. تخصص در زمینه‌های بازاریابی دیجیتال،
                توسعه شخصی و ایجاد کسب و کارهای آنلاین.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;

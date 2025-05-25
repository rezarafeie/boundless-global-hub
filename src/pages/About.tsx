
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Award, Globe } from "lucide-react";

const About = () => {
  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">درباره ما</h1>
            <p className="text-xl text-gray-600">
              راهی به سوی موفقیت و تحقق رویاهای کسب و کار
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-6">
                <Target className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">ماموریت ما</h3>
                <p className="text-gray-600">
                  ما با هدف توانمندسازی افراد برای دستیابی به موفقیت در کسب و کار و زندگی، دوره‌های آموزشی جامع و کاربردی ارائه می‌دهیم.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Globe className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">چشم‌انداز ما</h3>
                <p className="text-gray-600">
                  تبدیل شدن به پیشرو در ارائه آموزش‌های کسب و کار و توسعه شخصی با رویکرد عملی و نتیجه‌محور.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">تیم ما</h3>
                <p className="text-gray-600">
                  تیمی از متخصصان مجرب در حوزه‌های مختلف کسب و کار، بازاریابی دیجیتال و توسعه شخصی.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Award className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">افتخارات ما</h3>
                <p className="text-gray-600">
                  موفقیت هزاران دانشجو و ایجاد تحول مثبت در زندگی و کسب و کار آنها بزرگترین افتخار ماست.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">آماده شروع هستید؟</h2>
            <p className="text-gray-600 mb-6">
              همین امروز به جمع دانشجویان موفق ما بپیوندید و مسیر خود را به سوی موفقیت آغاز کنید.
            </p>
            <a 
              href="/courses" 
              className="inline-block bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              مشاهده دوره‌ها
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;

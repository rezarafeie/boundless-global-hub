
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Award, BookOpen, Calendar, Globe, MessageSquare, Star, Target, Trophy } from "lucide-react";

const InstructorProfilePage = () => {
  return (
    <MainLayout>
      <div className="py-20 bg-black text-white relative overflow-hidden">
        {/* Animated glow background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="glow-circle glow-circle-1 animate-pulse-slow"></div>
          <div className="glow-circle glow-circle-2 animate-float"></div>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[10px] z-0"></div>
        </div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Award size={40} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">رضا رفیعی</h1>
            <p className="text-lg text-white/80">
              بنیان‌گذار آکادمی رفیعی، مشاور توسعه کسب‌وکارهای بدون مرز
            </p>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Bio Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">درباره رضا رفیعی</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                رضا رفیعی بنیان‌گذار آکادمی رفیعی، مشاور توسعه کسب‌وکارهای بدون مرز و مدرس دوره‌های تخصصی در حوزه رشد فردی، درآمد دلاری و مهارت‌های قرن ۲۱ است. او با بیش از یک دهه تجربه، به هزاران نفر در مسیر راه‌اندازی کسب‌وکارهای بین‌المللی کمک کرده است.
              </p>
              <p>
                تخصص اصلی رضا در زمینه توسعه کسب‌وکارهای بدون مرز، استراتژی‌های درآمدزایی دیجیتال و بین‌المللی‌سازی کسب‌وکارها است. او با تلفیق دانش آکادمیک و تجربه عملی در بازارهای جهانی، روش‌های کاربردی برای موفقیت در اقتصاد دیجیتال ارائه می‌دهد.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">چشم‌انداز و مأموریت</h2>
            <Card className="border-black/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Target size={24} className="text-black/70" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">ماموریت ما</h3>
                    <p className="text-muted-foreground">
                      توانمندسازی افراد برای ساخت کسب‌وکارهای بدون مرز و دستیابی به استقلال مالی در عصر دیجیتال
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Milestones */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">دستاوردها</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-black/5">
                <Calendar size={24} className="text-black/70 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">راه‌اندازی آکادمی رفیعی</h3>
                  <p className="text-sm text-muted-foreground">ایجاد پلتفرم آموزشی برای انتقال دانش و تجربه کسب‌وکارهای بدون مرز</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-black/5">
                <Trophy size={24} className="text-black/70 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">آموزش بیش از 5000 دانشجو</h3>
                  <p className="text-sm text-muted-foreground">انتقال تجربه و دانش به هزاران نفر از علاقه‌مندان به کسب‌وکارهای دیجیتال</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-black/5">
                <Globe size={24} className="text-black/70 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">راه‌اندازی پروژه بدون مرز</h3>
                  <p className="text-sm text-muted-foreground">ایجاد اکوسیستمی برای حمایت از کارآفرینان در مسیر بین‌المللی‌سازی کسب‌وکار</p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Courses */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">دوره‌های اصلی</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-black/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">برنامه بدون مرز</h3>
                      <p className="text-sm text-muted-foreground">دوره جامع کسب درآمد ارزی و راه‌اندازی کسب‌وکار بین‌المللی</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-black/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">اسباب اینستاگرام</h3>
                      <p className="text-sm text-muted-foreground">دوره تخصصی بازاریابی و کسب درآمد در اینستاگرام</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-black/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">امپراتوری متاورس</h3>
                      <p className="text-sm text-muted-foreground">دوره آشنایی با فناوری‌های نوظهور و فرصت‌های متاورس</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-black/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">درآمد غیرفعال با هوش مصنوعی</h3>
                      <p className="text-sm text-muted-foreground">آموزش استفاده از هوش مصنوعی برای ایجاد جریان درآمدی غیرفعال</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>

      <style>
        {`
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(0) translateX(20px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(20px) translateX(10px);
            opacity: 0.7;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
        }
        
        .glow-circle-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(147,112,219,0.4) 0%, rgba(147,112,219,0) 70%);
          top: -100px;
          right: 10%;
        }
        
        .glow-circle-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(65,105,225,0.3) 0%, rgba(65,105,225,0) 70%);
          bottom: -150px;
          left: 10%;
        }
        `}
      </style>
    </MainLayout>
  );
};

export default InstructorProfilePage;

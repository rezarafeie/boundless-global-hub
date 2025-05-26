
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";
import { MessageCircle, Book, GraduationCap, FileText, Check, Clock, Users, Award, Star } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";

interface FreeCourseLandingProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: "message" | "book" | "graduation" | "file";
  iframeUrl: string;
}

const FreeCourseLanding = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  iframeUrl,
}: FreeCourseLandingProps) => {
  const { translations } = useLanguage();
  const [showIframeModal, setShowIframeModal] = useState(false);

  const IconComponent = {
    message: MessageCircle,
    book: Book,
    graduation: GraduationCap,
    file: FileText
  }[iconType];

  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const updatedIframeUrl = iframeUrl.replace('rafeie.com', 'auth.rafiei.co');

  return (
    <MainLayout>
      {/* Hero Section */}
      <Hero
        title={title}
        subtitle={description}
        ctaText={translations.startFreeCourse}
        ctaLink="#register"
        backgroundType="glow"
      />
      
      {/* Countdown Timer */}
      <section className="py-8 bg-gradient-to-b from-accent/5 to-background">
        <div className="container max-w-4xl">
          <CountdownTimer endDate={endDateString} className="mx-auto" />
        </div>
      </section>

      {/* Main Registration Section */}
      <section id="register" className="py-16 bg-gradient-to-b from-accent/5 to-background">
        <div className="container max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <IconComponent size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-muted-foreground">{englishTitle}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <p>{benefitOne}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <p>{benefitTwo}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <p>دسترسی مادام‌العمر به محتوای دوره</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <p>پشتیبانی ۲۴ ساعته و دسترسی به انجمن دانشجویان</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowIframeModal(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full text-lg py-6 h-auto font-semibold"
                size="lg"
              >
                🚀 {translations.startFreeCourse}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                رایگان و بدون هیچ هزینه‌ای
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">چه چیزهایی یاد خواهید گرفت؟</h2>
            <p className="text-lg text-gray-600">مهارت‌های کلیدی که در این دوره به دست خواهید آورد</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="text-center p-6 h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Book size={24} />
                  </div>
                  <h3 className="font-bold mb-2">مبانی و اصول</h3>
                  <p className="text-sm text-gray-600">
                    درک عمیق از مفاهیم پایه و اصول حاکم بر حوزه
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="text-center p-6 h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={24} />
                  </div>
                  <h3 className="font-bold mb-2">راهکارهای عملی</h3>
                  <p className="text-sm text-gray-600">
                    ابزارها و تکنیک‌های کاربردی برای پیاده‌سازی فوری
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="text-center p-6 h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={24} />
                  </div>
                  <h3 className="font-bold mb-2">نتایج قابل اندازه‌گیری</h3>
                  <p className="text-sm text-gray-600">
                    رسیدن به اهداف مشخص و قابل ارزیابی
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">این دوره برای چه کسانی است؟</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold mb-3">✅ مناسب برای شما اگر:</h3>
              <ul className="text-right text-sm space-y-2">
                <li>• تازه‌کار در این حوزه هستید</li>
                <li>• به دنبال راه‌حل‌های سریع و عملی هستید</li>
                <li>• می‌خواهید مهارت‌های جدید کسب کنید</li>
                <li>• زمان محدودی برای یادگیری دارید</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold mb-3">❌ مناسب نیست اگر:</h3>
              <ul className="text-right text-sm space-y-2">
                <li>• به دنبال دوره‌های پیشرفته هستید</li>
                <li>• انتظار نتیجه بدون تلاش دارید</li>
                <li>• وقت کافی برای تمرین ندارید</li>
                <li>• فقط به دنبال تئوری هستید</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-black text-white">
        <div className="container max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">نظرات دانشجویان</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "این دوره نقطه شروع عالی برای من بود. حالا می‌دونم از کجا شروع کنم."
              </p>
              <p className="font-medium">علی احمدی</p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "محتوای عالی و قابل فهم. پیشنهاد می‌کنم حتماً ببینید."
              </p>
              <p className="font-medium">مریم رضایی</p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-xl">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "واقعاً کاربردی و مفید بود. انگیزه زیادی گرفتم."
              </p>
              <p className="font-medium">حسین محمودی</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">سؤالات متداول</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">آیا این دوره واقعاً رایگان است؟</h3>
              <p className="text-gray-600">بله، این دوره کاملاً رایگان است و نیازی به پرداخت هیچ هزینه‌ای ندارید.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">چقدر طول می‌کشد تا دوره را تمام کنم؟</h3>
              <p className="text-gray-600">این دوره را می‌توانید در عرض ۲-۳ ساعت مطالعه کنید، اما دسترسی مادام‌العمر دارید.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">آیا گواهینامه دریافت می‌کنم؟</h3>
              <p className="text-gray-600">بله، پس از تکمیل دوره، گواهینامه معتبر از آکادمی رفیعی دریافت خواهید کرد.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">آماده شروع هستید؟</h2>
          <p className="text-lg mb-8 opacity-90">همین الان شروع کنید و اولین قدم را در مسیر موفقیت بردارید</p>
          
          <Button 
            onClick={() => setShowIframeModal(true)}
            size="lg" 
            className="bg-white text-black hover:bg-gray-100 rounded-full px-8 text-lg py-6 h-auto font-semibold"
          >
            🚀 شروع دوره رایگان
          </Button>
        </div>
      </section>

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title={title}
        url={updatedIframeUrl}
      />
    </MainLayout>
  );
};

export default FreeCourseLanding;

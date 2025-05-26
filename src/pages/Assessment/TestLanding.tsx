
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Clock, 
  HelpCircle, 
  Users, 
  Target, 
  Award,
  CheckCircle,
  Play,
  ArrowRight
} from "lucide-react";
import IframeModal from "@/components/IframeModal";
import { motion } from "framer-motion";

// Test data with detailed information
const testData: Record<string, any> = {
  "mbti": {
    title: "تست شخصیت MBTI",
    description: "شناخت نوع شخصیت و الگوهای رفتاری شما بر اساس تئوری مایرز-بریگز",
    longDescription: "این تست بر اساس تئوری کارل یونگ و توسط کاترین بریگز و ایزابل مایرز توسعه یافته است. MBTI یکی از معتبرترین ابزارهای شناخت شخصیت در جهان محسوب می‌شود.",
    category: "شخصیت",
    duration: "۲۰ دقیقه",
    questions: 60,
    benefits: [
      "شناخت عمیق نقاط قوت و ضعف شخصیتی",
      "درک بهتر نحوه تعامل با دیگران",
      "انتخاب مسیر شغلی مناسب",
      "بهبود روابط بین فردی",
      "افزایش اعتماد به نفس"
    ],
    features: [
      "تحلیل ۱۶ نوع شخصیت",
      "گزارش جامع و تفصیلی",
      "توصیه‌های شغلی",
      "راهنمای تعامل اجتماعی"
    ],
    whoFor: [
      "افرادی که می‌خواهند خود را بهتر بشناسند",
      "دانشجویان در حال انتخاب رشته",
      "حرفه‌ای‌ها برای توسعه مهارت‌های کاری",
      "مدیران برای بهبود مدیریت تیم"
    ]
  },
  "disc": {
    title: "تست DISC",
    description: "ارزیابی سبک رفتاری و نحوه تعامل شما با دیگران",
    longDescription: "مدل DISC یکی از ابزارهای محبوب برای درک انواع شخصیت و سبک‌های ارتباطی است که در محیط‌های کاری و شخصی بسیار مفید است.",
    category: "شخصیت",
    duration: "۱۵ دقیقه", 
    questions: 40,
    benefits: [
      "شناخت سبک رهبری طبیعی شما",
      "بهبود مهارت‌های ارتباطی",
      "درک تفاوت‌های فردی در تیم",
      "افزایش اثربخشی در کار گروهی"
    ],
    features: [
      "تحلیل ۴ سبک اصلی رفتاری",
      "راهنمای کاربردی برای محیط کار",
      "نکات بهبود ارتباط",
      "استراتژی‌های مدیریت استرس"
    ],
    whoFor: [
      "مدیران و رهبران تیم",
      "فروشندگان و متخصصان ارتباط",
      "افراد شاغل در مشاغل تیمی",
      "کسانی که می‌خواهند مهارت‌های اجتماعی خود را بهبود دهند"
    ]
  }
  // Add more test data as needed...
};

const TestLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testInfo = slug ? testData[slug] : null;

  if (!testInfo) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">تست پیدا نشد</h1>
          <Button onClick={() => navigate('/assessment')}>
            بازگشت به مرکز ارزیابی
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleStartTest = () => {
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="container max-w-4xl mx-auto">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Brain size={32} className="text-blue-600" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {testInfo.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {testInfo.description}
              </p>

              {/* Test Stats */}
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={20} />
                  <span>{testInfo.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <HelpCircle size={20} />
                  <span>{testInfo.questions} سؤال</span>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  {testInfo.category}
                </Badge>
              </div>
              
              <Button 
                onClick={handleStartTest}
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="mr-2" size={20} />
                شروع تست
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Detailed Information */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* About This Test */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="h-full border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                      <Target className="mr-3 text-blue-600" size={24} />
                      درباره این تست
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {testInfo.longDescription}
                    </p>
                    
                    <h3 className="font-semibold mb-3">مزایای شرکت در این تست:</h3>
                    <div className="space-y-2">
                      {testInfo.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Features & Who It's For */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                {/* Features */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                      <Award className="mr-3 text-green-600" size={24} />
                      ویژگی‌های تست
                    </h2>
                    <div className="space-y-3">
                      {testInfo.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <ArrowRight className="text-blue-500 mr-2" size={16} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Who It's For */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                      <Users className="mr-3 text-purple-600" size={24} />
                      این تست برای چه کسانی است؟
                    </h2>
                    <div className="space-y-3">
                      {testInfo.whoFor.map((person: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="text-purple-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm">{person}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <motion.section 
          className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              آماده کشف خودتان هستید؟
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              همین الان شروع کنید و نتایج شگفت‌انگیز را ببینید
            </p>
            <Button 
              onClick={handleStartTest}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-semibold"
            >
              <Play className="mr-2" size={20} />
              شروع تست {testInfo.title}
            </Button>
          </div>
        </motion.section>
      </div>

      {/* Test Modal */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={testInfo.title}
        url={`https://auth.rafiei.co/test/${slug}`}
        showCloseButton={true}
      />
    </MainLayout>
  );
};

export default TestLanding;

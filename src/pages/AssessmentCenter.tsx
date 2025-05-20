
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/Auth/AuthModal";
import { Brain, Briefcase, HeartPulse, UserCircle, Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface TestCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  duration?: string;
  questions?: number;
}

const AssessmentCenter = () => {
  const { translations } = useLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("");

  const personalityTests = [
    {
      title: "MBTI (مایرز بریگز)",
      description: "تست شخصیت MBTI به شما کمک می‌کند تا نوع شخصیتی خود را شناسایی کنید و بفهمید چگونه با دنیای اطراف خود تعامل دارید.",
      icon: <UserCircle size={36} className="text-purple-500" />,
      category: translations.personalityTests,
      duration: "۱۵-۲۰ دقیقه",
      questions: 70
    },
    {
      title: "انیاگرام",
      description: "انیاگرام یک مدل شخصیتی است که ۹ تیپ شخصیتی متمایز را توصیف می‌کند و به شما کمک می‌کند انگیزه‌های درونی خود را بشناسید.",
      icon: <UserCircle size={36} className="text-indigo-500" />,
      category: translations.personalityTests,
      duration: "۱۰-۱۵ دقیقه",
      questions: 45
    }
  ];

  const intelligenceTests = [
    {
      title: "IQ کلاسیک",
      description: "تست هوش کلاسیک برای اندازه‌گیری توانایی‌های شناختی، منطق و حل مسئله.",
      icon: <Brain size={36} className="text-blue-500" />,
      category: translations.intelligenceTests,
      duration: "۳۰-۴۵ دقیقه",
      questions: 50
    },
    {
      title: "هوش چندگانه گاردنر",
      description: "این ارزیابی انواع مختلف هوش شما را مانند هوش ریاضی، زبانی، موسیقیایی و فضایی اندازه‌گیری می‌کند.",
      icon: <Brain size={36} className="text-cyan-500" />,
      category: translations.intelligenceTests,
      duration: "۲۰-۲۵ دقیقه",
      questions: 65
    }
  ];

  const careerTests = [
    {
      title: "آزمون استعداد شغلی",
      description: "به شما کمک می‌کند مشاغلی که با مهارت‌ها، علایق و شخصیت شما سازگارترند را شناسایی کنید.",
      icon: <Briefcase size={36} className="text-emerald-500" />,
      category: translations.careerTests,
      duration: "۲۵-۳۰ دقیقه",
      questions: 60
    },
    {
      title: "ارزیابی مهارت‌های کارآفرینی",
      description: "میزان آمادگی شما برای راه‌اندازی کسب و کار و نقاط قوت و ضعف کارآفرینی شما را ارزیابی می‌کند.",
      icon: <Briefcase size={36} className="text-green-500" />,
      category: translations.careerTests,
      duration: "۱۵-۲۰ دقیقه",
      questions: 40
    }
  ];

  const emotionTests = [
    {
      title: "هوش هیجانی (EQ)",
      description: "این آزمون توانایی شما در درک و مدیریت احساسات خود و دیگران را اندازه‌گیری می‌کند.",
      icon: <HeartPulse size={36} className="text-rose-500" />,
      category: translations.emotionTests,
      duration: "۲۰-۲۵ دقیقه",
      questions: 55
    },
    {
      title: "مدیریت استرس",
      description: "نحوه واکنش شما به استرس و استراتژی‌های مقابله‌ای شما را ارزیابی می‌کند.",
      icon: <HeartPulse size={36} className="text-pink-500" />,
      category: translations.emotionTests,
      duration: "۱۰-۱۵ دقیقه",
      questions: 35
    }
  ];

  const handleTestClick = (title: string) => {
    setSelectedTest(title);
    setAuthModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const TestCard = ({ title, description, icon, category, duration, questions }: TestCardProps) => (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 bg-white h-full flex flex-col">
        <CardContent className="p-6 flex-grow">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-black/5 flex-shrink-0">
              {icon}
            </div>
            <div>
              <Badge className="mb-2">{category}</Badge>
              <h3 className="text-xl font-bold text-black">{title}</h3>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          <div className="flex justify-between text-sm text-gray-500 mt-auto">
            {duration && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>{duration}</span>
              </div>
            )}
            {questions && (
              <div className="flex items-center">
                <BarChart3 size={14} className="mr-1" />
                <span>{questions} سوال</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-6 pt-0">
          <Button 
            className="w-full bg-black text-white hover:bg-black/90 rounded-full"
            onClick={() => handleTestClick(title)}
          >
            {translations.startTest}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <MainLayout>
      <Hero
        title={translations.assessmentCenterTitle}
        subtitle={translations.assessmentCenterDesc}
        ctaText={translations.startTest}
        ctaLink="#tests"
        backgroundType="glow"
      />
      
      <section id="tests" className="py-16">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{translations.personalityTests}</h2>
            <p className="text-gray-600">کشف کنید چه شخصیتی دارید و چگونه با دنیای اطراف خود تعامل می‌کنید.</p>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {personalityTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  icon={test.icon}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </motion.div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{translations.intelligenceTests}</h2>
            <p className="text-gray-600">توانایی‌های شناختی خود را بسنجید و نقاط قوت هوشی خود را کشف کنید.</p>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {intelligenceTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  icon={test.icon}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </motion.div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{translations.careerTests}</h2>
            <p className="text-gray-600">مسیر شغلی مناسب خود را بر اساس مهارت‌ها، علایق و شخصیت خود پیدا کنید.</p>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {careerTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  icon={test.icon}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </motion.div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">{translations.emotionTests}</h2>
            <p className="text-gray-600">هوش هیجانی خود را ارزیابی کنید و یاد بگیرید چگونه احساسات خود و دیگران را بهتر درک کنید.</p>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {emotionTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  icon={test.icon}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        courseTitle={selectedTest}
        isPaid={true}
      />
    </MainLayout>
  );
};

export default AssessmentCenter;

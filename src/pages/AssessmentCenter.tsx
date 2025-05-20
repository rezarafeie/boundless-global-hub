
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/Auth/AuthModal";
import { useState } from "react";

interface TestCardProps {
  title: string;
  description: string;
  image: string;
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
      image: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80",
      category: translations.personalityTests,
      duration: "۱۵-۲۰ دقیقه",
      questions: 70
    },
    {
      title: "انیاگرام",
      description: "انیاگرام یک مدل شخصیتی است که ۹ تیپ شخصیتی متمایز را توصیف می‌کند و به شما کمک می‌کند انگیزه‌های درونی خود را بشناسید.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
      category: translations.personalityTests,
      duration: "۱۰-۱۵ دقیقه",
      questions: 45
    }
  ];

  const intelligenceTests = [
    {
      title: "IQ کلاسیک",
      description: "تست هوش کلاسیک برای اندازه‌گیری توانایی‌های شناختی، منطق و حل مسئله.",
      image: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=800&q=80",
      category: translations.intelligenceTests,
      duration: "۳۰-۴۵ دقیقه",
      questions: 50
    },
    {
      title: "هوش چندگانه گاردنر",
      description: "این ارزیابی انواع مختلف هوش شما را مانند هوش ریاضی، زبانی، موسیقیایی و فضایی اندازه‌گیری می‌کند.",
      image: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?auto=format&fit=crop&w=800&q=80",
      category: translations.intelligenceTests,
      duration: "۲۰-۲۵ دقیقه",
      questions: 65
    }
  ];

  const careerTests = [
    {
      title: "آزمون استعداد شغلی",
      description: "به شما کمک می‌کند مشاغلی که با مهارت‌ها، علایق و شخصیت شما سازگارترند را شناسایی کنید.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      category: translations.careerTests,
      duration: "۲۵-۳۰ دقیقه",
      questions: 60
    },
    {
      title: "ارزیابی مهارت‌های کارآفرینی",
      description: "میزان آمادگی شما برای راه‌اندازی کسب و کار و نقاط قوت و ضعف کارآفرینی شما را ارزیابی می‌کند.",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80",
      category: translations.careerTests,
      duration: "۱۵-۲۰ دقیقه",
      questions: 40
    }
  ];

  const emotionTests = [
    {
      title: "هوش هیجانی (EQ)",
      description: "این آزمون توانایی شما در درک و مدیریت احساسات خود و دیگران را اندازه‌گیری می‌کند.",
      image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=800&q=80",
      category: translations.emotionTests,
      duration: "۲۰-۲۵ دقیقه",
      questions: 55
    },
    {
      title: "مدیریت استرس",
      description: "نحوه واکنش شما به استرس و استراتژی‌های مقابله‌ای شما را ارزیابی می‌کند.",
      image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?auto=format&fit=crop&w=800&q=80",
      category: translations.emotionTests,
      duration: "۱۰-۱۵ دقیقه",
      questions: 35
    }
  ];

  const handleTestClick = (title: string) => {
    setSelectedTest(title);
    setAuthModalOpen(true);
  };

  const TestCard = ({ title, description, image, category, duration, questions }: TestCardProps) => (
    <Card className="overflow-hidden border border-black/5 hover:border-black/20 transition-all shadow-sm hover:shadow-md hover:translate-y-[-2px] bg-white">
      <div className="overflow-hidden aspect-video relative">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent flex items-end">
          <div className="p-6">
            <Badge className="mb-2 bg-white text-black">{category}</Badge>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        <div className="flex justify-between text-sm text-gray-500">
          {duration && <span>زمان: {duration}</span>}
          {questions && <span>سوالات: {questions}</span>}
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
  );

  return (
    <MainLayout>
      <Hero
        title={translations.assessmentCenterTitle}
        subtitle={translations.assessmentCenterDesc}
        ctaText={translations.startTest}
        ctaLink="#tests"
        backgroundType="gradient"
      />
      
      <section id="tests" className="py-16">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{translations.personalityTests}</h2>
            <p className="text-gray-600">کشف کنید چه شخصیتی دارید و چگونه با دنیای اطراف خود تعامل می‌کنید.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {personalityTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  image={test.image}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{translations.intelligenceTests}</h2>
            <p className="text-gray-600">توانایی‌های شناختی خود را بسنجید و نقاط قوت هوشی خود را کشف کنید.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {intelligenceTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  image={test.image}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{translations.careerTests}</h2>
            <p className="text-gray-600">مسیر شغلی مناسب خود را بر اساس مهارت‌ها، علایق و شخصیت خود پیدا کنید.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {careerTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  image={test.image}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">{translations.emotionTests}</h2>
            <p className="text-gray-600">هوش هیجانی خود را ارزیابی کنید و یاد بگیرید چگونه احساسات خود و دیگران را بهتر درک کنید.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {emotionTests.map((test, index) => (
                <TestCard
                  key={index}
                  title={test.title}
                  description={test.description}
                  image={test.image}
                  category={test.category}
                  duration={test.duration}
                  questions={test.questions}
                />
              ))}
            </div>
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


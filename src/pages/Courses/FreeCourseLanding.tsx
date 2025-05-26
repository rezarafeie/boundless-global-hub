
import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Clock, 
  Users, 
  Award, 
  Star, 
  CheckCircle, 
  MessageCircle, 
  BookOpen, 
  GraduationCap,
  Zap
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import IframeModal from "@/components/IframeModal";

interface FreeCourseLandingProps {
  title: string;
  englishTitle: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: "book" | "graduation" | "message";
  iframeUrl: string;
}

const FreeCourseLanding: React.FC<FreeCourseLandingProps> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  iframeUrl
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Set countdown target for 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const endDateString = targetDate.toISOString();

  const getIcon = () => {
    switch (iconType) {
      case "book":
        return <BookOpen size={64} className="text-blue-500" />;
      case "graduation":
        return <GraduationCap size={64} className="text-green-500" />;
      case "message":
        return <MessageCircle size={64} className="text-purple-500" />;
      default:
        return <BookOpen size={64} className="text-blue-500" />;
    }
  };

  const handleStartCourse = () => {
    setIsModalOpen(true);
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
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        <div className="container max-w-4xl mx-auto relative z-10">
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex justify-center mb-8"
              variants={itemVariants}
            >
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                {getIcon()}
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-4"
              variants={itemVariants}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-2"
              variants={itemVariants}
            >
              {englishTitle}
            </motion.p>
            
            <motion.p 
              className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              {description}
            </motion.p>
            
            <motion.div variants={itemVariants}>
              <Button 
                onClick={handleStartCourse}
                size="lg"
                className="bg-black text-white hover:bg-gray-800 rounded-full px-12 py-6 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Play className="mr-3" size={24} />
                شروع دوره رایگان
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="py-8 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <CountdownTimer endDate={endDateString} />
        </div>
      </section>

      {/* Course Benefits */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              چه چیزی یاد خواهید گرفت؟
            </h2>
            <p className="text-lg text-gray-600">
              این دوره رایگان شامل محتوای ارزشمند و کاربردی است
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        مزیت اول
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefitOne}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="text-blue-600" size={24} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        مزیت دوم
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefitTwo}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Course Details */}
      <motion.section 
        className="py-16 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={itemVariants}>
              <Card className="text-center h-full border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="text-purple-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    دسترسی آزاد
                  </h3>
                  <p className="text-gray-600">
                    به محتوای دوره در هر زمان و از هر مکان دسترسی داشته باشید
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="text-center h-full border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    انجمن دانشجویان
                  </h3>
                  <p className="text-gray-600">
                    به جامعه بزرگ دانشجویان بپیوندید و تجربیات خود را به اشتراک بگذارید
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="text-center h-full border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    گواهی تکمیل
                  </h3>
                  <p className="text-gray-600">
                    پس از تکمیل دوره، گواهی معتبر دریافت کنید
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-6xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-12"
            variants={itemVariants}
          >
            نظرات دانشجویان
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={20} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic">
                      "این دوره واقعاً عالی بود و کمک زیادی به رشد حرفه‌ای من کرد."
                    </p>
                    <div className="font-semibold text-gray-900">
                      دانشجوی راضی {i}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="py-16 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              سوالات متداول
            </h2>
            <p className="text-lg text-gray-600">
              پاسخ سوالات رایج در مورد این دوره
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {[
              {
                question: "آیا این دوره واقعاً رایگان است؟",
                answer: "بله، این دوره کاملاً رایگان است و هیچ هزینه‌ای دریافت نمی‌شود."
              },
              {
                question: "چقدر زمان برای تکمیل نیاز است؟",
                answer: "بسته به سرعت یادگیری شما، معمولاً بین ۲ تا ۴ ساعت زمان نیاز است."
              },
              {
                question: "آیا پشتیبانی دارد؟",
                answer: "بله، از طریق انجمن دانشجویان و سیستم پشتیبانی می‌توانید سوالات خود را مطرح کنید."
              }
            ].map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section 
        className="py-16 bg-black text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl font-bold mb-6"
            variants={itemVariants}
          >
            آماده شروع هستید؟
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 mb-8"
            variants={itemVariants}
          >
            همین الان شروع کنید و مسیر یادگیری خود را آغاز کنید
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button 
              onClick={handleStartCourse}
              size="lg"
              className="bg-white text-black hover:bg-gray-100 rounded-full px-12 py-6 text-xl font-semibold"
            >
              <Play className="mr-3" size={24} />
              شروع دوره رایگان
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Course Modal */}
      <IframeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        url={iframeUrl}
      />
    </MainLayout>
  );
};

export default FreeCourseLanding;

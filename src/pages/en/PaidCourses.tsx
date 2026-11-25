import React, { useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import Hero from "@/components/Hero";
import CourseCard from "@/components/CourseCard";
import SectionTitle from "@/components/SectionTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import IframeModal from "@/components/IframeModal";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, Award, BarChart3, Gift, Star, CheckCircle, Target, TrendingUp, Zap } from "lucide-react";
import { courseImage, courseImagePosition } from "@/lib/academyImagery";

const PaidCourses = () => {
  const { translations } = useLanguage();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showIframeModal, setShowIframeModal] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");

  const courses = [
    {
      title: translations.boundlessProgram,
      description: translations.boundlessProgramDesc,
      benefits: translations.boundlessBenefits,
      outcome: translations.boundlessOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
      category: "business",
      duration: "6 months",
      modules: 12,
      students: 450,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=5311",
      features: [
        "100+ hours of premium content",
        "180 daily transformational tasks", 
        "Personal business coaching sessions",
        "Psychological mindset coaching",
        "Weekly live mentoring sessions",
        "Exclusive private community access",
        "Lifetime access to all materials"
      ],
      bonuses: [
        "🎁 Digital Business Toolkit ($500 value)",
        "📚 Exclusive Success Mindset E-book",
        "🎯 Personal Action Plan Template", 
        "💬 1-on-1 Strategy Session with Reza Rafiei"
      ],
      testimonials: [
        {
          name: "احمد کریمی", 
          text: "این دوره زندگی من را کاملاً تغییر داد. از یک کارمند معمولی به کارآفرین موفق تبدیل شدم."
        },
        {
          name: "مریم احمدی",
          text: "بهترین سرمایه‌گذاری که تا به حال کردم. درآمدم ۳ برابر شده و اعتماد به نفسم خیلی بالا رفته."
        }
      ],
      whoFor: [
        "کارآفرینان تازه‌کار که می‌خواهند کسب‌وکار موفقی راه‌اندازی کنند",
        "افراد شاغل که به دنبال درآمد اضافی و استقلال مالی هستند", 
        "کسانی که می‌خواهند ذهنیت موفقیت را در خود پرورش دهند",
        "افرادی که به دنبال تغییر شغل و مسیر زندگی هستند"
      ]
    },
    {
      title: translations.instagramEssentials,
      description: translations.instagramEssentialsDesc,
      benefits: translations.instagramBenefits,
      outcome: translations.instagramOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      category: "social",
      duration: "4 weeks",
      modules: 6,
      students: 850,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=5089",
      features: [
        "Advanced content creation strategies",
        "Professional ad campaign setup & optimization",
        "Complete branding & visual identity guide",
        "Proven sales funnel techniques",
        "Analytics mastery & growth hacking",
        "Real case studies from successful accounts",
        "Ready-to-use templates & design assets"
      ],
      bonuses: [
        "🎨 Premium Instagram Templates Pack ($200 value)",
        "📈 Growth Hacking Checklist",
        "💰 Monetization Strategy Guide",
        "🎬 Behind-the-Scenes Video Creation Course"
      ],
      testimonials: [
        {
          name: "سارا موسوی",
          text: "فالوورهای من از ۵۰۰ به ۲۰ هزار نفر رسید و درآمد ماهانه‌ام از اینستاگرام ۵ میلیون تومان شده."
        },
        {
          name: "علی رضایی", 
          text: "با این دوره یاد گرفتم چطور از اینستاگرام پول درآوری کنم. حالا کسب‌وکارم آنلاین خیلی موفق شده."
        }
      ],
      whoFor: [
        "کسب‌وکارهای کوچک که می‌خواهند در اینستاگرام حضور قوی داشته باشند",
        "اینفلوئنسرهای تازه‌کار که به دنبال رشد سریع و پایدار هستند",
        "فریلنسرها و متخصصان بازاریابی دیجیتال",
        "افرادی که می‌خواهند از اینستاگرام درآمدزایی کنند"
      ]
    },
    {
      title: translations.wealthCourse,
      description: translations.wealthCourseDesc,
      benefits: translations.wealthBenefits,
      outcome: translations.wealthOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      category: "finance",
      duration: "8 weeks",
      modules: 8,
      students: 620,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=148",
      features: [
        "Comprehensive financial planning blueprint",
        "Advanced investment strategies & portfolio management",
        "Wealth mindset transformation program",
        "Real estate & asset acquisition guide",
        "Risk management & insurance optimization",
        "Tax optimization & legal structure planning",
        "Retirement & legacy wealth planning"
      ],
      bonuses: [
        "💰 Personal Financial Assessment Tool ($300 value)",
        "📊 Investment Tracking Spreadsheet",
        "🏠 Real Estate Investment Calculator",
        "📞 Monthly Q&A Sessions with Financial Experts"
      ],
      testimonials: [
        {
          name: "محمد صادقی",
          text: "پورتفوی سرمایه‌گذاری من ۲ برابر شده و حالا درآمد غیرفعال عالی دارم. واقعاً ارزش داشت."
        },
        {
          name: "زهرا حسینی",
          text: "یاد گرفتم چطور پولم را درست مدیریت کنم و سرمایه‌گذاری کنم. امنیت مالی‌ام خیلی بهتر شده."
        }
      ],
      whoFor: [
        "افرادی که می‌خواهند ثروت بسازند و آزادی مالی کسب کنند",
        "سرمایه‌گذاران مبتدی که به دنبال راهنمایی حرفه‌ای هستند",
        "کسانی که درآمد خوبی دارند اما نمی‌دانند چطور پس‌انداز کنند",
        "افراد نزدیک به بازنشستگی که نگران آینده مالی‌شان هستند"
      ]
    },
    {
      title: translations.metaverseEmpire,
      description: translations.metaverseEmpireDesc,
      benefits: translations.metaverseBenefits,
      outcome: translations.metaverseOutcome,
      isPaid: true,
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80",
      category: "tech",
      duration: "10 weeks",
      modules: 10,
      students: 380,
      cartUrl: "https://auth.rafiei.co/?add-to-cart=145",
      features: [
        "Complete Web3 & blockchain fundamentals",
        "NFT creation, minting & trading mastery",
        "Play-to-Earn gaming strategies & optimization",
        "Cryptocurrency investment & DeFi protocols",
        "Metaverse business models & virtual real estate",
        "Digital asset security & wallet management",
        "Future trends analysis & early adoption strategies"
      ],
      bonuses: [
        "🎮 Exclusive Gaming Guild Access ($400 value)",
        "🎨 NFT Creation Software & Tools",
        "💎 Crypto Trading Signals (3 months free)",
        "🌐 Virtual Land Investment Guide"
      ],
      testimonials: [
        {
          name: "امیر رستمی",
          text: "از این دوره یاد گرفتم چطور در دنیای متاورس کسب‌وکار کنم. درآمدم از NFT و گیمینگ خیلی خوبه."
        },
        {
          name: "نگار فرهادی",
          text: "اولین NFT من رو ۱۰ برابر قیمت فروختم! این دوره دنیای جدیدی رو بهم نشون داد."
        }
      ],
      whoFor: [
        "علاقه‌مندان به تکنولوژی و نوآوری‌های دیجیتال",
        "گیمرها و علاقه‌مندان به بازی‌های آنلاین",
        "سرمایه‌گذاران جوان که به دنبال فرصت‌های جدید هستند",
        "هنرمندان و خلاقان که می‌خواهند آثارشان را دیجیتالی کنند"
      ]
    },
  ];

  const filteredCourses = activeTab === "all" 
    ? courses 
    : courses.filter(course => course.category === activeTab);

  const handleCourseClick = (title: string, cartUrl: string) => {
    setSelectedCourse(title);
    setIframeUrl(cartUrl);
    setShowIframeModal(true);
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

  const childVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <MainLayout>
      <Hero
        title={translations.paidCoursesTitle}
        subtitle={translations.paidCoursesSubtitle}
        ctaText={translations.callToAction}
        ctaLink="#courses"
      />
      
      <section id="courses" className="py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent z-0"></div>
        <div className="absolute top-1/3 right-0 w-1/3 h-2/3 bg-gradient-to-l from-secondary/10 to-transparent z-0"></div>
        
        <div className="container relative z-10">
          <SectionTitle
            title={translations.coursesTitle}
            subtitle={translations.coursesSubtitle}
          />
          
          <Tabs defaultValue="all" className="w-full mb-8">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-5">
              <TabsTrigger value="all" onClick={() => setActiveTab("all")}>All</TabsTrigger>
              <TabsTrigger value="business" onClick={() => setActiveTab("business")}>Business</TabsTrigger>
              <TabsTrigger value="social" onClick={() => setActiveTab("social")}>Social</TabsTrigger>
              <TabsTrigger value="finance" onClick={() => setActiveTab("finance")}>Finance</TabsTrigger>
              <TabsTrigger value="tech" onClick={() => setActiveTab("tech")}>Tech</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <motion.div 
            className="space-y-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeTab}
          >
            {filteredCourses.map((course, index) => (
              <motion.div key={index} variants={childVariants}>
                <div 
                  className="group cursor-pointer" 
                  onClick={() => handleCourseClick(course.title, course.cartUrl)}
                >
                  <div className="bg-background border border-primary/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-primary/30">
                    
                    {/* Course Header */}
                    <div className="aspect-[4/3] relative">
                      <img 
                        src={courseImage("", course.title)}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: courseImagePosition("", course.title) }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                        <div className="p-6">
                          <h3 className="text-3xl font-bold text-white mb-2">{course.title}</h3>
                          <div className="flex items-center gap-4 text-white/80">
                            <span className="flex items-center gap-1">
                              <Calendar size={16} />
                              {course.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={16} />
                              {course.students}+ students
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      
                      {/* Course Description */}
                      <div>
                        <p className="text-lg text-muted-foreground leading-relaxed">{course.description}</p>
                      </div>

                      {/* Enhanced Features Grid */}
                      <div>
                        <h4 className="font-bold text-xl mb-4 flex items-center">
                          <Award size={20} className="mr-2 text-primary" />
                          What You'll Get:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.features.map((feature, i) => (
                            <div key={i} className="flex items-start bg-gray-50 p-3 rounded-lg">
                              <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                              <span className="text-sm font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exclusive Bonuses */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                        <h4 className="font-bold text-xl mb-4 flex items-center text-orange-800">
                          <Gift size={20} className="mr-2" />
                          Exclusive Bonuses (Limited Time):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.bonuses.map((bonus, i) => (
                            <div key={i} className="flex items-start">
                              <Zap className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                              <span className="text-sm font-medium text-orange-800">{bonus}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Who This Course Is For */}
                      <div>
                        <h4 className="font-bold text-xl mb-4 flex items-center">
                          <Target size={20} className="mr-2 text-purple-600" />
                          Perfect For:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.whoFor.map((person, i) => (
                            <div key={i} className="flex items-start bg-purple-50 p-3 rounded-lg">
                              <TrendingUp className="text-purple-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                              <span className="text-sm">{person}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Student Testimonials */}
                      <div>
                        <h4 className="font-bold text-xl mb-4 flex items-center">
                          <Star size={20} className="mr-2 text-yellow-500" />
                          Student Success Stories:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {course.testimonials.map((testimonial, i) => (
                            <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex mb-2">
                                {[...Array(5)].map((_, j) => (
                                  <Star key={j} size={16} className="text-yellow-400 fill-current" />
                                ))}
                              </div>
                              <p className="text-sm italic mb-3 text-gray-700">"{testimonial.text}"</p>
                              <p className="font-semibold text-sm text-blue-800">- {testimonial.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Outcome */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                        <h4 className="font-bold text-xl mb-3 text-green-800">Your Transformation:</h4>
                        <p className="text-green-700 font-medium">{course.outcome}</p>
                      </div>
                      
                      {/* Enhanced CTA */}
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-lg text-center">
                        <h4 className="text-2xl font-bold mb-2">Ready to Transform Your Life?</h4>
                        <p className="font-medium mb-4 text-gray-600">Join thousands of successful students today</p>
                        <div className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                          🚀 Enroll Now & Start Your Journey
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <IframeModal
        isOpen={showIframeModal}
        onClose={() => setShowIframeModal(false)}
        title={selectedCourse || "Course Purchase"}
        url={iframeUrl}
      />
    </MainLayout>
  );
};

export default PaidCourses;

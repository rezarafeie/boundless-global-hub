
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Users, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import EnhancedCountdownTimer from './EnhancedCountdownTimer';
import RandomHeadlineGenerator from './RandomHeadlineGenerator';

const Hero = () => {
  const { language, translations } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const stats = [
    { 
      icon: Users, 
      number: "10000+", 
      label: language === 'fa' ? "دانش‌پذیر فعال" : "Active Students",
      color: "text-blue-500"
    },
    { 
      icon: Award, 
      number: "50+", 
      label: language === 'fa' ? "دوره تخصصی" : "Expert Courses",
      color: "text-green-500"
    },
    { 
      icon: TrendingUp, 
      number: "95%", 
      label: language === 'fa' ? "رضایت دانش‌پذیران" : "Student Satisfaction",
      color: "text-purple-500"
    }
  ];

  // Set countdown end date (example: 30 days from now)
  const countdownEndDate = new Date();
  countdownEndDate.setDate(countdownEndDate.getDate() + 30);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-right space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-800/20 rounded-full px-6 py-3"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {language === 'fa' ? '🚀 آموزش آنلاین نسل جدید' : '🚀 Next-Gen Online Learning'}
                </span>
              </motion.div>

              {/* Main Heading */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                >
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {language === 'fa' ? 'آکادمی رفیعی' : translations.hero?.title || translations.heroTitle || 'Rafiei Academy'}
                  </span>
                </motion.h1>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <RandomHeadlineGenerator />
                </motion.div>
              </div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                {language === 'fa' ? 'با هوش مصنوعی زندگی‌تان را تغیی­ر دهید' : translations.hero?.subtitle || translations.heroSubtitle || 'Transform your life with AI'}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to="/courses">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                  >
                    {language === 'fa' ? 'مشاهده دوره‌ها' : translations.hero?.cta?.primary || translations.heroCtaMain || 'View Courses'}
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <Link to="/course/free-start">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 hover:bg-white/90 dark:hover:bg-slate-800/90 w-full sm:w-auto"
                  >
                    <Play className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    {language === 'fa' ? 'شروع رایگان' : translations.hero?.cta?.secondary || translations.heroCtaSecondary || 'Start Free'}
                  </Button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="grid grid-cols-3 gap-8 pt-8"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`inline-flex p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 mb-2`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">
                      {stat.number}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <EnhancedCountdownTimer 
                  endDate={countdownEndDate.toISOString()}
                  label={language === 'fa' ? 'تا پایان ثبت‌نام' : 'Registration Ends In'}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Users, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const WebinarBanner = () => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  
  // Set webinar date here (example: 2 weeks from now)
  const webinarDate = new Date();
  webinarDate.setDate(webinarDate.getDate() + 14);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = webinarDate.getTime();
      const difference = end - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-purple-50 via-pink-50/50 to-orange-50/30 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-orange-400/20 to-pink-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <CardContent className="p-0">
              <div className="relative">
                {/* Top accent gradient */}
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
                
                <div className="p-6 md:p-10">
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Content */}
                    <div className="flex-1 text-center lg:text-right">
                      {/* Badge */}
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-full px-4 py-2 mb-4"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                          رویداد ویژه
                        </span>
                      </motion.div>
                      
                      {/* Title */}
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                          وبینار بدون مرز
                        </span>
                      </h2>
                      
                      <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        🚀 یک سفر تحول‌آفرین به دنیای کسب‌وکار بین‌المللی
                        <br />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          فرصتی استثنایی برای یادگیری از بهترین‌ها و شروع مسیر موفقیت
                        </span>
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                          <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">آنلاین و زنده</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 dark:bg-pink-950/50 rounded-lg border border-pink-200/50 dark:border-pink-800/50">
                          <Users className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">محدود به 100 نفر</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/50 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">رایگان</span>
                        </div>
                      </div>

                      {/* Countdown Timer */}
                      {timeLeft && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="mb-6"
                        >
                          <div className="inline-flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              زمان باقی‌مانده تا شروع:
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto lg:mx-0">
                            {[
                              { value: timeLeft.days, label: 'روز' },
                              { value: timeLeft.hours, label: 'ساعت' },
                              { value: timeLeft.minutes, label: 'دقیقه' },
                              { value: timeLeft.seconds, label: 'ثانیه' }
                            ].map((item, index) => (
                              <motion.div
                                key={item.label}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.5, delay: index * 0.1, repeat: Infinity, repeatDelay: 3 }}
                                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 shadow-lg"
                              >
                                <div className="text-2xl md:text-3xl font-bold text-white">
                                  {String(item.value).padStart(2, '0')}
                                </div>
                                <div className="text-xs text-white/80">{item.label}</div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* CTA Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                        <Button 
                          asChild 
                          size="lg" 
                          className="group bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                        >
                          <Link to="/webinar/boundless" className="flex items-center gap-2">
                            <span className="font-bold">ثبت‌نام رایگان</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          variant="outline" 
                          size="lg"
                          className="border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
                        >
                          <Link to="/webinar/boundless" className="flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            <span className="font-semibold">اطلاعات بیشتر</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Visual Elements */}
                    <div className="flex-shrink-0">
                      <motion.div
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="relative"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { icon: Video, color: 'purple', delay: 0 },
                            { icon: Users, color: 'pink', delay: 0.2 },
                            { icon: Calendar, color: 'orange', delay: 0.4 },
                            { icon: Sparkles, color: 'purple', delay: 0.6 }
                          ].map((item, index) => (
                            <motion.div
                              key={index}
                              animate={{ 
                                y: [0, -10, 0],
                                rotate: [0, 10, -10, 0]
                              }}
                              transition={{ 
                                duration: 3, 
                                repeat: Infinity,
                                delay: item.delay
                              }}
                              className={`w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-${item.color}-100 to-${item.color}-200 dark:from-${item.color}-900/50 dark:to-${item.color}-800/50 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
                            >
                              <item.icon className={`w-8 h-8 md:w-10 md:h-10 text-${item.color}-600 dark:text-${item.color}-400`} />
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Floating particles */}
                        <motion.div
                          animate={{ 
                            y: [0, -20, 0],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-sm"
                        />
                        <motion.div
                          animate={{ 
                            y: [0, -15, 0],
                            opacity: [0.3, 0.7, 0.3]
                          }}
                          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                          className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full blur-sm"
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default WebinarBanner;

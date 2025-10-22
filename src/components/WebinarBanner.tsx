import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Users, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const WebinarBanner = () => {
  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-blue-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-800/50 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
            <CardContent className="p-0">
              <div className="relative">
                {/* Top accent gradient */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                
                <div className="p-6 md:p-10">
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Content */}
                    <div className="flex-1 text-center lg:text-right">
                      {/* Badge */}
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 rounded-full px-4 py-2 mb-4"
                      >
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                          دوره رایگان
                        </span>
                      </motion.div>
                      
                      {/* Title */}
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                          زندگی هوشمند با AI
                        </span>
                      </h2>
                      
                      <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        🤖 ۲ جلسه رایگان برای شروع زندگی هوشمند با هوش مصنوعی
                        <br />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          یاد بگیر چطور هوش مصنوعی می‌تونه زندگی شخصی و کاری‌تو متحول کنه
                        </span>
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                          <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">دسترسی فوری</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">بیش از ۳۰۰۰ دانشجو</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 dark:bg-pink-950/50 rounded-lg border border-pink-200/50 dark:border-pink-800/50">
                          <Calendar className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">کاملاً رایگان</span>
                        </div>
                      </div>

                      
                      {/* CTA Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                        <Button 
                          asChild 
                          size="lg" 
                          className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
                        >
                          <Link to="/course/smart-life" className="flex items-center gap-2">
                            <span className="font-bold">شروع دوره رایگان</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          variant="outline" 
                          size="lg"
                          className="border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                        >
                          <Link to="/course/smart-life" className="flex items-center gap-2">
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
                            { icon: Video, color: 'blue', delay: 0 },
                            { icon: Users, color: 'purple', delay: 0.2 },
                            { icon: Calendar, color: 'pink', delay: 0.4 },
                            { icon: Sparkles, color: 'blue', delay: 0.6 }
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
                          className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-sm"
                        />
                        <motion.div
                          animate={{ 
                            y: [0, -15, 0],
                            opacity: [0.3, 0.7, 0.3]
                          }}
                          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                          className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full blur-sm"
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

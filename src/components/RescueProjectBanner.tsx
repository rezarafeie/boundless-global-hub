import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Target, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const RescueProjectBanner = () => {
  return (
    <section className="py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-0">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-200/30 to-amber-200/30 rounded-full blur-2xl" />
                
                <div className="relative p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 rotate-3 transform hover:rotate-0 transition-transform duration-300">
                          <Shield className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 text-center md:text-right">
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold">
                          <Target className="w-3 h-3" />
                          پروژه ویژه
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold">
                          <Compass className="w-3 h-3" />
                          مسیر نجات
                        </span>
                      </div>
                      
                      <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                        پروژه نجات | بدون مرز
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-xl mx-auto md:mx-0 leading-relaxed">
                        یک چالش کوتاه و جدی برای کسانی که زیر فشار اقتصادی هستند. نه انگیزشی، نه وعده‌های بزرگ — فقط یک مسیر واقعی برای نجات خودت.
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          <span>تحلیل واقع‌بینانه</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          <span>راهکارهای عملی</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          <span>بدون هایپ</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA */}
                    <div className="flex-shrink-0">
                      <Button 
                        asChild 
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300"
                      >
                        <Link to="/rescue" className="flex items-center gap-2">
                          <span>ورود به پروژه</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
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

export default RescueProjectBanner;

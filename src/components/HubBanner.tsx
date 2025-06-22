
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hub, MessageCircle, Bell, Video } from 'lucide-react';
import { motion } from 'framer-motion';

const HubBanner = () => {
  return (
    <section className="py-8 bg-gradient-to-r from-blue-50 via-purple-50/50 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-right">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Hub className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      🌟 هاب بدون مرز
                    </h2>
                  </div>
                  
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                    مرکز ارتباطات، پیام‌رسان، اطلاعیه‌ها و جلسات تصویری آکادمی رفیعی
                  </p>
                  
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>پیام‌رسان</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Bell className="w-4 h-4" />
                      <span>اطلاعیه‌ها</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Video className="w-4 h-4" />
                      <span>جلسات تصویری</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Link to="/hub">
                        <Hub className="w-4 h-4 mr-2" />
                        ورود به هاب
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/hub/messenger">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        پیام‌رسان
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center">
                      <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 rounded-2xl flex items-center justify-center">
                      <Video className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/50 dark:to-cyan-800/50 rounded-2xl flex items-center justify-center">
                      <Hub className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
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

export default HubBanner;

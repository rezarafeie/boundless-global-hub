
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Video, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const HubBanner = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-cyan-950/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-400 rounded-full blur-2xl animate-bounce"></div>
      </div>
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Card className="max-w-3xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-blue-500/10">
            <CardContent className="p-10">
              <motion.div 
                className="flex items-center justify-center gap-4 mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                  <div className="relative p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  مرکز ارتباط بدون مرز
                </h2>
                <Zap className="w-5 h-5 text-yellow-500 animate-bounce" />
              </motion.div>
              
              <motion.p 
                className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                پیام‌رسان هوشمند، اطلاعیه‌های زنده و جلسات تصویری تعاملی
                <br />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  ⚡ همین الان فعال و آنلاین
                </span>
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <Link to="/hub" className="flex items-center gap-2">
                    <Users className="w-4 h-4 group-hover:animate-bounce" />
                    ورود به مرکز ارتباط
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 group">
                  <Link to="/hub/messenger" className="flex items-center gap-2">
                    <Video className="w-4 h-4 group-hover:animate-pulse" />
                    پیام‌رسان آنی
                  </Link>
                </Button>
              </motion.div>
              
              {/* Live indicator */}
              <motion.div 
                className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-medium">آنلاین و در دسترس</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default HubBanner;

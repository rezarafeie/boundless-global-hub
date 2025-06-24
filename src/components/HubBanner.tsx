
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Video, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const HubBanner = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-indigo-500 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-500 rounded-full blur-xl animate-bounce"></div>
      </div>
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div 
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-lg opacity-60 animate-pulse"></div>
              <div className="relative p-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-2xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                مرکز ارتباط بدون مرز
              </h2>
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-5 h-5 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  پلتفرم ارتباطات هوشمند
                </span>
                <Zap className="w-5 h-5 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </motion.div>
          
          {/* Description */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              پیام‌رسان آنی، جلسات تصویری تعاملی و اطلاعیه‌های زنده
            </p>
            <div className="flex items-center justify-center gap-3 text-lg">
              <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  آنلاین و فعال
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 group text-lg px-8 py-6">
              <Link to="/hub" className="flex items-center gap-3">
                <Users className="w-5 h-5 group-hover:animate-bounce" />
                ورود به مرکز ارتباط
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 group text-lg px-8 py-6">
              <Link to="/hub/messenger" className="flex items-center gap-3">
                <Video className="w-5 h-5 group-hover:animate-pulse" />
                پیام‌رسان فوری
              </Link>
            </Button>
          </motion.div>
          
          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                  پیام‌رسانی آنی
                </h3>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Video className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                  جلسات تصویری
                </h3>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Globe className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                  اطلاعیه‌های زنده
                </h3>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HubBanner;

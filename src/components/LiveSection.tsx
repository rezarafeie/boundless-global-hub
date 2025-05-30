
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Users, Brain, Heart, TrendingUp, Eye } from 'lucide-react';

const LiveSection = () => {
  const [currentCards, setCurrentCards] = useState<any[]>([]);
  const [nextId, setNextId] = useState(1);
  const [viewerCount, setViewerCount] = useState(247);

  // Live activities data
  const liveActivities = [
    { 
      name: "رضا احمدی", 
      action: "در دوره شروع بدون مرز ثبت‌نام کرد", 
      icon: GraduationCap, 
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    { 
      name: "سارا کریمی", 
      action: "تست شخصیت را آغاز کرد", 
      icon: Brain, 
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
      name: "علی موسوی", 
      action: "دوره اینستاگرام را تکمیل کرد", 
      icon: Search, 
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20"
    },
    { 
      name: "مریم صادقی", 
      action: "تست هوش مالی را شروع کرد", 
      icon: DollarSign, 
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    { 
      name: "حسن رضایی", 
      action: "در دوره متاورس ثبت‌نام کرد", 
      icon: Code, 
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
      name: "فاطمه نوری", 
      action: "تست MBTI را تکمیل کرد", 
      icon: Heart, 
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    { 
      name: "امیر جعفری", 
      action: "پروژه درآمد غیرفعال را شروع کرد", 
      icon: Star, 
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    },
    { 
      name: "زهرا حسینی", 
      action: "تست آینده‌نگری را انجام داد", 
      icon: TrendingUp, 
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
    }
  ];

  const generateLiveCard = () => {
    const activity = liveActivities[Math.floor(Math.random() * liveActivities.length)];
    return {
      id: nextId,
      ...activity,
      timestamp: new Date().toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  useEffect(() => {
    // Add initial cards
    const initialCards = [
      generateLiveCard(),
      generateLiveCard()
    ];
    setCurrentCards(initialCards);
    setNextId(3);

    // Rotate cards every 4 seconds
    const interval = setInterval(() => {
      const newCard = generateLiveCard();
      setCurrentCards(prev => {
        const updated = [newCard, ...prev.slice(0, 2)];
        return updated;
      });
      setNextId(prev => prev + 1);
      
      // Update viewer count occasionally
      if (Math.random() < 0.3) {
        setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [nextId]);

  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-gray-800 dark:via-purple-800 dark:to-gray-800 text-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            📺 در حال پخش
            <Badge className="bg-red-500 text-white animate-pulse">
              LIVE
            </Badge>
          </h2>
          <p className="text-purple-200">فعالیت‌های زنده آکادمی رفیعی</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Live Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-purple-200">آخرین فعالیت‌ها</h3>
            <AnimatePresence mode="popLayout">
              {currentCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -50, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    boxShadow: index === 0 ? "0 0 20px rgba(147, 51, 234, 0.3)" : "none"
                  }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className={`${card.bgColor} backdrop-blur-sm rounded-xl p-4 border border-white/10`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center`}>
                      <card.icon size={18} className={card.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        <span className="font-bold">{card.name}</span> {card.action}
                      </p>
                      <p className="text-xs text-purple-200">{card.timestamp}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Live Player */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-purple-200">پخش زنده آکادمی</h3>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Eye size={16} />
                <span>{viewerCount} بیننده</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-red-500 text-white animate-pulse">
                  📡 پخش زنده آکادمی در حال حاضر
                </Badge>
              </div>
              
              <Card className="bg-black/20 border-purple-500/30 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ"
                      title="Live Stream"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-4 text-center">
                <p className="text-purple-200 text-sm">
                  ساعت پخش: شنبه تا چهارشنبه، ۲۰:۰۰ تا ۲۲:۰۰
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveSection;

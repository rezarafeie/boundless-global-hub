
import React, { useState, useEffect } from 'react';
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, DollarSign, GraduationCap, Search, Star, User, Users, Brain, Heart, TrendingUp, Eye } from 'lucide-react';

const Live = () => {
  const [currentCards, setCurrentCards] = useState<any[]>([]);
  const [nextId, setNextId] = useState(1);
  const [viewerCount, setViewerCount] = useState(247);

  // Live activities data
  const liveActivities = [
    { 
      name: "رضا احمدی", 
      action: "در دوره شروع بدون مرز ثبت‌نام کرد", 
      icon: GraduationCap, 
      color: "text-blue-600"
    },
    { 
      name: "سارا کریمی", 
      action: "تست شخصیت را آغاز کرد", 
      icon: Brain, 
      color: "text-purple-600"
    },
    { 
      name: "علی موسوی", 
      action: "دوره اینستاگرام را تکمیل کرد", 
      icon: Search, 
      color: "text-pink-600"
    },
    { 
      name: "مریم صادقی", 
      action: "تست هوش مالی را شروع کرد", 
      icon: DollarSign, 
      color: "text-green-600"
    },
    { 
      name: "حسن رضایی", 
      action: "در دوره متاورس ثبت‌نام کرد", 
      icon: Code, 
      color: "text-indigo-600"
    },
    { 
      name: "فاطمه نوری", 
      action: "تست MBTI را تکمیل کرد", 
      icon: Heart, 
      color: "text-red-600"
    },
    { 
      name: "امیر جعفری", 
      action: "پروژه درآمد غیرفعال را شروع کرد", 
      icon: Star, 
      color: "text-orange-600"
    },
    { 
      name: "زهرا حسینی", 
      action: "تست آینده‌نگری را انجام داد", 
      icon: TrendingUp, 
      color: "text-cyan-600"
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
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              📺 پخش زنده آکادمی رفیعی
              <Badge className="bg-red-500 text-white animate-pulse">
                LIVE
              </Badge>
            </h1>
            <p className="text-muted-foreground text-lg">فعالیت‌های زنده و آخرین اخبار آکادمی</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Live Cards Grid */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">آخرین فعالیت‌ها</h2>
              <AnimatePresence mode="popLayout">
                {currentCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      boxShadow: index === 0 ? "0 4px 20px rgba(59, 130, 246, 0.15)" : "none"
                    }}
                    exit={{ opacity: 0, x: 30, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="bg-card border-border hover:border-primary/20 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <card.icon size={18} className={card.color} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              <span className="font-bold">{card.name}</span> {card.action}
                            </p>
                            <p className="text-xs text-muted-foreground">{card.timestamp}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Live Player */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">پخش زنده</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted flex items-center justify-center">
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
                  <p className="text-muted-foreground text-sm">
                    ساعت پخش: شنبه تا چهارشنبه، ۲۰:۰۰ تا ۲۲:۰۰
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Live;

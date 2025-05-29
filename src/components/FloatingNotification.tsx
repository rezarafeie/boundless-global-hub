
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  emoji: string;
  timestamp: string;
}

const FloatingNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);

  const activities = [
    "در دوره بدون مرز ثبت‌نام کرد",
    "به پروژه درآمد غیرفعال پیوست",
    "وارد وبینار بیزینس آمریکایی شد",
    "دوره اصول اینستاگرام را تکمیل کرد",
    "در آزمون شخصیت شرکت کرد",
    "به انجمن کارآفرینان پیوست",
    "دستیار هوش مصنوعی را فعال کرد",
    "درآمد اولیه‌اش را کسب کرد",
    "دوره ثروت را شروع کرد",
    "پروژه تغییر خود را آغاز کرد",
    "به کانال تلگرام آکادمی پیوست",
    "اولین فروش آنلاین‌اش را داشت",
    "دوره متاورس را دانلود کرد",
    "به جمع موفق‌ها پیوست",
    "پلتفرم آنلاین خود را راه‌اندازی کرد"
  ];

  const emojis = ["🎉", "✨", "👏", "🚀", "🧠", "💼", "🤖", "💰", "💎", "🔄", "📱", "🎯", "🌐", "⭐", "🚀"];
  
  const cities = ["تهران", "اصفهان", "شیراز", "مشهد", "کرج", "تبریز", "اهواز", "کرمان", "رشت", "قم"];
  const names = ["رضا", "نسرین", "علی", "مریم", "حسن", "زهرا", "محمد", "فاطمه", "احمد", "سارا", "امیر", "مینا", "رامین", "لیلا", "کامران"];

  const generateTimestamp = () => {
    const timeOptions = [
      "همین الان",
      "۱ دقیقه پیش",
      "۲ دقیقه پیش",
      "۳ دقیقه پیش",
      "۵ دقیقه پیش",
      "۱۰ دقیقه پیش",
      "۱۵ دقیقه پیش",
      "۳۰ ثانیه پیش",
      "۴۵ ثانیه پیش"
    ];
    return timeOptions[Math.floor(Math.random() * timeOptions.length)];
  };

  const generateRandomNotification = () => {
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Create full context message
    const fullMessage = `${randomName} از ${randomCity} ${randomActivity}`;
    
    return {
      id: nextId,
      message: fullMessage,
      emoji: randomEmoji,
      timestamp: generateTimestamp()
    };
  };

  useEffect(() => {
    const showNotification = () => {
      const notification = generateRandomNotification();
      setNotifications(prev => [...prev, notification]);
      setNextId(prev => prev + 1);

      // Auto remove after 6 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 6000);
    };

    // Show first notification after 3 seconds
    const firstTimeout = setTimeout(showNotification, 3000);

    // Show subsequent notifications every 15 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 15000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [nextId]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeOut",
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-5 border border-gray-100 hover:shadow-3xl transition-all duration-300 group hover:bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                <span className="text-xl">{notification.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">{notification.timestamp}</p>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingNotification;

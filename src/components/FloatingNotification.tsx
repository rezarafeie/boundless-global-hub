
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  emoji: string;
}

const FloatingNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);

  const messages = [
    { message: "رضا در دوره بدون مرز ثبت‌نام کرد", emoji: "🎉" },
    { message: "نسرین به پروژه درآمد غیرفعال پیوست", emoji: "✨" },
    { message: "علی از تهران وارد وبینار بیزینس آمریکایی شد", emoji: "👏" },
    { message: "مریم دوره اصول اینستاگرام را تکمیل کرد", emoji: "🚀" },
    { message: "حسن از اصفهان در آزمون شخصیت شرکت کرد", emoji: "🧠" },
    { message: "زهرا به انجمن کارآفرینان پیوست", emoji: "💼" },
    { message: "محمد از شیراز دستیار هوش مصنوعی را فعال کرد", emoji: "🤖" },
    { message: "فاطمه درآمد اولیه‌اش را کسب کرد", emoji: "💰" },
    { message: "احمد از مشهد دوره ثروت را شروع کرد", emoji: "💎" },
    { message: "سارا پروژه تغییر خود را آغاز کرد", emoji: "🔄" },
    { message: "امیر به کانال تلگرام آکادمی پیوست", emoji: "📱" },
    { message: "مینا از کرج اولین فروش آنلاین‌اش را داشت", emoji: "🎯" },
    { message: "رامین دوره متاورس را دانلود کرد", emoji: "🌐" },
    { message: "لیلا از تبریز به جمع موفق‌ها پیوست", emoji: "⭐" },
    { message: "کامران پلتفرم آنلاین خود را راه‌اندازی کرد", emoji: "🚀" }
  ];

  const cities = ["تهران", "اصفهان", "شیراز", "مشهد", "کرج", "تبریز", "اهواز", "کرمان", "رشت", "قم"];
  const names = ["رضا", "نسرین", "علی", "مریم", "حسن", "زهرا", "محمد", "فاطمه", "احمد", "سارا", "امیر", "مینا", "رامین", "لیلا", "کامران"];

  const generateRandomNotification = () => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    
    // Replace the name in the message with a random name
    const personalizedMessage = randomMessage.message.replace(/^[آ-ی\s]+/, randomName);
    
    return {
      id: nextId,
      message: personalizedMessage,
      emoji: randomMessage.emoji
    };
  };

  useEffect(() => {
    const showNotification = () => {
      const notification = generateRandomNotification();
      setNotifications(prev => [...prev, notification]);
      setNextId(prev => prev + 1);

      // Auto remove after 4 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 4000);
    };

    // Show first notification after 2 seconds
    const firstTimeout = setTimeout(showNotification, 2000);

    // Show subsequent notifications every 3-13 seconds
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 10000 + 3000; // 3-13 seconds
      setTimeout(showNotification, randomDelay);
    }, 8000); // Base interval

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [nextId]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.3 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-white shadow-lg rounded-lg p-4 min-w-[280px] max-w-[320px] border border-gray-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{notification.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">همین الان</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingNotification;

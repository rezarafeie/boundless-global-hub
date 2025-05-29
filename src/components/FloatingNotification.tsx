
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const FloatingNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);

  const activities = [
    "در دوره شروع ثبت‌نام کرد",
    "در دوره بدون مرز ثبت‌نام کرد", 
    "تست شخصیت کارآفرین را کامل کرد",
    "دوره امپراتوری متاورس را شروع کرد",
    "در دوره اصول اینستاگرام ثبت‌نام کرد",
    "تست شخصیت را کامل کرد",
    "در دوره کسب‌وکار آمریکایی ثبت‌نام کرد",
    "دوره ثروت را تکمیل کرد"
  ];
  
  const names = [
    "محمد احمدی", "سارا رضایی", "علی حسینی", "مریم کریمی", "حسن موسوی",
    "زهرا اکبری", "رضا نوری", "فاطمه صادقی", "امیر جعفری", "مینا شریفی",
    "لیلا حیدری", "احمد صادقی", "کامران بهرامی", "نسرین طاهری", "سعید رحیمی"
  ];

  const generateTimestamp = () => {
    const timeOptions = [
      "همین الان",
      "۱ دقیقه پیش",
      "۲ دقیقه پیش",
      "۳ دقیقه پیش",
      "۵ دقیقه پیش"
    ];
    return timeOptions[Math.floor(Math.random() * timeOptions.length)];
  };

  const generateRandomNotification = () => {
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    const fullMessage = `${randomName} ${randomActivity}`;
    
    return {
      id: nextId,
      message: fullMessage,
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

    // Show first notification after 5 seconds
    const firstTimeout = setTimeout(showNotification, 5000);

    // Show subsequent notifications with random interval (15-25 seconds)
    const scheduleNext = () => {
      const randomInterval = Math.random() * (25000 - 15000) + 15000; // 15-25 seconds
      setTimeout(() => {
        showNotification();
        scheduleNext(); // Schedule the next one
      }, randomInterval);
    };

    scheduleNext();

    return () => {
      clearTimeout(firstTimeout);
    };
  }, [nextId]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              type: "spring",
              stiffness: 120,
              damping: 20
            }}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{notification.timestamp}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingNotification;


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
    "در دوره بدون مرز ثبت‌نام کرد",
    "در دوره اصول اینستاگرام ثبت‌نام کرد",
    "دوره ثروت را تکمیل کرد",
    "در پروژه درآمد غیرفعال شرکت کرد",
    "تست شخصیت کارآفرین را کامل کرد",
    "در وبینار بیزینس آمریکایی شرکت کرد",
    "دوره امپراتوری متاورس را شروع کرد",
    "پروژه تغییر خود را آغاز کرد",
    "در آزمون هوش عاطفی شرکت کرد",
    "دستیار هوش مصنوعی را فعال کرد",
    "در آزمون شغلی شرکت کرد",
    "دوره کسب‌وکار آمریکایی را تکمیل کرد"
  ];
  
  const names = [
    "محمد احمدی", "سارا رضایی", "علی حسینی", "مریم کریمی", "حسن موسوی",
    "زهرا اکبری", "رضا نوری", "فاطمه صادقی", "امیر جعفری", "مینا شریفی",
    "کامران بهرامی", "لیلا قاسمی", "داود مرادی", "نسرین طاهری", "سعید رحیمی"
  ];

  const generateTimestamp = () => {
    const timeOptions = [
      "همین الان",
      "۱ دقیقه پیش",
      "۲ دقیقه پیش",
      "۳ دقیقه پیش",
      "۵ دقیقه پیش",
      "۷ دقیقه پیش",
      "۱۰ دقیقه پیش"
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

      // Auto remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    // Show first notification after 3 seconds
    const firstTimeout = setTimeout(showNotification, 3000);

    // Show subsequent notifications with random interval (7-20 seconds)
    const scheduleNext = () => {
      const randomInterval = Math.random() * (20000 - 7000) + 7000; // 7-20 seconds
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
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-xs">
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
            className="bg-background/95 backdrop-blur-sm shadow-lg border border-border rounded-lg p-4 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-relaxed mb-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
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

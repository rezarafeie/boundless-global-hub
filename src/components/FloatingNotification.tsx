
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  link: string;
}

const FloatingNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);
  const navigate = useNavigate();

  // Course activities (70% weight)
  const courseActivities = [
    { text: "در دوره شروع بدون مرز ثبت‌نام کرد", link: "/courses/boundless" },
    { text: "دوره شروع بدون مرز را شروع کرد", link: "/courses/boundless" },
    { text: "در دوره اصول اینستاگرام ثبت‌نام کرد", link: "/courses/instagram" },
    { text: "دوره امپراتوری متاورس را شروع کرد", link: "/courses/metaverse" },
    { text: "در دوره کسب‌وکار آمریکایی ثبت‌نام کرد", link: "/courses/servit" },
    { text: "دوره ثروت را تکمیل کرد", link: "/courses" },
    { text: "پروژه درآمد غیرفعال را شروع کرد", link: "/course/passive-income" },
    { text: "پروژه تغییر را شروع کرد", link: "/course/change" },
    { text: "در دوره مزه بدون مرز ثبت‌نام کرد", link: "/course/boundless-taste" }
  ];

  // Test activities (30% weight)
  const testActivities = [
    { text: "تست شخصیت کارآفرین را کامل کرد", link: "/assessment/personality" },
    { text: "تست MBTI را تکمیل کرد", link: "/assessment/personality" },
    { text: "تست هوش مالی را انجام داد", link: "/assessment/financial" },
    { text: "تست هوش هیجانی را کامل کرد", link: "/assessment/emotional" },
    { text: "تست آینده‌نگری را تکمیل کرد", link: "/assessment/future" },
    { text: "تست شخصیت را کامل کرد", link: "/assessment/personality" },
    { text: "تست IQ را انجام داد", link: "/assessment/iq" },
    { text: "تست مهارت‌های رهبری را تکمیل کرد", link: "/assessment/leadership" }
  ];
  
  // Enhanced mix of Persian names (90%) and limited Finglish names (10%)
  const names = [
    // Persian names (majority - 90%)
    "محمد احمدی", "سارا رضایی", "علی حسینی", "مریم کریمی", "حسن موسوی",
    "زهرا اکبری", "رضا نوری", "فاطمه صادقی", "امیر جعفری", "مینا شریفی",
    "لیلا حیدری", "احمد صادقی", "نسرین طاهری", "سعید رحیمی", "نیلوفر قاسمی",
    "داود کریمی", "شیدا حسنی", "بهرام نجفی", "آرزو محمدی", "کیوان رستمی",
    "پروین اسدی", "منصور ابراهیمی", "شکوفه ملکی", "رامین باقری", "ملیکا فرزام",
    "هادی خسروی", "ندا عظیمی", "مجید پناهی", "زینب حکیمی", "ارسلان یوسفی",
    "گلناز صفری", "فرید امینی", "نرگس بهرامی", "کامران سلطانی", "ژیلا روشن",
    "مهدی ایرانی", "طاهره جهانی", "وحید فرهادی", "سوده کمالی", "پیمان درویش",
    "الهام توکلی", "مصطفی نظری", "نازنین غلامی", "سامان رستگار", "مهناز خلیلی",
    "فرهاد شمسی", "ریحانه تقوی", "کورش رضائی", "مرضیه افشار", "بابک محسنی",
    "شبنم قربانی", "علیرضا زارعی", "پریسا مرادی", "محسن طالبی", "فریده ناصری",
    "عباس کاظمی", "ساناز ولی‌زاده", "حامد جوادی", "نیکی صالحی", "ایمان بشیری",
    "مرجان شاکری", "یاسین بیگی", "سحر قلی‌زاده", "هوشنگ مختاری", "فروغ احمدی",
    
    // Limited Finglish names (10%)
    "Mohammad Ahmadi", "Sara Rezaei", "Ali Hosseini", "Maryam Karimi", "Hassan Mousavi"
  ];

  const generateTimestamp = () => {
    const timeOptions = [
      "همین الان",
      "همین الان", 
      "چند ثانیه پیش",
      "چند ثانیه پیش",
      "۱ دقیقه پیش"
    ];
    return timeOptions[Math.floor(Math.random() * timeOptions.length)];
  };

  const generateRandomNotification = () => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    // 70% course activities, 30% test activities
    const isCourse = Math.random() < 0.7;
    const activities = isCourse ? courseActivities : testActivities;
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    const fullMessage = `${randomName} ${randomActivity.text}`;
    
    return {
      id: nextId,
      message: fullMessage,
      timestamp: generateTimestamp(),
      link: randomActivity.link
    };
  };

  useEffect(() => {
    const showNotification = () => {
      // Strict limit to 2 notifications max
      if (notifications.length >= 2) {
        return;
      }

      const notification = generateRandomNotification();
      setNotifications(prev => [...prev, notification]);
      setNextId(prev => prev + 1);

      // Auto remove after 4 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 4000);
    };

    // Show first notification after 5 seconds
    const firstTimeout = setTimeout(showNotification, 5000);

    // Show subsequent notifications with random interval (15-30 seconds)
    const scheduleNext = () => {
      const randomInterval = Math.random() * (30000 - 15000) + 15000; // 15-30 seconds
      setTimeout(() => {
        showNotification();
        scheduleNext(); // Schedule the next one
      }, randomInterval);
    };

    scheduleNext();

    return () => {
      clearTimeout(firstTimeout);
    };
  }, [nextId, notifications.length]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (link: string) => {
    navigate(link);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-xl transition-all duration-300 group cursor-pointer text-sm"
            onClick={() => handleNotificationClick(notification.link)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{notification.timestamp}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
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

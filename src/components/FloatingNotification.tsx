
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
    { text: "تست MBTI را تکمیل کرد", link: "/assessment/mbti" },
    { text: "تست هوش مالی را انجام داد", link: "/assessment/financial" },
    { text: "تست هوش هیجانی را کامل کرد", link: "/assessment/emotional" },
    { text: "تست آینده‌نگری را تکمیل کرد", link: "/assessment/future" },
    { text: "تست شخصیت را کامل کرد", link: "/assessment/personality" },
    { text: "تست IQ را انجام داد", link: "/assessment/iq" },
    { text: "تست مهارت‌های رهبری را تکمیل کرد", link: "/assessment/leadership" }
  ];
  
  // Extensive Persian names for maximum variety (90%)
  const persianNames = [
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
    "جواد میرزایی", "غزاله کریمیان", "پوریا دادور", "شیرین ظریف", "آرش صمدی",
    "بیتا مهرابی", "کیانوش احمدپور", "نگین هاشمی", "فراز مرتضوی", "یسنا فرامرزی",
    "مریم میرزایی", "علی‌رضا کریمی", "زهره محمدی", "سارا صفرزاده", "حسین یوسفی",
    "فاطمه حسینی", "رضا مرادی", "نیلوفر زارع", "امیرحسین نیری", "مونا جهانی",
    "محمدرضا تقوی", "سمیه رستمی", "بهنام عباسی", "نسیم کریمیان", "آرمین جلالی"
  ];

  // Limited Finglish names with more variety (10%)
  const finglishNames = [
    "Mohammad A.", "Sara R.", "Ali H.", "Maryam K.", "Hassan M.",
    "Zahra A.", "Reza N.", "Fateme S.", "Amir J.", "Mina Sh.",
    "Ahmad R.", "Nasrin T.", "Saeed R.", "Nilofar Q.", "Kian R.",
    "Parisa M.", "Mohsen T.", "Hamed J.", "Negar H.", "Farshad M."
  ];

  // Combine names with proper ratio (90% Persian, 10% Finglish)
  const allNames = [...persianNames, ...finglishNames];

  const generateTimestamp = () => {
    const timeOptions = [
      "همین الان",
      "چند ثانیه پیش",
      "۱ دقیقه پیش",
      "۲ دقیقه پیش",
      "۳ دقیقه پیش"
    ];
    return timeOptions[Math.floor(Math.random() * timeOptions.length)];
  };

  const generateRandomNotification = () => {
    const randomName = allNames[Math.floor(Math.random() * allNames.length)];
    
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
      // Strict limit to max 1 notification at a time
      if (notifications.length >= 1) {
        return;
      }

      const notification = generateRandomNotification();
      setNotifications(prev => [...prev, notification]);
      setNextId(prev => prev + 1);

      // Auto remove after 6 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 6000);
    };

    // Show first notification after 15 seconds
    const firstTimeout = setTimeout(showNotification, 15000);

    // Show subsequent notifications with longer intervals (60-120 seconds)
    const scheduleNext = () => {
      const randomInterval = Math.random() * (120000 - 60000) + 60000; // 1-2 minutes
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
    <div className={`fixed bottom-4 right-4 z-50 space-y-2 ${isMobile ? 'max-w-[240px] bottom-20' : 'max-w-xs'}`}>
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
            className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-xl transition-all duration-300 group cursor-pointer ${isMobile ? 'p-2' : 'p-3'}`}
            onClick={() => handleNotificationClick(notification.link)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1 line-clamp-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {notification.message}
                </p>
                <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>{notification.timestamp}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={isMobile ? 10 : 12} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingNotification;

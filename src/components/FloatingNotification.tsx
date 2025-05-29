
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
  link?: string;
}

const FloatingNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);
  const navigate = useNavigate();

  // Course activities (70% of notifications)
  const courseActivities = [
    { text: "joined دوره شروع بدون مرز", link: "/course/boundless" },
    { text: "joined دوره امپراتوری متاورس", link: "/courses" },
    { text: "joined دوره اصول اینستاگرام", link: "/courses" },
    { text: "joined دوره کسب‌وکار آمریکایی", link: "/courses" },
    { text: "completed دوره ثروت", link: "/courses" },
    { text: "joined پروژه درآمد غیرفعال", link: "/courses" },
    { text: "started دوره بدون مرز", link: "/course/boundless" },
    { text: "enrolled in دوره شروع", link: "/course/boundless" }
  ];
  
  // Test activities (30% of notifications)
  const testActivities = [
    { text: "completed تست شخصیت کارآفرین", link: "/assessment-center" },
    { text: "completed تست MBTI", link: "/assessment-center" },
    { text: "completed تست هوش مالی", link: "/assessment-center" },
    { text: "completed تست هوش هیجانی", link: "/assessment-center" },
    { text: "started تست شخصیت", link: "/assessment-center" },
    { text: "completed تست IQ", link: "/assessment-center" }
  ];
  
  // Mix of Finglish and Persian names (fewer Finglish entries)
  const names = [
    // Persian names (majority)
    "محمد احمدی", "سارا رضایی", "علی حسینی", "مریم کریمی", "حسن موسوی",
    "زهرا اکبری", "رضا نوری", "فاطمه صادقی", "امیر جعفری", "مینا شریفی",
    "لیلا حیدری", "احمد صادقی", "کامران بهرامی", "نسرین طاهری", "سعید رحیمی",
    
    // Finglish names (fewer entries)
    "Reza Rafiei", "Sara M.", "Mina A.", "Ali R.", "Negin S."
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
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    // 70% course notifications, 30% test notifications
    const isCourseNotification = Math.random() < 0.7;
    const activities = isCourseNotification ? courseActivities : testActivities;
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
      const notification = generateRandomNotification();
      setNotifications(prev => [...prev, notification]);
      setNextId(prev => prev + 1);

      // Auto remove after 6 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 6000);
    };

    // Show first notification after 8 seconds
    const firstTimeout = setTimeout(showNotification, 8000);

    // Show subsequent notifications with random interval (20-40 seconds)
    const scheduleNext = () => {
      const randomInterval = Math.random() * (40000 - 20000) + 20000; // 20-40 seconds
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

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
      removeNotification(notification.id);
    }
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
              duration: 0.3, 
              ease: "easeOut"
            }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-md border border-gray-100 dark:border-gray-800 rounded-lg p-3 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
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

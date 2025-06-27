
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveNotifications } from '@/hooks/useNotifications';

const NotificationFloating = () => {
  const { notifications, error } = useActiveNotifications();
  const [dismissedNotifications, setDismissedNotifications] = useState<number[]>([]);
  
  // If there's an error, don't render anything
  if (error) {
    console.error('Failed to load floating notifications:', error);
    return null;
  }
  
  // Get active floating notifications that haven't been dismissed
  const floatingNotifications = notifications
    .filter(n => n.notification_type === 'floating' && !dismissedNotifications.includes(n.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3); // Maximum 3 floating notifications

  const dismissNotification = (id: number) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  if (floatingNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9998] space-y-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {floatingNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.9 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30 
            }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 cursor-pointer hover:shadow-xl transition-shadow group"
            style={{ borderLeftColor: notification.color }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: `${notification.color}20` }}
              >
                <Bell 
                  className="w-4 h-4"
                  style={{ color: notification.color }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                  {notification.message}
                </p>
                
                {notification.link && (
                  <Link
                    to={notification.link}
                    className="inline-flex items-center text-xs font-medium mt-2 hover:underline"
                    style={{ color: notification.color }}
                  >
                    مشاهده جزئیات
                  </Link>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationFloating;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveNotifications } from '@/hooks/useNotifications';

const PopupNotification = () => {
  const { notifications, error } = useActiveNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<number[]>([]);
  
  // If there's an error, don't render anything
  if (error) {
    console.error('Failed to load popup notifications:', error);
    return null;
  }
  
  // Get active popup notifications
  const popupNotifications = notifications
    .filter(n => n.notification_type === 'popup')
    .sort((a, b) => b.priority - a.priority);

  useEffect(() => {
    // Show popup notifications one by one with delay
    popupNotifications.forEach((notification, index) => {
      setTimeout(() => {
        setVisibleNotifications(prev => [...prev, notification.id]);
      }, index * 500);
    });

    return () => {
      setVisibleNotifications([]);
    };
  }, [popupNotifications.length]);

  const closeNotification = (id: number) => {
    setVisibleNotifications(prev => prev.filter(nId => nId !== id));
  };

  const visiblePopups = popupNotifications.filter(n => visibleNotifications.includes(n.id));

  if (visiblePopups.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <AnimatePresence>
        {visiblePopups.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 10000 + index }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => closeNotification(notification.id)}
            />
            
            {/* Popup Content */}
            <div 
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border-t-4"
              style={{ borderTopColor: notification.color }}
            >
              <button
                onClick={() => closeNotification(notification.id)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="pr-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {notification.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {notification.message}
                </p>
                
                {notification.link && (
                  <Link
                    to={notification.link}
                    onClick={() => closeNotification(notification.id)}
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: notification.color }}
                  >
                    مشاهده بیشتر
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PopupNotification;

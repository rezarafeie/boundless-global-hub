
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/hooks/use-mobile';

const NotificationFloating = () => {
  const { notifications } = useActiveNotifications();
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Get floating notifications
    const floatingNotifications = notifications
      .filter(n => n.notification_type === 'floating')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // Max 3 floating notifications

    setActiveNotifications(floatingNotifications);
  }, [notifications]);

  const removeNotification = (id: number) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.link) {
      navigate(notification.link);
    }
    removeNotification(notification.id);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 space-y-2 ${isMobile ? 'max-w-[280px] bottom-20' : 'max-w-sm'}`}>
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: index * 0.1
            }}
            className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-xl transition-all duration-300 group cursor-pointer ${isMobile ? 'p-3' : 'p-4'}`}
            onClick={() => handleNotificationClick(notification)}
            style={{ borderLeftColor: notification.color, borderLeftWidth: '4px' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div 
                  className="p-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: notification.color + '20' }}
                >
                  <Bell 
                    className="w-4 h-4" 
                    style={{ color: notification.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {notification.title}
                  </h4>
                  <p className={`text-gray-600 dark:text-gray-400 leading-snug line-clamp-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {notification.message}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={isMobile ? 12 : 14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationFloating;

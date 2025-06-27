
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveNotifications } from '@/hooks/useNotifications';

const LiveWarModeBanner = () => {
  const { notifications } = useActiveNotifications();
  
  // Get active banner notifications, prioritized by priority
  const bannerNotifications = notifications
    .filter(n => n.notification_type === 'banner')
    .sort((a, b) => b.priority - a.priority);

  if (bannerNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-[9999]">
      {bannerNotifications.map((notification, index) => (
        <Link key={notification.id} to={notification.link || '#'} className="block">
          <div 
            className="border-b cursor-pointer hover:opacity-90 transition-opacity"
            style={{ 
              backgroundColor: notification.color,
              borderBottomColor: notification.color,
              top: `${index * 48}px`
            }}
          >
            <div className="container py-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-center gap-2 md:gap-4 text-center"
              >
                {/* Blinking Red Dot */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1]
                  }}
                  transition={{ 
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 md:w-3 md:h-3 bg-white/70 rounded-full shadow-sm"
                />
                
                {/* Notification Text */}
                <span className="text-white font-semibold text-sm md:text-base">
                  {notification.message}
                </span>
                
                {/* Alert Icon - Hidden on mobile */}
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="hidden md:block"
                >
                  <AlertTriangle className="w-4 h-4 text-white/80" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default LiveWarModeBanner;

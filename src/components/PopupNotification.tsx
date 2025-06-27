
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveNotifications } from '@/hooks/useNotifications';

const PopupNotification = () => {
  const { notifications } = useActiveNotifications();
  const [activePopup, setActivePopup] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get highest priority popup notification
    const popupNotifications = notifications
      .filter(n => n.notification_type === 'popup')
      .sort((a, b) => b.priority - a.priority);

    if (popupNotifications.length > 0 && !activePopup) {
      setActivePopup(popupNotifications[0]);
    }
  }, [notifications, activePopup]);

  const handleClose = () => {
    setActivePopup(null);
  };

  const handleClick = () => {
    if (activePopup?.link) {
      navigate(activePopup.link);
    }
    handleClose();
  };

  if (!activePopup) return null;

  const getIcon = () => {
    if (activePopup.priority >= 3) return <AlertTriangle className="w-6 h-6 text-red-500" />;
    if (activePopup.priority === 2) return <Info className="w-6 h-6 text-blue-500" />;
    return <CheckCircle className="w-6 h-6 text-green-500" />;
  };

  return (
    <AnimatePresence>
      {activePopup && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div 
              className="px-6 py-4 border-b"
              style={{ borderBottomColor: activePopup.color + '20' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getIcon()}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activePopup.title}
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {activePopup.message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                بستن
              </button>
              {activePopup.link && (
                <button
                  onClick={handleClick}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                  style={{ backgroundColor: activePopup.color }}
                >
                  مشاهده
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PopupNotification;

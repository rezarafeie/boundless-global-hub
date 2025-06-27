
import { useActiveNotifications } from '@/contexts/NotificationContext';

export const useNotificationHeight = () => {
  const { notifications, error } = useActiveNotifications();
  
  // If there's an error, return safe defaults
  if (error) {
    return {
      totalHeight: 0,
      hasBannerNotifications: false,
      bannerCount: 0,
      headerHeight: 64 // Correct header height
    };
  }
  
  // Calculate total height of active banner notifications
  const bannerNotifications = notifications.filter(n => n.notification_type === 'banner');
  
  // Each banner notification is approximately 40px tall (more precise measurement)
  // This accounts for padding (py-2 = 8px top + 8px bottom) + text height (~24px)
  const bannerHeight = bannerNotifications.length * 40;
  
  return {
    totalHeight: bannerHeight,
    hasBannerNotifications: bannerNotifications.length > 0,
    bannerCount: bannerNotifications.length,
    headerHeight: 64 // Correct header height
  };
};

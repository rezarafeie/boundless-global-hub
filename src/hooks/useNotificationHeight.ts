
import { useActiveNotifications } from '@/hooks/useNotifications';

export const useNotificationHeight = () => {
  const { notifications } = useActiveNotifications();
  
  // Calculate total height of active banner notifications
  const bannerNotifications = notifications.filter(n => n.notification_type === 'banner');
  
  // Each banner notification is approximately 48px tall (12px padding * 2 + text height)
  const bannerHeight = bannerNotifications.length * 48;
  
  return {
    totalHeight: bannerHeight,
    hasBannerNotifications: bannerNotifications.length > 0,
    bannerCount: bannerNotifications.length
  };
};

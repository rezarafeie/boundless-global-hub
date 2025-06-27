
import { useEffect, useState } from 'react';
import { useActiveNotifications } from '@/hooks/useNotifications';

export const useNotificationHeight = () => {
  const { notifications } = useActiveNotifications();
  const [totalHeight, setTotalHeight] = useState(0);

  useEffect(() => {
    // Get active banner notifications
    const bannerNotifications = notifications.filter(n => n.notification_type === 'banner');
    
    // Calculate total height: each banner is approximately 48px + padding
    const height = bannerNotifications.length * 52; // 48px + 4px padding
    setTotalHeight(height);
  }, [notifications]);

  return totalHeight;
};

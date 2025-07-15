import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUserPresenceOptions {
  userId: number | null;
  enabled?: boolean;
}

export const useUserPresence = ({ userId, enabled = true }: UseUserPresenceOptions) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef(true);

  useEffect(() => {
    if (!userId || !enabled) return;

    console.log('👤 Setting up user presence tracking for user:', userId);

    // Function to update user presence
    const updatePresence = async (isOnline: boolean = true) => {
      try {
        await supabase.rpc('update_user_presence', {
          p_user_id: userId,
          p_is_online: isOnline
        });
        console.log('👤 Updated user presence:', { userId, isOnline });
      } catch (error) {
        console.error('Error updating user presence:', error);
      }
    };

    // Set user as online immediately
    updatePresence(true);
    isOnlineRef.current = true;

    // Update presence every 30 seconds while active
    intervalRef.current = setInterval(() => {
      if (isOnlineRef.current) {
        updatePresence(true);
      }
    }, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isOnlineRef.current = isVisible;
      updatePresence(isVisible);
      console.log('👤 Visibility changed:', { isVisible, userId });
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      isOnlineRef.current = false;
      // Set user offline on page unload
      updatePresence(false);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    // Handle focus/blur events
    const handleFocus = () => {
      isOnlineRef.current = true;
      updatePresence(true);
    };

    const handleBlur = () => {
      // Don't immediately set offline on blur, wait for visibility change
      // This prevents false offline status when switching between tabs
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      console.log('👤 Cleaning up user presence tracking for user:', userId);
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);

      // Set user offline
      isOnlineRef.current = false;
      updatePresence(false);
    };
  }, [userId, enabled]);

  return null; // This hook doesn't return UI
};
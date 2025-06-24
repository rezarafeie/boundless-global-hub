
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const { data, error } = await supabase
        .from('live_settings')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        setIsOnline(false);
      } else {
        setIsOnline(true);
      }
    } catch (error) {
      console.log('Connection check failed:', error);
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up polling every 15 seconds
    const interval = setInterval(checkConnection, 15000);

    // Listen to browser online/offline events
    const handleOnline = () => {
      console.log('Browser back online, checking connection...');
      checkConnection();
    };

    const handleOffline = () => {
      console.log('Browser went offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isChecking, checkConnection };
};

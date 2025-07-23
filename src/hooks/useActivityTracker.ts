import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { activityService, ActivityEventType } from '@/lib/activityService';

interface UseActivityTrackerOptions {
  eventType: ActivityEventType;
  reference?: string;
  metadata?: Record<string, any>;
  trackTime?: boolean;
  autoLog?: boolean;
}

export const useActivityTracker = (options: UseActivityTrackerOptions) => {
  const { user } = useAuth();
  const startTimeRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const hasLoggedRef = useRef(false);

  const logActivity = useCallback(async (duration?: number) => {
    if (!user?.id || hasLoggedRef.current) return;

    try {
      await activityService.logActivity(
        Number(user.id),
        options.eventType,
        options.reference,
        { ...options.metadata, duration: duration }
      );
      hasLoggedRef.current = true;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user?.id, options]);

  const startTracking = useCallback(() => {
    if (options.trackTime) {
      startTimeRef.current = Date.now();
      isActiveRef.current = true;
    }

    if (options.autoLog) {
      logActivity();
    }
  }, [options.trackTime, options.autoLog, logActivity]);

  const stopTracking = useCallback(() => {
    if (!options.trackTime || !startTimeRef.current || !isActiveRef.current) return;

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000 / 60); // Convert to minutes
    isActiveRef.current = false;

    if (duration > 0) {
      logActivity(duration);
    }
  }, [options.trackTime, logActivity]);

  const pauseTracking = useCallback(() => {
    if (options.trackTime && startTimeRef.current && isActiveRef.current) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000 / 60);
      if (duration > 0) {
        logActivity(duration);
      }
      isActiveRef.current = false;
    }
  }, [options.trackTime, logActivity]);

  const resumeTracking = useCallback(() => {
    if (options.trackTime) {
      startTimeRef.current = Date.now();
      isActiveRef.current = true;
    }
  }, [options.trackTime]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseTracking();
      } else {
        resumeTracking();
      }
    };

    const handleBeforeUnload = () => {
      stopTracking();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopTracking();
    };
  }, [pauseTracking, resumeTracking, stopTracking]);

  // Start tracking on mount
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  return {
    logActivity,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking
  };
};
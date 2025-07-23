import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { activityService } from '@/lib/activityService';

interface UseLessonTrackerOptions {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
}

export const useLessonTracker = (options?: UseLessonTrackerOptions) => {
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const isActiveRef = useRef(true);
  const hasLoggedOpenRef = useRef(false);

  // Log lesson opened
  useEffect(() => {
    if (!user?.id || !options || hasLoggedOpenRef.current) return;

    const logLessonOpen = async () => {
      try {
        // Log activity
        await activityService.logActivity(
          Number(user.id),
          'lesson_opened',
          options.lessonId,
          {
            course_id: options.courseId,
            lesson_title: options.lessonTitle,
            course_title: options.courseTitle
          }
        );

        // Track lesson progress
        await activityService.trackLessonProgress(
          Number(user.id),
          options.courseId,
          options.lessonId,
          'opened'
        );

        hasLoggedOpenRef.current = true;
      } catch (error) {
        console.error('Error logging lesson open:', error);
      }
    };

    logLessonOpen();
  }, [user?.id, options]);

  // Track time spent and handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        startTimeRef.current = Date.now();
        isActiveRef.current = true;
      }
    };

    const logTimeSpent = async () => {
      if (!user?.id || !isActiveRef.current || !options) return;

      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000 / 60); // minutes
      if (timeSpent > 0) {
        try {
          // Log time spent activity
          await activityService.logActivity(
            Number(user.id),
            'lesson_time_spent',
            options.lessonId,
            {
              course_id: options.courseId,
              lesson_title: options.lessonTitle,
              course_title: options.courseTitle,
              time_spent_minutes: timeSpent
            }
          );

          // Update lesson progress
          await activityService.trackLessonProgress(
            Number(user.id),
            options.courseId,
            options.lessonId,
            'time_spent',
            timeSpent
          );
        } catch (error) {
          console.error('Error logging time spent:', error);
        }
      }
    };

    const handleBeforeUnload = () => {
      logTimeSpent();
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Log time spent every 5 minutes
    const timeInterval = setInterval(() => {
      if (isActiveRef.current) {
        logTimeSpent();
        startTimeRef.current = Date.now(); // Reset timer
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timeInterval);
      logTimeSpent(); // Final log when component unmounts
    };
  }, [user?.id, options]);

  const markLessonComplete = async () => {
    console.log('markLessonComplete called with:', { user: user?.id, options });
    if (!user?.id || !options) {
      console.log('Early return from markLessonComplete:', { userId: user?.id, options });
      return;
    }

    try {
      console.log('Starting lesson completion process...');
      
      // Log completion activity
      console.log('Logging completion activity...');
      await activityService.logActivity(
        Number(user.id),
        'lesson_completed',
        options.lessonId,
        {
          course_id: options.courseId,
          lesson_title: options.lessonTitle,
          course_title: options.courseTitle
        }
      );
      console.log('Activity logged successfully');

      // Mark lesson as completed
      console.log('Tracking lesson progress...');
      await activityService.trackLessonProgress(
        Number(user.id),
        options.courseId,
        options.lessonId,
        'completed'
      );
      console.log('Lesson progress tracked successfully');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      throw error;
    }
  };

  return { markLessonComplete };
};
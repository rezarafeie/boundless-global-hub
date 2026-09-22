import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLessonWatchTimeArgs {
  userId?: number | null;
  courseId?: string;
  lessonId?: string;
  durationMinutes?: number;
  isCompleted: boolean;
  onAutoComplete: () => void;
}

/**
 * Tracks how long the user actually stays on a lesson (only while the tab is visible),
 * persists it to user_lesson_progress and auto-marks the lesson as completed once the
 * user has spent ~80% of the lesson duration on it.
 *
 * Counting happens in refs so the page (and the video frame) never re-renders.
 */
export const useLessonWatchTime = ({
  userId,
  courseId,
  lessonId,
  durationMinutes = 0,
  isCompleted,
  onAutoComplete,
}: UseLessonWatchTimeArgs) => {
  const secondsRef = useRef(0);
  const requiredRef = useRef(60);
  const completedRef = useRef(isCompleted);
  const autoCompleteRef = useRef(onAutoComplete);

  completedRef.current = isCompleted;
  autoCompleteRef.current = onAutoComplete;

  requiredRef.current = Math.max(60, Math.round((durationMinutes || 1) * 60 * 0.8));

  // Load previously recorded time for this lesson
  useEffect(() => {
    secondsRef.current = 0;
    if (!userId || !lessonId) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('user_lesson_progress')
          .select('total_time_spent')
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (!cancelled && data?.total_time_spent) {
          secondsRef.current = Math.min(data.total_time_spent * 60, requiredRef.current);
        }
      } catch (error) {
        console.error('Error loading lesson watch time:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, lessonId]);

  // Tick + persist
  useEffect(() => {
    if (!userId || !lessonId || !courseId) return;

    const save = async () => {
      const minutes = Math.round(secondsRef.current / 60);
      if (minutes <= 0) return;
      try {
        await supabase.from('user_lesson_progress').upsert(
          {
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId,
            is_opened: true,
            total_time_spent: minutes,
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' },
        );
      } catch (error) {
        console.error('Error saving lesson watch time:', error);
      }
    };

    const interval = setInterval(() => {
      if (document.hidden) return;
      secondsRef.current += 1;

      if (secondsRef.current % 30 === 0) save();

      if (!completedRef.current && secondsRef.current >= requiredRef.current) {
        completedRef.current = true;
        autoCompleteRef.current?.();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      save();
    };
  }, [userId, lessonId, courseId]);

  return { secondsRef, requiredRef };
};

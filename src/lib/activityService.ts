import { supabase } from '@/integrations/supabase/client';

export type ActivityEventType = 
  | 'user_registered'
  | 'user_logged_in'
  | 'course_enrolled'
  | 'support_activated'
  | 'telegram_joined'
  | 'course_page_visited'
  | 'lesson_opened'
  | 'lesson_completed'
  | 'lesson_time_spent'
  | 'material_downloaded';

interface ActivityMetadata {
  course_id?: string;
  lesson_id?: string;
  course_title?: string;
  lesson_title?: string;
  url?: string;
  file_name?: string;
  [key: string]: any;
}

export const activityService = {
  // Log user activity
  async logActivity(
    userId: number,
    eventType: ActivityEventType,
    reference?: string,
    metadata: ActivityMetadata = {},
    duration?: number
  ) {
    try {
      const { data, error } = await supabase.rpc('log_user_activity', {
        p_user_id: userId,
        p_event_type: eventType,
        p_reference: reference || null,
        p_metadata: metadata,
        p_duration: duration || null
      });

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  },

  // Track lesson progress
  async trackLessonProgress(
    userId: number,
    courseId: string,
    lessonId: string,
    action: 'opened' | 'completed' | 'time_spent',
    timeSpent?: number
  ) {
    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching lesson progress:', fetchError);
        return null;
      }

      const now = new Date().toISOString();
      let updateData: any = {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        last_accessed_at: now,
        updated_at: now
      };

      if (action === 'opened') {
        updateData.is_opened = true;
        if (!existingProgress) {
          updateData.first_opened_at = now;
        }
      } else if (action === 'completed') {
        updateData.is_completed = true;
        updateData.completed_at = now;
      }

      if (timeSpent) {
        updateData.total_time_spent = (existingProgress?.total_time_spent || 0) + timeSpent;
      }

      const { data, error } = await supabase
        .from('user_lesson_progress')
        .upsert(updateData, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();

      if (error) {
        console.error('Error tracking lesson progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error tracking lesson progress:', error);
      return null;
    }
  },

  // Update course progress flags
  async updateCourseProgress(
    userId: number,
    courseId: string,
    updates: {
      support_activated?: boolean;
      telegram_joined?: boolean;
      course_page_visited?: boolean;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          ...updates,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,course_id' })
        .select()
        .single();

      if (error) {
        console.error('Error updating course progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating course progress:', error);
      return null;
    }
  },

  // Get user activity logs
  async getUserActivityLogs(userId: number, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  },

  // Get user course progress
  async getUserCourseProgress(userId: number, courseId?: string) {
    try {
      let query = supabase
        .from('user_course_progress')
        .select(`
          *,
          courses:course_id (
            id,
            title,
            slug
          )
        `)
        .eq('user_id', userId);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query.order('last_activity_at', { ascending: false });

      if (error) {
        console.error('Error fetching course progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return [];
    }
  },

  // Get user lesson progress for a course
  async getUserLessonProgress(userId: number, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select(`
          *,
          course_lessons:lesson_id (
            id,
            title,
            order_index,
            duration,
            course_sections:section_id (
              id,
              title
            )
          )
        `)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .order('last_accessed_at', { ascending: false });

      if (error) {
        console.error('Error fetching lesson progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      return [];
    }
  }
};
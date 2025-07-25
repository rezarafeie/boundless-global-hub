import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LessonByNumber {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  file_url: string | null;
  duration: number;
  order_index: number;
  section_id: string;
  course_id: string;
  lesson_number: number;
  created_at: string;
  updated_at: string;
}

export const useLessonNumber = () => {
  const [loading, setLoading] = useState(false);

  const getLessonByNumber = async (courseSlug: string, lessonNumber: number): Promise<LessonByNumber | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_lesson_by_number', {
        course_slug_param: courseSlug,
        lesson_num: lessonNumber
      });

      if (error) {
        console.error('Error fetching lesson by number:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in getLessonByNumber:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLessonNumberById = async (lessonId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('lesson_number')
        .eq('id', lessonId)
        .single();

      if (error) {
        console.error('Error fetching lesson number:', error);
        return null;
      }

      return data?.lesson_number || null;
    } catch (error) {
      console.error('Error in getLessonNumberById:', error);
      return null;
    }
  };

  return {
    getLessonByNumber,
    getLessonNumberById,
    loading
  };
};
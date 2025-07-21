import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CourseSettings {
  use_landing_page_merge?: boolean;
  slug: string;
}

export const useCourseSettings = (courseSlug: string) => {
  const [courseSettings, setCourseSettings] = useState<CourseSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('use_landing_page_merge, slug')
          .eq('slug', courseSlug)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching course settings:', error);
        } else {
          setCourseSettings(data);
        }
      } catch (error) {
        console.error('Error fetching course settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseSlug) {
      fetchCourseSettings();
    }
  }, [courseSlug]);

  const getEnrollUrl = (courseSlug: string, defaultUrl: string) => {
    if (courseSettings?.use_landing_page_merge) {
      return `/enroll?course=${courseSlug}`;
    }
    return defaultUrl;
  };

  return {
    courseSettings,
    loading,
    getEnrollUrl
  };
};
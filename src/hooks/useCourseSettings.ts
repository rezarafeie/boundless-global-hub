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
    console.log('getEnrollUrl called:', { loading, courseSettings, courseSlug, defaultUrl });
    
    if (loading) {
      // Still loading, return null to indicate not ready
      console.log('Still loading course settings...');
      return null;
    }
    
    if (courseSettings?.use_landing_page_merge) {
      console.log('Landing page merge enabled, returning enrollment URL');
      return `/enroll?course=${courseSlug}`;
    }
    
    console.log('Landing page merge disabled, returning default URL');
    return defaultUrl;
  };

  return {
    courseSettings,
    loading,
    getEnrollUrl
  };
};
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlackFridaySettings {
  id: number;
  is_enabled: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface BlackFridayDiscount {
  id: string;
  course_id: string;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

export const useBlackFriday = () => {
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['black-friday-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('black_friday_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      return data as BlackFridaySettings;
    },
  });

  const { data: discounts, isLoading: discountsLoading } = useQuery({
    queryKey: ['black-friday-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('black_friday_discounts')
        .select('*');
      
      if (error) throw error;
      return data as BlackFridayDiscount[];
    },
  });

  const isActive = settings?.is_enabled && 
    settings.start_date && 
    settings.end_date &&
    new Date(settings.start_date) <= new Date() && 
    new Date(settings.end_date) >= new Date();

  const getCourseDiscount = (courseId: string) => {
    return discounts?.find(d => d.course_id === courseId)?.discount_percentage || 0;
  };

  return {
    settings,
    discounts,
    isActive,
    isLoading: settingsLoading || discountsLoading,
    getCourseDiscount,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RafieiMeetSettings {
  id: number;
  title: string;
  description: string;
  meet_url: string;
  is_active: boolean;
  updated_at: string;
}

export const useRafieiMeet = () => {
  const [settings, setSettings] = useState<RafieiMeetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rafiei_meet_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          id: 1,
          title: 'جلسه تصویری رفیعی',
          description: 'جلسه تصویری زنده برای اعضای بدون مرز',
          meet_url: 'https://meet.jit.si/rafiei',
          is_active: false
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('rafiei_meet_settings')
          .upsert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData);
      }
    } catch (error) {
      console.error('Error fetching Rafiei Meet settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تنظیمات جلسه تصویری',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<RafieiMeetSettings>) => {
    if (!settings) return;

    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('rafiei_meet_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      
      toast({
        title: 'موفق',
        description: 'تنظیمات جلسه تصویری به‌روزرسانی شد',
      });

      return data;
    } catch (error) {
      console.error('Error updating Rafiei Meet settings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async () => {
    if (!settings) return;

    try {
      setUpdating(true);
      const newActiveState = !settings.is_active;
      
      const updatedSettings = await updateSettings({ is_active: newActiveState });
      
      toast({
        title: newActiveState ? 'فعال شد' : 'غیرفعال شد',
        description: `جلسه تصویری ${newActiveState ? 'فعال' : 'غیرفعال'} شد`,
      });

      return updatedSettings;
    } catch (error) {
      console.error('Error toggling Rafiei Meet:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updating,
    updateSettings,
    toggleActive,
    refetch: fetchSettings
  };
};

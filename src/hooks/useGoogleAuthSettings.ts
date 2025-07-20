import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleAuthSettings {
  id: number;
  is_enabled: boolean;
  updated_at: string;
  updated_by: number | null;
}

export const useGoogleAuthSettings = () => {
  const [settings, setSettings] = useState<GoogleAuthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('google_auth_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching Google auth settings:', error);
        setError('خطا در دریافت تنظیمات Google Login');
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('خطا در دریافت تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    isGoogleAuthEnabled: settings?.is_enabled ?? true // Default to true if not loaded yet
  };
};

export default useGoogleAuthSettings;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rafieiMeetService, type RafieiMeetSettings } from '@/lib/rafieiMeet';

export const useRafieiMeet = () => {
  const [settings, setSettings] = useState<RafieiMeetSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await rafieiMeetService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching Rafiei Meet settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('rafiei-meet-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rafiei_meet_settings' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSettings(payload.new as RafieiMeetSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
};

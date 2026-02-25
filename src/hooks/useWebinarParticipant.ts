import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  webinar_id: string;
  phone: string;
  display_name: string | null;
  joined_at: string;
  interactions_completed: number;
  is_active_badge: boolean;
}

export const useWebinarParticipant = (webinarId: string | undefined) => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  const getStoredPhone = useCallback(() => {
    if (!webinarId) return null;
    return localStorage.getItem(`webinar_phone_${webinarId}`);
  }, [webinarId]);

  const joinWebinar = useCallback(async (phone: string, displayName?: string) => {
    if (!webinarId) return null;

    // Normalize phone
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) cleaned = '+' + cleaned.substring(2);
      else if (cleaned.startsWith('0')) cleaned = '+98' + cleaned.substring(1);
      else cleaned = '+' + cleaned;
    }

    const { data, error } = await supabase
      .from('webinar_participants')
      .upsert(
        { webinar_id: webinarId, phone: cleaned, display_name: displayName || null },
        { onConflict: 'webinar_id,phone' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error joining webinar:', error);
      return null;
    }

    localStorage.setItem(`webinar_phone_${webinarId}`, cleaned);
    setParticipant(data);
    return data;
  }, [webinarId]);

  useEffect(() => {
    const loadParticipant = async () => {
      if (!webinarId) { setLoading(false); return; }
      const phone = getStoredPhone();
      if (!phone) { setLoading(false); return; }

      const { data } = await supabase
        .from('webinar_participants')
        .select('*')
        .eq('webinar_id', webinarId)
        .eq('phone', phone)
        .single();

      if (data) setParticipant(data);
      setLoading(false);
    };
    loadParticipant();
  }, [webinarId, getStoredPhone]);

  return { participant, loading, joinWebinar, getStoredPhone };
};

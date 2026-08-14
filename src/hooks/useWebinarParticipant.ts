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
    // Reset state when webinarId changes
    setParticipant(null);
    setLoading(true);

    const loadParticipant = async () => {
      if (!webinarId) {
        // Don't set loading to false — keep waiting until webinarId is provided
        return;
      }

      // Auto-login via one-click token (?wl=...) coming from Telegram buttons
      const url = new URL(window.location.href);
      const wlToken = url.searchParams.get('wl');
      if (wlToken) {
        try {
          const { data: tok } = await supabase
            .from('webinar_login_tokens')
            .select('*')
            .eq('token', wlToken)
            .eq('webinar_id', webinarId)
            .maybeSingle();

          if (tok) {
            const joined = await joinWebinar(tok.phone, tok.display_name || undefined);
            await supabase
              .from('webinar_login_tokens')
              .update({ used_count: (tok.used_count || 0) + 1 })
              .eq('id', tok.id);
            url.searchParams.delete('wl');
            window.history.replaceState({}, '', url.pathname + url.search + url.hash);
            if (joined) {
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Webinar auto-login failed:', err);
        }
      }

      const phone = localStorage.getItem(`webinar_phone_${webinarId}`);
      if (!phone) {
        setLoading(false);
        return;
      }


      try {
        const { data, error } = await supabase
          .from('webinar_participants')
          .select('*')
          .eq('webinar_id', webinarId)
          .eq('phone', phone)
          .single();

        if (error) {
          console.error('Error loading participant:', error);
          // Phone in localStorage but not in DB — clear it
          if (error.code === 'PGRST116') {
            localStorage.removeItem(`webinar_phone_${webinarId}`);
          }
        }

        if (data) setParticipant(data);
      } catch (err) {
        console.error('Error loading participant:', err);
      } finally {
        setLoading(false);
      }
    };

    loadParticipant();
  }, [webinarId]);

  return { participant, loading, joinWebinar, getStoredPhone };
};

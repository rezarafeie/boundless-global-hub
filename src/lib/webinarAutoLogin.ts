import { supabase } from '@/integrations/supabase/client';

export const normalizeWebinarPhone = (phone: string): string => {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('00')) cleaned = '+' + cleaned.substring(2);
    else if (cleaned.startsWith('0')) cleaned = '+98' + cleaned.substring(1);
    else cleaned = '+' + cleaned;
  }
  return cleaned;
};

export const getWlTokenFromUrl = (): string | null => {
  try {
    return new URL(window.location.href).searchParams.get('wl');
  } catch {
    return null;
  }
};

export const clearWlFromUrl = () => {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('wl')) return;
    url.searchParams.delete('wl');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch {
    /* noop */
  }
};

/**
 * Consume a one-click webinar login token (?wl=...) coming from Telegram.
 * Registers the participant and stores the session phone in localStorage.
 * Returns the webinar slug/id on success so callers can redirect to the live page.
 */
export const consumeWebinarLoginToken = async (
  token: string,
  expectedWebinarId?: string,
): Promise<{ webinarId: string; slug: string | null; participant: any } | null> => {
  try {
    const { data: tok } = await supabase
      .from('webinar_login_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (!tok) return null;
    if (expectedWebinarId && tok.webinar_id !== expectedWebinarId) return null;

    const phone = normalizeWebinarPhone(tok.phone || '');
    if (!phone || phone === '+') return null;

    const { data: participant, error } = await supabase
      .from('webinar_participants')
      .upsert(
        { webinar_id: tok.webinar_id, phone, display_name: tok.display_name || null },
        { onConflict: 'webinar_id,phone' },
      )
      .select()
      .single();

    if (error) {
      console.error('Webinar auto-login upsert failed:', error);
      return null;
    }

    localStorage.setItem(`webinar_phone_${tok.webinar_id}`, phone);

    // Best-effort usage counter (may be blocked by RLS)
    supabase
      .from('webinar_login_tokens')
      .update({ used_count: (tok.used_count || 0) + 1 })
      .eq('id', tok.id)
      .then(() => {}, () => {});

    let slug: string | null = null;
    const { data: w } = await supabase
      .from('webinar_entries')
      .select('slug')
      .eq('id', tok.webinar_id)
      .maybeSingle();
    slug = w?.slug ?? null;

    return { webinarId: tok.webinar_id, slug, participant };
  } catch (err) {
    console.error('Webinar auto-login failed:', err);
    return null;
  }
};

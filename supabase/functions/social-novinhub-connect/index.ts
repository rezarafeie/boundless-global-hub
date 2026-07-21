import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { novinhub } from '../_shared/novinhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const accounts = await novinhub.listAccounts();
    const list = Array.isArray(accounts) ? accounts : (accounts?.data || []);

    const rows = list.map((a: any) => ({
      provider: (a.type || 'instagram').toLowerCase(),
      novinhub_account_id: String(a.id),
      novinhub_identifier: a.identifier || null,
      username: a.name || a.username || '',
      profile_pic_url: a.profile_image_url || a.profile_url || null,
      can_send_direct: a.can_send_direct === 1 || a.can_send_direct === true,
      can_send_comment: a.can_send_comment === 1 || a.can_send_comment === true,
      can_send_post: a.can_send_post === 1 || a.can_send_post === true,
      login_required: a.login_required === 1 || a.login_required === true,
      last_sync_at: new Date().toISOString(),
      meta: a,
    }));

    if (rows.length) {
      const { error } = await supabase
        .from('social_accounts')
        .upsert(rows, { onConflict: 'provider,novinhub_account_id' });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, synced: rows.length, accounts: rows }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('connect error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

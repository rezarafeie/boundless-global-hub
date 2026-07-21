// Live-fetch comments from NovinHub for a given post or account. No persistence.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { nhFetch } from '../_shared/novinhub.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const { account_id, post_id, limit = 50 } = body as any;

    // Resolve account.
    let accounts: any[] = [];
    if (account_id) {
      const { data } = await supabase.from('social_accounts').select('id, novinhub_account_id, username').eq('id', account_id).limit(1);
      accounts = data || [];
    } else {
      const { data } = await supabase.from('social_accounts').select('id, novinhub_account_id, username').eq('is_active', true);
      accounts = data || [];
    }
    if (!accounts.length) throw new Error('No active accounts');

    const acctById = new Map(accounts.map(a => [String(a.novinhub_account_id), a]));

    const path = post_id
      ? `/comment?post_id=${encodeURIComponent(post_id)}&limit=${limit}`
      : `/comment?limit=${limit}`;
    const res: any = await nhFetch(path).catch(() => null);
    const raw = res?.data || [];

    const comments = raw
      .filter((c: any) => acctById.has(String(c.account_id)))
      .map((c: any) => {
        const author = c.socialUser || c.from || {};
        const acc = acctById.get(String(c.account_id))!;
        return {
          id: String(c.id),
          provider_post_id: c.post_id ? String(c.post_id) : null,
          parent_comment_id: c.parent_id ? String(c.parent_id) : null,
          account_id: acc.id,
          account_username: acc.username,
          author_username: author.username || author.name || null,
          author_name: author.name || null,
          author_pic_url: author.image || null,
          text: c.text || '',
          status: c.status === 1 ? 'replied' : 'new',
          is_reply: !!c.parent_id,
          created_at: c.created_at || c.date || null,
        };
      });

    return new Response(JSON.stringify({ ok: true, comments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('fetch-comments:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

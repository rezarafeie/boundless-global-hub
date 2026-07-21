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

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const specificAccountId: string | undefined = body.account_id;

    let q = supabase.from('social_accounts').select('id, provider, novinhub_account_id, username');
    if (specificAccountId) q = q.eq('id', specificAccountId);
    const { data: accounts, error } = await q;
    if (error) throw error;

    let totalUpserts = 0;
    const perAccount: any[] = [];

    for (const acc of accounts || []) {
      try {
        if (!acc.novinhub_account_id) continue;
        const res = await novinhub.fetchAccountPosts(acc.novinhub_account_id);
        const list: any[] = Array.isArray(res) ? res : (res?.data || []);
        const rows = list.map((p: any) => ({
          account_id: acc.id,
          provider_post_id: String(p.id ?? p.pk ?? p.provider_id ?? p.shortcode ?? ''),
          post_type: p.type || p.media_type || p.post_type || 'post',
          caption: p.caption || p.text || null,
          media_url: p.media_url || p.thumbnail_url || p.image_url || (Array.isArray(p.media) && p.media[0]?.url) || null,
          thumbnail_url: p.thumbnail_url || null,
          permalink: p.permalink || p.link || null,
          published_at: p.published_at || p.created_at || p.taken_at || null,
          status: 'published',
          comments_count: p.comments_count ?? p.comment_count ?? 0,
          likes_count: p.likes_count ?? p.like_count ?? 0,
          meta: p,
        })).filter((r) => r.provider_post_id);

        if (rows.length) {
          const { error: upErr } = await supabase
            .from('social_posts')
            .upsert(rows, { onConflict: 'account_id,provider_post_id' });
          if (upErr) throw upErr;
          totalUpserts += rows.length;
        }
        perAccount.push({ account_id: acc.id, username: acc.username, count: rows.length });
      } catch (e: any) {
        console.error('sync error for account', acc.id, e?.message);
        perAccount.push({ account_id: acc.id, username: acc.username, error: e?.message || String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, upserted: totalUpserts, accounts: perAccount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

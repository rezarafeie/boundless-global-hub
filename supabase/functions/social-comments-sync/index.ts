// Refresh Instagram post stats only. Comments are fetched live via `social-fetch-comments`.
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

    const { data: accounts } = await supabase
      .from('social_accounts').select('*').eq('is_active', true).eq('provider', 'instagram');

    const postRes: any = await nhFetch('/post?limit=100').catch(() => null);
    const allPosts = postRes?.data || [];

    let postCount = 0;
    for (const acc of accounts || []) {
      const accId = String(acc.novinhub_account_id);
      const posts = allPosts.filter((p: any) => String(p.account_id) === accId);
      for (const p of posts) {
        const { error } = await supabase.from('social_posts').upsert({
          account_id: acc.id,
          provider_post_id: String(p.id),
          post_type: p.type || null,
          caption: p.caption || null,
          media_url: p.media_url || p.image || null,
          thumbnail_url: p.thumbnail || null,
          permalink: p.permalink || null,
          scheduled_at: p.schedule_date ? new Date(p.schedule_date.replace(' ', 'T') + 'Z').toISOString() : null,
          published_at: p.published_at ? new Date(p.published_at.replace(' ', 'T') + 'Z').toISOString() : (p.is_scheduled ? null : (p.created_at || null)),
          status: p.is_scheduled ? 'scheduled' : (p.status || 'published'),
          comments_count: p.comments_count ?? 0,
          likes_count: p.likes_count ?? 0,
          meta: p,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'account_id,provider_post_id' });
        if (!error) postCount++;
      }
    }

    return new Response(JSON.stringify({ ok: true, posts: postCount, comments: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

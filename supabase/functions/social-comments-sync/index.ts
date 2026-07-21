import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { novinhub, nhFetch } from '../_shared/novinhub.ts';

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

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'instagram');

    let commentCount = 0;
    let postCount = 0;

    // Fetch comments (global) then filter by account
    const commRes: any = await nhFetch('/comment?limit=100').catch(() => null);
    const allComments = commRes?.data || [];

    // Fetch posts (global) then filter
    const postRes: any = await nhFetch('/post?limit=100').catch(() => null);
    const allPosts = postRes?.data || [];

    for (const acc of accounts || []) {
      const accId = String(acc.novinhub_account_id);

      const posts = allPosts.filter((p: any) => String(p.account_id) === accId);
      for (const p of posts) {
        const row = {
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
        };
        const { error } = await supabase
          .from('social_posts')
          .upsert(row, { onConflict: 'account_id,provider_post_id' });
        if (!error) postCount++;
        else console.error('upsert post:', error);
      }

      const comments = allComments.filter((c: any) => String(c.account_id) === accId);
      for (const c of comments) {
        const author = c.socialUser || c.from || {};
        const row = {
          account_id: acc.id,
          provider_comment_id: String(c.id),
          provider_post_id: c.post_id ? String(c.post_id) : null,
          parent_comment_id: c.parent_id ? String(c.parent_id) : null,
          author_username: author.username || author.name || null,
          author_name: author.name || null,
          author_pic_url: author.image || null,
          text: c.text || '',
          status: c.status === 1 ? 'replied' : 'new',
          is_reply: !!c.parent_id,
          meta: c,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from('social_comments')
          .upsert(row, { onConflict: 'account_id,provider_comment_id' });
        if (!error) commentCount++;
        else console.error('upsert comment:', error);
      }
    }

    return new Response(JSON.stringify({ ok: true, comments: commentCount, posts: postCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

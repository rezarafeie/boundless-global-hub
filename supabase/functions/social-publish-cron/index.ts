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
    const specificId: string | undefined = body.scheduled_post_id;

    const selectSpec = '*, social_accounts!inner(id, novinhub_account_id, username, provider)';
    let query = supabase
      .from('social_scheduled_posts')
      .select(selectSpec)
      .limit(20);
    if (specificId) {
      query = query.eq('id', specificId);
    } else {
      query = query.eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString());
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    const results: any[] = [];
    for (const p of posts || []) {
      const acc = (p as any).social_accounts;
      try {
        await supabase.from('social_scheduled_posts').update({
          status: 'publishing',
          publish_attempts: (p.publish_attempts || 0) + 1,
          last_error: null,
        }).eq('id', p.id);

        const mediaUrls = Array.isArray(p.media_urls) ? p.media_urls as string[] : [];
        console.log('publishing', p.id, 'account', acc.novinhub_account_id, 'media', mediaUrls.length);

        // Sign fresh URLs in case originals are stale (for bucket paths ending in signed URL)
        const signed: string[] = [];
        for (const url of mediaUrls) {
          if (url.includes('/object/sign/social-media/')) {
            // Extract path after /social-media/
            const idx = url.indexOf('/social-media/');
            const path = url.substring(idx + '/social-media/'.length).split('?')[0];
            const { data: sig } = await supabase.storage.from('social-media').createSignedUrl(path, 60 * 60);
            signed.push(sig?.signedUrl || url);
          } else {
            signed.push(url);
          }
        }

        const scheduleDate = Math.floor((specificId ? Date.now() : Date.parse(p.scheduled_at || new Date().toISOString())) / 1000);
        const meta = (p as any).meta || {};
        let coverUrl: string | undefined = meta.cover_url;
        if (coverUrl && coverUrl.includes('/object/sign/social-media/')) {
          const idx = coverUrl.indexOf('/social-media/');
          const path = coverUrl.substring(idx + '/social-media/'.length).split('?')[0];
          const { data: sig } = await supabase.storage.from('social-media').createSignedUrl(path, 60 * 60);
          coverUrl = sig?.signedUrl || coverUrl;
        }
        const res = await novinhub.publishPost({
          account_id: acc.novinhub_account_id,
          caption: p.caption || '',
          media_urls: signed,
          type: p.post_type || 'post',
          is_scheduled: 0,
          schedule_date: scheduleDate,
          cover_url: coverUrl,
          collaborators: Array.isArray(meta.collaborators) ? meta.collaborators : undefined,
          first_comment: meta.first_comment || undefined,
        });

        const providerId = String(res?.id || res?.data?.id || res?.data?.post_group_id || '');

        await supabase.from('social_scheduled_posts').update({
          status: 'published',
          provider_post_id: providerId,
          published_at: new Date().toISOString(),
          last_error: null,
        }).eq('id', p.id);

        // Insert into social_posts so it shows up in "Posts" tab
        if (providerId) {
          await supabase.from('social_posts').upsert({
            account_id: acc.id,
            provider_post_id: providerId,
            post_type: p.post_type || 'post',
            caption: p.caption || null,
            media_url: signed[0] || null,
            status: 'published',
            published_at: new Date().toISOString(),
            meta: res,
          }, { onConflict: 'account_id,provider_post_id' });
        }

        await supabase.from('social_notifications').insert({
          account_id: acc.id,
          kind: 'post_published',
          title: 'پست منتشر شد',
          body: (p.caption || '').slice(0, 120),
          link: '/enroll/admin/social/planner',
        });

        results.push({ id: p.id, ok: true, provider_post_id: providerId });
      } catch (e: any) {
        const errMsg = e?.message?.slice(0, 500) || String(e);
        console.error('publish failed', p.id, errMsg);
        await supabase.from('social_scheduled_posts').update({
          status: (p.publish_attempts || 0) >= 2 ? 'failed' : 'scheduled',
          last_error: errMsg,
        }).eq('id', p.id);
        await supabase.from('social_notifications').insert({
          account_id: p.account_id,
          kind: 'post_failed',
          title: 'خطا در انتشار پست',
          body: errMsg.slice(0, 200),
        });
        results.push({ id: p.id, ok: false, error: errMsg });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('cron error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

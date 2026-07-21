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

    let q = supabase
      .from('social_scheduled_posts')
      .select('*, social_accounts!inner(id, novinhub_account_id, username)')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(20);
    if (specificId) q = supabase
      .from('social_scheduled_posts')
      .select('*, social_accounts!inner(id, novinhub_account_id, username)')
      .eq('id', specificId);

    const { data: posts, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    for (const p of posts || []) {
      try {
        await supabase.from('social_scheduled_posts').update({
          status: 'publishing',
          publish_attempts: (p.publish_attempts || 0) + 1,
        }).eq('id', p.id);

        const acc = (p as any).social_accounts;
        const res = await novinhub.publishPost({
          account_id: acc.novinhub_account_id,
          caption: p.caption || '',
          media_urls: Array.isArray(p.media_urls) ? p.media_urls : [],
          type: p.post_type || 'post',
        });

        await supabase.from('social_scheduled_posts').update({
          status: 'published',
          provider_post_id: String(res?.id || res?.data?.id || ''),
          published_at: new Date().toISOString(),
          last_error: null,
        }).eq('id', p.id);

        await supabase.from('social_notifications').insert({
          account_id: acc.id,
          kind: 'post_published',
          title: 'پست منتشر شد',
          body: (p.caption || '').slice(0, 120),
          link: '/enroll/admin/social/planner',
        });

        results.push({ id: p.id, ok: true });
      } catch (e: any) {
        await supabase.from('social_scheduled_posts').update({
          status: (p.publish_attempts || 0) >= 2 ? 'failed' : 'scheduled',
          last_error: e.message?.slice(0, 500) || String(e),
        }).eq('id', p.id);
        await supabase.from('social_notifications').insert({
          account_id: p.account_id,
          kind: 'post_failed',
          title: 'خطا در انتشار پست',
          body: e.message?.slice(0, 200) || String(e),
        });
        results.push({ id: p.id, ok: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

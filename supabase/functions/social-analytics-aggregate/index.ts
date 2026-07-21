import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const days = Math.min(Number(body.days) || 7, 60);

    const { data: accounts } = await supabase.from('social_accounts').select('id');
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    for (const acc of accounts) {
      for (let i = 0; i < days; i++) {
        const day = new Date();
        day.setUTCHours(0, 0, 0, 0);
        day.setUTCDate(day.getUTCDate() - i);
        const dayStr = day.toISOString().slice(0, 10);
        const nextDay = new Date(day); nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        // DM/comment counts are no longer stored locally. Use lightweight conversation activity as a proxy.
        const [{ count: convChangedCount }, { count: leadCount }, { count: publishedCount }] = await Promise.all([
          supabase.from('social_conversations').select('id', { count: 'exact', head: true })
            .eq('account_id', acc.id)
            .gte('last_message_at', day.toISOString()).lt('last_message_at', nextDay.toISOString()),
          supabase.from('social_leads').select('*', { count: 'exact', head: true })
            .eq('account_id', acc.id)
            .gte('created_at', day.toISOString()).lt('created_at', nextDay.toISOString()),
          supabase.from('social_scheduled_posts').select('*', { count: 'exact', head: true })
            .eq('account_id', acc.id).eq('status', 'published')
            .gte('published_at', day.toISOString()).lt('published_at', nextDay.toISOString()),
        ]);
        const dmCount = convChangedCount || 0;
        const replyCount = 0;
        const aiCount = 0;
        const commentCount = 0;


        await supabase.from('social_analytics_daily').upsert({
          account_id: acc.id,
          day: dayStr,
          dm_count: dmCount || 0,
          reply_count: replyCount || 0,
          ai_reply_count: aiCount || 0,
          comment_count: commentCount || 0,
          lead_count: leadCount || 0,
          posts_published: publishedCount || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'account_id,day' });

        results.push({ account_id: acc.id, day: dayStr });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

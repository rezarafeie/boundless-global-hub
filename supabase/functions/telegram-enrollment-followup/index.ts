// Hourly AI-personalized follow-up sender for Telegram-linked enrollments
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMessage, escapeHtml, mdToTelegramHtml, type InlineKeyboard } from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function tehranHour(): number {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }).format(new Date());
  return parseInt(s, 10);
}

async function getSettings() {
  const { data } = await supabase.from('admin_settings')
    .select('telegram_bot_username, telegram_miniapp_base_url, telegram_followup_ai_prompt')
    .eq('id', 1).maybeSingle();
  return {
    miniappBase: ((data as any)?.telegram_miniapp_base_url ?? 'https://academy.rafiei.co').replace(/\/+$/, ''),
    aiPrompt: (data as any)?.telegram_followup_ai_prompt ?? 'You are a helpful learning coach. Reply in Persian, brief and warm.',
  };
}

async function generateSsoUrl(enrollmentId: string, email: string | null, redirect: string): Promise<string> {
  if (!email) return redirect;
  try {
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-sso-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ enrollmentId, userEmail: email }),
    });
    const j = await r.json();
    const academy = j?.tokens?.find?.((t: any) => t.type === 'academy');
    if (academy?.url) return `${academy.url}&redirect=${encodeURIComponent(redirect)}`;
  } catch (e) { console.error('sso gen failed', e); }
  return redirect;
}

async function buildProgressContext(courseId: string, chatUserId: number) {
  const { data: lessons } = await supabase.from('course_lessons')
    .select('id, title, order_index, section_id')
    .eq('course_id', courseId).order('order_index');
  const all = lessons ?? [];
  const total = all.length;
  if (!total) return { total: 0, completed: 0, nextLesson: null as any };
  const { data: prog } = await supabase.from('user_lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', chatUserId).eq('course_id', courseId);
  const completedIds = new Set((prog ?? []).filter(p => p.is_completed).map(p => p.lesson_id));
  const nextLesson = all.find(l => !completedIds.has(l.id)) ?? null;
  return { total, completed: completedIds.size, nextLesson };
}

async function composeAiMessage(systemPrompt: string, userContext: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return '';
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContext },
        ],
      }),
    });
    if (!res.ok) { console.error('ai gateway error', res.status, await res.text()); return ''; }
    const j = await res.json();
    return j?.choices?.[0]?.message?.content ?? '';
  } catch (e) { console.error('ai gateway exception', e); return ''; }
}

async function processEnrollment(enr: any, settings: any) {
  try {
    const { data: course } = await supabase.from('courses')
      .select('id, title, slug, support_link').eq('id', enr.course_id).maybeSingle();
    if (!course) return;
    const { data: cu } = await supabase.from('chat_users')
      .select('id, name, email').eq('phone', enr.phone).maybeSingle();
    if (!cu) return;

    const progress = await buildProgressContext(course.id, cu.id);
    const isComplete = progress.total > 0 && progress.completed >= progress.total;

    const userContext = [
      `نام دانشجو: ${cu.name ?? ''}`,
      `دوره: ${course.title}`,
      `پیشرفت: ${progress.completed} از ${progress.total} درس کامل‌شده`,
      progress.nextLesson ? `درس بعدی: ${progress.nextLesson.title}` : `همه دروس کامل شده ✅`,
      isComplete ? `وضعیت: دوره کامل شده — او را تشویق کنید و دوره بعدی پیشنهاد دهید.` : `وضعیت: در حال یادگیری — او را برای ادامه ترغیب کنید.`,
    ].join('\n');

    const aiText = await composeAiMessage(settings.aiPrompt, userContext);
    const finalText = aiText
      ? mdToTelegramHtml(aiText)
      : (isComplete
          ? `🎉 <b>تبریک ${escapeHtml(cu.name ?? '')}!</b>\nشما دوره «${escapeHtml(course.title)}» را به پایان رساندید!`
          : `سلام ${escapeHtml(cu.name ?? '')} 👋\nدرس بعدی شما در دوره «${escapeHtml(course.title)}» منتظر است: <b>${escapeHtml(progress.nextLesson?.title ?? '')}</b>`);

    const slugOrId = (course as any).slug ?? course.id;
    const redirect = `${settings.miniappBase}/app/course/${slugOrId}`;
    const ssoUrl = await generateSsoUrl(enr.id, cu.email ?? null, redirect);
    const kbd: InlineKeyboard = [
      [{ text: progress.nextLesson ? '▶️ ادامه درس (Mini App)' : '📚 مرور دوره', web_app: { url: ssoUrl } }],
      [{ text: '🌐 باز کردن در مرورگر', url: ssoUrl }],
    ];
    if ((course as any).support_link) kbd.push([{ text: '🎧 پشتیبانی', url: (course as any).support_link }]);
    kbd.push([{ text: '⏰ تغییر زمان یادآوری', callback_data: `enroll:settime:${enr.id}` }]);

    await sendMessage(enr.telegram_chat_id, finalText, { keyboard: kbd });
    await supabase.from('enrollments').update({
      followup_last_at: new Date().toISOString(),
      followup_state: isComplete ? 'completed' : 'active',
    }).eq('id', enr.id);
  } catch (e) {
    console.error('processEnrollment error', enr.id, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const hour = tehranHour();
    const cutoff = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

    // Find due enrollments
    const { data: dueRaw } = await supabase
      .from('enrollments')
      .select('id, phone, course_id, telegram_chat_id, followup_hour_tehran, followup_last_at')
      .not('telegram_chat_id', 'is', null)
      .eq('followup_hour_tehran', hour)
      .limit(200);

    const due = (dueRaw ?? []).filter(e => !e.followup_last_at || e.followup_last_at < cutoff);
    if (!due.length) {
      return new Response(JSON.stringify({ ok: true, hour, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filter by course flag
    const courseIds = [...new Set(due.map(e => e.course_id))];
    const { data: courses } = await supabase.from('courses')
      .select('id, rafiei_bot_followup_enabled').in('id', courseIds);
    const enabled = new Set((courses ?? []).filter(c => (c as any).rafiei_bot_followup_enabled).map(c => c.id));
    const filtered = due.filter(e => enabled.has(e.course_id));

    const settings = await getSettings();
    let sent = 0;
    for (const enr of filtered) {
      await processEnrollment(enr, settings);
      sent++;
    }
    return new Response(JSON.stringify({ ok: true, hour, processed: sent, due: due.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('followup error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

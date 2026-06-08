// Personalized multi-trigger Telegram coach.
// Two responsibilities per invocation:
//   1. Drain pending telegram_notification_queue rows for lesson/course completion events.
//   2. On hourly tick (?mode=hourly or ?hourly=1, or whenever within the first 10 min of the Tehran hour):
//      - Send daily-hour reminders (legacy behavior).
//      - Send tiered inactivity nudges (3/7/14 days).
//      - Send periodic coaching check-ins.
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
function tehranMinute(): number {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', minute: '2-digit', hour12: false }).format(new Date());
  return parseInt(s, 10);
}

const COACHING_QUESTIONS = [
  'بزرگ‌ترین چالش‌ت توی یادگیری این دوره الان چیه؟ کوتاه بنویس تا کمک کنم.',
  'تا اینجا چه بخشی از دوره برات از همه مفیدتر بوده؟',
  'دوست داری در ادامه روی چه موضوعی بیشتر تمرکز کنیم؟',
  'اگر یه چیز بود که جلوی پیشرفت‌ت رو می‌گرفت، اون چی بود؟',
  'هدف اصلی‌ات از این دوره چیه؟ یادآوری‌اش کنیم تا تمرکزت بیشتر بشه.',
];

async function getSettings() {
  const { data } = await supabase.from('admin_settings')
    .select('telegram_bot_username, telegram_miniapp_base_url, telegram_followup_ai_prompt')
    .eq('id', 1).maybeSingle();
  return {
    miniappBase: ((data as any)?.telegram_miniapp_base_url ?? 'https://academy.rafiei.co').replace(/\/+$/, ''),
    aiPrompt: (data as any)?.telegram_followup_ai_prompt
      ?? 'تو یک کوچ یادگیری گرم، حمایت‌گر و کوتاه‌نویس هستی. به فارسی پاسخ بده، ۲–۵ جمله، با احساس صمیمی. از ایموجی محدود ولی به‌جا استفاده کن.',
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

async function getEnrollmentBundle(enrollmentId: string) {
  const { data: enr } = await supabase.from('enrollments')
    .select('*').eq('id', enrollmentId).maybeSingle();
  if (!enr) return null;
  const { data: course } = await supabase.from('courses')
    .select('id, title, slug, support_link, rafiei_bot_followup_enabled, rafiei_bot_followup_config')
    .eq('id', enr.course_id).maybeSingle();
  if (!course) return null;
  const { data: cu } = await supabase.from('chat_users')
    .select('id, name, email').eq('phone', enr.phone).maybeSingle();
  if (!cu) return null;
  return { enr, course, cu };
}

function courseFollowupConfig(course: any) {
  const c = course?.rafiei_bot_followup_config ?? {};
  return {
    lesson_complete: c.lesson_complete !== false,
    course_complete: c.course_complete !== false,
    inactivity: c.inactivity !== false,
    coaching: c.coaching !== false,
  };
}

async function recordEvent(enrollmentId: string, eventType: string, message: string, payload: Record<string, unknown>) {
  await supabase.from('enrollment_followup_events').insert({
    enrollment_id: enrollmentId,
    event_type: eventType,
    payload,
    message_text: message,
  });
  await supabase.from('enrollments')
    .update({ followup_last_at: new Date().toISOString() })
    .eq('id', enrollmentId);
}

async function recentAutoMessageWithinHours(enrollmentId: string, hours: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { count } = await supabase.from('enrollment_followup_events')
    .select('id', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
    .gte('sent_at', cutoff);
  return (count ?? 0) > 0;
}

async function buildCtaKeyboard(course: any, enrollmentId: string, email: string | null, label: string): Promise<InlineKeyboard> {
  const slugOrId = course.slug ?? course.id;
  const redirect = `https://academy.rafiei.co/app/course/${slugOrId}`;
  const ssoUrl = await generateSsoUrl(enrollmentId, email, redirect);
  const kbd: InlineKeyboard = [
    [{ text: label, web_app: { url: ssoUrl } }],
    [{ text: '🌐 باز کردن در مرورگر', url: ssoUrl }],
  ];
  if (course.support_link) kbd.push([{ text: '🎧 پشتیبانی', url: course.support_link }]);
  return kbd;
}

// ---------- Queue events ----------
async function processQueueRow(row: any, settings: any) {
  const payload = row.payload ?? {};
  const enrollmentId = payload.enrollment_id;
  if (!enrollmentId) return;
  const bundle = await getEnrollmentBundle(enrollmentId);
  if (!bundle) return;
  const { enr, course, cu } = bundle;
  const cfg = courseFollowupConfig(course);
  const isLesson = row.notification_type === 'enrollment_lesson_complete';
  const isCourse = row.notification_type === 'enrollment_course_complete';
  if (isLesson && !cfg.lesson_complete) return;
  if (isCourse && !cfg.course_complete) return;
  if (!course.rafiei_bot_followup_enabled) return;

  // Lesson-complete dedupe: skip if a lesson_completed event for this enrollment was sent in last 6h
  if (isLesson) {
    const cutoff = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { count } = await supabase.from('enrollment_followup_events')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_id', enrollmentId)
      .eq('event_type', 'lesson_completed')
      .gte('sent_at', cutoff);
    if ((count ?? 0) > 0) return;
  }

  const progress = await buildProgressContext(course.id, cu.id);
  const userContext = [
    `رویداد: ${isCourse ? 'پایان دوره' : 'اتمام یک درس'}`,
    `نام دانشجو: ${cu.name ?? ''}`,
    `دوره: ${course.title}`,
    `درس تمام‌شده: ${payload.lesson_title ?? ''}`,
    `پیشرفت: ${progress.completed} از ${progress.total}`,
    progress.nextLesson ? `درس بعدی: ${progress.nextLesson.title}` : 'همه دروس کامل شده ✅',
    isCourse
      ? 'پیامی صمیمانه برای پایان دوره بنویس؛ او را تبریک بگو و بپرس چه چیزی برایش از همه مفیدتر بود.'
      : 'پیامی کوتاه و انرژی‌بخش بنویس؛ به درس تمام‌شده اشاره کن و او را برای درس بعدی تشویق کن.',
  ].join('\n');

  const aiText = await composeAiMessage(settings.aiPrompt, userContext);
  const fallback = isCourse
    ? `🎉 <b>تبریک ${escapeHtml(cu.name ?? '')}!</b>\nدوره «${escapeHtml(course.title)}» رو به پایان رساندی!`
    : `آفرین ${escapeHtml(cu.name ?? '')} 👏\nدرس «${escapeHtml(payload.lesson_title ?? '')}» تموم شد. ${progress.nextLesson ? `درس بعدی: <b>${escapeHtml(progress.nextLesson.title)}</b>` : ''}`;
  const finalText = aiText ? mdToTelegramHtml(aiText) : fallback;

  const kbd = await buildCtaKeyboard(
    course,
    enr.id,
    cu.email ?? null,
    isCourse ? '📚 مرور دوره' : '▶️ ادامه درس (Mini App)',
  );
  await sendMessage(enr.telegram_chat_id, finalText, { keyboard: kbd });
  await recordEvent(
    enr.id,
    isCourse ? 'course_completed' : 'lesson_completed',
    finalText,
    { lesson_id: payload.lesson_id, lesson_title: payload.lesson_title, progress: { done: progress.completed, total: progress.total } },
  );
}

async function drainQueue(settings: any) {
  const { data: rows } = await supabase.from('telegram_notification_queue')
    .select('*')
    .in('notification_type', ['enrollment_lesson_complete', 'enrollment_course_complete'])
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(40);
  let n = 0;
  for (const row of rows ?? []) {
    try {
      await processQueueRow(row, settings);
      await supabase.from('telegram_notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);
      n++;
    } catch (e: any) {
      console.error('queue row failed', row.id, e);
      await supabase.from('telegram_notification_queue')
        .update({ status: 'failed', last_error: e?.message ?? String(e), attempts: (row.attempts ?? 0) + 1 })
        .eq('id', row.id);
    }
  }
  return n;
}

// ---------- Hourly daily-hour reminder (legacy) ----------
async function processDailyHourReminder(enr: any, settings: any) {
  const bundle = await getEnrollmentBundle(enr.id);
  if (!bundle) return;
  const { course, cu } = bundle;
  if (!course.rafiei_bot_followup_enabled) return;
  if (await recentAutoMessageWithinHours(enr.id, 24)) return;

  const progress = await buildProgressContext(course.id, cu.id);
  const isComplete = progress.total > 0 && progress.completed >= progress.total;
  const userContext = [
    `رویداد: یادآوری روزانه ساعت ${enr.followup_hour_tehran}`,
    `نام دانشجو: ${cu.name ?? ''}`,
    `دوره: ${course.title}`,
    `پیشرفت: ${progress.completed} از ${progress.total}`,
    progress.nextLesson ? `درس بعدی: ${progress.nextLesson.title}` : 'همه دروس کامل شده ✅',
    isComplete ? 'دوره کامل شده — او را تشویق کن.' : 'او را برای ادامه ترغیب کن.',
  ].join('\n');
  const aiText = await composeAiMessage(settings.aiPrompt, userContext);
  const fallback = isComplete
    ? `🎉 <b>تبریک ${escapeHtml(cu.name ?? '')}!</b>\nدوره «${escapeHtml(course.title)}» تموم شد!`
    : `سلام ${escapeHtml(cu.name ?? '')} 👋\nدرس بعدی منتظره: <b>${escapeHtml(progress.nextLesson?.title ?? '')}</b>`;
  const finalText = aiText ? mdToTelegramHtml(aiText) : fallback;
  const kbd = await buildCtaKeyboard(course, enr.id, cu.email ?? null,
    progress.nextLesson ? '▶️ ادامه درس (Mini App)' : '📚 مرور دوره');
  kbd.push([{ text: '⏰ تغییر زمان یادآوری', callback_data: `enroll:settime:${enr.id}` }]);
  await sendMessage(enr.telegram_chat_id, finalText, { keyboard: kbd });
  await recordEvent(enr.id, 'daily_hour', finalText, { hour: enr.followup_hour_tehran });
}

async function dailyHourPass(settings: any) {
  const hour = tehranHour();
  const { data: dueRaw } = await supabase
    .from('enrollments')
    .select('id, phone, course_id, telegram_chat_id, followup_hour_tehran')
    .not('telegram_chat_id', 'is', null)
    .eq('followup_hour_tehran', hour)
    .limit(300);
  let n = 0;
  for (const e of dueRaw ?? []) {
    try { await processDailyHourReminder(e, settings); n++; }
    catch (err) { console.error('daily hour failed', e.id, err); }
  }
  return n;
}

// ---------- Inactivity tiers ----------
async function inactivityPass(settings: any) {
  const TIERS: Array<{ days: number; stage: number; eventType: string }> = [
    { days: 3, stage: 1, eventType: 'inactivity_3d' },
    { days: 7, stage: 2, eventType: 'inactivity_7d' },
    { days: 14, stage: 3, eventType: 'inactivity_14d' },
  ];
  let n = 0;
  for (const tier of TIERS) {
    const cutoff = new Date(Date.now() - tier.days * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await supabase
      .from('enrollments')
      .select('id, phone, course_id, telegram_chat_id, last_activity_at, inactivity_stage, followup_state')
      .not('telegram_chat_id', 'is', null)
      .lt('inactivity_stage', tier.stage)
      .or(`last_activity_at.lte.${cutoff},last_activity_at.is.null`)
      .neq('followup_state', 'completed')
      .limit(150);
    for (const enr of rows ?? []) {
      try {
        const bundle = await getEnrollmentBundle(enr.id);
        if (!bundle) continue;
        const { course, cu } = bundle;
        if (!course.rafiei_bot_followup_enabled) continue;
        const cfg = courseFollowupConfig(course);
        if (!cfg.inactivity) continue;
        if (await recentAutoMessageWithinHours(enr.id, 36)) continue;
        const progress = await buildProgressContext(course.id, cu.id);
        if (progress.total > 0 && progress.completed >= progress.total) continue;
        const userContext = [
          `رویداد: یادآوری غیبت ${tier.days} روزه`,
          `نام دانشجو: ${cu.name ?? ''}`,
          `دوره: ${course.title}`,
          `پیشرفت: ${progress.completed} از ${progress.total}`,
          progress.nextLesson ? `درس بعدی: ${progress.nextLesson.title}` : '',
          tier.days >= 14
            ? 'با لحن دلسوز بپرس چه چیزی مانع ادامه‌اش شده و یک سوال کوچینگ کوتاه بپرس.'
            : tier.days >= 7
            ? 'با انگیزه و یادآوری پیشرفت، او را به ادامه دعوت کن.'
            : 'با لحن گرم و کوتاه بگو دلتنگت بودیم و درس بعدی منتظر است.',
        ].join('\n');
        const aiText = await composeAiMessage(settings.aiPrompt, userContext);
        const fallback = `سلام ${escapeHtml(cu.name ?? '')} 👋\nچند روزی هست سراغ «${escapeHtml(course.title)}» نیومدی. درس بعدی منتظرته!`;
        const finalText = aiText ? mdToTelegramHtml(aiText) : fallback;
        const kbd = await buildCtaKeyboard(course, enr.id, cu.email ?? null, '▶️ بازگشت به دوره');
        if (tier.days >= 14) {
          kbd.push([{ text: '💬 چی مانعم میشه؟', callback_data: `coach:reply:${enr.id}` }]);
        }
        await sendMessage(enr.telegram_chat_id, finalText, { keyboard: kbd });
        await recordEvent(enr.id, tier.eventType, finalText, { tier: tier.days });
        await supabase.from('enrollments').update({ inactivity_stage: tier.stage }).eq('id', enr.id);
        n++;
      } catch (err) { console.error('inactivity failed', enr.id, err); }
    }
  }
  return n;
}

// ---------- Coaching check-in ----------
async function coachingPass(settings: any) {
  // Eligible: counter >= 5 OR last coaching event > 10 days ago.
  const { data: rows } = await supabase
    .from('enrollments')
    .select('id, phone, course_id, telegram_chat_id, coaching_lessons_since_checkin, followup_state')
    .not('telegram_chat_id', 'is', null)
    .gte('coaching_lessons_since_checkin', 5)
    .neq('followup_state', 'completed')
    .limit(100);
  let n = 0;
  for (const enr of rows ?? []) {
    try {
      const bundle = await getEnrollmentBundle(enr.id);
      if (!bundle) continue;
      const { course, cu } = bundle;
      if (!course.rafiei_bot_followup_enabled) continue;
      const cfg = courseFollowupConfig(course);
      if (!cfg.coaching) continue;
      if (await recentAutoMessageWithinHours(enr.id, 48)) continue;
      const question = COACHING_QUESTIONS[Math.floor(Math.random() * COACHING_QUESTIONS.length)];
      const text = `سلام ${escapeHtml(cu.name ?? '')} 🌿\nیه سوال کوتاه برای اینکه بهتر کمکت کنم:\n\n<b>${escapeHtml(question)}</b>\n\nهمین‌جا توی همین چت جواب بده.`;
      await sendMessage(enr.telegram_chat_id, text);
      await recordEvent(enr.id, 'coaching_checkin', text, { question });
      await supabase.from('enrollments').update({ coaching_lessons_since_checkin: 0 }).eq('id', enr.id);
      n++;
    } catch (err) { console.error('coaching failed', enr.id, err); }
  }
  return n;
}

// ---------- Telegram-not-activated nudges (in-app push) ----------
// Reminds users who paid for a follow-up-enabled course but never linked Telegram.
// Tiers (days after enrollment): 1, 3, 7. Then a final reminder at 14 days.
async function activationNudgePass() {
  const TIERS: Array<{ days: number; eventType: string; title: string; body: (name: string, course: string) => string }> = [
    { days: 1, eventType: 'activation_nudge_1d', title: '🤖 کوچ تلگرام رو فعال کن',
      body: (n, c) => `${n} عزیز، کوچ شخصی تلگرام دوره «${c}» هنوز فعال نشده. با یک کلیک فعالش کن تا یادآوری‌ها و پشتیبانی شخصی‌ت رو روی تلگرام بگیری.` },
    { days: 3, eventType: 'activation_nudge_3d', title: '⏰ هنوز فعال نکردی!',
      body: (n, c) => `${n} جان، ۳ روزه ثبت‌نام کردی ولی کوچ تلگرام «${c}» رو فعال نکردی. از پیگیری‌های شخصی و یادآوری درس‌ها جا می‌مونی.` },
    { days: 7, eventType: 'activation_nudge_7d', title: '🎯 آخرین فرصت فعال‌سازی کوچ',
      body: (n, c) => `${n} عزیز، یه هفته‌ست منتظر فعال‌سازی کوچ تلگرام «${c}» هستیم. همین حالا فعالش کن تا مسیر یادگیریت رو با هم پیش ببریم.` },
    { days: 14, eventType: 'activation_nudge_14d', title: '💬 کمکی از دست‌مون برمیاد؟',
      body: (n, c) => `${n} جان، هنوز کوچ تلگرام «${c}» فعال نشده. اگه سوال یا مشکلی هست به ما بگو، کنارت هستیم.` },
  ];
  let n = 0;
  for (const tier of TIERS) {
    const upper = new Date(Date.now() - tier.days * 24 * 3600 * 1000).toISOString();
    const lower = new Date(Date.now() - (tier.days + 14) * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await supabase
      .from('enrollments')
      .select('id, full_name, phone, email, course_id, created_at, chat_user_id, payment_status, telegram_chat_id, courses!inner(id, title, slug, rafiei_bot_followup_enabled)')
      .is('telegram_chat_id', null)
      .in('payment_status', ['completed', 'success'])
      .lte('created_at', upper)
      .gte('created_at', lower)
      .limit(200);
    for (const enr of (rows ?? []) as any[]) {
      try {
        const course = enr.courses;
        if (!course?.rafiei_bot_followup_enabled) continue;
        // Dedupe: skip if this tier already fired for this enrollment
        const { count } = await supabase.from('enrollment_followup_events')
          .select('id', { count: 'exact', head: true })
          .eq('enrollment_id', enr.id)
          .eq('event_type', tier.eventType);
        if ((count ?? 0) > 0) continue;

        const name = (enr.full_name ?? '').split(' ')[0] || 'دوست عزیز';
        const title = tier.title;
        const body = tier.body(name, course.title);

        // Send in-app/browser push via OneSignal if we have a chat user
        if (enr.chat_user_id) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-onesignal-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({
                recipientUserIds: [enr.chat_user_id],
                message: {
                  id: Date.now(),
                  text: body,
                  senderName: title,
                  senderId: 1,
                  timestamp: new Date().toISOString(),
                },
              }),
            });
          } catch (e) { console.error('onesignal nudge failed', enr.id, e); }
        }

        await recordEvent(enr.id, tier.eventType, body, {
          tier: tier.days,
          channel: 'onesignal',
          course_id: course.id,
          course_title: course.title,
        });
        n++;
      } catch (err) { console.error('activation nudge failed', enr.id, err); }
    }
  }
  return n;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const forceHourly = url.searchParams.get('mode') === 'hourly' || url.searchParams.get('hourly') === '1';
    const queueOnly = url.searchParams.get('mode') === 'queue';
    const isHourly = !queueOnly && (forceHourly || tehranMinute() < 10);

    const settings = await getSettings();
    const queueProcessed = await drainQueue(settings);
    let daily = 0, inactivity = 0, coaching = 0, activation = 0;
    if (isHourly) {
      daily = await dailyHourPass(settings);
      inactivity = await inactivityPass(settings);
      coaching = await coachingPass(settings);
      activation = await activationNudgePass();
    }
    return new Response(JSON.stringify({ ok: true, queueProcessed, daily, inactivity, coaching, activation, isHourly }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('followup error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

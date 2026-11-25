import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireSocialAdmin } from '../_shared/social-enrollment.ts';
import { sendOrQueue } from '../_shared/activation-messages.ts';
import { escapeHtml } from '../_shared/telegram.ts';

// One-off admin repair: re-send the course activation welcome into the Telegram Business
// support chat for activations whose short (base62) code was not detected there.
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const internal = Deno.env.get('CALLCENTER_INTERNAL_SECRET');
  const given = req.headers.get('x-internal-secret');
  const internalOk = !!internal && !!given && given.length === internal.length && [...given].reduce((d, ch, i) => d | (ch.charCodeAt(0) ^ internal.charCodeAt(i)), 0) === 0;
  if (!internalOk) try { await requireSocialAdmin(req, db as any); } catch { return json({ error: 'دسترسی مدیریت معتبر نیست' }, 403); }
  const body = await req.json().catch(() => ({}));
  const dryRun = body?.dry_run !== false;

  const { data: s } = await db.from('admin_settings').select('telegram_business_connection_id').eq('id', 1).maybeSingle();
  const bcid = (s as any)?.telegram_business_connection_id;
  if (!bcid) return json({ error: 'telegram_business_connection_id is not configured' }, 400);

  const { data: acts, error } = await db.from('support_activations')
    .select('id, user_id, course_id, telegram_id, activation_token')
    .eq('status', 'activated').not('telegram_id', 'is', null)
    .gte('created_at', '2026-11-24T00:00:00Z').limit(500);
  if (error) return json({ error: error.message }, 500);
  const candidates = (acts ?? []).filter((a: any) => !/^[a-f0-9]{16,}$/.test(a.activation_token));
  const ids = candidates.map((a: any) => a.id);
  const { data: done } = ids.length ? await db.from('support_activation_events').select('support_activation_id')
    .in('support_activation_id', ids).in('event_type', ['business_welcome_resent', 'auto_activated_in_support_chat', 'reactivated_in_support_chat']) : { data: [] };
  const skip = new Set((done ?? []).map((d: any) => d.support_activation_id));
  const todo = candidates.filter((a: any) => !skip.has(a.id));
  if (dryRun) return json({ dry_run: true, count: todo.length });

  const results: any[] = [];
  for (const a of todo as any[]) {
    const [{ data: c }, { data: cu }] = await Promise.all([
      db.from('courses').select('title, slug, redirect_url, telegram_bot_activated_enabled, telegram_bot_activated_message').eq('id', a.course_id).maybeSingle(),
      db.from('chat_users').select('name, first_name').eq('id', a.user_id).maybeSingle(),
    ]);
    if ((c as any)?.telegram_bot_activated_enabled === false) { results.push({ id: a.id, skipped: 'disabled' }); continue; }
    const name = escapeHtml((cu as any)?.first_name || (cu as any)?.name || 'دوست عزیز');
    const title = escapeHtml((c as any)?.title || 'دوره');
    const tpl = (c as any)?.telegram_bot_activated_message || 'درود بر شما {{name}} 🌱\nپشتیبانی اختصاصی شما با موفقیت فعال شد ✅\n\nدسترسی به دوره «{{course_title}}» از دکمه زیر برای شما فعال است.\n\nبا آرزوی موفقیت\nتیم پشتیبانی آکادمی رفیعی';
    const text = tpl.replace(/\{\{name\}\}/g, name).replace(/\{\{course_title\}\}/g, title);
    const url = (c as any)?.redirect_url || ((c as any)?.slug ? `https://academy.rafiei.co/access?course=${(c as any).slug}` : null);
    try {
      const r: any = await sendOrQueue({ chatId: Number(a.telegram_id), text, keyboard: url ? [[{ text: '🚀 شروع و دسترسی به دوره', url }]] as any : undefined, businessConnectionId: bcid, source: 'business_welcome_resent' } as any);
      const ok = r?.ok !== false;
      await db.from('support_activation_events').insert({ support_activation_id: a.id, user_id: a.user_id, course_id: a.course_id, event_type: ok ? 'business_welcome_resent' : 'business_welcome_resend_failed', payload_json: { response: r ?? null } });
      results.push({ id: a.id, ok });
    } catch (e) { results.push({ id: a.id, ok: false, error: String(e) }); }
  }
  return json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => r.ok === false).length, results });
});

// Creates or returns a support_activations row for (user_id, course_id, enrollment_id).
// Also returns the encoded support prefilled link so the student card can render/refresh it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const body = await req.json().catch(() => ({}));
    const user_id = Number(body.user_id);
    const course_id = String(body.course_id ?? '');
    const enrollment_id = body.enrollment_id ? String(body.enrollment_id) : null;
    if (!user_id || !course_id) {
      return json({ error: 'user_id and course_id required' }, 400);
    }

    // Ensure row via SQL function
    const { data: rows, error: fnErr } = await supabase.rpc('ensure_support_activation', {
      p_user_id: user_id,
      p_course_id: course_id,
      p_enrollment_id: enrollment_id,
    });
    if (fnErr) return json({ error: fnErr.message }, 500);
    const row: any = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return json({ error: 'no row' }, 500);

    // Build support prefilled link + persist if empty
    const [{ data: course }, { data: user }] = await Promise.all([
      supabase.from('courses').select('title, support_link, smart_activation_telegram_link, telegram_activation_keyword, support_prefilled_message_template, slug').eq('id', course_id).maybeSingle(),
      supabase.from('chat_users').select('name, first_name, last_name, phone, email').eq('id', user_id).maybeSingle(),
    ]);

    const name = (user as any)?.first_name || (user as any)?.name || '';
    const lastname = (user as any)?.last_name || '';
    const phone = (user as any)?.phone || '';
    const email = (user as any)?.email || '';
    const courseTitle = (course as any)?.title || '';
    const keyword = String((course as any)?.telegram_activation_keyword || 'sact').trim();

    const applyPlaceholders = (s: string) =>
      s
        .replace(/\{name\}/gi, name)
        .replace(/\{first_name\}/gi, name)
        .replace(/\{lastname\}/gi, lastname)
        .replace(/\{last_name\}/gi, lastname)
        .replace(/\{phone\}/gi, phone)
        .replace(/\{email\}/gi, email)
        .replace(/\{course\}/gi, courseTitle)
        .replace(/\{course_title\}/gi, courseTitle)
        .replace(/\{user_id\}/gi, String(user_id))
        .replace(/\{course_id\}/gi, course_id)
        .replace(/\{keyword\}/gi, keyword)
        .replace(/\{activation_token\}/gi, row.activation_token ?? '');

    // Prefer the course's smart activation telegram link if configured.
    const smartLink: string = (course as any)?.smart_activation_telegram_link || '';
    let supportLink: string;

    if (smartLink && smartLink.trim()) {
      try {
        const u = new URL(smartLink.trim());
        const textParam = u.searchParams.get('text');
        if (textParam !== null) {
          u.searchParams.set('text', applyPlaceholders(textParam));
          supportLink = u.toString();
        } else {
          supportLink = applyPlaceholders(smartLink.trim());
        }
      } catch {
        supportLink = applyPlaceholders(smartLink.trim());
      }
    } else {
      const customTemplate: string = String((course as any)?.support_prefilled_message_template || '').trim();
      const defaultTemplate = [
        `🌟 {keyword} 🌟`,
        ``,
        `درود و وقت بخیر 🌱`,
        `برای فعال‌سازی پشتیبانی دوره «{course}» در خدمتتون هستم 🙌`,
        ``,
        `━━━━━━━━━━━━━━━`,
        `👤 نام: {name} {lastname}`,
        `📱 موبایل: {phone}`,
        `📧 ایمیل: {email}`,
        `━━━━━━━━━━━━━━━`,
        ``,
        `🏷 کلمه کلیدی: {keyword}`,
        `🔑 کد فعال‌سازی: {activation_token}`,
        ``,
        `🙏 ممنون از همراهی شما`,
      ].join('\n');

      const raw = applyPlaceholders(customTemplate || defaultTemplate);
      supportLink = `https://t.me/rafieiacademy?text=${encodeURIComponent(raw)}`;
    }


    if (!row.support_prefilled_link || row.support_prefilled_link !== supportLink) {
      await supabase
        .from('support_activations')
        .update({ support_prefilled_link: supportLink })
        .eq('id', row.id);
      row.support_prefilled_link = supportLink;
    }

    // Log dashboard_clicked event (best-effort)
    await supabase.from('support_activation_events').insert({
      support_activation_id: row.id,
      user_id,
      course_id,
      event_type: 'dashboard_clicked',
      payload_json: {},
    });

    return json({ activation: row });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

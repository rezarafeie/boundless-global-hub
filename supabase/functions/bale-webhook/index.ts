// Bale Bot webhook — account linking, course list and per-course support activation.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  baleCall,
  baleSendMessage,
  baleAnswerCallback,
  baleDeepLink,
  stripHtml,
  type BaleInlineKeyboard,
} from '../_shared/bale.ts';
import { ensureAccessWindow as gamEnsureAccessWindow } from '../_shared/gamification.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const MAIN_KBD: BaleInlineKeyboard = [
  [{ text: '📚 دوره‌های من', callback_data: 'bale:courses' }],
  [{ text: '🆔 شناسه من', callback_data: 'bale:myid' }],
];

function normalizePhone(p: string) {
  const d = String(p ?? '').replace(/\D/g, '');
  if (d.startsWith('98')) return '0' + d.slice(2);
  if (d.startsWith('0')) return d;
  if (d.length === 10) return '0' + d;
  return d;
}

async function findUserByChat(chat_id: number) {
  const { data } = await supabase
    .from('chat_users')
    .select('id, name, first_name, phone, email')
    .eq('bale_chat_id', chat_id)
    .maybeSingle();
  return data as any;
}

async function linkUser(userId: number, chat_id: number) {
  await supabase.from('chat_users').update({ bale_chat_id: null }).eq('bale_chat_id', chat_id);
  await supabase
    .from('chat_users')
    .update({ bale_chat_id: chat_id, bale_linked_at: new Date().toISOString() })
    .eq('id', userId);
}

async function sendCourses(chat_id: number, user: any) {
  if (!user) {
    await baleSendMessage(chat_id, 'برای دیدن دوره‌ها ابتدا شماره موبایل خود را به اشتراک بگذارید.', {
      replyKeyboard: [[{ text: '📱 ارسال شماره من', request_contact: true }]],
    });
    return;
  }
  const { data: enrs } = await supabase
    .from('enrollments')
    .select('id, course_id, courses(title, slug)')
    .eq('chat_user_id', user.id)
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);
  if (!enrs?.length) {
    await baleSendMessage(chat_id, 'هنوز دوره فعالی برای شما ثبت نشده است.');
    return;
  }
  const lines = enrs.map((e: any, i: number) => `${i + 1}. ${e.courses?.title ?? 'دوره'}`);
  await baleSendMessage(chat_id, ['📚 دوره‌های شما:', '', ...lines].join('\n'));
}

async function activateSupport(actId: string, chat_id: number) {
  const { data: act } = await supabase
    .from('support_activations')
    .select('id, user_id, course_id, status')
    .eq('id', actId)
    .maybeSingle();
  if (!act) return;

  await supabase
    .from('support_activations')
    .update({
      status: 'activated',
      activated_at: new Date().toISOString(),
      activation_channel: 'bale',
      bale_chat_id: chat_id,
    })
    .eq('id', act.id);

  await supabase.from('support_activation_events').insert({
    support_activation_id: act.id,
    user_id: (act as any).user_id,
    course_id: (act as any).course_id,
    event_type: 'activated',
    payload_json: { channel: 'bale', chat_id },
  });

  const { data: course } = await supabase
    .from('courses')
    .select('title, telegram_bot_activated_message, redirect_url, slug, support_link')
    .eq('id', (act as any).course_id)
    .maybeSingle();

  const msg = stripHtml(
    ((course as any)?.telegram_bot_activated_message as string | null) ||
      `✅ پشتیبانی دوره «${(course as any)?.title ?? ''}» برای شما فعال شد.\nاز این پس می‌توانید از همین‌جا پشتیبانی بگیرید.`,
  );
  const kbd: BaleInlineKeyboard = [];
  const url = (course as any)?.redirect_url || ((course as any)?.slug ? `https://academy.rafiei.co/course-access?course=${(course as any).slug}` : null);
  if (url) kbd.push([{ text: '🎓 ورود به دوره', url }]);
  await baleSendMessage(chat_id, msg, kbd.length ? { keyboard: kbd } : {});

  // Gamification welcome (safe no-op when disabled for the course)
  try {
    await gamEnsureAccessWindow(Number((act as any).user_id), String((act as any).course_id));
  } catch (e) {
    console.warn('bale gamification welcome failed', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let update: any = {};
  try {
    update = await req.json();
  } catch {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== Callback buttons =====
    const cb = update.callback_query;
    if (cb) {
      const chat_id = cb.message?.chat?.id;
      const data = String(cb.data ?? '');
      await baleAnswerCallback(cb.id).catch(() => {});
      if (chat_id) {
        if (data === 'bale:courses') {
          await sendCourses(chat_id, await findUserByChat(chat_id));
        } else if (data === 'bale:myid') {
          await baleSendMessage(chat_id, `🆔 شناسه گفتگوی شما: ${chat_id}`);
        } else if (data.startsWith('bsact:done:')) {
          await activateSupport(data.slice('bsact:done:'.length), chat_id);
        }
      }
      return new Response('ok', { headers: corsHeaders });
    }

    const msg = update.message ?? update.edited_message;
    const chat_id = msg?.chat?.id;
    if (!chat_id) return new Response('ok', { headers: corsHeaders });

    // ===== Contact share → link account by phone =====
    if (msg.contact?.phone_number) {
      const phone = normalizePhone(msg.contact.phone_number);
      const { data: cu } = await supabase
        .from('chat_users')
        .select('id, name, first_name')
        .eq('phone', phone)
        .maybeSingle();
      if (cu) {
        await linkUser((cu as any).id, chat_id);
        await baleSendMessage(chat_id, `✅ حساب شما با موفقیت متصل شد، ${(cu as any).first_name || (cu as any).name || 'دوست عزیز'} عزیز.`, {
          keyboard: MAIN_KBD,
        });
      } else {
        await baleSendMessage(chat_id, '❌ حسابی با این شماره در آکادمی پیدا نشد. ابتدا در سایت ثبت‌نام کنید.');
      }
      return new Response('ok', { headers: corsHeaders });
    }

    const text = String(msg.text ?? '').trim();
    const startMatch = text.match(/^\/start(?:\s+(\S+))?$/);
    const startPayload = startMatch?.[1] ?? null;
    const user = await findUserByChat(chat_id);

    // ===== Support activation deep link: /start sact_<token> =====
    if (startPayload?.startsWith('sact_')) {
      const token = startPayload.slice('sact_'.length);
      const { data: act } = await supabase
        .from('support_activations')
        .select('id, user_id, course_id, status')
        .eq('activation_token', token)
        .maybeSingle();
      if (!act) {
        await baleSendMessage(chat_id, '❌ لینک فعال‌سازی معتبر نیست. از داشبورد آکادمی دوباره تلاش کنید.');
        return new Response('ok', { headers: corsHeaders });
      }

      const { data: course } = await supabase
        .from('courses')
        .select('title, bale_bot_welcome_message, bale_activation_link, support_link')
        .eq('id', (act as any).course_id)
        .maybeSingle();

      await supabase
        .from('support_activations')
        .update({
          status: ['activated', 'pending_manual_confirmation', 'clicked_support_button'].includes((act as any).status)
            ? (act as any).status
            : 'opened_bot',
          opened_bot_at: new Date().toISOString(),
          activation_channel: 'bale',
          bale_chat_id: chat_id,
        })
        .eq('id', (act as any).id);

      await supabase.from('support_activation_events').insert({
        support_activation_id: (act as any).id,
        user_id: (act as any).user_id,
        course_id: (act as any).course_id,
        event_type: 'opened_bot',
        payload_json: { channel: 'bale', chat_id },
      });

      await linkUser(Number((act as any).user_id), chat_id).catch(() => {});

      const welcome = stripHtml(
        ((course as any)?.bale_bot_welcome_message as string | null) ||
          `درود 🌱\nبرای فعال‌سازی پشتیبانی دوره «${(course as any)?.title ?? ''}» روی دکمه زیر بزنید و پیام را ارسال کنید.`,
      );
      const supportUrl = (course as any)?.bale_activation_link || (course as any)?.support_link || null;
      const kbd: BaleInlineKeyboard = [];
      if (supportUrl) kbd.push([{ text: '🚀 ارسال پیام به پشتیبانی', url: supportUrl }]);
      kbd.push([{ text: '✅ فعال‌سازی را کامل کن', callback_data: `bsact:done:${(act as any).id}` }]);
      await baleSendMessage(chat_id, welcome, { keyboard: kbd });
      return new Response('ok', { headers: corsHeaders });
    }

    if (text === '/myid') {
      await baleSendMessage(chat_id, `🆔 شناسه گفتگوی شما: ${chat_id}`);
      return new Response('ok', { headers: corsHeaders });
    }

    if (startMatch || text === '/help') {
      if (user) {
        await baleSendMessage(
          chat_id,
          `درود ${user.first_name || user.name || 'دوست عزیز'} 🌱\nبه ربات آکادمی رفیعی در بله خوش آمدید.`,
          { keyboard: MAIN_KBD },
        );
      } else {
        await baleSendMessage(
          chat_id,
          'درود 🌱\nبه ربات آکادمی رفیعی در بله خوش آمدید.\nبرای اتصال حساب، شماره موبایل خود را با دکمه زیر ارسال کنید.',
          { replyKeyboard: [[{ text: '📱 ارسال شماره من', request_contact: true }]] },
        );
      }
      return new Response('ok', { headers: corsHeaders });
    }

    if (text) {
      await baleSendMessage(chat_id, 'برای شروع /start را بزنید.', user ? { keyboard: MAIN_KBD } : {});
    }
  } catch (e) {
    console.error('bale-webhook error', e);
  }

  return new Response('ok', { headers: corsHeaders });
});

// keep baleCall referenced for future methods
export { baleCall, baleDeepLink };

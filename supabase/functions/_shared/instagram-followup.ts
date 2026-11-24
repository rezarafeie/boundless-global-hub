import { supabase } from './supabase.ts';
import { novinhub } from './novinhub.ts';
import { ownsConversation, resolveFormContext } from './social-enrollment.ts';
import { instagramActivationPending, instagramEnrollmentMatches } from './instagram-followup-policy.ts';

// Read only server-owned enrollment events, never search recipients by name/phone.
export async function instagramFollowupTarget(row: any): Promise<string | null> {
  if (!row.enrollment_id) return null;
  const { data: enrollment, error: enrollmentError } = await supabase.from('enrollments')
    .select('id,chat_user_id,course_id,payment_status').eq('id', row.enrollment_id).maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!instagramEnrollmentMatches(row, enrollment)) return null;
  const { data: job, error } = await supabase.from('social_enrollment_events')
    .select('payload,rule_id,created_at').eq('enrollment_id', row.enrollment_id)
    .eq('status', 'completed').not('reply_sent_at', 'is', null)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!job?.rule_id) return null;
  const { data: rule, error: ruleError } = await supabase.from('social_enrollment_rules')
    .select('account_id,course_id').eq('id', job.rule_id).maybeSingle();
  if (ruleError) throw ruleError;
  if (!rule || String(rule.course_id) !== String(row.course_id)) return null;
  const { data: account, error: accountError } = await supabase.from('social_accounts')
    .select('novinhub_account_id').eq('id', rule.account_id).eq('provider', 'instagram')
    .eq('is_active', true).maybeSingle();
  if (accountError) throw accountError;
  if (!account?.novinhub_account_id) return null;
  // Older form events predate persisted resolution; reuse the same verified resolver.
  const event = await resolveFormContext(supabase, job.payload, job.created_at);
  const p = event.payload;
  const id = String(p.conversation_id ?? p.conversation?.id ?? p.messages?.[0]?.conversation_id ?? '');
  const socialId = String(p.social_user_id ?? p.socialUser?.id ?? '');
  if (!/^\d+$/.test(id) || !socialId) return null;
  const remote = await novinhub.getConversation(id);
  if (!ownsConversation(remote?.data ?? remote, String(account.novinhub_account_id), socialId)) {
    throw new Error('هویت دریافت‌کننده دایرکت با ثبت‌نام مطابقت ندارد');
  }
  return id;
}

export async function sendInstagramActivationFollowup(row: any, text: string, activationLink: string) {
  const conversationId = await instagramFollowupTarget(row);
  if (!conversationId) return { ok: true, skipped: true, unreachable: true, reason: 'ثبت‌نام به دایرکت تأییدشده اینستاگرام متصل نیست' };
  // Re-read immediately before delivery: the scheduler's initial row may now be stale.
  const { data: current, error } = await supabase.from('support_activations')
    .select('status,activated_at').eq('id', row.id).maybeSingle();
  if (error) throw error;
  if (!instagramActivationPending(current)) return { ok: true, skipped: true, reason: 'پشتیبانی قبلاً فعال شده است' };
  const content = activationLink && !text.includes(activationLink) ? `${text}\n\n${activationLink}` : text;
  if (!content.trim() || content.length > 1000) throw new Error('متن دایرکت همراه لینک باید بین ۱ تا ۱۰۰۰ کاراکتر باشد');
  const response = await novinhub.reply(conversationId, content);
  if (response?.success === false || response?.successful === false || response?.error) {
    throw new Error('نوین‌هاب ارسال پیگیری را تأیید نکرد');
  }
  // Button failure must never retry the already-delivered main message.
  let buttonSent = false;
  if (activationLink) {
    try {
      await novinhub.replyWithButton(conversationId, 'فعال‌سازی پشتیبانی', 'فعال‌سازی پشتیبانی', activationLink);
      buttonSent = true;
    } catch { console.warn('Instagram followup button unavailable'); }
  }
  return { ok: true, conversation_id: conversationId, button_sent: buttonSent };
}
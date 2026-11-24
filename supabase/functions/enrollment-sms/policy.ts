export const SMS_TEMPLATES = {
  welcome: 'rafieienrollmentwelcome',
  activation: 'rafieisupportactivation',
  start: 'rafieicoursestart',
} as const;
export type SmsKind = keyof typeof SMS_TEMPLATES;

export function normalizeSmsPhone(raw: string): string {
  const digits = raw.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g, '');
  const local = digits.replace(/^(0098|98)/, '');
  return /^9\d{9}$/.test(local) ? `0${local}` : local;
}

export function courseStarted(progress: any[]): boolean {
  return progress.some(p => p.is_opened === true || p.is_completed === true || Number(p.total_time_spent) > 0);
}

export function smsEligible(kind: SmsKind, activation: any, enrollment: any, started: boolean): boolean {
  if (!enrollment || !['completed', 'success'].includes(enrollment.payment_status) ||
    enrollment.id !== activation.enrollment_id || enrollment.chat_user_id !== activation.user_id ||
    enrollment.course_id !== activation.course_id) return false;
  const activated = activation.status === 'activated' && Boolean(activation.activated_at);
  if (kind === 'welcome') return true;
  if (kind === 'activation') return activation.status !== 'activated' && !activation.activated_at;
  return activated && !started;
}

export function accessValid(gamification: any, window: any, now = Date.now()): boolean {
  if (window?.status === 'locked' || window?.status === 'expired') return false;
  return !gamification?.enabled || Boolean(window && (window.status === 'completed' ||
    (window.status === 'active' && Date.parse(window.expires_at) > now)));
}

export function smsParameters(kind: SmsKind, name: string, title: string, code: string, phone: string) {
  if (!/^[A-Za-z0-9]{8,64}$/.test(code)) throw new Error('activation_or_login_code_invalid');
  const receptor = normalizeSmsPhone(phone);
  if (!/^09\d{9}$/.test(receptor)) throw new Error('iranian_mobile_required');
  const firstName = name.trim().split(/\s+/)[0] || 'دانشجو';
  const courseTitle = title.trim().replace(/\s+/g, ' ');
  if (!courseTitle || courseTitle.length > 100 || courseTitle.split(' ').length > 9) throw new Error('course_title_exceeds_template_limits');
  return new URLSearchParams({ receptor, token: firstName, token20: courseTitle, token2: code, template: SMS_TEMPLATES[kind] });
}

export function randomLoginCode(length = 10): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let code = '';
  while (code.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte < 248 && code.length < length) code += alphabet[byte % 62];
    }
  }
  return code;
}

export async function hashCode(code: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
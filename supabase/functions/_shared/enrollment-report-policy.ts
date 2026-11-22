import { parse, isValid } from 'npm:date-fns-jalali@4.1.0-0';

export type ReportPeriod = 'hour' | 'day' | 'week' | 'month';
const hours: Record<ReportPeriod, number> = { hour: 1, day: 24, week: 168, month: 720 };
export function reportRange(period: ReportPeriod, now = new Date()) {
  if (!(period in hours)) throw new Error('بازه نامعتبر است');
  return { from: new Date(now.getTime() - hours[period] * 3600000).toISOString(), to: now.toISOString() };
}
export function numericChatId(text: string): number | null {
  if (!/^[1-9]\d{4,15}$/.test(text.trim())) return null;
  const id = Number(text.trim());
  return Number.isSafeInteger(id) ? id : null;
}
export function reportAllowed(access: { active: boolean; can_manage: boolean } | null, manage = false) {
  return !!access?.active && (!manage || access.can_manage);
}
function digits(text: string) {
  return text.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
function localDate(text: string, end: boolean): Date {
  const m = digits(text.trim()).match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) throw new Error('تاریخ را مثل ۱۴۰۵/۰۹/۰۱ یا 2026-11-22 15:30 وارد کنید');
  let year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  const hour = Number(m[4] ?? 0), minute = Number(m[5] ?? 0);
  if (hour > 23 || minute > 59) throw new Error('ساعت نامعتبر است');
  if (year < 1700) {
    const date = parse(`${year}/${m[2]}/${m[3]}`, 'yyyy/MM/dd', new Date());
    if (!isValid(date)) throw new Error('تاریخ شمسی نامعتبر است');
    year = date.getFullYear(); month = date.getMonth() + 1; day = date.getDate();
  }
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) throw new Error('تاریخ نامعتبر است');
  // Tehran local time is UTC+03:30; a date-only end includes that whole day.
  return new Date(check.getTime() + (hour * 60 + minute - 210) * 60000 + (end && !m[4] ? 86400000 : 0));
}
export function customReportRange(text: string) {
  const parts = text.split(/\s+تا\s+|\s*\|\s*/);
  if (parts.length !== 2) throw new Error('تاریخ شروع و پایان را با «تا» جدا کنید');
  const from = localDate(parts[0], false), to = localDate(parts[1], true);
  if (from >= to) throw new Error('پایان بازه باید بعد از شروع باشد');
  return { from: from.toISOString(), to: to.toISOString() };
}
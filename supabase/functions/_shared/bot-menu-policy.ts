export const REPORT_BUTTON = '📊 آمار ثبت‌نام دوره‌ها';
type Action = { text: string; callback_data: string };
const leadActions: Action[] = [
  { text: '📋 لیدهای من', callback_data: 'menu:my_leads' },
  { text: '👥 همه لیدها', callback_data: 'menu:all_leads' },
  { text: '🎯 تخصیص دسته‌جمعی', callback_data: 'bulk:start' },
];
const social = { text: '📱 مدیریت شبکه‌های اجتماعی', callback_data: 'social:menu' };
export function privilegedActions(role: string | null | undefined, reportAccess = false): Action[] {
  let actions: Action[] = [];
  if (role === 'admin') actions = [...leadActions, { text: '📊 گزارش‌ها', callback_data: 'menu:reports' }, social, { text: '⚙️ مدیریت سیستم', callback_data: 'admin:menu' }];
  if (role === 'sales_manager') actions = [...leadActions, { text: '📊 عملکرد تیم', callback_data: 'menu:reports' }];
  if (role === 'sales_agent') actions = [leadActions[0], { text: '📊 عملکرد امروز', callback_data: 'menu:reports' }];
  if (role === 'social_admin') actions = [social];
  return reportAccess ? [{ text: REPORT_BUTTON, callback_data: 'ereg:menu' }, ...actions] : actions;
}
export function privilegedReplyKeyboard(role: string | null | undefined, reportAccess = false): string[][] {
  const actions = privilegedActions(role, reportAccess);
  const rows: string[][] = [];
  for (let i = 0; i < actions.length; i += 2) rows.push(actions.slice(i, i + 2).map(a => a.text));
  if (rows.length) rows.push(['🏠 منوی اصلی']);
  return rows;
}
export function replyAction(text: string): Action | undefined {
  return ['admin', 'sales_manager', 'sales_agent', 'social_admin'].flatMap(role => privilegedActions(role, true)).find(a => a.text === text);
}
export function allowsPrivilegedAction(role: string | null | undefined, callback: string, reportAccess = false): boolean {
  return privilegedActions(role, reportAccess).some(a => a.callback_data === callback);
}
export function isPrivilegedEntry(callback: string): boolean {
  return ['admin', 'sales_manager', 'sales_agent', 'social_admin'].some(role => allowsPrivilegedAction(role, callback, true));
}
export function botVisibleForms<T extends { is_active?: boolean; show_in_bot?: boolean }>(forms: T[]): T[] {
  return forms.filter(form => form.is_active === true && form.show_in_bot === true);
}
// Editable message catalogue for the gamified course-access system.
// Every notification (email / telegram bot / telegram business / SMS) and every on-site
// gamification text lives here as a default template; admins can override each one per
// course from the course gamification settings (course_gamification_settings.messages).
//
// Keep this file in sync with supabase/functions/_shared/gamificationMessages.ts

export type GamMessageDef = {
  key: string;
  label: string;
  group: 'notification' | 'site';
  hasTitle: boolean;
  title?: string;
  text: string;
  vars: string[];
};

export const GAM_MESSAGES: GamMessageDef[] = [
  // ---------- notifications ----------
  {
    key: 'welcome',
    label: 'پیام خوش‌آمد (شروع دسترسی رایگان)',
    group: 'notification',
    hasTitle: true,
    title: 'دسترسی {free_days} روزه شما فعال شد 🚀',
    text:
      'دسترسی شما به دوره فعال شد.\n' +
      'شما {free_days} روز فرصت دارید دوره را کامل کنید.\n' +
      'هر درس یک ماموریت است و {mission_hours} ساعت برای انجام آن وقت دارید.\n' +
      'اگر دوره را ظرف {fast_finish_days} روز تمام کنی، جایزه ویژه می‌گیری 🎁',
    vars: ['free_days', 'mission_hours', 'fast_finish_days', 'course_title', 'name'],
  },
  {
    key: 'mission_due',
    label: 'یادآوری پایان مهلت ماموریت',
    group: 'notification',
    hasTitle: true,
    title: '⏳ ماموریت امروزت در حال اتمام است',
    text: 'درس «{lesson_title}» را تا {remaining} دیگر کامل کن تا استریک‌ات حفظ شود.',
    vars: ['lesson_title', 'remaining', 'course_title', 'name'],
  },
  {
    key: 'access_expiring',
    label: 'هشدار نزدیک‌شدن پایان دسترسی',
    group: 'notification',
    hasTitle: true,
    title: '⏱ دسترسی دوره‌ات رو به پایان است',
    text: 'تنها {remaining} از دسترسی رایگان تو باقی مانده. همین حالا ادامه بده!',
    vars: ['remaining', 'course_title', 'name'],
  },
  {
    key: 'access_expired',
    label: 'پیام بسته‌شدن دسترسی',
    group: 'notification',
    hasTitle: true,
    title: '🔒 دسترسی دوره بسته شد',
    text: 'پیشرفت تو کامل ذخیره شده است. با تمدید دسترسی، دقیقاً از همان‌جا ادامه می‌دهی.',
    vars: ['course_title', 'name', 'price_usd', 'reactivation_days'],
  },
  {
    key: 'rewards',
    label: 'پیام دریافت جایزه',
    group: 'notification',
    hasTitle: true,
    title: 'جایزه شما فعال شد 🎁',
    text: 'تبریک! دوره را در {days} روز تمام کردی.\nجوایز شما:\n{rewards}',
    vars: ['days', 'rewards', 'course_title', 'name'],
  },
  {
    key: 'reactivated',
    label: 'پیام تمدید دسترسی پس از پرداخت',
    group: 'notification',
    hasTitle: true,
    title: '✅ دسترسی دوره تمدید شد',
    text: 'دسترسی تو برای {reactivation_days} روز دیگر باز شد و دقیقاً از همان‌جا که بودی ادامه می‌دهی.',
    vars: ['reactivation_days', 'course_title', 'name'],
  },

  // ---------- on-site texts ----------
  {
    key: 'banner_title',
    label: 'بنر دوره — عنوان شمارش معکوس',
    group: 'site',
    hasTitle: false,
    text: 'دسترسی رایگان محدود',
    vars: [],
  },
  {
    key: 'banner_text',
    label: 'بنر دوره — متن انگیزشی',
    group: 'site',
    hasTitle: false,
    text: 'بعد از پایان این زمان، دسترسی شما بسته می‌شود؛ هر روز تعللی یعنی یک درس عقب‌ماندگی.',
    vars: ['remaining', 'percent', 'streak'],
  },
  {
    key: 'banner_text_urgent',
    label: 'بنر دوره — متن ۲۴ ساعت پایانی',
    group: 'site',
    hasTitle: false,
    text: 'کمتر از یک روز تا بسته‌شدن دسترسی شما باقی مانده — همین الان یک درس جلو بروید!',
    vars: ['remaining', 'percent', 'streak'],
  },
  {
    key: 'locked_title',
    label: 'متن قفل‌شدن دسترسی (سایت) — عنوان',
    group: 'site',
    hasTitle: false,
    text: 'دسترسی رایگان شما به پایان رسید 🔒',
    vars: [],
  },
  {
    key: 'locked_text',
    label: 'متن قفل‌شدن دسترسی (سایت) — توضیح',
    group: 'site',
    hasTitle: false,
    text: 'پیشرفت شما ذخیره شده است. با تمدید دسترسی، دقیقاً از همان‌جا ادامه می‌دهید.',
    vars: ['price_usd', 'reactivation_days'],
  },
  {
    key: 'reactivate_button',
    label: 'متن دکمه تمدید دسترسی',
    group: 'site',
    hasTitle: false,
    text: 'تمدید دسترسی',
    vars: ['price_usd'],
  },
  {
    key: 'mission_current',
    label: 'عنوان ماموریت فعلی',
    group: 'site',
    hasTitle: false,
    text: 'ماموریت فعلی',
    vars: [],
  },
  {
    key: 'mission_completed',
    label: 'پیام تکمیل یک ماموریت',
    group: 'site',
    hasTitle: false,
    text: '🔥 ماموریت انجام شد!\nهنوز واجد شرایط جایزه سریع هستی.\n{remaining} باقی مانده.',
    vars: ['remaining', 'lesson_title', 'streak'],
  },
  {
    key: 'mission_completed_late',
    label: 'پیام تکمیل ماموریت بعد از پایان مهلت جایزه سریع',
    group: 'site',
    hasTitle: false,
    text: '🔥 ماموریت انجام شد!\nبه مسیرت ادامه بده.',
    vars: ['lesson_title', 'streak'],
  },
  {
    key: 'course_completed',
    label: 'پیام تکمیل کل دوره',
    group: 'site',
    hasTitle: false,
    text: '🎉 دوره را کامل کردی! جوایز شما در داشبورد فعال شد.',
    vars: ['days'],
  },
  {
    key: 'all_missions_done',
    label: 'پیام کارت گیمیفیکیشن وقتی همه ماموریت‌ها تمام شده',
    group: 'site',
    hasTitle: false,
    text: '🎉 همه ماموریت‌های این دوره را کامل کرده‌اید!',
    vars: [],
  },
];

export const GAM_MESSAGE_MAP: Record<string, GamMessageDef> = Object.fromEntries(
  GAM_MESSAGES.map((m) => [m.key, m]),
);

export function renderGamTemplate(tpl: string, vars: Record<string, string | number | undefined | null>): string {
  return String(tpl ?? '').replace(/\{(\w+)\}/g, (_m, k) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

/** Resolves a message from the per-course overrides, falling back to the default template. */
export function gamMessage(
  messages: any,
  key: string,
  vars: Record<string, string | number | undefined | null> = {},
): { title: string; text: string } {
  const def = GAM_MESSAGE_MAP[key];
  const override = (messages ?? {})[key] ?? {};
  const title = override.title ?? def?.title ?? '';
  const text = override.text ?? def?.text ?? '';
  return { title: renderGamTemplate(title, vars), text: renderGamTemplate(text, vars) };
}

/** Convenience for on-site single-text messages. */
export function gamText(
  messages: any,
  key: string,
  vars: Record<string, string | number | undefined | null> = {},
): string {
  return gamMessage(messages, key, vars).text;
}

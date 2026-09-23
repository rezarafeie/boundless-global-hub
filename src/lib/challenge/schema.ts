import { supabase } from '@/integrations/supabase/client';

export type Option = { value: string; label: string };
export type Segments = { business_models: Option[]; stages: Option[]; budgets: Option[]; boundless_codes: Option[] };

export const DEFAULT_SEGMENTS: Segments = {
  boundless_codes: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `کد ${i + 1}` })),
  business_models: [
    { value: 'dropshipping', label: 'دراپ‌شیپینگ' },
    { value: 'drop_servicing', label: 'دراپ سرویس' },
    { value: 'digital_product', label: 'محصول دیجیتال' },
    { value: 'iran_business', label: 'کسب‌وکار ایران' },
    { value: 'ai_business', label: 'کسب‌وکار هوش مصنوعی' },
  ],
  stages: [
    { value: 'no_niche', label: 'هنوز نیچ/محصول/خدمت ندارم' },
    { value: 'selected', label: 'محصول/خدمت انتخاب شده' },
    { value: 'building', label: 'در حال ساخت زیرساخت/پلتفرم' },
    { value: 'ready_no_traffic', label: 'آماده‌ام ولی ترافیک ندارم' },
    { value: 'traffic_no_sales', label: 'ترافیک/لید دارم ولی فروش نه' },
    { value: 'low_sales', label: 'فروش دارم ولی کم است' },
    { value: 'scaling', label: 'می‌فروشم و می‌خواهم رشد کنم' },
  ],
  budgets: [
    { value: 'zero', label: 'بدون بودجه' },
    { value: 'low', label: 'بودجه کم' },
    { value: 'paid', label: 'مسیر پولی/سریع‌تر' },
  ],
};

export const segmentsOf = (ch: any): Segments => {
  const s = ch?.segments || {};
  const pick = (k: keyof Segments) => (Array.isArray(s[k]) && s[k].length ? s[k].map((o: any) => typeof o === 'object' ? { value: String(o.value), label: String(o.label ?? o.value) } : { value: String(o), label: String(o) }) : DEFAULT_SEGMENTS[k]);
  return { business_models: pick('business_models'), stages: pick('stages'), budgets: pick('budgets'), boundless_codes: pick('boundless_codes') };
};
export const labelOf = (opts: Option[], v?: string | null) => opts.find((o) => o.value === v)?.label ?? v ?? '—';

export const REVIEW_MODES: Option[] = [
  { value: 'auto', label: 'تکمیل خودکار' },
  { value: 'ai', label: 'بررسی هوش مصنوعی' },
  { value: 'human', label: 'بررسی مربی' },
  { value: 'ai_human', label: 'هوش مصنوعی + مربی' },
];
export const STATUSES: Option[] = [
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'scheduled', label: 'زمان‌بندی‌شده' },
  { value: 'active', label: 'فعال' },
  { value: 'paused', label: 'متوقف' },
  { value: 'finished', label: 'پایان‌یافته' },
];
export const PROGRESS_LABELS: Record<string, string> = {
  locked: '🔒 قفل', available: '🟢 آماده', started: '🟡 در حال انجام', submitted: '📤 ارسال شد',
  pending_ai: '🤖 در حال بررسی AI', pending_review: '👤 در انتظار مربی', needs_revision: '🔄 نیاز به اصلاح',
  completed: '✅ کامل', missed: '❌ از دست رفته', skipped: '⏭ قبل از عضویت',
};
export const EVENT_KINDS = [
  'challenge_joined', 'challenge_started', 'mission_available', 'deadline_approaching', 'mission_submitted',
  'ai_feedback_ready', 'coach_feedback_ready', 'revision_requested', 'mission_completed', 'mission_missed',
  'streak_achieved', 'streak_broken', 'first_sale', 'reward_unlocked', 'penalty_applied', 'payment_required', 'penalty_released', 'inactive', 'challenge_completed',
];
export const CHANNELS: Option[] = [
  { value: 'telegram_bot', label: 'ربات تلگرام' }, { value: 'telegram_business', label: 'تلگرام بیزینس' },
  { value: 'bale', label: 'ربات بله' }, { value: 'email', label: 'ایمیل' }, { value: 'in_app', label: 'داخل سایت' }, { value: 'sms', label: 'پیامک' },
];

/* ---------- variant selection (mirrors backend) ---------- */
export function selectVariant(variants: any[], p: any) {
  const m = (l: string[] | undefined, v: unknown) => (!l || !l.length ? 0 : l.includes(String(v ?? '')) ? 1 : -1);
  let best: any = null, bestScore = -1;
  for (const v of variants) {
    if (v.is_fallback) continue;
    const parts = [m(v.boundless_codes, p.boundless_code), m(v.business_models, p.business_model), m(v.stages, p.stage), m(v.budgets, p.budget)];
    if (parts.includes(-1)) continue;
    const s = parts.reduce((a, b) => a + b, 0) * 1000 + (Number(v.priority) || 0);
    if (s > bestScore) { best = v; bestScore = s; }
  }
  if (best) return { variant: best, fallback: false };
  const fb = variants.find((v) => v.is_fallback) ?? null;
  return { variant: fb ?? variants[0] ?? null, fallback: true };
}

export function coverage(days: any[], variants: any[], seg: Segments) {
  const out: { day: number; title: string; uncovered: string[]; noVariant: boolean; noFallback: boolean }[] = [];
  for (const d of days) {
    const vs = variants.filter((v) => v.day_id === d.id);
    const uncovered: string[] = [];
    for (const bm of seg.business_models) for (const st of seg.stages) for (const b of seg.budgets) {
      const r = selectVariant(vs, { business_model: bm.value, stage: st.value, budget: b.value });
      if (r.fallback) uncovered.push(`${bm.label} + ${st.label} + ${b.label}`);
    }
    out.push({ day: d.day_number, title: d.title, uncovered, noVariant: vs.length === 0, noFallback: !vs.some((v) => v.is_fallback) });
  }
  return out;
}

/* ---------- JSON template ---------- */
export const JSON_TEMPLATE = {
  $schema_version: 1,
  challenge: {
    title: 'چالش ۳۰ روزه فروش بدون مرز', slug: 'boundless-sales-30', description: 'در ۳۰ روز به اولین فروش برس.',
    cover_image: null, start_date: '2026-10-01', days_count: 30, status: 'draft',
    eligible_all_boundless: true, eligible_course_ids: [], default_deadline_time: '23:59',
    gamification_enabled: true, streak_enabled: true, notifications_enabled: true, leaderboard_enabled: true, unlock_next_on_complete: false,
    ai_review_default: true, coach_review_default: false,
  },
  segments: { business_models: DEFAULT_SEGMENTS.business_models, stages: DEFAULT_SEGMENTS.stages, budgets: DEFAULT_SEGMENTS.budgets, boundless_codes: DEFAULT_SEGMENTS.boundless_codes },
  onboarding_form: {
    title: 'پروفایل چالش', description: 'چند سوال کوتاه', ai_prompt: 'پروفایل دانشجو را خلاصه کن و مسیر پیشنهادی بده.', require_login: true,
    fields: [
      { field_key: 'main_goal', label: 'هدف اصلی تو در این چالش؟', field_type: 'long_text', required: true },
      { field_key: 'hours', label: 'روزی چند ساعت وقت داری؟', field_type: 'dropdown', required: true, options: ['کمتر از ۱', '۱ تا ۳', 'بیش از ۳'] },
    ],
  },
  xp_rules: { on_time_bonus: 5, streak_milestones: [3, 7, 14, 21, 30] },
  rewards: [
    { key: 'three_done', title: 'شروع قدرتمند', emoji: '⚡', description: '۳ ماموریت اول', trigger: { type: 'missions_completed', value: 3 }, reward_type: 'credit', reward_value: 50000 },
    { key: 'xp100', title: '۱۰۰ امتیاز', emoji: '⭐', trigger: { type: 'xp', value: 100 }, reward_type: 'percent', reward_value: 10 },
    { key: 'streak7', title: 'استریک ۷ روزه', emoji: '🔥', description: 'هفت روز پشت سر هم', trigger: { type: 'streak', value: 7 }, reward_type: 'discount_code', reward_value: 'STREAK7' },
    { key: 'first_sale', title: 'اولین فروش', emoji: '💰', trigger: { type: 'first_sale' }, reward_type: 'link', reward_value: 'https://academy.rafiei.co/gift', link: 'https://academy.rafiei.co/gift' },
    { key: 'rev1000', title: '۱۰۰۰ دلار فروش', emoji: '🚀', trigger: { type: 'revenue', value: 1000 } },
    { key: 'fast_finish', title: 'تمام‌کننده سریع', emoji: '🏃', trigger: { type: 'complete_before_day', value: 28 } },
    { key: 'finisher', title: 'قهرمان چالش', emoji: '🏆', trigger: { type: 'challenge_completed' } },
    { key: 'coach_pick', title: 'انتخاب مربی', emoji: '👑', description: 'فقط دستی توسط ادمین داده می‌شود', trigger: { type: 'custom' } },
  ],
  penalties: [
    { key: 'miss_xp', trigger: { type: 'mission_missed' }, action: { type: 'lose_xp', value: 5, message: '۵ امتیاز به‌خاطر ماموریت از دست رفته کم شد.' } },
    { key: 'streak_reset', trigger: { type: 'streak_broken' }, action: { type: 'reset_streak', message: 'استریک تو صفر شد.' } },
    { key: 'three_missed', trigger: { type: 'missed_count', value: 3 }, action: { type: 'warning', message: 'سه ماموریت را از دست دادی؛ با مربی صحبت کن.' } },
    { key: 'paid_return', trigger: { type: 'mission_missed' }, action: { type: 'pay_to_return', value: 10, message: 'یک روز را از دست دادی. برای بازگشت {usd} دلار جریمه پرداخت کن.' } },
    { key: 'coach_note', trigger: { type: 'missed_count', value: 5 }, action: { type: 'custom', message: 'مربی به‌زودی با تو تماس می‌گیرد.' } },
  ],
  notifications: {
    channels: { telegram_bot: true, telegram_business: true, bale: true, email: true, in_app: true, sms: false },
    followups: [{ hours_before: 6 }, { hours_before: 2 }, { hours_before: 0.5 }],
    inactive_hours: 48,
    messages: {
      challenge_joined: { enabled: true, title: 'به {challenge_title} خوش آمدی 🎯', text: '{name} عزیز، ثبت‌نامت انجام شد. هر روز یک ماموریت شخصی برایت باز می‌شود.\n{challenge_url}', channels: ['telegram_bot', 'telegram_business', 'bale', 'email', 'in_app'] },
      challenge_started: { enabled: true, title: 'چالش شروع شد 🚀', text: '{name}، {challenge_title} از امروز شروع شد.\n{mission_url}' },
      mission_available: { enabled: true, title: 'ماموریت روز {day} آماده است 🔥', text: '{name}، ماموریت امروز: «{mission_title}»\nمهلت: {deadline}\nپاداش: {xp} امتیاز\n{mission_url}' },
      deadline_approaching: { enabled: true, title: '⏰ {remaining_time} تا پایان ماموریت', text: '{name}، ماموریت روز {day} («{mission_title}») هنوز انجام نشده.\n{mission_url}' },
      mission_submitted: { enabled: true, title: 'ماموریت ارسال شد 📤', text: 'ماموریت روز {day} دریافت شد و در حال بررسی است.', channels: ['in_app'] },
      ai_feedback_ready: { enabled: true, title: 'بازخورد هوشمند آماده است 🤖', text: '{name}، بازخورد ماموریت روز {day} آماده است.\n{mission_url}' },
      coach_feedback_ready: { enabled: true, title: 'مربی ماموریتت را بررسی کرد 👤', text: '{name}، بازخورد مربی برای روز {day} ثبت شد.\n{mission_url}' },
      revision_requested: { enabled: true, title: 'نیاز به اصلاح 🔄', text: '{name}، ماموریت روز {day} «{mission_title}» نیاز به اصلاح دارد.\n\n{reasons}\n\nاصلاح کن و دوباره بفرست:\n{mission_url}' },
      mission_completed: { enabled: true, title: 'ماموریت روز {day} کامل شد ✅', text: 'آفرین {name}! +{xp} امتیاز. استریک فعلی: {streak} روز 🔥' },
      mission_missed: { enabled: true, title: 'ماموریت روز {day} از دست رفت', text: '{name}، مهلت ماموریت «{mission_title}» تمام شد.\n{challenge_url}' },
      streak_achieved: { enabled: true, title: '🔥 استریک {streak} روزه!', text: '{name}، {streak} روز پشت سر هم! ادامه بده.' },
      streak_broken: { enabled: true, title: 'استریک قطع شد', text: '{name}، استریک تو قطع شد. با ماموریت امروز دوباره بساز.' },
      first_sale: { enabled: true, title: '🎉 اولین فروش!', text: 'تبریک {name}! اولین فروش تو در {challenge_title} ثبت شد.' },
      reward_unlocked: { enabled: true, title: '🎁 جایزه جدید باز شد', text: '{name}، جایزه «{reward}» را گرفتی.\n{challenge_url}' },
      penalty_applied: { enabled: true, title: 'هشدار چالش', text: '{feedback}' },
      payment_required: { enabled: true, title: '⛔ چالش متوقف شد', text: '{name}، ماموریت روز {day} از دست رفت. برای بازگشت باید {usd} دلار جریمه پرداخت کنی.\n{challenge_url}' },
      penalty_released: { enabled: true, title: '✅ به چالش برگشتی', text: '{name}، {feedback}\n{mission_url}' },
      inactive: { enabled: true, title: 'دلمون برات تنگ شده 👋', text: '{name}، چند وقتی است فعالیتی نداشتی. ماموریت امروز منتظرته.\n{challenge_url}' },
      challenge_completed: { enabled: true, title: '🏆 چالش تمام شد', text: '{name}، {challenge_title} به پایان رسید. امتیاز نهایی: {xp} — پیشرفت: {progress}٪' },
    },
  },
  days: [
    {
      day_number: 1, title: 'انتخاب مسیر', short_description: 'مسیرت را دقیق کن', goal: 'یک نیچ مشخص', estimated_minutes: 45,
      xp: 10, required: true, review_mode: 'ai', deadline_time: '23:59', deadline_hours: null,
      notification_text: null, followups: null,
      stage_update: { enabled: true, prompt: 'نیچ یا محصولت را انتخاب کردی؟', suggest: 'selected' },
      variants: [
        {
          key: 'A', title: 'دراپ‌شیپینگ بدون بودجه', business_models: ['dropshipping'], stages: [], budgets: ['zero'], boundless_codes: [], priority: 0, is_fallback: false,
          instructions: 'سه محصول برنده پیدا کن...', checklist: ['بررسی ترندها', 'انتخاب ۳ محصول'], tips: ['از گوگل ترندز استفاده کن'],
          example: 'مثال: ...', resources: [{ title: 'ویدیو آموزشی', url: 'https://...' }], expected_result: 'لیست ۳ محصول با دلیل',
          assignment: {
            title: 'روز ۱ — انتخاب محصول', description: 'پاسخ‌ها را کامل بنویس', ai_feedback_enabled: true,
            ai_feedback_prompt: 'به عنوان مربی دراپ‌شیپینگ، انتخاب محصول را از نظر تقاضا و رقابت نقد کن. pass یا needs_revision بده.',
            passing_score: 70, manual_review_enabled: false, estimated_minutes: 45,
            blocks: [
              { id: 'b1', type: 'long_text', label: 'سه محصول انتخابی و دلیل هرکدام', required: true },
              { id: 'b2', type: 'link', label: 'لینک یکی از محصولات', required: false },
            ],
          },
        },
        { key: 'FB', title: 'همه مسیرها', is_fallback: true, instructions: 'نیچ خود را مشخص کن', assignment_id: null, form_id: null },
      ],
    },
    {
      day_number: 2, title: 'اولین ترافیک', short_description: 'اولین بازدیدکننده‌ها', goal: '۱۰۰ بازدید', estimated_minutes: 60,
      xp: 15, required: true, review_mode: 'ai_human', unlock_time: '08:00', deadline_time: null, deadline_hours: 36,
      notification_text: 'امروز نوبت آوردن ترافیک است 🚦', followups: [{ hours_before: 4 }, { hours_before: 1 }],
      stage_update: { enabled: true, prompt: 'اولین بازدید یا لید را گرفتی؟', suggest: 'traffic_no_sales' },
      variants: [
        { key: 'PAID', title: 'مسیر پولی', budgets: ['paid'], priority: 10, instructions: 'یک کمپین تبلیغاتی کوچک راه بینداز', checklist: ['تعیین بودجه روزانه'], expected_result: 'اسکرین‌شات کمپین',
          form: { title: 'گزارش کمپین روز ۲', description: 'نتایج را بنویس', fields: [{ field_key: 'spend', label: 'هزینه (دلار)', field_type: 'number', required: true }, { field_key: 'shot', label: 'لینک اسکرین‌شات', field_type: 'text', required: false }] } },
        { key: 'FB', title: 'بدون بودجه', is_fallback: true, instructions: 'در ۳ گروه/صفحه مرتبط محتوا منتشر کن',
          assignment: { title: 'روز ۲ — ترافیک رایگان', ai_feedback_enabled: true, manual_review_enabled: true, passing_score: 60,
            ai_feedback_prompt: 'بررسی کن آیا دانشجو واقعاً محتوا منتشر کرده؛ score، summary، strengths، weaknesses، next_steps و pass یا needs_revision بده.',
            blocks: [
              { id: 'b1', type: 'hint', label: 'لینک‌ها را کامل وارد کن' },
              { id: 'b2', type: 'single_choice', label: 'کدام کانال؟', options: ['اینستاگرام', 'تلگرام', 'سایر'], required: true },
              { id: 'b3', type: 'checklist', label: 'انجام دادم', options: ['پست اول', 'پست دوم', 'پست سوم'] },
              { id: 'b4', type: 'image_upload', label: 'اسکرین‌شات آمار', required: false },
              { id: 'b5', type: 'rating', label: 'چقدر سخت بود؟' },
            ] } },
      ],
    },
  ],
};

export const JSON_GUIDE = `راهنمای ساختار JSON چالش:
• challenge: تنظیمات اصلی (title, slug یکتا، start_date به‌صورت YYYY-MM-DD، days_count، status: draft|scheduled|active|paused|finished، default_deadline_time به وقت تهران HH:MM، سوئیچ‌های گیمیفیکیشن/استریک/اعلان/لیدربورد).
• segments: گزینه‌های پروفایل (business_models, stages, budgets, boundless_codes) هرکدام [{value,label}]. valueها در variantها استفاده می‌شوند.
• onboarding_form: اختیاری — {title, description, ai_prompt, require_login, fields:[{field_key,label,field_type: text|long_text|phone|email|number|dropdown|image|voice|file|message,required,options,help_text}]} که یک فرم واقعی در سیستم فرم‌ها می‌سازد، یا {form_id} برای فرم موجود.
• xp_rules: on_time_bonus (امتیاز اضافه برای ارسال قبل از ددلاین)، streak_milestones (روزهای جشن استریک).
• challenge.unlock_next_on_complete: true یعنی با انجام ماموریت، روز بعد زودتر از تاریخش باز شود.
• rewards: [{key, title, emoji, description, trigger:{type: missions_completed|xp|streak|challenge_completed|complete_before_day|first_sale|revenue|custom, value}, reward_type: discount_code|percent|credit|link, reward_value, link}].
• penalties: [{key, trigger:{type: mission_missed|streak_broken|missed_count, value}, action:{type: lose_xp|reset_streak|warning|custom|pay_to_return|lock_course, value, message}}]. pay_to_return: شرکت‌کننده تا پرداخت value دلار (با نرخ روز) متوقف می‌شود و پس از پرداخت ماموریت از دست رفته ۲۴ ساعت باز می‌شود. lock_course فقط در صورت تعریف صریح دسترسی دوره را قفل می‌کند.
• notifications: channels (telegram_bot, telegram_business, bale, email, in_app, sms)، followups [{hours_before}] پیش از ددلاین، inactive_hours، messages: {رویداد: {title, text, channels, enabled}}.
  رویدادها: ${EVENT_KINDS.join(', ')}
  enabled: false یعنی آن پیام ارسال نشود؛ channels خالی یعنی همه کانال‌های فعال چالش.
  متغیرها: {name} (فقط نام کوچک) {challenge_title} {day} {days_count} {mission_title} {deadline} {remaining_time} {xp} {streak} {reward} {progress} {feedback} {reasons} (دلایل اصلاح) {usd} (مبلغ جریمه) {challenge_url} {mission_url}
  payment_required: وقتی جریمه پولی فعال می‌شود — penalty_released: پس از پرداخت یا بخشش مربی.
• days: [{day_number, title, short_description, goal, estimated_minutes, xp, required, review_mode: auto|ai|human|ai_human, unlock_time, deadline_time, deadline_hours, notification_text, followups, stage_update:{enabled,prompt,suggest}, variants:[...] }].
• variant: شرایط (business_models, stages, budgets, boundless_codes — خالی یعنی «همه»)، priority، is_fallback، محتوا (instructions, checklist[], tips[], example, resources[{title,url}], expected_result) و ارسال: assignment_id موجود، form_id موجود، یا assignment جدید {title, description, blocks[], ai_feedback_enabled, ai_feedback_prompt, passing_score, manual_review_enabled} یا form جدید {title, fields[]}.
  انواع بلوک تمرین: title, description, short_text, long_text, number, single_choice, multiple_choice, rating, checklist, file_upload, image_upload, link, hint.
• هر روز باید حداقل یک variant با is_fallback: true داشته باشد تا هیچ دانشجویی روز خالی نبیند.
• حالت «به‌روزرسانی»: اگر slug موجود باشد، تنظیمات و روزها/variantها به‌روز می‌شوند و پیشرفت و ارسال‌های دانشجوها حفظ می‌شود.`;

/* ---------- validation ---------- */
export type Validation = { errors: string[]; warnings: string[]; summary: Record<string, number> };
const BLOCK_TYPES = ['title', 'description', 'short_text', 'long_text', 'number', 'single_choice', 'multiple_choice', 'rating', 'checklist', 'file_upload', 'image_upload', 'link', 'hint'];

export function validateChallengeJson(j: any): Validation {
  const errors: string[] = [], warnings: string[] = [];
  const c = j?.challenge;
  if (!c) errors.push('بخش challenge وجود ندارد');
  if (c && !c.title) errors.push('challenge.title الزامی است');
  if (c && !/^[a-z0-9-]+$/.test(c.slug ?? '')) errors.push('challenge.slug باید فقط حروف کوچک انگلیسی، عدد و خط تیره باشد');
  if (c && !/^\d{4}-\d{2}-\d{2}$/.test(c.start_date ?? '')) errors.push('challenge.start_date باید YYYY-MM-DD باشد');
  if (c && !(Number(c.days_count) > 0)) errors.push('challenge.days_count باید عدد مثبت باشد');
  const days: any[] = Array.isArray(j?.days) ? j.days : [];
  if (!days.length) warnings.push('هیچ روزی تعریف نشده است');
  let variants = 0, assignments = 0, forms = 0;
  const seen = new Set<number>();
  for (const d of days) {
    const n = Number(d.day_number);
    if (!(n > 0)) errors.push(`روز بدون day_number معتبر: ${d.title ?? ''}`);
    if (seen.has(n)) errors.push(`روز ${n} تکراری است`);
    seen.add(n);
    if (c && n > Number(c.days_count)) warnings.push(`روز ${n} بیشتر از days_count است`);
    if (!d.title) errors.push(`روز ${n}: title الزامی است`);
    if (d.review_mode && !REVIEW_MODES.some((m) => m.value === d.review_mode)) errors.push(`روز ${n}: review_mode نامعتبر`);
    const vs: any[] = Array.isArray(d.variants) ? d.variants : [];
    if (!vs.length) warnings.push(`روز ${n}: variant ندارد`);
    if (vs.length && !vs.some((v) => v.is_fallback)) warnings.push(`روز ${n}: variant پیش‌فرض (fallback) ندارد`);
    for (const v of vs) {
      variants++;
      if (v.assignment) {
        assignments++;
        if (!v.assignment.title) errors.push(`روز ${n}: عنوان تمرین الزامی است`);
        for (const b of v.assignment.blocks ?? []) if (!BLOCK_TYPES.includes(b.type)) errors.push(`روز ${n}: نوع بلوک نامعتبر ${b.type}`);
      }
      if (v.form) forms++;
    }
  }
  if (c) for (let i = 1; i <= Number(c.days_count); i++) if (!seen.has(i)) { warnings.push(`روز ${i} تعریف نشده است`); if (warnings.length > 40) break; }
  if (j?.onboarding_form && !j.onboarding_form.form_id) forms++;
  return {
    errors, warnings,
    summary: {
      days: days.length, variants, assignments, forms,
      rewards: (j?.rewards ?? []).length, penalties: (j?.penalties ?? []).length,
      notification_events: Object.keys(j?.notifications?.messages ?? {}).length,
    },
  };
}

/* ---------- import ---------- */
async function createForm(f: any): Promise<string> {
  const slug = (f.slug ?? `ch-form-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`).toLowerCase();
  const { data, error } = await supabase.from('telegram_forms').insert({
    title: f.title, description: f.description ?? null, ai_prompt: f.ai_prompt ?? null, require_login: f.require_login ?? true, is_active: true, slug,
  } as any).select('id').single();
  if (error) throw new Error('ساخت فرم: ' + error.message);
  const fields = (f.fields ?? []).map((x: any, i: number) => ({
    form_id: data.id, order_index: i, field_key: x.field_key ?? `f${i + 1}`, label: x.label, field_type: x.field_type ?? 'text',
    required: x.required ?? true, options: x.options ?? null, help_text: x.help_text ?? null,
  }));
  if (fields.length) {
    const { error: e2 } = await supabase.from('telegram_form_fields').insert(fields as any);
    if (e2) throw new Error('فیلدهای فرم: ' + e2.message);
  }
  return data.id;
}

async function createAssignment(a: any, courseId: string | null): Promise<string> {
  const { data, error } = await supabase.from('assignments').insert({
    title: a.title, description: a.description ?? null, blocks: (a.blocks ?? []).map((b: any, i: number) => ({ id: b.id ?? `b${i + 1}`, ...b })),
    required: a.required ?? true, ai_feedback_enabled: a.ai_feedback_enabled ?? true, manual_review_enabled: a.manual_review_enabled ?? false,
    ai_feedback_prompt: a.ai_feedback_prompt ?? null, passing_score: a.passing_score ?? null, estimated_minutes: a.estimated_minutes ?? null,
    cta_config: a.cta_config ?? {}, tags: ['challenge', ...(a.tags ?? [])], status: 'published', allow_resubmit: true, course_id: courseId,
  } as any).select('id').single();
  if (error) throw new Error('ساخت تمرین: ' + error.message);
  return data.id;
}

export async function importChallengeJson(j: any, mode: 'create' | 'update', onLog?: (m: string) => void): Promise<string> {
  const log = onLog ?? (() => {});
  const c = j.challenge;
  const created = { assignments: [] as string[], forms: [] as string[], challenge: null as string | null };
  const { data: existing } = await supabase.from('challenges').select('id').eq('slug', c.slug).maybeSingle();
  if (mode === 'create' && existing) throw new Error('چالشی با این slug وجود دارد؛ حالت «به‌روزرسانی» را انتخاب کنید یا slug را تغییر دهید');
  if (mode === 'update' && !existing) throw new Error('چالشی با این slug برای به‌روزرسانی پیدا نشد');
  try {
    let onboardingFormId: string | null = j.onboarding_form?.form_id ?? null;
    if (j.onboarding_form && !onboardingFormId) { onboardingFormId = await createForm(j.onboarding_form); created.forms.push(onboardingFormId); log('فرم آنبوردینگ ساخته شد'); }
    const row: any = {
      title: c.title, slug: c.slug, description: c.description ?? null, cover_image: c.cover_image ?? null,
      start_date: c.start_date, days_count: Number(c.days_count), status: c.status ?? 'draft',
      end_date: new Date(Date.parse(c.start_date) + (Number(c.days_count) - 1) * 86400000).toISOString().slice(0, 10),
      eligible_all_boundless: !!c.eligible_all_boundless, eligible_course_ids: c.eligible_course_ids ?? [],
      onboarding_form_id: onboardingFormId, default_deadline_time: c.default_deadline_time ?? '23:59',
      gamification_enabled: c.gamification_enabled ?? true, streak_enabled: c.streak_enabled ?? true,
      notifications_enabled: c.notifications_enabled ?? true, leaderboard_enabled: c.leaderboard_enabled ?? true, unlock_next_on_complete: c.unlock_next_on_complete ?? false,
      ai_review_default: c.ai_review_default ?? true, coach_review_default: c.coach_review_default ?? false,
      segments: j.segments ?? {}, xp_rules: j.xp_rules ?? {}, reward_rules: j.rewards ?? [], penalty_rules: j.penalties ?? [],
      notification_settings: { channels: j.notifications?.channels ?? {}, followups: j.notifications?.followups, inactive_hours: j.notifications?.inactive_hours },
      messages: j.notifications?.messages ?? {},
    };
    let challengeId: string;
    if (existing) {
      const { error } = await supabase.from('challenges').update(row).eq('id', existing.id);
      if (error) throw error;
      challengeId = existing.id;
    } else {
      const { data, error } = await supabase.from('challenges').insert(row).select('id').single();
      if (error) throw error;
      challengeId = data.id; created.challenge = challengeId;
    }
    log('تنظیمات چالش ذخیره شد');
    const courseId = (c.eligible_course_ids ?? [])[0] ?? null;
    const { data: oldDays } = await supabase.from('challenge_days').select('id, day_number').eq('challenge_id', challengeId);
    for (const d of j.days ?? []) {
      const dayRow: any = {
        challenge_id: challengeId, day_number: Number(d.day_number), title: d.title, short_description: d.short_description ?? null,
        goal: d.goal ?? null, estimated_minutes: d.estimated_minutes ?? null, unlock_time: d.unlock_time ?? null,
        deadline_time: d.deadline_time ?? null, deadline_hours: d.deadline_hours ?? null, xp: d.xp ?? 10, required: d.required ?? true,
        review_mode: d.review_mode ?? (c.ai_review_default === false ? 'auto' : 'ai'), notification_text: d.notification_text ?? null,
        followups: d.followups ?? null, stage_update_enabled: !!d.stage_update?.enabled, stage_update_prompt: d.stage_update?.prompt ?? null,
        stage_update_suggest: d.stage_update?.suggest ?? null, sort_order: Number(d.day_number),
      };
      const old = (oldDays ?? []).find((o: any) => o.day_number === dayRow.day_number);
      let dayId: string;
      if (old) { await supabase.from('challenge_days').update(dayRow).eq('id', old.id); dayId = old.id; }
      else { const { data, error } = await supabase.from('challenge_days').insert(dayRow).select('id').single(); if (error) throw error; dayId = data.id; }
      const { data: oldVars } = await supabase.from('challenge_variants').select('id, key').eq('day_id', dayId);
      const keep: string[] = [];
      for (const [i, v] of (d.variants ?? []).entries()) {
        let assignmentId = v.assignment_id ?? null;
        let formId = v.form_id ?? null;
        if (v.assignment) { assignmentId = await createAssignment(v.assignment, courseId); created.assignments.push(assignmentId); }
        if (v.form) { formId = await createForm(v.form); created.forms.push(formId); }
        const key = v.key ?? `v${i + 1}`;
        const vRow: any = {
          day_id: dayId, challenge_id: challengeId, key, title: v.title ?? null,
          business_models: v.business_models ?? [], stages: v.stages ?? [], budgets: v.budgets ?? [], boundless_codes: (v.boundless_codes ?? []).map(String),
          instructions: v.instructions ?? null, checklist: v.checklist ?? [], tips: v.tips ?? [], example: v.example ?? null,
          resources: v.resources ?? [], expected_result: v.expected_result ?? null, assignment_id: assignmentId, form_id: formId,
          priority: v.priority ?? 0, is_fallback: !!v.is_fallback,
        };
        const ov = (oldVars ?? []).find((o: any) => o.key === key);
        if (ov) { await supabase.from('challenge_variants').update(vRow).eq('id', ov.id); keep.push(ov.id); }
        else { const { data, error } = await supabase.from('challenge_variants').insert(vRow).select('id').single(); if (error) throw error; keep.push(data.id); }
      }
      const stale = (oldVars ?? []).filter((o: any) => !keep.includes(o.id)).map((o: any) => o.id);
      if (stale.length) await supabase.from('challenge_variants').delete().in('id', stale); // progress keeps variant_id=null + its assignment/submission
      log(`روز ${d.day_number} ذخیره شد`);
    }
    return challengeId;
  } catch (e) {
    // rollback what this import created
    if (created.challenge) await supabase.from('challenges').delete().eq('id', created.challenge);
    if (created.assignments.length) await supabase.from('assignments').delete().in('id', created.assignments);
    if (created.forms.length) await supabase.from('telegram_forms').delete().in('id', created.forms);
    throw e;
  }
}

/* ---------- export ---------- */
export async function exportChallengeJson(id: string, opts: { includeAssignments?: boolean } = { includeAssignments: true }) {
  const { data: cRaw } = await supabase.from('challenges').select('*').eq('id', id).single();
  const c: any = cRaw;
  const { data: days } = await supabase.from('challenge_days').select('*').eq('challenge_id', id).order('day_number');
  const { data: vars } = await supabase.from('challenge_variants').select('*').eq('challenge_id', id);
  const aIds = (vars ?? []).map((v: any) => v.assignment_id).filter(Boolean);
  const { data: assigns } = aIds.length && opts.includeAssignments ? await supabase.from('assignments').select('*').in('id', aIds) : { data: [] as any[] };
  const aMap = new Map((assigns ?? []).map((a: any) => [a.id, a]));
  return {
    $schema_version: 1,
    challenge: {
      title: c.title, slug: c.slug, description: c.description, cover_image: c.cover_image, start_date: c.start_date, days_count: c.days_count,
      status: c.status, eligible_all_boundless: c.eligible_all_boundless, eligible_course_ids: c.eligible_course_ids, default_deadline_time: c.default_deadline_time,
      gamification_enabled: c.gamification_enabled, streak_enabled: c.streak_enabled, notifications_enabled: c.notifications_enabled,
      leaderboard_enabled: c.leaderboard_enabled, unlock_next_on_complete: c.unlock_next_on_complete, ai_review_default: c.ai_review_default, coach_review_default: c.coach_review_default,
    },
    segments: c.segments, onboarding_form: c.onboarding_form_id ? { form_id: c.onboarding_form_id } : null,
    xp_rules: c.xp_rules, rewards: c.reward_rules, penalties: c.penalty_rules,
    notifications: { ...((c.notification_settings as any) || {}), messages: c.messages },
    days: (days ?? []).map((d: any) => ({
      day_number: d.day_number, title: d.title, short_description: d.short_description, goal: d.goal, estimated_minutes: d.estimated_minutes,
      xp: d.xp, required: d.required, review_mode: d.review_mode, unlock_time: d.unlock_time, deadline_time: d.deadline_time, deadline_hours: d.deadline_hours,
      notification_text: d.notification_text, followups: d.followups,
      stage_update: { enabled: d.stage_update_enabled, prompt: d.stage_update_prompt, suggest: d.stage_update_suggest },
      variants: (vars ?? []).filter((v: any) => v.day_id === d.id).map((v: any) => {
        const a: any = aMap.get(v.assignment_id);
        return {
          key: v.key, title: v.title, business_models: v.business_models, stages: v.stages, budgets: v.budgets, boundless_codes: v.boundless_codes,
          priority: v.priority, is_fallback: v.is_fallback, instructions: v.instructions, checklist: v.checklist, tips: v.tips, example: v.example,
          resources: v.resources, expected_result: v.expected_result, form_id: v.form_id,
          ...(a ? { assignment: { title: a.title, description: a.description, blocks: a.blocks, ai_feedback_enabled: a.ai_feedback_enabled, ai_feedback_prompt: a.ai_feedback_prompt, passing_score: a.passing_score, manual_review_enabled: a.manual_review_enabled, estimated_minutes: a.estimated_minutes } } : { assignment_id: v.assignment_id }),
        };
      }),
    })),
  };
}

export function downloadJson(obj: unknown, name: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

export async function challengeApi(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('challenge-api', { body: { action, ...payload } });
  if (error) {
    let msg = error.message;
    try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data && data.success === false) throw new Error(data.error || 'خطا');
  return data;
}

/* ---------- delete ---------- */
// Deletes a challenge and everything it generated: days, variants, participants,
// progress, metrics, events (cascade) plus assignments/forms created for it
// (tagged "challenge") and their submissions. Assignments/forms still used by
// another challenge are kept.
export async function deleteChallengeFully(id: string) {
  const [{ data: vars }, { data: prog }] = await Promise.all([
    supabase.from('challenge_variants').select('assignment_id, form_id').eq('challenge_id', id),
    supabase.from('challenge_progress').select('assignment_id, form_id').eq('challenge_id', id),
  ]);
  const rows = [...(vars ?? []), ...(prog ?? [])] as any[];
  let aIds = [...new Set(rows.map((r) => r.assignment_id).filter(Boolean))] as string[];
  let fIds = [...new Set(rows.map((r) => r.form_id).filter(Boolean))] as string[];
  if (aIds.length) {
    const [{ data: other }, { data: tagged }] = await Promise.all([
      supabase.from('challenge_variants').select('assignment_id').in('assignment_id', aIds).neq('challenge_id', id),
      supabase.from('assignments').select('id, tags').in('id', aIds),
    ]);
    const used = new Set((other ?? []).map((o: any) => o.assignment_id));
    aIds = (tagged ?? []).filter((a: any) => (a.tags ?? []).includes('challenge') && !used.has(a.id)).map((a: any) => a.id);
  }
  if (fIds.length) {
    const { data: other } = await supabase.from('challenge_variants').select('form_id').in('form_id', fIds).neq('challenge_id', id);
    const used = new Set((other ?? []).map((o: any) => o.form_id));
    fIds = fIds.filter((f) => !used.has(f));
  }
  const { error } = await supabase.from('challenges').delete().eq('id', id);
  if (error) throw new Error(error.message);
  if (aIds.length) {
    await supabase.from('assignment_ai_logs' as any).delete().in('assignment_id', aIds);
    await supabase.from('assignment_submissions').delete().in('assignment_id', aIds);
    const { error: e } = await supabase.from('assignments').delete().in('id', aIds);
    if (e) throw new Error('حذف تمرین‌ها: ' + e.message);
  }
  if (fIds.length) {
    const { data: subs } = await supabase.from('telegram_form_submissions').select('id').in('form_id', fIds);
    const sIds = (subs ?? []).map((s: any) => s.id);
    if (sIds.length) await supabase.from('telegram_form_answers').delete().in('submission_id', sIds);
    await supabase.from('telegram_form_submissions').delete().in('form_id', fIds);
    await supabase.from('telegram_form_fields').delete().in('form_id', fIds);
    const { error: e } = await supabase.from('telegram_forms').delete().in('id', fIds);
    if (e) throw new Error('حذف فرم‌ها: ' + e.message);
  }
  return { assignments: aIds.length, forms: fIds.length };
}

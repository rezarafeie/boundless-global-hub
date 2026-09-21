import type { PathId } from './types';

export type MediaBlock = {
  kind: 'video' | 'image' | 'gallery' | 'text';
  url?: string;
  urls?: string[];
  caption?: string;
};

export type ContentBlock = {
  key: string;
  title: string;
  body: string[];
  media?: MediaBlock[];
  cta?: string;
  followUp?: { title: string; options: string[] };
};

/** Default copy — every block can be overridden from Smart Test V2 admin. */
export const DEFAULT_CONTENT: Record<string, ContentBlock> = {
  trust_block: {
    key: 'trust_block',
    title: 'چرا فقط این ۵ مسیر رو بررسی می‌کنیم؟',
    body: [
      'ما تو آکادمی رفیعی چند سال مدل‌های مختلف رو بررسی و تجربه کردیم؛ از ترید، متاورس، آمازون و افیلیت تا فریلنسری و مدل‌های مختلف کسب‌وکار اینترنتی.',
      'قرار نیست ۵۰ تا راه پول درآوردن نشونت بدیم.',
      'می‌خوایم بین چند مدل که قابلیت تبدیل شدن به یک کسب‌وکار واقعی دارن، مناسب‌ترین نقطه شروع تو رو پیدا کنیم.',
    ],
    media: [],
    cta: 'خب؛ برگردیم سراغ خودت',
  },
  objection_time: {
    key: 'objection_time',
    title: 'واقعاً وقت نداری؟',
    body: [
      'یا این هنوز به اندازه کافی برات مهم نشده؟',
      'چون این دوتا خیلی با هم فرق دارن.',
      'کسی که وقت نداره، وقت خالی نداره. کسی که اولویت نداده، وقتش پر شده از چیزهای دیگه.',
    ],
    cta: 'ادامه',
  },
  objection_money: {
    key: 'objection_money',
    title: 'پول نداری. باشه.',
    body: [
      'ولی این دقیقاً یکی از دلایلیه که داریم مسیر رو بر اساس شرایط خودت انتخاب می‌کنیم.',
      'اگر سرمایه شروع تو پایینه، شاید اصلاً نباید امروز بری سمت مدلی که برای تست اولیه سرمایه بیشتری می‌خواد.',
      'پول کم می‌تونه انتخاب‌هات رو تغییر بده؛ ولی لزوماً انتخاب‌هات رو صفر نمی‌کنه.',
    ],
    cta: 'ادامه',
  },
  objection_country: {
    key: 'objection_country',
    title: 'محدودیت با بن‌بست فرق داره.',
    body: [
      'تحریم واقعیه. محدودیت پرداخت واقعیه. محدودیت بعضی سرویس‌ها هم واقعیه.',
      'ولی «محدودیت وجود داره» با «نمی‌شه» یکی نیست.',
      'زیرساختی که ما ساختیم دقیقاً برای همین فاصله‌ست.',
    ],
    media: [],
    cta: 'ادامه',
  },
  objection_dream_selling: {
    key: 'objection_dream_selling',
    title: 'فکر می‌کنی اینم رویافروشیه؟ خوبه. راحت باور نکن.',
    body: [
      'اینترنت پر شده از آدم‌هایی که با چند اسکرین‌شات، ماشین، سفر و عدد درآمد، «رویای درآمد دلاری» می‌فروشن.',
      'ولی یه اشتباه هم این وسط وجود داره: اینکه چون یه عده دارن رویا می‌فروشن، نتیجه بگیری اصل فرصت هم رویاست.',
      'من ازت نمی‌خوام حرف ما رو باور کنی. مدرک رو ببین. مدل کسب‌وکار رو ببین. چیزهایی که واقعاً ساخته شده رو ببین. بعد تصمیم بگیر.',
      'ادامه تست رو بر اساس منطق مسیر و شرایط خودت قضاوت کن.',
    ],
    media: [],
    cta: 'ادامه',
  },
  objection_trust: {
    key: 'objection_trust',
    title: 'به «درآمد دلاری»ها اعتماد نداری؟',
    body: [
      'منطقیه. چیزی که اکثراً دیدی، تبلیغ بوده نه کسب‌وکار.',
      'ما نمی‌خوایم بهت اعتماد تعارفی بدی. می‌خوایم مدل کار، زیرساخت و چیزی که ساخته شده رو ببینی و بعد قضاوت کنی.',
    ],
    media: [],
    cta: 'ادامه',
  },
  objection_skill: {
    key: 'objection_skill',
    title: '«من هیچ مهارتی ندارم.» مطمئنی؟',
    body: [
      'یا منظورت اینه: هیچ مهارتی که فکر کنم بشه ازش پول درآورد ندارم؟',
      'شاید مشکل تو «نداشتن توانایی» نیست. شاید تا امروز بلد نبودی توانایی‌هات رو تبدیل به Offer کنی.',
    ],
    cta: 'ادامه',
  },
  objection_failure: {
    key: 'objection_failure',
    title: 'ممکنه نتیجه نگیری.',
    body: [
      'اگر کسی بهت تضمین می‌ده حتماً پول درمیاری، اتفاقاً باید بهش شک کنی.',
      'ولی یه سؤال: اگر از ترس اینکه شاید شکست بخوری شروع نکنی، نتیجه اون تصمیم از همین الان مشخص نیست؟',
      'هیچ اتفاقی نمی‌افته.',
    ],
    media: [],
    cta: 'ادامه',
  },
  objection_later: {
    key: 'objection_later',
    title: 'چند وقته داری اینو به خودت می‌گی؟',
    body: [],
    followUp: {
      title: 'چند وقته؟',
      options: ['کمتر از یک ماه', '۱ تا ۶ ماه', '۶ تا ۱۲ ماه', 'بیشتر از یک سال'],
    },
    cta: 'ادامه',
  },
  objection_confusion: {
    key: 'objection_confusion',
    title: 'انقدر مسیر دیدی که دیگه نمی‌دونی کدوم واقعیه.',
    body: [
      'این خودش یه علامت مهمه: مشکل تو کمبود اطلاعات نیست، زیادی اطلاعاته بدون فیلتر.',
      'کاری که این تست می‌کنه دقیقاً حذف کردنه، نه اضافه کردن.',
    ],
    cta: 'ادامه',
  },
  boundless_bridge: {
    key: 'boundless_bridge',
    title: 'از اینجا به بعد، فرق دانستن و ساختن شروع می‌شه.',
    body: [
      'نتیجه تست بهت می‌گه چی رو شروع کنی.',
      'اما بین فهمیدن مسیر و ساختنش فاصله زیادی وجود داره.',
      'مسیر → آموزش → اجرا → تمرین → فیدبک → پشتیبانی → ابزار → زیرساخت',
    ],
    media: [],
  },
};

export const ROADMAPS: Record<PathId, { weeks: string[]; goal: string; journey: string[]; tools: string[] }> = {
  ai: {
    weeks: ['بازار + مسئله واقعی', 'ساخت Offer + نمونه اولیه', 'نمونه‌کار + زیرساخت', 'ارتباط‌گیری + اولین Leadها'],
    goal: 'ساخت Offer واقعی و گرفتن اولین Lead؛ نه دنبال کردن عددهای عجیب درآمدی.',
    journey: ['Market', 'Problem', 'Offer', 'AI Solution', 'Prototype', 'Sales', 'Payment', 'Scale'],
    tools: ['AI Coach', 'Synapse', 'Rafiei Builder', 'Rafiei Studio', 'BNETS', 'Rafiei Pay'],
  },
  dropshipping: {
    weeks: ['تحقیق محصول + بازار', 'تأمین‌کننده + فروشگاه', 'کریتیو + صفحه محصول', 'تبلیغ + اولین سفارش'],
    goal: 'رسیدن به اولین سفارش واقعی با کمترین هزینه تست.',
    journey: ['Product Research', 'Supplier', 'Store', 'Creative', 'Ads', 'Payment', 'Scale'],
    tools: ['Rafiei Dropship', 'Rafiei Store', 'Rafiei Studio', 'BNETS', 'Rafiei Pay'],
  },
  drop_service: {
    weeks: ['انتخاب خدمت + بازار هدف', 'ساخت Offer + قیمت‌گذاری', 'نمونه‌کار + تیم اجرا', 'Outreach + اولین مشتری'],
    goal: 'بستن اولین قرارداد خدماتی، حتی کوچک.',
    journey: ['Niche', 'Offer', 'Portfolio', 'Outreach', 'Client', 'Delivery', 'Payment', 'Scale'],
    tools: ['Rafiei Studio', 'AI Coach', 'BNETS', 'Rafiei Pay'],
  },
  digital_product: {
    weeks: ['انتخاب موضوع + مخاطب', 'ساخت نسخه اول محصول', 'صفحه فروش + پرداخت', 'اولین فروش + بازخورد'],
    goal: 'فروش اولین نسخه محصول دیجیتال، حتی ناقص.',
    journey: ['Audience', 'Topic', 'Product', 'Landing', 'Traffic', 'Payment', 'Scale'],
    tools: ['Rafiei Studio', 'Rafiei Builder', 'AI Coach', 'Rafiei Pay'],
  },
  vibe_coding: {
    weeks: ['پیدا کردن مسئله + کاربر', 'ساخت MVP', 'تست با کاربر واقعی', 'انتشار + اولین کاربرها'],
    goal: 'رسیدن به اولین کاربر واقعی ابزاری که ساختی.',
    journey: ['Problem', 'User', 'MVP', 'Feedback', 'Launch', 'Payment', 'Scale'],
    tools: ['Rafiei Builder', 'AI Coach', 'Synapse', 'BNETS', 'Rafiei Pay'],
  },
};

export const OBJECTION_BLOCK_KEY: Record<string, string> = {
  time: 'objection_time',
  money: 'objection_money',
  country: 'objection_country',
  dream_selling: 'objection_dream_selling',
  trust: 'objection_trust',
  skill: 'objection_skill',
  failure: 'objection_failure',
  later: 'objection_later',
  confusion: 'objection_confusion',
};

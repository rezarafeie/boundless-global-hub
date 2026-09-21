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
  conversation_intro: {
    key: 'conversation_intro',
    title: 'این یک تست شخصیت نیست.',
    body: [
      'من جواب‌هات رو کنار هم می‌ذارم، بعضی فرض‌هات رو به چالش می‌کشم و اگر لازم باشه وسط مسیر یک سؤال تازه می‌پرسم.',
      'آخرش هم فقط اسم یک مسیر رو نمی‌گم؛ می‌گم اگر جای تو بودم از کجا شروع می‌کردم، چه چیزی ممکنه متوقفم کنه و قدم اولم چی بود.',
    ],
    cta: 'بیا از واقعیت امروزت شروع کنیم',
  },
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
  analysis_media: {
    key: 'analysis_media',
    title: 'این چند ثانیه رو ببین.',
    body: ['تا نتیجه آماده می‌شه، یک نمونه واقعی از چیزی که در اکوسیستم بدون مرز ساخته شده می‌تونه تصویر دقیق‌تری بهت بده.'],
    media: [],
  },
  result_proof_dropshipping: { key: 'result_proof_dropshipping', title: 'نمونه‌ای نزدیک به مسیر تو', body: [], media: [] },
  result_proof_drop_service: { key: 'result_proof_drop_service', title: 'نمونه‌ای نزدیک به مسیر تو', body: [], media: [] },
  result_proof_digital_product: { key: 'result_proof_digital_product', title: 'نمونه‌ای نزدیک به مسیر تو', body: [], media: [] },
  result_proof_ai: { key: 'result_proof_ai', title: 'نمونه‌ای نزدیک به مسیر تو', body: [], media: [] },
  result_proof_vibe_coding: { key: 'result_proof_vibe_coding', title: 'نمونه‌ای نزدیک به مسیر تو', body: [], media: [] },
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
    media: [{ kind: 'video', url: 'https://rafiei.arvanvod.ir/d7maAb4xV6/L3GK8LKN4r/origin_config.json', caption: 'توضیح زیرساخت بین‌المللی؛ محدودیت‌ها حذف نمی‌شوند، اما مسیر اجرای آن‌ها روشن می‌شود.' }],
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

export const PATH_EDUCATION: Record<PathId, ContentBlock & { transaction: string[]; reality: string }> = {
  dropshipping: {
    key: 'education_dropshipping', title: 'Dropshipping یعنی ساخت یک سیستم فروش محصول، نه پیدا کردن یک محصول جادویی.',
    body: ['تو محصول را انتخاب و عرضه می‌کنی؛ تأمین‌کننده بعد از سفارش آن را ارسال می‌کند. کار اصلی تو تحقیق بازار، ساخت پیشنهاد، صفحه فروش و جذب مشتری است.'],
    transaction: ['نیاز بازار', 'محصول و فروشگاه', 'جذب مشتری', 'سفارش و ارسال'],
    reality: 'تست محصول و تبلیغ هزینه و تحمل ریسک می‌خواهد؛ برای سرمایه و زمان خیلی محدود، نقطه شروع ساده‌ای نیست.',
    media: [{ kind: 'video', url: 'https://rafiei.arvanvod.ir/d7maAb4xV6/Q6KR1rW03n/origin_config.json', caption: 'توضیح واقعی مدل Dropshipping از تجربه آموزشی بدون مرز' }],
  },
  drop_service: {
    key: 'education_drop_service', title: 'Drop Service یعنی تو مسئله مشتری را می‌فروشی و اجرای آن را مدیریت می‌کنی.',
    body: ['لازم نیست همه کار را خودت انجام بدهی؛ اما باید فروش، تعریف خروجی، کنترل کیفیت و ارتباط با مشتری را جدی بگیری.'],
    transaction: ['مسئله مشتری', 'پیشنهاد خدمت', 'تیم یا ابزار اجرا', 'تحویل و دریافت پول'],
    reality: 'شروعش می‌تواند کم‌هزینه باشد، اما بدون مذاکره و مسئولیت تحویل، مدل راحتی نیست.',
    media: [{ kind: 'video', url: 'https://rafiei.arvanvod.ir/d7maAb4xV6/jMWgm1gql9/origin_config.json', caption: 'تصویر عملی مدل فروش و تحویل خدمت' }],
  },
  digital_product: {
    key: 'education_digital_product', title: 'محصول دیجیتال یعنی دانشت را به یک دارایی قابل‌فروش تبدیل کنی.',
    body: ['فایل، قالب، آموزش یا ابزار کوچک زمانی محصول می‌شود که یک مسئله مشخص را برای مخاطب مشخص حل کند.'],
    transaction: ['مسئله تکرارشونده', 'محصول قابل تحویل', 'صفحه فروش', 'فروش و بازخورد'],
    reality: 'ساخت محصول کافی نیست؛ توزیع، اعتماد و شناخت مخاطب بخش سخت ماجراست.', media: [],
  },
  ai: {
    key: 'education_ai', title: 'AI Business یعنی حل مسئله با هوش مصنوعی؛ نه صرفاً بلد بودن چند ابزار.',
    body: ['ارزش از جایی می‌آید که یک فرایند پرهزینه یا کند را برای یک مشتری سریع‌تر، دقیق‌تر یا ارزان‌تر کنی.'],
    transaction: ['مسئله کسب‌وکار', 'راه‌حل AI', 'نمونه اولیه', 'فروش و بهبود'],
    reality: 'ابزارها سریع عوض می‌شوند؛ مزیت پایدار تو فهم مسئله و توان فروش راه‌حل است.', media: [],
  },
  vibe_coding: {
    key: 'education_vibe_coding', title: 'Vibe Coding یعنی با کمک AI ابزار واقعی بسازی؛ نه اینکه فقط کد تولید کنی.',
    body: ['از یک مسئله کوچک شروع می‌کنی، نسخه اولیه می‌سازی و با کاربر واقعی بررسی می‌کنی آیا ارزش پرداخت دارد یا نه.'],
    transaction: ['مسئله کاربر', 'MVP', 'تست واقعی', 'اشتراک یا فروش'],
    reality: 'ساختن امروز آسان‌تر شده؛ پیدا کردن مسئله درست، توزیع و نگهداری هنوز کار واقعی‌اند.', media: [],
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

import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { PATH_LABELS, type Answers, type PathId, type Profile } from '@/data/smartTestV2/types';

const one = (answers: Answers, key: string) => String(answers[key] || '');
const many = (answers: Answers, key: string) => {
  const value = answers[key];
  return Array.isArray(value) ? value : value ? [value] : [];
};

export const answerLabel = (answers: Answers, questionId: string) => {
  const value = one(answers, questionId);
  return QUESTION_BY_ID[questionId]?.options.find((option) => option.value === value)?.label || '';
};

export const profileNarrative = (profile: Profile) => {
  const labels: Record<string, string> = {
    Seller: 'فروشنده', Creator: 'خالق', Builder: 'سازنده', Operator: 'اجراگر', Explorer: 'جست‌وجوگر',
  };
  const parts = profile.type.split(' × ').map((part) => labels[part] || part);
  const title = parts.length > 1 ? `${parts[0]}ِ ${parts[1]}` : parts[0];
  const dims = [
    ['commercial', profile.commercial], ['creative', profile.creative],
    ['technical', profile.technical], ['execution', profile.execution],
  ] as const;
  const lowest = [...dims].sort((a, b) => a[1] - b[1])[0][0];
  const caution: Record<typeof lowest, string> = {
    commercial: 'برای نتیجه گرفتن، باید عرضه‌کردن و گفت‌وگو با بازار را جدی‌تر بگیری.',
    creative: 'ایده کافی نیست؛ لازم است برای ارائه و تمایز خروجی‌ات وقت مشخص بگذاری.',
    technical: 'اگر مسیر بیش از حد فنی شود، بهتر است مرحله‌به‌مرحله جلو بروی، نه با یک پروژه سنگین.',
    execution: 'خطر اصلی برای تو پراکندگی و نیمه‌کاره گذاشتن است؛ یک مسیر را تا خروجی نگه دار.',
  };
  const top = [...dims].sort((a, b) => b[1] - a[1])[0][0];
  const strength: Record<typeof top, string> = {
    commercial: 'تو معمولاً ارزش را زودتر در بازار و مشتری می‌بینی.',
    creative: 'تو از تبدیل فکر و تجربه به یک خروجی تازه انرژی می‌گیری.',
    technical: 'تو بیشتر از مصرف‌کردن، از ساختن و حل مسئله لذت می‌بری.',
    execution: 'تو وقتی مسیر روشن باشد، ترجیح می‌دهی وارد عمل شوی و خروجی ببینی.',
  };
  return { title, description: `${strength[top]} ${caution[lowest]}` };
};

export const conditionsInsight = (answers: Answers) => {
  const time = answerLabel(answers, 'q2_time');
  const capital = answerLabel(answers, 'q3_capital');
  if (!time || !capital) return '';
  const capitalValue = one(answers, 'q3_capital');
  const implication = ['zero', 'lt100'].includes(capitalValue)
    ? 'پس مدلی که قبل از اولین درآمد به تست سرمایه سنگین نیاز دارد، نقطه شروع ایده‌آلت نیست.'
    : 'پس محدودیت اصلی تو فقط سرمایه نیست؛ کیفیت انتخاب و اجرای تست اولیه مهم‌تر می‌شود.';
  return `گفتی روزانه ${time} زمان داری و سرمایه شروع تو ${capital} است. ${implication}`;
};

export const profileSignal = (answers: Answers) => {
  const scenario = answerLabel(answers, 'q7_scenario');
  const skills = many(answers, 'q6_skills')
    .map((value) => QUESTION_BY_ID.q6_skills.options.find((option) => option.value === value)?.label)
    .filter(Boolean)
    .slice(0, 2);
  if (!scenario) return '';
  return skills.length
    ? `در سناریوی واقعی، «${scenario}» را انتخاب کردی و ${skills.join(' و ')} را هم در خودت می‌بینی. این ترکیب از علاقه مهم‌تر است.`
    : `در سناریوی واقعی، «${scenario}» را انتخاب کردی. این انتخاب عملی، برای تحلیل از علاقه خام مهم‌تر است.`;
};

export const pathReasonLine = (path: PathId, profile: Profile) => {
  if (path === 'ai') return profile.technical >= profile.commercial ? 'چون بیشتر از مصرف‌کردن، مسئله حل می‌کنی و می‌سازی.' : 'چون می‌توانی حل مسئله را به یک پیشنهاد قابل‌فروش تبدیل کنی.';
  if (path === 'vibe_coding') return 'چون ساختن یک ابزار واقعی بیشتر از دنبال‌کردن ایده‌ها با مدل کاری تو جور است.';
  if (path === 'drop_service') return 'چون کوتاه‌ترین فاصله تو تا بازار، تبدیل توانایی به یک خدمت مشخص است.';
  if (path === 'digital_product') return 'چون مدل کاری تو با ساختن یک‌باره و فروش چندباره هم‌جهت است.';
  return 'چون ترکیب سرمایه، تحمل ریسک و علاقه‌ات به بازار با تست محصول هم‌خوان است.';
};

export const pathActions: Record<PathId, { title: string; action: string; output: string }[]> = {
  ai: [
    { title: 'این هفته', action: 'یک مشکل تکراری در یک کسب‌وکار واقعی پیدا کن.', output: 'خروجی: یک مسئله روشن و قابل‌اندازه‌گیری' },
    { title: 'هفته بعد', action: 'یک راه‌حل خیلی ساده با AI بساز و نشانش بده.', output: 'خروجی: نمونه اولیه قابل‌نمایش' },
    { title: 'قبل از روز ۳۰', action: 'راه‌حل را به اولین مشتری واقعی پیشنهاد بده.', output: 'خروجی: اولین گفت‌وگوی فروش یا مشتری' },
  ],
  dropshipping: [
    { title: 'این هفته', action: 'یک بازار و سه مسئله خرید واقعی را بررسی کن.', output: 'خروجی: فهرست کوتاه محصولات قابل‌تست' },
    { title: 'هفته بعد', action: 'یک محصول را با تأمین‌کننده و حاشیه سود واقعی اعتبارسنجی کن.', output: 'خروجی: محصول و عددهای قابل‌دفاع' },
    { title: 'قبل از روز ۳۰', action: 'یک تست کوچک فروش اجرا کن؛ نه یک فروشگاه بزرگ.', output: 'خروجی: اولین سفارش یا داده روشن برای اصلاح' },
  ],
  drop_service: [
    { title: 'این هفته', action: 'یک خدمت باریک برای یک بازار مشخص تعریف کن.', output: 'خروجی: پیشنهاد یک‌جمله‌ای و قیمت اولیه' },
    { title: 'هفته بعد', action: 'یک نمونه نتیجه یا اجرای آزمایشی آماده کن.', output: 'خروجی: نمونه‌کار قابل‌ارسال' },
    { title: 'قبل از روز ۳۰', action: 'با مشتری‌های واقعی وارد گفت‌وگو شو.', output: 'خروجی: اولین قرارداد یا بازخورد بازار' },
  ],
  digital_product: [
    { title: 'این هفته', action: 'یک مشکل کوچک و تکرارشونده مخاطب را انتخاب کن.', output: 'خروجی: وعده روشن محصول' },
    { title: 'هفته بعد', action: 'نسخه اول را کوچک و قابل‌فروش بساز.', output: 'خروجی: محصول اولیه، نه دوره کامل' },
    { title: 'قبل از روز ۳۰', action: 'آن را به ده مخاطب واقعی عرضه کن.', output: 'خروجی: اولین فروش یا دلیل روشن برای اصلاح' },
  ],
  vibe_coding: [
    { title: 'این هفته', action: 'یک مشکل کوچک برای یک کاربر مشخص انتخاب کن.', output: 'خروجی: تعریف کاربر و یک کار اصلی' },
    { title: 'هفته بعد', action: 'فقط همان کار اصلی را به یک MVP تبدیل کن.', output: 'خروجی: ابزار قابل‌استفاده' },
    { title: 'قبل از روز ۳۰', action: 'پنج کاربر واقعی را وادار کن از آن استفاده کنند.', output: 'خروجی: استفاده واقعی و فهرست اصلاحات' },
  ],
};

export const riskCorrection = (weakness: string | null) => {
  if (!weakness) return 'هر هفته فقط یک خروجی قابل‌دیدن تعریف کن و تا تحویل آن، مسیر تازه‌ای شروع نکن.';
  if (weakness.includes('فروش')) return 'قبل از کامل‌کردن محصول، با پنج مشتری احتمالی حرف بزن و پیشنهادت را با واکنش واقعی آن‌ها اصلاح کن.';
  if (weakness.includes('پیوستگی')) return 'برای ۳۰ روز، یک ساعت ثابت و یک خروجی هفتگی غیرقابل‌مذاکره تعیین کن.';
  if (weakness.includes('ابزار')) return 'هفته اول را فقط به یک ابزار و یک پروژه کوچک محدود کن؛ هم‌زمان چند ابزار یاد نگیر.';
  if (weakness.includes('زبان')) return 'هر روز ۲۰ دقیقه زبان کاربردی همان مسیر را کنار اجرای پروژه تمرین کن.';
  return 'مانع اصلی را به یک تمرین هفتگی قابل‌اندازه‌گیری تبدیل کن و پیشرفت را ثبت کن.';
};

export const alternativeNote = (answers: Answers, path: PathId) => {
  const evidence = [answerLabel(answers, 'q7_scenario'), answerLabel(answers, 'q14_tradeoff')].filter(Boolean);
  return evidence.length
    ? `این مسیر هنوز با بخشی از انتخاب‌هایت—به‌خصوص «${evidence[0]}»—هماهنگ است؛ اگر مهارت کلیدی آن را تقویت کنی، می‌تواند جلو بیفتد.`
    : `${PATH_LABELS[path]} انتخاب دوم معناداری است، اما امروز شواهد کمتری از مسیر اول دارد.`;
};

export const notNowNote = (answers: Answers, path: PathId) => {
  const capital = answerLabel(answers, 'q3_capital');
  const risk = answerLabel(answers, 'q8_risk');
  return `با سرمایه‌ای که گفتی (${capital || 'شرایط فعلی'}) و ریسکی که بیشتر اذیتت می‌کند (${risk || 'ریسک شروع'}), ${PATH_LABELS[path]} فعلاً نقطه شروع ضعیف‌تری است؛ نه یک مسیر غیرممکن برای همیشه.`;
};
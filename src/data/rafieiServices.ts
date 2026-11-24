import type { LucideIcon } from 'lucide-react';
import { PenLine, Hammer, Clapperboard, CreditCard, LineChart, ShoppingBag, Package, Sparkles, Apple, GraduationCap, Cloud, ArrowLeftRight, Briefcase, Bot, MessageCircle, Newspaper, Trophy, Radio, ClipboardCheck, BookOpen, LifeBuoy, Send } from 'lucide-react';

export type ServiceGroup = 'learning' | 'ai' | 'business' | 'life' | 'community';
export interface RafieiService {
  name: string;
  en: string;
  tagline: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: ServiceGroup;
  internal?: boolean;
}

export const serviceGroups: Record<ServiceGroup, { title: string; en: string; sub: string }> = {
  learning: { title: 'یادگیری و رشد فردی', en: 'Learning', sub: 'دوره، سنجش، مربی هوشمند، مجله و رویدادهای زنده' },
  ai: { title: 'خلق و تولید با هوش مصنوعی', en: 'Create & AI', sub: 'ویدیو، وب‌سایت، تصویر و دستیار هوشمند' },
  business: { title: 'کسب‌وکار، تجارت و خدمات مالی', en: 'Business & Finance', sub: 'فروشگاه، دراپ‌شیپ، ارز، پرداخت، مالی و رشد' },
  life: { title: 'سبک زندگی و سلامت', en: 'Life & Health', sub: 'تناسب اندام و بازارهای مالی' },
  community: { title: 'ارتباطات و زیرساخت', en: 'Community & Infrastructure', sub: 'پیام‌رسان، فضای ابری، چالش و پشتیبانی' },
};

export const rafieiServices: RafieiService[] = [
  { name: 'آکادمی', en: 'Academy', tagline: 'دوره‌های تخصصی بیزینس، بازاریابی، AI و درآمد دلاری', description: 'مرکز جامع دوره‌های تخصصی رضا رفیعی؛ ویدیوهای آموزشی، مسیرهای پیشرفت، جزوات و آزمون‌های گام‌به‌گام.', href: '/courses', icon: BookOpen, group: 'learning', internal: true },
  { name: 'مرکز ارزیابی', en: 'Assessment', tagline: 'ده‌ها تست شخصیتی، شغلی و هوش هیجانی', description: 'MBTI، دیسک، انیاگرام و تست‌های فروش به‌همراه تحلیل جامع و نمودارهای اختصاصی.', href: '/assessment-center', icon: ClipboardCheck, group: 'learning', internal: true },
  { name: 'ویولرن', en: 'WeaveLearn · Coach', tagline: 'آموزش تعاملی و مربی همراه با هوش مصنوعی', description: 'میکرولیسن، خلاصه‌سازی هوشمند و پرسش‌وپاسخ برای تسلط بر هر مهارت.', href: 'https://coach.rafiei.co', icon: GraduationCap, group: 'learning' },
  { name: 'مجله رفیعی', en: 'Mag', tagline: 'تحلیل، اخبار فناوری و روندهای هوش مصنوعی', description: 'مقالات تحلیلی و آموزش‌های کاربردی برای رشد کسب‌وکار.', href: 'https://mag.rafiei.co', icon: Newspaper, group: 'learning' },
  { name: 'وبینارها و رویدادها', en: 'Webinars', tagline: 'کارگاه‌های آنلاین و پرسش‌وپاسخ زنده', description: 'وبینارها و کارگاه‌های تخصصی و جلسات زنده برای اعضا.', href: '/hub', icon: Radio, group: 'learning', internal: true },
  { name: 'ادیتور جی‌پی‌تی', en: 'EditorGPT', tagline: 'تدوین و تولید ویدیو با هوش مصنوعی', description: 'سناریونویسی، کلیپ اینستاگرام و یوتیوب، زیرنویس خودکار و تیزر تبلیغاتی.', href: 'https://editorgpt.rafiei.co', icon: Clapperboard, group: 'ai' },
  { name: 'بیلدر', en: 'Builder', tagline: 'ساخت وب‌سایت و لندینگ با هوش مصنوعی', description: 'از پرامپت متنی تا صفحه وب مدرن با پیش‌نمایش زنده و کدنویسی خودکار.', href: 'https://builder.rafiei.co', icon: Hammer, group: 'ai' },
  { name: 'استودیو', en: 'Studio', tagline: 'تولید و ویرایش حرفه‌ای تصویر با AI', description: 'تصاویر تبلیغاتی، بازطراحی گرافیک و بنرهای باکیفیت برای رسانه و محصول.', href: 'https://studio.rafiei.co', icon: PenLine, group: 'ai' },
  { name: 'سیناپس', en: 'Synapse', tagline: 'دستیار مرکزی ایده‌پردازی و مدیریت تسک', description: 'اتصال موتورهای تفکر هوش مصنوعی به کارهای روزمره و خودکارسازی تسک‌ها.', href: 'https://synapse.rafiei.co', icon: Bot, group: 'ai' },
  { name: 'استور', en: 'Store', tagline: 'فروشگاه‌ساز هوشمند با محصولات پرفروش', description: 'ساخت سریع فروشگاه اینترنتی و اتصال به درگاه پرداخت.', href: 'https://store.rafiei.co', icon: ShoppingBag, group: 'business' },
  { name: 'دراپ‌شیپ', en: 'Dropship', tagline: 'فروش اینترنتی بدون انبار', description: 'اتصال به تأمین‌کنندگان جهانی مثل CJ و AliExpress و ارسال مستقیم به مشتری.', href: 'https://dropship.rafiei.co', icon: Package, group: 'business' },
  { name: 'اکسچنج', en: 'Exchange', tagline: 'خدمات ارزی و پرداخت‌های بین‌المللی', description: 'حساب بین‌المللی، ثبت شرکت خارجی، نقد درآمد ارزی و پرداخت‌های دلاری و سفارت.', href: 'https://exchange.rafiei.co', icon: ArrowLeftRight, group: 'business' },
  { name: 'رفیعی پی', en: 'Pay', tagline: 'زیرساخت درگاه پرداخت و تسویه امن', description: 'درگاه پرداخت آنلاین و مدیریت تراکنش‌ها برای کسب‌وکارها.', href: 'https://pay.rafiei.co', icon: CreditCard, group: 'business' },
  { name: 'فایننشال', en: 'Financial', tagline: 'حسابداری هوشمند و سلامت مالی', description: 'مدیریت جریان نقدینگی و تحلیل سودآوری کسب‌وکار.', href: 'https://financial.rafiei.co', icon: LineChart, group: 'business' },
  { name: 'آژانس رشد', en: 'Agency', tagline: 'بازاریابی دیجیتال، برندینگ و کمپین', description: 'خدمات جامع رشد و توسعه فروش برای کسب‌وکارهای مقیاس‌پذیر.', href: 'https://agency.rafiei.co', icon: Briefcase, group: 'business' },
  { name: 'ایت‌فیت', en: 'EatFit', tagline: 'رژیم و تمرین شخصی‌سازی‌شده با AI', description: 'برنامه غذایی و تمرینی بر اساس آنالیز بدن و رهگیری هفتگی وزن و سایز.', href: 'https://eatfit.fit', icon: Apple, group: 'life' },
  { name: 'اورا', en: 'Aura', tagline: 'دستیار تریدینگ و بازارهای مالی', description: 'قیمت لحظه‌ای رمزارز، فارکس و طلا، ژورنال معاملاتی و تحلیل روند با AI.', href: 'https://aura.rafiei.co', icon: Sparkles, group: 'life' },
  { name: 'پیام‌رسان', en: 'Messenger', tagline: 'شبکه گفت‌وگوی اعضای اکوسیستم رفیعی', description: 'تبادل نظر میان دانشجویان دوره‌ها و کارآفرینان.', href: 'https://messenger.rafiei.co', icon: MessageCircle, group: 'community' },
  { name: 'کلاد', en: 'Cloud', tagline: 'فضای ابری اختصاصی و امن', description: 'ذخیره و مدیریت فایل‌ها و پروژه‌های ساخته‌شده در سرویس‌های رفیعی.', href: 'https://cloud.rafiei.co', icon: Cloud, group: 'community' },
  { name: 'چالش بدون مرز', en: 'Boundless Challenge', tagline: 'مسابقه عملی ورود به کسب‌وکار و فروش', description: 'دوره‌ها و چالش‌های عملی برای رسیدن به استقلال مالی.', href: '/challenges', icon: Trophy, group: 'community', internal: true },
  { name: 'مرکز راهنما', en: 'Help Center', tagline: 'پایگاه دانش و پشتیبانی متمرکز', description: 'پاسخ سریع و پشتیبانی هر وقت لازم داشتی.', href: '/support', icon: LifeBuoy, group: 'community', internal: true },
  { name: 'ربات تلگرام', en: 'Telegram Bot', tagline: 'نوتیفیکیشن‌ها و آخرین تغییرات در تلگرام', description: 'دستیار تلگرامی برای دوره، پشتیبانی و اعلان‌ها.', href: 'https://t.me/rafieiacademy', icon: Send, group: 'community' },
];

export const pickServices = (n: number, exclude: string[] = []) => {
  const pool = rafieiServices.filter((s) => !exclude.includes(s.href));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
};

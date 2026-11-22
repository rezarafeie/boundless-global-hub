import type { LucideIcon } from 'lucide-react';
import { PenLine, Hammer, Clapperboard, CreditCard, LineChart, ShoppingBag, Package, Sparkles, Apple, GraduationCap, Cloud, ArrowLeftRight, Briefcase, Bot, MessageCircle, Newspaper, Trophy, Radio, ClipboardCheck, BookOpen, LifeBuoy, Globe2, Send } from 'lucide-react';

export type ServiceGroup = 'ai' | 'business' | 'finance' | 'learning';
export interface RafieiService {
  name: string;
  tagline: string;
  href: string;
  icon: LucideIcon;
  group: ServiceGroup;
  internal?: boolean;
}

export const serviceGroups: Record<ServiceGroup, { title: string; sub: string }> = {
  learning: { title: 'یادگیری و رشد', sub: 'از اولین درس تا چالش، وبینار و جامعه' },
  ai: { title: 'هوش مصنوعی و ساخت', sub: 'ابزارهایی که ایده را به محصول تبدیل می‌کنند' },
  business: { title: 'کسب‌وکار و فروش', sub: 'فروشگاه، دراپ‌شیپ، آژانس و رسانه' },
  finance: { title: 'مالی و زیرساخت', sub: 'پرداخت، صرافی، معامله‌گری و ابر' },
};

export const rafieiServices: RafieiService[] = [
  { name: 'مرکز آموزش', tagline: 'دوره‌های کسب‌وکار بین‌المللی و اجرامحور', href: '/courses', icon: BookOpen, group: 'learning', internal: true },
  { name: 'چالش بدون مرز', tagline: 'هر روز یک ماموریت؛ تا نتیجه', href: '/challenges', icon: Trophy, group: 'learning', internal: true },
  { name: 'وبینارها', tagline: 'جلسات زنده با پرسش و پاسخ', href: '/hub', icon: Radio, group: 'learning', internal: true },
  { name: 'مرکز سنجش', tagline: 'آزمون‌هایی که مسیرت را روشن می‌کنند', href: '/assessment-center', icon: ClipboardCheck, group: 'learning', internal: true },
  { name: 'هاب بدون مرز', tagline: 'جامعه و شبکه هم‌مسیرها', href: '/hub', icon: Globe2, group: 'learning', internal: true },
  { name: 'مرکز پشتیبانی', tagline: 'پاسخ سریع، هر وقت لازم داشتی', href: '/support', icon: LifeBuoy, group: 'learning', internal: true },
  { name: 'ربات تلگرام', tagline: 'دوره، پشتیبانی و اعلان‌ها در تلگرام', href: 'https://t.me/rafieiacademy', icon: Send, group: 'learning' },
  { name: 'Coach', tagline: 'مربی شخصی هوشمند برای رشد', href: 'https://coach.rafiei.co', icon: GraduationCap, group: 'learning' },
  { name: 'EditorGPT', tagline: 'نوشتن و ویرایش متن با هوش مصنوعی', href: 'https://editorgpt.rafiei.co', icon: PenLine, group: 'ai' },
  { name: 'Builder', tagline: 'از ایده و پرامپت تا محصول دیجیتال واقعی', href: 'https://builder.rafiei.co', icon: Hammer, group: 'ai' },
  { name: 'Studio', tagline: 'تولید محتوا و کمپین در یک فضای کاری', href: 'https://studio.rafiei.co', icon: Clapperboard, group: 'ai' },
  { name: 'Synapse', tagline: 'ساخت و مدیریت دستیارهای هوشمند', href: 'https://synapse.rafiei.co', icon: Bot, group: 'ai' },
  { name: 'EatFit', tagline: 'تغذیه و تمرین شخصی با هوش مصنوعی', href: 'https://eatfit.fit', icon: Apple, group: 'ai' },
  { name: 'Store', tagline: 'راه‌اندازی و مدیریت فروشگاه آنلاین', href: 'https://store.rafiei.co', icon: ShoppingBag, group: 'business' },
  { name: 'Dropship', tagline: 'پیدا کردن، وارد کردن و فروش محصول', href: 'https://dropship.rafiei.co', icon: Package, group: 'business' },
  { name: 'Agency', tagline: 'استراتژی، رشد، بازاریابی و اجرا', href: 'https://agency.rafiei.co', icon: Briefcase, group: 'business' },
  { name: 'Messenger', tagline: 'پیام‌رسان اختصاصی جامعه رفیعی', href: 'https://messenger.rafiei.co', icon: MessageCircle, group: 'business' },
  { name: 'Rafiei Mag', tagline: 'اولین مجله فناوری و کسب‌وکار هوش مصنوعی', href: 'https://mag.rafiei.co', icon: Newspaper, group: 'business' },
  { name: 'Rafiei Pay', tagline: 'یکپارچه‌سازی درگاه‌ها و پرداخت‌ها', href: 'https://pay.rafiei.co', icon: CreditCard, group: 'finance' },
  { name: 'Financial', tagline: 'مدیریت مالی و حسابداری کسب‌وکار', href: 'https://financial.rafiei.co', icon: LineChart, group: 'finance' },
  { name: 'Exchange', tagline: 'زیرساخت تبادل و انتقال پول بین‌المللی', href: 'https://exchange.rafiei.co', icon: ArrowLeftRight, group: 'finance' },
  { name: 'Aura', tagline: 'دستیار هوشمند معامله‌گری و تحلیل بازار', href: 'https://aura.rafiei.co', icon: Sparkles, group: 'finance' },
  { name: 'Cloud', tagline: 'دیتابیس، احراز هویت و ذخیره‌سازی ابری', href: 'https://cloud.rafiei.co', icon: Cloud, group: 'finance' },
];

export const pickServices = (n: number, exclude: string[] = []) => {
  const pool = rafieiServices.filter((s) => !exclude.includes(s.href));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
};

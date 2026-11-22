import hero_stage from '@/assets/real/hero_stage.webp.asset.json';
import hero_hall from '@/assets/real/hero_hall.webp.asset.json';
import hero_crowd from '@/assets/real/hero_crowd.webp.asset.json';
import hero_meta from '@/assets/real/hero_meta.webp.asset.json';
import hero_blue from '@/assets/real/hero_blue.webp.asset.json';
import founder from '@/assets/real/founder.webp.asset.json';
import quote from '@/assets/real/quote.webp.asset.json';
import c_boundless from '@/assets/real/c_boundless.webp.asset.json';
import c_instagram from '@/assets/real/c_instagram.webp.asset.json';
import c_wealth from '@/assets/real/c_wealth.webp.asset.json';
import c_ai from '@/assets/real/c_ai.webp.asset.json';
import c_taste from '@/assets/real/c_taste.webp.asset.json';
import c_change from '@/assets/real/c_change.webp.asset.json';
import c_america from '@/assets/real/c_america.webp.asset.json';
import c_rescue from '@/assets/real/c_rescue.webp.asset.json';
import c_teal from '@/assets/real/c_teal.webp.asset.json';
import g1 from '@/assets/real/g1.webp.asset.json';
import g2 from '@/assets/real/g2.webp.asset.json';
import g3 from '@/assets/real/g3.webp.asset.json';
import g4 from '@/assets/real/g4.webp.asset.json';

export const founderImage = founder.url;
export const portraitImage = quote.url;

export interface HeroScene { image: string; eyebrow: string; line: string; sub: string; position: string; }

/** Each visit shows one scene: a different real photo, line and mood. */
export const heroScenes: HeroScene[] = [
  { image: hero_stage.url, eyebrow: 'صحنه', line: 'هزاران نفر شروع کردند، چون یک نفر جرئت کرد بپرسد «چرا من نه؟»', sub: 'سؤال تو از همین‌جا جواب می‌گیرد.', position: 'object-[30%_25%]' },
  { image: hero_hall.url, eyebrow: 'هم‌مسیر', line: 'تنها نیستی؛ هزاران نفر همین حالا در همین مسیرند.', sub: 'جای تو در این سالن خالی است.', position: 'object-center' },
  { image: hero_crowd.url, eyebrow: 'لحظه', line: 'یک تصمیم، کافی است تا مسیر یک زندگی عوض شود.', sub: 'و آن تصمیم، همیشه امروز گرفته می‌شود.', position: 'object-center' },
  { image: hero_meta.url, eyebrow: 'آینده', line: 'آینده منتظر کسی نمی‌ماند؛ فقط به کسانی می‌رسد که زودتر راه افتادند.', sub: 'مهارت، تنها پاسپورتی است که هیچ‌وقت باطل نمی‌شود.', position: 'object-[40%_center]' },
  { image: hero_blue.url, eyebrow: 'تغییر', line: 'بزرگ‌ترین ریسک، زندگی‌ای است که هیچ‌وقت امتحانش نکردی.', sub: 'یک قدم کوچک امروز، فاصله‌ی تو با نسخه‌ی بهترت را نصف می‌کند.', position: 'object-[30%_center]' },
];

export const pickHeroScene = () => heroScenes[Math.floor(Math.random() * heroScenes.length)];

/** Cover photo for a course card, chosen from its slug or title. */
export const courseImage = (slug = '', title = ''): string => {
  const s = `${slug} ${title}`.toLowerCase();
  if (s.includes('taste') || title.includes('مزه')) return c_taste.url;
  if (s.includes('instagram') || title.includes('اینستاگرام')) return c_instagram.url;
  if (s.includes('metaverse') || title.includes('متاورس')) return hero_meta.url;
  if (s.includes('servit') || s.includes('wealth') || s.includes('servat') || title.includes('ثروت')) return c_wealth.url;
  if (s.includes('passive') || title.includes('غیرفعال')) return c_teal.url;
  if (s.includes('smart') || title.includes('هوش')) return c_ai.url;
  if (s.includes('america') || title.includes('آمریکا')) return c_america.url;
  if (s.includes('rescue') || s.includes('crisis') || title.includes('بحران') || title.includes('نجات')) return c_rescue.url;
  if (s.includes('change') || title.includes('تغییر')) return c_change.url;
  if (s.includes('boundless') || title.includes('بدون مرز') || title.includes('شروع')) return c_boundless.url;
  return founder.url;
};

export const sceneGallery = [g1.url, g2.url, g3.url, g4.url, c_change.url];

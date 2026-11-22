import heroStage from '@/assets/scenes/hero_stage.webp.asset.json';
import heroCity from '@/assets/scenes/hero_city.webp.asset.json';
import heroNight from '@/assets/scenes/hero_night.webp.asset.json';
import heroTravel from '@/assets/scenes/hero_travel.webp.asset.json';
import heroPortrait from '@/assets/scenes/hero_portrait.webp.asset.json';
import cardAi from '@/assets/scenes/card_ai.webp.asset.json';
import cardAmerica from '@/assets/scenes/card_america.webp.asset.json';
import cardBoundless from '@/assets/scenes/card_boundless.webp.asset.json';
import cardChange from '@/assets/scenes/card_change.webp.asset.json';
import cardInstagram from '@/assets/scenes/card_instagram.webp.asset.json';
import cardMetaverse from '@/assets/scenes/card_metaverse.webp.asset.json';
import cardRescue from '@/assets/scenes/card_rescue.webp.asset.json';
import cardTaste from '@/assets/scenes/card_taste.webp.asset.json';
import cardWealth from '@/assets/scenes/card_wealth.webp.asset.json';
import founder from '@/assets/scenes/founder.webp.asset.json';

export const founderImage = founder.url;
export const portraitImage = heroPortrait.url;

export interface HeroScene { image: string; eyebrow: string; line: string; sub: string; position: string; }

/** Each visit shows one scene: a different photo, line and mood. */
export const heroScenes: HeroScene[] = [
  { image: heroStage.url, eyebrow: 'صحنه', line: 'هزاران نفر شروع کردند، چون یک نفر جرئت کرد بپرسد «چرا من نه؟»', sub: 'سؤال تو از همین‌جا جواب می‌گیرد.', position: 'object-[20%_center]' },
  { image: heroCity.url, eyebrow: 'افق', line: 'دنیا کوچک‌تر از ترس‌های توست.', sub: 'مرزها روی نقشه‌اند، نه در ذهن کسی که تصمیم گرفته.', position: 'object-[15%_center]' },
  { image: heroNight.url, eyebrow: 'شب‌های ساختن', line: 'آینده‌ات را همین امشب می‌نویسی، نه فردا صبح.', sub: 'ساعت‌هایی که کسی نمی‌بیند، زندگی‌ای می‌سازند که همه می‌بینند.', position: 'object-[20%_center]' },
  { image: heroTravel.url, eyebrow: 'بی‌مرز', line: 'جایی که به دنیا آمدی، تعیین نمی‌کند تا کجا می‌روی.', sub: 'مهارت، تنها پاسپورتی است که هیچ‌وقت باطل نمی‌شود.', position: 'object-[25%_center]' },
  { image: heroPortrait.url, eyebrow: 'تأمل', line: 'بزرگ‌ترین ریسک، زندگی‌ای است که هیچ‌وقت امتحانش نکردی.', sub: 'یک قدم کوچک امروز، فاصله‌ی تو با نسخه‌ی بهترت را نصف می‌کند.', position: 'object-[25%_center]' },
];

export const pickHeroScene = () => heroScenes[Math.floor(Math.random() * heroScenes.length)];

/** Cover photo for a course card, chosen from its slug or title. */
export const courseImage = (slug = '', title = ''): string => {
  const s = `${slug} ${title}`.toLowerCase();
  if (s.includes('taste') || title.includes('مزه')) return cardTaste.url;
  if (s.includes('instagram') || title.includes('اینستاگرام')) return cardInstagram.url;
  if (s.includes('metaverse') || title.includes('متاورس')) return cardMetaverse.url;
  if (s.includes('servit') || s.includes('wealth') || s.includes('servat') || title.includes('ثروت')) return cardWealth.url;
  if (s.includes('smart') || s.includes('passive') || s.includes(' ai') || title.includes('هوش') || title.includes('غیرفعال')) return cardAi.url;
  if (s.includes('america') || title.includes('آمریکا')) return cardAmerica.url;
  if (s.includes('rescue') || s.includes('crisis') || title.includes('بحران') || title.includes('نجات')) return cardRescue.url;
  if (s.includes('change') || title.includes('تغییر')) return cardChange.url;
  if (s.includes('boundless') || title.includes('بدون مرز') || title.includes('شروع')) return cardBoundless.url;
  return cardChange.url;
};

export const sceneGallery = [cardBoundless.url, heroTravel.url, cardChange.url, heroNight.url, cardTaste.url];

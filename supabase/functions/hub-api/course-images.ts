import assets from './course-images.json' with { type: 'json' };

// Same cover-selection rules as src/lib/academyImagery.ts; asset pointers, not downloaded images.
export function courseCover(slug = '', title = '') {
  const text = `${slug} ${title}`.toLowerCase();
  let key: keyof typeof assets = 'default';
  if (text.includes('taste') || title.includes('مزه')) key = 'taste';
  else if (text.includes('instagram') || title.includes('اینستاگرام')) key = 'instagram';
  else if (text.includes('metaverse') || title.includes('متاورس')) key = 'meta';
  else if (text.includes('servit') || text.includes('wealth') || text.includes('servat') || title.includes('ثروت')) key = 'wealth';
  else if (text.includes('passive') || title.includes('غیرفعال')) key = 'passive';
  else if (text.includes('smart-pack') || title.includes('پک هوشمند')) key = 'pack';
  else if (text.includes('smart-life') || title.includes('زندگی هوشمند')) key = 'life';
  else if (text.includes('smart') || title.includes('هوش')) key = 'ai2';
  else if (text.includes('america') || title.includes('آمریکا')) key = 'america';
  else if (text.includes('crisis') || title.includes('بحران')) key = 'crisis';
  else if (text.includes('rescue') || title.includes('نجات')) key = 'rescue';
  else if (text.includes('change') || title.includes('تغییر')) key = 'change';
  else if (text.includes('boundless') || title.includes('بدون مرز') || title.includes('شروع')) key = 'boundless2';
  return new URL(assets[key].url, 'https://academy.rafiei.co').href;
}
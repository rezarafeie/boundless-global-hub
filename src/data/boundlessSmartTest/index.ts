import bundle from './forms.generated.json';
import type { FormsBundle, SmartForm, Answers } from './types';

export const FORMS = bundle as unknown as FormsBundle;

// Main-form answer values (field ids) used for routing
export const MAIN_FIELDS = {
  INTEREST: '19',
  MINDSET: '25',
};

const INTEREST_TO_TRACK: Record<string, 'dropshipping' | 'freelancing' | 'nft' | 'academy'> = {
  'یک فروشگاه اینترنتی داشته باشم محصولات جدید پیدا کنم و برای خریداران ارسال کنم': 'dropshipping',
  'یک آژانس داشته باشم و کارفرماها کار کنم و خدمات انجام دهم': 'freelancing',
  'در بازار های مالی کار کنم. تحلیل کنم و خرید و فروش انجام دهم': 'nft',
  'یک آکادمی آنلاین داشته باشم. آموزش تولید کنم و فایل بفروشم': 'academy',
};

const MINDSET_1_VALUE = 'از ایران واقعا نمیشه کسب و کار بین المللی کرد. همینجوریش تحریمیم. مگه دولت میزاره؟ همین کار ریالی هم درست نیست چه برسه بدون مرز! اگه بشه هم برای شروع سرمایه میخواد. اونم سرمایه زیاد. سرمایه هم نخواد باید یه کار عجیب قریب و یه نوآوری خاصی داشته باشی که دیده بشی';

export function resolveTrackId(answers: Answers): string | null {
  const interest = answers[MAIN_FIELDS.INTEREST];
  const mindset = answers[MAIN_FIELDS.MINDSET];
  if (!interest || !mindset) return null;
  const base = INTEREST_TO_TRACK[interest];
  if (!base) return null;
  const idx = mindset === MINDSET_1_VALUE ? 1 : 2;
  return `${base}${idx}`;
}

export function getForm(id: string): SmartForm | null {
  return FORMS[id] ?? null;
}

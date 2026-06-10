import bundle from './forms.generated.json';
import type { FormsBundle, SmartForm, Answers, SmartField } from './types';

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

export const NOTE_FIELD_ID = 'user_note';
export const MATERIAL_VALUE_FIELD_ID = '35';
export const READY_TO_PAY_FIELD_ID = '39';

export function resolveTrackId(answers: Answers): string | null {
  const interest = answers[MAIN_FIELDS.INTEREST];
  const mindset = answers[MAIN_FIELDS.MINDSET];
  if (!interest || !mindset) return null;
  const base = INTEREST_TO_TRACK[interest];
  if (!base) return null;
  const idx = mindset === MINDSET_1_VALUE ? 1 : 2;
  return `${base}${idx}`;
}

// Reject = restart only (next button hidden, restart shown)
export const REJECT_RADIO_VALUES: Record<string, string[]> = {
  '4': ['نه بعید میدونم'],
  '30': ['فعلا اولویتش'],
};

// Back-only = only allow going back (e.g. user wants to fix answers)
export const BACK_ONLY_RADIO_VALUES: Record<string, string[]> = {
  '23': ['میخوام بعضی پاسخ', 'میخوام پاسخ'],
};

// Radio values that contribute to final "rejected" outcome at the AI step
export const FINAL_REJECT_RADIO_VALUES: Record<string, string[]> = {
  '17': ['عمرا'],
  '20': ['فکر نمیکنم آماده پرداخت'],
  '39': ['امکان پرداخت ده دلار رو ندارم'],
};

/** Convert Aparat <script> embed in legacy HTML to a working <iframe> */
function fixAparatEmbeds(html: string): string {
  return html.replace(
    /<div[^>]*>\s*<script[^>]*src="https?:\/\/www\.aparat\.com\/embed\/([A-Za-z0-9]+)[^"]*"[^>]*><\/script>\s*<\/div>/gi,
    (_m, hash) =>
      `<div class="my-4 aspect-video w-full overflow-hidden rounded-lg border border-border bg-black"><iframe src="https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame" allowfullscreen class="w-full h-full"></iframe></div>`,
  ).replace(
    /<script[^>]*src="https?:\/\/www\.aparat\.com\/embed\/([A-Za-z0-9]+)[^"]*"[^>]*><\/script>/gi,
    (_m, hash) =>
      `<div class="my-4 aspect-video w-full overflow-hidden rounded-lg border border-border bg-black"><iframe src="https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame" allowfullscreen class="w-full h-full"></iframe></div>`,
  );
}

// Labels of prefill identity fields that show on subform page 1 (filtered out)
const PREFILL_LABELS = new Set([
  'نام',
  'نام خانوادگی',
  'شماره تلفن',
  'وضعیت اشتغال',
  'شغل',
  'وضعیت کسب و کار',
  'کسب و کار',
  'علاقه',
  'نگرش',
  'درآمد',
  'سن',
  'توضیحات',
]);

const PREFILL_IDS = new Set(['61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75']);

function transformSubform(form: SmartForm): SmartForm {
  const fields: SmartField[] = [];
  for (const f of form.fields) {
    // Filter prefill text inputs by id OR by label
    if (
      (f.kind === 'text' || f.kind === 'tel' || f.kind === 'email' || f.kind === 'number') &&
      f.id !== MATERIAL_VALUE_FIELD_ID
    ) {
      if (PREFILL_IDS.has(f.id) || PREFILL_LABELS.has((f as any).label || '')) continue;
    }

    if (f.kind === 'html') {
      let html = fixAparatEmbeds(f.html);
      fields.push({ ...f, html } as SmartField);
      continue;
    }

    // Material value field (35) -> required + numeric
    if (f.id === MATERIAL_VALUE_FIELD_ID && f.kind === 'number') {
      fields.push({ ...f, required: true } as SmartField);
      continue;
    }

    // Ready-to-pay (39) hidden until material value entered
    if (f.id === READY_TO_PAY_FIELD_ID && f.kind === 'radio') {
      fields.push({
        ...f,
        required: true,
        showIf: { logic: 'all', rules: [{ field: MATERIAL_VALUE_FIELD_ID, op: 'isnot', value: '' }] },
      } as any);
      continue;
    }

    // Force all radio fields to required
    if (f.kind === 'radio') {
      fields.push({ ...f, required: true } as SmartField);
      continue;
    }

    fields.push(f);
  }
  return { ...form, fields };
}

function transformMain(form: SmartForm): SmartForm {
  const byId: Record<string, SmartField> = {};
  for (const f of form.fields) if ((f as any).id) byId[(f as any).id] = f;

  const mkPage = (id: string): SmartField => ({ id: `__page_${id}`, kind: 'page' } as any);
  const req = (f: SmartField): SmartField => {
    if (!f) return f;
    if (f.kind === 'text' || f.kind === 'tel' || f.kind === 'email' || f.kind === 'number' || f.kind === 'radio') {
      return { ...f, required: true } as SmartField;
    }
    return f;
  };

  const fields: SmartField[] = [];
  fields.push(byId['44'], req(byId['1']));
  fields.push(mkPage('after_first'));
  fields.push(req(byId['46']));
  fields.push(mkPage('after_last'));
  fields.push(byId['45'], req(byId['42']));
  fields.push(mkPage('after_phone'));
  fields.push(req(byId['52']));
  fields.push(mkPage('after_email'));
  fields.push(byId['6'], req(byId['14']), req(byId['15']), req(byId['9']));
  fields.push(mkPage('after_occ'));
  fields.push(byId['8'], req(byId['11']), req(byId['29']));
  fields.push(mkPage('after_biz'));
  fields.push(req(byId['19']), byId['21'], byId['22'], byId['23'], byId['24']);
  fields.push(mkPage('after_interest'));
  fields.push(req(byId['25']), byId['27'], byId['28'], req(byId['30']), byId['31']);
  fields.push(mkPage('after_mindset'));
  fields.push(req(byId['33']), byId['34'], byId['36'], byId['37'], byId['38'], req(byId['35']));
  fields.push(mkPage('after_income'));
  fields.push(req(byId['49']));
  fields.push(mkPage('after_age'));
  fields.push(byId['41']);
  fields.push({
    id: NOTE_FIELD_ID,
    kind: 'text',
    label: 'اگه نکته‌ای هست برام بنویس (اختیاری)',
    placeholder: 'هرچیزی که دوست داری بگی...',
    required: false,
  } as any);
  fields.push(byId['51']);

  return { ...form, fields: fields.filter(Boolean) };
}

const _cache: Record<string, SmartForm> = {};

export function getForm(id: string): SmartForm | null {
  if (_cache[id]) return _cache[id];
  const raw = FORMS[id];
  if (!raw) return null;
  const transformed = id === 'main' ? transformMain(raw) : transformSubform(raw);
  _cache[id] = transformed;
  return transformed;
}

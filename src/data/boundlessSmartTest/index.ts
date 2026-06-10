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
export const CONDITIONAL_RESPONSE_HTML_ID = '36';

export function resolveTrackId(answers: Answers): string | null {
  const interest = answers[MAIN_FIELDS.INTEREST];
  const mindset = answers[MAIN_FIELDS.MINDSET];
  if (!interest || !mindset) return null;
  const base = INTEREST_TO_TRACK[interest];
  if (!base) return null;
  const idx = mindset === MINDSET_1_VALUE ? 1 : 2;
  return `${base}${idx}`;
}

// Field ids that should NOT receive a "next button" because answer leads to a reject
// Map<fieldId, rejectValueSubstring>
export const REJECT_RADIO_VALUES: Record<string, string[]> = {
  '4': ['نه بعید میدونم'], // time
  '17': ['عمرا'], // change mindset rejected
  '20': ['فکر نمیکنم آماده پرداخت'], // pay price rejected
  '30': ['فعلا اولویتش'], // serious decision rejected
  '39': ['امکان پرداخت ده دلار رو ندارم'], // ready to pay rejected
};

/** Convert Aparat <script> embed in legacy HTML to a working <iframe> */
function fixAparatEmbeds(html: string): string {
  // Pattern: <script ... src="https://www.aparat.com/embed/HASH?..."></script>
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

// Field ids prefilled in legacy subforms that we should hide (61-73 range)
const SUBFORM_PREFILL_IDS = new Set(['61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73']);

function transformSubform(form: SmartForm): SmartForm {
  const fields: SmartField[] = [];
  for (const f of form.fields) {
    if ((f as any).id && SUBFORM_PREFILL_IDS.has((f as any).id)) continue;
    if (f.kind === 'html') {
      let html = fixAparatEmbeds(f.html);
      // Hide the "واقعا؟ ... منصفانه نباشه" response unless a value was entered
      if ((f as any).id === CONDITIONAL_RESPONSE_HTML_ID && html.includes('منصفانه نباشه')) {
        fields.push({
          ...f,
          html,
          showIf: { logic: 'all', rules: [{ field: MATERIAL_VALUE_FIELD_ID, op: 'isnot', value: '' }] },
        } as any);
        continue;
      }
      fields.push({ ...f, html } as SmartField);
    } else {
      fields.push(f);
    }
  }
  return { ...form, fields };
}

function transformMain(form: SmartForm): SmartForm {
  // Build new ordered field list with explicit page breaks per the new flow
  const byId: Record<string, SmartField> = {};
  for (const f of form.fields) if ((f as any).id) byId[(f as any).id] = f;

  const mkPage = (id: string): SmartField => ({ id: `__page_${id}`, kind: 'page' } as any);

  const fields: SmartField[] = [];

  // Step 1a: welcome + first name
  fields.push(byId['44'], byId['1']);
  fields.push(mkPage('after_first'));
  // Step 1b: last name solo
  fields.push(byId['46']);
  fields.push(mkPage('after_last'));
  // Step 2a: خوشوقتم + phone
  fields.push(byId['45'], byId['42']);
  fields.push(mkPage('after_phone'));
  // Step 2b: email
  fields.push(byId['52']);
  fields.push(mkPage('after_email'));
  // Step 3: occupation
  fields.push(byId['6'], byId['14'], byId['15'], byId['9']);
  fields.push(mkPage('after_occ'));
  // Step 4: business situation
  fields.push(byId['8'], byId['11'], byId['29']);
  fields.push(mkPage('after_biz'));
  // Step 5: interest
  fields.push(byId['19'], byId['21'], byId['22'], byId['23'], byId['24']);
  fields.push(mkPage('after_interest'));
  // Step 6: mindset
  fields.push(byId['25'], byId['27'], byId['28'], byId['30'], byId['31']);
  fields.push(mkPage('after_mindset'));
  // Step 7: income
  fields.push(byId['33'], byId['34'], byId['36'], byId['37'], byId['38'], byId['35']);
  fields.push(mkPage('after_income'));
  // Step 8: age
  fields.push(byId['49']);
  fields.push(mkPage('after_age'));
  // Step 9: final + optional note
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

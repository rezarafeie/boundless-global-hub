import { QUESTIONS, QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { OBJECTION_BLOCK_KEY } from '@/data/smartTestV2/content';
import type { Answers, StageId } from '@/data/smartTestV2/types';

export type Step =
  | { kind: 'profile_question'; key: string; stage: StageId; title: string; prompt: string; options?: { value: string; label: string }[]; input?: 'text' }
  | { kind: 'question'; key: string; qid: string; stage: StageId }
  | { kind: 'insight'; key: string; stage: StageId; title: string; body: string[] }
  | { kind: 'mini1'; key: string; stage: StageId }
  | { kind: 'mini2'; key: string; stage: StageId }
  | { kind: 'block'; key: string; stage: StageId; blockKey: string }
  | { kind: 'profile'; key: string; stage: StageId }
  | { kind: 'final_micro'; key: string; stage: StageId }
  | { kind: 'ai_checkpoint'; key: string; stage: StageId; checkpoint: number }
  | { kind: 'education'; key: string; stage: StageId }
  | { kind: 'commitment'; key: string; stage: StageId; title: string; prompt: string; options: { value: string; label: string }[] }
  | { kind: 'analysis'; key: string; stage: StageId };

const asArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const STAGE_INSIGHT: Record<string, { title: string; body: string[] }> = {
  no_income: {
    title: 'پس از صفر شروع می‌کنیم.',
    body: ['این لزوماً ضعف نیست. آدمی که هنوز درگیر یک مدل اشتباه نشده، سریع‌تر مسیر درست رو می‌گیره.'],
  },
  employed: {
    title: 'یعنی درآمد فعلیت پشتتِ.',
    body: ['این یعنی لازم نیست از روی اضطرار تصمیم بگیری. ولی یعنی زمانت محدودتره و باید مسیری انتخاب کنی که با ساعت‌های باقی‌مونده‌ت جور باشه.'],
  },
  freelancer: {
    title: 'تو از خیلی‌ها جلوتری.',
    body: ['بلدی برای مهارتت پول بگیری. سؤال اصلی تو «چطور پول دربیارم» نیست؛ «چطور از بازار بین‌المللی پول دربیارم»ـه.'],
  },
  business_owner: {
    title: 'پس ساختن رو بلدی.',
    body: ['کسی که کسب‌وکار داره، معمولاً مشکلش اجرا نیست؛ انتخاب نقطه‌ایه که بیشترین بازده رو داره.'],
  },
  tried_failed: {
    title: 'پس احتمالاً مشکل تو کمبود «ایده جدید» نیست.',
    body: ['باید بفهمیم تا امروز مسیر اشتباه انتخاب کردی، درست اجرا نکردی، یا قبل از نتیجه مسیرت رو عوض کردی.'],
  },
};

export function buildFlow(answers: Answers): Step[] {
  const q = (qid: string): Step => ({
    kind: 'question', key: qid, qid, stage: QUESTION_BY_ID[qid].stage,
  });

  const steps: Step[] = [];
  steps.push({
    kind: 'profile_question', key: 'meta_name', stage: 'self', input: 'text',
    title: 'اول از همه، اسمت چیه؟', prompt: 'می‌خوام این تحلیل رو برای خودت بسازم؛ نه برای یک کاربر ناشناس.',
  });
  steps.push(q('q1_stage'));

  const stage1 = String(answers['q1_stage'] || '');
  if (STAGE_INSIGHT[stage1]) {
    steps.push({ kind: 'insight', key: 'i_stage', stage: 'self', ...STAGE_INSIGHT[stage1] });
  }

  steps.push(q('q2_time'));
  steps.push(q('q3_capital'));

  if (answers['q3_capital']) {
    steps.push({
      kind: 'insight', key: 'i_capital', stage: 'conditions',
      title: 'این جواب قرار نیست تعیین کنه «می‌تونی یا نه».',
      body: ['قراره تعیین کنه الان بهتره چی رو شروع کنی و چی رو فعلاً شروع نکنی.'],
    });
  }

  steps.push({ kind: 'mini1', key: 'mini1', stage: 'conditions' });
  steps.push({ kind: 'ai_checkpoint', key: 'cp1', stage: 'conditions', checkpoint: 1 });
  steps.push(q('q4_interest'));

  const interests = asArray(answers['q4_interest']).filter((v) => v !== 'unknown');
  if (interests.length >= 2) steps.push(q('q5_rank'));

  steps.push(q('q6_skills'));

  if (answers.q1_stage === 'freelancer' || answers.q1_stage === 'business_owner' || answers.q1_stage === 'tried_failed') {
    steps.push({
      kind: 'profile_question', key: 'meta_experience', stage: 'work_model',
      title: 'تجربه قبلیت بیشتر کجا بوده؟', prompt: 'این جواب کمک می‌کنه تجربه‌ات رو از علاقه‌ات جدا کنیم.',
      options: [
        { value: 'selling', label: 'فروش و مذاکره' }, { value: 'building', label: 'ساخت محصول یا فنی' },
        { value: 'content', label: 'محتوا و بازاریابی' }, { value: 'delivery', label: 'خدمت‌رسانی و اجرا' },
        { value: 'mixed', label: 'ترکیبی یا هنوز نامشخص' },
      ],
    });
  }

  if (asArray(answers['q6_skills']).includes('none')) {
    steps.push({
      kind: 'insight', key: 'i_skill_none', stage: 'work_model',
      title: 'مطمئنی «مهارت نداری»؟',
      body: [
        'یا هنوز نمی‌دونی کدوم توانایی‌ت قابلیت تبدیل شدن به پول رو داره؟',
        'همین چند جواب قبلی درباره نحوه فکر کردن و کار کردنت به ما سیگنال‌هایی داده.',
        'پس فعلاً خودت رو حذف نکن. بذار تست تصمیم بگیره.',
      ],
    });
  }

  steps.push(q('q7_scenario'));
  steps.push({ kind: 'mini2', key: 'mini2', stage: 'work_model' });
  steps.push({ kind: 'ai_checkpoint', key: 'cp2', stage: 'work_model', checkpoint: 2 });
  steps.push({ kind: 'education', key: 'path_education', stage: 'work_model' });
  steps.push({ kind: 'block', key: 'trust', stage: 'work_model', blockKey: 'trust_block' });

  steps.push(q('q8_risk'));
  steps.push(q('q9_speed'));

  if (answers['q9_speed'] === 'fast_cash') {
    steps.push({
      kind: 'insight', key: 'i_speed', stage: 'goal',
      title: 'سرعت مهمه، ولی یک هشدار.',
      body: ['هرچی سریع‌تر بخوای به پول برسی، مسیرت باید ساده‌تر و مستقیم‌تر باشه. مدل‌های سنگین و زمان‌بر برای تو، احتمالاً وسط راه رها می‌شن.'],
    });
  }

  steps.push(q('q10_english'));
  if (answers['q10_english'] === 'none' || answers['q10_english'] === 'ai_helped') {
    steps.push({
      kind: 'insight', key: 'i_english', stage: 'conditions',
      title: 'این جواب هیچ مسیری رو برات صفر نکرد.',
      body: [
        'ولی اگر کسی بهت بگه «زبان اصلاً مهم نیست»، داره ساده‌سازی می‌کنه.',
        'AI خیلی از موانع زبان رو کوچک کرده؛ اما اگر وارد بازار جهانی بشی، همزمان باید زبانت رو هم بهتر کنی.',
      ],
    });
  }

  steps.push(q('q11_tech'));
  steps.push({ kind: 'ai_checkpoint', key: 'cp3', stage: 'work_model', checkpoint: 3 });
  steps.push({ kind: 'profile', key: 'profile', stage: 'work_model' });
  steps.push(q('q12_objections'));

  const objections = asArray(answers['q12_objections']).filter((o) => o !== 'ready');
  for (const o of objections.slice(0, 2)) {
    const blockKey = OBJECTION_BLOCK_KEY[o];
    if (blockKey) steps.push({ kind: 'block', key: `obj_${o}`, stage: 'blockers', blockKey });
    if (blockKey) steps.push({
      kind: 'commitment', key: `resolve_${o}`, stage: 'blockers',
      title: 'بعد از این توضیح، الان کجای ماجرا ایستادی؟', prompt: 'جواب درست وجود نداره؛ این پاسخ روی تشخیص آمادگی تو اثر توضیحی داره، نه روی امتیاز مسیر.',
      options: [
        { value: 'resolved', label: 'این مانع برام روشن‌تر شد' },
        { value: 'execution', label: 'هنوز درباره اجرا نگرانم' },
        { value: 'still_blocked', label: 'هنوز مانع جدی منه' },
        { value: 'changed', label: 'نگرانیم عوض شد' },
      ],
    });
  }
  if (objections.length > 0) {
    steps.push({ kind: 'ai_checkpoint', key: 'cp4', stage: 'blockers', checkpoint: 4 });
  }


  steps.push(q('q13_goal'));
  steps.push(q('q14_tradeoff'));
  steps.push(q('q15_notification'));
  steps.push({
    kind: 'commitment', key: 'commit_90', stage: 'goal', title: 'اگر مسیر منطقی پیدا بشه، برای ۹۰ روز بهش فرصت می‌دی؟',
    prompt: 'نه قول هیجانی؛ یک تصمیم واقع‌بینانه.', options: [
      { value: 'yes', label: 'بله، ۹۰ روز منظم اجرا می‌کنم' }, { value: 'try', label: 'شروع می‌کنم ولی هنوز مطمئن نیستم' },
      { value: 'explore', label: 'فعلاً فقط می‌خوام بررسی کنم' },
    ],
  });
  steps.push({
    kind: 'commitment', key: 'commit_hours', stage: 'goal', title: 'در عمل، هفته‌ای چند ساعت پای اجرا می‌ایستی؟',
    prompt: 'این عدد باید از تقویمت بیاد، نه از انگیزه همین لحظه.', options: [
      { value: 'lt3', label: 'کمتر از ۳ ساعت' }, { value: '3_7', label: '۳ تا ۷ ساعت' },
      { value: '7_14', label: '۷ تا ۱۴ ساعت' }, { value: 'gt14', label: 'بیشتر از ۱۴ ساعت' },
    ],
  });
  steps.push({
    kind: 'commitment', key: 'action_readiness', stage: 'goal', title: 'الان نسبت به شروع چه حسی داری؟',
    prompt: 'این پاسخ پیشنهاد بعدی رو تعیین می‌کنه؛ نه مسیر تشخیصی رو.', options: [
      { value: 'curious', label: 'هنوز کنجکاوم' }, { value: 'start', label: 'می‌خوام شروع کنم' },
      { value: 'serious', label: 'برای تصمیم جدی آماده‌ام' }, { value: 'action', label: 'آماده اقدامم' },
    ],
  });
  steps.push({ kind: 'final_micro', key: 'final_micro', stage: 'goal' });
  steps.push({ kind: 'analysis', key: 'analysis', stage: 'analysis' });

  return steps;
}

export const TOTAL_QUESTIONS = QUESTIONS.length;

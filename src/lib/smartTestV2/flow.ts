import { QUESTIONS, QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { OBJECTION_BLOCK_KEY } from '@/data/smartTestV2/content';
import type { Answers, StageId } from '@/data/smartTestV2/types';

export type Step =
  | { kind: 'question'; key: string; qid: string; stage: StageId }
  | { kind: 'insight'; key: string; stage: StageId; title: string; body: string[] }
  | { kind: 'mini1'; key: string; stage: StageId }
  | { kind: 'mini2'; key: string; stage: StageId }
  | { kind: 'block'; key: string; stage: StageId; blockKey: string }
  | { kind: 'profile'; key: string; stage: StageId }
  | { kind: 'final_micro'; key: string; stage: StageId }
  | { kind: 'ai_checkpoint'; key: string; stage: StageId; checkpoint: number }
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
  steps.push({ kind: 'profile', key: 'profile', stage: 'work_model' });
  steps.push(q('q12_objections'));

  const objections = asArray(answers['q12_objections']).filter((o) => o !== 'ready');
  for (const o of objections.slice(0, 2)) {
    const blockKey = OBJECTION_BLOCK_KEY[o];
    if (blockKey) steps.push({ kind: 'block', key: `obj_${o}`, stage: 'blockers', blockKey });
  }

  steps.push(q('q13_goal'));
  steps.push(q('q14_tradeoff'));
  steps.push(q('q15_notification'));
  steps.push({ kind: 'final_micro', key: 'final_micro', stage: 'goal' });
  steps.push({ kind: 'analysis', key: 'analysis', stage: 'analysis' });

  return steps;
}

export const TOTAL_QUESTIONS = QUESTIONS.length;

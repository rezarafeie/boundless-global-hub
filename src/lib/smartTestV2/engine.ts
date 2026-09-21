import { QUESTIONS, QUESTION_BY_ID, INTEREST_PATH } from '@/data/smartTestV2/questions';
import {
  PATH_IDS,
  PATH_LABELS,
  type Answers,
  type Contradiction,
  type Evidence,
  type PathId,
  type PathResult,
  type Profile,
  type V2Result,
} from '@/data/smartTestV2/types';

const asArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

/** Collect every score adjustment with the reason behind it. */
export function collectEvidence(answers: Answers): Evidence[] {
  const ev: Evidence[] = [];

  for (const q of QUESTIONS) {
    if (q.kind === 'rank') continue;
    const selected = asArray(answers[q.id]);
    for (const val of selected) {
      const opt = q.options.find((o) => o.value === val);
      if (!opt?.scores) continue;
      for (const [path, delta] of Object.entries(opt.scores)) {
        if (!delta) continue;
        ev.push({ path: path as PathId, delta, reason: opt.reason || opt.label });
      }
    }
  }

  // Ranking: first +8, second +5, third +2
  const ranked = asArray(answers['q5_rank']);
  const rankPoints = [8, 5, 2];
  ranked.slice(0, 3).forEach((val, i) => {
    const path = INTEREST_PATH[val];
    if (!path) return;
    const label = QUESTION_BY_ID['q4_interest'].options.find((o) => o.value === val)?.label || '';
    ev.push({
      path,
      delta: rankPoints[i],
      reason: i === 0 ? `اولویت اول تو «${label}» بود` : `«${label}» رو در اولویت ${i + 1} گذاشتی`,
    });
  });

  return ev;
}

export function scoreFromEvidence(evidence: Evidence[]): PathResult[] {
  const raw: Record<PathId, number> = {
    dropshipping: 0, drop_service: 0, digital_product: 0, ai: 0, vibe_coding: 0,
  };
  for (const e of evidence) raw[e.path] += e.delta;

  const values = PATH_IDS.map((p) => raw[p]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return PATH_IDS.map((p) => ({
    path: p,
    raw: raw[p],
    // normalise to a readable 42..97 band so nothing reads as "0% compatible"
    match: Math.round(42 + ((raw[p] - min) / span) * 55),
  })).sort((a, b) => b.raw - a.raw);
}

export function buildProfile(answers: Answers, evidence: Evidence[]): Profile {
  const skills = asArray(answers['q6_skills']);
  const interests = asArray(answers['q4_interest']);
  const has = (arr: string[], v: string) => arr.includes(v);
  const clamp = (n: number) => Math.max(10, Math.min(98, Math.round(n)));

  let commercial = 35;
  if (has(skills, 'selling')) commercial += 20;
  if (has(skills, 'communication')) commercial += 15;
  if (has(interests, 'sales')) commercial += 15;
  if (has(interests, 'product')) commercial += 8;
  if (answers['q7_scenario'] === 'service' || answers['q7_scenario'] === 'product') commercial += 8;

  let creative = 32;
  if (has(skills, 'content')) creative += 18;
  if (has(skills, 'design')) creative += 15;
  if (has(skills, 'teaching')) creative += 12;
  if (has(interests, 'content') || has(interests, 'teaching')) creative += 12;

  let technical = 25;
  if (has(skills, 'programming')) technical += 30;
  if (has(skills, 'ai')) technical += 18;
  if (has(skills, 'web')) technical += 12;
  if (answers['q11_tech'] === 'technical') technical += 20;
  if (answers['q11_tech'] === 'fast_learner') technical += 10;
  if (answers['q11_tech'] === 'beginner') technical -= 12;

  let execution = 35;
  const time = answers['q2_time'];
  if (time === 'gt4') execution += 22;
  else if (time === '2_4') execution += 16;
  else if (time === '1_2') execution += 8;
  if (answers['q1_stage'] === 'business_owner' || answers['q1_stage'] === 'freelancer') execution += 12;
  if (answers['q1_stage'] === 'tried_failed') execution += 6;
  if (has(skills, 'pm')) execution += 10;
  const objections = asArray(answers['q12_objections']);
  if (objections.includes('later')) execution -= 12;
  if (objections.includes('ready')) execution += 12;

  let risk = 45;
  if (answers['q8_risk'] === 'none') risk += 30;
  if (answers['q8_risk'] === 'money_test') risk -= 12;
  if (answers['q8_risk'] === 'complex') risk -= 10;
  if (answers['q3_capital'] === 'gt2000' || answers['q3_capital'] === '500_2000') risk += 8;

  const dims = {
    commercial: clamp(commercial),
    creative: clamp(creative),
    technical: clamp(technical),
    execution: clamp(execution),
    risk: clamp(risk),
  };

  const top = (['commercial', 'creative', 'technical', 'execution'] as Array<keyof typeof dims>)
    .slice()
    .sort((a, b) => dims[b] - dims[a]);
  const typeMap: Record<string, string> = {
    commercial: 'Seller', creative: 'Creator', technical: 'Builder', execution: 'Operator',
  };
  const type = evidence.length === 0 ? 'Explorer' : `${typeMap[top[0]]} × ${typeMap[top[1]]}`;

  return { ...dims, type };
}

export function computeReadiness(answers: Answers, profile: Profile): number {
  let score = 30;
  const time = answers['q2_time'];
  if (time === 'gt4') score += 22; else if (time === '2_4') score += 17;
  else if (time === '1_2') score += 10; else if (time === 'lt1') score += 3;

  const capital = answers['q3_capital'];
  if (capital === 'gt2000') score += 14; else if (capital === '500_2000') score += 12;
  else if (capital === '100_500') score += 9; else if (capital === 'lt100') score += 5;

  const objections = asArray(answers['q12_objections']);
  if (objections.includes('ready')) score += 16;
  score -= Math.min(18, objections.filter((o) => o !== 'ready').length * 6);
  if (objections.includes('later')) score -= 6;
  if (objections.includes('trust') || objections.includes('dream_selling')) score -= 5;

  if (answers['q1_stage'] === 'business_owner' || answers['q1_stage'] === 'freelancer') score += 8;
  if (answers['q1_stage'] === 'employed') score += 4;
  if (answers['q9_speed'] !== 'fast_cash') score += 4;

  score += Math.round((profile.execution - 50) / 6);

  const answered = QUESTIONS.filter((q) => asArray(answers[q.id]).length > 0).length;
  score += Math.round((answered / QUESTIONS.length) * 10);

  return Math.max(8, Math.min(98, Math.round(score)));
}

export function detectContradictions(answers: Answers): Contradiction[] {
  const out: Contradiction[] = [];
  const objections = asArray(answers['q12_objections']);
  const timeLabels: Record<string, string> = {
    lt1: 'کمتر از ۱ ساعت', '1_2': '۱ تا ۲ ساعت', '2_4': '۲ تا ۴ ساعت', gt4: 'بیشتر از ۴ ساعت',
  };
  const capitalLabels: Record<string, string> = {
    zero: 'تقریباً صفر', lt100: 'تا ۱۰۰ دلار', '100_500': '۱۰۰ تا ۵۰۰ دلار',
    '500_2000': '۵۰۰ تا ۲۰۰۰ دلار', gt2000: 'بیشتر از ۲۰۰۰ دلار',
  };

  const time = String(answers['q2_time'] || '');
  if (objections.includes('time') && (time === '2_4' || time === 'gt4')) {
    out.push({
      key: 'time',
      text: `اول تست گفتی روزانه ${timeLabels[time]} می‌تونی برای این مسیر وقت بذاری، ولی الان «وقت ندارم» رو یکی از موانعت انتخاب کردی. پس شاید مسئله واقعاً نداشتن وقت نیست؛ مسئله می‌تونه تخصیص وقت یا اولویت باشه.`,
    });
  }

  const capital = String(answers['q3_capital'] || '');
  if (objections.includes('money') && (capital === '500_2000' || capital === 'gt2000' || capital === '100_500')) {
    out.push({
      key: 'money',
      text: `خودت گفتی بدون فشار مالی می‌تونی ${capitalLabels[capital]} برای شروع کنار بذاری. پس شاید مسئله اصلی «پول ندارم» نیست؛ شاید هنوز مطمئن نیستی این مسیر ارزش سرمایه‌گذاری داره. این دوتا مسئله کاملاً متفاوتن.`,
    });
  }

  const skills = asArray(answers['q6_skills']);
  if (objections.includes('skill') && skills.length > 0 && !skills.includes('none')) {
    out.push({
      key: 'skill',
      text: 'چند تا توانایی مشخص رو خودت انتخاب کردی، ولی «مهارت کافی ندارم» هم جزو موانعت بود. شاید مشکل نداشتن توانایی نیست؛ شاید هنوز بلد نبودی توانایی‌هات رو تبدیل به Offer کنی.',
    });
  }

  const interests = asArray(answers['q4_interest']);
  const scenario = String(answers['q7_scenario'] || '');
  const scenarioPath: Record<string, PathId> = {
    product: 'dropshipping', service: 'drop_service', reusable: 'digital_product', ai: 'ai', tool: 'vibe_coding',
  };
  const interestPaths = interests.map((i) => INTEREST_PATH[i]).filter(Boolean);
  if (scenario && interestPaths.length && !interestPaths.includes(scenarioPath[scenario])) {
    out.push({
      key: 'interest_scenario',
      text: 'چیزی که گفتی برات جذابه با کاری که در سناریوی واقعی انتخاب کردی یکی نبود. برای همین نتیجه فقط بر اساس علاقه‌ت ساخته نشده.',
    });
  }

  if (objections.includes('money') && capital === 'zero' && String(answers['q9_speed']) === 'asset') {
    out.push({
      key: 'capital_asset',
      text: 'سرمایه شروعت تقریباً صفره ولی دنبال ساخت یک دارایی بلندمدتی. این ترکیب شدنیه، ولی مسیر شروعت باید کم‌هزینه و درآمدزا باشه تا بتونی اون دارایی رو بسازی.',
    });
  }

  return out;
}

function confidenceOf(ranked: PathResult[], answers: Answers): 'high' | 'medium' | 'low' {
  const top = ranked[0];
  const second = ranked[1];
  const gap = top.raw - second.raw;
  const signals: PathId[] = [];
  const scenarioPath: Record<string, PathId> = {
    product: 'dropshipping', service: 'drop_service', reusable: 'digital_product', ai: 'ai', tool: 'vibe_coding',
  };
  const notifPath: Record<string, PathId> = {
    order: 'dropshipping', client: 'drop_service', digital: 'digital_product', ai: 'ai', app: 'vibe_coding',
  };
  const scen = scenarioPath[String(answers['q7_scenario'] || '')];
  const notif = notifPath[String(answers['q15_notification'] || '')];
  const rank1 = INTEREST_PATH[asArray(answers['q5_rank'])[0]];
  [scen, notif, rank1].forEach((p) => p && signals.push(p));
  const agreeing = signals.filter((p) => p === top.path).length;

  if (gap >= 10 && agreeing >= 2) return 'high';
  if (gap >= 5 || agreeing >= 2) return 'medium';
  return 'low';
}

const CONFIDENCE_FA: Record<string, string> = { high: 'بالا', medium: 'متوسط', low: 'محتاطانه' };

function weaknessFor(path: PathId, answers: Answers, profile: Profile): string | null {
  const skills = asArray(answers['q6_skills']);
  const sells = skills.includes('selling') || skills.includes('communication');
  if (!sells) {
    return `اما یک نقطه ضعف داری: هنوز در فروش و گرفتن مشتری اعتمادبه‌نفس بالایی نداری. اگر این بخش رو حل نکنی، بلد بودن ${PATH_LABELS[path]} به‌تنهایی برات درآمد نمی‌سازه.`;
  }
  if (profile.execution < 50) {
    return 'اما یک نقطه ضعف داری: زمان و پیوستگی اجرا. مسیر درست رو هم که انتخاب کنی، با اجرای پراکنده نتیجه نمی‌گیری.';
  }
  if (answers['q11_tech'] === 'beginner' && (path === 'ai' || path === 'vibe_coding')) {
    return 'اما یک نقطه ضعف داری: هنوز با ابزارهای آنلاین راحت نیستی. اولین کارت باید بالا بردن همین راحتی باشه، نه پریدن وسط پروژه پیچیده.';
  }
  if (answers['q10_english'] === 'none') {
    return 'اما یک نقطه ضعف داری: زبان. هیچ مسیری رو برات نمی‌بنده، ولی اگر همزمان روش کار نکنی، سرعتت رو کم می‌کنه.';
  }
  return null;
}

export function computeResult(answers: Answers): V2Result {
  const evidence = collectEvidence(answers);
  const ranked = scoreFromEvidence(evidence);
  const profile = buildProfile(answers, evidence);
  const readiness = computeReadiness(answers, profile);
  const contradictions = detectContradictions(answers);
  const confidence = confidenceOf(ranked, answers);
  const objections = asArray(answers['q12_objections']).filter((o) => o !== 'ready');

  const recommended = ranked[0];
  const alternative = ranked[1];

  // A path the user likes but that scored lower than the top two
  const liked = asArray(answers['q4_interest']).map((i) => INTEREST_PATH[i]).filter(Boolean);
  const notNow = ranked.slice(2).find((r) => liked.includes(r.path)) || null;

  const reasonsForRecommended = evidence
    .filter((e) => e.path === recommended.path && e.delta > 0 && e.reason)
    .sort((a, b) => b.delta - a.delta)
    .filter((e, i, arr) => arr.findIndex((x) => x.reason === e.reason) === i)
    .slice(0, 5);

  return {
    ranked,
    recommended,
    alternative,
    notNow,
    evidence,
    readiness,
    confidence,
    confidenceFa: CONFIDENCE_FA[confidence],
    profile,
    contradictions,
    objections,
    reasonsForRecommended,
    weakness: weaknessFor(recommended.path, answers, profile),
  };
}

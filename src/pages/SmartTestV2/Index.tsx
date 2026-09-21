import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Clock3, RotateCcw, Check, Eye, CircleDot, Compass, Sparkles, ShieldCheck } from 'lucide-react';
import StageBar from '@/components/SmartTestV2/StageBar';
import QuestionStep from '@/components/SmartTestV2/QuestionStep';
import RankStep from '@/components/SmartTestV2/RankStep';
import BlockCard from '@/components/SmartTestV2/BlockCard';
import DiagnosticShell from '@/components/SmartTestV2/DiagnosticShell';
import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { DEFAULT_CONTENT, type ContentBlock } from '@/data/smartTestV2/content';
import { PATH_LABELS, type Answers, type PathId } from '@/data/smartTestV2/types';
import { buildFlow, TOTAL_QUESTIONS, type Step } from '@/lib/smartTestV2/flow';
import { collectEvidence, scoreFromEvidence, buildProfile, computeResult, detectContradictions } from '@/lib/smartTestV2/engine';
import { conditionsInsight, profileNarrative, profileSignal } from '@/lib/smartTestV2/presentation';
import {
  clearLocalState, createSubmission, getSessionKey, identityFields, loadContent, loadLocalState,
  saveLocalState, trackEvent, updateSubmission,
} from '@/lib/smartTestV2/store';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const asArray = (v: string | string[] | undefined): string[] => v === undefined ? [] : Array.isArray(v) ? v : [v];

const TIME_LABEL: Record<string, string> = { lt1: 'کمتر از ۱ ساعت', '1_2': '۱ تا ۲ ساعت', '2_4': '۲ تا ۴ ساعت', gt4: 'بیشتر از ۴ ساعت' };
const CAPITAL_LABEL: Record<string, string> = { zero: 'تقریباً صفر', lt100: 'تا ۱۰۰ دلار', '100_500': '۱۰۰ تا ۵۰۰ دلار', '500_2000': '۵۰۰ تا ۲۰۰۰ دلار', gt2000: 'بیشتر از ۲۰۰۰ دلار' };
const STAGE_LABEL: Record<string, string> = { no_income: 'شروع از صفر', employed: 'شاغل', freelancer: 'فریلنسر / متخصص', business_owner: 'صاحب کسب‌وکار', tried_failed: 'تجربه‌های ناتمام' };
const PATH_ICONS: Record<PathId, string> = { dropshipping: '01', drop_service: '02', digital_product: '03', ai: '04', vibe_coding: '05' };

const SmartTestV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'intro' | 'test' | 'analysis'>('intro');
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, ContentBlock>>(DEFAULT_CONTENT);
  const [resumable, setResumable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisBeat, setAnalysisBeat] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContent().then(setContent);
    const saved = loadLocalState();
    if (saved && Object.keys(saved.answers || {}).length > 0) setResumable(true);
  }, []);

  const flow: Step[] = useMemo(() => buildFlow(answers), [answers]);
  const step = flow[Math.min(stepIndex, flow.length - 1)];
  const answeredCount = useMemo(() => Object.keys(answers).filter((key) => asArray(answers[key]).length > 0).length, [answers]);
  const progress = Math.min(0.98, answeredCount / TOTAL_QUESTIONS);

  const persist = useCallback((nextAnswers: Answers, nextIndex: number, id: string | null) => {
    saveLocalState({ submissionId: id, stepIndex: nextIndex, answers: nextAnswers, startedAt: startedAtRef.current });
    if (id) updateSubmission(id, { answers: nextAnswers, current_step: flow[nextIndex]?.key ?? null, status: 'in_progress' });
  }, [flow]);

  const start = async (resume: boolean) => {
    setError(null);
    if (resume) {
      const saved = loadLocalState();
      if (saved) {
        setAnswers(saved.answers || {});
        setStepIndex(saved.stepIndex || 0);
        setSubmissionId(saved.submissionId);
        startedAtRef.current = saved.startedAt || Date.now();
        setPhase('test');
        trackEvent(saved.submissionId, 'test_resumed');
        return;
      }
    }
    clearLocalState();
    getSessionKey();
    startedAtRef.current = Date.now();
    const id = await createSubmission({ ...identityFields(user), status: 'in_progress' });
    setSubmissionId(id);
    setAnswers({});
    setStepIndex(0);
    setPhase('test');
    trackEvent(id, 'test_started');
    saveLocalState({ submissionId: id, stepIndex: 0, answers: {}, startedAt: startedAtRef.current });
  };

  const setAnswer = (qid: string, value: string | string[]) => {
    setAnswers((previous) => {
      const next = { ...previous, [qid]: value };
      persist(next, stepIndex, submissionId);
      return next;
    });
  };

  const goNext = useCallback(() => {
    const nextIndex = Math.min(stepIndex + 1, flow.length - 1);
    setStepIndex(nextIndex);
    trackEvent(submissionId, 'step_view', flow[nextIndex]?.key);
    persist(answers, nextIndex, submissionId);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [answers, flow, persist, stepIndex, submissionId]);

  const goBack = () => {
    const previousIndex = Math.max(0, stepIndex - 1);
    setStepIndex(previousIndex);
    persist(answers, previousIndex, submissionId);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canContinue = () => {
    if (!step || step.kind !== 'question') return true;
    const question = QUESTION_BY_ID[step.qid];
    if (question.kind === 'rank') return true;
    return asArray(answers[step.qid]).length > 0;
  };

  const finish = async () => {
    setPhase('analysis');
    setAnalysisBeat(0);
    trackEvent(submissionId, 'analysis_started');
    const result = computeResult(answers);
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    const objections = result.objections;
    const payload = {
      status: 'completed', answers,
      path_scores: Object.fromEntries(result.ranked.map((rank) => [rank.path, rank.match])),
      score_evidence: result.evidence, contradictions: result.contradictions,
      profile_dimensions: { commercial: result.profile.commercial, creative: result.profile.creative, technical: result.profile.technical, execution: result.profile.execution, risk: result.profile.risk },
      profile_type: result.profile.type, recommended_path: result.recommended.path, recommended_match: result.recommended.match,
      alternative_path: result.alternative.path, alternative_match: result.alternative.match,
      not_now_path: result.notNow?.path ?? null, not_now_match: result.notNow?.match ?? null,
      readiness_score: result.readiness, confidence: result.confidence,
      primary_objection: objections[0] ?? null, secondary_objection: objections[1] ?? null,
      remaining_objections: objections.slice(2), viewed_objection_blocks: objections.slice(0, 2),
      completed_at: new Date().toISOString(), duration_seconds: duration,
    };
    let id = submissionId;
    if (!id) id = await createSubmission({ ...identityFields(user), ...payload });
    else await updateSubmission(id, payload);
    trackEvent(id, 'test_completed', undefined, { path: result.recommended.path });
    clearLocalState();
    for (let beat = 1; beat <= 5; beat += 1) {
      await new Promise((resolve) => setTimeout(resolve, 520));
      setAnalysisBeat(beat);
    }
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (id) navigate(`/smart-test-v2/result/${id}`);
    else setError('ذخیره نتیجه ممکن نشد. لطفاً دوباره تلاش کن.');
  };

  if (phase === 'intro') {
    return (
      <DiagnosticShell>
        <div className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-center min-h-[calc(100dvh-5rem)]">
            <section className="space-y-7 animate-fade-in">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary"><CircleDot className="w-4 h-4" /> تشخیص مسیر بدون مرز — نسخه دوم</div>
              <h1 className="stv2-statement text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.35] max-w-4xl">کدوم مسیر بدون مرز واقعاً برای تو ساخته شده؟</h1>
              <div className="max-w-2xl space-y-4 text-base sm:text-lg leading-loose text-muted-foreground">
                <p className="font-bold text-foreground">قرار نیست ازت بپرسیم چی دوست داری و همون رو پیشنهاد بدیم.</p>
                <p>شرایط فعلیت، زمان، سرمایه، توانایی‌ها، مدل کاری، محدودیت‌ها و هدفت رو کنار هم می‌ذاریم تا ببینیم اگر جای تو بودیم، از کجا شروع می‌کردیم.</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
                <span className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-primary" /> ۴ تا ۷ دقیقه</span>
                <span className="flex items-center gap-2"><Compass className="w-4 h-4 text-primary" /> ۵ مسیر ← ۱ پیشنهاد شخصی</span>
              </div>
              {resumable ? (
                <div className="max-w-xl border-r-4 border-primary pr-5 py-1 space-y-4">
                  <div><p className="text-xl font-black">تحلیلت هنوز اینجاست.</p><p className="text-sm text-muted-foreground mt-1">پاسخ‌هات ذخیره شده؛ از همون نقطه ادامه بده.</p></div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="h-14 px-8" onClick={() => start(true)}>ادامه تحلیل <ArrowLeft className="w-5 h-5 mr-2" /></Button>
                    <Button size="lg" variant="ghost" className="h-14" onClick={() => start(false)}><RotateCcw className="w-4 h-4 ml-2" /> از اول شروع کن</Button>
                  </div>
                </div>
              ) : (
                <Button size="lg" className="h-16 px-9 text-base" onClick={() => start(false)}>تحلیل من رو شروع کن <ArrowLeft className="w-5 h-5 mr-3" /></Button>
              )}
            </section>
            <aside className="relative min-h-[390px] sm:min-h-[520px]" aria-label="پنج مسیر مورد بررسی">
              <div className="absolute inset-y-0 right-1/2 w-px bg-border" />
              <p className="absolute top-0 right-0 text-xs text-muted-foreground">هر پنج مسیر وارد تحلیل می‌شن.</p>
              {Object.entries(PATH_LABELS).map(([id, label], index) => (
                <div key={id} className={cn('absolute bg-background border border-border shadow-sm px-4 py-4 w-[70%] sm:w-[62%] transition-transform', index % 2 ? 'left-0' : 'right-0')}
                  style={{ top: `${48 + index * 84}px`, transform: `translateY(${index % 2 ? 4 : -4}px)` }}>
                  <div className="flex items-center justify-between gap-3"><span className="text-xs text-primary font-black">{PATH_ICONS[id as PathId]}</span><span className="font-black text-sm sm:text-base" dir="ltr">{label}</span></div>
                </div>
              ))}
              <div className="absolute bottom-0 inset-x-0 bg-foreground text-background p-5 text-sm leading-loose"><Eye className="w-5 h-5 mb-3" />در پایان فقط مسیری می‌مونه که از علاقه، شرایط و رفتار واقعی تو هم‌زمان عبور کرده باشه.</div>
            </aside>
          </div>
        </div>
      </DiagnosticShell>
    );
  }

  if (phase === 'analysis') {
    const checks = ['شرایط فعلی بررسی شد', 'محدودیت‌ها بررسی شد', 'مدل کاری تحلیل شد', '۵ مسیر با شرایط تو مقایسه شد', 'تناقض‌های پاسخ‌ها بررسی شد'];
    const media = content.analysis_media;
    const hasMedia = media?.media?.some((item) => item.kind === 'text' ? item.caption : item.url || item.urls?.length);
    return (
      <DiagnosticShell compact>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid lg:grid-cols-[1fr_.8fr] gap-12 items-center min-h-[calc(100dvh-5rem)]">
          <section className="space-y-8">
            <div><p className="text-sm font-bold text-primary mb-3">پاسخ‌هات کامل شد.</p><h1 className="text-3xl sm:text-5xl font-black leading-[1.45]">داریم پیشنهاد نهایی رو می‌سازیم...</h1></div>
            <div className="space-y-1">
              {checks.map((label, index) => (
                <div key={label} className={cn('flex items-center gap-4 py-4 border-b border-border transition-all duration-500', index < analysisBeat ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-3')}>
                  <span className={cn('w-7 h-7 border flex items-center justify-center', index < analysisBeat ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                    {index < analysisBeat ? <Check className="w-4 h-4" /> : index + 1}
                  </span>
                  <span className="font-bold">{label}</span>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </section>
          <aside className="lg:border-r lg:border-border lg:pr-10">
            {hasMedia ? <BlockCard block={media} /> : (
              <div className="space-y-6">
                <div className="text-7xl sm:text-9xl font-black text-primary/10">۵←۱</div>
                <p className="text-lg leading-loose text-muted-foreground">این نتیجه از کنار هم گذاشتن انتخاب‌های واقعی تو ساخته می‌شه؛ نه از یک عنوان شخصیت یا یک پاسخ آخر.</p>
              </div>
            )}
          </aside>
        </div>
      </DiagnosticShell>
    );
  }

  const evidence = collectEvidence(answers);
  const partial = scoreFromEvidence(evidence);
  const profile = buildProfile(answers, evidence);
  const profileCopy = profileNarrative(profile);
  const isLast = stepIndex >= flow.length - 1;

  const renderStep = () => {
    if (!step) return null;
    if (step.kind === 'question') {
      const question = QUESTION_BY_ID[step.qid];
      if (question.kind === 'rank') {
        const items = asArray(answers.q4_interest).filter((value) => value !== 'unknown');
        return <RankStep title={question.title} hint={question.hint} items={items} value={asArray(answers.q5_rank)} onChange={(value) => setAnswer('q5_rank', value)} />;
      }
      return <QuestionStep question={question} value={answers[question.id]} onChange={(value) => setAnswer(question.id, value)} />;
    }
    if (step.kind === 'insight') {
      const dynamic = step.key === 'i_capital' ? conditionsInsight(answers) : step.key === 'i_speed' ? `گفتی «${QUESTION_BY_ID.q9_speed.options.find((option) => option.value === answers.q9_speed)?.label || ''}». این یعنی مسیر باید زود به بازار وصل شود، نه اینکه فقط سریع به نظر برسد.` : '';
      return <div className="max-w-4xl space-y-7"><span className="text-xs font-black text-primary">یه چیز جالب پیدا کردیم.</span><h2 className="text-3xl sm:text-6xl font-black leading-[1.45]">{step.title}</h2>{dynamic && <p className="text-xl sm:text-2xl font-bold leading-loose border-r-4 border-primary pr-5">{dynamic}</p>}{step.body.map((body) => <p key={body} className="text-base sm:text-lg text-muted-foreground leading-loose max-w-3xl">{body}</p>)}</div>;
    }
    if (step.kind === 'mini1') return (
      <div className="space-y-10">
        <div className="max-w-3xl"><span className="text-xs font-black text-primary">اولین کشف</span><h2 className="text-3xl sm:text-6xl font-black leading-[1.45] mt-3">اولین تصویر از شرایط تو ساخته شد.</h2></div>
        <div className="grid sm:grid-cols-3 border-y border-border">
          {[
            ['وضعیت فعلی', STAGE_LABEL[String(answers.q1_stage || '')] || '—'], ['زمان واقعی', TIME_LABEL[String(answers.q2_time || '')] || '—'], ['سرمایه شروع', CAPITAL_LABEL[String(answers.q3_capital || '')] || '—'],
          ].map(([label, value], index) => <div key={label} className={cn('py-6 sm:p-6', index > 0 && 'sm:border-r border-border')}><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-black mt-3">{value}</p></div>)}
        </div>
        <div className="grid sm:grid-cols-[1fr_.7fr] gap-8 items-start"><p className="text-xl font-bold leading-loose">{conditionsInsight(answers)}</p><p className="text-muted-foreground leading-loose border-r border-border pr-5">اما این هنوز برای انتخاب مسیر کافی نیست. دو نفر با همین زمان و سرمایه می‌تونن مدل کاری کاملاً متفاوتی داشته باشن. حالا باید بفهمیم تو چطور نتیجه می‌سازی.</p></div>
      </div>
    );
    if (step.kind === 'mini2') {
      const serious = partial.slice(0, 2).map((item) => item.path);
      return <div className="space-y-10">
        <div><span className="text-xs font-black text-primary">غربال اول انجام شد</span><h2 className="text-3xl sm:text-6xl font-black leading-[1.45] mt-3">از ۵ مسیر شروع کردیم...</h2><p className="text-lg text-muted-foreground mt-4">الان ۲ مسیر جدی‌تر از بقیه شدن.</p></div>
        <div className="grid sm:grid-cols-5 gap-3">
          {partial.map((item, index) => <div key={item.path} className={cn('relative min-h-[120px] p-4 border transition-all duration-700 flex flex-col justify-between', serious.includes(item.path) ? 'border-primary bg-primary/5 opacity-100' : 'border-border bg-muted/30 opacity-35 grayscale')}><span className="text-xs font-black">{PATH_ICONS[item.path]}</span><span className={cn('text-sm font-bold', !serious.includes(item.path) && 'line-through')}>{serious.includes(item.path) ? `مسیر ${index === 0 ? 'الف' : 'ب'}` : PATH_LABELS[item.path]}</span></div>)}
        </div>
        <div className="max-w-2xl border-r-4 border-foreground pr-5"><p className="text-xl font-black">اسم دو مسیر آخر رو هنوز نمی‌گیم.</p><p className="text-muted-foreground mt-2 leading-loose">{profileSignal(answers)} ولی یه جواب هنوز می‌تونه انتخاب اول رو عوض کنه.</p></div>
      </div>;
    }
    if (step.kind === 'profile') return (
      <div className="grid lg:grid-cols-[1.1fr_.7fr] gap-10 items-center">
        <div className="space-y-6"><span className="text-xs font-black text-primary">مدل کاری تو داره مشخص می‌شه.</span><h2 className="text-4xl sm:text-7xl font-black leading-[1.35]">{profileCopy.title}</h2><p className="text-lg sm:text-xl leading-loose text-muted-foreground">{profileCopy.description}</p><p className="text-sm leading-loose border-r-4 border-primary pr-4">{profileSignal(answers)}</p></div>
        <details className="border-y border-border py-5"><summary className="font-bold cursor-pointer">جزئیات این برداشت</summary><div className="space-y-4 mt-5">{[['تجاری', profile.commercial], ['خلاق', profile.creative], ['فنی', profile.technical], ['اجرا', profile.execution]].map(([label, value]) => <div key={String(label)}><div className="flex justify-between text-xs"><span>{label}</span><span>{value}</span></div><div className="h-1 bg-muted mt-2"><div className="h-full bg-primary" style={{ width: `${value}%` }} /></div></div>)}</div><p className="text-xs text-muted-foreground leading-loose mt-5">این تست روان‌شناسی نیست؛ تصویری عملی از سبک کاری تو بر اساس پاسخ‌هاست.</p></details>
      </div>
    );
    if (step.kind === 'block') {
      const block = content[step.blockKey] || DEFAULT_CONTENT[step.blockKey];
      if (!block) return null;
      const extra = detectContradictions(answers).filter((item) => step.blockKey === `objection_${item.key}` || (step.blockKey === 'objection_money' && item.key === 'money') || (step.blockKey === 'objection_time' && item.key === 'time') || (step.blockKey === 'objection_skill' && item.key === 'skill')).map((item) => item.text);
      const trust = step.blockKey === 'trust_block';
      const dream = step.blockKey === 'objection_dream_selling' || step.blockKey === 'objection_trust';
      return <div className={cn('grid gap-10', (block.media?.length || trust) && 'lg:grid-cols-[.85fr_1.15fr] items-start')}><div><span className="text-xs font-black text-primary">{trust ? 'قبل از ادامه، یه نکته مهمه.' : dream ? 'لازم نیست حرف ما رو باور کنی.' : extra.length ? 'اینجا یک تناقض داریم.' : 'بذار مستقیم حرف بزنیم.'}</span><BlockCard block={{ ...block, media: [] }} extraBody={extra} className="mt-4" /></div>{block.media && block.media.length > 0 ? <BlockCard block={{ ...block, title: '', body: [] }} /> : trust ? <div className="bg-foreground text-background p-6 sm:p-10 min-h-[300px] flex flex-col justify-between"><ShieldCheck className="w-9 h-9 text-primary" /><div><p className="text-2xl font-black leading-relaxed">پیشنهاد مسیر وقتی ارزش داره که پشتش تجربه اجرا باشه.</p><p className="text-sm text-background/70 leading-loose mt-4">ویدیو، نتایج، پلتفرم‌ها و زیرساخت واقعی اینجا از پنل مدیریت قابل اضافه‌شدنه؛ تا وقتی مدرکی ثبت نشده، چیزی جعل نمی‌کنیم.</p></div></div> : null}</div>;
    }
    if (step.kind === 'final_micro') {
      const contradictions = detectContradictions(answers);
      return <div className="max-w-4xl space-y-7"><span className="text-xs font-black text-primary">تصویر کامل شد.</span><h2 className="text-3xl sm:text-6xl font-black leading-[1.45]">{contradictions.length ? 'علاقه‌ات و شرایطت همه‌جا یک حرف نزدن.' : 'جواب‌هات به شکل جالبی با هم هماهنگ بودن.'}</h2><p className="text-lg sm:text-xl text-muted-foreground leading-loose">{contradictions[0]?.text || 'احتمالاً اسم مسیر خیلی غافلگیرت نمی‌کنه؛ اما دلیل انتخابش مهم‌تر از خود اسمشه.'}</p><p className="font-black text-xl">برای همین نتیجه فقط از چیزی که دوست داری ساخته نشده.</p></div>;
    }
    return <div className="max-w-3xl space-y-5"><span className="text-xs font-black text-primary">آخرین مرحله</span><h2 className="text-4xl sm:text-6xl font-black">آماده‌ست.</h2><p className="text-lg text-muted-foreground leading-loose">حالا پاسخ‌هات، شواهد امتیازدهی و تناقض‌ها رو کنار هم می‌ذاریم.</p></div>;
  };

  const ctaLabel = step?.kind === 'block' && content[step.blockKey]?.cta ? content[step.blockKey].cta : step?.kind === 'mini1' ? 'ادامه تحلیل من' : step?.kind === 'mini2' ? 'دو مسیر آخر رو دقیق‌تر کنیم' : step?.kind === 'profile' ? 'حالا بریم سراغ ترمزها' : isLast ? 'نتیجه من رو بساز' : step?.kind === 'question' && step.qid === 'q15_notification' ? 'پاسخ‌هام کامل شد' : 'بریم یه لایه عمیق‌تر';

  return (
    <DiagnosticShell compact onExit={() => navigate('/')}>
      <div ref={topRef} className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-28 sm:pb-32">
        <StageBar current={step?.stage || 'self'} progress={progress} />
        <div key={step?.key} className="stv2-scene py-10 sm:py-16 flex items-center"><div className="w-full">{renderStep()}</div></div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {stepIndex > 0 && <Button variant="ghost" size="lg" onClick={goBack} className="h-12"><ArrowRight className="w-4 h-4 ml-2" /><span className="hidden sm:inline">قبلی</span></Button>}
          <Button size="lg" className="h-12 sm:h-14 flex-1 sm:flex-none sm:min-w-[260px] sm:mr-auto" disabled={!canContinue()} onClick={() => isLast ? finish() : goNext()}>{ctaLabel}<ArrowLeft className="w-4 h-4 mr-2" /></Button>
          <span className="hidden sm:block text-xs text-muted-foreground">{answeredCount} پاسخ ثبت شده</span>
        </div>
      </div>
    </DiagnosticShell>
  );
};

export default SmartTestV2;

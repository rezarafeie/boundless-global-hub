import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Clock3, RotateCcw, Check, Compass, ShieldCheck, Loader2, MessageCircle, PlayCircle } from 'lucide-react';
import StageBar from '@/components/SmartTestV2/StageBar';
import QuestionStep from '@/components/SmartTestV2/QuestionStep';
import RankStep from '@/components/SmartTestV2/RankStep';
import BlockCard from '@/components/SmartTestV2/BlockCard';
import DiagnosticShell from '@/components/SmartTestV2/DiagnosticShell';
import CheckpointCard from '@/components/SmartTestV2/CheckpointCard';
import AdaptiveStep from '@/components/SmartTestV2/AdaptiveStep';
import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { DEFAULT_CONTENT, PATH_EDUCATION, type ContentBlock } from '@/data/smartTestV2/content';
import { PATH_LABELS, type Answers, type PathId } from '@/data/smartTestV2/types';
import { buildFlow, TOTAL_QUESTIONS, type Step } from '@/lib/smartTestV2/flow';
import { collectEvidence, scoreFromEvidence, buildProfile, computeResult, detectContradictions } from '@/lib/smartTestV2/engine';
import { conditionsInsight, profileNarrative, profileSignal } from '@/lib/smartTestV2/presentation';
import { runAdaptive, runCheckpoint, type AdaptiveQuestion, type CheckpointInsight } from '@/lib/smartTestV2/ai';
import {
  clearLocalState, createSubmission, getSessionKey, identityFields, loadContent, loadLocalState,
  saveLocalState, trackEvent, updateSubmission,
} from '@/lib/smartTestV2/store';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Shimmer } from '@/components/ai-elements/shimmer';

const asArray = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const TIME_LABEL: Record<string, string> = { lt1: 'کمتر از ۱ ساعت', '1_2': '۱ تا ۲ ساعت', '2_4': '۲ تا ۴ ساعت', gt4: 'بیشتر از ۴ ساعت' };
const CAPITAL_LABEL: Record<string, string> = { zero: 'تقریباً صفر', lt100: 'تا ۱۰۰ دلار', '100_500': '۱۰۰ تا ۵۰۰ دلار', '500_2000': '۵۰۰ تا ۲۰۰۰ دلار', gt2000: 'بیشتر از ۲۰۰۰ دلار' };
const STAGE_LABEL: Record<string, string> = { no_income: 'شروع از صفر', employed: 'شاغل', freelancer: 'فریلنسر / متخصص', business_owner: 'صاحب کسب‌وکار', tried_failed: 'تجربه‌های ناتمام' };

type CheckpointState = { state: 'loading' | 'ready' | 'failed'; insight: CheckpointInsight | null };

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-xs font-bold text-primary">{children}</span>
);

const SmartTestV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'intro' | 'test' | 'adaptive' | 'analysis'>('intro');
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, ContentBlock>>(DEFAULT_CONTENT);
  const [resumable, setResumable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisBeat, setAnalysisBeat] = useState(0);
  const [wrapping, setWrapping] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Record<string, CheckpointState>>({});
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Record<string, string>>({});
  const [adaptiveIndex, setAdaptiveIndex] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContent().then(setContent);
    const saved = loadLocalState();
    if (saved && Object.keys(saved.answers || {}).length > 0) setResumable(true);
  }, []);

  const flow: Step[] = useMemo(() => buildFlow(answers), [answers]);
  const step = flow[Math.min(stepIndex, flow.length - 1)];
  const answeredCount = useMemo(() => Object.keys(answers).filter((key) => key.startsWith('q') && asArray(answers[key]).length > 0).length, [answers]);
  const progress = Math.min(0.98, answeredCount / TOTAL_QUESTIONS);

  const persist = useCallback((nextAnswers: Answers, nextIndex: number, id: string | null) => {
    saveLocalState({ submissionId: id, stepIndex: nextIndex, answers: nextAnswers, startedAt: startedAtRef.current });
    if (id) updateSubmission(id, { answers: nextAnswers, current_step: flow[nextIndex]?.key ?? null, status: 'in_progress' });
  }, [flow]);

  const readyInsights = useMemo(() => {
    const out: Record<string, CheckpointInsight> = {};
    Object.entries(checkpoints).forEach(([key, value]) => { if (value.insight) out[key] = value.insight; });
    return out;
  }, [checkpoints]);

  const fireCheckpoint = useCallback(async (checkpoint: number, currentAnswers: Answers, id: string | null) => {
    const key = `cp${checkpoint}`;
    setCheckpoints((previous) => ({ ...previous, [key]: { state: 'loading', insight: null } }));
    const insight = await runCheckpoint(id, checkpoint, currentAnswers, readyInsights);
    setCheckpoints((previous) => ({ ...previous, [key]: insight ? { state: 'ready', insight } : { state: 'failed', insight: null } }));
  }, [readyInsights]);

  // Run the checkpoint analysis as soon as its screen appears; the UI never blocks on it.
  useEffect(() => {
    if (phase !== 'test' || step?.kind !== 'ai_checkpoint') return;
    const key = `cp${step.checkpoint}`;
    if (checkpoints[key]) return;
    fireCheckpoint(step.checkpoint, answers, submissionId);
  }, [phase, step, checkpoints, answers, submissionId, fireCheckpoint]);

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
    if (!step) return false;
    if (step.kind === 'profile_question') return asArray(answers[step.key]).some((value) => value.trim().length > 0);
    if (step.kind === 'commitment') return asArray(answers[step.key]).length > 0;
    if (step.kind !== 'question') return true;
    const question = QUESTION_BY_ID[step.qid];
    if (question.kind === 'rank') return true;
    return asArray(answers[step.qid]).length > 0;
  };

  /** Save everything and move to the result page. */
  const complete = async (extraAdaptive: Record<string, string>) => {
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
      adaptive_questions: adaptiveQuestions, adaptive_answers: extraAdaptive,
      ai_status: 'pending',
      completed_at: new Date().toISOString(), duration_seconds: duration,
    };
    let id = submissionId;
    if (!id) id = await createSubmission({ ...identityFields(user), ...payload });
    else await updateSubmission(id, payload);
    trackEvent(id, 'test_completed', undefined, { path: result.recommended.path });
    clearLocalState();
    for (let beat = 1; beat <= 4; beat += 1) {
      await new Promise((resolve) => setTimeout(resolve, 420));
      setAnalysisBeat(beat);
    }
    if (id) navigate(`/smart-test-v2/result/${id}`);
    else setError('ذخیره نتیجه ممکن نشد. لطفاً دوباره تلاش کن.');
  };

  /** After the core questions, ask the model whether it still needs clarification. */
  const wrapUp = async () => {
    setWrapping(true);
    const questions = await runAdaptive(submissionId, answers, readyInsights);
    setWrapping(false);
    if (questions.length > 0) {
      setAdaptiveQuestions(questions);
      setAdaptiveIndex(0);
      setPhase('adaptive');
      trackEvent(submissionId, 'adaptive_questions', undefined, { count: questions.length });
      return;
    }
    complete({});
  };

  /* ------------------------------- intro ------------------------------- */
  if (phase === 'intro') {
    return (
      <DiagnosticShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
          <div className="space-y-4">
            <SectionLabel>تشخیص مسیر بدون مرز</SectionLabel>
            <h1 className="text-2xl sm:text-4xl font-black leading-[1.6]">کدوم مسیر بدون مرز واقعاً برای تو ساخته شده؟</h1>
            <p className="text-base font-semibold">قرار نیست ازت بپرسیم چی دوست داری و همون رو پیشنهاد بدیم.</p>
            <p className="text-sm sm:text-base text-muted-foreground leading-8">
              شرایط فعلیت، زمان، سرمایه، توانایی‌ها، مدل کاری، محدودیت‌ها و هدفت رو کنار هم می‌ذاریم و همون وسط مسیر هم تحلیل رو باهات در میون می‌ذاریم تا ببینیم اگر جای تو بودیم، از کجا شروع می‌کردیم.
            </p>
          </div>

           <div className="border-y border-border py-5 space-y-3">
            <p className="text-xs font-bold text-muted-foreground">۵ مسیری که بررسی می‌شن</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PATH_LABELS).map(([id, label]) => (
                <span key={id} className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold" dir="ltr">{label}</span>
              ))}
            </div>

           <div className="flex gap-3 items-start border-r-2 border-primary pr-4">
             <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
             <div>
               <p className="font-black">{content.conversation_intro?.title || DEFAULT_CONTENT.conversation_intro.title}</p>
               {(content.conversation_intro?.body || DEFAULT_CONTENT.conversation_intro.body).map((line) => <p key={line} className="text-sm text-muted-foreground leading-7 mt-1">{line}</p>)}
             </div>
           </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-border text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-primary" /> ۴ تا ۷ دقیقه</span>
              <span className="flex items-center gap-1.5"><Compass className="w-4 h-4 text-primary" /> پیشنهاد مسیر + نقشه شروع</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> پاسخ‌ها محرمانه‌اند</span>
            </div>
          </div>

          {resumable ? (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 space-y-4">
              <div>
                <p className="font-black">تحلیلت هنوز اینجاست.</p>
                <p className="text-sm text-muted-foreground mt-1">پاسخ‌هات ذخیره شده؛ از همون نقطه ادامه بده.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-12" onClick={() => start(true)}>ادامه تحلیل <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                <Button size="lg" variant="ghost" className="h-12" onClick={() => start(false)}><RotateCcw className="w-4 h-4 ml-2" /> از اول شروع کن</Button>
              </div>
            </div>
          ) : (
            <Button size="lg" className="h-13 w-full sm:w-auto px-8 py-3.5" onClick={() => start(false)}>
              تحلیل من رو شروع کن <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>
      </DiagnosticShell>
    );
  }

  /* ------------------------------ analysis ----------------------------- */
  if (phase === 'analysis') {
    const checks = ['شرایط و محدودیت‌ها بررسی شد', 'مدل کاری و مهارت‌ها تحلیل شد', '۵ مسیر با شرایط تو مقایسه شد', 'تناقض‌های پاسخ‌ها بررسی شد'];
    return (
      <DiagnosticShell compact>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 space-y-8">
          <div className="space-y-2">
            <SectionLabel>پاسخ‌هات کامل شد</SectionLabel>
            <h1 className="text-xl sm:text-2xl font-black leading-9">داریم تشخیص نهایی رو می‌سازیم...</h1>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {checks.map((label, index) => (
              <div key={label} className={cn('flex items-center gap-3 px-5 py-4 transition-opacity duration-300', index < analysisBeat ? 'opacity-100' : 'opacity-40')}>
                <span className={cn('w-6 h-6 rounded-full border flex items-center justify-center text-[11px]', index < analysisBeat ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                  {index < analysisBeat ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </span>
                <span className="text-sm font-bold">{label}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DiagnosticShell>
    );
  }

  /* ------------------------------ adaptive ----------------------------- */
  if (phase === 'adaptive') {
    const question = adaptiveQuestions[adaptiveIndex];
    const answered = !!adaptiveAnswers[question.id];
    const last = adaptiveIndex >= adaptiveQuestions.length - 1;
    return (
      <DiagnosticShell compact>
        <div ref={topRef} className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28">
          <StageBar current="analysis" progress={0.97} />
          <div className="py-8">
            <AdaptiveStep
              question={question}
              index={adaptiveIndex}
              total={adaptiveQuestions.length}
              value={adaptiveAnswers[question.id]}
              onChange={(value) => setAdaptiveAnswers((previous) => ({ ...previous, [question.id]: value }))}
            />
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
            <Button
              size="lg"
              className="h-12 w-full"
              disabled={!answered}
              onClick={() => (last ? complete(adaptiveAnswers) : setAdaptiveIndex((index) => index + 1))}
            >
              {last ? 'نتیجه من رو بساز' : 'سؤال بعدی'} <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </DiagnosticShell>
    );
  }

  /* -------------------------------- test ------------------------------- */
  const evidence = collectEvidence(answers);
  const partial = scoreFromEvidence(evidence);
  const profile = buildProfile(answers, evidence);
  const profileCopy = profileNarrative(profile);
  const isLast = stepIndex >= flow.length - 1;

  const renderStep = () => {
    if (!step) return null;

    if (step.kind === 'profile_question') {
      const value = String(answers[step.key] || '');
      return (
        <section className="space-y-5">
          <header className="space-y-2">
            <SectionLabel>گفت‌وگوی شخصی</SectionLabel>
            <h2 className="text-xl sm:text-2xl font-black leading-9">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-7">{step.prompt}</p>
          </header>
          {step.input === 'text' ? (
            <Input autoFocus value={value} onChange={(event) => setAnswer(step.key, event.target.value)} placeholder="اسمت رو بنویس..." className="h-14 text-base bg-background" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {step.options?.map((option) => (
                <Button key={option.value} variant="outline" className={cn('h-auto min-h-14 whitespace-normal justify-start text-right', value === option.value && 'border-primary bg-primary/10')} onClick={() => setAnswer(step.key, option.value)}>
                  {value === option.value && <Check className="w-4 h-4 ml-2 shrink-0" />}{option.label}
                </Button>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (step.kind === 'question') {
      const question = QUESTION_BY_ID[step.qid];
      if (question.kind === 'rank') {
        const items = asArray(answers.q4_interest).filter((value) => value !== 'unknown');
        return <RankStep title={question.title} hint={question.hint} items={items} value={asArray(answers.q5_rank)} onChange={(value) => setAnswer('q5_rank', value)} />;
      }
      return <QuestionStep question={question} value={answers[question.id]} onChange={(value) => setAnswer(question.id, value)} />;
    }

    if (step.kind === 'ai_checkpoint') {
      const key = `cp${step.checkpoint}`;
      const state = checkpoints[key] || { state: 'loading' as const, insight: null };
      const fallback = step.checkpoint === 1
        ? conditionsInsight(answers)
        : step.checkpoint === 2
          ? profileSignal(answers)
          : step.checkpoint === 3
            ? `تا اینجا مدل کاری تو بیشتر به «${profileCopy.title}» نزدیکه و همین انتخاب مسیر رو محدودتر می‌کنه.`
            : (detectContradictions(answers)[0]?.text || 'موانعی که انتخاب کردی رو کنار جواب‌های قبلیت می‌ذاریم تا ببینیم واقعاً محدودیتن یا تردید.');
      return (
        <CheckpointCard
          state={state.state}
          insight={state.insight}
          fallback={fallback}
          onRetry={() => fireCheckpoint(step.checkpoint, answers, submissionId)}
        />
      );
    }

    if (step.kind === 'education') {
      const topPaths = partial.slice(0, 2).map((item) => item.path);
      return (
        <section className="space-y-7">
          <div className="space-y-2">
            <SectionLabel>قبل از اینکه انتخاب نهایی کنیم</SectionLabel>
            <h2 className="text-xl sm:text-2xl font-black leading-9">بذار دو مدل جدی‌تر رو بدون شعار ببینی.</h2>
            <p className="text-sm text-muted-foreground leading-7">علاقه کافی نیست؛ باید ببینی پول دقیقاً چطور جابه‌جا می‌شه و سختی واقعی هر مدل کجاست.</p>
          </div>
          {topPaths.map((path, index) => {
            const education = PATH_EDUCATION[path];
            return (
              <div key={path} className="space-y-4 border-t border-border pt-6">
                <p className="text-xs font-bold text-primary">مدل {index + 1} از ۲</p>
                <BlockCard block={education} />
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold" dir="ltr">
                  {education.transaction.map((item, itemIndex) => <React.Fragment key={item}><span className="px-2.5 py-1.5 bg-muted rounded-md">{item}</span>{itemIndex < education.transaction.length - 1 && <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />}</React.Fragment>)}
                </div>
                <p className="text-sm leading-7 border-r-2 border-destructive/60 pr-3"><b>واقعیت این مدل:</b> {education.reality}</p>
              </div>
            );
          })}
        </section>
      );
    }

    if (step.kind === 'commitment') {
      const value = String(answers[step.key] || '');
      return (
        <section className="space-y-5">
          <header className="space-y-2"><SectionLabel>یک تصمیم واقعی</SectionLabel><h2 className="text-xl sm:text-2xl font-black leading-9">{step.title}</h2><p className="text-sm text-muted-foreground leading-7">{step.prompt}</p></header>
          <div className="grid gap-2">
            {step.options.map((option) => <Button key={option.value} variant="outline" onClick={() => setAnswer(step.key, option.value)} className={cn('h-auto min-h-14 justify-start whitespace-normal text-right', value === option.value && 'border-primary bg-primary/10')}>
              {value === option.value && <Check className="w-4 h-4 ml-2 shrink-0" />}{option.label}
            </Button>)}
          </div>
        </section>
      );
    }

    if (step.kind === 'insight') {
      const dynamic = step.key === 'i_capital'
        ? conditionsInsight(answers)
        : step.key === 'i_speed'
          ? `گفتی «${QUESTION_BY_ID.q9_speed.options.find((option) => option.value === answers.q9_speed)?.label || ''}». پس مسیرت باید زود به بازار وصل بشه، نه اینکه فقط سریع به نظر بیاد.`
          : '';
      return (
        <section className="space-y-4">
          <SectionLabel>تحلیل اولیه</SectionLabel>
          <h2 className="text-xl sm:text-2xl font-black leading-9">{step.title}</h2>
          {dynamic && <p className="text-base font-semibold leading-8 border-r-2 border-primary pr-4">{dynamic}</p>}
          {step.body.map((body) => <p key={body} className="text-sm sm:text-base text-muted-foreground leading-8">{body}</p>)}
        </section>
      );
    }

    if (step.kind === 'mini1') {
      return (
        <section className="space-y-6">
          <div className="space-y-2">
            <SectionLabel>اولین تصویر</SectionLabel>
            <h2 className="text-xl sm:text-2xl font-black leading-9">اولین تصویر از شرایط تو ساخته شد.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['وضعیت فعلی', STAGE_LABEL[String(answers.q1_stage || '')] || '—'],
              ['زمان واقعی', TIME_LABEL[String(answers.q2_time || '')] || '—'],
              ['سرمایه شروع', CAPITAL_LABEL[String(answers.q3_capital || '')] || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-base font-black mt-2">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-8">
            دو نفر با همین زمان و سرمایه می‌تونن مدل کاری کاملاً متفاوتی داشته باشن. حالا باید بفهمیم تو چطور نتیجه می‌سازی.
          </p>
        </section>
      );
    }

    if (step.kind === 'mini2') {
      const serious = partial.slice(0, 2).map((item) => item.path);
      return (
        <section className="space-y-6">
          <div className="space-y-2">
            <SectionLabel>غربال اول</SectionLabel>
            <h2 className="text-xl sm:text-2xl font-black leading-9">از ۵ مسیر، ۲ مسیر جدی‌تر شدن.</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {partial.map((item, index) => (
              <div
                key={item.path}
                className={cn(
                  'rounded-lg border p-3 min-h-[76px] flex flex-col justify-between text-center transition-all duration-500',
                  serious.includes(item.path) ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 opacity-45',
                )}
              >
                <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                <span className={cn('text-[11px] font-bold leading-4', !serious.includes(item.path) && 'line-through')}>
                  {serious.includes(item.path) ? `مسیر ${index === 0 ? 'الف' : 'ب'}` : PATH_LABELS[item.path]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-8">اسم دو مسیر آخر رو هنوز نمی‌گیم؛ چون یه جواب دیگه هنوز می‌تونه انتخاب اول رو عوض کنه.</p>
        </section>
      );
    }

    if (step.kind === 'profile') {
      return (
        <section className="space-y-5">
          <div className="space-y-2">
            <SectionLabel>مدل کاری تو</SectionLabel>
            <h2 className="text-xl sm:text-2xl font-black leading-9">{profileCopy.title}</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-8">{profileCopy.description}</p>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            {[['تجاری', profile.commercial], ['خلاق', profile.creative], ['فنی', profile.technical], ['اجرا', profile.execution]].map(([label, value]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-xs"><span>{label}</span><span>{value}</span></div>
                <div className="h-1.5 rounded-full bg-muted mt-1.5"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${value}%` }} /></div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">این تست روان‌شناسی نیست؛ تصویری عملی از سبک کاری تو بر اساس پاسخ‌هاست.</p>
          </div>
        </section>
      );
    }

    if (step.kind === 'block') {
      const block = content[step.blockKey] || DEFAULT_CONTENT[step.blockKey];
      if (!block) return null;
      const extra = detectContradictions(answers)
        .filter((item) => step.blockKey === `objection_${item.key}`)
        .map((item) => item.text);
      const trust = step.blockKey === 'trust_block';
      return (
        <section className="space-y-5">
          <SectionLabel>{trust ? 'قبل از ادامه' : extra.length ? 'اینجا یک تناقض داریم' : 'بذار مستقیم حرف بزنیم'}</SectionLabel>
          <BlockCard block={block} extraBody={extra} />
        </section>
      );
    }

    if (step.kind === 'final_micro') {
      const contradictions = detectContradictions(answers);
      return (
        <section className="space-y-4">
          <SectionLabel>تصویر کامل شد</SectionLabel>
          <h2 className="text-xl sm:text-2xl font-black leading-9">
            {contradictions.length ? 'علاقه‌ات و شرایطت همه‌جا یک حرف نزدن.' : 'جواب‌هات به شکل جالبی با هم هماهنگ بودن.'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-8">
            {contradictions[0]?.text || 'احتمالاً اسم مسیر خیلی غافلگیرت نمی‌کنه؛ اما دلیل انتخابش مهم‌تر از خود اسمشه.'}
          </p>
        </section>
      );
    }

    return (
      <section className="space-y-4">
        <SectionLabel>آخرین مرحله</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-black leading-9">آماده‌ست.</h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-8">
          حالا پاسخ‌هات، شواهد امتیازدهی و تناقض‌ها رو کنار هم می‌ذاریم. اگر جایی هنوز ابهام باشه، فقط یکی دو سؤال کوتاه دیگه می‌پرسیم.
        </p>
      </section>
    );
  };

  const ctaLabel = wrapping
    ? 'در حال بررسی...'
    : step?.kind === 'profile_question' && step.key === 'meta_name' ? `خوش اومدی${answers.meta_name ? `، ${answers.meta_name}` : ''}`
    : step?.kind === 'block' && content[step.blockKey]?.cta
      ? content[step.blockKey].cta
      : step?.kind === 'mini1' ? 'ادامه تحلیل من'
        : step?.kind === 'mini2' ? 'دو مسیر آخر رو دقیق‌تر کنیم'
          : step?.kind === 'ai_checkpoint' ? 'ادامه بده'
            : step?.kind === 'profile' ? 'حالا بریم سراغ ترمزها'
              : isLast ? 'نتیجه من رو بساز'
                : 'ادامه';

  return (
    <DiagnosticShell compact onExit={() => navigate('/')}>
      <div ref={topRef} className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-16">
        <StageBar current={step?.stage || 'self'} progress={progress} />
        <Conversation className="min-h-[calc(100dvh-11rem)]">
          <ConversationContent className="px-0 py-8 sm:py-10 gap-5">
            {answers.meta_name && step?.key !== 'meta_name' && (
              <Message from="assistant"><MessageContent className="bg-transparent px-0 text-xs text-muted-foreground">{answers.meta_name}، تا اینجا {answeredCount} نشونه اصلی از شرایطت دارم. جواب بعدی می‌تونه تصویر رو دقیق‌تر کنه.</MessageContent></Message>
            )}
            <Message from="assistant" key={step?.key} className="animate-fade-in">
              <MessageContent className="max-w-full w-full bg-transparent px-0">{renderStep()}</MessageContent>
            </Message>
            {step?.kind === 'ai_checkpoint' && checkpoints[`cp${step.checkpoint}`]?.state === 'loading' && <Shimmer className="text-sm">دارم ارتباط بین جواب‌هات رو پیدا می‌کنم...</Shimmer>}
            <div className="flex items-center gap-2 pt-4 border-t border-border">
          {stepIndex > 0 && (
            <Button variant="ghost" size="lg" onClick={goBack} className="h-12 px-3">
              <ArrowRight className="w-4 h-4" /><span className="hidden sm:inline mr-2">قبلی</span>
            </Button>
          )}
          <Button size="lg" className="h-12 flex-1" disabled={!canContinue() || wrapping} onClick={() => (isLast ? wrapUp() : goNext())}>
            {wrapping ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            {ctaLabel}
            {!wrapping && <ArrowLeft className="w-4 h-4 mr-2" />}
          </Button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" />جوابت خودکار ذخیره می‌شه؛ هر وقت برگشتی از همین‌جا ادامه می‌دی.</p>
          </ConversationContent>
        </Conversation>
      </div>
    </DiagnosticShell>
  );
};

export default SmartTestV2;

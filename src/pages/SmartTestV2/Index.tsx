import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Clock, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import StageBar from '@/components/SmartTestV2/StageBar';
import QuestionStep from '@/components/SmartTestV2/QuestionStep';
import RankStep from '@/components/SmartTestV2/RankStep';
import BlockCard from '@/components/SmartTestV2/BlockCard';
import { QUESTION_BY_ID } from '@/data/smartTestV2/questions';
import { DEFAULT_CONTENT, type ContentBlock } from '@/data/smartTestV2/content';
import { PATH_LABELS, type Answers } from '@/data/smartTestV2/types';
import { buildFlow, TOTAL_QUESTIONS, type Step } from '@/lib/smartTestV2/flow';
import { collectEvidence, scoreFromEvidence, buildProfile, computeResult, detectContradictions } from '@/lib/smartTestV2/engine';
import {
  clearLocalState, createSubmission, getSessionKey, identityFields, loadContent, loadLocalState,
  saveLocalState, trackEvent, updateSubmission,
} from '@/lib/smartTestV2/store';
import { useAuth } from '@/contexts/AuthContext';

const asArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const TIME_LABEL: Record<string, string> = {
  lt1: 'کمتر از ۱ ساعت', '1_2': '۱ تا ۲ ساعت', '2_4': '۲ تا ۴ ساعت', gt4: 'بیشتر از ۴ ساعت',
};
const CAPITAL_LABEL: Record<string, string> = {
  zero: 'تقریباً صفر', lt100: 'تا ۱۰۰ دلار', '100_500': '۱۰۰ تا ۵۰۰ دلار',
  '500_2000': '۵۰۰ تا ۲۰۰۰ دلار', gt2000: 'بیشتر از ۲۰۰۰ دلار',
};
const STAGE_LABEL: Record<string, string> = {
  no_income: 'شروع از صفر', employed: 'شاغل', freelancer: 'فریلنسر / متخصص',
  business_owner: 'صاحب کسب‌وکار', tried_failed: 'تجربه‌های ناتمام',
};

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
  const startedAtRef = useRef<number>(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContent().then(setContent);
    const saved = loadLocalState();
    if (saved && Object.keys(saved.answers || {}).length > 0) setResumable(true);
  }, []);

  const flow: Step[] = useMemo(() => buildFlow(answers), [answers]);
  const step = flow[Math.min(stepIndex, flow.length - 1)];

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => asArray(answers[k]).length > 0).length,
    [answers],
  );
  const progress = Math.min(0.98, answeredCount / TOTAL_QUESTIONS);

  const persist = useCallback((nextAnswers: Answers, nextIndex: number, id: string | null) => {
    saveLocalState({ submissionId: id, stepIndex: nextIndex, answers: nextAnswers as any, startedAt: startedAtRef.current });
    if (id) {
      updateSubmission(id, {
        answers: nextAnswers,
        current_step: flow[nextIndex]?.key ?? null,
        status: 'in_progress',
      });
    }
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
    setAnswers((prev) => {
      const next = { ...prev, [qid]: value };
      persist(next, stepIndex, submissionId);
      return next;
    });
  };

  const goNext = () => {
    const nextIndex = Math.min(stepIndex + 1, flow.length - 1);
    setStepIndex(nextIndex);
    trackEvent(submissionId, 'step_view', flow[nextIndex]?.key);
    persist(answers, nextIndex, submissionId);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goBack = () => {
    const prevIndex = Math.max(0, stepIndex - 1);
    setStepIndex(prevIndex);
    persist(answers, prevIndex, submissionId);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canContinue = (): boolean => {
    if (!step) return false;
    if (step.kind !== 'question') return true;
    const q = QUESTION_BY_ID[step.qid];
    const sel = asArray(answers[step.qid]);
    if (q.kind === 'rank') return true;
    return sel.length > 0;
  };

  const finish = async () => {
    setPhase('analysis');
    trackEvent(submissionId, 'analysis_started');
    const result = computeResult(answers);
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    const objections = result.objections;
    const payload = {
      status: 'completed',
      answers,
      path_scores: Object.fromEntries(result.ranked.map((r) => [r.path, r.match])),
      score_evidence: result.evidence,
      contradictions: result.contradictions,
      profile_dimensions: {
        commercial: result.profile.commercial,
        creative: result.profile.creative,
        technical: result.profile.technical,
        execution: result.profile.execution,
        risk: result.profile.risk,
      },
      profile_type: result.profile.type,
      recommended_path: result.recommended.path,
      recommended_match: result.recommended.match,
      alternative_path: result.alternative.path,
      alternative_match: result.alternative.match,
      not_now_path: result.notNow?.path ?? null,
      not_now_match: result.notNow?.match ?? null,
      readiness_score: result.readiness,
      confidence: result.confidence,
      primary_objection: objections[0] ?? null,
      secondary_objection: objections[1] ?? null,
      remaining_objections: objections.slice(2),
      viewed_objection_blocks: objections.slice(0, 2),
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
    };

    let id = submissionId;
    if (!id) {
      id = await createSubmission({ ...identityFields(user), ...payload });
    } else {
      await updateSubmission(id, payload);
    }
    trackEvent(id, 'test_completed', undefined, { path: result.recommended.path });
    clearLocalState();
    await new Promise((r) => setTimeout(r, 2200));
    if (id) navigate(`/smart-test-v2/result/${id}`);
    else setError('ذخیره نتیجه ممکن نشد. لطفاً دوباره تلاش کن.');
  };

  /* ---------------- intro ---------------- */
  if (phase === 'intro') {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-10 max-w-2xl">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" /> تست هوشمند بدون مرز — نسخه ۲
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold leading-relaxed">
              کدوم مسیر بدون مرز واقعاً برای تو ساخته شده؟
            </h1>
            <div className="space-y-4 text-sm sm:text-base leading-loose text-muted-foreground">
              <p>قرار نیست ازت بپرسیم «کدوم مسیر رو دوست داری؟» و همون رو بهت پیشنهاد بدیم.</p>
              <p>
                چند دقیقه وقت بذار. شرایط، توانایی‌ها، محدودیت‌ها و چیزی که واقعاً از زندگی و کسب‌وکارت می‌خوای رو کنار هم
                می‌ذاریم و بهت می‌گیم اگر جای تو بودیم، از کجا شروع می‌کردیم.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.values(PATH_LABELS).map((p) => (
                <span key={p} className="rounded-full border border-border px-3 py-1 text-xs">{p}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4" />
              حدود ۴ تا ۷ دقیقه • تحلیل اختصاصی • پیشنهاد مسیر • نقشه شروع
            </div>
            {resumable && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium">تحلیلت هنوز اینجاست.</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => start(true)}>ادامه از همون‌جا</Button>
                  <Button variant="outline" onClick={() => start(false)}>
                    <RotateCcw className="w-4 h-4 ml-1" /> از اول شروع کن
                  </Button>
                </div>
              </div>
            )}
            {!resumable && (
              <Button size="lg" className="w-full h-14 text-base" onClick={() => start(false)}>
                تحلیل من رو شروع کن <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ---------------- analysis ---------------- */
  if (phase === 'analysis') {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-16 max-w-xl text-center space-y-6">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">در حال ساخت نتیجه تو...</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['۱۵', 'پاسخ'], ['۵', 'مسیر'], ['۴', 'فاکتور اصلی']].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-border bg-card p-4">
                <div className="text-2xl font-extrabold text-primary">{n}</div>
                <div className="text-xs text-muted-foreground mt-1">{l}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-loose">
            شرایط + توانایی + هدف + محدودیت داره کنار هم گذاشته می‌شه...
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </MainLayout>
    );
  }

  /* ---------------- test ---------------- */
  const evidence = collectEvidence(answers);
  const partial = scoreFromEvidence(evidence);
  const profile = buildProfile(answers, evidence);
  const isLast = stepIndex >= flow.length - 1;

  const renderStep = () => {
    if (!step) return null;
    switch (step.kind) {
      case 'question': {
        const q = QUESTION_BY_ID[step.qid];
        if (q.kind === 'rank') {
          const items = asArray(answers['q4_interest']).filter((v) => v !== 'unknown');
          return (
            <RankStep
              title={q.title}
              hint={q.hint}
              items={items}
              value={asArray(answers['q5_rank'])}
              onChange={(v) => setAnswer('q5_rank', v)}
            />
          );
        }
        return (
          <QuestionStep
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        );
      }
      case 'insight':
        return (
          <BlockCard block={{ key: step.key, title: step.title, body: step.body }} />
        );
      case 'mini1':
        return (
          <div dir="rtl" className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold">اولین تصویر از شرایط تو ساخته شد.</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['وضعیت', STAGE_LABEL[String(answers['q1_stage'] || '')] || '—'],
                ['زمان', TIME_LABEL[String(answers['q2_time'] || '')] || '—'],
                ['سرمایه', CAPITAL_LABEL[String(answers['q3_capital'] || '')] || '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <div className="text-[11px] text-muted-foreground">{k}</div>
                  <div className="text-xs sm:text-sm font-bold mt-1 leading-relaxed">{v}</div>
                </div>
              ))}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-loose">
              اما این سه‌تا برای پیشنهاد مسیر کافی نیست. حالا می‌خوایم بفهمیم مدل پول درآوردن تو چیه.
            </p>
          </div>
        );
      case 'mini2':
        return (
          <div dir="rtl" className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold">داریم به یه چیزهایی می‌رسیم...</h2>
            <p className="text-sm sm:text-base text-muted-foreground">۲ مسیر الان از بقیه جلو افتادن.</p>
            <div className="space-y-3">
              {partial.slice(0, 2).map((p, i) => (
                <div key={p.path} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>مسیر {i === 0 ? 'الف' : 'ب'}</span>
                    <span>{p.match}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${p.match}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-loose">
              هنوز اسمشون رو نمی‌گیم. چون چیزی که دوست داری لزوماً همون چیزی نیست که الان باید شروع کنی.
            </p>
          </div>
        );
      case 'profile':
        return (
          <div dir="rtl" className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold">پروفایل بدون مرز تو داره شکل می‌گیره...</h2>
            <div className="space-y-3">
              {[
                ['Commercial', profile.commercial],
                ['Creative', profile.creative],
                ['Technical', profile.technical],
                ['Execution', profile.execution],
              ].map(([label, v]) => (
                <div key={label as string} className="space-y-1">
                  <div className="flex justify-between text-xs"><span>{label}</span><span className="font-bold">{v}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-loose">
              این یک تست روان‌شناسی نیست؛ فقط تصویری عملی از سبک کاری توئه که از پاسخ‌های خودت ساخته شده.
            </p>
            <p className="text-sm sm:text-base leading-loose">
              اما هنوز یک چیز مهم مونده: اینکه تا امروز واقعاً چی جلوت رو گرفته.
            </p>
          </div>
        );
      case 'block': {
        const block = content[step.blockKey] || DEFAULT_CONTENT[step.blockKey];
        if (!block) return null;
        const extra = detectContradictions(answers)
          .filter((c) => step.blockKey === `objection_${c.key}` || (step.blockKey === 'objection_money' && c.key === 'money') || (step.blockKey === 'objection_time' && c.key === 'time') || (step.blockKey === 'objection_skill' && c.key === 'skill'))
          .map((c) => c.text);
        return <BlockCard block={block} extraBody={extra} />;
      }
      case 'final_micro': {
        const contradictions = detectContradictions(answers);
        return (
          <div dir="rtl" className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">تمام شد.</h2>
            {contradictions.length > 0 ? (
              <>
                <p className="text-sm sm:text-base leading-loose text-muted-foreground">ولی یه چیز جالبه...</p>
                <p className="text-sm sm:text-base leading-loose text-muted-foreground">
                  در چند سؤال، چیزی که گفتی «دوست داری» با چیزی که شرایط فعلیت می‌گه یکی نبود. برای همین نتیجه فقط بر اساس
                  علاقه‌ت ساخته نشده.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm sm:text-base leading-loose text-muted-foreground">
                  جواب‌هات به شکل جالبی با هم هماهنگ بودن. احتمالاً نتیجه خیلی غافلگیرت نمی‌کنه.
                </p>
                <p className="text-sm sm:text-base leading-loose text-muted-foreground">
                  ولی دلیل انتخاب این مسیر مهم‌تر از اسمشه.
                </p>
              </>
            )}
          </div>
        );
      }
      case 'analysis':
        return (
          <div dir="rtl" className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">آماده‌ست.</h2>
            <p className="text-sm text-muted-foreground leading-loose">
              حالا پاسخ‌هات رو کنار هم می‌ذاریم و مسیر پیشنهادیت رو می‌سازیم.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const ctaLabel = step?.kind === 'block' && content[(step as any).blockKey]?.cta
    ? content[(step as any).blockKey].cta!
    : step?.kind === 'mini1'
      ? 'ادامه تحلیل من'
      : isLast ? 'نتیجه من رو بساز' : 'ادامه';

  return (
    <MainLayout>
      <div dir="rtl" className="container mx-auto px-4 py-6 max-w-2xl" ref={topRef}>
        <StageBar current={step?.stage || 'self'} progress={progress} />
        <div className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-8 min-h-[320px]">
          {renderStep()}
        </div>
        <div className="mt-5 flex items-center gap-3 pb-[env(safe-area-inset-bottom)]">
          {stepIndex > 0 && (
            <Button variant="outline" size="lg" onClick={goBack} className="h-12">
              <ArrowRight className="w-4 h-4 ml-1" /> قبلی
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 h-12"
            disabled={!canContinue()}
            onClick={() => (isLast ? finish() : goNext())}
          >
            {ctaLabel} <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default SmartTestV2;

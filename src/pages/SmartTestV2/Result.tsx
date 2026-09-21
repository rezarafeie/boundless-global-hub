import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Compass, Loader2, RotateCcw, Send, ShieldCheck, BrainCircuit, TriangleAlert, Wrench, Scale } from 'lucide-react';
import { fetchSubmission, loadContent, trackEvent, updateSubmission } from '@/lib/smartTestV2/store';
import { DEFAULT_CONTENT, ROADMAPS, type ContentBlock } from '@/data/smartTestV2/content';
import { PATH_FA, PATH_LABELS, type PathId } from '@/data/smartTestV2/types';
import { computeResult } from '@/lib/smartTestV2/engine';
import { alternativeNote, notNowNote, pathActions, pathReasonLine, profileNarrative, riskCorrection } from '@/lib/smartTestV2/presentation';
import { runFinalDiagnosis, type AiDiagnosis, type CheckpointInsight } from '@/lib/smartTestV2/ai';
import BlockCard from '@/components/SmartTestV2/BlockCard';
import DiagnosticShell from '@/components/SmartTestV2/DiagnosticShell';
import BoundlessOffer from '@/components/SmartTestV2/BoundlessOffer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAZA_COURSE_ID = 'b97c19b7-98d3-4891-b00f-93bfb7711487';
const DIMENSIONS = [['تجاری', 'commercial'], ['خلاق', 'creative'], ['فنی', 'technical'], ['اجرا', 'execution']] as const;

const Label: React.FC<{ children: React.ReactNode; tone?: 'primary' | 'muted' | 'danger' }> = ({ children, tone = 'primary' }) => (
  <span className={cn('text-xs font-bold', tone === 'primary' && 'text-primary', tone === 'muted' && 'text-muted-foreground', tone === 'danger' && 'text-destructive')}>{children}</span>
);

const Section: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <section className={cn('space-y-4 py-8 border-b border-border', className)}>{children}</section>
);

const SmartTestV2Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Record<string, ContentBlock>>(DEFAULT_CONTENT);
  const [mazaProgress, setMazaProgress] = useState<number | null>(null);
  const [ai, setAi] = useState<AiDiagnosis | null>(null);
  const [aiState, setAiState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const requested = useRef(false);

  useEffect(() => {
    loadContent().then(setContent);
    if (!id) return;
    fetchSubmission(id).then((data) => {
      setRow(data);
      setLoading(false);
      trackEvent(id, 'result_view');
      if ((data as any)?.ai_diagnosis) {
        setAi((data as any).ai_diagnosis as AiDiagnosis);
        setAiState('ready');
        requested.current = true;
      }
    });
  }, [id]);

  const result = useMemo(() => (row?.answers ? computeResult(row.answers) : null), [row]);

  const requestDiagnosis = useCallback(async () => {
    if (!row || !result || !id) return;
    setAiState('loading');
    try {
      const checkpoints = (row.ai_checkpoints || {}) as Record<string, CheckpointInsight>;
      const diagnosis = await runFinalDiagnosis(
        id, row.answers, result, checkpoints,
        (row.adaptive_questions || []) as any, (row.adaptive_answers || {}) as Record<string, string>,
        { maza_progress: row.maza_progress ?? null },
      );
      setAi(diagnosis);
      setAiState('ready');
    } catch (e) {
      console.error('stv2 final diagnosis failed', e);
      setAiState('failed');
      if (id) updateSubmission(id, { ai_status: 'failed' });
    }
  }, [row, result, id]);

  // Run the AI diagnosis once the saved answers are loaded; answers are never lost if it fails.
  useEffect(() => {
    if (requested.current || !row || !result || !id) return;
    requested.current = true;
    requestDiagnosis();
  }, [row, result, id, requestDiagnosis]);

  useEffect(() => {
    const uid = (user as any)?.id;
    if (!uid) return;
    supabase.from('user_course_progress').select('progress_percentage').eq('user_id', uid).eq('course_id', MAZA_COURSE_ID).maybeSingle().then(({ data }) => {
      const progressValue = (data as any)?.progress_percentage;
      if (typeof progressValue === 'number') {
        setMazaProgress(progressValue);
        if (id) updateSubmission(id, { maza_progress: Math.round(progressValue) });
      }
    });
  }, [user, id]);

  const ctaKey: 'finish_maza' | 'start_course' | 'consultation' | 'direct' = useMemo(() => {
    if (!result) return 'start_course';
    if (mazaProgress !== null && mazaProgress < 90) return 'finish_maza';
    if (result.readiness >= 70 && result.recommended.match >= 75) return 'direct';
    if (result.readiness >= 55) return 'consultation';
    return 'start_course';
  }, [result, mazaProgress]);

  useEffect(() => {
    if (id && result) updateSubmission(id, { cta_shown: ctaKey });
  }, [id, result, ctaKey]);

  if (loading) {
    return (
      <DiagnosticShell compact>
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="h-px bg-border overflow-hidden"><div className="h-full w-1/2 bg-primary animate-pulse" /></div>
          <p className="mt-4 text-sm text-muted-foreground">نتیجه ذخیره‌شده در حال بازشدنه...</p>
        </div>
      </DiagnosticShell>
    );
  }

  if (!row || !result) {
    return (
      <DiagnosticShell compact>
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <p className="text-muted-foreground">نتیجه‌ای پیدا نشد.</p>
          <Button onClick={() => navigate('/smart-test-v2')}>شروع تست</Button>
        </div>
      </DiagnosticShell>
    );
  }

  const path = ((ai?.recommended_path as PathId) || result.recommended.path) as PathId;
  const secondary = ((ai?.secondary_path as PathId) || result.alternative.path) as PathId;
  const roadmap = ROADMAPS[path];
  const actions = pathActions[path];
  const profileCopy = profileNarrative(result.profile);
  const proof = content[`result_proof_${path}`];
  const hasProof = proof?.media?.some((item) => (item.kind === 'text' ? item.caption : item.url || item.urls?.length));
  const showOffer = ctaKey === 'direct' || ai?.recommended_next_action === 'boundless';
  const preferredName = typeof row.answers?.meta_name === 'string' ? row.answers.meta_name : '';

  const clickCta = (label: string, to: string) => {
    if (id) updateSubmission(id, { cta_clicked: label, cta_clicked_at: new Date().toISOString() });
    trackEvent(id || null, 'cta_click', ctaKey, { label });
    if (to.startsWith('http')) window.open(to, '_blank');
    else navigate(to);
  };

  const requestConsultation = async () => {
    if (id) await updateSubmission(id, { cta_clicked: 'consultation', cta_clicked_at: new Date().toISOString() });
    trackEvent(id || null, 'consultation_request', ctaKey);
    toast.success('نتیجه تستت همراه درخواست برای مشاور بدون مرز ارسال شد.');
    navigate('/consultations');
  };

  return (
    <DiagnosticShell compact>
      <div dir="rtl" className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        {/* diagnosis first */}
        <section className="pt-10 pb-8 border-b border-border space-y-5">
           <Label>{preferredName ? `${preferredName}، تشخیص نهایی تو` : 'تشخیص نهایی تو'}</Label>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black leading-tight" dir="ltr">{PATH_LABELS[path]}</h1>
            <p className="text-base text-muted-foreground">{PATH_FA[path]}</p>
          </div>

          {aiState === 'loading' && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="flex items-center gap-2 text-sm font-bold text-primary"><Loader2 className="w-4 h-4 animate-spin" /> در حال نوشتن تشخیص شخصی تو...</p>
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
              <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
            </div>
          )}

          {aiState === 'ready' && ai && (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 sm:p-6 space-y-3">
               <p className="flex items-center gap-2 text-xs font-bold text-primary"><BrainCircuit className="w-4 h-4" /> تشخیص اختصاصی بر اساس جواب‌های تو</p>
              <p className="text-base sm:text-lg font-semibold leading-8 whitespace-pre-line">{ai.diagnosis}</p>
              {ai.hybrid_label && <p className="text-sm text-muted-foreground">ترکیب پیشنهادی: {ai.hybrid_label}</p>}
            </div>
          )}

          {aiState === 'failed' && (
            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
              <p className="flex items-center gap-2 text-sm font-bold"><TriangleAlert className="w-4 h-4 text-destructive" /> نتیجه اولیه (بر اساس امتیازدهی، بدون تحلیل هوش مصنوعی)</p>
              <p className="text-base leading-8">{pathReasonLine(path, result.profile)}</p>
              <p className="text-xs text-muted-foreground">پاسخ‌های تو کامل ذخیره شده؛ فقط تحلیل شخصی ساخته نشد.</p>
              <Button size="sm" variant="outline" onClick={requestDiagnosis}><RotateCcw className="w-3.5 h-3.5 ml-1" /> ساخت دوباره تحلیل</Button>
            </div>
          )}
        </section>

        {/* why this path */}
        <Section>
          <Label>چرا این مسیر؟</Label>
          <div className="space-y-3">
            {(ai?.why_this_path?.length
              ? ai.why_this_path.map((item) => ({ text: item.point, evidence: item.evidence }))
              : result.reasonsForRecommended.map((item) => ({ text: item.reason, evidence: [] as string[] }))
            ).map((item, index) => (
              <div key={`${item.text}-${index}`} className="flex gap-3 rounded-xl border border-border p-4">
                <span className="w-6 h-6 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>
                <div className="space-y-1.5">
                  <p className="text-sm sm:text-base leading-8">{item.text}</p>
                  {item.evidence?.length > 0 && <p className="text-xs text-muted-foreground">از جواب تو: {item.evidence.join('، ')}</p>}
                </div>
              </div>
            ))}
          </div>
          {ai?.why_not_secondary_yet && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-bold text-muted-foreground mb-1.5">چرا {PATH_LABELS[secondary]} دوم شد؟</p>
              <p className="text-sm leading-8">{ai.why_not_secondary_yet}</p>
            </div>
          )}
        </Section>

        {ai?.path_comparison && ai.path_comparison.length > 0 && (
          <Section>
            <div className="flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /><Label>مقایسه‌ای که تصمیم را روشن کرد</Label></div>
            <div className="divide-y divide-border border-y border-border">
              {ai.path_comparison.map((item) => (
                <div key={item.path} className="py-5 grid sm:grid-cols-[150px_1fr] gap-3">
                  <p className="font-black" dir="ltr">{PATH_LABELS[item.path]}</p>
                  <div className="space-y-2 text-sm leading-7"><p><b>تناسب:</b> {item.fit}</p><p className="text-muted-foreground"><b>اصطکاک:</b> {item.friction}</p></div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* long-term vs starting point */}
        {ai && (ai.long_term_fit !== ai.best_starting_path) && (
          <Section>
            <Label>نقطه شروع در برابر مسیر بلندمدت</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">بهترین نقطه شروع امروز</p>
                <p className="text-lg font-black mt-1" dir="ltr">{PATH_LABELS[ai.best_starting_path as PathId]}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">بهترین مسیر بلندمدت تو</p>
                <p className="text-lg font-black mt-1" dir="ltr">{PATH_LABELS[ai.long_term_fit as PathId]}</p>
              </div>
            </div>
          </Section>
        )}

        {/* advantage & risk */}
        <Section>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>بزرگ‌ترین برگ برنده تو</Label>
              <p className="font-black">{ai?.biggest_advantage?.title || profileCopy.title}</p>
              <p className="text-sm text-muted-foreground leading-8">{ai?.biggest_advantage?.explanation || profileCopy.description}</p>
            </div>
            <div className="space-y-2">
              <Label tone="danger">بزرگ‌ترین ریسک تو</Label>
              <p className="font-black flex items-center gap-2"><CircleAlert className="w-4 h-4 text-destructive" />{ai?.biggest_risk?.title || 'پریدن از مسیری به مسیر دیگر'}</p>
              <p className="text-sm text-muted-foreground leading-8">{ai?.biggest_risk?.explanation || result.weakness || riskCorrection(result.weakness)}</p>
            </div>
          </div>
        </Section>

        {/* contradictions + objection response */}
        {((ai?.contradictions?.length || 0) > 0 || result.contradictions.length > 0) && (
          <Section>
            <Label>یه چیزی رو رک بگم</Label>
            {(ai?.contradictions?.length
              ? ai.contradictions.map((item) => ({ title: item.title, text: item.explanation }))
              : result.contradictions.map((item) => ({ title: '', text: item.text }))
            ).map((item, index) => (
              <div key={index} className="border-r-2 border-foreground pr-4 space-y-1">
                {item.title && <p className="font-black text-sm">{item.title}</p>}
                <p className="text-sm sm:text-base leading-8">{item.text}</p>
              </div>
            ))}
          </Section>
        )}

        {ai?.objection_response && (
          <Section>
            <Label>درباره چیزی که جلوت رو گرفته</Label>
            <p className="text-sm sm:text-base leading-8 whitespace-pre-line">{ai.objection_response}</p>
          </Section>
        )}

        {/* 30 days */}
        {ai?.execution_gaps && ai.execution_gaps.length > 0 && (
          <Section>
            <Label>فاصله تو تا اجرا</Label>
            <h2 className="text-xl sm:text-2xl font-black leading-9">قبل از ابزار، این شکاف‌ها باید بسته بشن.</h2>
            <div className="space-y-4">
              {ai.execution_gaps.map((gap, index) => (
                <div key={`${gap.area}-${index}`} className="grid grid-cols-[32px_1fr] gap-3">
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-black">{index + 1}</span>
                  <div><p className="font-black text-sm">{gap.area}</p><p className="text-sm text-muted-foreground leading-7">{gap.gap}</p><p className="text-sm leading-7 mt-1"><b>حرکت بعدی:</b> {gap.next_step}</p></div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 30 days */}
        <Section>
          <Label>۳۰ روز اول</Label>
          <p className="text-sm text-muted-foreground">هدف این ۳۰ روز: {roadmap.goal}</p>
          <ol className="divide-y divide-border rounded-xl border border-border">
            {(ai?.first_30_days?.length ? ai.first_30_days : actions).map((item, index) => (
              <li key={`${item.title}-${index}`} className="grid grid-cols-[38px_1fr] gap-3 p-4">
                <span className="text-xl font-black text-primary/40">۰{index + 1}</span>
                <div>
                  <p className="text-xs font-bold text-primary">{item.title}</p>
                  <p className="text-sm font-semibold leading-7 mt-1">{item.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.output}</p>
                </div>
              </li>
            ))}
          </ol>
          {ai?.first_90_days_direction && (
            <p className="text-sm text-muted-foreground leading-8"><b className="text-foreground">بعد از ۳۰ روز: </b>{ai.first_90_days_direction}</p>
          )}
          {ai?.readiness_interpretation && <p className="text-sm text-muted-foreground leading-8">{ai.readiness_interpretation}</p>}
        </Section>

        {/* alternative / not now */}
        <Section>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>مسیر دوم تو</Label>
              <p className="text-xl font-black" dir="ltr">{PATH_LABELS[secondary]}</p>
              <p className="text-sm text-muted-foreground leading-8">{alternativeNote(row.answers, secondary)}</p>
            </div>
            {result.notNow && (
              <div className="space-y-2">
                <Label tone="muted">فعلاً سراغ چی نری؟</Label>
                <p className="text-xl font-black text-muted-foreground" dir="ltr">{PATH_LABELS[result.notNow.path]}</p>
                <p className="text-sm text-muted-foreground leading-8">{notNowNote(row.answers, result.notNow.path)}</p>
              </div>
            )}
          </div>
        </Section>

        {/* boundless bridge */}
        <Section>
          <Label>از اینجا به بعد</Label>
          <h2 className="text-xl sm:text-2xl font-black leading-9">مسیر به‌تنهایی پول نمی‌سازه؛ اجرا می‌سازه.</h2>
          <BlockCard block={content.boundless_bridge || DEFAULT_CONTENT.boundless_bridge} />
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-primary mb-3">مسیر تو داخل بدون مرز</p>
            {roadmap.journey.map((item, index) => (
              <div key={item} className="flex items-center gap-3 py-2">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-black">{index + 1}</span>
                <span className="text-sm font-bold">{item}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
               {(ai?.personalized_stack?.length ? ai.personalized_stack.map((tool) => tool.name) : roadmap.tools).map((tool) => <span key={tool} className="px-2.5 py-1.5 bg-muted text-xs font-bold rounded-md">{tool}</span>)}
            </div>
          </div>
           {ai?.personalized_stack && ai.personalized_stack.length > 0 && (
             <div className="space-y-3">
               <p className="flex items-center gap-2 text-xs font-bold text-primary"><Wrench className="w-4 h-4" />چرا این منابع برای تو انتخاب شدن؟</p>
               {ai.personalized_stack.map((tool) => <p key={tool.name} className="text-sm leading-7"><b>{tool.name}:</b> <span className="text-muted-foreground">{tool.purpose}</span></p>)}
             </div>
           )}
        </Section>

        {hasProof && <Section><BlockCard block={proof} /></Section>}

        {/* next step */}
        <Section>
          <div className="flex items-center gap-2"><Compass className="w-5 h-5 text-primary" /><Label>قدم بعدی تو</Label></div>
          {ai?.personalized_next_step && <p className="text-base sm:text-lg font-semibold leading-8">{ai.personalized_next_step}</p>}
          <div className="space-y-3 pt-1">
            {ctaKey === 'finish_maza' && (
              <>
                <p className="text-sm text-muted-foreground leading-8">تو {Math.round(mazaProgress || 0)}٪ مزه بدون مرز رو دیدی. حالا که می‌دونی مسیر پیشنهادیت {PATH_LABELS[path]}ـه، ادامه‌ش رو با نگاه متفاوت ببین.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="h-12" onClick={() => clickCta('ادامه مزه بدون مرز', '/app/courses')}>ادامه مزه بدون مرز <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                  <Button variant="ghost" size="lg" className="h-12" onClick={() => clickCta('مشاهده بدون مرز', '/courses/boundless-taste')}>آماده‌ام مسیر بعدی رو ببینم</Button>
                </div>
              </>
            )}
            {ctaKey === 'start_course' && (
              <>
                <p className="text-sm text-muted-foreground leading-8">قدم بعدی لازم نیست بزرگ باشه. با یک شروع کم‌ریسک، {PATH_LABELS[path]} رو در عمل امتحان کن.</p>
                <Button size="lg" className="h-12" onClick={() => clickCta('شروع مسیر', '/start')}>شروع مسیر <ArrowLeft className="w-4 h-4 mr-2" /></Button>
              </>
            )}
            {ctaKey === 'consultation' && (
              <>
                <p className="text-sm text-muted-foreground leading-8">نتیجه کامل تست به‌صورت خودکار همراه درخواست برای مشاور ارسال می‌شه؛ لازم نیست دوباره توضیح بدی.</p>
                <Button size="lg" className="h-12" onClick={requestConsultation}>نتیجه‌م رو برای مشاور بفرست <Send className="w-4 h-4 mr-2" /></Button>
              </>
            )}
            {ctaKey === 'direct' && (
              <>
                <p className="text-sm text-muted-foreground leading-8">اگر این تشخیص با چیزی که از خودت می‌شناسی هم‌خوانه، قدم بعدی دیدن مسیر {PATH_LABELS[path]} داخل بدون مرزه.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="h-12" onClick={() => clickCta('مسیر من داخل بدون مرز', '/courses/boundless-taste')}>مسیر من داخل بدون مرز <ArrowLeft className="w-4 h-4 mr-2" /></Button>
                  <Button variant="ghost" size="lg" className="h-12" onClick={requestConsultation}>اول با مشاور صحبت می‌کنم</Button>
                </div>
              </>
            )}
          </div>
          {showOffer && <BoundlessOffer submissionId={id || null} onOpenCourse={() => clickCta('دوره بدون مرز با تخفیف', '/courses/boundless-taste')} />}
        </Section>

        {/* collapsible metrics */}
        <details className="group py-6 border-b border-border">
          <summary className="cursor-pointer flex items-center justify-between font-black text-sm">جزئیات عددی تحلیل <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" /></summary>
          <div className="pt-6 grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-6">
                <div><p className="text-xs text-muted-foreground">Match</p><p className="text-2xl font-black text-primary">{result.recommended.match}٪</p></div>
                <div><p className="text-xs text-muted-foreground">آمادگی اجرا</p><p className="text-2xl font-black">{result.readiness}٪</p></div>
                <div><p className="text-xs text-muted-foreground">اطمینان</p><p className="text-lg font-black">{ai?.confidence ? ({ high: 'بالا', medium: 'متوسط', low: 'پایین' } as any)[ai.confidence] : result.confidenceFa}</p></div>
              </div>
              <p className="text-xs leading-7 text-muted-foreground flex gap-2"><ShieldCheck className="w-4 h-4 shrink-0" />Match فقط میزان تطابق پاسخ‌های تو با ویژگی‌های مسیره؛ تضمین نتیجه یا درآمد نیست.</p>
            </div>
            <div>
              <h3 className="font-black">{profileCopy.title}</h3>
              <div className="space-y-3 mt-4">
                {DIMENSIONS.map(([label, key]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs"><span>{label}</span><span>{result.profile[key]}</span></div>
                    <div className="h-1 bg-muted mt-1.5"><div className="h-full bg-primary" style={{ width: `${result.profile[key]}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        <Button variant="ghost" className="mt-5" onClick={() => navigate('/smart-test-v2')}>
          <ArrowRight className="w-4 h-4 ml-2" /> شروع یک تحلیل تازه
        </Button>
      </div>
    </DiagnosticShell>
  );
};

export default SmartTestV2Result;

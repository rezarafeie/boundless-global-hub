import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw, ShoppingCart, Sparkles, Loader2 } from 'lucide-react';
import { SmartTestField } from './SmartTestField';
import { detectOutcome, splitPages, validatePage, visibleFields } from '@/lib/smartTestEngine';
import { getForm, resolveTrackId, MAIN_FIELDS, NOTE_FIELD_ID, REJECT_RADIO_VALUES } from '@/data/boundlessSmartTest';
import type { Answers, SmartForm } from '@/data/boundlessSmartTest/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TetherlandService } from '@/lib/tetherlandService';

type Phase = 'main' | 'track' | 'ai';

export const SmartTestRunner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('main');
  const [pageIdx, setPageIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [finalOutcome, setFinalOutcome] = useState<'passed' | 'rejected' | null>(null);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Autofill from logged in user
  useEffect(() => {
    if (!user) return;
    setAnswers((prev) => {
      const next = { ...prev };
      const firstName = (user as any).firstName || (user as any).first_name || ((user as any).name?.split(' ')[0]);
      const lastName = (user as any).lastName || (user as any).last_name || ((user as any).name?.split(' ').slice(1).join(' '));
      if (firstName && !next['1']) next['1'] = firstName;
      if (lastName && !next['46']) next['46'] = lastName;
      if ((user as any).phone && !next['42']) next['42'] = (user as any).phone;
      if ((user as any).email && !next['52']) next['52'] = (user as any).email;
      return next;
    });
  }, [user]);

  // Fetch USD rate once
  useEffect(() => {
    TetherlandService.getUSDTToIRRRate().then(setUsdRate).catch((e) => {
      console.warn('USD rate fetch failed', e);
    });
  }, []);

  const trackId = useMemo(() => resolveTrackId(answers), [answers]);
  const currentForm: SmartForm | null = useMemo(() => {
    if (phase === 'main') return getForm('main');
    if (phase === 'track' && trackId) return getForm(trackId);
    return null;
  }, [phase, trackId]);

  const pages = useMemo(() => (currentForm ? splitPages(currentForm) : []), [currentForm]);
  const totalPages = pages.length;
  const safePageIdx = Math.min(pageIdx, Math.max(totalPages - 1, 0));
  const currentPage = pages[safePageIdx] || [];
  const visible = visibleFields(currentPage, answers);
  const isLastPage = safePageIdx === totalPages - 1;

  // Detect outcome on last page of track
  useEffect(() => {
    if (phase === 'track' && isLastPage) {
      const o = detectOutcome(currentPage, answers);
      if (o && o !== finalOutcome) {
        setFinalOutcome(o);
        void persistOutcome(o);
      }
    }
  }, [phase, isLastPage, answers, currentPage]);

  // Check if current page contains rejection HTML — hide next button on those pages
  const isRejectionPage = useMemo(() => {
    return visible.some(
      (f) => f.kind === 'html' && (f.html.includes('متاسفانه') || f.html.includes('واجد شرایط نیستید') || f.html.includes('جلوتر نمیتونیم بریم')),
    );
  }, [visible]);

  // Check if a selected radio value triggers a reject (hide next)
  const radioRejected = useMemo(() => {
    for (const f of visible) {
      if (f.kind === 'radio') {
        const v = answers[f.id];
        if (!v) continue;
        const rejects = REJECT_RADIO_VALUES[f.id];
        if (rejects && rejects.some((r) => v.includes(r))) return true;
      }
    }
    return false;
  }, [visible, answers]);

  const handleChange = (id: string, v: string) => {
    setAnswers((p) => ({ ...p, [id]: v }));
  };

  const persistOutcome = async (outcome: 'passed' | 'rejected') => {
    try {
      const payload = {
        full_name: [answers['1'], answers['46']].filter(Boolean).join(' ').trim() || null,
        phone: answers['42'] || null,
        email: answers['52'] || null,
        interest: answers[MAIN_FIELDS.INTEREST] || null,
        mindset: answers[MAIN_FIELDS.MINDSET] || null,
        track_id: trackId,
        outcome,
        answers,
      };
      if (submissionId) {
        await supabase.from('boundless_smart_test_submissions').update(payload).eq('id', submissionId);
      } else {
        const { data } = await supabase
          .from('boundless_smart_test_submissions')
          .insert(payload)
          .select('id')
          .single();
        if (data?.id) setSubmissionId(data.id);
      }
    } catch (e) {
      console.error('persist outcome failed', e);
    }
  };

  const persistProgress = async () => {
    if (submissionId) return;
    try {
      const { data } = await supabase
        .from('boundless_smart_test_submissions')
        .insert({
          full_name: [answers['1'], answers['46']].filter(Boolean).join(' ').trim() || null,
          phone: answers['42'] || null,
          email: answers['52'] || null,
          interest: answers[MAIN_FIELDS.INTEREST] || null,
          mindset: answers[MAIN_FIELDS.MINDSET] || null,
          outcome: 'in_progress',
          answers,
        })
        .select('id')
        .single();
      if (data?.id) setSubmissionId(data.id);
    } catch (e) {
      console.error('persist progress failed', e);
    }
  };

  const runAiInterpretation = async (outcome: 'passed' | 'rejected') => {
    setPhase('ai');
    setAiLoading(true);
    setAiMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-boundless-test', {
        body: {
          answers,
          outcome,
          trackId,
          fullName: [answers['1'], answers['46']].filter(Boolean).join(' '),
          note: answers[NOTE_FIELD_ID] || '',
        },
      });
      if (error) throw error;
      if ((data as any)?.message) setAiMessage((data as any).message);
      else if ((data as any)?.error === 'credits_exhausted') {
        toast.error('اعتبار هوش مصنوعی به پایان رسیده است.');
      } else if ((data as any)?.error === 'rate_limit') {
        toast.error('لطفاً چند لحظه دیگر دوباره تلاش کنید.');
      }
    } catch (e) {
      console.error('AI analysis failed', e);
      toast.error('دریافت تفسیر هوشمند با خطا مواجه شد.');
    } finally {
      setAiLoading(false);
    }
  };

  const next = async () => {
    const invalid = validatePage(currentPage, answers);
    if (invalid) {
      toast.error('لطفاً پاسخ این سؤال را کامل کنید');
      const el = document.getElementById(invalid);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!isLastPage) {
      setPageIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (phase === 'main') {
      const tid = resolveTrackId(answers);
      if (!tid) {
        toast.error('برای ادامه لطفاً پاسخ‌های اصلی را تکمیل کنید');
        return;
      }
      await persistProgress();
      setPhase('track');
      setPageIdx(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Last page of track: trigger AI interpretation
    if (phase === 'track' && finalOutcome) {
      await runAiInterpretation(finalOutcome);
    }
  };

  const back = () => {
    if (phase === 'ai') {
      setPhase('track');
      setPageIdx(pages.length - 1);
      return;
    }
    if (pageIdx > 0) {
      setPageIdx((i) => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (phase === 'track') {
      setPhase('main');
      const mainPages = splitPages(getForm('main')!);
      setPageIdx(mainPages.length - 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setPhase('main');
    setPageIdx(0);
    setSubmissionId(null);
    setFinalOutcome(null);
    setAiMessage('');
  };

  if (!currentForm && phase !== 'ai') return null;

  // Estimated progress
  const mainPagesCount = getForm('main') ? splitPages(getForm('main')!).length : 9;
  const trackPagesCount = trackId && getForm(trackId) ? splitPages(getForm(trackId)!).length : 12;
  const totalEstimated = mainPagesCount + trackPagesCount + 1;
  const completed =
    phase === 'main'
      ? safePageIdx
      : phase === 'track'
      ? mainPagesCount + safePageIdx
      : totalEstimated;
  const progressPct = Math.min(100, Math.round((completed / totalEstimated) * 100));

  const userName = answers['1'];

  // ---- AI Result Phase ----
  if (phase === 'ai') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10" dir="rtl">
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>تفسیر نتیجه</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-1.5" />
        </div>
        <Card className="border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="space-y-6 text-right">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">تفسیر شخصی‌سازی شده تست شما</h3>
            </div>
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">در حال تحلیل پاسخ‌های شما...</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-base leading-loose text-foreground">
                {aiMessage || 'تفسیر در دسترس نیست.'}
              </div>
            )}
            {!aiLoading && (
              <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-center">
                {finalOutcome === 'passed' ? (
                  <Button size="lg" onClick={() => navigate('/enroll/?course=boundless')}>
                    <ShoppingCart className="ml-2 h-4 w-4" />
                    ثبت‌نام در دوره بدون مرز
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" onClick={restart}>
                    <RotateCcw className="ml-2 h-4 w-4" />
                    شروع مجدد تست
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Per-step "next" button label
  const nextLabel = (() => {
    if (phase === 'main' && isLastPage) return 'شروع تفسیر';
    if (phase === 'track' && pageIdx === 0) return 'آماده ام';
    if (phase === 'track' && isLastPage && finalOutcome) return 'دریافت تفسیر هوشمند';
    return 'بعدی';
  })();

  const hideNext = isRejectionPage || radioRejected;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10" dir="rtl">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{currentForm!.title}</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      <Card className="border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="space-y-6">
          {visible.map((f) => (
            <div key={f.id} id={f.id}>
              <SmartTestField
                field={f}
                value={answers[f.id] || ''}
                onChange={handleChange}
                userName={userName}
                usdRate={usdRate}
              />
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">برای ادامه روی دکمه پایین بزنید.</p>
          )}
        </div>

        {hideNext && (
          <div className="mt-8 border-t border-border pt-6 text-center">
            <Button variant="outline" size="lg" onClick={restart}>
              <RotateCcw className="ml-2 h-4 w-4" />
              شروع مجدد تست
            </Button>
          </div>
        )}
      </Card>

      {!hideNext && (
        <div className="mt-6 flex items-center justify-between gap-3" dir="rtl">
          <Button variant="ghost" onClick={back} disabled={phase === 'main' && pageIdx === 0}>
            <ArrowRight className="ml-1 h-4 w-4" />
            قبلی
          </Button>
          <Button onClick={next}>
            {nextLabel}
            <ArrowLeft className="mr-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartTestRunner;

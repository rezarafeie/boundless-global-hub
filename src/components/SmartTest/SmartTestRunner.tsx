import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw, ShoppingCart } from 'lucide-react';
import { SmartTestField } from './SmartTestField';
import { detectOutcome, splitPages, validatePage, visibleFields } from '@/lib/smartTestEngine';
import { getForm, resolveTrackId, MAIN_FIELDS } from '@/data/boundlessSmartTest';
import type { Answers, SmartForm } from '@/data/boundlessSmartTest/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Phase = 'main' | 'track' | 'finished';

export const SmartTestRunner: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('main');
  const [pageIdx, setPageIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [finalOutcome, setFinalOutcome] = useState<'passed' | 'rejected' | null>(null);

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

  // Detect outcome whenever on last page of track
  useEffect(() => {
    if (phase === 'track' && isLastPage) {
      const o = detectOutcome(currentPage, answers);
      if (o && o !== finalOutcome) {
        setFinalOutcome(o);
        void persistOutcome(o);
      }
    }
  }, [phase, isLastPage, answers, currentPage]);

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
        await supabase
          .from('boundless_smart_test_submissions')
          .update(payload)
          .eq('id', submissionId);
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
    if (submissionId) return; // only initial save needed before outcome
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
    }
    // last page of track: outcome already shown inline; user uses CTA buttons
  };

  const back = () => {
    if (pageIdx > 0) {
      setPageIdx((i) => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (phase === 'track') {
      setPhase('main');
      setPageIdx(pages.length ? 0 : 0);
    }
  };

  const restart = () => {
    setAnswers({});
    setPhase('main');
    setPageIdx(0);
    setSubmissionId(null);
    setFinalOutcome(null);
  };

  if (!currentForm) return null;

  // Overall progress: main pages + track pages (estimate)
  const totalEstimated = (getForm('main')?.fields.filter((f) => f.kind === 'page').length || 0) + 1 +
    (trackId ? (getForm(trackId)?.fields.filter((f) => f.kind === 'page').length || 0) + 1 : 8);
  const completed = (phase === 'main' ? safePageIdx : (getForm('main')?.fields.filter((f) => f.kind === 'page').length || 0) + 1 + safePageIdx);
  const progressPct = Math.min(100, Math.round((completed / totalEstimated) * 100));

  const userName = answers['1'];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10" dir="rtl">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{currentForm.title}</span>
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
              />
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">برای ادامه روی دکمه پایین بزنید.</p>
          )}
        </div>

        {/* Outcome CTA on last page of track */}
        {phase === 'track' && isLastPage && finalOutcome && (
          <div className="mt-8 border-t border-border pt-6">
            {finalOutcome === 'passed' ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-base font-semibold">آماده‌اید مسیر بدون مرز رو شروع کنید 🎉</p>
                <Button
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={() => navigate('/enroll/?course=boundless')}
                >
                  <ShoppingCart className="ml-2 h-4 w-4" />
                  ثبت‌نام در دوره بدون مرز
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <XCircle className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">می‌توانید با اصلاح پاسخ‌ها دوباره تلاش کنید.</p>
                <Button variant="outline" size="lg" onClick={restart}>
                  <RotateCcw className="ml-2 h-4 w-4" />
                  شروع مجدد تست
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Nav */}
      {!(phase === 'track' && isLastPage && finalOutcome) && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={back}
            disabled={phase === 'main' && pageIdx === 0}
          >
            <ArrowRight className="ml-1 h-4 w-4" />
            قبلی
          </Button>
          <Button onClick={next}>
            {phase === 'main' && isLastPage ? 'مشاهده نتیجه' : 'بعدی'}
            <ArrowLeft className="mr-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartTestRunner;

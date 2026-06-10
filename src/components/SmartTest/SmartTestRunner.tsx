import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, RotateCcw, ShoppingCart, Sparkles, Loader2, CheckCircle2, PartyPopper, Trophy } from 'lucide-react';
import { SmartTestField } from './SmartTestField';
import { computeFinalOutcome, splitPages, validatePage, visibleFields } from '@/lib/smartTestEngine';
import {
  getForm,
  resolveTrackId,
  MAIN_FIELDS,
  NOTE_FIELD_ID,
  REJECT_RADIO_VALUES,
  BACK_ONLY_RADIO_VALUES,
} from '@/data/boundlessSmartTest';
import type { Answers, SmartForm } from '@/data/boundlessSmartTest/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TetherlandService } from '@/lib/tetherlandService';

type Phase = 'main' | 'track' | 'ai';

const SUPABASE_URL = 'https://ihhetvwuhqohbfgkqoxw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI';

// Strip markdown markers and clean text
const cleanMarkdown = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .trim();

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
  const [errors, setErrors] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    TetherlandService.getUSDTToIRRRate().then(setUsdRate).catch(() => {});
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

  // Reject-page = restart only (HTML reject markers OR radio-reject answered)
  const isRejectionPage = useMemo(() => {
    const htmlReject = visible.some(
      (f) =>
        f.kind === 'html' &&
        (f.html.includes('متاسفانه') ||
          f.html.includes('واجد شرایط نیستید') ||
          f.html.includes('جلوتر نمیتونیم بریم')),
    );
    if (htmlReject) return true;
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

  // Back-only page: only previous button is shown
  const isBackOnlyPage = useMemo(() => {
    for (const f of visible) {
      if (f.kind === 'radio') {
        const v = answers[f.id];
        if (!v) continue;
        const backs = BACK_ONLY_RADIO_VALUES[f.id];
        if (backs && backs.some((r) => v.includes(r))) return true;
      }
    }
    return false;
  }, [visible, answers]);

  const handleChange = (id: string, v: string) => {
    setAnswers((p) => ({ ...p, [id]: v }));
    setErrors((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  const streamAi = async (outcome: 'passed' | 'rejected') => {
    setPhase('ai');
    setAiLoading(true);
    setAiMessage('');
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-boundless-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          answers,
          outcome,
          trackId,
          fullName: [answers['1'], answers['46']].filter(Boolean).join(' '),
          note: answers[NOTE_FIELD_ID] || '',
          stream: true,
        }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error('لطفاً چند لحظه دیگر دوباره تلاش کنید.');
        else if (resp.status === 402) toast.error('اعتبار هوش مصنوعی به پایان رسیده است.');
        else toast.error('دریافت تفسیر هوشمند با خطا مواجه شد.');
        setAiLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      setAiLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const data = t.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              acc += delta;
              setAiMessage(cleanMarkdown(acc));
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('stream failed', e);
      toast.error('دریافت تفسیر هوشمند با خطا مواجه شد.');
      setAiLoading(false);
    }
  };

  const next = async () => {
    const invalid = validatePage(currentPage, answers);
    if (invalid.length > 0) {
      setErrors(new Set(invalid));
      const el = document.getElementById(invalid[0]);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors(new Set());
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
    // Last page of track: compute outcome and stream AI
    const outcome = computeFinalOutcome(answers) || 'passed';
    setFinalOutcome(outcome);
    await persistOutcome(outcome);
    await streamAi(outcome);
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
    setErrors(new Set());
  };

  if (!currentForm && phase !== 'ai') return null;

  const userName = answers['1'];

  // ---- AI Result Phase ----
  if (phase === 'ai') {
    const passed = finalOutcome === 'passed';
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12" dir="rtl">
        {passed ? (
          <div className="mb-8 text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                <Trophy className="h-10 w-10" />
              </div>
            </div>
            <h2 className="mt-5 text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              تبریک! مجوز ورود به بدون مرز
            </h2>
            <p className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <PartyPopper className="h-4 w-4 text-emerald-500" />
              تو واجد شرایط ادامه مسیر هستی
              <PartyPopper className="h-4 w-4 text-emerald-500" />
            </p>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">نتیجه تست شما</h2>
          </div>
        )}

        <div className="space-y-5 text-right">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">تفسیر شخصی‌سازی شده</span>
          </div>

          {aiLoading && !aiMessage ? (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">در حال نوشتن تفسیر شما...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-[15px] leading-loose text-foreground">
              {aiMessage}
              {aiMessage && !finalOutcome ? null : null}
            </div>
          )}

          {passed && aiMessage && (
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 md:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-500" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">قدم بعدی: شروع رسمی پروژه بدون مرز</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    با ثبت‌نام در دوره، بلافاصله به آموزش‌ها، پشتیبانی اختصاصی و جامعه بدون مرز دسترسی پیدا می‌کنی.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/enroll/?course=boundless')}
                className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
              >
                <ShoppingCart className="ml-2 h-5 w-5" />
                همین الان شروع کن
              </Button>
            </div>
          )}

          {!passed && aiMessage && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={restart}>
                <RotateCcw className="ml-2 h-4 w-4" />
                شروع مجدد تست
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Per-step "next" button label
  const nextLabel = (() => {
    if (phase === 'main' && isLastPage) return 'شروع تفسیر';
    if (phase === 'track' && pageIdx === 0) return 'آماده ام';
    if (phase === 'track' && (pageIdx === 4 || pageIdx === 5)) return 'خب!';
    if (phase === 'track' && isLastPage) return 'دریافت تفسیر هوشمند';
    return 'بعدی';
  })();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10" dir="rtl">
      <div className="space-y-6">
        {visible.map((f) => (
          <div key={f.id} id={f.id}>
            <SmartTestField
              field={f}
              value={answers[f.id] || ''}
              onChange={handleChange}
              userName={userName}
              usdRate={usdRate}
              error={errors.has(f.id)}
            />
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">برای ادامه روی دکمه پایین بزنید.</p>
        )}
      </div>

      {isRejectionPage ? (
        <div className="mt-8 border-t border-border pt-6 text-center">
          <Button variant="outline" size="lg" onClick={restart}>
            <RotateCcw className="ml-2 h-4 w-4" />
            شروع مجدد تست
          </Button>
        </div>
      ) : isBackOnlyPage ? (
        <div className="mt-8 flex justify-start">
          <Button variant="ghost" onClick={back}>
            <ArrowRight className="ml-1 h-4 w-4" />
            قبلی
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex items-center justify-between gap-3" dir="rtl">
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

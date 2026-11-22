import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  LifeBuoy,
  Sparkles,
  Send,
  Rocket,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  courseId: string;
  courseTitle?: string;
  supportLink?: string | null;
  /** If true, the wizard is required to complete (no skip on telegram step). */
  required?: boolean;
  /** Path to navigate to after wizard finishes (default: /app). */
  finishPath?: string;
}

type Step = 'intro' | 'connect' | 'support' | 'done';

const stepOrder: Step[] = ['intro', 'connect', 'support', 'done'];

/**
 * Modern multi-step "installation"-style wizard to onboard a user into
 * the Telegram personal AI coach AND activate support in one flow.
 */
export function TelegramCoachWizard({
  open,
  onClose,
  enrollmentId,
  courseId,
  courseTitle,
  supportLink,
  required = false,
  finishPath = '/app/my-courses',
}: Props) {
  const [step, setStep] = useState<Step>('intro');
  const [botUsername, setBotUsername] = useState('rafiei_bot');
  const [linked, setLinked] = useState(false);
  const [polling, setPolling] = useState(false);
  const [supportClicked, setSupportClicked] = useState(false);
  const pollRef = useRef<number | null>(null);

  const activationKey = `activations_${enrollmentId}`;

  // Load bot username + initial linked state + saved support flag
  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from('admin_settings').select('telegram_bot_username' as any).eq('id', 1).maybeSingle(),
        supabase.from('enrollments').select('telegram_chat_id' as any).eq('id', enrollmentId).maybeSingle(),
      ]);
      const u = ((s as any)?.telegram_bot_username ?? 'rafiei_bot').replace(/^@/, '');
      setBotUsername(u);
      setLinked(!!(e as any)?.telegram_chat_id);

      try {
        const raw = localStorage.getItem(activationKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSupportClicked(!!parsed.support);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [open, enrollmentId, activationKey]);

  // Poll for telegram link while on the connect step
  useEffect(() => {
    if (!open || step !== 'connect' || linked) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
        setPolling(false);
      }
      return;
    }
    setPolling(true);
    pollRef.current = window.setInterval(async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('telegram_chat_id' as any)
        .eq('id', enrollmentId)
        .maybeSingle();
      if ((data as any)?.telegram_chat_id) {
        setLinked(true);
      }
    }, 3500);
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setPolling(false);
    };
  }, [open, step, linked, enrollmentId]);

  // Auto-advance from connect -> support (or done) once linked
  useEffect(() => {
    if (step === 'connect' && linked) {
      const t = setTimeout(() => {
        setStep(supportLink ? 'support' : 'done');
      }, 900);
      return () => clearTimeout(t);
    }
  }, [step, linked, supportLink]);

  const telegramUrl = useMemo(
    () => `https://t.me/${botUsername}?start=enroll_${enrollmentId}`,
    [botUsername, enrollmentId],
  );

  const markSupportActivated = () => {
    let activations = { support: false, telegram: false, smart: false };
    try {
      const raw = localStorage.getItem(activationKey);
      if (raw) activations = { ...activations, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    activations.support = true;
    localStorage.setItem(activationKey, JSON.stringify(activations));
    setSupportClicked(true);
  };

  const goNext = () => {
    const idx = stepOrder.indexOf(step);
    const next = stepOrder[Math.min(idx + 1, stepOrder.length - 1)];
    // Skip support step if no link configured
    if (next === 'support' && !supportLink) {
      setStep('done');
    } else {
      setStep(next);
    }
  };

  const handleClose = () => {
    if (required && !linked) return; // can't dismiss if required & not connected
    onClose();
  };

  const handleFinish = () => {
    onClose();
    // Navigate to academy
    if (finishPath) window.location.assign(finishPath);
  };

  const stepIndex = stepOrder.indexOf(step);
  const progress = ((stepIndex + 1) / stepOrder.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-2xl"
        onInteractOutside={(e) => required && !linked && e.preventDefault()}
        onEscapeKeyDown={(e) => required && !linked && e.preventDefault()}
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
          {/* Glow accents */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight truncate">
                    راه‌اندازی کوچ شخصی تلگرام
                  </h2>
                  <p className="text-xs text-slate-400 truncate">
                    {courseTitle ? `برای دوره ${courseTitle}` : 'ویزارد فعال‌سازی هوشمند'}
                  </p>
                </div>
              </div>
              {required && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                  اجباری
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step dots */}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              {stepOrder.map((s, i) => {
                const active = i <= stepIndex;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full transition-all ${
                        active ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]' : 'bg-white/15'
                      }`}
                    />
                    {i < stepOrder.length - 1 && <div className="h-px w-3 bg-white/10" />}
                  </div>
                );
              })}
              <span className="ms-auto">
                مرحله {stepIndex + 1} از {stepOrder.length}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="relative px-6 py-6 min-h-[260px]">
            {step === 'intro' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-xs text-cyan-300/90">
                  <Sparkles className="h-3.5 w-3.5" /> چیزی که در انتظارته
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-7 w-7 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-100">پیگیری شخصی‌شده با AI</p>
                      <p className="text-xs text-slate-400">
                        ربات بر اساس پیشرفت شما، در ساعت دلخواه پیام انگیزشی و یادآور می‌فرستد.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                      <LifeBuoy className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-100">پشتیبانی یکپارچه</p>
                      <p className="text-xs text-slate-400">
                        دسترسی سریع به پشتیبانی و جوامع آموزشی در همان فضای تلگرام.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-100">دسترسی امن به آکادمی</p>
                      <p className="text-xs text-slate-400">
                        لینک ورود به Mini App با ورود خودکار، بدون نیاز به وارد کردن مجدد رمز.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {step === 'connect' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
                  {linked ? (
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  ) : (
                    <div className="relative">
                      <Send className="h-10 w-10 text-cyan-300" />
                      {polling && (
                        <span className="absolute -inset-3 rounded-full border border-cyan-400/30 animate-ping" />
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {linked ? 'متصل شد! 🎉' : 'اتصال به ربات تلگرام'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {linked
                      ? 'حساب شما با موفقیت به کوچ شخصی متصل شد.'
                      : 'برای راه‌اندازی، روی دکمه زیر بزنید و در تلگرام Start را لمس کنید.'}
                  </p>
                </div>
                {!linked && (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white border-0 shadow-lg shadow-indigo-500/30"
                    >
                      <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                        <Send className="ml-2 h-4 w-4" />
                        باز کردن تلگرام و شروع
                      </a>
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                      {polling ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                          در حال بررسی اتصال…
                        </>
                      ) : (
                        <span>پس از Start در تلگرام، خودکار به مرحله بعد می‌رویم.</span>
                      )}
                    </div>
                  </>
                )}
                {linked && (
                  <Button onClick={goNext} size="lg" className="w-full">
                    ادامه <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                  </Button>
                )}
              </div>
            )}

            {step === 'support' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 border border-white/10 flex items-center justify-center">
                  <LifeBuoy
                    className={`h-10 w-10 ${supportClicked ? 'text-emerald-400' : 'text-cyan-300'}`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">فعال‌سازی پشتیبانی</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    برای دسترسی به پشتیبانی مستقیم، روی دکمه زیر بزنید و در تلگرام عضو شوید.
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant={supportClicked ? 'outline' : 'default'}
                  className={
                    supportClicked
                      ? 'w-full border-emerald-500/40 text-emerald-300 hover:text-emerald-200'
                      : 'w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 shadow-lg shadow-emerald-500/20'
                  }
                  onClick={markSupportActivated}
                >
                  <a href={supportLink ?? '#'} target="_blank" rel="noopener noreferrer">
                    {supportClicked ? (
                      <>
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                        باز کردن دوباره پشتیبانی
                      </>
                    ) : (
                      <>
                        <ExternalLink className="ml-2 h-4 w-4" />
                        فعال‌سازی پشتیبانی
                      </>
                    )}
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  onClick={() => setStep('done')}
                  disabled={!supportClicked}
                >
                  {supportClicked ? (
                    <>
                      ادامه <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                    </>
                  ) : (
                    'ابتدا پشتیبانی را فعال کنید'
                  )}
                </Button>
              </div>
            )}

            {step === 'done' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 border border-emerald-400/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Rocket className="h-10 w-10 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">آماده‌ای! 🚀</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    کوچ شخصی فعاله. حالا برمی‌گردیم به آکادمی تا شروع کنی.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-right">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    اتصال به ربات تلگرام
                  </div>
                  {supportLink && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      فعال‌سازی پشتیبانی
                    </div>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white border-0"
                >
                  بازگشت به آکادمی
                  <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative px-6 py-4 border-t border-white/5 flex items-center justify-between gap-2 bg-black/20">
            <div className="text-[11px] text-slate-500">
              {required && !linked ? 'برای ادامه آموزش، تکمیل ویزارد الزامی است.' : 'هر زمان می‌توانید این مراحل را تغییر دهید.'}
            </div>
            <div className="flex items-center gap-2">
              {step === 'intro' && (
                <>
                  {!required && (
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 hover:bg-white/5" onClick={handleClose}>
                      بعداً
                    </Button>
                  )}
                  <Button size="sm" onClick={goNext} className="bg-white text-slate-900 hover:bg-slate-100">
                    شروع <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                  </Button>
                </>
              )}
              {step === 'connect' && !linked && !required && (
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 hover:bg-white/5" onClick={handleClose}>
                  بعداً
                </Button>
              )}
              {step === 'support' && !supportClicked && !required && (
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 hover:bg-white/5" onClick={() => setStep('done')}>
                  رد کردن
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

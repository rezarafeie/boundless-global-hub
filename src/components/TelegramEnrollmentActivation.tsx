import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle2, Clock, MessageCircleQuestion } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { openInNewTab } from '@/lib/utils';

interface Props {
  enrollmentId?: string;
  courseId: string;
  className?: string;
  badgeWhenLinked?: boolean;
}

type SupportActivation = {
  id: string;
  status: 'not_started' | 'opened_bot' | 'clicked_support_button' | 'pending_manual_confirmation' | 'activated' | 'needs_followup' | 'failed';
  bot_deep_link: string;
  activated_at: string | null;
};

export function TelegramEnrollmentActivation({
  enrollmentId: enrollmentIdProp,
  courseId,
  className,
  badgeWhenLinked = false,
}: Props) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [trackedEnabled, setTrackedEnabled] = useState<boolean>(false);
  const [linked, setLinked] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(enrollmentIdProp ?? null);
  const [bot, setBot] = useState('rafiei_bot');
  const [activation, setActivation] = useState<SupportActivation | null>(null);

  // Load course + enrollment + settings
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase
          .from('courses')
          .select('rafiei_bot_followup_enabled, telegram_support_activation_enabled' as any)
          .eq('id', courseId)
          .maybeSingle(),
        supabase.from('admin_settings').select('telegram_bot_username' as any).eq('id', 1).maybeSingle(),
      ]);
      if (cancelled) return;
      const isEnabled = !!(c as any)?.rafiei_bot_followup_enabled;
      const tracked = !!(c as any)?.telegram_support_activation_enabled;
      setEnabled(isEnabled);
      setTrackedEnabled(tracked);
      const u = ((s as any)?.telegram_bot_username ?? 'rafiei_bot').replace(/^@/, '');
      setBot(u);
      if (!isEnabled && !tracked) return;

      let eid = enrollmentIdProp ?? null;
      if (!eid && user?.id) {
        const { data: e } = await supabase
          .from('enrollments')
          .select('id, telegram_chat_id')
          .eq('chat_user_id', parseInt(user.id))
          .eq('course_id', courseId)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        eid = (e as any)?.id ?? null;
        setLinked(!!(e as any)?.telegram_chat_id);
      } else if (eid) {
        const { data: e } = await supabase
          .from('enrollments')
          .select('telegram_chat_id' as any)
          .eq('id', eid)
          .maybeSingle();
        if (cancelled) return;
        setLinked(!!(e as any)?.telegram_chat_id);
      }
      setEnrollmentId(eid);
    })();
    return () => {
      cancelled = true;
    };
  }, [enrollmentIdProp, courseId, user?.id]);

  // Fetch activation row when tracked flow is on
  useEffect(() => {
    if (!trackedEnabled || !user?.id) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('support_activations' as any)
        .select('id, status, bot_deep_link, activated_at')
        .eq('user_id', parseInt(user.id))
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setActivation((data as any) ?? null);
    };
    load();

    const channel = supabase
      .channel(`support-act-${user.id}-${courseId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_activations',
          filter: `user_id=eq.${parseInt(user.id)}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row && row.course_id === courseId) setActivation(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [trackedEnabled, user?.id, courseId]);

  const ensureActivation = async (): Promise<string | null> => {
    if (!user?.id) return null;
    if (activation?.bot_deep_link) return activation.bot_deep_link;
    try {
      const { data, error } = await supabase.functions.invoke('support-activation-create', {
        body: {
          user_id: parseInt(user.id),
          course_id: courseId,
          enrollment_id: enrollmentId,
        },
      });
      if (error) throw error;
      const act = (data as any)?.activation;
      if (act) {
        setActivation(act);
        return act.bot_deep_link as string;
      }
    } catch (e) {
      console.error('support-activation-create failed', e);
    }
    return null;
  };

  const openBot = async () => {
    const url = await ensureActivation();
    if (url) openInNewTab(url);
  };

  // ==== Rendering ====

  // Tracked flow (new bot-mediated activation)
  if (trackedEnabled) {
    if (!user?.id) return null;
    const status = activation?.status ?? 'not_started';

    if (status === 'activated') {
      if (badgeWhenLinked) {
        return (
          <Badge variant="outline" className={`gap-1 rounded-full border-success/30 bg-success/10 px-3 py-1 text-success ${className ?? ''}`}>
            <CheckCircle2 className="h-3 w-3" />
            پشتیبانی فعال است
          </Badge>
        );
      }
      return (
        <div className={`flex items-center gap-3 rounded-3xl border border-border bg-card p-4 ${className ?? ''}`} dir="rtl">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10 text-success"><CheckCircle2 className="h-5 w-5" /></span>
          <div>
            <h4 className="font-bold text-foreground">پشتیبانی فعال است</h4>
            <p className="text-sm text-muted-foreground">پشتیبانی دوره برای شما فعال شده است.</p>
          </div>
        </div>
      );
    }

    const isNotStarted = status === 'not_started' || status === 'needs_followup' || status === 'failed';
    const isOpenedBot = status === 'opened_bot';
    const isPending = status === 'clicked_support_button' || status === 'pending_manual_confirmation';

    const title = isPending
      ? 'در انتظار تایید پشتیبانی'
      : isOpenedBot
      ? 'مرحله دوم فعال‌سازی'
      : 'فعال‌سازی پشتیبانی دوره';
    const text = isPending
      ? 'اگر پیام را در تلگرام ارسال کرده‌ای، تیم پشتیبانی به‌زودی فعال‌سازی را تایید می‌کند.'
      : isOpenedBot
      ? 'وارد ربات شده‌ای، اما هنوز پیام فعال‌سازی برای پشتیبانی ارسال نشده است.'
      : 'برای استفاده از پشتیبانی روی دکمه زیر کلیک کنید.';
    const btnText = isPending
      ? 'ارسال دوباره پیام فعال‌سازی'
      : isOpenedBot
      ? 'ادامه فعال‌سازی در تلگرام'
      : '🚀 فعال‌سازی پشتیبانی';
    const Icon = isPending ? Clock : isOpenedBot ? MessageCircleQuestion : Bot;

    return (
      <div className={`flex w-full flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center md:p-5 ${className ?? ''}`} dir="rtl">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="font-bold text-foreground">{title}</h4>
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        </div>
        <Button onClick={openBot} className="h-11 w-full shrink-0 rounded-full px-6 sm:w-auto">
          {btnText.replace('🚀 ', '')}
        </Button>
      </div>
    );
  }

  // ==== Legacy direct-telegram flow (unchanged) ====
  if (!enabled || !enrollmentId) return null;

  const url = `https://t.me/${bot}?start=enroll_${enrollmentId}`;

  if (linked && badgeWhenLinked) {
    return (
      <Badge variant="outline" className={`gap-1 rounded-full border-success/30 bg-success/10 px-3 py-1 text-success ${className ?? ''}`}>
        <CheckCircle2 className="h-3 w-3" />
        کوچ تلگرام فعال است
      </Badge>
    );
  }

  return (
    <Button asChild variant={linked ? 'outline' : 'default'} className={`h-11 rounded-full px-6 ${className ?? ''}`}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Bot className="ml-2 h-4 w-4" />
        {linked ? 'باز کردن کوچ شخصی در تلگرام' : 'فعال‌سازی کوچ شخصی تلگرام'}
      </a>
    </Button>
  );
}

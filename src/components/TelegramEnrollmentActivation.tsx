import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  /** Optional explicit enrollment id. If omitted, looks up by current user + courseId. */
  enrollmentId?: string;
  courseId: string;
  className?: string;
  /** When true and user has activated, render a compact badge instead of an outline button. */
  badgeWhenLinked?: boolean;
}

/**
 * Shows a "Activate Rafiei Bot Follow-up" button if the course has the feature
 * enabled. Once linked, can show either an outline "open in Telegram" button
 * or a compact activated badge.
 */
export function TelegramEnrollmentActivation({
  enrollmentId: enrollmentIdProp,
  courseId,
  className,
  badgeWhenLinked = false,
}: Props) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [linked, setLinked] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(enrollmentIdProp ?? null);
  const [bot, setBot] = useState('rafiei_bot');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Check the course flag + bot username in parallel
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('courses').select('rafiei_bot_followup_enabled' as any).eq('id', courseId).maybeSingle(),
        supabase.from('admin_settings').select('telegram_bot_username' as any).eq('id', 1).maybeSingle(),
      ]);
      if (cancelled) return;
      const isEnabled = !!(c as any)?.rafiei_bot_followup_enabled;
      setEnabled(isEnabled);
      const u = ((s as any)?.telegram_bot_username ?? 'rafiei_bot').replace(/^@/, '');
      setBot(u);
      if (!isEnabled) return;

      // 2. Resolve enrollment for current user if not provided
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

  if (!enabled || !enrollmentId) return null;

  const url = `https://t.me/${bot}?start=enroll_${enrollmentId}`;

  if (linked && badgeWhenLinked) {
    return (
      <Badge variant="outline" className={`gap-1 border-green-500/40 text-green-600 ${className ?? ''}`}>
        <CheckCircle2 className="h-3 w-3" />
        کوچ تلگرام فعال است
      </Badge>
    );
  }

  return (
    <Button
      asChild
      variant={linked ? 'outline' : 'default'}
      className={className}
      size="sm"
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Bot className="ml-2 h-4 w-4" />
        {linked ? 'باز کردن کوچ شخصی در تلگرام' : '🚀 فعال‌سازی کوچ شخصی تلگرام'}
      </a>
    </Button>
  );
}

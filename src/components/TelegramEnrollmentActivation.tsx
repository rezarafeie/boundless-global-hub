import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  enrollmentId: string;
  courseId: string;
  className?: string;
}

/**
 * Shows a "Activate Rafiei Bot Follow-up" button if the course has the feature
 * enabled. Opens Telegram deep link `t.me/<bot>?start=enroll_<id>`.
 */
export function TelegramEnrollmentActivation({ enrollmentId, courseId, className }: Props) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [linked, setLinked] = useState(false);
  const [bot, setBot] = useState('rafiei_bot');

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: e }, { data: s }] = await Promise.all([
        supabase.from('courses').select('rafiei_bot_followup_enabled' as any).eq('id', courseId).maybeSingle(),
        supabase.from('enrollments').select('telegram_chat_id' as any).eq('id', enrollmentId).maybeSingle(),
        supabase.from('admin_settings').select('telegram_bot_username' as any).eq('id', 1).maybeSingle(),
      ]);
      setEnabled(!!(c as any)?.rafiei_bot_followup_enabled);
      setLinked(!!(e as any)?.telegram_chat_id);
      const u = ((s as any)?.telegram_bot_username ?? 'rafiei_bot').replace(/^@/, '');
      setBot(u);
    })();
  }, [enrollmentId, courseId]);

  if (enabled === null) return null;
  if (!enabled) return null;

  const url = `https://t.me/${bot}?start=enroll_${enrollmentId}`;

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

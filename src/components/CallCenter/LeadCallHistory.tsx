import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIncoming, PhoneOutgoing, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { callCenter, formatDuration, tehranDateTime, STATUS_LABELS, type CallRow } from '@/lib/callCenterService';

/** Compact call history for one phone number (lead dialogs). Server limits agents to their own calls. */
export default function LeadCallHistory({ phone }: { phone?: string | null }) {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    let active = true;
    setLoading(true); setError('');
    callCenter.calls({ search: phone, page: 1, pageSize: 20 })
      .then((r) => active && setCalls(r.calls ?? []))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [phone]);

  if (loading) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری تماس‌ها…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!calls.length) return <p className="text-sm text-muted-foreground">هنوز تماسی با این شماره ثبت نشده است.</p>;
  return (
    <div className="space-y-2" dir="rtl">
      {calls.map((c: any) => {
        const out = c.direction === 'outgoing';
        const tr = c.call_transcripts?.[0] ?? c.call_transcripts;
        const ai = c.call_ai_analysis?.[0] ?? c.call_ai_analysis;
        return (
          <button key={c.id} onClick={() => navigate(`/enroll/admin/calls/${c.id}`)}
            className="w-full text-right rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                {out ? <PhoneOutgoing className="h-4 w-4 text-primary" /> : <PhoneIncoming className="h-4 w-4 text-primary" />}
                {out ? 'خروجی' : 'ورودی'} · {STATUS_LABELS[c.status] ?? c.status}
              </span>
              <span className="text-xs text-muted-foreground">{tehranDateTime(c.started_at)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>مدت: {formatDuration(c.talk_seconds)}</span>
              {tr?.processing_status === 'completed' && <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />متن</Badge>}
              {(ai?.overall_sales_score ?? c.ai_score) != null && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />امتیاز {ai?.overall_sales_score ?? c.ai_score}</Badge>}
            </div>
            {ai?.summary && <p className="text-xs leading-6 mt-2 line-clamp-2">{ai.summary}</p>}
          </button>
        );
      })}
    </div>
  );
}

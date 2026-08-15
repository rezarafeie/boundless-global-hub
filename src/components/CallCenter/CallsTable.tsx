import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhoneIncoming, PhoneOutgoing, Mic, Sparkles, ChevronLeft } from 'lucide-react';
import CallButton from './CallButton';
import { CallRow, formatDuration, tehranDateTime, STATUS_LABELS } from '@/lib/callCenterService';

const statusTone = (status: string) =>
  status === 'answered' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    : status === 'no_answer' || status === 'busy' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : 'bg-muted text-muted-foreground';

const customerNumber = (c: CallRow) => (c.direction === 'outgoing' ? c.destination_number : c.caller_number);

const CallsTable: React.FC<{ calls: CallRow[]; loading?: boolean }> = ({ calls, loading }) => {
  const navigate = useNavigate();

  if (loading) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;
  if (!calls.length) return <div className="p-8 text-center text-muted-foreground">تماسی یافت نشد</div>;

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {calls.map((c) => (
          <div key={c.id} className="rounded-xl border bg-card p-3 space-y-2" onClick={() => navigate(`/enroll/admin/calls/${c.id}`)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.customer_name || 'مخاطب ناشناس'}</div>
                <div className="text-xs text-muted-foreground font-mono" dir="ltr">{customerNumber(c)}</div>
              </div>
              <Badge variant="outline" className={statusTone(c.status)}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {c.direction === 'incoming' ? <PhoneIncoming className="h-3.5 w-3.5" /> : <PhoneOutgoing className="h-3.5 w-3.5" />}
              <span>{tehranDateTime(c.started_at)}</span>
              <span>· {formatDuration(c.talk_seconds)}</span>
              {c.agent_name && <span>· {c.agent_name}</span>}
              {c.ai_score != null && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />{c.ai_score}</Badge>}
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <CallButton phone={customerNumber(c)} name={c.customer_name} userId={c.user_id} leadId={c.lead_id} variant="button" className="h-8 flex-1" />
              <Button variant="ghost" size="sm" onClick={() => navigate(`/enroll/admin/calls/${c.id}`)}>جزئیات</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-right">
              <th className="p-3 font-medium">تاریخ</th>
              <th className="p-3 font-medium">مشتری</th>
              <th className="p-3 font-medium">شماره</th>
              <th className="p-3 font-medium">نوع</th>
              <th className="p-3 font-medium">کارشناس</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">مدت</th>
              <th className="p-3 font-medium">ضبط</th>
              <th className="p-3 font-medium">امتیاز AI</th>
              <th className="p-3 font-medium">محصول</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/enroll/admin/calls/${c.id}`)}>
                <td className="p-3 whitespace-nowrap text-muted-foreground">{tehranDateTime(c.started_at)}</td>
                <td className="p-3">{c.customer_name || <span className="text-muted-foreground">ناشناس</span>}</td>
                <td className="p-3 font-mono text-xs" dir="ltr">{customerNumber(c)}</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1">
                    {c.direction === 'incoming' ? <PhoneIncoming className="h-3.5 w-3.5 text-blue-500" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-emerald-500" />}
                    {c.direction === 'incoming' ? 'ورودی' : 'خروجی'}
                  </span>
                </td>
                <td className="p-3">{c.agent_name ?? '—'}</td>
                <td className="p-3"><Badge variant="outline" className={statusTone(c.status)}>{STATUS_LABELS[c.status] ?? c.status}</Badge></td>
                <td className="p-3 font-mono text-xs">{formatDuration(c.talk_seconds)}</td>
                <td className="p-3">{c.recording_id ? <Mic className="h-4 w-4 text-primary" /> : '—'}</td>
                <td className="p-3">{c.ai_score != null ? <Badge variant="secondary">{c.ai_score}</Badge> : '—'}</td>
                <td className="p-3 text-xs text-muted-foreground">{c.related_course ?? '—'}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <CallButton phone={customerNumber(c)} name={c.customer_name} userId={c.user_id} leadId={c.lead_id} />
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CallsTable;

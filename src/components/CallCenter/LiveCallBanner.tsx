import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PhoneIncoming, PhoneOutgoing, X, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { callCenter, type CallRow } from '@/lib/callCenterService';

interface LiveCall extends CallRow {
  customer_name?: string | null;
  agent_name?: string | null;
  related_course?: string | null;
}

const POLL_MS = 5000;

const elapsed = (iso?: string | null) => {
  if (!iso) return '۰۰:۰۰';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Realtime banner for incoming (ringing) calls.
 * Polls the call-center gateway every few seconds because the call tables are
 * service-role only and cannot be exposed to the browser through Realtime.
 */
const LiveCallBanner: React.FC<{ className?: string }> = ({ className }) => {
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [, setTick] = useState(0);
  const failures = useRef(0);
  const rang = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await callCenter.liveCalls(3);
      failures.current = 0;
      setCalls((res.calls ?? []) as LiveCall[]);
    } catch {
      failures.current += 1;
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (failures.current < 5 && document.visibilityState === 'visible') load();
    }, POLL_MS);
    const tick = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { clearInterval(id); clearInterval(tick); };
  }, [load]);

  const visible = calls.filter((c) => !dismissed.includes(c.id));

  // Soft chime the first time a call appears
  useEffect(() => {
    const fresh = visible.filter((c) => !rang.current.has(c.id));
    if (!fresh.length) return;
    fresh.forEach((c) => rang.current.add(c.id));
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.04;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 350);
    } catch { /* audio blocked */ }
  }, [visible]);

  if (!visible.length) return null;

  return (
    <div className={`space-y-2 ${className ?? ''}`} dir="rtl">
      {visible.map((call) => {
        const incoming = call.direction !== 'outgoing';
        const number = incoming ? call.caller_number : call.destination_number;
        return (
          <div
            key={call.id}
            className="relative flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 shadow-sm animate-in fade-in slide-in-from-top-2"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              {incoming ? <PhoneIncoming className="h-5 w-5" /> : <PhoneOutgoing className="h-5 w-5" />}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {incoming ? 'تماس ورودی' : 'تماس خروجی'}
                <span dir="ltr" className="font-mono">{number ?? 'نامشخص'}</span>
                <Badge variant="secondary" className="font-mono">{elapsed(call.started_at)}</Badge>
                {call.status === 'ringing' && <Badge className="bg-emerald-600 hover:bg-emerald-600">در حال زنگ خوردن</Badge>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {call.customer_name
                  ? <span className="flex items-center gap-1"><User className="h-3 w-3" />{call.customer_name}</span>
                  : <span>مشتری در CRM ثبت نشده است</span>}
                {call.related_course && <span>• {call.related_course}</span>}
                {call.extension && <span dir="ltr">• داخلی {call.extension}</span>}
                {call.agent_name && <span>• کارشناس: {call.agent_name}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {call.user_id && (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <a href={`/user/${call.user_id}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> پرونده کاربر
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setDismissed((d) => [...d, call.id])} aria-label="بستن">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LiveCallBanner;

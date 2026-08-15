import React, { useState } from 'react';
import { Phone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { callCenter, tehranDateTime, formatDuration, DIRECTION_LABELS, STATUS_LABELS } from '@/lib/callCenterService';

interface CallButtonProps {
  phone?: string | null;
  name?: string | null;
  userId?: number | null;
  leadId?: string | null;
  context?: string;
  source?: string;
  variant?: 'icon' | 'button';
  className?: string;
}

type State = 'idle' | 'lookup' | 'connecting' | 'ringing' | 'failed';

const CallButton: React.FC<CallButtonProps> = ({
  phone, name, userId, leadId, context, source = 'crm', variant = 'icon', className,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [info, setInfo] = useState<{ match: any; history: any[] } | null>(null);
  const [extension, setExtension] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!phone) return null;

  const openDialog = async () => {
    setOpen(true);
    setState('lookup');
    setError(null);
    try {
      const res = await callCenter.lookup(phone);
      setInfo(res);
    } catch (e) {
      setInfo(null);
    } finally {
      setState('idle');
    }
  };

  const dial = async () => {
    setState('connecting');
    setError(null);
    try {
      const res = await callCenter.dial({
        phone,
        extension: extension || undefined,
        userId: userId ?? info?.match?.user_id ?? null,
        leadId: leadId ?? info?.match?.lead_id ?? null,
        source,
      });
      setState('ringing');
      toast({ title: 'تماس در حال برقراری', description: res.message });
      setTimeout(() => setOpen(false), 2500);
    } catch (e) {
      setState('failed');
      setError((e as Error).message);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 ${className ?? ''}`}
          onClick={(e) => { e.stopPropagation(); openDialog(); }}
          title="تماس تلفنی"
        >
          <Phone className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          className={`gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 ${className ?? ''}`}
          onClick={(e) => { e.stopPropagation(); openDialog(); }}
        >
          <Phone className="h-4 w-4" />
          تماس
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600" />
              برقراری تماس
            </DialogTitle>
            <DialogDescription>
              ابتدا تلفن شما زنگ می‌خورد، سپس تماس با مشتری برقرار می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-1">
              <div className="font-semibold">{name || info?.match?.customer_name || 'مخاطب ناشناس'}</div>
              <div className="text-sm text-muted-foreground font-mono" dir="ltr">{phone}</div>
              {context && <div className="text-xs text-muted-foreground">{context}</div>}
              <div className="flex flex-wrap gap-1 pt-1">
                {info?.match?.user_id && <Badge variant="secondary">کاربر آکادمی</Badge>}
                {info?.match?.order_id && <Badge variant="secondary">مشتری</Badge>}
                {info?.match?.lead_id && <Badge variant="outline">لید</Badge>}
                {info?.match?.consultation_id && <Badge variant="outline">مشاوره</Badge>}
                {info?.match?.webinar_registration_id && <Badge variant="outline">وبینار</Badge>}
              </div>
            </div>

            {!!info?.history?.length && (
              <div className="rounded-lg border p-3">
                <div className="text-xs font-medium mb-2 text-muted-foreground">آخرین تماس‌ها</div>
                <div className="space-y-1 max-h-32 overflow-auto">
                  {info.history.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span>{DIRECTION_LABELS[h.direction] ?? h.direction} · {STATUS_LABELS[h.status] ?? h.status}</span>
                      <span className="text-muted-foreground">{tehranDateTime(h.started_at)} · {formatDuration(h.talk_seconds)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="cc-ext" className="text-xs">داخلی کارشناس (اختیاری)</Label>
              <Input id="cc-ext" value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="پیش‌فرض تنظیمات" dir="ltr" />
            </div>

            {state === 'ringing' && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle2 className="h-4 w-4" /> درخواست ارسال شد — گوشی خود را پاسخ دهید
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4 mt-0.5" /> <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={dial} disabled={state === 'connecting' || state === 'lookup'} className="gap-2">
              {state === 'connecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              تماس بگیر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallButton;

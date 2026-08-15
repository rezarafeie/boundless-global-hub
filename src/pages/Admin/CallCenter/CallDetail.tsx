import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight, Sparkles, FileText, Save, RefreshCw, Loader2, PhoneCall, User, Clock, Flame,
} from 'lucide-react';
import RecordingPlayer from '@/components/CallCenter/RecordingPlayer';
import CallButton from '@/components/CallCenter/CallButton';
import {
  callCenter, formatDuration, tehranDateTime, STATUS_LABELS, DIRECTION_LABELS,
} from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-3 text-sm py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-left">{children}</span>
  </div>
);

const CallDetail: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState('');
  const [dispositions, setDispositions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [requestedStage, setRequestedStage] = useState<'auto' | 'recording' | 'transcript' | 'analysis' | null>(null);
  const [fuTitle, setFuTitle] = useState('');
  const [fuDue, setFuDue] = useState('');
  const [fuPriority, setFuPriority] = useState('medium');

  const load = async () => {
    if (!callId) return;
    setLoading(true);
    try {
      const res: any = await callCenter.call(callId);
      setData(res);
      setNotes(res.call?.notes ?? '');
      setDisposition(res.call?.disposition ?? '');
    } catch (e) {
      toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); callCenter.dispositions().then((r) => setDispositions(r.dispositions ?? [])).catch(() => {}); }, [callId]);

  const saveOutcome = async () => {
    setSaving(true);
    try {
      await callCenter.saveOutcome({ callId, notes, disposition: disposition || null });
      toast({ title: 'ذخیره شد' });
      load();
    } catch (e) { toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const addFollowup = async () => {
    if (!fuTitle || !fuDue) { toast({ title: 'عنوان و زمان پیگیری الزامی است', variant: 'destructive' }); return; }
    try {
      await callCenter.createFollowup({ callId, title: fuTitle, dueAt: new Date(fuDue).toISOString(), priority: fuPriority });
      setFuTitle(''); setFuDue('');
      toast({ title: 'پیگیری ثبت شد' });
      load();
    } catch (e) { toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }); }
  };

  const reprocess = async (stage: 'auto' | 'recording' | 'transcript' | 'analysis') => {
    setReprocessing(true);
    setRequestedStage(stage);
    try {
      await callCenter.reprocess(callId!, stage);
      toast({ title: 'پردازش آغاز شد', description: 'نتیجه تا لحظاتی دیگر آماده می‌شود.' });
      for (let attempt = 0; attempt < 24; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const res: any = await callCenter.call(callId!);
        setData(res);
        const transcript = res.call?.transcript_detail?.[0] ?? res.call?.transcript_detail;
        if (stage === 'transcript' && ['completed', 'empty', 'failed'].includes(transcript?.processing_status)) break;
        if (stage !== 'transcript' && !['pending', 'downloading', 'transcribing', 'analyzing'].includes(res.call?.processing_status)) break;
      }
    } catch (e) { toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }); }
    finally { setReprocessing(false); setRequestedStage(null); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;
  if (!data?.call) return <div className="p-8 text-center text-muted-foreground">تماس یافت نشد</div>;

  const c = data.call;
  const ai = c.call_ai_analysis?.[0] ?? c.call_ai_analysis ?? null;
  const tr = c.transcript_detail?.[0] ?? c.transcript_detail ?? c.call_transcripts?.[0] ?? c.call_transcripts ?? null;
  const phone = c.direction === 'outgoing' ? c.destination_number : c.caller_number;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => navigate('/enroll/admin')} className="gap-1">
            <ArrowRight className="h-4 w-4" /> بازگشت
          </Button>
          <div className="flex flex-wrap gap-2 justify-end">
            <CallButton phone={phone} name={c.customer_name} userId={c.user_id} leadId={c.lead_id} variant="button" source="call_detail" />
            <Button variant="outline" onClick={() => reprocess('recording')} disabled={reprocessing} className="gap-1">
              {reprocessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} دریافت فایل صوتی
            </Button>
            <Button variant="outline" onClick={() => reprocess('transcript')} disabled={reprocessing} className="gap-1">
              {reprocessing && requestedStage === 'transcript' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} تبدیل به متن
            </Button>
            <Button variant="outline" onClick={() => reprocess('analysis')} disabled={reprocessing} className="gap-1">
              {reprocessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} تحلیل هوشمند
            </Button>
            <Button onClick={() => reprocess('auto')} disabled={reprocessing} className="gap-1">
              {reprocessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} پردازش کامل
            </Button>
          </div>
        </div>


        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                <span dir="ltr" className="font-mono">{phone || '—'}</span>
                <Badge variant="outline">{DIRECTION_LABELS[c.direction] ?? c.direction}</Badge>
                <Badge variant={c.status === 'answered' ? 'default' : 'destructive'}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
              </CardTitle>
              <CardDescription>{tehranDateTime(c.started_at)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <Row label="مشتری">{c.customer_name || 'ناشناس'}</Row>
              <Row label="کارشناس">{c.agent_name || '—'}</Row>
              <Row label="داخلی">{c.extension || '—'}</Row>
              <Row label="مدت مکالمه">{formatDuration(c.talk_seconds)}</Row>
              <Row label="زمان انتظار">{formatDuration(c.waiting_seconds)}</Row>
              <Row label="نتیجه تماس">{c.disposition || '—'}</Row>
              <Row label="منجر به فروش">{c.resulted_in_sale ? <Badge>بله</Badge> : 'خیر'}</Row>
              <Separator className="my-3" />
              <RecordingPlayer callId={c.id} canDownload />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> پروندهٔ مشتری</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {data.customer ? (
                <>
                  <Row label="نام">{data.customer.full_name || data.customer.name}</Row>
                  <Row label="شماره"><span dir="ltr" className="font-mono">{data.customer.phone}</span></Row>
                  <Row label="ایمیل">{data.customer.email || '—'}</Row>
                </>
              ) : <p className="text-sm text-muted-foreground">مشتری در سیستم شناسایی نشد.</p>}
              {!!data.orders?.length && (
                <>
                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground mb-1">خریدها</div>
                  {data.orders.map((o: any) => (
                    <div key={o.id} className="text-sm flex justify-between gap-2 py-0.5">
                      <span className="truncate">{o.courses?.title || 'دوره'}</span>
                      <span className="text-muted-foreground shrink-0">{Number(o.payment_amount || 0).toLocaleString('fa-IR')}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {ai && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> تحلیل هوشمند تماس</CardTitle>
              <CardDescription>این تحلیل توسط هوش مصنوعی تولید شده و ممکن است دقیق نباشد.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ai.overall_score != null && <Badge variant="secondary">امتیاز کلی: {ai.overall_score}</Badge>}
                {ai.purchase_intent_score != null && (
                  <Badge className="gap-1"><Flame className="h-3 w-3" /> قصد خرید: {ai.purchase_intent_score}</Badge>
                )}
                {ai.sentiment && <Badge variant="outline">حس کلی: {ai.sentiment}</Badge>}
                {ai.customer_stage && <Badge variant="outline">مرحله: {ai.customer_stage}</Badge>}
              </div>
              {ai.summary && <p className="text-sm leading-7 whitespace-pre-wrap">{ai.summary}</p>}
              {!!ai.objections?.length && (
                <div><div className="text-xs text-muted-foreground mb-1">اعتراض‌ها و موانع</div>
                  <ul className="list-disc pr-5 text-sm space-y-1">{ai.objections.map((o: string, i: number) => <li key={i}>{o}</li>)}</ul></div>
              )}
              {!!ai.next_actions?.length && (
                <div><div className="text-xs text-muted-foreground mb-1">اقدامات پیشنهادی</div>
                  <ul className="list-disc pr-5 text-sm space-y-1">{ai.next_actions.map((o: string, i: number) => <li key={i}>{o}</li>)}</ul></div>
              )}
              {ai.coaching_feedback && (
                <div><div className="text-xs text-muted-foreground mb-1">بازخورد مربی‌گری</div>
                  <p className="text-sm leading-7 whitespace-pre-wrap">{ai.coaching_feedback}</p></div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> متن مکالمه</CardTitle>
            <Button size="sm" variant="outline" onClick={() => reprocess('transcript')} disabled={reprocessing} className="gap-1">
              {reprocessing && requestedStage === 'transcript' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {tr?.transcript ? 'تبدیل مجدد به متن' : 'تبدیل به متن'}
            </Button>
          </CardHeader>
          <CardContent>
            {tr?.transcript ? (
              <div className="max-h-80 overflow-y-auto text-sm leading-7 whitespace-pre-wrap">{tr.transcript}</div>
            ) : tr?.processing_status === 'failed' ? (
              <p className="text-sm text-destructive">تبدیل ناموفق بود: {tr.error || 'خطای نامشخص'}</p>
            ) : ['pending', 'transcribing'].includes(tr?.processing_status) || (reprocessing && requestedStage === 'transcript') ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال تبدیل فایل صوتی به متن…</p>
            ) : (
              <p className="text-sm text-muted-foreground">هنوز متنی برای این تماس ثبت نشده است. برای پیاده‌سازی گفتار به متن دکمهٔ بالا را بزنید (نیازمند فایل ضبط‌شده).</p>
            )}
          </CardContent>
        </Card>


        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">نتیجه و یادداشت</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">نتیجه تماس</Label>
                <Select value={disposition} onValueChange={setDisposition}>
                  <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                  <SelectContent>
                    {dispositions.map((d) => <SelectItem key={d.id} value={d.code}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="یادداشت کارشناس…" />
              <Button onClick={saveOutcome} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> پیگیری</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={fuTitle} onChange={(e) => setFuTitle(e.target.value)} placeholder="عنوان پیگیری" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="datetime-local" value={fuDue} onChange={(e) => setFuDue(e.target.value)} dir="ltr" />
                <Select value={fuPriority} onValueChange={setFuPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">پایین</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">بالا</SelectItem>
                    <SelectItem value="critical">بحرانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="secondary" onClick={addFollowup}>ثبت پیگیری</Button>
              {!!c.call_followups?.length && (
                <div className="space-y-2 pt-2">
                  {c.call_followups.map((f: any) => (
                    <div key={f.id} className="text-sm border rounded-lg p-2 flex justify-between gap-2">
                      <span>{f.title}</span>
                      <span className="text-xs text-muted-foreground">{tehranDateTime(f.due_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CallDetail;

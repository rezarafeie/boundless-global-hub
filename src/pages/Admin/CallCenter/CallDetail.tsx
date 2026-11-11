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
import { CallInsights, ConversationBubbles, parseSpeakerLines } from '@/components/CallCenter/CallConversation';
import RecordingPlayer from '@/components/CallCenter/RecordingPlayer';
import CallButton from '@/components/CallCenter/CallButton';
import {
  callCenter, formatDuration, tehranDateTime, STATUS_LABELS, DIRECTION_LABELS, streamCallTranscript,
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
  const [live, setLive] = useState<{ stage: 'download' | 'transcribe' | 'correct' | 'analyze' | null; raw: string; corrected: string; notice?: string } | null>(null);
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
      await callCenter.createFollowup({ callId, title: fuTitle, due_at: new Date(`${fuDue}:00+03:30`).toISOString(), priority: fuPriority });
      setFuTitle(''); setFuDue('');
      toast({ title: 'پیگیری ثبت شد' });
      load();
    } catch (e) { toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }); }
  };

  const transcribeLive = async () => {
    if (!callId) return;
    setReprocessing(true);
    setRequestedStage('transcript');
    setLive({ stage: 'download', raw: '', corrected: '' });
    try {
      await streamCallTranscript(callId, (e) => {
        if (e.type === 'stage') setLive((l) => l && { ...l, stage: e.stage });
        else if (e.type === 'raw') setLive((l) => l && { ...l, raw: l.raw + e.delta });
        else if (e.type === 'raw_done') setLive((l) => l && { ...l, raw: e.text });
        else if (e.type === 'corrected') setLive((l) => l && { ...l, corrected: l.corrected + e.delta });
        else if (e.type === 'notice') setLive((l) => l && { ...l, notice: e.message });
        else if (e.type === 'error') throw new Error(e.error);
      });
      setLive(null);
      await load();
      toast({ title: 'متن مکالمه آماده شد' });
    } catch (e) {
      toast({ title: 'خطا در تبدیل به متن', description: (e as Error).message, variant: 'destructive' });
      setLive(null);
      load();
    } finally { setReprocessing(false); setRequestedStage(null); }
  };

  const reprocess = async (stage: 'auto' | 'recording' | 'transcript' | 'analysis') => {
    if (stage === 'transcript') return transcribeLive();
    if (!callId) return;
    setReprocessing(true);
    setRequestedStage(stage);
    try {
      await callCenter.reprocess(callId, stage);
      toast({ title: 'پردازش آغاز شد', description: 'نتیجه تا لحظاتی دیگر آماده می‌شود.' });
      for (let attempt = 0; attempt < 24; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const res: any = await callCenter.call(callId);
        setData(res);
        if (!['pending', 'downloading', 'transcribing', 'analyzing'].includes(res.call?.processing_status)) break;
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

        {ai && <CallInsights ai={ai} />}

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> متن مکالمه</CardTitle>
            <Button size="sm" variant="outline" onClick={() => reprocess('transcript')} disabled={reprocessing} className="gap-1">
              {reprocessing && requestedStage === 'transcript' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {tr?.transcript ? 'تبدیل مجدد به متن' : 'تبدیل به متن'}
            </Button>
          </CardHeader>
          <CardContent>
            {live ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {live.stage === 'download' ? 'در حال آماده‌سازی فایل صوتی…' : live.stage === 'transcribe' ? 'در حال تبدیل گفتار به متن…' : live.stage === 'correct' ? 'در حال تصحیح متن و جدا کردن فروشنده و مشتری…' : 'در حال تحلیل مکالمه و آماده‌سازی پیشنهادها…'}
                </p>
                <div className="max-h-[32rem] overflow-y-auto">
                  {live.corrected && parseSpeakerLines(live.corrected).length
                    ? <ConversationBubbles segments={parseSpeakerLines(live.corrected)} />
                    : <p className="text-sm leading-7 whitespace-pre-wrap text-muted-foreground">{live.raw}</p>}
                </div>
                {live.notice && <p className="text-xs text-muted-foreground">{live.notice}</p>}
              </div>
            ) : tr?.transcript ? (
              <div className="space-y-2">
                <div className="max-h-[32rem] overflow-y-auto">
                  {Array.isArray(tr.segments) && tr.segments.length
                    ? <ConversationBubbles segments={tr.segments} />
                    : <p className="text-sm leading-7 whitespace-pre-wrap">{tr.transcript}</p>}
                </div>
                {tr.correction_model && <p className="text-xs text-muted-foreground">متن با گوش دادن دوبارهٔ هوش مصنوعی به صدا تصحیح شده است.</p>}
              </div>
            ) : tr?.processing_status === 'failed' ? (
              <p className="text-sm text-destructive">تبدیل ناموفق بود: {tr.error || 'خطای نامشخص'}</p>
            ) : ['pending', 'transcribing'].includes(tr?.processing_status) ? (
              <p className="text-sm text-muted-foreground">این تماس در صف تبدیل به متن است. برای دریافت فوری، دکمهٔ «تبدیل به متن» را بزنید.</p>
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
                <Input aria-label="زمان پیگیری به وقت تهران" type="datetime-local" value={fuDue} onChange={(e) => setFuDue(e.target.value)} dir="ltr" />
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

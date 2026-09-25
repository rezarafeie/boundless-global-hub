import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { challengeApi } from '@/lib/challenge/schema';
import ChallengeMissionCard from './ChallengeMissionCard';

const faNum = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString('fa-IR');
const items = (v: any): any[] => (Array.isArray(v) ? v : []);

const Applications: React.FC<{ slug: string }> = ({ slug }) => {
  const [apps, setApps] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const load = () => challengeApi('admin_action', { slug, op: 'list_applications' }).then((r: any) => setApps(r.applications ?? [])).catch((e) => { toast.error(e.message); setApps([]); });
  useEffect(() => { load(); }, [slug]);
  const review = async (id: string, op: 'approve' | 'reject') => {
    if (op === 'reject' && !reasons[id]?.trim()) return toast.error('دلیل رد را بنویسید');
    setBusy(id);
    try { await challengeApi('admin_action', { slug, op, participantId: id, reason: reasons[id] }); toast.success(op === 'approve' ? 'تایید شد' : 'رد شد'); await load(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };
  if (!apps) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!apps.length) return <p className="py-10 text-center text-sm text-muted-foreground">هنوز درخواستی ثبت نشده است.</p>;
  return (
    <div className="space-y-3">
      {apps.map((a) => (
        <Card key={a.id}><CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Badge variant={a.approval_status === 'pending' ? 'secondary' : a.approval_status === 'approved' ? 'default' : 'destructive'}>
              {a.approval_status === 'pending' ? 'در انتظار' : a.approval_status === 'approved' ? 'تایید شده' : 'رد شده'}
            </Badge>
          </div>
          <dl className="grid gap-1 text-sm">{items(a.summary).map(([k, v]: any, i: number) => <div key={i} className="flex gap-2"><dt className="font-semibold">{k}:</dt><dd className="text-muted-foreground">{String(v)}</dd></div>)}</dl>
          {a.rejection_reason && a.approval_status === 'rejected' && <p className="text-sm text-destructive">دلیل رد: {a.rejection_reason}</p>}
          {a.approval_status === 'pending' && (
            <div className="space-y-2">
              <Textarea placeholder="دلیل رد (فقط برای رد)" value={reasons[a.id] ?? ''} onChange={(e) => setReasons({ ...reasons, [a.id]: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === a.id} onClick={() => review(a.id, 'approve')}><CheckCircle2 className="ml-1 h-4 w-4" />تایید</Button>
                <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => review(a.id, 'reject')}><XCircle className="ml-1 h-4 w-4" />رد</Button>
              </div>
            </div>
          )}
        </CardContent></Card>
      ))}
    </div>
  );
};

const CoachView: React.FC<{ state: any }> = ({ state }) => {
  const ch = state.challenge;
  const [day, setDay] = useState<number>(state.days?.[0]?.day_number ?? 1);
  const d = (state.days ?? []).find((x: any) => x.day_number === day);
  const [variantId, setVariantId] = useState<string>('');
  const variants = d?.variants ?? [];
  const variant = variants.find((item: any) => item.id === variantId) ?? variants[0];
  useEffect(() => { setVariantId(''); }, [day]);
  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Card className="border-primary/20"><CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h1 className="text-xl font-bold sm:text-2xl">{ch.title}</h1><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />نمای مربی — همه روزها باز است</p></div>
          <Badge className="text-sm">روز {faNum(day)} از {faNum(ch.days_count)}</Badge>
        </div>
      </CardContent></Card>
      <Tabs defaultValue="missions">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="missions">ماموریت‌ها</TabsTrigger><TabsTrigger value="apps">درخواست‌های عضویت</TabsTrigger></TabsList>
        <TabsContent value="missions" className="space-y-6">
          {d && (
            <>
              {variants.length > 1 && <div className="flex flex-wrap gap-2">{variants.map((item: any) => <Button key={item.id} size="sm" variant={item.id === variant?.id ? 'default' : 'outline'} onClick={() => setVariantId(item.id)}>{item.title || 'ماموریت'}{item.is_fallback ? ' — پیش‌فرض' : ''}</Button>)}</div>}
              {variant ? (
                <ChallengeMissionCard dayInfo={d} mission={{ day_number: d.day_number, status: 'available', variant }} statusLabel="باز برای مربی">
                  {variant.assignment && <div className="rounded-lg border p-4 text-sm"><p className="font-semibold">تکلیف: {variant.assignment.title}</p>{variant.assignment.description && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{variant.assignment.description}</p>}</div>}
                  {variant.form && <Button asChild size="lg" className="h-14 w-full text-base font-bold"><a href={`/f/${variant.form.slug ?? variant.form.id}`} target="_blank" rel="noreferrer">مشاهده فرم ماموریت</a></Button>}
                </ChallengeMissionCard>
              ) : <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">برای این روز ماموریتی تعریف نشده است.</CardContent></Card>}
            </>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">مسیر {faNum(ch.days_count)} روزه</CardTitle></CardHeader>
            <CardContent><div className="grid grid-cols-5 gap-2 sm:grid-cols-10">{(state.days ?? []).map((item: any) => <button key={item.id} title={item.title} onClick={() => setDay(item.day_number)} className={`flex flex-col items-center rounded-lg border p-2 text-xs transition hover:border-primary ${item.day_number === day ? 'border-primary bg-primary/10' : 'border-border'}`}><span className="text-base">🟢</span><span>{faNum(item.day_number)}</span></button>)}</div></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="apps"><Applications slug={ch.slug} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachView;

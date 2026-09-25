import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { challengeApi } from '@/lib/challenge/schema';

const faNum = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString('fa-IR');
const items = (v: any): any[] => (Array.isArray(v) ? v : []);
const txt = (x: any) => (typeof x === 'string' ? x : x?.title ?? x?.label ?? x?.url ?? JSON.stringify(x));

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
  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <Card className="border-primary/30"><CardContent className="flex items-center gap-3 p-4">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <div><h1 className="font-bold">{ch.title}</h1><p className="text-xs text-muted-foreground">نمای مربی — همه روزها و ماموریت‌ها باز است</p></div>
      </CardContent></Card>
      <Tabs defaultValue="missions">
        <TabsList><TabsTrigger value="missions">ماموریت‌ها</TabsTrigger><TabsTrigger value="apps">درخواست‌های عضویت</TabsTrigger></TabsList>
        <TabsContent value="missions" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(state.days ?? []).map((x: any) => (
              <Button key={x.id} size="sm" variant={x.day_number === day ? 'default' : 'outline'} onClick={() => setDay(x.day_number)}>روز {faNum(x.day_number)}</Button>
            ))}
          </div>
          {d && (
            <Card><CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold">روز {faNum(d.day_number)}: {d.title}</h2>
                {d.short_description && <p className="text-sm text-muted-foreground">{d.short_description}</p>}
                {d.goal && <p className="mt-1 text-sm"><b>هدف:</b> {d.goal}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{faNum(d.xp)} XP{d.estimated_minutes ? ` · ${faNum(d.estimated_minutes)} دقیقه` : ''}{d.required === false ? ' · اختیاری' : ''}</p>
              </div>
              {(d.variants ?? []).length === 0 && <p className="text-sm text-muted-foreground">برای این روز ماموریتی تعریف نشده.</p>}
              {(d.variants ?? []).map((v: any) => (
                <div key={v.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{v.title || 'ماموریت'}</p>
                    {v.is_fallback && <Badge variant="secondary">پیش‌فرض</Badge>}
                    {[...items(v.business_models), ...items(v.stages), ...items(v.budgets)].map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                  {v.instructions && <p className="whitespace-pre-wrap text-sm">{v.instructions}</p>}
                  {v.expected_result && <p className="text-sm"><b>نتیجه مورد انتظار:</b> {v.expected_result}</p>}
                  {v.example && <p className="text-sm text-muted-foreground"><b>مثال:</b> {v.example}</p>}
                  {[['چک‌لیست', v.checklist], ['نکات', v.tips], ['منابع', v.resources]].map(([t, l]: any) => items(l).length ? (
                    <div key={t}><p className="text-sm font-semibold">{t}</p><ul className="list-inside list-disc text-sm text-muted-foreground">{items(l).map((x, i) => <li key={i}>{txt(x)}</li>)}</ul></div>
                  ) : null)}
                  {v.assignment && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-semibold">تکلیف: {v.assignment.title}</p>
                      {v.assignment.description && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{v.assignment.description}</p>}
                    </div>
                  )}
                  {v.form && <p className="text-sm">فرم: {v.form.title}</p>}
                </div>
              ))}
            </CardContent></Card>
          )}
        </TabsContent>
        <TabsContent value="apps"><Applications slug={ch.slug} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachView;

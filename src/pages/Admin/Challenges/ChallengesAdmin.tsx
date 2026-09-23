import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Copy, Download, FileJson, Loader2, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  JSON_GUIDE, JSON_TEMPLATE, STATUSES, downloadJson, exportChallengeJson, importChallengeJson, labelOf, validateChallengeJson, type Validation,
} from '@/lib/challenge/schema';

const ChallengesAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, { participants: number; pending: number; completed: number }>>({});
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    const s: typeof stats = {};
    for (const c of data || []) {
      const [{ count: participants }, { count: pending }, { count: completed }] = await Promise.all([
        supabase.from('challenge_participants').select('id', { count: 'exact', head: true }).eq('challenge_id', c.id),
        supabase.from('challenge_progress').select('id', { count: 'exact', head: true }).eq('challenge_id', c.id).eq('status', 'pending_review'),
        supabase.from('challenge_progress').select('id', { count: 'exact', head: true }).eq('challenge_id', c.id).eq('status', 'completed'),
      ]);
      s[c.id] = { participants: participants || 0, pending: pending || 0, completed: completed || 0 };
    }
    setStats(s);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createBlank = async () => {
    setCreating(true);
    const slug = `challenge-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from('challenges').insert({ title: 'چالش جدید', slug, days_count: 30 } as any).select('id').single();
    setCreating(false);
    if (error) return toast.error(error.message);
    navigate(`/enroll/admin/challenges/${data.id}`);
  };

  const duplicate = async (c: any) => {
    try {
      const j: any = await exportChallengeJson(c.id);
      j.challenge.slug = `${c.slug}-copy-${Date.now().toString(36).slice(-4)}`;
      j.challenge.title = `${c.title} (کپی)`;
      j.challenge.status = 'draft';
      const id = await importChallengeJson(j, 'create');
      toast.success('کپی ساخته شد');
      navigate(`/enroll/admin/challenges/${id}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const setStatus = async (c: any, status: string) => {
    const { error } = await supabase.from('challenges').update({ status }).eq('id', c.id);
    error ? toast.error(error.message) : load();
  };

  const today = (c: any) => Math.max(0, Math.min(c.days_count, Math.floor((Date.now() - Date.parse(`${c.start_date}T00:00:00+03:30`)) / 86400000) + 1));

  return (
    <div dir="rtl" className="container mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">چالش‌ها</h1>
          <p className="text-sm text-muted-foreground">لایه چالش روی تمرین‌ها، فرم‌ها، بازخورد هوشمند و اعلان‌های موجود</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadJson(JSON_TEMPLATE, 'challenge-template.json')}><Download className="ml-1 h-4 w-4" />قالب JSON</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="ml-1 h-4 w-4" />ورود JSON</Button>
          <Button onClick={createBlank} disabled={creating}><Plus className="ml-1 h-4 w-4" />چالش جدید</Button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((c) => {
            const s = stats[c.id] || { participants: 0, pending: 0, completed: 0 };
            const t = today(c);
            return (
              <Card key={c.id} className="overflow-hidden">
                {c.cover_image && <img src={c.cover_image} alt="" className="h-32 w-full object-cover" />}
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold">{c.title}</h2>
                      <p className="text-xs text-muted-foreground">شروع {new Date(c.start_date).toLocaleDateString('fa-IR')} · {c.days_count} روز · /{c.slug}</p>
                    </div>
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{labelOf(STATUSES, c.status)}</Badge>
                  </div>
                  <Progress value={(t / Math.max(1, c.days_count)) * 100} />
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded bg-muted p-2">شرکت‌کننده<br /><b>{s.participants}</b></div>
                    <div className="rounded bg-muted p-2">روز جاری<br /><b>{t}</b></div>
                    <div className="rounded bg-muted p-2">در انتظار بررسی<br /><b>{s.pending}</b></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => navigate(`/enroll/admin/challenges/${c.id}`)}>مدیریت</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/enroll/admin/challenges/${c.id}?tab=participants`)}>شرکت‌کننده‌ها</Button>
                    <Button size="sm" variant="outline" onClick={async () => downloadJson(await exportChallengeJson(c.id), `${c.slug}.json`)}><FileJson className="ml-1 h-3 w-3" />خروجی</Button>
                    <Button size="sm" variant="outline" onClick={() => duplicate(c)}><Copy className="ml-1 h-3 w-3" />کپی</Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(`/challenges/${c.slug}?preview=1`, '_blank')}>پیش‌نمایش</Button>
                    {c.status === 'active' && <Button size="sm" variant="ghost" onClick={() => setStatus(c, 'paused')}>توقف</Button>}
                    {c.status === 'paused' && <Button size="sm" variant="ghost" onClick={() => setStatus(c, 'active')}>ادامه</Button>}
                    {['active', 'paused'].includes(c.status) && <Button size="sm" variant="ghost" onClick={() => confirm('چالش پایان یابد؟') && setStatus(c, 'finished')}>پایان</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!items.length && <p className="col-span-2 py-16 text-center text-muted-foreground">هنوز چالشی ساخته نشده است. با «ورود JSON» یا «چالش جدید» شروع کنید.</p>}
        </div>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={(id) => { setImportOpen(false); navigate(`/enroll/admin/challenges/${id}`); }} />
    </div>
  );
};

export const ImportDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; onDone: (id: string) => void }> = ({ open, onOpenChange, onDone }) => {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [result, setResult] = useState<Validation | null>(null);
  const [mode, setMode] = useState<'create' | 'update'>('create');
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const validate = (raw = text) => {
    try {
      const j = JSON.parse(raw);
      setParsed(j); setResult(validateChallengeJson(j));
    } catch (e: any) { setParsed(null); setResult({ errors: ['JSON نامعتبر: ' + e.message], warnings: [], summary: {} }); }
  };
  const onFile = async (f?: File) => { if (!f) return; const t = await f.text(); setText(t); validate(t); };
  const run = async () => {
    setBusy(true); setLogs([]);
    try { const id = await importChallengeJson(parsed, mode, (m) => setLogs((l) => [...l, m])); toast.success('چالش وارد شد'); onDone(id); }
    catch (e: any) { toast.error(e.message); setLogs((l) => [...l, '❌ ' + e.message + ' — تغییرات جدید برگردانده شد']); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>ورود چالش از JSON</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input type="file" accept=".json,application/json" className="max-w-xs" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="outline" onClick={() => downloadJson(JSON_TEMPLATE, 'challenge-template.json')}><Download className="ml-1 h-4 w-4" />قالب</Button>
            <Button variant="ghost" onClick={() => setShowGuide((v) => !v)}>راهنمای ساختار</Button>
          </div>
          {showGuide && <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-6">{JSON_GUIDE}</pre>}
          <Textarea dir="ltr" rows={10} className="font-mono text-xs" placeholder="JSON را اینجا قرار دهید" value={text} onChange={(e) => setText(e.target.value)} />
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="flex gap-6">
            <div className="flex items-center gap-2"><RadioGroupItem value="create" id="m1" /><Label htmlFor="m1">ساخت چالش جدید</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="update" id="m2" /><Label htmlFor="m2">به‌روزرسانی چالش موجود (بر اساس slug، پیشرفت حفظ می‌شود)</Label></div>
          </RadioGroup>
          <Button variant="secondary" onClick={() => validate()} disabled={!text}>بررسی و پیش‌نمایش</Button>

          {result && (
            <div className="space-y-3 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.summary).map(([k, v]) => <Badge key={k} variant="secondary">{({ days: 'روز', variants: 'variant', assignments: 'تمرین جدید', forms: 'فرم جدید', rewards: 'جایزه', penalties: 'جریمه', notification_events: 'پیام رویداد' } as any)[k] ?? k}: {v}</Badge>)}
              </div>
              {result.errors.map((e, i) => <p key={i} className="text-destructive">⛔ {e}</p>)}
              {result.warnings.slice(0, 20).map((w, i) => <p key={i} className="text-muted-foreground">⚠️ {w}</p>)}
              {parsed?.days && !result.errors.length && (
                <div className="max-h-64 space-y-2 overflow-auto">
                  {parsed.days.map((d: any) => (
                    <div key={d.day_number} className="rounded bg-muted p-2">
                      <p className="font-medium">روز {d.day_number}: {d.title} <span className="text-xs text-muted-foreground">({d.review_mode ?? 'ai'} · {d.xp ?? 10} XP)</span></p>
                      {(d.variants || []).map((v: any, i: number) => (
                        <p key={i} className="mr-4 text-xs">→ {v.title ?? v.key ?? `variant ${i + 1}`}{v.is_fallback ? ' (پیش‌فرض)' : ''} — {v.assignment ? `تمرین جدید: ${v.assignment.title}` : v.assignment_id ? 'تمرین موجود' : v.form || v.form_id ? 'فرم' : 'بدون ارسال'}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {logs.length > 0 && <div className="rounded bg-muted p-2 text-xs">{logs.map((l, i) => <p key={i}>{l}</p>)}</div>}
          <Button className="w-full" disabled={!parsed || !!result?.errors.length || busy} onClick={run}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ورود نهایی'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengesAdmin;

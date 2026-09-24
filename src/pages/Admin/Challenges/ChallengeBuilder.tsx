import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CHANNELS, EVENT_KINDS, PROGRESS_LABELS, REVIEW_MODES, STATUSES, challengeApi, coverage, downloadJson, exportChallengeJson,
  labelOf, segmentsOf, selectVariant, type Segments,
} from '@/lib/challenge/schema';
import { ImportDialog } from './ChallengesAdmin';

const lines = (v: any) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x.title ? `${x.title}|${x.url ?? ''}` : JSON.stringify(x))).join('\n') : '');
const toList = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const toResources = (s: string) => toList(s).map((l) => { const [title, url] = l.split('|'); return url ? { title, url } : { title: l, url: l }; });

const ChallengeBuilder: React.FC = () => {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [ch, setCh] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editDay, setEditDay] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: d }, { data: v }, { data: a }, { data: f }, { data: co }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id!).single(),
      supabase.from('challenge_days').select('*').eq('challenge_id', id!).order('day_number'),
      supabase.from('challenge_variants').select('*').eq('challenge_id', id!),
      supabase.from('assignments').select('id, title, status').order('created_at', { ascending: false }).limit(500),
      supabase.from('telegram_forms').select('id, title, slug').order('created_at', { ascending: false }).limit(300),
      supabase.from('courses').select('id, title').order('title').limit(500),
    ]);
    setCh(c); setDays(d || []); setVariants(v || []); setAssignments(a || []); setForms(f || []); setCourses(co || []);
  };
  useEffect(() => { load(); }, [id]);

  const seg = useMemo(() => segmentsOf(ch), [ch]);
  if (!ch) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const set = (k: string, v: any) => setCh((x: any) => ({ ...x, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { id: _i, created_at, updated_at, ...rest } = ch;
    rest.end_date = new Date(Date.parse(rest.start_date) + (Number(rest.days_count) - 1) * 86400000).toISOString().slice(0, 10);
    const { error } = await supabase.from('challenges').update(rest).eq('id', ch.id);
    setSaving(false);
    error ? toast.error(error.message) : toast.success('ذخیره شد');
  };

  const addDay = async () => {
    const n = (days[days.length - 1]?.day_number ?? 0) + 1;
    const { data, error } = await supabase.from('challenge_days').insert({ challenge_id: ch.id, day_number: n, title: `روز ${n}`, sort_order: n, review_mode: ch.ai_review_default ? 'ai' : 'auto' } as any).select('*').single();
    if (error) return toast.error(error.message);
    await supabase.from('challenge_variants').insert({ day_id: data.id, challenge_id: ch.id, key: 'fallback', title: 'همه مسیرها', is_fallback: true } as any);
    load();
  };
  const duplicateDay = async (d: any) => {
    const n = (days[days.length - 1]?.day_number ?? 0) + 1;
    const { id: _i, created_at, updated_at, ...rest } = d;
    const { data, error } = await supabase.from('challenge_days').insert({ ...rest, day_number: n, sort_order: n, title: `${d.title} (کپی)` }).select('*').single();
    if (error) return toast.error(error.message);
    const vs = variants.filter((v) => v.day_id === d.id).map(({ id: _v, created_at: _c, updated_at: _u, ...v }) => ({ ...v, day_id: data.id }));
    if (vs.length) await supabase.from('challenge_variants').insert(vs);
    load();
  };
  const deleteDay = async (d: any) => {
    if (!confirm(`روز ${d.day_number} و پیشرفت شرکت‌کنندگان در آن حذف شود؟`)) return;
    await supabase.from('challenge_days').delete().eq('id', d.id);
    load();
  };

  const tab = params.get('tab') || 'overview';
  return (
    <div dir="rtl" className="container mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon"><Link to="/enroll/admin/challenges"><ArrowRight className="h-4 w-4" /></Link></Button>
          <h1 className="text-xl font-bold">{ch.title}</h1>
          <Badge variant="secondary">{labelOf(STATUSES, ch.status)}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>به‌روزرسانی با JSON</Button>
          <Button variant="outline" onClick={async () => downloadJson(await exportChallengeJson(ch.id), `${ch.slug}.json`)}>خروجی JSON</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ذخیره تنظیمات'}</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t })} dir="rtl">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">تنظیمات</TabsTrigger>
          <TabsTrigger value="days">روزها و ماموریت‌ها</TabsTrigger>
          <TabsTrigger value="rules">امتیاز، جایزه، جریمه</TabsTrigger>
          <TabsTrigger value="notifications">اعلان و پیگیری</TabsTrigger>
          <TabsTrigger value="applications">درخواست‌ها</TabsTrigger>
          <TabsTrigger value="participants">شرکت‌کننده‌ها</TabsTrigger>
          <TabsTrigger value="preview">پیش‌نمایش و پوشش</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card><CardContent className="grid gap-4 p-5 md:grid-cols-2">
            <F label="عنوان"><Input value={ch.title} onChange={(e) => set('title', e.target.value)} /></F>
            <F label="نامک (slug)"><Input dir="ltr" value={ch.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></F>
            <F label="توضیحات" className="md:col-span-2"><Textarea value={ch.description ?? ''} onChange={(e) => set('description', e.target.value)} /></F>
            <F label="تصویر کاور (URL)"><Input dir="ltr" value={ch.cover_image ?? ''} onChange={(e) => set('cover_image', e.target.value)} /></F>
            <F label="وضعیت">
              <Select value={ch.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="تاریخ شروع (میلادی)"><Input type="date" value={ch.start_date} onChange={(e) => set('start_date', e.target.value)} /></F>
            <F label="تعداد روز"><Input type="number" value={ch.days_count} onChange={(e) => set('days_count', Number(e.target.value))} /></F>
            <F label="ددلاین پیش‌فرض ماموریت روزانه (وقت تهران)"><Input dir="ltr" value={ch.default_deadline_time} onChange={(e) => set('default_deadline_time', e.target.value)} /></F>
            <F label="دوره‌های مجاز">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={ch.eligible_all_boundless} onCheckedChange={(v) => set('eligible_all_boundless', !!v)} />همه کدهای بدون مرز ۱ تا ۱۰</label>
                <div className="max-h-32 space-y-1 overflow-auto rounded border p-2">
                  {courses.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs">
                      <Checkbox checked={(ch.eligible_course_ids || []).includes(c.id)} onCheckedChange={(v) => set('eligible_course_ids', v ? [...(ch.eligible_course_ids || []), c.id] : (ch.eligible_course_ids || []).filter((x: string) => x !== c.id))} />{c.title}
                    </label>
                  ))}
                </div>
              </div>
            </F>
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              {[['gamification_enabled', 'گیمیفیکیشن'], ['streak_enabled', 'استریک'], ['leaderboard_enabled', 'لیدربورد'], ['notifications_enabled', 'اعلان‌ها'], ['ai_review_default', 'بررسی AI (پیش‌فرض)'], ['coach_review_default', 'بررسی مربی (پیش‌فرض)'], ['unlock_next_on_complete', 'باز شدن روز بعد پس از انجام ماموریت'], ['allow_late_submission', 'ارسال ماموریت روزهای گذشته'], ['allow_join_after_start', 'پذیرش عضویت پس از شروع (روزهای قبل از عضویت: رد شده)'], ['require_messenger_activation', 'الزام فعال‌سازی ربات و پشتیبانی تلگرام'], ['require_coach_approval', 'نیاز به تایید مربی پس از آنبوردینگ']].map(([k, l]) => (
                <label key={k} className="flex items-center justify-between rounded-lg border p-3 text-sm">{l}<Switch checked={!!ch[k]} onCheckedChange={(v) => set(k, v)} /></label>
              ))}
            </div>
            <F label="ایمیل مربی (دریافت و تایید درخواست‌ها)"><Input dir="ltr" value={ch.coach_email ?? ''} onChange={(e) => set('coach_email', e.target.value.trim())} placeholder="rezarafeie13@gmail.com" /></F>
            <F label="گزینه‌های پروفایل (segments) — JSON" className="md:col-span-2">
              <JsonField value={Object.keys(ch.segments || {}).length ? ch.segments : seg} onChange={(v) => set('segments', v)} rows={6} />
            </F>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="days" className="space-y-3">
          <div className="flex justify-between"><p className="text-sm text-muted-foreground">{days.length} روز از {ch.days_count}</p><Button onClick={addDay}><Plus className="ml-1 h-4 w-4" />افزودن روز</Button></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((d) => {
              const vs = variants.filter((v) => v.day_id === d.id);
              return (
                <Card key={d.id} className="cursor-pointer hover:border-primary" onClick={() => setEditDay(d)}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between"><Badge>روز {d.day_number}</Badge><span className="text-xs text-muted-foreground">{labelOf(REVIEW_MODES, d.review_mode)} · {d.xp} XP</span></div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{vs.length} variant {vs.some((v) => v.is_fallback) ? '' : '· ⚠️ بدون پیش‌فرض'}</p>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => duplicateDay(d)}><Copy className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteDay(d)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card><CardContent className="space-y-4 p-5">
            <F label="قوانین امتیاز (on_time_bonus، streak_milestones)"><JsonField value={ch.xp_rules} onChange={(v) => set('xp_rules', v)} rows={4} /></F>
            <F label="جوایز — trigger.type: missions_completed | xp | streak | challenge_completed | complete_before_day | first_sale | revenue | custom"><JsonField value={ch.reward_rules} onChange={(v) => set('reward_rules', v)} rows={10} /></F>
            <F label="جریمه‌ها — action.type: lose_xp | reset_streak | warning | custom | pay_to_return (value = مبلغ دلار؛ {usd} در پیام) | lock_course (فقط در صورت تعریف صریح)"><JsonField value={ch.penalty_rules} onChange={(v) => set('penalty_rules', v)} rows={8} /></F>
            <p className="text-xs text-muted-foreground">بعد از ویرایش «ذخیره تنظیمات» را بزنید.</p>
          </CardContent></Card>
          <PenalizedList ch={ch} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab ch={ch} set={set} />
        </TabsContent>

        <TabsContent value="applications">
          <Applications ch={ch} />
        </TabsContent>

        <TabsContent value="participants">
          <Participants ch={ch} seg={seg} days={days} />
        </TabsContent>

        <TabsContent value="preview">
          <PreviewTab ch={ch} seg={seg} days={days} variants={variants} assignments={assignments} forms={forms} />
        </TabsContent>
      </Tabs>

      {editDay && <DayDialog day={editDay} ch={ch} seg={seg} variants={variants.filter((v) => v.day_id === editDay.id)} assignments={assignments} forms={forms} onClose={() => { setEditDay(null); load(); }} />}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={() => { setImportOpen(false); load(); }} />
    </div>
  );
};

const F: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <div className={`space-y-1 ${className ?? ''}`}><Label className="text-xs">{label}</Label>{children}</div>
);

const JsonField: React.FC<{ value: any; onChange: (v: any) => void; rows?: number }> = ({ value, onChange, rows = 6 }) => {
  const [text, setText] = useState(JSON.stringify(value ?? null, null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <Textarea dir="ltr" rows={rows} className="font-mono text-xs" value={text}
        onChange={(e) => { setText(e.target.value); try { onChange(JSON.parse(e.target.value)); setErr(null); } catch (x: any) { setErr(x.message); } }} />
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
};

const NotificationsTab: React.FC<{ ch: any; set: (k: string, v: any) => void }> = ({ ch, set }) => {
  const ns = ch.notification_settings || {};
  const channels = { telegram_bot: true, telegram_business: true, bale: true, email: true, in_app: true, sms: false, ...(ns.channels || {}) };
  const setNs = (k: string, v: any) => set('notification_settings', { ...ns, [k]: v });
  const msgs = ch.messages || {};
  const setMsg = (kind: string, k: string, v: any) => set('messages', { ...msgs, [kind]: { ...(msgs[kind] || {}), [k]: v } });
  return (
    <div className="space-y-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">کانال‌ها</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {CHANNELS.map((c) => <label key={c.value} className="flex items-center justify-between rounded-lg border p-3 text-sm">{c.label}<Switch checked={!!channels[c.value]} onCheckedChange={(v) => setNs('channels', { ...channels, [c.value]: v })} /></label>)}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">پیگیری‌ها</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <F label="یادآوری‌ها — ساعت قبل از ددلاین (با کاما)">
            <Input dir="ltr" defaultValue={(ns.followups || [{ hours_before: 6 }, { hours_before: 2 }, { hours_before: 0.5 }]).map((f: any) => f.hours_before).join(', ')}
              onBlur={(e) => setNs('followups', e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0).sort((a, b) => a - b).map((h) => ({ hours_before: h })))} />
          </F>
          <F label="یادآوری عدم فعالیت پس از (ساعت، ۰ = خاموش)"><Input type="number" value={ns.inactive_hours ?? 48} onChange={(e) => setNs('inactive_hours', Number(e.target.value))} /></F>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">متن پیام‌ها</CardTitle>
        <p className="text-xs text-muted-foreground">خالی = متن پیش‌فرض. متغیرها: {'{name} {challenge_title} {day} {days_count} {mission_title} {deadline} {remaining_time} {xp} {streak} {reward} {progress} {feedback} {challenge_url} {mission_url}'}</p></CardHeader>
        <CardContent className="space-y-3">
          {EVENT_KINDS.map((k) => (
            <div key={k} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between"><span className="font-mono text-xs">{k}</span>
                <label className="flex items-center gap-2 text-xs">فعال<Switch checked={msgs[k]?.enabled !== false} onCheckedChange={(v) => setMsg(k, 'enabled', v)} /></label></div>
              <Input placeholder="عنوان" value={msgs[k]?.title ?? ''} onChange={(e) => setMsg(k, 'title', e.target.value || undefined)} />
              <Textarea rows={2} placeholder="متن" value={msgs[k]?.text ?? ''} onChange={(e) => setMsg(k, 'text', e.target.value || undefined)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const Multi: React.FC<{ label: string; opts: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }> = ({ label, opts, value, onChange }) => (
  <div>
    <p className="mb-1 text-xs font-semibold">{label} <span className="font-normal text-muted-foreground">{value.length ? '' : '(همه)'}</span></p>
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <label key={o.value} className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs ${value.includes(o.value) ? 'border-primary bg-primary/10' : ''}`}>
          <Checkbox checked={value.includes(o.value)} onCheckedChange={(c) => onChange(c ? [...value, o.value] : value.filter((x) => x !== o.value))} />{o.label}
        </label>
      ))}
    </div>
  </div>
);

const DayDialog: React.FC<{ day: any; ch: any; seg: Segments; variants: any[]; assignments: any[]; forms: any[]; onClose: () => void }> = ({ day, ch, seg, variants, assignments, forms, onClose }) => {
  const [d, setD] = useState<any>({ ...day });
  const [vs, setVs] = useState<any[]>(variants.map((v) => ({ ...v, _checklist: lines(v.checklist), _tips: lines(v.tips), _resources: lines(v.resources) })));
  const [busy, setBusy] = useState(false);
  const setV = (i: number, k: string, val: any) => setVs((l) => l.map((v, j) => (j === i ? { ...v, [k]: val } : v)));

  const duplicateAssignment = async (i: number) => {
    const src = vs[i].assignment_id;
    if (!src) return toast.error('ابتدا یک تمرین انتخاب کنید');
    const { data: a } = await supabase.from('assignments').select('*').eq('id', src).single();
    const { id: _i, created_at, updated_at, ...rest } = a as any;
    const { data, error } = await supabase.from('assignments').insert({ ...rest, title: `${rest.title} (چالش)`, lesson_id: null }).select('id').single();
    if (error) return toast.error(error.message);
    setV(i, 'assignment_id', data.id);
    window.open(`/admin/assignments/${data.id}`, '_blank');
  };

  const save = async () => {
    setBusy(true);
    try {
      const { id, created_at, updated_at, ...rest } = d;
      const { error } = await supabase.from('challenge_days').update(rest).eq('id', id);
      if (error) throw error;
      for (const v of vs) {
        const { _checklist, _tips, _resources, id: vid, created_at: _c, updated_at: _u, _new, ...row } = v;
        const payload = { ...row, checklist: toList(_checklist ?? ''), tips: toList(_tips ?? ''), resources: toResources(_resources ?? ''), day_id: day.id, challenge_id: ch.id };
        const r = vid && !_new ? await supabase.from('challenge_variants').update(payload).eq('id', vid) : await supabase.from('challenge_variants').insert(payload);
        if (r.error) throw r.error;
      }
      const removed = variants.filter((o) => !vs.some((v) => v.id === o.id)).map((o) => o.id);
      if (removed.length) await supabase.from('challenge_variants').delete().in('id', removed);
      toast.success('ذخیره شد'); onClose();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>روز {d.day_number}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <F label="شماره روز"><Input type="number" value={d.day_number} onChange={(e) => setD({ ...d, day_number: Number(e.target.value) })} /></F>
          <F label="عنوان"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></F>
          <F label="توضیح کوتاه"><Input value={d.short_description ?? ''} onChange={(e) => setD({ ...d, short_description: e.target.value })} /></F>
          <F label="هدف"><Input value={d.goal ?? ''} onChange={(e) => setD({ ...d, goal: e.target.value })} /></F>
          <F label="زمان تخمینی (دقیقه)"><Input type="number" value={d.estimated_minutes ?? ''} onChange={(e) => setD({ ...d, estimated_minutes: e.target.value ? Number(e.target.value) : null })} /></F>
          <F label="امتیاز (XP)"><Input type="number" value={d.xp} onChange={(e) => setD({ ...d, xp: Number(e.target.value) })} /></F>
          <F label="ساعت باز شدن (خالی=۰۰:۰۰)"><Input dir="ltr" value={d.unlock_time ?? ''} onChange={(e) => setD({ ...d, unlock_time: e.target.value || null })} /></F>
          <F label="ددلاین (ساعت تهران، خالی=پیش‌فرض چالش)"><Input dir="ltr" value={d.deadline_time ?? ''} onChange={(e) => setD({ ...d, deadline_time: e.target.value || null })} /></F>
          <F label="نوع بررسی">
            <Select value={d.review_mode} onValueChange={(v) => setD({ ...d, review_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REVIEW_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">اجباری<Switch checked={d.required} onCheckedChange={(v) => setD({ ...d, required: v })} /></label>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">پرسش به‌روزرسانی مرحله<Switch checked={d.stage_update_enabled} onCheckedChange={(v) => setD({ ...d, stage_update_enabled: v })} /></label>
          {d.stage_update_enabled && (
            <>
              <F label="متن پرسش مرحله"><Input value={d.stage_update_prompt ?? ''} onChange={(e) => setD({ ...d, stage_update_prompt: e.target.value })} /></F>
              <F label="مرحله پیشنهادی">
                <Select value={d.stage_update_suggest ?? ''} onValueChange={(v) => setD({ ...d, stage_update_suggest: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{seg.stages.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </F>
            </>
          )}
          <F label="یادآوری‌های اختصاصی این روز (ساعت قبل ددلاین، با کاما؛ خالی = پیش‌فرض)" className="md:col-span-2">
            <Input dir="ltr" defaultValue={(d.followups || []).map((f: any) => f.hours_before).join(', ')}
              onBlur={(e) => { const l = e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0); setD({ ...d, followups: l.length ? l.map((h) => ({ hours_before: h })) : null }); }} />
          </F>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Variantها</h3>
            <Button size="sm" variant="outline" onClick={() => setVs((l) => [...l, { _new: true, key: `v${l.length + 1}`, title: '', business_models: [], stages: [], budgets: [], boundless_codes: [], priority: 0, is_fallback: false, _checklist: '', _tips: '', _resources: '' }])}><Plus className="ml-1 h-3 w-3" />افزودن</Button>
          </div>
          {vs.map((v, i) => (
            <Card key={v.id ?? i}><CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input className="max-w-xs" placeholder="عنوان variant" value={v.title ?? ''} onChange={(e) => setV(i, 'title', e.target.value)} />
                <label className="flex items-center gap-2 text-xs">پیش‌فرض (fallback)<Switch checked={v.is_fallback} onCheckedChange={(c) => setV(i, 'is_fallback', c)} /></label>
                <Input className="w-24" type="number" placeholder="اولویت" value={v.priority} onChange={(e) => setV(i, 'priority', Number(e.target.value))} />
                <Button size="icon" variant="ghost" onClick={() => setVs((l) => [...l, { ...v, id: undefined, _new: true, key: `${v.key}-copy`, title: `${v.title ?? ''} (کپی)` }])}><Copy className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setVs((l) => l.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
              {!v.is_fallback && (
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-semibold">این ماموریت را نشان بده وقتی:</p>
                  <Multi label="کد دوره" opts={seg.boundless_codes} value={v.boundless_codes || []} onChange={(x) => setV(i, 'boundless_codes', x)} />
                  <Multi label="مدل کسب‌وکار" opts={seg.business_models} value={v.business_models || []} onChange={(x) => setV(i, 'business_models', x)} />
                  <Multi label="مرحله" opts={seg.stages} value={v.stages || []} onChange={(x) => setV(i, 'stages', x)} />
                  <Multi label="بودجه" opts={seg.budgets} value={v.budgets || []} onChange={(x) => setV(i, 'budgets', x)} />
                </div>
              )}
              <div className="grid gap-2 md:grid-cols-2">
                <F label="دستورالعمل" className="md:col-span-2"><Textarea value={v.instructions ?? ''} onChange={(e) => setV(i, 'instructions', e.target.value)} /></F>
                <F label="چک‌لیست (هر خط یک مورد)"><Textarea rows={3} value={v._checklist} onChange={(e) => setV(i, '_checklist', e.target.value)} /></F>
                <F label="نکته‌ها (هر خط یک مورد)"><Textarea rows={3} value={v._tips} onChange={(e) => setV(i, '_tips', e.target.value)} /></F>
                <F label="مثال"><Textarea rows={2} value={v.example ?? ''} onChange={(e) => setV(i, 'example', e.target.value)} /></F>
                <F label="منابع (هر خط: عنوان|لینک)"><Textarea dir="ltr" rows={2} value={v._resources} onChange={(e) => setV(i, '_resources', e.target.value)} /></F>
                <F label="نتیجه مورد انتظار" className="md:col-span-2"><Input value={v.expected_result ?? ''} onChange={(e) => setV(i, 'expected_result', e.target.value)} /></F>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <F label="ارسال با تمرین موجود">
                  <div className="flex gap-1">
                    <Select value={v.assignment_id ?? 'none'} onValueChange={(x) => setV(i, 'assignment_id', x === 'none' ? null : x)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="none">— بدون تمرین —</SelectItem>{assignments.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}{a.status !== 'published' ? ' (منتشر نشده)' : ''}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" title="کپی و ویرایش در ویرایشگر تمرین" onClick={() => duplicateAssignment(i)}>کپی</Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open('/admin/assignments/new', '_blank')}>جدید</Button>
                  </div>
                </F>
                <F label="یا با فرم موجود">
                  <Select value={v.form_id ?? 'none'} onValueChange={(x) => setV(i, 'form_id', x === 'none' ? null : x)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">— بدون فرم —</SelectItem>{forms.map((f) => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}</SelectContent>
                  </Select>
                </F>
              </div>
            </CardContent></Card>
          ))}
        </div>
        <Button className="mt-4 w-full" onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ذخیره روز'}</Button>
      </DialogContent>
    </Dialog>
  );
};

const Participants: React.FC<{ ch: any; seg: Segments; days: any[] }> = ({ ch, seg, days }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: parts }, { data: prog }, { data: metrics }] = await Promise.all([
      supabase.from('challenge_participants').select('*').eq('challenge_id', ch.id).limit(2000),
      supabase.from('challenge_progress').select('participant_id, status').eq('challenge_id', ch.id).limit(20000),
      supabase.from('challenge_daily_metrics').select('participant_id, sales, revenue').eq('challenge_id', ch.id).limit(20000),
    ]);
    const ids = (parts || []).map((p) => p.user_id);
    const { data: users } = ids.length ? await supabase.from('chat_users').select('id, name, full_name, phone').in('id', ids.slice(0, 1000)) : { data: [] as any[] };
    const u = new Map((users || []).map((x: any) => [x.id, x]));
    setRows((parts || []).map((p) => {
      const pr = (prog || []).filter((x) => x.participant_id === p.id);
      const m = (metrics || []).filter((x) => x.participant_id === p.id);
      const c = (s: string) => pr.filter((x) => x.status === s).length;
      return {
        ...p, user: u.get(p.user_id), completed: c('completed'), missed: c('missed'), pending: c('pending_review') + c('pending_ai'), revision: c('needs_revision'),
        progress: Math.round((c('completed') / Math.max(1, ch.days_count)) * 100),
        sales: m.reduce((a, x) => a + Number(x.sales), 0), revenue: m.reduce((a, x) => a + Number(x.revenue), 0),
      };
    }));
    setLoading(false);
  };
  useEffect(() => { load(); }, [ch.id]);

  const filtered = rows.filter((r) =>
    (!f.code || r.boundless_code === f.code) && (!f.model || r.business_model === f.model) && (!f.stage || r.stage === f.stage) &&
    (!f.budget || r.budget === f.budget) &&
    (!f.review || (f.review === 'pending' ? r.pending > 0 : f.review === 'revision' ? r.revision > 0 : true)) &&
    (!f.progress || (f.progress === 'low' ? r.progress < 30 : f.progress === 'mid' ? r.progress >= 30 && r.progress < 70 : r.progress >= 70)) &&
    (!f.activity || (f.activity === 'inactive' ? Date.now() - Date.parse(r.last_activity_at) > 48 * 3600000 : Date.now() - Date.parse(r.last_activity_at) <= 48 * 3600000)));

  const FSel = ({ k, label, opts }: { k: string; label: string; opts: { value: string; label: string }[] }) => (
    <Select value={f[k] ?? 'all'} onValueChange={(v) => setF({ ...f, [k]: v === 'all' ? '' : v })}>
      <SelectTrigger className="w-40"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent><SelectItem value="all">{label}: همه</SelectItem>{opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <Card><CardContent className="space-y-3 p-4">
      <div className="flex flex-wrap gap-2">
        <FSel k="code" label="کد" opts={seg.boundless_codes} />
        <FSel k="model" label="مدل" opts={seg.business_models} />
        <FSel k="stage" label="مرحله" opts={seg.stages} />
        <FSel k="budget" label="بودجه" opts={seg.budgets} />
        <FSel k="progress" label="پیشرفت" opts={[{ value: 'low', label: 'زیر ۳۰٪' }, { value: 'mid', label: '۳۰ تا ۷۰٪' }, { value: 'high', label: 'بالای ۷۰٪' }]} />
        <FSel k="review" label="بررسی" opts={[{ value: 'pending', label: 'در انتظار بررسی' }, { value: 'revision', label: 'نیاز به اصلاح' }]} />
        <FSel k="activity" label="فعالیت" opts={[{ value: 'active', label: 'فعال' }, { value: 'inactive', label: 'غیرفعال (+۴۸ساعت)' }]} />
      </div>
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              {['نام', 'کد', 'مدل', 'مرحله', 'بودجه', 'روز', 'پیشرفت', 'XP', 'استریک', 'انجام', 'از دست', 'انتظار', 'اصلاح', 'فروش', 'درآمد', 'آخرین فعالیت'].map((h) => <TableHead key={h} className="whitespace-nowrap text-right">{h}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)}>
                  <TableCell className="whitespace-nowrap">{r.user?.full_name || r.user?.name || r.user_id}</TableCell>
                  <TableCell>{r.boundless_code}</TableCell>
                  <TableCell className="whitespace-nowrap">{labelOf(seg.business_models, r.business_model)}</TableCell>
                  <TableCell className="whitespace-nowrap">{labelOf(seg.stages, r.stage)}</TableCell>
                  <TableCell>{labelOf(seg.budgets, r.budget)}</TableCell>
                  <TableCell>{r.current_day}</TableCell>
                  <TableCell>{r.progress}%</TableCell>
                  <TableCell>{r.xp}</TableCell>
                  <TableCell>{r.streak}</TableCell>
                  <TableCell>{r.completed}</TableCell>
                  <TableCell>{r.missed}</TableCell>
                  <TableCell>{r.pending}</TableCell>
                  <TableCell>{r.revision}</TableCell>
                  <TableCell>{r.sales}</TableCell>
                  <TableCell>{r.revenue.toLocaleString('fa-IR')}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(r.last_activity_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">شرکت‌کننده‌ای نیست.</p>}
        </div>
      )}
      {open && <ParticipantDialog ch={ch} seg={seg} days={days} p={open} onClose={() => { setOpen(null); load(); }} />}
    </CardContent></Card>
  );
};

const ParticipantDialog: React.FC<{ ch: any; seg: Segments; days: any[]; p: any; onClose: () => void }> = ({ ch, seg, days, p, onClose }) => {
  const [prog, setProg] = useState<any[]>([]);
  const [fields, setFields] = useState<any>({ stage: p.stage, business_model: p.business_model, budget: p.budget, boundless_code: p.boundless_code });
  const [xp, setXp] = useState('');
  const load = async () => { const { data } = await supabase.from('challenge_progress').select('*').eq('participant_id', p.id).order('day_number'); setProg(data || []); };
  useEffect(() => { load(); }, [p.id]);
  const act = async (op: string, extra: Record<string, unknown> = {}) => {
    try { await challengeApi('admin_action', { challengeId: ch.id, participantId: p.id, op, ...extra }); toast.success('انجام شد'); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const Sel = ({ k, opts }: { k: string; opts: any[] }) => (
    <Select value={fields[k] ?? ''} onValueChange={(v) => setFields({ ...fields, [k]: v })}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{p.user?.full_name || p.user?.name || p.user_id} — {p.xp} XP · استریک {p.streak}</DialogTitle></DialogHeader>
        <div className="grid gap-2 md:grid-cols-4">
          <Sel k="boundless_code" opts={seg.boundless_codes} /><Sel k="business_model" opts={seg.business_models} /><Sel k="stage" opts={seg.stages} /><Sel k="budget" opts={seg.budgets} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => act('set_profile', { fields })}>ذخیره پروفایل</Button>
          <Input className="w-28" placeholder="± XP" value={xp} onChange={(e) => setXp(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => xp && act('adjust_xp', { amount: Number(xp) })}>اعمال XP</Button>
          <Button size="sm" variant="outline" onClick={() => act('sync')}>همگام‌سازی</Button>
          {p.profile?.payment_lock?.active && <Button size="sm" variant="destructive" onClick={() => act('waive_penalty')}>بخشیدن جریمه {p.profile.payment_lock.usd}$</Button>}
          {(ch.reward_rules || []).map((r: any) => <Button key={r.key ?? r.title} size="sm" variant="ghost" onClick={() => act('grant_reward', { rewardKey: r.key ?? r.title })}>🎁 {r.title}</Button>)}
        </div>
        {p.goal && <p className="text-sm"><b>هدف:</b> {p.goal}</p>}
        {(p.website || p.socials) && <p className="text-xs text-muted-foreground" dir="ltr">{p.website} {p.socials}</p>}
        <div className="space-y-1">
          {prog.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm">
              <span>روز {r.day_number}: {days.find((d) => d.id === r.day_id)?.title} — {PROGRESS_LABELS[r.status] ?? r.status}</span>
              <div className="flex gap-1">
                {r.assignment_id && <Button size="sm" variant="ghost" onClick={() => window.open(`/admin/assignments/${r.assignment_id}/submissions`, '_blank')}>بررسی</Button>}
                {r.status !== 'completed' && <Button size="sm" variant="ghost" onClick={() => act('mark_complete', { progressId: r.id })}>تکمیل</Button>}
                <Button size="sm" variant="ghost" onClick={() => act('reopen', { progressId: r.id, hours: 24 })}>بازگشایی</Button>
                <Button size="sm" variant="ghost" onClick={() => act('extend', { progressId: r.id, hours: 24 })}>+۲۴ساعت</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PreviewTab: React.FC<{ ch: any; seg: Segments; days: any[]; variants: any[]; assignments: any[]; forms: any[] }> = ({ seg, days, variants, assignments, forms }) => {
  const [p, setP] = useState<any>({ boundless_code: '1', business_model: seg.business_models[0]?.value, stage: seg.stages[0]?.value, budget: seg.budgets[0]?.value, day: days[0]?.day_number ?? 1 });
  const day = days.find((d) => d.day_number === Number(p.day));
  const r = day ? selectVariant(variants.filter((v) => v.day_id === day.id), p) : null;
  const cov = useMemo(() => coverage(days, variants, seg), [days, variants, seg]);
  const S = ({ k, opts }: { k: string; opts: any[] }) => (
    <Select value={String(p[k] ?? '')} onValueChange={(v) => setP({ ...p, [k]: v })}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <div className="space-y-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">پیش‌نمایش به‌عنوان دانشجو</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            <S k="boundless_code" opts={seg.boundless_codes} /><S k="business_model" opts={seg.business_models} /><S k="stage" opts={seg.stages} /><S k="budget" opts={seg.budgets} />
            <S k="day" opts={days.map((d) => ({ value: d.day_number, label: `روز ${d.day_number}` }))} />
          </div>
          {day && r?.variant ? (
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="font-bold">{day.title} → {r.variant.title || r.variant.key} {r.fallback && <Badge variant="secondary">پیش‌فرض</Badge>}</p>
              {r.variant.instructions && <p className="whitespace-pre-line">{r.variant.instructions}</p>}
              {(r.variant.checklist || []).length > 0 && <ul className="list-disc pr-5">{r.variant.checklist.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>}
              <p className="text-muted-foreground">ارسال: {r.variant.assignment_id ? `تمرین «${assignments.find((a) => a.id === r.variant.assignment_id)?.title ?? '?'}»` : r.variant.form_id ? `فرم «${forms.find((f) => f.id === r.variant.form_id)?.title ?? '?'}»` : 'بدون ارسال (دکمه انجام دادم)'} · {labelOf(REVIEW_MODES, day.review_mode)}</p>
            </div>
          ) : <p className="text-sm text-destructive">برای این ترکیب هیچ ماموریتی وجود ندارد.</p>}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">بررسی پوشش variantها</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {cov.map((c) => (
            <details key={c.day} className="rounded border p-2">
              <summary className="cursor-pointer">
                روز {c.day}: {c.title} — {c.noVariant ? '⛔ بدون variant' : c.noFallback && c.uncovered.length ? `⛔ ${c.uncovered.length} ترکیب بدون ماموریت` : c.uncovered.length ? `⚠️ ${c.uncovered.length} ترکیب از پیش‌فرض استفاده می‌کنند` : '✅ همه ترکیب‌ها پوشش دارند'}
              </summary>
              <ul className="mt-2 max-h-40 overflow-auto text-xs text-muted-foreground">{c.uncovered.slice(0, 100).map((u) => <li key={u}>{u}</li>)}</ul>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};


const Applications: React.FC<{ ch: any }> = ({ ch }) => {
  const [apps, setApps] = useState<any[] | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { const r: any = await challengeApi('admin_action', { challengeId: ch.id, op: 'list_applications' }); setApps(r.applications ?? []); }
    catch (e: any) { toast.error(e.message); setApps([]); }
  }, [ch.id]);
  useEffect(() => { load(); }, [load]);
  const act = async (id: string, op: 'approve' | 'reject') => {
    if (op === 'reject' && !reasons[id]?.trim()) { toast.error('دلیل رد را بنویسید'); return; }
    setBusy(id);
    try { await challengeApi('admin_action', { challengeId: ch.id, participantId: id, op, reason: reasons[id] }); toast.success(op === 'approve' ? 'تایید شد' : 'رد شد'); load(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };
  if (!apps) return <p className="p-6 text-center text-sm text-muted-foreground">در حال بارگذاری…</p>;
  if (!apps.length) return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">درخواستی ثبت نشده است.</CardContent></Card>;
  const label: Record<string, string> = { pending: 'در انتظار', approved: 'تایید شده', rejected: 'رد شده' };
  return (
    <div className="space-y-3">
      {apps.map((a) => (
        <Card key={a.id}><CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{a.summary?.[0]?.[1] ?? 'دانشجو'}</span>
            <Badge variant={a.approval_status === 'pending' ? 'default' : a.approval_status === 'rejected' ? 'destructive' : 'secondary'}>{label[a.approval_status] ?? a.approval_status}</Badge>
          </div>
          <dl className="grid gap-1 text-sm md:grid-cols-2">{(a.summary ?? []).map(([k, v]: any, i: number) => <div key={i} className="flex gap-2"><dt className="shrink-0 text-muted-foreground">{k}:</dt><dd className="break-words">{String(v)}</dd></div>)}</dl>
          {a.approval_status === 'rejected' && a.rejection_reason && <p className="text-sm text-destructive">دلیل رد: {a.rejection_reason}</p>}
          {a.approval_status !== 'approved' && (
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="دلیل رد (برای دانشجو ارسال می‌شود)" value={reasons[a.id] ?? ''} onChange={(e) => setReasons({ ...reasons, [a.id]: e.target.value })} />
              <Button disabled={busy === a.id} onClick={() => act(a.id, 'approve')}>تایید</Button>
              <Button variant="destructive" disabled={busy === a.id} onClick={() => act(a.id, 'reject')}>رد</Button>
            </div>
          )}
        </CardContent></Card>
      ))}
    </div>
  );
};

export default ChallengeBuilder;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CheckCircle2, Clock, Flame, Gift, Loader2, Target, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AssignmentSection } from '@/components/Assignment/AssignmentSection';
import RewardValue from '@/components/Gamification/RewardValue';
import { challengeApi, labelOf, PROGRESS_LABELS, segmentsOf } from '@/lib/challenge/schema';

const faNum = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString('fa-IR');
const remaining = (iso?: string | null) => {
  if (!iso) return '';
  const ms = Date.parse(iso) - Date.now();
  if (ms <= 0) return 'پایان یافته';
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${faNum(d)} روز و ${faNum(h % 24)} ساعت`;
  if (h > 0) return `${faNum(h)} ساعت و ${faNum(m % 60)} دقیقه`;
  return `${faNum(m)} دقیقه`;
};

const Countdown: React.FC<{ to?: string | null }> = ({ to }) => {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((v) => v + 1), 30000); return () => clearInterval(t); }, []);
  return <span>{remaining(to)}</span>;
};

const List: React.FC<{ title: string; items?: any[] }> = ({ title, items }) =>
  items && items.length ? (
    <div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((x, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{typeof x === 'string' ? x : x.title ?? JSON.stringify(x)}</span></li>)}
      </ul>
    </div>
  ) : null;

const ChallengePage: React.FC = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const isPreview = params.get('preview') === '1';
  const ident = useMemo(() => ({ userId: user?.id, email: (user as any)?.email, slug }), [user?.id, slug]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async (action = 'get') => {
    if (action === 'get') setLoading(true);
    try { setErrorMsg(null); setState(await challengeApi(action, { ...ident, preview: isPreview })); }
    catch (e: any) { setErrorMsg(e.message); }
    finally { setLoading(false); }
  }, [ident, isPreview]);
  useEffect(() => { if (!authLoading) load(); }, [load, authLoading]);

  if (loading || authLoading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!state?.challenge) return <p dir="rtl" className="py-24 text-center text-muted-foreground">{errorMsg ?? 'چالش یافت نشد.'}</p>;
  if (state.preview) return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Card className="border-dashed"><CardContent className="p-4 text-sm text-muted-foreground">پیش‌نمایش پیش‌نویس — این چالش هنوز منتشر نشده و دانشجوها آن را نمی‌بینند.</CardContent></Card>
      <Card><CardContent className="space-y-3 p-5">
        <h1 className="text-xl font-bold">{state.challenge.title}</h1>
        {state.challenge.description && <p className="text-sm text-muted-foreground">{state.challenge.description}</p>}
        <ul className="space-y-1 text-sm">{(state.days || []).map((d: any) => <li key={d.id}>روز {faNum(d.day_number)}: {d.title}</li>)}</ul>
      </CardContent></Card>
    </div>
  );

  const ch = state.challenge;
  const seg = segmentsOf(ch);
  const p = state.participant;
  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try { setState(await challengeApi(action, { ...ident, ...extra })); return true; }
    catch (e: any) { toast.error(e.message); return false; }
    finally { setBusy(false); }
  };

  if (!p) return <Onboarding ch={ch} seg={seg} isAuthenticated={isAuthenticated} busy={busy} onJoin={(profile) => run('join', { profile })} />;

  const progress: any[] = state.progress || [];
  const openRow = progress.find((r) => ['available', 'started', 'needs_revision'].includes(r.status));
  const selectedDay = Number(params.get('day')) || openRow?.day_number || state.today;
  const current = progress.find((r) => r.day_number === selectedDay) ?? progress[progress.length - 1];
  const dayInfo = state.days.find((d: any) => d.day_number === current?.day_number);
  const isToday = current?.day_number === state.today;
  const canWork = current && ['available', 'started', 'needs_revision', 'submitted', 'pending_ai', 'pending_review', 'completed'].includes(current.status);

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* header */}
      <Card className="border-primary/20">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{ch.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {labelOf(seg.business_models, p.business_model)} · {labelOf(seg.stages, p.stage)} · {labelOf(seg.budgets, p.budget)}
              </p>
            </div>
            <Badge className="text-sm">{state.today < 1 ? 'به‌زودی' : `روز ${faNum(state.today)} از ${faNum(ch.days_count)}`}</Badge>
          </div>
          <Progress value={state.stats.progressPercent} />
          <div className="grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
            <Stat icon={<Flame className="h-4 w-4" />} label="استریک" value={`${faNum(p.streak)} روز`} />
            <Stat icon={<Zap className="h-4 w-4" />} label="امتیاز" value={faNum(p.xp)} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="انجام‌شده" value={`${faNum(state.stats.completed)} (از دست رفته ${faNum(state.stats.missed)})`} />
            <Stat icon={<Clock className="h-4 w-4" />} label="مانده" value={`${faNum(Math.max(0, ch.days_count - state.today))} روز`} />
          </div>
        </CardContent>
      </Card>

      {(ch.status === 'scheduled' || state.today < 1) && (
        <Card className="border-2 border-primary/30">
          <CardContent className="space-y-2 p-5 text-center">
            <p className="text-lg font-bold">چالش هنوز شروع نشده است</p>
            <p className="text-muted-foreground">شروع: {new Date(ch.start_date).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' })} · <Countdown to={state.days?.[0]?.available_at ?? ch.start_date} /> مانده</p>
            <p className="text-sm text-muted-foreground">ماموریت روز اول در روز شروع برایت باز می‌شود و از طریق تلگرام/ایمیل خبرت می‌کنیم.</p>
          </CardContent>
        </Card>
      )}
      {ch.status === 'paused' && <Card><CardContent className="p-5 text-center text-muted-foreground">چالش موقتاً متوقف شده است.</CardContent></Card>}

      {/* today's mission */}
      {current && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-primary" />{isToday ? 'ماموریت امروز' : `ماموریت روز ${faNum(current.day_number)}`}</CardTitle>
              <Badge variant="outline">{PROGRESS_LABELS[current.status] ?? current.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">{dayInfo?.title}</h2>
              {dayInfo?.goal && <p className="mt-1 text-sm text-muted-foreground">🎯 {dayInfo.goal}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {dayInfo?.estimated_minutes && <Badge variant="secondary">⏱ {faNum(dayInfo.estimated_minutes)} دقیقه</Badge>}
                <Badge variant="secondary">⚡ {faNum(dayInfo?.xp)} امتیاز</Badge>
                {current.deadline_at && !['completed', 'missed', 'skipped'].includes(current.status) && <Badge variant="secondary">⏰ <Countdown to={current.deadline_at} /></Badge>}
              </div>
            </div>

            {current.variant && (
              <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                {current.variant.instructions && <p className="whitespace-pre-line text-sm leading-7">{current.variant.instructions}</p>}
                <List title="چک‌لیست" items={current.variant.checklist} />
                <List title="نکته‌ها" items={current.variant.tips} />
                {current.variant.example && <div><p className="mb-1 text-sm font-semibold">مثال</p><p className="whitespace-pre-line text-sm text-muted-foreground">{current.variant.example}</p></div>}
                {current.variant.resources?.length > 0 && (
                  <div><p className="mb-1 text-sm font-semibold">منابع</p>
                    <ul className="space-y-1 text-sm">{current.variant.resources.map((r: any, i: number) => <li key={i}><a className="text-primary underline" href={r.url} target="_blank" rel="noreferrer">{r.title ?? r.url}</a></li>)}</ul>
                  </div>
                )}
                {current.variant.expected_result && <p className="text-sm"><span className="font-semibold">نتیجه مورد انتظار: </span>{current.variant.expected_result}</p>}
              </div>
            )}

            {canWork && current.assignment && (
              started || current.status !== 'available' ? (
                <AssignmentSection assignmentId={current.assignment_id} bare onChange={() => load('sync')} />
              ) : (
                <Button size="lg" className="h-14 w-full text-base font-bold" disabled={busy}
                  onClick={async () => { setStarted(true); await challengeApi('start', { ...ident, progressId: current.id }).catch(() => {}); }}>
                  شروع ماموریت امروز
                </Button>
              )
            )}
            {canWork && !current.assignment && current.form && current.status !== 'completed' && (
              <Button asChild size="lg" className="h-14 w-full text-base font-bold">
                <a href={`/f/${current.form.slug ?? current.form.id}`} target="_blank" rel="noreferrer" onClick={() => challengeApi('start', { ...ident, progressId: current.id }).catch(() => {})}>شروع ماموریت امروز</a>
              </Button>
            )}
            {canWork && !current.assignment && current.form && current.status !== 'completed' && (
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => run('sync')}>فرم را ارسال کردم، بررسی کن</Button>
            )}
            {canWork && !current.assignment && !current.form && ['available', 'started'].includes(current.status) && (
              <Button size="lg" className="h-14 w-full text-base font-bold" disabled={busy} onClick={() => run('complete_manual', { progressId: current.id })}>انجام دادم ✅</Button>
            )}
            {current.status === 'needs_revision' && <RevisionBox sub={current.submission} />}
            {current.status === 'pending_review' && <p className="rounded-lg bg-muted p-3 text-center text-sm">👤 در انتظار بررسی مربی</p>}
            {current.submission?.admin_feedback && (
              <div className="rounded-lg border p-3 text-sm"><p className="mb-1 font-semibold">بازخورد مربی {current.submission.score != null && `(امتیاز ${faNum(current.submission.score)})`}</p><p className="whitespace-pre-line text-muted-foreground">{current.submission.admin_feedback}</p></div>
            )}
            {current.status === 'missed' && <p className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">مهلت این ماموریت تمام شده است.</p>}

            {current.status === 'completed' && dayInfo?.stage_update_enabled && <StageUpdate seg={seg} p={p} day={dayInfo} busy={busy} onSave={(stage) => run('update_stage', { stage })} />}
          </CardContent>
        </Card>
      )}

      {/* timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">مسیر {faNum(ch.days_count)} روزه</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {state.days.map((d: any) => {
              const r = progress.find((x) => x.day_number === d.day_number);
              const icon = r ? (PROGRESS_LABELS[r.status] ?? '').split(' ')[0] : '🔒';
              const active = d.day_number === current?.day_number;
              return (
                <button key={d.id} disabled={!r} title={d.title}
                  onClick={() => { setStarted(false); setParams({ day: String(d.day_number) }); }}
                  className={`flex flex-col items-center rounded-lg border p-2 text-xs transition ${active ? 'border-primary bg-primary/10' : 'border-border'} ${r ? 'hover:border-primary' : 'opacity-50'}`}>
                  <span className="text-base">{icon}</span><span>{faNum(d.day_number)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Metrics state={state} busy={busy} onSave={(m) => run('report_metrics', { metrics: m })} />
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Gift className="h-4 w-4" />جوایز</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(state.rewards || []).length === 0 && <p className="text-sm text-muted-foreground">جایزه‌ای تعریف نشده است.</p>}
            {(state.rewards || []).map((r: any) => (
              <div key={r.key} className={`rounded-lg border p-3 ${r.earned ? 'border-primary/40 bg-primary/5' : 'opacity-60'}`}>
                <p className="text-sm font-medium">{r.emoji ?? '🎁'} {r.title} {r.earned ? '✅' : '🔒'}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                {r.earned && r.reward_value && <RewardValue type={r.reward_type} value={r.reward_value} />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {state.leaderboard && <Leaderboard lb={state.leaderboard} />}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" />اعلان‌های چالش</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(state.events || []).slice(0, 12).map((e: any) => (
            <Link key={e.id} to={e.link || '#'} className={`block rounded-lg border p-3 text-sm hover:border-primary ${e.read_at ? '' : 'border-primary/40'}`}
              onClick={() => challengeApi('read_events', ident).catch(() => {})}>
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</p>
            </Link>
          ))}
          {!(state.events || []).length && <p className="text-sm text-muted-foreground">هنوز اعلانی نیست.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg bg-muted p-3">
    <div className="mb-1 flex items-center justify-center gap-1 text-primary">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
    <p className="font-semibold">{value}</p>
  </div>
);

const toList = (v: any): string[] => (Array.isArray(v) ? v : v ? [v] : []).map((x: any) => (typeof x === 'string' ? x : x?.text ?? x?.title ?? JSON.stringify(x))).filter(Boolean);
const RevisionBox: React.FC<{ sub: any }> = ({ sub }) => {
  let fb = sub?.ai_feedback;
  if (typeof fb === 'string') { try { fb = JSON.parse(fb); } catch { fb = { summary: fb }; } }
  const fixes = fb ? [...toList(fb.required_changes), ...toList(fb.revisions), ...toList(fb.weaknesses), ...toList(fb.improvements)] : [];
  const steps = fb ? [...toList(fb.next_steps), ...toList(fb.nextSteps)] : [];
  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p className="font-bold text-destructive">🔄 این ماموریت نیاز به اصلاح دارد — دقیقاً این موارد را درست کن:</p>
      {sub?.admin_feedback && <div><p className="font-semibold">بازخورد مربی</p><p className="whitespace-pre-line text-muted-foreground">{sub.admin_feedback}</p></div>}
      <List title="موارد نیازمند اصلاح" items={fixes} />
      <List title="قدم‌های بعدی" items={steps} />
      {!sub?.admin_feedback && !fixes.length && !steps.length && fb?.summary && <p className="whitespace-pre-line text-muted-foreground">{fb.summary}</p>}
      {!sub?.admin_feedback && !fb && <p className="text-muted-foreground">جزئیات بازخورد در بخش تمرین پایین نمایش داده می‌شود.</p>}
      <p className="text-muted-foreground">پس از اصلاح، تمرین را دوباره ارسال کن.</p>
    </div>
  );
};

const Onboarding: React.FC<{ ch: any; seg: any; isAuthenticated: boolean; busy: boolean; onJoin: (p: any) => void }> = ({ ch, seg, isAuthenticated, busy, onJoin }) => {
  const [f, setF] = useState<any>({});
  const set = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: v }));
  const Pick = ({ k, label, opts }: { k: string; label: string; opts: any[] }) => (
    <div className="space-y-1"><Label>{label}</Label>
      <Select value={f[k] ?? ''} onValueChange={(v) => set(k, v)}>
        <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const ok = f.boundless_code && f.business_model && f.stage && f.budget;
  return (
    <div dir="rtl" className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">{ch.title}</h1>
        {ch.description && <p className="mt-2 whitespace-pre-line text-muted-foreground">{ch.description}</p>}
        <p className="mt-2 text-sm text-muted-foreground">{faNum(ch.days_count)} روز · شروع {new Date(ch.start_date).toLocaleDateString('fa-IR')}</p>
      </div>
      {!isAuthenticated ? (
        <Card><CardContent className="space-y-3 p-6 text-center"><p>برای شرکت در چالش وارد حساب کاربری شوید.</p><Button asChild><Link to={`/auth?redirect=/challenges/${ch.slug}`}>ورود</Link></Button></CardContent></Card>
      ) : !['scheduled', 'active'].includes(ch.status) ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">ثبت‌نام در این چالش بسته است.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">پروفایل کوتاه — ماموریت‌ها بر اساس همین شخصی‌سازی می‌شوند</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Pick k="boundless_code" label="کدام کد دوره بدون مرز؟" opts={seg.boundless_codes} />
            <Pick k="business_model" label="مدل کسب‌وکار" opts={seg.business_models} />
            <Pick k="stage" label="الان در چه مرحله‌ای هستی؟" opts={seg.stages} />
            <Pick k="budget" label="بودجه" opts={seg.budgets} />
            <div className="space-y-1"><Label>فروش/درآمد ماهانه فعلی (اختیاری)</Label><Input inputMode="numeric" value={f.monthly_revenue ?? ''} onChange={(e) => set('monthly_revenue', e.target.value)} /></div>
            <div className="space-y-1"><Label>هدف اصلی تو در این چالش</Label><Textarea value={f.goal ?? ''} onChange={(e) => set('goal', e.target.value)} /></div>
            <div className="space-y-1"><Label>وبسایت/لندینگ (اختیاری)</Label><Input dir="ltr" value={f.website ?? ''} onChange={(e) => set('website', e.target.value)} /></div>
            <div className="space-y-1"><Label>شبکه‌های اجتماعی (اختیاری)</Label><Input dir="ltr" value={f.socials ?? ''} onChange={(e) => set('socials', e.target.value)} /></div>
            <Button size="lg" className="w-full" disabled={!ok || busy} onClick={() => onJoin(f)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'شروع چالش'}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StageUpdate: React.FC<{ seg: any; p: any; day: any; busy: boolean; onSave: (s: string) => void }> = ({ seg, p, day, busy, onSave }) => {
  const [v, setV] = useState<string>(day.stage_update_suggest || p.stage || '');
  if (p.profile?.stage_history?.some((h: any) => h.at && h.to === v && h.from !== v) && v === p.stage) return null;
  return (
    <div className="space-y-3 rounded-lg border border-primary/30 p-4">
      <p className="font-semibold">{day.stage_update_prompt || 'الان در چه مرحله‌ای هستی؟'}</p>
      <p className="text-xs text-muted-foreground">مرحله فعلی: {labelOf(seg.stages, p.stage)}</p>
      <Select value={v} onValueChange={setV}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{seg.stages.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      <Button disabled={busy || v === p.stage} onClick={() => onSave(v)}>تأیید مرحله</Button>
    </div>
  );
};

const Metrics: React.FC<{ state: any; busy: boolean; onSave: (m: any) => void }> = ({ state, busy, onSave }) => {
  const t = state.stats.todayMetrics || {};
  const [m, setM] = useState<any>({ leads: t.leads ?? '', conversations: t.conversations ?? '', sales: t.sales ?? '', revenue: t.revenue ?? '' });
  const fields: [string, string][] = [['leads', 'لید'], ['conversations', 'گفتگو'], ['sales', 'فروش'], ['revenue', 'درآمد']];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">نتیجه امروز</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {fields.map(([k, l]) => (
            <div key={k} className="space-y-1"><Label className="text-xs">{l}</Label>
              <Input inputMode="numeric" value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value.replace(/[^\d.]/g, '') })} /></div>
          ))}
        </div>
        <Button className="w-full" disabled={busy} onClick={() => onSave(m)}>ثبت نتیجه</Button>
        <p className="text-xs text-muted-foreground">
          مجموع: {faNum(state.stats.leads)} لید · {faNum(state.stats.conversations)} گفتگو · {faNum(state.stats.sales)} فروش · {faNum(state.stats.revenue)} درآمد
        </p>
      </CardContent>
    </Card>
  );
};

const Leaderboard: React.FC<{ lb: any }> = ({ lb }) => {
  const tabs: [string, string, (v: any) => string][] = [
    ['xp', 'اجرا', (v) => `${faNum(v)} امتیاز`],
    ['streak', 'استمرار', (v) => `${faNum(v)} روز`],
    ['first_sale', 'اولین فروش', (v) => new Date(v).toLocaleDateString('fa-IR')],
    ['revenue_growth', 'رشد فروش', (v) => `+${faNum(v)}`],
  ];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4" />لیدربورد</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="xp" dir="rtl">
          <TabsList className="grid w-full grid-cols-4">{tabs.map(([k, l]) => <TabsTrigger key={k} value={k}>{l}</TabsTrigger>)}</TabsList>
          {tabs.map(([k, , fmt]) => (
            <TabsContent key={k} value={k} className="space-y-1">
              {lb[k].top.map((r: any, i: number) => (
                <div key={i} className={`flex justify-between rounded-md px-3 py-2 text-sm ${r.me ? 'bg-primary/10 font-semibold' : ''}`}>
                  <span>{faNum(i + 1)}. {r.name}</span><span>{fmt(r.value)}</span>
                </div>
              ))}
              {!lb[k].top.length && <p className="py-3 text-center text-sm text-muted-foreground">هنوز کسی نیست.</p>}
              {lb[k].myRank && <p className="pt-2 text-center text-xs text-muted-foreground">رتبه تو: {faNum(lb[k].myRank)} از {faNum(lb[k].total)}</p>}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChallengePage;

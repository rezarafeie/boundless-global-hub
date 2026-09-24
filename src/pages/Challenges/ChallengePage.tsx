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
import { ArrowLeft, ArrowRight, Bell, CheckCircle2, Clock, Flame, Gift, Hash, ListChecks, Loader2, MessageSquare, Target, Trophy, Type, Zap } from 'lucide-react';
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

const segmentsWithOnboarding = (challenge: any, onboardingForm?: any) => {
  const segments = segmentsOf(challenge);
  const fields = Array.isArray(onboardingForm?.fields) ? onboardingForm.fields : [];
  const replaceLabels = (key: string, options: any[]) => {
    const field = fields.find((item: any) => item.field_key === key && item.field_type === 'dropdown');
    const labels = Array.isArray(field?.options) ? field.options : [];
    if (!labels.length) return options;
    return labels.map((item: any, index: number) => ({
      value: options[index]?.value ?? String(typeof item === 'object' && item ? item.value ?? item.label : item),
      label: String(typeof item === 'object' && item ? item.label ?? item.value : item),
    }));
  };
  return {
    ...segments,
    stages: replaceLabels('stage', segments.stages),
    budgets: replaceLabels('budget', segments.budgets),
    business_models: replaceLabels('business_model', segments.business_models),
    boundless_codes: replaceLabels('boundless_code', segments.boundless_codes),
  };
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

const PenaltyLock: React.FC<{ ident: any; slug: string; lock: any }> = ({ ident, slug, lock }) => {
  const [toman, setToman] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { challengeApi('penalty_price', ident).then((r: any) => setToman(r.toman ?? null)).catch(() => {}); }, [ident]);
  const pay = async () => {
    setBusy(true);
    try {
      const r: any = await challengeApi('penalty_pay', { ...ident, origin: window.location.origin, returnPath: `/challenges/${slug}` });
      window.location.href = r.paymentUrl;
    } catch (e: any) { toast.error(e.message); setBusy(false); }
  };
  return (
    <Card className="border-2 border-destructive/40">
      <CardContent className="space-y-3 p-5">
        <p className="font-bold text-destructive">چالش برای تو متوقف شده است</p>
        <p className="text-sm text-muted-foreground">{lock.reason ? String(lock.reason).replace(/\{usd\}/g, String(lock.usd)) : `یک روز از چالش را از دست دادی. برای بازگشت باید ${faNum(lock.usd)} دلار جریمه پرداخت کنی.`}</p>
        {Array.isArray(lock.refs) && lock.refs.length > 1 && <p className="text-sm text-muted-foreground">{faNum(lock.refs.length)} روز از دست رفته × {faNum(lock.unit_usd ?? 1)} دلار</p>}
        <p className="text-sm">مبلغ: <b>{faNum(lock.usd)} دلار</b>{toman ? ` (≈ ${faNum(toman)} تومان با نرخ امروز)` : ''}</p>
        <p className="text-xs text-muted-foreground">تا پرداخت جریمه، محتوای ماموریت‌ها نمایش داده نمی‌شود.</p>
        <p className="text-xs text-muted-foreground">پس از پرداخت، ماموریت از دست رفته ۲۴ ساعت دوباره برایت باز می‌شود.</p>
        <Button className="w-full sm:w-auto" disabled={busy} onClick={pay}>{busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}پرداخت جریمه و بازگشت به چالش</Button>
      </CardContent>
    </Card>
  );
};

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
  useEffect(() => {
    if (authLoading) return;
    const authority = params.get('Authority');
    if (params.get('penalty_paid') === '1' && authority && user?.id) {
      const ok = params.get('Status') === 'OK';
      setParams({}, { replace: true });
      if (!ok) { toast.error('پرداخت لغو شد'); load(); return; }
      setLoading(true);
      challengeApi('penalty_verify', { ...ident, authority })
        .then((r: any) => { setState(r); toast.success('پرداخت تایید شد، به چالش برگشتی!'); })
        .catch((e: any) => { toast.error(e.message); load(); })
        .finally(() => setLoading(false));
      return;
    }
    load();
  }, [load, authLoading]);

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
  const seg = segmentsWithOnboarding(ch, state.onboardingForm);
  const p = state.participant;
  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try { setState(await challengeApi(action, { ...ident, ...extra })); return true; }
    catch (e: any) { toast.error(e.message); return false; }
    finally { setBusy(false); }
  };

  if (!p) return <Onboarding ch={ch} seg={seg} onboardingForm={state.onboardingForm} isAuthenticated={isAuthenticated} busy={busy} onJoin={(profile) => run('join', { profile })} />;

  const progress: any[] = state.progress || [];
  const openRow = progress.find((r) => ['available', 'started', 'needs_revision'].includes(r.status));
  const selectedDay = Number(params.get('day')) || openRow?.day_number || state.today;
  const current = progress.find((r) => r.day_number === selectedDay) ?? progress[progress.length - 1];
  const dayInfo = state.days.find((d: any) => d.day_number === current?.day_number);
  const isToday = current?.day_number === state.today;
  const lateOk = !!ch.allow_late_submission;
  const canWork = !p.profile?.payment_lock?.active && current && ['available', 'started', 'needs_revision', 'submitted', 'pending_ai', 'pending_review', 'completed', ...(lateOk ? ['missed', 'skipped'] : [])].includes(current.status);

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

      {p.profile?.payment_lock?.active && <PenaltyLock ident={ident} slug={slug!} lock={p.profile.payment_lock} />}


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
      {current && !p.profile?.payment_lock?.active && (
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
            {canWork && !current.assignment && !current.form && ['available', 'started', ...(lateOk ? ['missed', 'skipped'] : [])].includes(current.status) && (
              <Button size="lg" className="h-14 w-full text-base font-bold" disabled={busy} onClick={() => run('complete_manual', { progressId: current.id })}>انجام دادم ✅</Button>
            )}
            {current.status === 'needs_revision' && <RevisionBox sub={current.submission} />}
            {current.status === 'pending_review' && <p className="rounded-lg bg-muted p-3 text-center text-sm">👤 در انتظار بررسی مربی</p>}
            {current.submission?.admin_feedback && (
              <div className="rounded-lg border p-3 text-sm"><p className="mb-1 font-semibold">بازخورد مربی {current.submission.score != null && `(امتیاز ${faNum(current.submission.score)})`}</p><p className="whitespace-pre-line text-muted-foreground">{current.submission.admin_feedback}</p></div>
            )}
            {['missed', 'skipped'].includes(current.status) && <p className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">{lateOk ? 'مهلت این ماموریت تمام شده، اما هنوز می‌توانی آن را ارسال کنی.' : 'مهلت این ماموریت تمام شده است.'}</p>}

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

type OnboardingQuestion = {
  key: string;
  label: string;
  type: 'text' | 'long_text' | 'number' | 'choice';
  required?: boolean;
  help?: string | null;
  options?: { value: string; label: string }[];
  answerKey?: string;
};

const mapLinkedOptions = (raw: unknown, canonical: any[]) => {
  const labels = Array.isArray(raw) ? raw.map((x) => String(typeof x === 'object' && x ? (x as any).label ?? (x as any).value : x)) : [];
  return labels.map((label, index) => ({ value: canonical[index]?.value ?? label, label }));
};

const Onboarding: React.FC<{ ch: any; seg: any; onboardingForm?: any; isAuthenticated: boolean; busy: boolean; onJoin: (p: any) => void }> = ({ ch, seg, onboardingForm, isAuthenticated, busy, onJoin }) => {
  const [f, setF] = useState<any>({});
  const [step, setStep] = useState(0);
  const set = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: v }));
  const linkedFields = Array.isArray(onboardingForm?.fields) ? onboardingForm.fields : [];
  const linkedKeys = new Set(linkedFields.map((field: any) => field.field_key));
  const standard: OnboardingQuestion[] = [
    { key: 'boundless_code', label: 'کدام کد دوره بدون مرز؟', type: 'choice', required: true, options: seg.boundless_codes },
    { key: 'business_model', label: 'مدل کسب‌وکار تو چیست؟', type: 'choice', required: true, options: seg.business_models },
    { key: 'stage', label: 'الان در چه مرحله‌ای هستی؟', type: 'choice', required: true, options: seg.stages },
    { key: 'budget', label: 'بودجه تو برای این مسیر چقدر است؟', type: 'choice', required: true, options: seg.budgets },
  ];
  const linked: OnboardingQuestion[] = linkedFields
    .filter((field: any) => !['message', 'ai_analysis'].includes(field.field_type))
    .map((field: any) => {
      const key = String(field.field_key || field.id);
      const canonical = key === 'stage' ? seg.stages : key === 'budget' ? seg.budgets : [];
      const choices = field.field_type === 'dropdown'
        ? (canonical.length ? mapLinkedOptions(field.options, canonical) : mapLinkedOptions(field.options, []))
        : undefined;
      return {
        key,
        answerKey: String(field.field_key || field.id),
        label: field.label,
        type: field.field_type === 'dropdown' ? 'choice' : field.field_type === 'long_text' ? 'long_text' : field.field_type === 'number' ? 'number' : 'text',
        required: !!field.required,
        help: field.help_text,
        options: choices,
      };
    });
  const extras: OnboardingQuestion[] = [
    { key: 'monthly_revenue', label: 'فروش/درآمد ماهانه فعلی (اختیاری)', type: 'number' },
    { key: 'goal', label: 'هدف اصلی تو در این چالش', type: 'long_text' },
    { key: 'website', label: 'وب‌سایت یا لندینگ (اختیاری)', type: 'text' },
    { key: 'socials', label: 'شبکه‌های اجتماعی (اختیاری)', type: 'text' },
  ];
  const questions = [
    ...standard.filter((question) => !linkedKeys.has(question.key)),
    ...linked,
    ...extras.filter((question) => !linkedKeys.has(question.key)),
  ];
  const current = step > 0 ? questions[step - 1] : undefined;
  const currentValid = step === 0 || !current?.required || String(f[current.key] ?? '').trim().length > 0;
  const requiredComplete = ['boundless_code', 'business_model', 'stage', 'budget'].every((key) => String(f[key] ?? '').trim());
  const submit = () => onJoin({
    ...f,
    onboarding_answers: Object.fromEntries(linked.map((question) => [question.answerKey ?? question.key, f[question.key] ?? null])),
  });
  return (
    <div dir="rtl" className="min-h-[calc(100dvh-5rem)] bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
      {!isAuthenticated ? (
        <Card><CardContent className="space-y-3 p-6 text-center"><p>برای شرکت در چالش وارد حساب کاربری شوید.</p><Button asChild><Link to={`/auth?redirect=/challenges/${ch.slug}`}>ورود</Link></Button></CardContent></Card>
      ) : !['scheduled', 'active'].includes(ch.status) ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">ثبت‌نام در این چالش بسته است.</CardContent></Card>
      ) : (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>گام {faNum(step + 1)} از {faNum(questions.length + 2)}</span><span>{faNum(Math.round((step / Math.max(1, questions.length + 1)) * 100))}٪</span>
            </div>
            <Progress value={(step / Math.max(1, questions.length + 1)) * 100} className="h-2" />
          </div>
          <Card className="border-2 shadow-lg">
            <CardContent className="flex min-h-[430px] flex-col p-6 md:p-10">
              <div className="flex-1">
                {step === 0 ? (
                  <div className="space-y-4 py-8 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"><MessageSquare className="h-10 w-10 text-primary" /></div>
                    <h1 className="text-3xl font-bold md:text-4xl">{onboardingForm?.title || ch.title}</h1>
                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{onboardingForm?.description || ch.description || 'چند سؤال کوتاه برای شخصی‌سازی ماموریت‌های چالش'}</p>
                    <p className="text-sm text-muted-foreground">پاسخ‌ها مسیر و ماموریت‌های مناسب تو را مشخص می‌کنند.</p>
                  </div>
                ) : current ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                        {current.type === 'choice' ? <ListChecks className="h-6 w-6 text-primary" /> : current.type === 'number' ? <Hash className="h-6 w-6 text-primary" /> : <Type className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1"><h2 className="text-xl font-bold leading-8 md:text-2xl">{current.label}{current.required && <span className="mr-1 text-destructive">*</span>}</h2>{current.help && <p className="mt-1 text-sm text-muted-foreground">{current.help}</p>}</div>
                    </div>
                    {current.type === 'choice' ? (
                      <div className="grid gap-2 pt-2">{(current.options || []).map((option) => <Button key={option.value} type="button" variant="outline" onClick={() => set(current.key, option.value)} className={`h-auto min-h-14 justify-start whitespace-normal px-4 py-3 text-right leading-7 ${f[current.key] === option.value ? 'border-primary bg-primary/10' : ''}`}>{option.label}</Button>)}</div>
                    ) : current.type === 'long_text' ? (
                      <Textarea rows={6} value={f[current.key] ?? ''} onChange={(e) => set(current.key, e.target.value)} className="text-base" autoFocus />
                    ) : (
                      <Input type={current.type === 'number' ? 'number' : 'text'} value={f[current.key] ?? ''} onChange={(e) => set(current.key, e.target.value)} className="h-14 text-lg" autoFocus />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center"><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" /><h2 className="text-2xl font-bold">بازبینی پاسخ‌ها</h2><p className="mt-1 text-sm text-muted-foreground">قبل از شروع چالش، پاسخ‌هایت را بررسی کن.</p></div>
                    <div className="max-h-[300px] space-y-2 overflow-y-auto">{questions.map((question) => {
                      const selected = question.options?.find((option) => option.value === f[question.key]);
                      return <div key={question.key} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{question.label}</p><p className="mt-1 whitespace-pre-wrap text-sm font-medium">{selected?.label || f[question.key] || '—'}</p></div>;
                    })}</div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 border-t pt-6">
                <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}><ArrowRight className="ml-1 h-4 w-4" />قبلی</Button>
                {step <= questions.length ? (
                  <Button size="lg" className="min-w-36" disabled={!currentValid || busy} onClick={() => setStep((s) => s + 1)}>{step === 0 ? 'شروع' : 'بعدی'}<ArrowLeft className="mr-1 h-4 w-4" /></Button>
                ) : (
                  <Button size="lg" className="min-w-36" disabled={!requiredComplete || busy} onClick={submit}>{busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}شروع چالش</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
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

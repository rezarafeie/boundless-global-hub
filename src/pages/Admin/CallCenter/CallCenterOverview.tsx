import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Timer, Clock,
  ListTodo, AlertTriangle, TrendingUp, Sparkles, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import { callCenter, formatDuration } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';

const KPI: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; tone?: string }> = ({ icon: Icon, label, value, tone }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${tone ?? 'bg-primary/10 text-primary'}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', month: '2-digit', day: '2-digit' });

const CallCenterOverview: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await callCenter.overview());
    } catch (e) {
      toast({ title: 'خطا در بارگذاری', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const res: any = await callCenter.syncNow();
      toast({ title: 'همگام‌سازی انجام شد', description: `${res.inserted} تماس جدید، ${res.updated} به‌روزرسانی` });
      load();
    } catch (e) {
      toast({ title: 'همگام‌سازی ناموفق', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;
  const k = data?.kpis ?? {};
  const series: any[] = data?.series ?? [];

  const byDay = new Map<string, any>();
  series.forEach((c) => {
    if (!c.started_at) return;
    const key = dayKey(c.started_at);
    const b = byDay.get(key) ?? { day: key, answered: 0, missed: 0, incoming: 0, outgoing: 0 };
    if (c.status === 'answered') b.answered++; else if (c.direction === 'incoming') b.missed++;
    if (c.direction === 'incoming') b.incoming++; else b.outgoing++;
    byDay.set(key, b);
  });
  const daily = [...byDay.values()].reverse();

  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}`, calls: 0 }));
  series.forEach((c) => {
    if (!c.started_at) return;
    const h = Number(new Date(c.started_at).toLocaleString('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }));
    if (!Number.isNaN(h)) byHour[h % 24].calls++;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">مرکز تماس</h2>
          <p className="text-sm text-muted-foreground">۳۰ روز گذشته</p>
        </div>
        <Button variant="outline" onClick={sync} disabled={syncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> همگام‌سازی
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPI icon={PhoneCall} label="کل تماس‌ها" value={k.total ?? 0} />
        <KPI icon={PhoneIncoming} label="ورودی" value={k.incoming ?? 0} tone="bg-blue-500/10 text-blue-600" />
        <KPI icon={PhoneOutgoing} label="خروجی" value={k.outgoing ?? 0} tone="bg-emerald-500/10 text-emerald-600" />
        <KPI icon={PhoneMissed} label="از دست رفته" value={k.missed ?? 0} tone="bg-red-500/10 text-red-600" />
        <KPI icon={TrendingUp} label="نرخ پاسخ" value={`${k.answerRate ?? 0}٪`} />
        <KPI icon={Timer} label="کل مکالمه" value={formatDuration(k.totalTalk)} />
        <KPI icon={Clock} label="میانگین مکالمه" value={formatDuration(k.avgTalk)} />
        <KPI icon={Clock} label="میانگین انتظار" value={formatDuration(k.avgWait)} tone="bg-amber-500/10 text-amber-600" />
        <KPI icon={ListTodo} label="پیگیری‌های باز" value={k.followupsDue ?? 0} />
        <KPI icon={AlertTriangle} label="پیگیری معوق" value={k.followupsOverdue ?? 0} tone="bg-red-500/10 text-red-600" />
        <KPI icon={TrendingUp} label="فروش با کمک تماس" value={k.assistedSales ?? 0} tone="bg-emerald-500/10 text-emerald-600" />
        <KPI icon={Sparkles} label="میانگین امتیاز AI" value={k.avgAiScore ?? '—'} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">درآمد منتسب به تماس تلفنی (Phone-assisted)</div>
          <div className="text-2xl font-bold">{Number(k.assistedRevenue ?? 0).toLocaleString('fa-IR')} تومان</div>
          <p className="text-xs text-muted-foreground mt-1">این عدد نشان‌دهندهٔ خریدهایی است که پس از تماس تلفنی رخ داده‌اند، نه لزوماً علت خرید.</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">روند تماس‌ها</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="answered" name="پاسخ داده شده" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="missed" name="از دست رفته" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">تماس‌ها بر اساس ساعت</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="hour" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="calls" name="تماس" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallCenterOverview;

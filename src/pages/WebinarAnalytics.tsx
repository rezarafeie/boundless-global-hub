import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Download, RefreshCw, Users, CheckCircle2, Radio, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Registration = { id: string; mobile_number: string; registered_at: string | null; created_at: string | null };
type Activation = { id: string; phone: string | null; status: string; telegram_chat_id: number; activated_at: string | null; created_at: string };

const PAGE_SIZE = 20;

const normPhone = (p?: string | null) => (p || '').replace(/\D/g, '').replace(/^98/, '0').replace(/^0?/, '0').slice(-11);

const fmt = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran',
    }).format(new Date(iso));
  } catch { return '—'; }
};

const WebinarAnalytics: React.FC = () => {
  const { webinarId } = useParams<{ webinarId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [webinar, setWebinar] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [followupLogs, setFollowupLogs] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState('all');
  const [page, setPage] = useState(1);

  const loadAll = async () => {
    if (!webinarId) return;
    setLoading(true);
    const fetchAll = async (table: string, orderCol: string) => {
      const CHUNK = 1000;
      const all: any[] = [];
      for (let from = 0; ; from += CHUNK) {
        const { data, error } = await supabase
          .from(table as any)
          .select('*')
          .eq('webinar_id', webinarId)
          .order(orderCol, { ascending: false })
          .range(from, from + CHUNK - 1);
        if (error) break;
        const batch = (data as any[]) || [];
        all.push(...batch);
        if (batch.length < CHUNK) break;
      }
      return all;
    };

    const [w, regs, acts, sign, parts, logs] = await Promise.all([
      supabase.from('webinar_entries').select('*').eq('id', webinarId).maybeSingle(),
      fetchAll('webinar_registrations', 'created_at'),
      fetchAll('webinar_support_activations', 'created_at'),
      fetchAll('webinar_signups', 'signup_time'),
      fetchAll('webinar_participants', 'created_at'),
      fetchAll('webinar_followup_log', 'created_at'),
    ]);

    setWebinar(w.data);
    setRegistrations(regs as Registration[]);
    setActivations(acts as Activation[]);
    setSignups(sign);
    setParticipants(parts);
    setFollowupLogs(logs);
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [webinarId]);

  const activationByPhone = useMemo(() => {
    const map = new Map<string, Activation>();
    for (const a of activations) {
      const key = normPhone(a.phone);
      if (!key) continue;
      const prev = map.get(key);
      if (!prev || (a.status === 'activated' && prev.status !== 'activated')) map.set(key, a);
    }
    return map;
  }, [activations]);

  const rows = useMemo(() => {
    return registrations.map((r) => {
      const key = normPhone(r.mobile_number);
      const act = activationByPhone.get(key) || null;
      const attended = signups.some((s) => normPhone(s.mobile_number) === key);
      return {
        ...r,
        registered: r.registered_at || r.created_at,
        activation: act,
        activated: act?.status === 'activated',
        attended,
      };
    });
  }, [registrations, activationByPhone, signups]);

  const stats = useMemo(() => {
    const total = rows.length;
    const started = rows.filter((r) => !!r.activation).length;
    const activated = rows.filter((r) => r.activated).length;
    const attended = rows.filter((r) => r.attended).length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    const delays = rows
      .filter((r) => r.activated && r.activation?.activated_at && r.registered)
      .map((r) => (new Date(r.activation!.activated_at!).getTime() - new Date(r.registered!).getTime()) / 6e4);
    const avgMin = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;
    return {
      total, started, activated, attended,
      startedPct: pct(started), activatedPct: pct(activated), attendedPct: pct(attended),
      avgMin,
      liveParticipants: participants.length,
      followupsSent: followupLogs.filter((l) => l.status === 'sent' || l.status === 'success').length,
      followupsFailed: followupLogs.filter((l) => l.status && !['sent', 'success'].includes(l.status)).length,
    };
  }, [rows, participants, followupLogs]);

  const daily = useMemo(() => {
    const map = new Map<string, { day: string; regs: number; acts: number }>();
    const dayKey = (iso?: string | null) => {
      if (!iso) return '';
      try {
        return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(iso));
      } catch { return ''; }
    };
    for (const r of rows) {
      const d = dayKey(r.registered);
      if (!d) continue;
      const e = map.get(d) || { day: d, regs: 0, acts: 0 };
      e.regs += 1;
      if (r.activated) e.acts += 1;
      map.set(d, e);
    }
    return Array.from(map.values()).slice(0, 14);
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (segment === 'activated') list = list.filter((r) => r.activated);
    if (segment === 'not_activated') list = list.filter((r) => !r.activated);
    if (segment === 'started_not_activated') list = list.filter((r) => r.activation && !r.activated);
    if (segment === 'attended') list = list.filter((r) => r.attended);
    if (q.trim()) {
      const s = q.trim();
      list = list.filter((r) => (r.mobile_number || '').includes(s));
    }
    return list;
  }, [rows, segment, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [q, segment]);

  const exportCsv = () => {
    const header = ['mobile', 'registered_at', 'activation_status', 'activated_at', 'telegram_chat_id', 'attended'];
    const lines = filtered.map((r) => [
      r.mobile_number,
      r.registered || '',
      r.activation?.status || 'none',
      r.activation?.activated_at || '',
      r.activation?.telegram_chat_id || '',
      r.attended ? 'yes' : 'no',
    ].join(','));
    const blob = new Blob(['\ufeff' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `webinar-analytics-${webinar?.slug || webinarId}.csv`;
    a.click();
    toast({ title: 'خروجی CSV آماده شد' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const StatCard = ({ title, value, sub, icon }: { title: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon}
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/enroll/admin/webinar')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">آنالیتیکس وبینار</h1>
          <p className="text-sm text-muted-foreground">{webinar?.title}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="h-4 w-4 ml-2" />
          بروزرسانی
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 ml-2" />
          CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard title="ثبت‌نام‌ها" value={stats.total} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="شروع فعال‌سازی" value={`${stats.started}`} sub={`${stats.startedPct}٪ از ثبت‌نام‌ها`} icon={<Send className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="پشتیبانی فعال شده" value={`${stats.activated}`} sub={`${stats.activatedPct}٪ از ثبت‌نام‌ها`} icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="ورود به وبینار" value={`${stats.attended}`} sub={`${stats.attendedPct}٪ از ثبت‌نام‌ها`} icon={<Radio className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="میانگین زمان تا فعال‌سازی" value={`${stats.avgMin} دقیقه`} />
        <StatCard title="شرکت‌کنندگان پخش زنده" value={stats.liveParticipants} />
        <StatCard title="پیگیری‌های ارسال شده" value={stats.followupsSent} />
        <StatCard title="پیگیری‌های ناموفق" value={stats.followupsFailed} />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">قیف تبدیل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'ثبت‌نام', value: stats.total, pct: 100 },
            { label: 'شروع فعال‌سازی پشتیبانی', value: stats.started, pct: stats.startedPct },
            { label: 'فعال‌سازی کامل پشتیبانی', value: stats.activated, pct: stats.activatedPct },
            { label: 'ورود به وبینار', value: stats.attended, pct: stats.attendedPct },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{s.label}</span>
                <span className="text-muted-foreground">{s.value} ({s.pct}٪)</span>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {daily.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">روند روزانه (۱۴ روز اخیر)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {daily.map((d) => (
                <div key={d.day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-muted-foreground">{d.day}</span>
                  <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (d.regs / Math.max(1, Math.max(...daily.map((x) => x.regs)))) * 100)}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-muted-foreground">{d.regs} ثبت‌نام / {d.acts} فعال</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">لیست ثبت‌نام و فعال‌سازی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Input placeholder="جستجوی شماره موبایل" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger className="md:max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="activated">پشتیبانی فعال شده</SelectItem>
                <SelectItem value="started_not_activated">شروع کرده ولی فعال نشده</SelectItem>
                <SelectItem value="not_activated">فعال نشده</SelectItem>
                <SelectItem value="attended">وارد وبینار شده</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-muted-foreground">
              {filtered.length} رکورد
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره موبایل</TableHead>
                  <TableHead>زمان ثبت‌نام</TableHead>
                  <TableHead>وضعیت پشتیبانی</TableHead>
                  <TableHead>زمان فعال‌سازی</TableHead>
                  <TableHead>چت تلگرام</TableHead>
                  <TableHead>ورود به وبینار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell dir="ltr">{r.mobile_number}</TableCell>
                    <TableCell>{fmt(r.registered)}</TableCell>
                    <TableCell>
                      {r.activated ? (
                        <Badge>فعال شده</Badge>
                      ) : r.activation ? (
                        <Badge variant="secondary">در انتظار</Badge>
                      ) : (
                        <Badge variant="outline">شروع نشده</Badge>
                      )}
                    </TableCell>
                    <TableCell>{fmt(r.activation?.activated_at)}</TableCell>
                    <TableCell dir="ltr">{r.activation?.telegram_chat_id || '—'}</TableCell>
                    <TableCell>{r.attended ? <Badge variant="secondary">بله</Badge> : '—'}</TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">رکوردی یافت نشد</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>قبلی</Button>
              <span className="text-sm text-muted-foreground">صفحه {currentPage} از {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>بعدی</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebinarAnalytics;

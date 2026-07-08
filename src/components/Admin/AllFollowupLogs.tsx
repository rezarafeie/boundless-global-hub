import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

type Log = {
  id: string;
  support_activation_id: string;
  course_id: string | null;
  user_id: number | null;
  stage: number | null;
  channel: string | null;
  status: string;
  error_message: string | null;
  payload: any;
  created_at: string;
  custom_followup_id: string | null;
};

const PAGE_SIZE = 100;

const AllFollowupLogs: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');
  const [stage, setStage] = useState<string>('all');
  const [courseId, setCourseId] = useState<string>('all');
  const [q, setQ] = useState('');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<Record<number, { name: string | null; phone: string | null; email: string | null }>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('support_activation_followup_log' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (status !== 'all') query = query.eq('status', status);
    if (channel !== 'all') query = query.eq('channel', channel);
    if (stage !== 'all') query = query.eq('stage', Number(stage));
    if (courseId !== 'all') query = query.eq('course_id', courseId);
    const { data } = await query;
    const list = (data as any as Log[]) || [];
    setLogs(list);
    // fetch user names for these logs
    const userIds = Array.from(new Set(list.map((l) => l.user_id).filter(Boolean))) as number[];
    if (userIds.length) {
      const { data: us } = await supabase
        .from('chat_users')
        .select('id, name, phone, email')
        .in('id', userIds);
      const map: any = {};
      (us || []).forEach((u: any) => { map[u.id] = { name: u.name, phone: u.phone, email: u.email }; });
      setUsers(map);
    } else {
      setUsers({});
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.from('courses').select('id, title').eq('is_active', true).order('title').then(({ data }) => {
      setCourses((data as any) || []);
    });
  }, []);

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status, channel, stage, courseId, limit]);

  const filtered = useMemo(() => {
    if (!q.trim()) return logs;
    const s = q.trim().toLowerCase();
    return logs.filter((l) => {
      const u = l.user_id ? users[l.user_id] : null;
      return (
        (u?.name || '').toLowerCase().includes(s) ||
        (u?.phone || '').toLowerCase().includes(s) ||
        (u?.email || '').toLowerCase().includes(s) ||
        (l.error_message || '').toLowerCase().includes(s) ||
        (l.channel || '').toLowerCase().includes(s) ||
        JSON.stringify(l.payload || {}).toLowerCase().includes(s)
      );
    });
  }, [logs, q, users]);

  const courseTitle = (id: string | null) => courses.find((c) => c.id === id)?.title || (id ? id.slice(0, 8) : '-');

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <CardTitle className="text-base flex items-center justify-between">
          <span>همه لاگ‌های پیگیری ({logs.length.toLocaleString('fa-IR')})</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="وضعیت" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="sent">ارسال شده</SelectItem>
                <SelectItem value="failed">ناموفق</SelectItem>
                <SelectItem value="skipped">رد شده</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="کانال" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کانال‌ها</SelectItem>
                <SelectItem value="telegram_bot_dm">ربات تلگرام</SelectItem>
                <SelectItem value="telegram_business">تلگرام Business</SelectItem>
                <SelectItem value="email">ایمیل</SelectItem>
                <SelectItem value="sms">پیامک</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="مرحله" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مراحل</SelectItem>
                <SelectItem value="1">مرحله ۱</SelectItem>
                <SelectItem value="2">مرحله ۲</SelectItem>
                <SelectItem value="3">مرحله ۳</SelectItem>
                <SelectItem value="0">سفارشی</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="دوره" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دوره‌ها</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="جستجو نام / تلفن / ایمیل / خطا" value={q} onChange={(e) => setQ(e.target.value)} className="w-[240px]" />
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />بروزرسانی
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>زمان</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>دوره</TableHead>
                  <TableHead>مرحله</TableHead>
                  <TableHead>کانال</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>جزئیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (<TableRow><TableCell colSpan={7} className="text-center py-6">در حال بارگذاری…</TableCell></TableRow>)}
                {!loading && filtered.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">لاگی یافت نشد</TableCell></TableRow>)}
                {filtered.map((l) => {
                  const u = l.user_id ? users[l.user_id] : null;
                  const isOpen = expanded === l.id;
                  return (
                    <React.Fragment key={l.id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpanded(isOpen ? null : l.id)}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString('fa-IR')}</TableCell>
                        <TableCell className="text-xs">
                          <div>{u?.name || (l.user_id ? `#${l.user_id}` : '-')}</div>
                          <div className="text-muted-foreground">{u?.phone || u?.email || ''}</div>
                        </TableCell>
                        <TableCell className="text-xs">{courseTitle(l.course_id)}</TableCell>
                        <TableCell className="text-xs">{l.custom_followup_id ? 'سفارشی' : (l.stage ?? '-')}</TableCell>
                        <TableCell className="text-xs">{l.channel || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={l.status === 'sent' ? 'default' : l.status === 'skipped' ? 'secondary' : 'destructive'}>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20">
                            {l.error_message && <div className="text-destructive text-xs mb-2">{l.error_message}</div>}
                            {l.payload && (
                              <pre className="text-[10px] bg-background border rounded p-2 overflow-x-auto max-h-64 whitespace-pre-wrap" dir="ltr">
{JSON.stringify(l.payload, null, 2)}
                              </pre>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {logs.length >= limit && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                بارگذاری بیشتر
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AllFollowupLogs;

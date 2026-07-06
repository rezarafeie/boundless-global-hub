import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Copy, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Row = {
  id: string;
  user_id: number;
  course_id: string;
  enrollment_id: string | null;
  activation_token: string;
  bot_deep_link: string;
  support_prefilled_link: string | null;
  status: string;
  telegram_username: string | null;
  opened_bot_at: string | null;
  clicked_support_button_at: string | null;
  activated_at: string | null;
  admin_note: string | null;
  created_at: string;
  chat_users?: { name: string | null; phone: string | null; email: string | null } | null;
  courses?: { title: string | null; slug: string | null } | null;
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  not_started: { label: 'شروع نشده', variant: 'outline' },
  opened_bot: { label: 'وارد ربات شده', variant: 'secondary' },
  clicked_support_button: { label: 'کلیک روی پشتیبانی', variant: 'secondary' },
  pending_manual_confirmation: { label: 'در انتظار تایید', variant: 'default' },
  activated: { label: 'فعال شد', variant: 'default' },
  needs_followup: { label: 'نیاز به پیگیری', variant: 'destructive' },
  failed: { label: 'ناموفق', variant: 'destructive' },
};

const SupportActivations: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [courseId, setCourseId] = useState<string>('all');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [q, setQ] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('support_activations' as any)
      .select('*, chat_users!support_activations_user_id_fkey(name,phone,email), courses(title,slug)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (status !== 'all') query = query.eq('status', status);
    if (courseId !== 'all') query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) {
      // fallback without joins if FK aliases mismatch
      const { data: d2 } = await supabase.from('support_activations' as any).select('*').order('created_at', { ascending: false }).limit(500);
      setRows((d2 as any) || []);
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.from('courses').select('id, title').eq('is_active', true).order('title').then(({ data }) => {
      setCourses((data as any) || []);
    });
  }, []);

  useEffect(() => {
    load();
  }, [status, courseId]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter((r) =>
      (r.chat_users?.name || '').toLowerCase().includes(s) ||
      (r.chat_users?.phone || '').toLowerCase().includes(s) ||
      (r.chat_users?.email || '').toLowerCase().includes(s) ||
      r.activation_token.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const setStatusRow = async (id: string, newStatus: string) => {
    const patch: any = { status: newStatus };
    if (newStatus === 'activated') patch.activated_at = new Date().toISOString();
    const { error } = await supabase.from('support_activations' as any).update(patch).eq('id', id);
    if (error) return toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    await supabase.from('support_activation_events' as any).insert({
      support_activation_id: id,
      event_type: newStatus === 'activated' ? 'manually_activated' : 'status_changed',
      payload_json: { status: newStatus },
    });
    toast({ title: 'وضعیت به‌روزرسانی شد' });
    load();
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} کپی شد` });
  };

  const regenerateToken = async (r: Row) => {
    const newToken = crypto.randomUUID().replace(/-/g, '');
    const { data: settings } = await supabase.from('admin_settings').select('telegram_bot_username' as any).eq('id', 1).maybeSingle();
    const bot = ((settings as any)?.telegram_bot_username || 'rafiei_bot').replace(/^@/, '');
    const bot_deep_link = `https://t.me/${bot}?start=sact_${newToken}`;
    const { error } = await supabase.from('support_activations' as any).update({
      activation_token: newToken,
      bot_deep_link,
      status: 'not_started',
      opened_bot_at: null,
      clicked_support_button_at: null,
      activated_at: null,
    }).eq('id', r.id);
    if (error) return toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    toast({ title: 'توکن بازتولید شد' });
    load();
  };

  const exportCsv = () => {
    const rows_ = filtered.map((r) => ({
      name: r.chat_users?.name ?? '',
      phone: r.chat_users?.phone ?? '',
      email: r.chat_users?.email ?? '',
      course: r.courses?.title ?? '',
      status: r.status,
      token: r.activation_token,
      opened_bot_at: r.opened_bot_at ?? '',
      clicked_at: r.clicked_support_button_at ?? '',
      activated_at: r.activated_at ?? '',
      created_at: r.created_at,
    }));
    const headers = Object.keys(rows_[0] || { name: '' });
    const csv = [headers.join(','), ...rows_.map((row) => headers.map((h) => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-activations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/enroll/admin')}>
            <ArrowRight className="h-4 w-4 ml-1" /> بازگشت
          </Button>
          <h1 className="text-2xl font-bold">فعال‌سازی پشتیبانی</h1>
        </div>
        <Button variant="outline" onClick={exportCsv}>خروجی CSV</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">فیلترها</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="وضعیت" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="دوره" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دوره‌ها</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="جستجو نام / تلفن / ایمیل / توکن" value={q} onChange={(e) => setQ(e.target.value)} className="w-[280px]" />
          <Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4 ml-1" />بروزرسانی</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>دوره</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تلگرام</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>اقدام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (<TableRow><TableCell colSpan={6} className="text-center py-6">در حال بارگذاری…</TableCell></TableRow>)}
              {!loading && filtered.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">موردی یافت نشد</TableCell></TableRow>)}
              {filtered.map((r) => {
                const meta = STATUS_LABELS[r.status] || { label: r.status, variant: 'outline' as const };
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{r.chat_users?.name || `#${r.user_id}`}</div>
                      <div className="text-xs text-muted-foreground">{r.chat_users?.phone} · {r.chat_users?.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.courses?.title || r.course_id.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {r.telegram_username ? `@${r.telegram_username}` : '-'}
                      <div className="text-muted-foreground">{r.opened_bot_at ? new Date(r.opened_bot_at).toLocaleString('fa-IR') : ''}</div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('fa-IR')}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.status !== 'activated' && (
                          <Button size="sm" onClick={() => setStatusRow(r.id, 'activated')}>
                            <CheckCircle2 className="h-3 w-3 ml-1" /> فعال کردن
                          </Button>
                        )}
                        {r.status !== 'needs_followup' && r.status !== 'activated' && (
                          <Button size="sm" variant="outline" onClick={() => setStatusRow(r.id, 'needs_followup')}>پیگیری</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => copy(r.bot_deep_link, 'لینک ربات')} title="کپی لینک ربات">
                          <Copy className="h-3 w-3" />
                        </Button>
                        {r.support_prefilled_link && (
                          <Button size="sm" variant="ghost" onClick={() => copy(r.support_prefilled_link!, 'پیام پشتیبانی')} title="کپی پیام پشتیبانی">
                            <Copy className="h-3 w-3 text-primary" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => regenerateToken(r)} title="بازتولید توکن">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportActivations;

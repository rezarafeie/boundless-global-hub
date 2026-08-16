import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Loader2, Send, RefreshCw, CalendarClock } from 'lucide-react';
import { adaptiveSchedule, formatTehran } from '@/lib/webinarAdaptiveSchedule';

interface WebinarFollowup {
  id: string;
  webinar_id: string;
  name: string;
  enabled: boolean;
  channel: 'bot' | 'business' | 'email' | 'sms';
  audience: 'registered' | 'attended' | 'registered_not_attended' | 'all';
  anchor: 'registration' | 'webinar_start' | 'attendance';
  delay_minutes: number;
  max_repeats: number;
  repeat_delay_minutes: number;
  email_subject: string | null;
  email_body: string | null;
  sms_text: string | null;
  sms_template_url: string | null;
  bot_text: string | null;
  schedule_mode: 'fixed' | 'adaptive';
  priority: number;
  min_interval_minutes: number;
  do_not_send_after_webinar_start: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  final_lead_minutes: number;
}

const DEFAULT_KAVENEGAR =
  'https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={webinar_title}&template=welcomefollowup';

interface Props { webinarId: string }

const WebinarFollowupsEditor: React.FC<Props> = ({ webinarId }) => {
  const [rows, setRows] = useState<WebinarFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [webinarStart, setWebinarStart] = useState<string | null>(null);
  const [previewDays, setPreviewDays] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    if (!webinarId) return;
    supabase
      .from('webinar_entries' as any)
      .select('start_date')
      .eq('id', webinarId)
      .maybeSingle()
      .then(({ data }) => setWebinarStart((data as any)?.start_date ?? null));
  }, [webinarId]);


  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('webinar_followups' as any)
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: true });
    setRows((data as any) || []);
    setLoading(false);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from('webinar_followup_log' as any)
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs((data as any) || []);
    setLogsLoading(false);
  };

  useEffect(() => { if (webinarId) { load(); loadLogs(); } }, [webinarId]);

  const addRow = async () => {
    if (creating) return;

    const cookieToken = document.cookie
      .split('; ')
      .find((item) => item.startsWith('session_token='))
      ?.split('=')
      .slice(1)
      .join('=');
    const sessionToken = localStorage.getItem('messenger_session_token') || cookieToken;

    if (!sessionToken) {
      toast({ title: 'نشست مدیریت پیدا نشد', description: 'لطفاً دوباره وارد پنل شوید.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await (supabase.rpc as any)('create_webinar_followup', {
        p_session_token: decodeURIComponent(sessionToken),
        p_webinar_id: webinarId,
      });
      if (error) throw error;
      if (!data) throw new Error('پیگیری ایجاد نشد');

      setRows(prev => [...prev, data as WebinarFollowup]);
      toast({ title: 'پیگیری جدید اضافه شد' });
    } catch (error: any) {
      toast({
        title: 'خطا در افزودن پیگیری',
        description: error?.message || 'لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getSessionToken = () => {
    const cookieToken = document.cookie
      .split('; ')
      .find((item) => item.startsWith('session_token='))
      ?.split('=')
      .slice(1)
      .join('=');
    const t = localStorage.getItem('messenger_session_token') || cookieToken;
    return t ? decodeURIComponent(t) : null;
  };

  const save = async (r: WebinarFollowup) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      toast({ title: 'نشست مدیریت پیدا نشد', description: 'لطفاً دوباره وارد پنل شوید.', variant: 'destructive' });
      return;
    }
    setSavingId(r.id);
    const { data, error } = await (supabase.rpc as any)('update_webinar_followup_v2', {
      p_session_token: sessionToken,
      p_id: r.id,
      p_name: r.name,
      p_enabled: r.enabled,
      p_channel: r.channel,
      p_audience: r.audience,
      p_anchor: r.anchor,
      p_delay_minutes: Number(r.delay_minutes) || 0,
      p_max_repeats: Number(r.max_repeats) || 1,
      p_repeat_delay_minutes: Number(r.repeat_delay_minutes) || 1440,
      p_email_subject: r.email_subject,
      p_email_body: r.email_body,
      p_sms_text: r.sms_text,
      p_sms_template_url: r.sms_template_url,
      p_bot_text: r.bot_text,
      p_schedule_mode: r.schedule_mode || 'fixed',
      p_priority: Number(r.priority) || 100,
      p_min_interval_minutes: Number(r.min_interval_minutes) || 30,
      p_do_not_send_after_webinar_start: r.do_not_send_after_webinar_start ?? true,
      p_quiet_hours_start: r.quiet_hours_start === null || r.quiet_hours_start === undefined ? null : Number(r.quiet_hours_start),
      p_quiet_hours_end: r.quiet_hours_end === null || r.quiet_hours_end === undefined ? null : Number(r.quiet_hours_end),
      p_final_lead_minutes: Number(r.final_lead_minutes) ?? 15,
    });

    setSavingId(null);
    if (error) { toast({ title: 'خطا', description: error.message, variant: 'destructive' }); return; }
    if (data) setRows(prev => prev.map(x => x.id === r.id ? (data as any) : x));
    toast({ title: 'ذخیره شد' });
  };

  const remove = async (id: string) => {
    if (!confirm('حذف این پیگیری؟')) return;
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      toast({ title: 'نشست مدیریت پیدا نشد', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase.rpc as any)('delete_webinar_followup', {
      p_session_token: sessionToken,
      p_id: id,
    });
    if (error) { toast({ title: 'خطا در حذف', description: error.message, variant: 'destructive' }); return; }
    setRows(prev => prev.filter(x => x.id !== id));
  };

  const sendTest = async (r: WebinarFollowup) => {
    setTestingId(r.id);
    try {
      const { data, error } = await supabase.functions.invoke('webinar-followup-test', {
        body: { followup_id: r.id, phone: testPhone[r.id] || undefined },
      });
      if (error) throw error;
      setTestResult(prev => ({ ...prev, [r.id]: data }));
      toast({ title: (data as any)?.ok ? 'ارسال تستی انجام شد' : 'ارسال ناموفق' });
      loadLogs();
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, [r.id]: { ok: false, error: e.message } }));
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    }
    setTestingId(null);
  };

  const patch = (id: string, p: Partial<WebinarFollowup>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...p } : r));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-semibold">پیگیری‌های وبینار</h5>
          <p className="text-xs text-muted-foreground">
            ارسال پیام پیگیری برای ثبت‌نام‌کننده‌ها یا شرکت‌کننده‌ها از طریق تلگرام (ربات / Business)، ایمیل یا پیامک.
          </p>
        </div>
        <Button type="button" size="sm" onClick={addRow} disabled={creating}>
          {creating ? <Loader2 className="h-3 w-3 ml-1 animate-spin" /> : <Plus className="h-3 w-3 ml-1" />}
          {creating ? 'در حال افزودن…' : 'افزودن'}
        </Button>
      </div>

      {loading && <div className="text-xs text-muted-foreground">در حال بارگذاری…</div>}
      {!loading && rows.length === 0 && <div className="text-xs text-muted-foreground">هنوز پیگیری ثبت نشده.</div>}

      {rows.map(r => (
        <div key={r.id} className="border rounded p-3 space-y-3 bg-muted/20">
          <div className="flex flex-wrap items-center gap-3">
            <Switch checked={r.enabled} onCheckedChange={(v) => patch(r.id, { enabled: v })} />
            <Input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} className="h-8 w-44" placeholder="نام" />

            <Select value={r.channel} onValueChange={(v) => patch(r.id, { channel: v as any })}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="business">تلگرام Business (چت شخصی)</SelectItem>
                <SelectItem value="bot">ربات تلگرام</SelectItem>
                <SelectItem value="email">ایمیل</SelectItem>
                <SelectItem value="sms">پیامک</SelectItem>
              </SelectContent>
            </Select>

            <Select value={r.audience} onValueChange={(v) => patch(r.id, { audience: v as any })}>
              <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">ثبت‌نام‌کننده‌ها</SelectItem>
                <SelectItem value="attended">شرکت‌کننده‌ها (حاضر)</SelectItem>
                <SelectItem value="registered_not_attended">ثبت‌نام کرده ولی غایب</SelectItem>
                <SelectItem value="all">همه</SelectItem>
              </SelectContent>
            </Select>

            <Select value={r.schedule_mode || 'fixed'} onValueChange={(v) => patch(r.id, { schedule_mode: v as any })}>
              <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">زمان‌بندی ثابت</SelectItem>
                <SelectItem value="adaptive">تطبیقی تا شروع وبینار</SelectItem>
              </SelectContent>
            </Select>

            {(r.schedule_mode || 'fixed') === 'fixed' && (
              <>
                <Select value={r.anchor} onValueChange={(v) => patch(r.id, { anchor: v as any })}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">بعد از ثبت‌نام</SelectItem>
                    <SelectItem value="webinar_start">بعد از شروع وبینار</SelectItem>
                    <SelectItem value="attendance">بعد از حضور در وبینار</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Label className="text-xs">تاخیر (دقیقه)</Label>
                  <Input type="number" value={r.delay_minutes} onChange={(e) => patch(r.id, { delay_minutes: Number(e.target.value) })} className="h-8 w-24" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">تکرار</Label>
                  <Input type="number" value={r.max_repeats} onChange={(e) => patch(r.id, { max_repeats: Number(e.target.value) })} className="h-8 w-16" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">فاصله تکرار (دقیقه)</Label>
                  <Input type="number" value={r.repeat_delay_minutes} onChange={(e) => patch(r.id, { repeat_delay_minutes: Number(e.target.value) })} className="h-8 w-24" />
                </div>
              </>
            )}

            {(r.schedule_mode || 'fixed') === 'adaptive' && (
              <>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">اولویت</Label>
                  <Input type="number" value={r.priority ?? 100} onChange={(e) => patch(r.id, { priority: Number(e.target.value) })} className="h-8 w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">حداقل فاصله (دقیقه)</Label>
                  <Input type="number" value={r.min_interval_minutes ?? 30} onChange={(e) => patch(r.id, { min_interval_minutes: Number(e.target.value) })} className="h-8 w-24" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">حداقل فاصله تا شروع (دقیقه)</Label>
                  <Input type="number" value={r.final_lead_minutes ?? 15} onChange={(e) => patch(r.id, { final_lead_minutes: Number(e.target.value) })} className="h-8 w-24" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">ساعات سکوت (از/تا)</Label>
                  <Input type="number" min={0} max={23} placeholder="—" value={r.quiet_hours_start ?? ''} onChange={(e) => patch(r.id, { quiet_hours_start: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-16" />
                  <Input type="number" min={0} max={23} placeholder="—" value={r.quiet_hours_end ?? ''} onChange={(e) => patch(r.id, { quiet_hours_end: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-16" />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">عدم ارسال بعد از شروع</Label>
                  <Switch checked={r.do_not_send_after_webinar_start ?? true} onCheckedChange={(v) => patch(r.id, { do_not_send_after_webinar_start: v })} />
                </div>
              </>
            )}


            <div className="mr-auto flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => save(r)} disabled={savingId === r.id}>
                {savingId === r.id ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Save className="h-3 w-3 ml-1" />} ذخیره
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </div>

          {r.channel === 'email' && (
            <div className="space-y-2">
              <Input value={r.email_subject || ''} onChange={(e) => patch(r.id, { email_subject: e.target.value })} placeholder="موضوع ایمیل" dir="rtl" />
              <Textarea rows={4} value={r.email_body || ''} onChange={(e) => patch(r.id, { email_body: e.target.value })} placeholder="متن ایمیل" dir="rtl" />
            </div>
          )}
          {r.channel === 'sms' && (
            <div className="space-y-2">
              <Textarea rows={2} value={r.sms_text || ''} onChange={(e) => patch(r.id, { sms_text: e.target.value })} placeholder="متن پیامک (در صورت خالی بودن قالب Kavenegar استفاده می‌شود)" dir="rtl" />
              <Textarea rows={2} value={r.sms_template_url || ''} onChange={(e) => patch(r.id, { sms_template_url: e.target.value })} placeholder="آدرس قالب Kavenegar (اختیاری)" dir="ltr" className="font-mono text-xs" />
            </div>
          )}
          {(r.channel === 'bot' || r.channel === 'business') && (
            <Textarea rows={4} value={r.bot_text || ''} onChange={(e) => patch(r.id, { bot_text: e.target.value })}
              placeholder={r.channel === 'business' ? 'متن پیام از چت شخصی (Telegram Business)' : 'متن پیام ربات تلگرام'} dir="rtl" />
          )}

          <p className="text-[10px] text-muted-foreground">
            متغیرها: {'{user_name}, {first_name}, {last_name}, {email}, {phone}, {webinar_title}, {webinar_date}, {webinar_time}, {webinar_link}, {webinar_host}, {telegram_channel}'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Input value={testPhone[r.id] || ''} onChange={(e) => setTestPhone(p => ({ ...p, [r.id]: e.target.value }))}
              placeholder="شماره تست (اختیاری)" className="h-8 w-44" dir="ltr" />
            <Button type="button" size="sm" variant="secondary" onClick={() => sendTest(r)} disabled={testingId === r.id}>
              {testingId === r.id ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Send className="h-3 w-3 ml-1" />} ارسال تستی
            </Button>
          </div>
          {testResult[r.id] && (
            <pre className="text-[10px] bg-background border rounded p-2 overflow-x-auto max-h-56 whitespace-pre-wrap" dir="ltr">
{JSON.stringify(testResult[r.id], null, 2)}
            </pre>
          )}
        </div>
      ))}

      {adaptiveRows.length > 0 && (
        <div className="border rounded p-3 space-y-2 bg-muted/10">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <h5 className="text-sm font-semibold">پیش‌نمایش زمان‌بندی تطبیقی</h5>
            <Label className="text-xs mr-2">کاربر چند روز قبل از وبینار ثبت‌نام کند؟</Label>
            <Input type="number" step="0.5" value={previewDays} onChange={(e) => setPreviewDays(Number(e.target.value))} className="h-8 w-20" />
          </div>
          {!webinarStart && <p className="text-xs text-muted-foreground">تاریخ شروع وبینار ثبت نشده است.</p>}
          {webinarStart && preview.length === 0 && (
            <p className="text-xs text-destructive">با این تنظیمات، زمانی برای ارسال باقی نمی‌ماند.</p>
          )}
          {webinarStart && preview.length > 0 && (
            <ol className="text-xs space-y-1">
              {preview.map((s, i) => (
                <li key={s.id} className="flex gap-2">
                  <span className="text-muted-foreground">پیگیری {i + 1}:</span>
                  <span className="font-medium">{s.name}</span>
                  <span className="mr-auto" dir="rtl">{formatTehran(s.at)}</span>
                </li>
              ))}
            </ol>
          )}
          {webinarStart && preview.length < adaptiveRows.length && (
            <p className="text-[11px] text-amber-600">
              با رعایت حداقل فاصله، فقط {preview.length} پیگیری از {adaptiveRows.length} پیگیری بر اساس اولویت ارسال می‌شود.
            </p>
          )}
        </div>
      )}



      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold">لاگ ارسال‌ها ({logs.length})</h5>
          <Button size="sm" variant="ghost" onClick={loadLogs} disabled={logsLoading}>
            <RefreshCw className={`h-4 w-4 ml-1 ${logsLoading ? 'animate-spin' : ''}`} /> بروزرسانی
          </Button>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>زمان</TableHead>
                <TableHead>شماره</TableHead>
                <TableHead>کانال</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>خطا</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">لاگی ثبت نشده</TableCell></TableRow>
              )}
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString('fa-IR')}</TableCell>
                  <TableCell className="text-xs" dir="ltr">{l.phone}</TableCell>
                  <TableCell className="text-xs">{l.channel}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'sent' ? 'default' : l.status === 'unreachable' ? 'secondary' : 'destructive'}>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px] max-w-[280px] truncate text-destructive" title={l.error_message || ''}>{l.error_message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default WebinarFollowupsEditor;

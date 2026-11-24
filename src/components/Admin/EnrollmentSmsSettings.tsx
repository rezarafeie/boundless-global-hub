import { useEffect, useState } from 'react';
import { MailCheck, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

type Settings = { welcome_enabled: boolean; activation_enabled: boolean; start_enabled: boolean; activation_delay_minutes: number; start_delay_minutes: number };
type Log = { kind: string; status: string; error_code: string | null; created_at: string };
const items = [
  { key: 'welcome_enabled', title: 'خوش‌آمدگویی و تأیید ثبت‌نام', template: 'rafieienrollmentwelcome', note: 'پس از ثبت‌نام موفق؛ یک‌بار، همراه لینک فعال‌سازی پشتیبانی' },
  { key: 'activation_enabled', title: 'یادآوری فعال‌سازی پشتیبانی', template: 'rafieisupportactivation', note: 'فقط تا قبل از فعال‌سازی پشتیبانی؛ یک‌بار', delay: 'activation_delay_minutes' },
  { key: 'start_enabled', title: 'یادآوری شروع آموزش', template: 'rafieicoursestart', note: 'پس از فعال‌سازی، تا قبل از شروع آموزش؛ یک‌بار با لینک ورود اختصاصی', delay: 'start_delay_minutes' },
] as const;

export default function EnrollmentSmsSettings({ courseId }: { courseId: string }) {
  const { token } = useAuth(); const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const call = async (body: unknown) => {
    const { data, error } = await supabase.functions.invoke('enrollment-sms', { body, headers: token ? { 'x-session-token': token } : undefined });
    if (error || data?.error) throw new Error(data?.error || 'اطلاعات پیامک دریافت نشد');
    return data;
  };
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    call({ action: 'get', course_id: courseId }).then(result => {
      if (cancelled) return;
      setSettings(result.data); setLogs(result.logs ?? []); setError('');
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [courseId, token]);
  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const clean: Settings = { welcome_enabled: settings.welcome_enabled, activation_enabled: settings.activation_enabled,
        start_enabled: settings.start_enabled, activation_delay_minutes: settings.activation_delay_minutes, start_delay_minutes: settings.start_delay_minutes };
      const result = await call({ action: 'save', course_id: courseId, settings: clean });
      setSettings(result.data); toast({ title: 'تنظیمات پیامک ذخیره شد' });
    } catch (e) { toast({ title: 'ذخیره انجام نشد', description: e instanceof Error ? e.message : '', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const statuses: Record<string, string> = { sent: 'ارسال‌شده', failed: 'ناموفق', skipped: 'متوقف‌شده', unknown: 'نیازمند بررسی', claimed: 'در حال بررسی' };
  return <section dir="rtl" className="space-y-4 border-b pb-6">
    <h3 className="flex items-center gap-2 text-base font-semibold"><MailCheck className="h-4 w-4" /> پیامک‌های ثبت‌نام و آموزش</h3>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!settings && !error && <Loader2 className="h-4 w-4 animate-spin" />}
    {settings && <>
      <div className="divide-y divide-border">{items.map(item => <div key={item.key} className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1"><Label htmlFor={item.key + courseId} className="font-semibold">{item.title}</Label>
            <p className="text-xs leading-6 text-muted-foreground">{item.note}</p>
            <p dir="ltr" className="text-right font-mono text-xs text-muted-foreground">{item.template}</p>
          </div>
          <Switch id={item.key + courseId} checked={settings[item.key]} onCheckedChange={value => setSettings(s => s ? { ...s, [item.key]: value } : s)} />
        </div>
        {'delay' in item && <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor={item.delay + courseId} className="text-xs text-muted-foreground">{item.key === 'start_enabled' ? 'دقیقه پس از فعال‌سازی' : 'دقیقه پس از ثبت‌نام'}</Label>
          <Input id={item.delay + courseId} type="number" min={0} max={43200} value={settings[item.delay]} onChange={e => setSettings(s => s ? { ...s, [item.delay]: Number(e.target.value) } : s)} className="h-8 w-24" />
        </div>}
      </div>)}</div>
      <Button type="button" variant="outline" size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره تنظیمات پیامک</Button>
      {!!logs.length && <details className="text-xs"><summary className="cursor-pointer py-2 text-muted-foreground">آخرین ارسال‌های پیامکی</summary>
        <div className="divide-y divide-border">{logs.map((log, i) => <div key={log.created_at + i} className="flex flex-wrap justify-between gap-2 py-2">
          <span>{log.kind === 'welcome' ? 'خوش‌آمدگویی' : log.kind === 'activation' ? 'فعال‌سازی' : 'شروع آموزش'} · {statuses[log.status] || log.status}</span>
          <time className="text-muted-foreground">{new Date(log.created_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</time>
          {log.error_code && <span className="w-full break-all text-muted-foreground" dir="ltr">{log.error_code}</span>}
        </div>)}</div>
      </details>}
    </>}
  </section>;
}
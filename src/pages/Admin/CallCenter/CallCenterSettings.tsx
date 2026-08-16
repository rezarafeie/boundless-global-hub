import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, PlugZap, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { callCenter, tehranDateTime } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';
import AgentExtensionsCard from '@/components/CallCenter/AgentExtensionsCard';

const TOGGLES: { key: string; label: string; hint?: string }[] = [
  { key: 'enabled', label: 'فعال بودن مرکز تماس' },
  { key: 'auto_sync_enabled', label: 'همگام‌سازی خودکار تماس‌ها' },
  { key: 'recording_sync_enabled', label: 'دریافت خودکار فایل ضبط' },
  { key: 'transcription_enabled', label: 'تبدیل خودکار گفتار به متن' },
  { key: 'ai_analysis_enabled', label: 'تحلیل هوشمند تماس' },
  { key: 'auto_lead_matching', label: 'تشخیص خودکار مشتری از روی شماره' },
  { key: 'auto_missed_call_followup', label: 'ایجاد خودکار پیگیری برای تماس از دست رفته' },
  { key: 'notifications_enabled', label: 'ارسال اعلان‌ها' },
];

const NUMBERS: { key: string; label: string }[] = [
  { key: 'sync_interval_minutes', label: 'فاصله همگام‌سازی (دقیقه)' },
  { key: 'attribution_window_days', label: 'بازه انتساب فروش (روز)' },
  { key: 'min_call_seconds_for_ai', label: 'حداقل مدت تماس برای تحلیل (ثانیه)' },
  { key: 'high_intent_threshold', label: 'آستانه قصد خرید بالا (۰ تا ۱۰۰)' },
];

const CallCenterSettings: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = () => callCenter.settings()
    .then(setState)
    .catch((e) => toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }));

  useEffect(() => { load(); }, []);

  const patch = (key: string, value: unknown) =>
    setState((s: any) => ({ ...s, settings: { ...s.settings, [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      await callCenter.saveSettings(state.settings);
      toast({ title: 'تنظیمات ذخیره شد' });
      load();
    } catch (e) {
      toast({ title: 'ذخیره ناموفق', description: (e as Error).message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res: any = await callCenter.testConnection();
      toast({ title: 'اتصال برقرار است', description: res.endpoint ? `اندپوینت: ${res.endpoint}` : undefined });
    } catch (e) {
      toast({ title: 'اتصال ناموفق', description: (e as Error).message, variant: 'destructive' });
    } finally { setTesting(false); }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res: any = await callCenter.syncNow();
      toast({ title: 'همگام‌سازی انجام شد', description: `${res.inserted} جدید / ${res.updated} به‌روزرسانی` });
      load();
    } catch (e) {
      toast({ title: 'همگام‌سازی ناموفق', description: (e as Error).message, variant: 'destructive' });
    } finally { setSyncing(false); }
  };

  if (!state) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">تنظیمات مرکز تماس</h2>
        <p className="text-sm text-muted-foreground">اتصال به دفتر شما و رفتار خودکار سیستم</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><PlugZap className="h-4 w-4" /> اتصال دفتر شما</CardTitle>
          <CardDescription>توکن API فقط در سرور نگهداری می‌شود و هرگز در مرورگر نمایش داده نمی‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">وضعیت توکن:</span>
            {state.tokenConfigured
              ? <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> پیکربندی شده</Badge>
              : <Badge variant="destructive">تنظیم نشده</Badge>}
          </div>
          <div className="grid gap-1 text-sm">
            <div><span className="text-muted-foreground">آخرین همگام‌سازی موفق: </span>{tehranDateTime(state.sync?.last_success_at)}</div>
            <div><span className="text-muted-foreground">آخرین تلاش: </span>{tehranDateTime(state.sync?.last_attempt_at)}</div>
            <div><span className="text-muted-foreground">تعداد تماس همگام‌شده: </span>{Number(state.sync?.calls_synced ?? 0).toLocaleString('fa-IR')}</div>
            {state.sync?.last_error && <div className="text-destructive text-xs">خطای اخیر: {state.sync.last_error}</div>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">آدرس Webhook (در پنل دفتر شما ثبت کنید)</Label>
            <div className="flex gap-2">
              <Input readOnly value={state.webhookUrl} dir="ltr" className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(state.webhookUrl); toast({ title: 'کپی شد' }); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={test} disabled={testing} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} تست اتصال
            </Button>
            <Button variant="outline" onClick={sync} disabled={syncing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> همگام‌سازی فوری
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">رفتار سیستم</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={t.key} className="text-sm font-normal">{t.label}</Label>
              <Switch id={t.key} checked={!!state.settings?.[t.key]} onCheckedChange={(v) => patch(t.key, v)} />
            </div>
          ))}
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">داخلی پیش‌فرض</Label>
              <Input dir="ltr" value={state.settings?.default_extension ?? ''} onChange={(e) => patch('default_extension', e.target.value)} />
            </div>
            {NUMBERS.map((n) => (
              <div key={n.key} className="space-y-1">
                <Label className="text-xs">{n.label}</Label>
                <Input type="number" dir="ltr" value={state.settings?.[n.key] ?? 0} onChange={(e) => patch(n.key, Number(e.target.value))} />
              </div>
            ))}
          </div>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره تنظیمات
          </Button>
        </CardContent>
      </Card>

      <AgentExtensionsCard />
    </div>
  );
};

export default CallCenterSettings;

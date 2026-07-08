import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import TestStageButton from './TestStageButton';

interface CustomFollowup {
  id: string;
  course_id: string;
  name: string;
  enabled: boolean;
  channel: 'bot' | 'email' | 'sms' | 'business';
  delay_minutes: number;
  max_repeats: number;
  repeat_delay_minutes: number;
  email_subject: string | null;
  email_body: string | null;
  sms_text: string | null;
  sms_template_url: string | null;
  bot_text: string | null;
  skip_if_activated: boolean;
}

const DEFAULT_KAVENEGAR = 'https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={course_title}&template=welcomefollowup';

interface Props { courseId: string }

const CustomFollowupsEditor: React.FC<Props> = ({ courseId }) => {
  const [rows, setRows] = useState<CustomFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_activation_custom_followups' as any)
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { if (courseId) load(); }, [courseId]);

  const addRow = async () => {
    const { data, error } = await supabase.from('support_activation_custom_followups' as any).insert({
      course_id: courseId,
      name: 'پیگیری جدید',
      channel: 'email',
      delay_minutes: 60,
      max_repeats: 1,
      repeat_delay_minutes: 1440,
      sms_template_url: DEFAULT_KAVENEGAR,
    }).select().single();
    if (error) { toast({ title: 'خطا', description: error.message, variant: 'destructive' }); return; }
    setRows(prev => [...prev, data as any]);
  };

  const save = async (r: CustomFollowup) => {
    setSavingId(r.id);
    const { error } = await supabase.from('support_activation_custom_followups' as any).update({
      name: r.name,
      enabled: r.enabled,
      channel: r.channel,
      delay_minutes: Number(r.delay_minutes) || 0,
      max_repeats: Number(r.max_repeats) || 1,
      repeat_delay_minutes: Number(r.repeat_delay_minutes) || 1440,
      email_subject: r.email_subject,
      email_body: r.email_body,
      sms_text: r.sms_text,
      sms_template_url: r.sms_template_url,
      bot_text: r.bot_text,
      skip_if_activated: r.skip_if_activated,
    }).eq('id', r.id);
    setSavingId(null);
    if (error) { toast({ title: 'خطا', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'ذخیره شد' });
  };

  const remove = async (id: string) => {
    if (!confirm('حذف این پیگیری؟')) return;
    await supabase.from('support_activation_custom_followups' as any).delete().eq('id', id);
    setRows(prev => prev.filter(x => x.id !== id));
  };

  const patch = (id: string, p: Partial<CustomFollowup>) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...p } : r));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-semibold">پیگیری‌های سفارشی (زمان‌بندی آزاد)</h5>
          <p className="text-xs text-muted-foreground">ارسال پیگیری در زمان دلخواه (از لحظه خرید) از طریق ربات، ایمیل یا پیامک — مستقل از مرحله کاربر.</p>
        </div>
        <Button type="button" size="sm" onClick={addRow}><Plus className="h-3 w-3 ml-1" /> افزودن</Button>
      </div>

      {loading && <div className="text-xs text-muted-foreground">در حال بارگذاری…</div>}
      {!loading && rows.length === 0 && <div className="text-xs text-muted-foreground">هنوز پیگیری سفارشی ثبت نشده.</div>}

      {rows.map(r => (
        <div key={r.id} className="border rounded p-3 space-y-3 bg-muted/20">
          <div className="flex flex-wrap items-center gap-3">
            <Switch checked={r.enabled} onCheckedChange={(v) => patch(r.id, { enabled: v })} />
            <Input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} className="h-8 w-48" placeholder="نام" />
            <Select value={r.channel} onValueChange={(v) => patch(r.id, { channel: v as any })}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bot">ربات تلگرام</SelectItem>
                <SelectItem value="business">چت پشتیبانی (Business)</SelectItem>
                <SelectItem value="email">ایمیل</SelectItem>
                <SelectItem value="sms">پیامک</SelectItem>
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
            <div className="flex items-center gap-1">
              <Switch checked={r.skip_if_activated} onCheckedChange={(v) => patch(r.id, { skip_if_activated: v })} />
              <Label className="text-xs">فقط اگر فعال‌سازی نشده</Label>
            </div>
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
          {r.channel === 'bot' && (
            <Textarea rows={4} value={r.bot_text || ''} onChange={(e) => patch(r.id, { bot_text: e.target.value })} placeholder="متن پیام تلگرام" dir="rtl" />
          )}

          <p className="text-[10px] text-muted-foreground">
            متغیرها: {'{user_name}, {first_name}, {last_name}, {email}, {phone}, {course_title}, {enrollment_id}, {activation_id}, {activation_link}, {activation_token}'}
          </p>

          <TestStageButton stage="custom" courseId={courseId} customFollowupId={r.id} label="ارسال تستی" />
        </div>
      ))}
    </div>
  );
};

export default CustomFollowupsEditor;

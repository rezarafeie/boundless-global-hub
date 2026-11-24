import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Loader2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { scheduleDuration } from './CourseScheduleSection';
import TestStageButton from './TestStageButton';
import EnrollmentSmsSettings from './EnrollmentSmsSettings';
import MessageMediaButtonsEditor, { MessageButton, MessageMediaItem } from './MessageMediaButtonsEditor';

interface CustomFollowup {
  id: string;
  course_id: string;
  name: string;
  enabled: boolean;
  channel: 'bot' | 'email' | 'sms' | 'business' | 'instagram';
  delay_minutes: number;
  max_repeats: number;
  repeat_delay_minutes: number;
  email_subject: string | null;
  email_body: string | null;
  sms_text: string | null;
  sms_template_url: string | null;
  bot_text: string | null;
  media_url: string | null;
  media_type: string | null;
  buttons: MessageButton[] | null;
  media_items: MessageMediaItem[] | null;
  skip_if_activated: boolean;
  only_if_activated: boolean;
}

const DEFAULT_KAVENEGAR = 'https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={course_title}&template=welcomefollowup';

interface Props { courseId: string }

const CustomFollowupsEditor: React.FC<Props> = ({ courseId }) => {
  const [rows, setRows] = useState<CustomFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    setExpandedId((data as any).id);
  };

  const save = async (r: CustomFollowup) => {
    if (r.channel === 'instagram' && (!r.bot_text?.trim() || r.bot_text.length > 900)) {
      toast({ title: 'متن دایرکت را وارد کنید', description: 'متن پیگیری حداکثر ۹۰۰ کاراکتر؛ لینک فعال‌سازی خودکار اضافه می‌شود.', variant: 'destructive' });
      return;
    }
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
      media_url: r.media_url,
      media_type: r.media_type,
      buttons: r.buttons ?? [],
      media_items: r.media_items ?? [],
      skip_if_activated: r.channel === 'instagram' ? true : r.skip_if_activated,
      only_if_activated: r.channel === 'instagram' ? false : r.only_if_activated,
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


  const channelNames: Record<CustomFollowup['channel'], string> = { bot: 'ربات', business: 'چت پشتیبانی', email: 'ایمیل', sms: 'پیامک', instagram: 'اینستاگرام' };
  return (
    <div dir="rtl" className="space-y-4">
      <EnrollmentSmsSettings courseId={courseId} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="text-base font-semibold">پیگیری‌های سفارشی</h3><p className="mt-1 text-xs text-muted-foreground">زمان‌بندی از لحظه ثبت‌نام</p></div>
        <Button type="button" size="sm" variant="outline" onClick={addRow} className="shrink-0"><Plus className="h-4 w-4" /> افزودن پیگیری</Button>
      </div>
      {loading && <div className="py-4 text-sm text-muted-foreground">در حال بارگذاری…</div>}
      {!loading && rows.length === 0 && <div className="border-b border-dashed py-6 text-sm text-muted-foreground">هنوز پیگیری سفارشی ثبت نشده.</div>}
      <div className="divide-y divide-border">
        {rows.map(r => (
          <Collapsible key={r.id} open={expandedId === r.id} onOpenChange={open => setExpandedId(open ? r.id : null)}>
            <div className="flex items-center gap-3 py-2">
              <Button type="button" variant="ghost" aria-expanded={expandedId === r.id} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="h-auto min-w-0 flex-1 justify-start px-0 py-3 text-right whitespace-normal hover:bg-transparent">
                <span className="min-w-0 flex-1"><span className="block break-words font-semibold">{r.name || 'پیگیری بدون نام'}</span><span className="mt-1 block text-xs font-normal leading-6 text-muted-foreground">{channelNames[r.channel]} · {scheduleDuration(r.delay_minutes)} بعد از ثبت‌نام · {r.max_repeats.toLocaleString('fa-IR')} بار</span></span>
                <ChevronDown className={'h-4 w-4 shrink-0 transition-transform ' + (expandedId === r.id ? 'rotate-180' : '')} />
              </Button>
              <Switch checked={r.enabled} onCheckedChange={v => patch(r.id, { enabled: v })} aria-label={'فعال بودن ' + r.name} />
            </div>
            <CollapsibleContent forceMount className="space-y-5 pb-6 data-[state=closed]:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor={'followup-name-' + r.id}>نام پیگیری</Label><Input id={'followup-name-' + r.id} value={r.name} onChange={e => patch(r.id, { name: e.target.value })} /></div>
                <div className="space-y-2"><Label>کانال ارسال</Label><Select value={r.channel} onValueChange={v => patch(r.id, { channel: v as CustomFollowup['channel'] })} dir="rtl"><SelectTrigger aria-label="کانال ارسال"><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="bot">ربات تلگرام / بله</SelectItem><SelectItem value="business">چت پشتیبانی (Business)</SelectItem><SelectItem value="email">ایمیل</SelectItem><SelectItem value="sms">پیامک</SelectItem><SelectItem value="instagram">دایرکت اینستاگرام</SelectItem>
                </SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label htmlFor={'followup-delay-' + r.id}>اولین ارسال (دقیقه بعد)</Label><Input id={'followup-delay-' + r.id} type="number" value={r.delay_minutes} onChange={e => patch(r.id, { delay_minutes: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label htmlFor={'followup-count-' + r.id}>تعداد ارسال</Label><Input id={'followup-count-' + r.id} type="number" value={r.max_repeats} onChange={e => patch(r.id, { max_repeats: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label htmlFor={'followup-repeat-' + r.id}>فاصله تکرار (دقیقه)</Label><Input id={'followup-repeat-' + r.id} type="number" value={r.repeat_delay_minutes} onChange={e => patch(r.id, { repeat_delay_minutes: Number(e.target.value) })} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 border-b pb-3"><Label htmlFor={'followup-pending-' + r.id} className="text-sm">فقط قبل از فعال‌سازی</Label><Switch id={'followup-pending-' + r.id} disabled={r.channel === 'instagram'} checked={r.channel === 'instagram' || r.skip_if_activated} onCheckedChange={v => patch(r.id, { skip_if_activated: v, ...(v ? { only_if_activated: false } : {}) })} /></div>
                <div className="flex items-center justify-between gap-3 border-b pb-3"><Label htmlFor={'followup-active-' + r.id} className="text-sm">فقط بعد از فعال‌سازی</Label><Switch id={'followup-active-' + r.id} disabled={r.channel === 'instagram'} checked={r.channel !== 'instagram' && r.only_if_activated} onCheckedChange={v => patch(r.id, { only_if_activated: v, ...(v ? { skip_if_activated: false } : {}) })} /></div>
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
          {r.channel === 'instagram' && (
            <div className="space-y-2">
              <Textarea rows={4} maxLength={900} value={r.bot_text || ''} onChange={(e) => patch(r.id, { bot_text: e.target.value })} placeholder="متن پیگیری فعال‌سازی در دایرکت" dir="rtl" />
              <p className="text-xs text-muted-foreground">فقط ثبت‌نام‌های متصل به دایرکت نوین‌هاب؛ توقف پس از فعال‌سازی پشتیبانی. لینک و دکمه فعال‌سازی همراه پیام ارسال می‌شوند؛ ارسال تابع محدودیت‌های اینستاگرام است.</p>
            </div>
          )}
          {(r.channel === 'bot' || r.channel === 'business') && (
            <div className="space-y-2">
              <Textarea rows={4} value={r.bot_text || ''} onChange={(e) => patch(r.id, { bot_text: e.target.value })} placeholder={r.channel === 'business' ? 'متن پیام از چت پشتیبانی (Telegram Business)' : 'متن پیام تلگرام'} dir="rtl" />
              <MessageMediaButtonsEditor
                mediaUrl={r.media_url}
                mediaType={r.media_type}
                buttons={r.buttons}
                mediaItems={r.media_items ?? []}
                onChange={(p) => patch(r.id, p as any)}
              />
            </div>
          )}

              <details className="text-xs text-muted-foreground"><summary className="cursor-pointer py-2">متغیرهای پیام</summary><p className="break-words leading-7">{'{user_name}, {first_name}, {last_name}, {email}, {phone}, {course_title}, {enrollment_id}, {activation_id}, {activation_link}, {activation_token}'}</p></details>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <TestStageButton stage="custom" courseId={courseId} customFollowupId={r.id} label="ارسال تستی" />
                <div className="flex items-center gap-2"><Button type="button" size="icon" variant="ghost" aria-label={'حذف ' + r.name} onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button><Button type="button" size="sm" variant="outline" onClick={() => save(r)} disabled={savingId === r.id}>{savingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره پیگیری</Button></div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};
export default CustomFollowupsEditor;

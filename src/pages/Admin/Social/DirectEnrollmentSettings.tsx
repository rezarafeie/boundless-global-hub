import { useEffect, useState } from 'react';
import { Plus, Save, Pencil, RefreshCw, Copy, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Rule = {
  id?: string; name: string; enabled: boolean; account_id: string; course_id: string;
  event_type: string; trigger_value: string; field_mapping: { name: string; phone: string; email: string };
  reply_template: string; missing_fields_message: string;
};
type Event = { id: string; status: string; event_type: string; created_at: string; last_error?: string; enrollment_id?: string; attempts: number };
const blank: Rule = {
  name: '', enabled: false, account_id: '', course_id: '', event_type: 'autoform_completed', trigger_value: '',
  field_mapping: { name: 'answers.name', phone: 'answers.phone', email: 'answers.email' },
  reply_template: '{name} عزیز، ثبت‌نام شما در دوره «{course_title}» انجام شد.\nفعال‌سازی پشتیبانی تلگرام: {telegram_link}\n{bale_link}',
  missing_fields_message: 'لطفاً فرم ثبت‌نام را با نام، شماره موبایل و ایمیل تکمیل کنید.',
};
const labels: Record<string, string> = { queued: 'در صف', processing: 'در حال پردازش', completed: 'ارسال شد', needs_info: 'اطلاعات ناقص', ignored: 'بدون قانون مطابق', retry: 'تلاش مجدد', failed: 'ناموفق' };

export default function DirectEnrollmentSettings() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<{ rules: Rule[]; events: Event[]; accounts: { id: string; username: string }[]; courses: { id: string; title: string; price: number }[]; webhook_url: string; secret_configured: boolean } | null>(null);
  const [editor, setEditor] = useState<Rule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const call = async (body: unknown) => {
    const { data, error } = await supabase.functions.invoke('social-enrollment-admin', { body, headers: token ? { 'x-session-token': token } : undefined });
    if (error || data?.error) {
      let message = data?.error || error?.message || 'خطا';
      if (error && 'context' in error && error.context instanceof Response) {
        const details = await error.context.json().catch(() => null);
        if (details?.error) message = details.error;
      }
      throw new Error(message);
    }
    return data;
  };
  const load = async () => {
    setBusy(true); setError('');
    try { setData(await call({ action: 'list' })); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, [token]);
  const save = async () => {
    if (!editor) return;
    setBusy(true);
    try { await call({ action: 'save', rule: editor }); setEditor(null); await load(); toast({ title: 'قانون ذخیره شد' }); }
    catch (e) { toast({ title: 'ذخیره نشد', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const retry = async (id: string) => {
    setBusy(true);
    try { await call({ action: 'retry', id }); await load(); }
    catch (e) { toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  return <section className="space-y-5 border-t border-border pt-6" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">ثبت‌نام از دایرکت اینستاگرام</h2>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" aria-label="به‌روزرسانی ثبت‌نام‌ها" title="به‌روزرسانی" onClick={load} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
        <Button onClick={() => setEditor({ ...blank, field_mapping: { ...blank.field_mapping }, account_id: data?.accounts[0]?.id || '' })}><Plus className="h-4 w-4 ml-2" />قانون جدید</Button>
      </div>
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {data && <>
      <div className="space-y-2">
        <Label>آدرس دریافت رویداد نوین‌هاب</Label>
        <div className="flex gap-2"><Input readOnly dir="ltr" value={`${data.webhook_url}?key=YOUR_SECRET`} /><Button variant="outline" size="icon" title="کپی آدرس" aria-label="کپی آدرس" onClick={async () => { await navigator.clipboard.writeText(`${data.webhook_url}?key=YOUR_SECRET`); toast({ title: 'آدرس کپی شد؛ YOUR_SECRET را با رمز ذخیره‌شده جایگزین کنید' }); }}><Copy className="h-4 w-4" /></Button></div>
        <p className="text-sm text-muted-foreground">{data.secret_configured ? 'رمز اتصال ذخیره شده است.' : 'رمز اتصال هنوز ذخیره نشده است.'} ثبت آدرس وب‌هوک در تنظیمات کلاینت نوین‌هاب یا با پشتیبانی نوین‌هاب انجام می‌شود.</p>
      </div>
      {!editor && data.rules.length === 0 && <p className="text-muted-foreground">هنوز قانون ثبت‌نامی ثبت نشده است.</p>}
      {!editor && data.rules.map(rule => <div key={rule.id} className="border border-border rounded-md p-4 flex items-center justify-between gap-3">
        <div className="min-w-0"><h3 className="font-medium break-words">{rule.name}</h3><p className="text-sm text-muted-foreground break-words">{rule.enabled ? 'فعال' : 'غیرفعال'} · {data.courses.find(c => c.id === rule.course_id)?.title} · {rule.trigger_value}</p></div>
        <Button variant="ghost" size="icon" title="ویرایش قانون" aria-label={`ویرایش ${rule.name}`} onClick={() => setEditor({ ...rule, field_mapping: { ...rule.field_mapping } })}><Pencil className="h-4 w-4" /></Button>
      </div>)}
      {editor && <div className="space-y-4 border border-border rounded-md p-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">{editor.id ? 'ویرایش قانون' : 'قانون جدید'}</h3><Label className="flex items-center gap-3">فعال<Switch checked={editor.enabled} onCheckedChange={enabled => setEditor({ ...editor, enabled })} /></Label></div>
        <div className="space-y-2"><Label htmlFor="direct-rule-name">نام قانون</Label><Input id="direct-rule-name" value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>پیج اینستاگرام</Label><Select value={editor.account_id} onValueChange={account_id => setEditor({ ...editor, account_id })}><SelectTrigger><SelectValue placeholder="انتخاب پیج" /></SelectTrigger><SelectContent>{data.accounts.map(a => <SelectItem key={a.id} value={a.id}>@{a.username}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>دوره رایگان</Label><Select value={editor.course_id} onValueChange={course_id => setEditor({ ...editor, course_id })}><SelectTrigger><SelectValue placeholder="انتخاب دوره" /></SelectTrigger><SelectContent>{data.courses.filter(c => Number(c.price) === 0).map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>رویداد</Label><Select value={editor.event_type} onValueChange={event_type => setEditor({ ...editor, event_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="autoform_completed">تکمیل فرم دایرکت</SelectItem><SelectItem value="message_created">کلمه کلیدی دقیق</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="direct-trigger">{editor.event_type === 'autoform_completed' ? 'شناسه فرم نوین‌هاب' : 'کلمه کلیدی'}</Label><Input id="direct-trigger" value={editor.trigger_value} onChange={e => setEditor({ ...editor, trigger_value: e.target.value })} /></div>
        </div>
        <fieldset className="grid sm:grid-cols-3 gap-3"><legend className="font-medium mb-2">فیلدهای دریافتی فرم</legend>{(['name', 'phone', 'email'] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={`direct-field-${key}`}>{({ name: 'نام', phone: 'موبایل', email: 'ایمیل' })[key]}</Label><Input id={`direct-field-${key}`} dir="ltr" value={editor.field_mapping[key]} onChange={e => setEditor({ ...editor, field_mapping: { ...editor.field_mapping, [key]: e.target.value } })} /></div>)}</fieldset>
        <div className="space-y-2"><Label htmlFor="direct-reply">پیام پس از ثبت‌نام</Label><Textarea id="direct-reply" rows={5} value={editor.reply_template} onChange={e => setEditor({ ...editor, reply_template: e.target.value })} /><p className="text-xs text-muted-foreground" dir="ltr">{'{name} · {course_title} · {telegram_link} · {bale_link}'}</p></div>
        <div className="space-y-2"><Label htmlFor="direct-missing">پیام اطلاعات ناقص / درخواست تکمیل فرم</Label><Textarea id="direct-missing" value={editor.missing_fields_message} onChange={e => setEditor({ ...editor, missing_fields_message: e.target.value })} /></div>
        <div className="flex gap-2"><Button disabled={busy} onClick={save}>{busy ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}ذخیره قانون</Button><Button variant="outline" onClick={() => setEditor(null)}>انصراف</Button></div>
      </div>}
      <div className="space-y-3"><h3 className="font-semibold">آخرین رویدادها</h3>{data.events.length === 0 && <p className="text-muted-foreground text-sm">هنوز رویدادی دریافت نشده است.</p>}{data.events.map(event => <div key={event.id} className="border-b border-border py-3 space-y-1">
        <div className="flex flex-wrap gap-2 justify-between"><span className={event.status === 'failed' ? 'text-destructive' : 'text-foreground'}>{labels[event.status] || event.status}</span><time className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'short', timeStyle: 'short' }).format(new Date(event.created_at))}</time></div>
        <p className="text-xs text-muted-foreground">{event.event_type === 'autoform_completed' ? 'فرم دایرکت' : 'پیام دایرکت'} · تلاش {event.attempts}</p>
        {event.last_error && <p className="text-sm text-destructive break-words">{event.last_error}</p>}
        {['failed', 'retry'].includes(event.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => retry(event.id)}><RefreshCw className="h-3 w-3 ml-2" />تلاش مجدد</Button>}
      </div>)}</div>
    </>}
  </section>;
}
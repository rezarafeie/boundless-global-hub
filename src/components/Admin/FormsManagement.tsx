import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Trash2, Edit, Eye, GripVertical, Sparkles, RefreshCw, ArrowRight,
  ExternalLink, Copy, Link as LinkIcon, Wand2, Webhook, Info,
} from 'lucide-react';

type FieldType =
  | 'text' | 'long_text' | 'phone' | 'email' | 'number'
  | 'dropdown' | 'image' | 'voice' | 'file'
  | 'message' | 'ai_analysis';

interface FormRow {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  is_active: boolean;
  ai_prompt: string | null;
  ai_enabled: boolean;
  require_login: boolean;
  webhook_url: string | null;
  confirmation_type: string;
  confirmation_message: string | null;
  redirect_url: string | null;
  confirmation_course_id: string | null;
  confirmation_test_id: string | null;
  created_at: string;
}

interface FieldRow {
  id?: string;
  form_id?: string;
  order_index: number;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: any;
  help_text: string | null;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'متن کوتاه',
  long_text: 'متن بلند',
  phone: 'شماره موبایل',
  email: 'ایمیل',
  number: 'عدد',
  dropdown: 'انتخاب از لیست',
  image: 'تصویر',
  voice: 'پیام صوتی',
  file: 'فایل',
  message: '💬 پیام (فقط نمایش)',
  ai_analysis: '✨ تحلیل AI (فقط نمایش)',
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const FormsManagement: React.FC = () => {
  const { toast } = useToast();
  const [forms, setForms] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<{ form: Partial<FormRow>; fields: FieldRow[] } | null>(null);
  const [viewing, setViewing] = useState<FormRow | null>(null);

  const loadForms = async () => {
    setLoading(true);
    const { data } = await supabase.from('telegram_forms').select('*').order('created_at', { ascending: false });
    setForms((data as FormRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadForms(); }, []);

  const openNew = () => setEditor({
    form: {
      title: '', slug: '', description: '', is_active: true,
      ai_prompt: '', ai_enabled: false, require_login: false,
      webhook_url: '', confirmation_type: 'message',
      confirmation_message: '', redirect_url: '',
      confirmation_course_id: null, confirmation_test_id: null,
    },
    fields: [],
  });

  const openEdit = async (form: FormRow) => {
    const { data: fields } = await supabase.from('telegram_form_fields')
      .select('*').eq('form_id', form.id).order('order_index');
    setEditor({ form, fields: (fields as FieldRow[]) ?? [] });
  };

  const saveForm = async () => {
    if (!editor) return;
    const f = editor.form;
    if (!f.title?.trim()) { toast({ title: 'عنوان لازم است', variant: 'destructive' }); return; }
    const finalSlug = (f.slug?.trim() || slugify(f.title)) || `form-${Date.now()}`;
    const payload: any = {
      title: f.title, slug: finalSlug, description: f.description ?? null,
      is_active: !!f.is_active,
      ai_prompt: f.ai_prompt ?? null, ai_enabled: !!f.ai_enabled,
      require_login: !!f.require_login,
      webhook_url: f.webhook_url?.trim() || null,
      confirmation_type: f.confirmation_type ?? 'message',
      confirmation_message: f.confirmation_message ?? null,
      redirect_url: f.redirect_url?.trim() || null,
      confirmation_course_id: f.confirmation_type === 'course' ? (f.confirmation_course_id || null) : null,
      confirmation_test_id: f.confirmation_type === 'test' ? (f.confirmation_test_id || null) : null,
    };
    let formId = f.id;
    if (formId) {
      const { error } = await supabase.from('telegram_forms').update(payload).eq('id', formId);
      if (error) { toast({ title: 'خطا', description: error.message, variant: 'destructive' }); return; }
      await supabase.from('telegram_form_fields').delete().eq('form_id', formId);
    } else {
      const { data, error } = await supabase.from('telegram_forms').insert(payload).select('id').single();
      if (error || !data) { toast({ title: 'خطا', description: error?.message, variant: 'destructive' }); return; }
      formId = data.id;
    }
    if (editor.fields.length) {
      const rows = editor.fields.map((x, i) => ({
        form_id: formId, order_index: i,
        field_key: x.field_key || `f_${i + 1}`,
        label: x.label,
        field_type: x.field_type,
        required: x.required,
        options: ['dropdown', 'message'].includes(x.field_type) ? (x.options ?? null) : null,
        help_text: x.help_text ?? null,
      }));
      const { error } = await supabase.from('telegram_form_fields').insert(rows);
      if (error) { toast({ title: 'خطا در ذخیره فیلدها', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: '✅ ذخیره شد' });
    setEditor(null);
    loadForms();
  };

  const deleteForm = async (id: string) => {
    if (!confirm('حذف فرم و تمام پاسخ‌ها؟')) return;
    await supabase.from('telegram_forms').delete().eq('id', id);
    loadForms();
  };

  const copyLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'لینک کپی شد', description: url });
  };

  if (editor) {
    return <FormEditor editor={editor} setEditor={setEditor} onSave={saveForm} onCancel={() => setEditor(null)} />;
  }
  if (viewing) {
    return <SubmissionsTable form={viewing} onBack={() => setViewing(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">فرم‌ها</h2>
          <p className="text-sm text-muted-foreground">فرم‌هایی که در ربات تلگرام و وب‌سایت در دسترس کاربران هستند.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" /> فرم جدید</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
          ) : forms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">فرمی ثبت نشده.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-right p-3">عنوان</th>
                  <th className="text-right p-3">لینک وب</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">ورود الزامی</th>
                  <th className="text-right p-3">AI</th>
                  <th className="text-right p-3">Webhook</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {forms.map(f => (
                  <tr key={f.id} className="border-t">
                    <td className="p-3 font-medium">{f.title}</td>
                    <td className="p-3">
                      {f.slug ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">/f/{f.slug}</code>
                          <Button size="icon" variant="ghost" onClick={() => copyLink(f.slug)} title="کپی لینک">
                            <Copy className="w-3 h-3" />
                          </Button>
                          <a href={`/f/${f.slug}`} target="_blank" rel="noreferrer">
                            <Button size="icon" variant="ghost" title="باز کردن"><ExternalLink className="w-3 h-3" /></Button>
                          </a>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3"><Badge variant={f.is_active ? 'default' : 'secondary'}>{f.is_active ? 'فعال' : 'غیرفعال'}</Badge></td>
                    <td className="p-3">{f.require_login ? '✅' : '—'}</td>
                    <td className="p-3">{f.ai_enabled ? <Sparkles className="w-4 h-4 text-primary" /> : '—'}</td>
                    <td className="p-3">{f.webhook_url ? <Webhook className="w-4 h-4 text-green-600" /> : '—'}</td>
                    <td className="p-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing(f)}><Eye className="w-4 h-4 ml-1" /> پاسخ‌ها</Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(f)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteForm(f.id)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ AI Generator Panel ============
const AiGenerator: React.FC<{
  existing?: { title?: string; description?: string; ai_prompt?: string; fields?: FieldRow[] };
  onResult: (r: { title?: string; description?: string; ai_prompt?: string; fields: FieldRow[] }) => void;
}> = ({ existing, onResult }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!prompt.trim()) { toast({ title: 'یک توضیح برای AI بنویسید', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-form-generator', {
        body: { prompt, existing: existing?.fields?.length ? existing : null },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw new Error(d.error);
      const fields: FieldRow[] = (d.fields ?? []).map((f: any, i: number) => ({
        order_index: i,
        field_key: f.field_key || `f_${i + 1}`,
        label: f.label || '',
        field_type: f.field_type as FieldType,
        required: f.required !== false,
        options: f.field_type === 'message'
          ? { content: f.content ?? f.label ?? '', media_url: '', media_type: '' }
          : (f.options ?? null),
        help_text: f.help_text ?? null,
      }));
      onResult({ title: d.title, description: d.description, ai_prompt: d.ai_prompt, fields });
      toast({ title: '✅ ساختار فرم تولید شد', description: `${fields.length} فیلد` });
      setPrompt('');
    } catch (e: any) {
      toast({ title: 'خطا در تولید AI', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">ساخت / ویرایش با هوش مصنوعی</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          مثلاً: «فرم درخواست مشاوره با نام، موبایل، حوزه فعالیت و توضیحات» یا «یک فیلد متن بلند برای سوابق اضافه کن».
        </p>
        <Textarea
          value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
          placeholder="توضیح فرم یا تغییرات مورد نظر..."
          disabled={loading}
        />
        <Button onClick={run} disabled={loading} className="w-full">
          {loading ? 'در حال تولید...' : <><Wand2 className="w-4 h-4 ml-2" /> تولید با AI</>}
        </Button>
      </CardContent>
    </Card>
  );
};

// ============ Editor (full page) ============
const FormEditor: React.FC<{
  editor: { form: Partial<FormRow>; fields: FieldRow[] };
  setEditor: (e: any) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ editor, setEditor, onSave, onCancel }) => {
  const updateForm = (patch: Partial<FormRow>) => setEditor({ ...editor, form: { ...editor.form, ...patch } });
  const updateField = (i: number, patch: Partial<FieldRow>) => {
    const fields = [...editor.fields];
    fields[i] = { ...fields[i], ...patch };
    setEditor({ ...editor, fields });
  };
  const addField = () => setEditor({
    ...editor,
    fields: [...editor.fields, {
      order_index: editor.fields.length, field_key: `f_${editor.fields.length + 1}`,
      label: '', field_type: 'text', required: true, options: [], help_text: '',
    }],
  });
  const removeField = (i: number) => setEditor({ ...editor, fields: editor.fields.filter((_, idx) => idx !== i) });
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= editor.fields.length) return;
    const fields = [...editor.fields];
    [fields[i], fields[j]] = [fields[j], fields[i]];
    setEditor({ ...editor, fields });
  };

  const applyAiResult = (r: { title?: string; description?: string; ai_prompt?: string; fields: FieldRow[] }) => {
    setEditor({
      form: {
        ...editor.form,
        ...(editor.form.title ? {} : { title: r.title }),
        ...(editor.form.description ? {} : { description: r.description }),
        ai_prompt: r.ai_prompt || editor.form.ai_prompt,
      },
      fields: r.fields,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowRight className="w-4 h-4 ml-1" /> بازگشت
          </Button>
          <h2 className="text-2xl font-bold">{editor.form.id ? 'ویرایش فرم' : 'فرم جدید'}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>انصراف</Button>
          <Button onClick={onSave}>ذخیره فرم</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: form meta */}
        <div className="lg:col-span-1 space-y-4">
          <AiGenerator
            existing={{
              title: editor.form.title, description: editor.form.description ?? undefined,
              ai_prompt: editor.form.ai_prompt ?? undefined, fields: editor.fields,
            }}
            onResult={applyAiResult}
          />

          <Card className="h-fit">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">تنظیمات فرم</h3>

              <div>
                <Label>عنوان فرم *</Label>
                <Input value={editor.form.title ?? ''} onChange={e => updateForm({ title: e.target.value })} />
              </div>

              <div>
                <Label className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> آدرس وب (slug)</Label>
                <Input value={editor.form.slug ?? ''} onChange={e => updateForm({ slug: e.target.value })}
                  placeholder="مثلاً: contact-us" dir="ltr" />
                <p className="text-xs text-muted-foreground mt-1">آدرس: <code>/f/{editor.form.slug || 'auto'}</code></p>
              </div>

              <div>
                <Label>توضیحات</Label>
                <Textarea value={editor.form.description ?? ''} onChange={e => updateForm({ description: e.target.value })} rows={3} />
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label>فعال</Label>
                  <Switch checked={!!editor.form.is_active} onCheckedChange={v => updateForm({ is_active: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>ورود الزامی</Label>
                  <Switch checked={!!editor.form.require_login} onCheckedChange={v => updateForm({ require_login: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> تحلیل AI فعال</Label>
                  <Switch checked={!!editor.form.ai_enabled} onCheckedChange={v => updateForm({ ai_enabled: v })} />
                </div>
              </div>

              {editor.form.ai_enabled && (
                <div className="pt-2 border-t">
                  <Label className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> پرامپت تحلیل AI</Label>
                  <Textarea value={editor.form.ai_prompt ?? ''} onChange={e => updateForm({ ai_prompt: e.target.value })}
                    rows={4} placeholder="مثال: پاسخ‌ها را تحلیل کن و خلاصه‌ای ۳ جمله‌ای بده." />
                </div>
              )}

              <div className="pt-2 border-t space-y-3">
                <Label className="flex items-center gap-1"><Info className="w-3 h-3" /> پس از ارسال</Label>
                <Select
                  value={editor.form.confirmation_type ?? 'message'}
                  onValueChange={v => updateForm({ confirmation_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">نمایش پیام تشکر</SelectItem>
                    <SelectItem value="redirect">انتقال به URL</SelectItem>
                    <SelectItem value="course">معرفی دوره</SelectItem>
                    <SelectItem value="test">معرفی آزمون</SelectItem>
                  </SelectContent>
                </Select>
                {editor.form.confirmation_type === 'redirect' ? (
                  <Input value={editor.form.redirect_url ?? ''} onChange={e => updateForm({ redirect_url: e.target.value })}
                    placeholder="https://..." dir="ltr" />
                ) : editor.form.confirmation_type === 'course' ? (
                  <CourseTestPicker
                    kind="course"
                    value={editor.form.confirmation_course_id ?? null}
                    onChange={v => updateForm({ confirmation_course_id: v })}
                  />
                ) : editor.form.confirmation_type === 'test' ? (
                  <CourseTestPicker
                    kind="test"
                    value={editor.form.confirmation_test_id ?? null}
                    onChange={v => updateForm({ confirmation_test_id: v })}
                  />
                ) : (
                  <Textarea value={editor.form.confirmation_message ?? ''} onChange={e => updateForm({ confirmation_message: e.target.value })}
                    rows={3} placeholder="مثال: ممنون از پاسخ‌تان! به زودی با شما تماس می‌گیریم." />
                )}
              </div>

              <div className="pt-2 border-t">
                <Label className="flex items-center gap-1"><Webhook className="w-3 h-3" /> Webhook (اختیاری)</Label>
                <Input value={editor.form.webhook_url ?? ''} onChange={e => updateForm({ webhook_url: e.target.value })}
                  placeholder="https://hook.example.com/..." dir="ltr" />
                <p className="text-xs text-muted-foreground mt-1">پس از هر ارسال، اطلاعات به این آدرس POST می‌شود.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: fields builder */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="font-semibold text-lg">فیلدها</h3>
                <p className="text-xs text-muted-foreground">{editor.fields.length} فیلد</p>
              </div>
              <Button onClick={addField}><Plus className="w-4 h-4 ml-1" /> افزودن فیلد</Button>
            </div>

            <div className="space-y-3">
              {editor.fields.map((f, i) => {
                const isMessage = f.field_type === 'message';
                const isAi = f.field_type === 'ai_analysis';
                const isDropdown = f.field_type === 'dropdown';
                return (
                  <Card key={i} className="p-4 border-2 hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <button type="button" onClick={() => moveField(i, -1)} className="text-xs hover:text-primary">▲</button>
                        <div className="text-xs font-mono text-muted-foreground">{i + 1}</div>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <button type="button" onClick={() => moveField(i, 1)} className="text-xs hover:text-primary">▼</button>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">{isMessage ? 'عنوان پیام' : isAi ? 'عنوان (نمایش داده نمی‌شود)' : 'برچسب'}</Label>
                          <Input value={f.label} onChange={e => updateField(i, { label: e.target.value })} placeholder={isMessage ? 'مثلاً: قبل از شروع بخوانید' : 'مثلاً: نام شما'} />
                        </div>
                        <div>
                          <Label className="text-xs">نوع</Label>
                          <Select value={f.field_type} onValueChange={v => updateField(i, {
                            field_type: v as FieldType,
                            options: v === 'message' ? { content: '', media_url: '', media_type: '' } : v === 'dropdown' ? [] : null,
                          })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {isDropdown && (
                          <div className="md:col-span-2">
                            <Label className="text-xs">گزینه‌ها (هر خط یک گزینه)</Label>
                            <Textarea rows={3}
                              value={Array.isArray(f.options) ? f.options.join('\n') : ''}
                              onChange={e => updateField(i, { options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
                          </div>
                        )}

                        {isMessage && (
                          <>
                            <div className="md:col-span-2">
                              <Label className="text-xs">محتوای پیام</Label>
                              <Textarea rows={4}
                                value={f.options?.content ?? ''}
                                onChange={e => updateField(i, { options: { ...(f.options ?? {}), content: e.target.value } })}
                                placeholder="متنی که به کاربر نمایش داده می‌شود..." />
                            </div>
                            <div>
                              <Label className="text-xs">URL رسانه (اختیاری)</Label>
                              <Input dir="ltr"
                                value={f.options?.media_url ?? ''}
                                onChange={e => updateField(i, { options: { ...(f.options ?? {}), media_url: e.target.value } })}
                                placeholder="https://.../image.jpg" />
                            </div>
                            <div>
                              <Label className="text-xs">نوع رسانه</Label>
                              <Select value={f.options?.media_type ?? ''}
                                onValueChange={v => updateField(i, { options: { ...(f.options ?? {}), media_type: v } })}>
                                <SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="image/jpeg">تصویر</SelectItem>
                                  <SelectItem value="video/mp4">ویدیو</SelectItem>
                                  <SelectItem value="audio/mpeg">صوت</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {isAi && (
                          <div className="md:col-span-2 p-3 rounded bg-primary/5 text-xs text-muted-foreground">
                            این فیلد بعد از ارسال فرم، تحلیل AI را به صورت زنده برای کاربر استریم می‌کند. پرامپت تحلیل را در تنظیمات فرم بنویسید.
                          </div>
                        )}

                        {!isMessage && !isAi && (
                          <div className="md:col-span-2">
                            <Label className="text-xs">راهنما (اختیاری)</Label>
                            <Input value={f.help_text ?? ''} onChange={e => updateField(i, { help_text: e.target.value })} />
                          </div>
                        )}

                        {!isMessage && !isAi && (
                          <div className="flex items-center gap-2">
                            <Switch checked={f.required} onCheckedChange={v => updateField(i, { required: v })} />
                            <Label>الزامی</Label>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeField(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {!editor.fields.length && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">هنوز فیلدی اضافه نشده. می‌توانید با AI شروع کنید.</p>
                  <Button variant="outline" onClick={addField}><Plus className="w-4 h-4 ml-1" /> افزودن اولین فیلد</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============ Submissions Table (full panel) ============
const SubmissionsTable: React.FC<{ form: FormRow; onBack: () => void }> = ({ form, onBack }) => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [fields, setFields] = useState<{ id: string; label: string; order_index: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: fs }, { data }] = await Promise.all([
      supabase.from('telegram_form_fields').select('id, label, order_index').eq('form_id', form.id).order('order_index'),
      supabase.from('telegram_form_submissions')
        .select('*, telegram_form_answers(*)')
        .eq('form_id', form.id).order('created_at', { ascending: false }).limit(500),
    ]);
    setFields(((fs as any) ?? []).filter((f: any) => !!f));
    setSubs(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [form.id]);

  const reanalyze = async (sub: any) => {
    if (!form.ai_prompt) { toast({ title: 'پرامپت AI تنظیم نشده', variant: 'destructive' }); return; }
    setAnalyzing(sub.id);
    try {
      const { error } = await supabase.functions.invoke('telegram-form-analyze', { body: { submission_id: sub.id } });
      if (error) throw error;
      toast({ title: '✅ تحلیل ارسال شد' });
      setTimeout(load, 3000);
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    } finally { setAnalyzing(null); }
  };

  const getAnswerValue = (sub: any, fieldId: string) => {
    const a = (sub.telegram_form_answers ?? []).find((x: any) => x.field_id === fieldId);
    if (!a) return '—';
    if (a.file_url) return <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary underline">فایل</a>;
    return a.value_text ?? '—';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}><ArrowRight className="w-4 h-4 ml-1" /> بازگشت</Button>
          <h2 className="text-2xl font-bold">پاسخ‌های فرم: {form.title}</h2>
          <Badge variant="secondary">{subs.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 ml-1" /> بازخوانی</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">در حال بارگذاری...</div>
          ) : subs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">هیچ پاسخی ثبت نشده.</div>
          ) : (
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-right p-3">زمان</th>
                  <th className="text-right p-3">منبع</th>
                  <th className="text-right p-3">نام</th>
                  <th className="text-right p-3">موبایل</th>
                  <th className="text-right p-3">کاربر</th>
                  {fields.map(f => (
                    <th key={f.id} className="text-right p-3 whitespace-nowrap">{f.label}</th>
                  ))}
                  <th className="text-right p-3">CRM / Lead</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <React.Fragment key={s.id}>
                    <tr className="border-t hover:bg-muted/20">
                      <td className="p-3 whitespace-nowrap text-xs">
                        {new Date(s.created_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}
                      </td>
                      <td className="p-3">
                        <Badge variant={s.source === 'web' ? 'default' : 'secondary'}>
                          {s.source === 'web' ? 'وب' : 'تلگرام'}
                        </Badge>
                      </td>
                      <td className="p-3">{s.full_name ?? '—'}</td>
                      <td className="p-3 font-mono text-xs">{s.phone ?? '—'}</td>
                      <td className="p-3 text-xs">
                        {s.chat_user_id ? (
                          <a href={`/enroll/admin?view=users&user=${s.chat_user_id}`} className="text-primary underline">
                            #{s.chat_user_id}
                          </a>
                        ) : s.chat_id ? `TG:${s.chat_id}` : '—'}
                      </td>
                      {fields.map(f => (
                        <td key={f.id} className="p-3 max-w-[200px] truncate" title={String(getAnswerValue(s, f.id))}>
                          {getAnswerValue(s, f.id)}
                        </td>
                      ))}
                      <td className="p-3 text-xs space-y-1">
                        {s.crm_note_id && <div className="text-green-600">✓ CRM</div>}
                        {s.lead_request_id && (
                          <a href={`/enroll/admin?view=leads`} className="text-primary underline">Lead</a>
                        )}
                        {!s.crm_note_id && !s.lead_request_id && '—'}
                      </td>
                      <td className="p-3">
                        <Badge variant={['completed', 'analyzed'].includes(s.status) ? 'default' : 'secondary'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="p-3 flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                          {expanded === s.id ? 'بستن' : 'جزئیات'}
                        </Button>
                        {form.ai_prompt && (
                          <Button size="sm" variant="ghost" disabled={analyzing === s.id} onClick={() => reanalyze(s)}>
                            <Sparkles className="w-3 h-3 ml-1" />
                            {analyzing === s.id ? '...' : 'AI'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr className="bg-muted/10 border-t">
                        <td colSpan={fields.length + 8} className="p-4">
                          {s.ai_response && (
                            <div className="mb-3 p-3 bg-background rounded border text-xs whitespace-pre-wrap">
                              <div className="font-bold mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> پاسخ AI:</div>
                              {s.ai_response}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {(s.telegram_form_answers ?? []).map((a: any) => {
                              const field = fields.find(f => f.id === a.field_id);
                              return (
                                <div key={a.id} className="p-2 bg-background rounded border">
                                  <div className="font-medium text-muted-foreground">{field?.label ?? a.field_id}</div>
                                  <div>{a.file_url
                                    ? <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary underline">مشاهده فایل</a>
                                    : (a.value_text ?? '—')}</div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormsManagement;

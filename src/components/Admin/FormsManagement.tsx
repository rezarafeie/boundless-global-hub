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
import { Plus, Trash2, Edit, Eye, GripVertical, Sparkles, RefreshCw, ArrowRight, ExternalLink, Copy, Link as LinkIcon } from 'lucide-react';

type FieldType = 'text' | 'long_text' | 'phone' | 'email' | 'number' | 'dropdown' | 'image' | 'voice' | 'file';

interface FormRow {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  is_active: boolean;
  ai_prompt: string | null;
  require_login: boolean;
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
    form: { title: '', slug: '', description: '', is_active: true, ai_prompt: '', require_login: false },
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
    let formId = f.id;
    if (formId) {
      const { error } = await supabase.from('telegram_forms').update({
        title: f.title, slug: finalSlug, description: f.description ?? null, is_active: !!f.is_active,
        ai_prompt: f.ai_prompt ?? null, require_login: !!f.require_login,
      }).eq('id', formId);
      if (error) { toast({ title: 'خطا', description: error.message, variant: 'destructive' }); return; }
      await supabase.from('telegram_form_fields').delete().eq('form_id', formId);
    } else {
      const { data, error } = await supabase.from('telegram_forms').insert({
        title: f.title, slug: finalSlug, description: f.description ?? null, is_active: !!f.is_active,
        ai_prompt: f.ai_prompt ?? null, require_login: !!f.require_login,
      }).select('id').single();
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
        options: x.field_type === 'dropdown' ? (x.options ?? []) : null,
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
    const url = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'لینک کپی شد', description: url });
  };

  // Full-page editor (replaces popup)
  if (editor) {
    return <FormEditor editor={editor} setEditor={setEditor} onSave={saveForm} onCancel={() => setEditor(null)} />;
  }

  // Submissions view (full panel, replaces popup)
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
                          <code className="text-xs bg-muted px-2 py-1 rounded">/form/{f.slug}</code>
                          <Button size="icon" variant="ghost" onClick={() => copyLink(f.slug)} title="کپی لینک">
                            <Copy className="w-3 h-3" />
                          </Button>
                          <a href={`/form/${f.slug}`} target="_blank" rel="noreferrer">
                            <Button size="icon" variant="ghost" title="باز کردن"><ExternalLink className="w-3 h-3" /></Button>
                          </a>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3"><Badge variant={f.is_active ? 'default' : 'secondary'}>{f.is_active ? 'فعال' : 'غیرفعال'}</Badge></td>
                    <td className="p-3">{f.require_login ? '✅' : '—'}</td>
                    <td className="p-3">{f.ai_prompt ? <Sparkles className="w-4 h-4 text-primary" /> : '—'}</td>
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

// ============ Editor ============
const FormEditor: React.FC<{
  editor: { form: Partial<FormRow>; fields: FieldRow[] };
  setEditor: (e: any) => void;
  onSave: () => void;
}> = ({ editor, setEditor, onSave }) => {
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

  return (
    <Dialog open onOpenChange={() => setEditor(null)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editor.form.id ? 'ویرایش فرم' : 'فرم جدید'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>عنوان فرم *</Label>
            <Input value={editor.form.title ?? ''} onChange={e => updateForm({ title: e.target.value })} />
          </div>
          <div>
            <Label className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> آدرس وب (slug)</Label>
            <Input
              value={editor.form.slug ?? ''}
              onChange={e => updateForm({ slug: e.target.value })}
              placeholder="مثلاً: contact-us — خودکار از عنوان ساخته می‌شود"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-1">فرم در آدرس <code>/form/{editor.form.slug || 'auto'}</code> در دسترس خواهد بود.</p>
          </div>
          <div>
            <Label>توضیحات</Label>
            <Textarea value={editor.form.description ?? ''} onChange={e => updateForm({ description: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={!!editor.form.is_active} onCheckedChange={v => updateForm({ is_active: v })} />
              <Label>فعال</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!editor.form.require_login} onCheckedChange={v => updateForm({ require_login: v })} />
              <Label>ورود به حساب الزامی</Label>
            </div>
          </div>

          <div>
            <Label>پرامپت تحلیل AI (اختیاری)</Label>
            <Textarea
              value={editor.form.ai_prompt ?? ''}
              onChange={e => updateForm({ ai_prompt: e.target.value })}
              rows={4}
              placeholder="مثال: پاسخ‌های زیر یک فرم نظرسنجی است. آنها را تحلیل کن و خلاصه‌ای ۳ جمله‌ای ارائه بده."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">فیلدها</h3>
              <Button size="sm" onClick={addField}><Plus className="w-4 h-4 ml-1" /> افزودن فیلد</Button>
            </div>
            <div className="space-y-2">
              {editor.fields.map((f, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => moveField(i, -1)} className="text-xs">▲</button>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <button type="button" onClick={() => moveField(i, 1)} className="text-xs">▼</button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">برچسب</Label>
                        <Input value={f.label} onChange={e => updateField(i, { label: e.target.value })} placeholder="مثلاً: نام شما" />
                      </div>
                      <div>
                        <Label className="text-xs">نوع</Label>
                        <Select value={f.field_type} onValueChange={v => updateField(i, { field_type: v as FieldType })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {f.field_type === 'dropdown' && (
                        <div className="md:col-span-2">
                          <Label className="text-xs">گزینه‌ها (هر خط یک گزینه)</Label>
                          <Textarea
                            rows={3}
                            value={Array.isArray(f.options) ? f.options.join('\n') : ''}
                            onChange={e => updateField(i, { options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                          />
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <Label className="text-xs">راهنما (اختیاری)</Label>
                        <Input value={f.help_text ?? ''} onChange={e => updateField(i, { help_text: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={f.required} onCheckedChange={v => updateField(i, { required: v })} />
                        <Label>الزامی</Label>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeField(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </Card>
              ))}
              {!editor.fields.length && <p className="text-sm text-muted-foreground">هنوز فیلدی اضافه نشده.</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditor(null)}>انصراف</Button>
          <Button onClick={onSave}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    setFields((fs as any) ?? []);
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
    } finally {
      setAnalyzing(null);
    }
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

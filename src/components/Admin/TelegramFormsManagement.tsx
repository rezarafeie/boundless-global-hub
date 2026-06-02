import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Eye, GripVertical, Sparkles, RefreshCw } from 'lucide-react';

type FieldType = 'text' | 'long_text' | 'phone' | 'email' | 'number' | 'dropdown' | 'image' | 'voice' | 'file';

interface FormRow {
  id: string;
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

const TelegramFormsManagement: React.FC = () => {
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
    form: { title: '', description: '', is_active: true, ai_prompt: '', require_login: false },
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
    let formId = f.id;
    if (formId) {
      const { error } = await supabase.from('telegram_forms').update({
        title: f.title, description: f.description ?? null, is_active: !!f.is_active,
        ai_prompt: f.ai_prompt ?? null, require_login: !!f.require_login,
      }).eq('id', formId);
      if (error) { toast({ title: 'خطا', description: error.message, variant: 'destructive' }); return; }
      await supabase.from('telegram_form_fields').delete().eq('form_id', formId);
    } else {
      const { data, error } = await supabase.from('telegram_forms').insert({
        title: f.title, description: f.description ?? null, is_active: !!f.is_active,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">فرم‌های تلگرام</h2>
          <p className="text-sm text-muted-foreground">فرم‌هایی که در ربات تلگرام به کاربران نمایش داده می‌شوند.</p>
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
                    <td className="p-3"><Badge variant={f.is_active ? 'default' : 'secondary'}>{f.is_active ? 'فعال' : 'غیرفعال'}</Badge></td>
                    <td className="p-3">{f.require_login ? '✅' : '—'}</td>
                    <td className="p-3">{f.ai_prompt ? <Sparkles className="w-4 h-4 text-primary" /> : '—'}</td>
                    <td className="p-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing(f)}><Eye className="w-4 h-4" /></Button>
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

      {editor && <FormEditor editor={editor} setEditor={setEditor} onSave={saveForm} />}
      {viewing && <SubmissionsViewer form={viewing} onClose={() => setViewing(null)} />}
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
            <p className="text-xs text-muted-foreground mt-1">اگر پر شود، بعد از ثبت فرم پاسخ AI به‌صورت لحظه‌ای در تلگرام نمایش داده می‌شود.</p>
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

// ============ Submissions Viewer ============
const SubmissionsViewer: React.FC<{ form: FormRow; onClose: () => void }> = ({ form, onClose }) => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('telegram_form_submissions')
      .select('*, telegram_form_answers(*, telegram_form_fields(label, field_type, order_index))')
      .eq('form_id', form.id).order('created_at', { ascending: false }).limit(200);
    setSubs(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [form.id]);

  const reanalyze = async (sub: any) => {
    if (!form.ai_prompt) { toast({ title: 'پرامپت AI تنظیم نشده', variant: 'destructive' }); return; }
    setAnalyzing(sub.id);
    try {
      const { error } = await supabase.functions.invoke('telegram-form-analyze', {
        body: { submission_id: sub.id },
      });
      if (error) throw error;
      toast({ title: '✅ تحلیل به تلگرام ارسال شد' });
      setTimeout(load, 3000);
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>پاسخ‌های فرم: {form.title}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-8 text-center">در حال بارگذاری...</div>
        ) : subs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">هیچ پاسخی ثبت نشده.</div>
        ) : (
          <div className="space-y-3">
            {subs.map(s => {
              const answers = [...(s.telegram_form_answers ?? [])].sort(
                (a, b) => (a.telegram_form_fields?.order_index ?? 0) - (b.telegram_form_fields?.order_index ?? 0)
              );
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Chat ID: <code>{s.chat_id}</code> — {new Date(s.created_at).toLocaleString('fa-IR')}
                      </CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge variant={s.status === 'completed' || s.status === 'analyzed' ? 'default' : 'secondary'}>{s.status}</Badge>
                        {form.ai_prompt && (
                          <Button size="sm" variant="outline" disabled={analyzing === s.id} onClick={() => reanalyze(s)}>
                            <Sparkles className="w-3 h-3 ml-1" />
                            {analyzing === s.id ? 'ارسال...' : 'تحلیل AI'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {answers.map((a: any) => (
                      <div key={a.id} className="flex gap-2">
                        <span className="font-medium text-muted-foreground">{a.telegram_form_fields?.label}:</span>
                        {a.file_url ? (
                          <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary underline">مشاهده فایل</a>
                        ) : (
                          <span>{a.value_text ?? '—'}</span>
                        )}
                      </div>
                    ))}
                    {s.ai_response && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap">
                        <div className="font-bold mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> پاسخ AI:</div>
                        {s.ai_response}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 ml-1" /> بازخوانی</Button>
          <Button onClick={onClose}>بستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramFormsManagement;

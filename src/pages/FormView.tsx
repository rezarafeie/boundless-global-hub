import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, LogIn } from 'lucide-react';

type FieldType = 'text' | 'long_text' | 'phone' | 'email' | 'number' | 'dropdown' | 'image' | 'voice' | 'file';

interface Field {
  id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: any;
  help_text: string | null;
  order_index: number;
}

interface FormData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  require_login: boolean;
}

const FormView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, { url: string; mime: string } | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      setLoading(true);
      const { data: f } = await supabase
        .from('telegram_forms')
        .select('id, title, slug, description, is_active, require_login')
        .eq('slug', slug)
        .maybeSingle();
      if (!f) { setError('فرم یافت نشد'); setLoading(false); return; }
      if (!f.is_active) { setError('این فرم غیرفعال است'); setLoading(false); return; }
      setForm(f as FormData);
      const { data: flds } = await supabase
        .from('telegram_form_fields')
        .select('*')
        .eq('form_id', f.id)
        .order('order_index');
      setFields((flds as Field[]) ?? []);
      setLoading(false);
    })();
  }, [slug]);

  const setVal = (id: string, v: string) => setValues((p) => ({ ...p, [id]: v }));

  const uploadFile = async (fieldId: string, file: File) => {
    try {
      const path = `web-forms/${form!.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('form-uploads').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('form-uploads').getPublicUrl(path);
      setFiles((p) => ({ ...p, [fieldId]: { url: data.publicUrl, mime: file.type } }));
    } catch (e: any) {
      // fallback: data URL (small) — better to skip
      toast({ title: 'آپلود فایل ناموفق بود', description: e.message, variant: 'destructive' });
    }
  };

  const submit = async () => {
    if (!form) return;
    // Validate required
    for (const f of fields) {
      if (!f.required) continue;
      if (['image', 'voice', 'file'].includes(f.field_type)) {
        if (!files[f.id]) { toast({ title: `${f.label} لازم است`, variant: 'destructive' }); return; }
      } else {
        if (!values[f.id]?.trim()) { toast({ title: `${f.label} لازم است`, variant: 'destructive' }); return; }
      }
    }

    // Extract phone & name heuristically
    let phone: string | null = null;
    let fullName: string | null = null;
    for (const f of fields) {
      const v = values[f.id]?.trim();
      if (!v) continue;
      if (f.field_type === 'phone' && !phone) phone = v;
      const k = f.label.toLowerCase();
      if (!fullName && (k.includes('نام') || k.includes('name'))) fullName = v;
    }
    if (!phone && user?.phone) phone = user.phone;
    if (!fullName && user) fullName = (user as any).full_name || user.name || null;

    const answers = fields.map((f) => ({
      field_id: f.id,
      value_text: values[f.id] ?? null,
      file_url: files[f.id]?.url ?? null,
      file_mime: files[f.id]?.mime ?? null,
    }));

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-web-form', {
        body: {
          form_id: form.id,
          chat_user_id: user?.id ? Number(user.id) || null : null,
          phone,
          full_name: fullName,
          answers,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDone(true);
    } catch (e: any) {
      toast({ title: 'ارسال ناموفق بود', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
          <p className="text-lg">{error ?? 'فرم یافت نشد'}</p>
          <Link to="/" className="text-primary underline mt-4 inline-block">بازگشت به خانه</Link>
        </CardContent></Card>
      </div>
    );
  }

  if (form.require_login && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            <CardDescription>برای تکمیل این فرم باید وارد حساب کاربری خود شوید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={`/auth?redirect=${encodeURIComponent(`/form/${form.slug}`)}`}>
              <Button className="w-full"><LogIn className="w-4 h-4 ml-2" /> ورود به حساب</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">با تشکر!</h2>
            <p className="text-muted-foreground">پاسخ شما با موفقیت ثبت شد.</p>
            <Link to="/"><Button variant="outline">بازگشت به خانه</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && <CardDescription className="whitespace-pre-wrap">{form.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-5">
            {fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <Label>
                  {f.label}{f.required && <span className="text-destructive mr-1">*</span>}
                </Label>
                {f.help_text && <p className="text-xs text-muted-foreground">{f.help_text}</p>}
                {f.field_type === 'long_text' ? (
                  <Textarea rows={4} value={values[f.id] ?? ''} onChange={(e) => setVal(f.id, e.target.value)} />
                ) : f.field_type === 'dropdown' ? (
                  <Select value={values[f.id] ?? ''} onValueChange={(v) => setVal(f.id, v)}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(f.options) ? f.options : []).map((o: string) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : ['image', 'voice', 'file'].includes(f.field_type) ? (
                  <div>
                    <Input
                      type="file"
                      accept={f.field_type === 'image' ? 'image/*' : f.field_type === 'voice' ? 'audio/*' : undefined}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(f.id, file);
                      }}
                    />
                    {files[f.id] && <p className="text-xs text-green-600 mt-1">✓ آپلود شد</p>}
                  </div>
                ) : (
                  <Input
                    type={f.field_type === 'email' ? 'email' : f.field_type === 'number' ? 'number' : f.field_type === 'phone' ? 'tel' : 'text'}
                    value={values[f.id] ?? ''}
                    onChange={(e) => setVal(f.id, e.target.value)}
                    dir={f.field_type === 'phone' || f.field_type === 'email' || f.field_type === 'number' ? 'ltr' : 'rtl'}
                  />
                )}
              </div>
            ))}
            <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
              {submitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              ارسال
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormView;

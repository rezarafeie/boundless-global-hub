import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, LogIn, ArrowLeft, ArrowRight, Sparkles,
  Upload, Mic, Image as ImageIcon, FileText, Phone as PhoneIcon, Mail, Hash, Type, AlignLeft, List,
} from 'lucide-react';

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

const TYPE_ICON: Record<FieldType, React.ComponentType<any>> = {
  text: Type, long_text: AlignLeft, phone: PhoneIcon, email: Mail, number: Hash,
  dropdown: List, image: ImageIcon, voice: Mic, file: FileText,
};

const FormView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, { url: string; mime: string; name: string } | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // step 0 = intro, 1..N = field, N+1 = review
  const [step, setStep] = useState(0);

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
      if (!f.is_active) { setError('این فرم در حال حاضر غیرفعال است'); setLoading(false); return; }
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
      setFiles((p) => ({ ...p, [fieldId]: { url: data.publicUrl, mime: file.type, name: file.name } }));
      toast({ title: 'فایل آپلود شد ✓' });
    } catch (e: any) {
      toast({ title: 'آپلود فایل ناموفق بود', description: e.message, variant: 'destructive' });
    }
  };

  const isFieldValid = (f: Field) => {
    if (!f.required) return true;
    if (['image', 'voice', 'file'].includes(f.field_type)) return !!files[f.id];
    return !!values[f.id]?.trim();
  };

  const totalSteps = fields.length + 2; // intro + fields + review
  const progress = Math.round((step / Math.max(1, totalSteps - 1)) * 100);

  const next = () => {
    if (step >= 1 && step <= fields.length) {
      const f = fields[step - 1];
      if (!isFieldValid(f)) {
        toast({ title: `${f.label} لازم است`, variant: 'destructive' });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!form) return;
    for (const f of fields) if (!isFieldValid(f)) { toast({ title: `${f.label} لازم است`, variant: 'destructive' }); return; }

    let phone: string | null = null;
    let fullName: string | null = null;
    for (const f of fields) {
      const v = values[f.id]?.trim();
      if (!v) continue;
      if (f.field_type === 'phone' && !phone) phone = v;
      const k = f.label.toLowerCase();
      if (!fullName && (k.includes('نام') || k.includes('name'))) fullName = v;
    }
    if (!phone && (user as any)?.phone) phone = (user as any).phone;
    if (!fullName && user) fullName = (user as any).full_name || (user as any).name || null;

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
          chat_user_id: (user as any)?.id ? Number((user as any).id) || null : null,
          phone,
          full_name: fullName,
          answers,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDone(true);
    } catch (e: any) {
      toast({ title: 'ارسال ناموفق بود', description: e.message ?? 'خطا', variant: 'destructive' });
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
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{form.title}</h2>
            <p className="text-muted-foreground">برای تکمیل این فرم باید وارد حساب کاربری خود شوید.</p>
            <Link to={`/auth?redirect=${encodeURIComponent(`/form/${form.slug}`)}`}>
              <Button className="w-full" size="lg">ورود به حساب</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-md w-full">
            <CardContent className="p-10 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold">با تشکر!</h2>
              <p className="text-muted-foreground">پاسخ شما با موفقیت ثبت شد. به زودی با شما در ارتباط خواهیم بود.</p>
              <Link to="/"><Button variant="outline" className="mt-2">بازگشت به خانه</Button></Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Field renderer
  const renderField = (f: Field) => {
    const Icon = TYPE_ICON[f.field_type] ?? Type;
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold leading-snug">
              {f.label}{f.required && <span className="text-destructive mr-1">*</span>}
            </h2>
            {f.help_text && <p className="text-sm text-muted-foreground mt-1">{f.help_text}</p>}
          </div>
        </div>

        <div className="pt-2">
          {f.field_type === 'long_text' ? (
            <Textarea rows={5} value={values[f.id] ?? ''} onChange={(e) => setVal(f.id, e.target.value)} className="text-base" autoFocus />
          ) : f.field_type === 'dropdown' ? (
            <div className="grid gap-2">
              {(Array.isArray(f.options) ? f.options : []).map((o: string) => {
                const active = values[f.id] === o;
                return (
                  <button key={o} type="button" onClick={() => setVal(f.id, o)}
                    className={`text-right p-4 rounded-xl border-2 transition-all ${active
                      ? 'border-primary bg-primary/5 font-semibold'
                      : 'border-border hover:border-primary/50'}`}>
                    {o}
                  </button>
                );
              })}
            </div>
          ) : ['image', 'voice', 'file'].includes(f.field_type) ? (
            <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {files[f.id] ? `✓ ${files[f.id]!.name}` : 'برای انتخاب فایل کلیک کنید'}
              </p>
              <input type="file" className="hidden"
                accept={f.field_type === 'image' ? 'image/*' : f.field_type === 'voice' ? 'audio/*' : undefined}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(f.id, file); }}
              />
            </label>
          ) : (
            <Input
              type={f.field_type === 'email' ? 'email' : f.field_type === 'number' ? 'number' : f.field_type === 'phone' ? 'tel' : 'text'}
              value={values[f.id] ?? ''}
              onChange={(e) => setVal(f.id, e.target.value)}
              dir={f.field_type === 'phone' || f.field_type === 'email' || f.field_type === 'number' ? 'ltr' : 'rtl'}
              className="text-lg h-14"
              autoFocus
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>گام {Math.min(step + 1, totalSteps)} از {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 shadow-lg">
          <CardContent className="p-6 md:p-10 min-h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {step === 0 && (
                  <div className="text-center space-y-4 py-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{form.title}</h1>
                    {form.description && (
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{form.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground pt-2">
                      تکمیل این فرم حدود {Math.max(1, Math.ceil(fields.length / 2))} دقیقه زمان می‌برد
                    </p>
                  </div>
                )}

                {step >= 1 && step <= fields.length && renderField(fields[step - 1])}

                {step === fields.length + 1 && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2 mb-6">
                      <h2 className="text-2xl font-bold">بازبینی پاسخ‌ها</h2>
                      <p className="text-sm text-muted-foreground">قبل از ارسال یک نگاه دیگر بیندازید</p>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {fields.map((f) => (
                        <div key={f.id} className="p-3 rounded-lg bg-muted/40">
                          <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
                          <div className="text-sm font-medium break-words">
                            {files[f.id] ? `📎 ${files[f.id]!.name}` : (values[f.id]?.trim() || <span className="text-muted-foreground">—</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t">
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                <ArrowRight className="w-4 h-4 ml-1" />
                قبلی
              </Button>
              {step < totalSteps - 1 ? (
                <Button onClick={next} size="lg" className="min-w-[140px]">
                  {step === 0 ? 'شروع' : 'بعدی'}
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              ) : (
                <Button onClick={submit} size="lg" disabled={submitting} className="min-w-[140px]">
                  {submitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  ارسال نهایی
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormView;

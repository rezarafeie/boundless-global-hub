import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, LogIn, ArrowLeft, ArrowRight, Sparkles, Upload, Mic, Image as ImageIcon,
  FileText, Phone as PhoneIcon, Mail, Hash, Type, AlignLeft, List, Info, MessageSquare,
} from 'lucide-react';

type FieldType =
  | 'text' | 'long_text' | 'phone' | 'email' | 'number'
  | 'dropdown' | 'image' | 'voice' | 'file'
  | 'message' | 'ai_analysis';

interface Field {
  id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: any; // for message: { content, media_url, media_type }
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
  ai_enabled: boolean;
}

const TYPE_ICON: Record<FieldType, React.ComponentType<any>> = {
  text: Type, long_text: AlignLeft, phone: PhoneIcon, email: Mail, number: Hash,
  dropdown: List, image: ImageIcon, voice: Mic, file: FileText,
  message: Info, ai_analysis: Sparkles,
};

const INPUT_TYPES: FieldType[] = ['text', 'long_text', 'phone', 'email', 'number', 'dropdown', 'image', 'voice', 'file'];
const isInputField = (t: FieldType) => INPUT_TYPES.includes(t);

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
  const [done, setDone] = useState<null | { message?: string }>(null);
  const [error, setError] = useState<string | null>(null);

  const [aiStream, setAiStream] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const aiAbort = useRef<AbortController | null>(null);

  // step 0 = intro, 1..N = fields/messages, last input step + 1 = review (only if has input fields)
  const [step, setStep] = useState(0);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      setLoading(true);
      const { data: f } = await supabase
        .from('telegram_forms')
        .select('id, title, slug, description, is_active, require_login, ai_enabled')
        .eq('slug', slug).maybeSingle();
      if (!f) { setError('فرم یافت نشد'); setLoading(false); return; }
      if (!f.is_active) { setError('این فرم در حال حاضر غیرفعال است'); setLoading(false); return; }
      setForm(f as FormData);
      const { data: flds } = await supabase
        .from('telegram_form_fields')
        .select('*').eq('form_id', f.id).order('order_index');
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
    if (!isInputField(f.field_type)) return true;
    if (!f.required) return true;
    if (['image', 'voice', 'file'].includes(f.field_type)) return !!files[f.id];
    return !!values[f.id]?.trim();
  };

  const hasInputFields = fields.some((f) => isInputField(f.field_type));
  const hasAiField = fields.some((f) => f.field_type === 'ai_analysis');
  const totalSteps = fields.length + (hasInputFields ? 2 : 1); // intro + fields + (review if inputs exist)
  const reviewStep = fields.length + 1;
  const progress = Math.round((step / Math.max(1, totalSteps - 1)) * 100);

  const next = () => {
    if (step >= 1 && step <= fields.length) {
      const f = fields[step - 1];
      if (isInputField(f.field_type) && !isFieldValid(f)) {
        toast({ title: `${f.label} لازم است`, variant: 'destructive' });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const startAiStream = async (submissionId: string) => {
    setAiLoading(true);
    setAiStream('');
    setAiDone(false);
    aiAbort.current = new AbortController();
    try {
      const url = `https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/ai-form-analyze-stream`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI`,
          'apikey': `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI`,
        },
        body: JSON.stringify({ submission_id: submissionId }),
        signal: aiAbort.current.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`AI status ${resp.status}`);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            if (j.delta) setAiStream((p) => p + j.delta);
          } catch { /* */ }
        }
      }
      setAiDone(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setAiStream((p) => p + `\n\n[خطا در دریافت تحلیل: ${e.message}]`);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    if (!form) return;
    for (const f of fields) {
      if (isInputField(f.field_type) && !isFieldValid(f)) {
        toast({ title: `${f.label} لازم است`, variant: 'destructive' }); return;
      }
    }

    let phone: string | null = null;
    let fullName: string | null = null;
    for (const f of fields) {
      if (!isInputField(f.field_type)) continue;
      const v = values[f.id]?.trim();
      if (!v) continue;
      if (f.field_type === 'phone' && !phone) phone = v;
      const k = f.label.toLowerCase();
      if (!fullName && (k.includes('نام') || k.includes('name'))) fullName = v;
    }
    if (!phone && (user as any)?.phone) phone = (user as any).phone;
    if (!fullName && user) fullName = (user as any).full_name || (user as any).name || null;

    const answers = fields.filter((f) => isInputField(f.field_type)).map((f) => ({
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
          phone, full_name: fullName, answers,
        },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw new Error(d.error);

      // AI streaming (if enabled or there's an ai_analysis field)
      if ((form.ai_enabled || hasAiField) && d?.submission_id) {
        startAiStream(d.submission_id);
      }

      // Confirmation/redirect handling
      if (d?.confirmation_type === 'redirect' && d?.redirect_url) {
        // Allow short delay so AI can show or for UX
        if (hasAiField) {
          // show AI then redirect after stream done is handled separately
          setDone({ message: 'در حال هدایت به صفحه بعدی...' });
          // We'll redirect via effect below when aiDone
          const target = d.redirect_url;
          const tick = () => {
            if (aiDone || !hasAiField) { window.location.href = target; return; }
            setTimeout(tick, 500);
          };
          setTimeout(tick, 1500);
        } else {
          window.location.href = d.redirect_url;
          return;
        }
      } else {
        setDone({ message: d?.confirmation_message ?? undefined });
      }
    } catch (e: any) {
      toast({ title: 'ارسال ناموفق بود', description: e.message ?? 'خطا', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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
            <Link to={`/auth?redirect=${encodeURIComponent(`/f/${form.slug}`)}`}>
              <Button className="w-full" size="lg">ورود به حساب</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl">
          <Card className="border-2">
            <CardContent className="p-8 md:p-10 text-center space-y-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
                className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold">با تشکر!</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {done.message ?? 'پاسخ شما با موفقیت ثبت شد. به زودی با شما در ارتباط خواهیم بود.'}
              </p>

              {(aiLoading || aiStream) && (
                <div className="text-right space-y-2 pt-4 border-t mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="w-4 h-4" /> تحلیل هوش مصنوعی
                    {aiLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 whitespace-pre-wrap text-sm leading-loose min-h-[60px]">
                    {aiStream || <span className="text-muted-foreground">در حال آماده‌سازی تحلیل...</span>}
                  </div>
                </div>
              )}

              <Link to="/"><Button variant="outline" className="mt-2">بازگشت به خانه</Button></Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const renderMessageField = (f: Field) => {
    const content = f.options?.content ?? f.help_text ?? f.label ?? '';
    const mediaUrl = f.options?.media_url;
    const mediaType = f.options?.media_type;
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-blue-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold leading-snug">{f.label}</h2>
        </div>
        {mediaUrl && (
          <div className="rounded-xl overflow-hidden bg-muted">
            {mediaType?.startsWith('video') ? (
              <video src={mediaUrl} controls className="w-full" />
            ) : mediaType?.startsWith('audio') ? (
              <audio src={mediaUrl} controls className="w-full" />
            ) : (
              <img src={mediaUrl} alt="" className="w-full" />
            )}
          </div>
        )}
        <div className="text-base leading-loose whitespace-pre-wrap text-muted-foreground">{content}</div>
      </div>
    );
  };

  const renderAiField = (_f: Field) => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">تحلیل هوش مصنوعی</h2>
      </div>
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
        پس از ارسال فرم، یک تحلیل اختصاصی توسط هوش مصنوعی برای شما نمایش داده می‌شود.
      </div>
    </div>
  );

  const renderInputField = (f: Field) => {
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

  const renderField = (f: Field) => {
    if (f.field_type === 'message') return renderMessageField(f);
    if (f.field_type === 'ai_analysis') return renderAiField(f);
    return renderInputField(f);
  };

  const isLastStep = step === totalSteps - 1;
  const isReviewStep = hasInputFields && step === reviewStep;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
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
                      <MessageSquare className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{form.title}</h1>
                    {form.description && (
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{form.description}</p>
                    )}
                    {hasInputFields && (
                      <p className="text-sm text-muted-foreground pt-2">
                        تکمیل این فرم حدود {Math.max(1, Math.ceil(fields.filter(f => isInputField(f.field_type)).length / 2))} دقیقه زمان می‌برد
                      </p>
                    )}
                  </div>
                )}

                {step >= 1 && step <= fields.length && renderField(fields[step - 1])}

                {isReviewStep && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2 mb-6">
                      <h2 className="text-2xl font-bold">بازبینی پاسخ‌ها</h2>
                      <p className="text-sm text-muted-foreground">قبل از ارسال یک نگاه دیگر بیندازید</p>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {fields.filter(f => isInputField(f.field_type)).map((f) => (
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

            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t">
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                <ArrowRight className="w-4 h-4 ml-1" /> قبلی
              </Button>
              {!isLastStep ? (
                <Button onClick={next} size="lg" className="min-w-[140px]">
                  {step === 0 ? 'شروع' : 'بعدی'}
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              ) : (
                <Button onClick={hasInputFields ? submit : submit} size="lg" disabled={submitting} className="min-w-[140px]">
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

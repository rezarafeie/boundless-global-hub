import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2, CreditCard, Loader2, Upload, ShieldCheck, XCircle, Copy,
  CalendarClock, Headphones, Sparkles, Target, Lock, BadgeCheck, Users, Clock,
  Phone, Send,
} from 'lucide-react';

type Settings = {
  is_active: boolean;
  title: string;
  description: string;
  price: number;
  card_details: string;
  success_message: string;
};

const GATEWAYS: { id: 'zarinpal' | 'zibal' | 'rafieipay'; label: string; hint: string }[] = [
  { id: 'zarinpal', label: 'زرین‌پال', hint: 'کارت‌های شتاب' },
  { id: 'zibal', label: 'زیبال', hint: 'درگاه پشتیبان' },
  { id: 'rafieipay', label: 'رفیعی‌پی', hint: 'درگاه اختصاصی' },
];

const BENEFITS = [
  { icon: Target, title: 'بررسی اختصاصی شرایط شما', desc: 'وضعیت فعلی، سرمایه و هدف‌تان بررسی و مسیر مناسب پیشنهاد می‌شود.' },
  { icon: Sparkles, title: 'نقشه راه شخصی‌سازی‌شده', desc: 'گام‌به‌گام مشخص می‌شود از کجا شروع کنید و چه چیزی را حذف کنید.' },
  { icon: Headphones, title: 'پاسخ به تمام سؤالات دوره', desc: 'هر ابهامی درباره دوره بدون مرز، پرداخت و پشتیبانی برطرف می‌شود.' },
  { icon: CalendarClock, title: 'زمان‌بندی منعطف', desc: 'بعد از ثبت رزرو، برای هماهنگی ساعت جلسه با شما تماس گرفته می‌شود.' },
];

const STEPS = [
  { n: '۱', t: 'تکمیل فرم', d: 'نام و شماره تماس خود را وارد کنید.' },
  { n: '۲', t: 'پرداخت هزینه رزرو', d: 'آنلاین یا کارت‌به‌کارت با ارسال رسید.' },
  { n: '۳', t: 'هماهنگی جلسه', d: 'کارشناس ما برای تعیین زمان تماس می‌گیرد.' },
  { n: '۴', t: 'برگزاری مشاوره', d: 'جلسه اختصاصی و دریافت نقشه راه.' },
];

const FAQS = [
  { q: 'هزینه رزرو قابل بازگشت است؟', a: 'بله، تمام مبلغ رزرو بدون هیچ سؤالی بازگردانده می‌شود. چه بخواهید بعد از ثبت‌نام در دوره بدون مرز پول خود را پس بگیرید و چه تصمیم به ثبت‌نام نگیرید، بازپرداخت کامل انجام می‌شود. این مبلغ صرفاً برای تضمین حضور شما در جلسه دریافت می‌شود.' },
  { q: 'جلسه مشاوره چقدر طول می‌کشد؟', a: 'به‌طور میانگین بین ۲۰ تا ۳۰ دقیقه، به‌صورت تلفنی یا آنلاین و کاملاً اختصاصی.' },
  { q: 'بعد از پرداخت چه اتفاقی می‌افتد؟', a: 'رزرو شما ثبت می‌شود و کارشناسان ما در اولین فرصت کاری برای هماهنگی زمان جلسه با شما تماس می‌گیرند.' },
  { q: 'اگر پرداخت آنلاین انجام نشد چه کنم؟', a: 'می‌توانید از درگاه‌های جایگزین استفاده کنید یا با روش کارت‌به‌کارت مبلغ را واریز و تصویر رسید را بارگذاری کنید.' },
];

const Reserve: React.FC = () => {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gateway, setGateway] = useState<'zarinpal' | 'zibal' | 'rafieipay'>('zarinpal');
  const [mode, setMode] = useState<'online' | 'manual'>('online');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState<'success' | 'failed' | 'manual' | null>(null);
  const [verifying, setVerifying] = useState(false);

  const rid = params.get('rid');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('consultation_reservation_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (data) setSettings(data as unknown as Settings);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!rid) return;
    setVerifying(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('reserve-payment-verify', {
          body: {
            reservationId: rid,
            authority: params.get('Authority') || params.get('authority'),
            trackId: params.get('trackId') || params.get('track_id'),
            transactionId: params.get('transaction_id'),
          },
        });
        if (error) throw error;
        setResult(data?.success ? 'success' : 'failed');
      } catch {
        setResult('failed');
      } finally {
        setVerifying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  const priceLabel = useMemo(
    () => (settings?.price ? `${Number(settings.price).toLocaleString('fa-IR')} تومان` : '—'),
    [settings?.price]
  );

  const validate = () => {
    if (!fullName.trim()) return 'لطفاً نام و نام خانوادگی را وارد کنید';
    if (!/^[0-9+\-\s]{8,20}$/.test(phone.trim())) return 'شماره تماس معتبر نیست';
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return 'ایمیل معتبر نیست';
    return null;
  };

  const handleOnline = async () => {
    const err = validate();
    if (err) return toast({ title: err, variant: 'destructive' });
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reserve-payment-request', {
        body: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          gateway,
          userId: user?.id ?? null,
          firstName: user?.firstName || null,
          lastName: user?.lastName || null,
          source: 'landing',
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.success && data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      throw new Error(data?.error || 'خطا در اتصال به درگاه');
    } catch (e: any) {
      toast({ title: e?.message || 'خطا در ثبت پرداخت', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManual = async () => {
    const err = validate();
    if (err) return toast({ title: err, variant: 'destructive' });
    if (!receipt) return toast({ title: 'لطفاً تصویر رسید را بارگذاری کنید', variant: 'destructive' });
    if (receipt.size > 5 * 1024 * 1024) return toast({ title: 'حجم فایل باید کمتر از ۵ مگابایت باشد', variant: 'destructive' });

    setSubmitting(true);
    try {
      const ext = receipt.name.split('.').pop() || 'jpg';
      const fileName = `reservation-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('payment-receipts').upload(fileName, receipt);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('payment-receipts').getPublicUrl(fileName);

      const { error } = await supabase.from('consultation_reservations').insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        amount: Number(settings?.price || 0),
        payment_method: 'manual',
        payment_status: 'pending_review',
        receipt_url: pub.publicUrl,
        notes: note.trim() || null,
        source: 'landing',
      });
      if (error) throw error;
      setResult('manual');
    } catch (e: any) {
      toast({ title: e?.message || 'خطا در ارسال رسید', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyCard = async () => {
    const digits = (settings?.card_details || '').match(/\d[\d\s-]{10,}/)?.[0]?.replace(/\D/g, '');
    if (!digits) return;
    await navigator.clipboard.writeText(digits);
    toast({ title: 'شماره کارت کپی شد ✅' });
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background" dir="rtl">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{verifying ? 'در حال بررسی پرداخت...' : 'در حال بارگذاری...'}</p>
      </div>
    );
  }

  if (result) {
    const ok = result !== 'failed';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/40 to-background px-4" dir="rtl">
        <Card className="max-w-md w-full text-center border-2 shadow-lg">
          <CardContent className="p-8 space-y-4">
            <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${ok ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              {ok ? <CheckCircle2 className="h-9 w-9 text-primary" /> : <XCircle className="h-9 w-9 text-destructive" />}
            </div>
            <h1 className="text-xl font-bold">
              {result === 'success' && 'رزرو شما ثبت شد'}
              {result === 'manual' && 'رسید شما دریافت شد'}
              {result === 'failed' && 'پرداخت ناموفق بود'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result === 'success' && (settings?.success_message || 'به‌زودی با شما تماس می‌گیریم.')}
              {result === 'manual' && 'رسید شما پس از بررسی توسط کارشناسان تأیید و رزرو نهایی می‌شود.'}
              {result === 'failed' && 'مبلغی از حساب شما کسر نشده است. لطفاً دوباره تلاش کنید.'}
            </p>
            {ok && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
                مرحله بعد: کارشناسان ما در اولین فرصت کاری برای هماهنگی زمان جلسه با شما تماس می‌گیرند.
              </div>
            )}
            {result === 'failed' && (
              <Button onClick={() => (window.location.href = '/reserve')}>تلاش مجدد</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (settings && settings.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-2">
            <h1 className="text-lg font-bold">ثبت رزرو در حال حاضر غیرفعال است</h1>
            <p className="text-sm text-muted-foreground">لطفاً بعداً مراجعه کنید.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <header className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.15),transparent_55%)]" />
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center space-y-4">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> ظرفیت محدود جلسات مشاوره
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold leading-relaxed">
            {settings?.title || 'رزرو مشاوره دوره بدون مرز'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-loose whitespace-pre-line max-w-2xl mx-auto">
            {settings?.description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> پرداخت امن</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> جلسه ۲۰ تا ۳۰ دقیقه</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5"><Users className="h-3.5 w-3.5 text-primary" /> کاملاً اختصاصی</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 grid gap-8 lg:grid-cols-5">
        {/* Content column */}
        <section className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">در این جلسه چه چیزی دریافت می‌کنید؟</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {BENEFITS.map(b => (
                <div key={b.title} className="rounded-xl border bg-card p-4 space-y-2 hover:border-primary/40 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold">مراحل رزرو</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {STEPS.map(s => (
                <div key={s.n} className="flex gap-3 rounded-xl border bg-card p-4">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold">سؤالات متداول</h2>
            <Accordion type="single" collapsible className="rounded-xl border bg-card px-4">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className={i === FAQS.length - 1 ? 'border-b-0' : ''}>
                  <AccordionTrigger className="text-sm text-right hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold">ارتباط با ما</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="tel:02128427131"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">تماس تلفنی</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">021-28427131</p>
                </div>
              </a>
              <a
                href="https://t.me/rafieiacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Send className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">تلگرام</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">@rafieiacademy</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Form column */}
        <section className="lg:col-span-2 order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 space-y-4">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>مبلغ رزرو</span>
                  <span className="text-primary text-lg font-extrabold">{priceLabel}</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">این مبلغ صرفاً برای تضمین حضور شما در جلسه دریافت می‌شود.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>نام و نام خانوادگی *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} placeholder="نام کامل" />
                </div>
                <div className="space-y-1.5">
                  <Label>شماره تماس *</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" maxLength={20} placeholder="09xxxxxxxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label>ایمیل (اختیاری)</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} dir="ltr" maxLength={255} placeholder="you@example.com" />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  <Button variant={mode === 'online' ? 'default' : 'outline'} onClick={() => setMode('online')}>
                    <CreditCard className="h-4 w-4 ml-2" /> پرداخت آنلاین
                  </Button>
                  <Button variant={mode === 'manual' ? 'default' : 'outline'} onClick={() => setMode('manual')}>
                    <Upload className="h-4 w-4 ml-2" /> کارت به کارت
                  </Button>
                </div>

                {mode === 'online' ? (
                  <div className="space-y-3">
                    <Label>انتخاب درگاه پرداخت</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {GATEWAYS.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGateway(g.id)}
                          className={`rounded-lg border p-2 text-center transition ${gateway === g.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}
                        >
                          <span className="block text-xs font-semibold">{g.label}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{g.hint}</span>
                        </button>
                      ))}
                    </div>
                    <Button className="w-full h-11" disabled={submitting} onClick={handleOnline}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ShieldCheck className="h-4 w-4 ml-2" />}
                      پرداخت و رزرو جلسه
                    </Button>
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lock className="h-3 w-3" /> انتقال به درگاه بانکی امن
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settings?.card_details && (
                      <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line leading-relaxed space-y-2">
                        <div dir="ltr" className="text-right">{settings.card_details}</div>
                        <Button variant="outline" size="sm" className="w-full" onClick={copyCard}>
                          <Copy className="h-3.5 w-3.5 ml-2" /> کپی شماره کارت
                        </Button>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>تصویر رسید پرداخت *</Label>
                      <Input type="file" accept="image/*,application/pdf" onChange={e => setReceipt(e.target.files?.[0] || null)} />
                      <p className="text-[11px] text-muted-foreground">حداکثر ۵ مگابایت — تصویر یا PDF</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>توضیحات (اختیاری)</Label>
                      <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
                    </div>
                    <Button className="w-full h-11" disabled={submitting} onClick={handleManual}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                      ارسال رسید و ثبت رزرو
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="rounded-xl border bg-card p-4 space-y-2">
              {['ثبت آنی رزرو پس از پرداخت', 'تماس کارشناس در اولین فرصت کاری', 'پشتیبانی کامل تا زمان جلسه'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" /> {t}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Reserve;

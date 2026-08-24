import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, CreditCard, Loader2, Upload, ShieldCheck, XCircle } from 'lucide-react';

type Settings = {
  is_active: boolean;
  title: string;
  description: string;
  price: number;
  card_details: string;
  success_message: string;
};

const GATEWAYS: { id: 'zarinpal' | 'zibal' | 'rafieipay'; label: string }[] = [
  { id: 'zarinpal', label: 'زرین‌پال' },
  { id: 'zibal', label: 'زیبال' },
  { id: 'rafieipay', label: 'رفیعی‌پی' },
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

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (result) {
    const ok = result !== 'failed';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            {ok ? (
              <CheckCircle2 className="h-14 w-14 mx-auto text-green-600" />
            ) : (
              <XCircle className="h-14 w-14 mx-auto text-destructive" />
            )}
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
    <div className="min-h-screen bg-background py-10 px-4" dir="rtl">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{settings?.title || 'رزرو مشاوره دوره بدون مرز'}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {settings?.description}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>مبلغ رزرو</span>
              <span className="text-primary">{priceLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نام و نام خانوادگی *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label>شماره تماس *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" maxLength={20} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ایمیل (اختیاری)</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} dir="ltr" maxLength={255} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
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
                    <Button
                      key={g.id}
                      variant={gateway === g.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGateway(g.id)}
                    >
                      {g.label}
                    </Button>
                  ))}
                </div>
                <Button className="w-full" disabled={submitting} onClick={handleOnline}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ShieldCheck className="h-4 w-4 ml-2" />}
                  پرداخت و رزرو
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {settings?.card_details && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line leading-relaxed">
                    {settings.card_details}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>تصویر رسید پرداخت *</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={e => setReceipt(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>توضیحات (اختیاری)</Label>
                  <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
                </div>
                <Button className="w-full" disabled={submitting} onClick={handleManual}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                  ارسال رسید و ثبت رزرو
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reserve;

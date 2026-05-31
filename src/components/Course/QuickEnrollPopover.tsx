import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCountryCodeOptions } from '@/lib/countryCodeUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickEnrollSetting } from '@/hooks/useQuickEnrollSetting';

interface QuickEnrollPopoverProps {
  courseSlug: string;
  children: React.ReactElement;
  fallbackHref?: string;
  onFallback?: () => void;
}

const QuickEnrollPopover: React.FC<QuickEnrollPopoverProps> = ({
  courseSlug,
  children,
  fallbackHref,
  onFallback,
}) => {
  const { enabled, loading: loadingSetting } = useQuickEnrollSetting();
  const { user, isAuthenticated } = useAuth();
  const countryOptions = getCountryCodeOptions();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+98',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      let phone = user.phone || '';
      if (phone.startsWith('+98')) phone = phone.substring(3);
      else if (phone.startsWith('98')) phone = phone.substring(2);
      if (phone.startsWith('0')) phone = phone.substring(1);
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone,
        countryCode: user.countryCode || '+98',
      });
    }
  }, [isAuthenticated, user]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (loadingSetting) return;
    if (!enabled) {
      if (onFallback) { onFallback(); return; }
      if (fallbackHref) {
        e.preventDefault();
        window.location.href = fallbackHref;
      }
      return;
    }
    e.preventDefault();
    setOpen(true);
  };

  const update = (k: keyof typeof form, v: string) => {
    if (k === 'phone' && v.startsWith('0')) v = v.replace(/^0+/, '');
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.includes('@') || !form.phone.trim()) {
      toast.error('لطفا تمام فیلدها را به‌درستی پر کنید');
      return;
    }
    setSubmitting(true);
    try {
      const { data: course, error: courseError } = await supabase
        .from('courses').select('*').eq('slug', courseSlug).maybeSingle();
      if (courseError || !course) throw new Error('دوره یافت نشد');

      const now = new Date();
      const isPrelaunch =
        (course as any).is_pre_launch_enabled &&
        (course as any).pre_launch_price != null &&
        (!(course as any).pre_launch_ends_at || new Date((course as any).pre_launch_ends_at) > now);
      const isSale =
        (course as any).is_sale_enabled &&
        (course as any).sale_price != null &&
        (!(course as any).sale_expires_at || new Date((course as any).sale_expires_at) > now);
      const finalPrice = isPrelaunch
        ? (course as any).pre_launch_price
        : isSale ? (course as any).sale_price : course.price;

      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

      if (!finalPrice || finalPrice === 0) {
        const { data: resp, error } = await supabase.functions.invoke('create-enrollment', {
          body: {
            course_id: course.id, full_name: fullName,
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(), country_code: form.countryCode,
            payment_amount: 0, payment_method: 'free',
            payment_status: 'completed', force_create: true,
          },
        });
        if (error || !resp?.success) throw new Error(resp?.error || error?.message || 'خطا در ثبت‌نام');
        toast.success('ثبت‌نام انجام شد');
        setOpen(false);
        navigate(`/enroll/success?course=${course.slug}&email=${form.email}&enrollment=${resp.enrollment.id}&status=OK&Authority=FREE_COURSE`);
      } else {
        const { data, error } = await supabase.functions.invoke('zarinpal-request', {
          body: {
            courseSlug: course.slug,
            firstName: form.firstName, lastName: form.lastName,
            email: form.email, phone: form.phone,
            countryCode: form.countryCode, customAmount: finalPrice,
          },
        });
        if (error) throw error;
        if (data?.success && data.paymentUrl) window.location.href = data.paymentUrl;
        else throw new Error(data?.error || 'خطا در ایجاد درخواست پرداخت');
      }
    } catch (err: any) {
      toast.error(err.message || 'خطا در ثبت‌نام');
    } finally {
      setSubmitting(false);
    }
  };

  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      if (enabled && !loadingSetting) {
        // Intercept: skip child's original onClick, open quick enroll
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
        return;
      }
      // Quick enroll disabled → run original handler, then fallback if needed
      children.props.onClick?.(e);
      if (!e.defaultPrevented) handleTriggerClick(e);
    },
  });

  if (!enabled) return trigger;

  return (
    <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="top"
          dir="rtl"
          className="rounded-b-3xl border-b border-border p-0 overflow-hidden flex flex-col"
          style={{
            top: 'calc(env(safe-area-inset-top) + 4rem)',
            maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 4rem)',
            height: 'auto',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          <div
            className="px-5 pb-8 pt-2 overflow-y-auto flex-1"
            style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 6rem)', WebkitOverflowScrolling: 'touch' }}
            onFocus={(e) => {
              const t = e.target as HTMLElement;
              if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') {
                setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
              }
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground leading-tight">ثبت‌نام سریع</h3>
                <p className="text-xs text-muted-foreground">کمتر از یک دقیقه</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="نام" value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  required disabled={submitting} className="h-11 text-sm" />
                <Input placeholder="نام خانوادگی" value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  required disabled={submitting} className="h-11 text-sm" />
              </div>
              <Input type="email" placeholder="ایمیل" value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required disabled={submitting} className="h-11 text-sm" />
              <div className="flex gap-2">
                <Select value={form.countryCode} onValueChange={(v) => update('countryCode', v)} disabled={submitting}>
                  <SelectTrigger className="h-11 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((o) => (
                      <SelectItem key={o.code} value={o.code}>{o.flag} {o.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="tel" placeholder="شماره تلفن" value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  required disabled={submitting} className="h-11 text-sm flex-1" />
              </div>
              <Button type="submit" className="w-full h-12 font-semibold text-base" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال پردازش...</>
                ) : 'تایید و ادامه'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                با ثبت‌نام، اطلاعات شما برای پردازش سفارش استفاده می‌شود
              </p>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default QuickEnrollPopover;

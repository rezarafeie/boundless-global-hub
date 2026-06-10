import React from 'react';
import type { SmartField } from '@/data/boundlessSmartTest/types';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Props {
  field: SmartField;
  value: string;
  onChange: (id: string, v: string) => void;
  userName?: string;
  usdRate?: number | null;
  error?: boolean;
  answers?: Record<string, string>;
}

const formatIRR = (n: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(n));

const MINDSET_REJECT_17 =
  'نه فکر میکنم نگرشی که الان دارم خوبه. یه عمر با همین فرمون زندگی کردم. حالا تغییرش بدم؟ عمرا!';
const PAYMENT_REJECT_20 =
  'نه فکر نمیکنم آماده پرداخت بهایی باشم! فعلا میخوام همینطوری برا خودم بگردم تا ببینم چی میشه';

const rewriteRejectReason = (html: string, answers?: Record<string, string>) => {
  if (!html.includes('قصد تغییر نگرش برای ورود و پرداخت بهای')) return html;
  const a = answers || {};
  const mindsetReject = a['17'] === MINDSET_REJECT_17;
  const paymentReject = a['20'] === PAYMENT_REJECT_20;
  let reason = 'قصد تغییر نگرش برای ورود و پرداخت بهای مسیر بدون مرز رو ندارید';
  if (mindsetReject && !paymentReject) reason = 'قصد تغییر نگرش برای ورود به مسیر بدون مرز رو ندارید';
  else if (!mindsetReject && paymentReject) reason = 'قصد پرداخت بهای مسیر بدون مرز رو ندارید';
  return html.replace(
    /قصد تغییر نگرش برای ورود و پرداخت بهای مسیر بدون مرز رو ندارید/g,
    reason,
  );
};

const renderHtml = (
  raw: string,
  userName?: string,
  usdRate?: number | null,
  answers?: Record<string, string>,
) => {
  const safeName = (userName || '').trim();
  let replaced = rewriteRejectReason(raw, answers)
    .replace(/\{user:display_name\}/g, safeName || 'دوست من')
    .replace(/\{Name:1\}/g, safeName || 'دوست من');

  const rateText = usdRate
    ? `${formatIRR(usdRate)} تومان`
    : 'در حال دریافت نرخ روز...';
  replaced = replaced.replace(
    /\[mnswmc_currency[^\]]*\]/g,
    `<b class="text-primary">${rateText}</b>`,
  );

  return { __html: replaced };
};

export const SmartTestField: React.FC<Props> = ({ field, value, onChange, userName, usdRate, error, answers }) => {
  if (field.kind === 'page') return null;

  if (field.kind === 'html') {
    return (
      <div
        className="text-foreground/90 leading-loose [&_a]:text-primary [&_b]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_iframe]:w-full [&_iframe]:h-full"
        dir="rtl"
        dangerouslySetInnerHTML={renderHtml(field.html, userName, usdRate, answers)}
      />
    );
  }

  if (field.kind === 'video') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        <iframe
          src={`https://www.aparat.com/video/video/embed/videohash/${field.aparatHash}/vt/frame`}
          title="ویدیو"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (field.kind === 'radio') {
    return (
      <div className="space-y-3" dir="rtl">
        <p className="text-base font-medium text-foreground text-right leading-relaxed">
          {field.label}
        </p>
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(field.id, v)}
          className="space-y-2"
        >
          {field.choices.map((c, i) => {
            const id = `${field.id}-${i}`;
            return (
              <label
                key={id}
                htmlFor={id}
                className={`flex flex-row-reverse cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition-all hover:bg-muted/50 ${
                  value === c.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <RadioGroupItem id={id} value={c.value} className="mt-1 shrink-0" />
                <span className="flex-1 text-right leading-relaxed">{c.label}</span>
              </label>
            );
          })}
        </RadioGroup>
        {error && (
          <p className="text-xs text-destructive text-right">لطفاً یکی از گزینه‌ها رو انتخاب کن</p>
        )}
      </div>
    );
  }

  // text / email / number / tel
  return (
    <div className="space-y-2" dir="rtl">
      <label htmlFor={field.id} className="text-base font-medium text-foreground text-right block leading-relaxed">
        {field.label}
      </label>
      <Input
        id={field.id}
        type={field.kind === 'number' ? 'number' : field.kind === 'email' ? 'email' : 'text'}
        inputMode={field.kind === 'tel' ? 'tel' : field.kind === 'number' ? 'numeric' : undefined}
        placeholder={(field as any).placeholder}
        value={value}
        onChange={(e) => onChange(field.id, e.target.value)}
        className={`text-right rounded-xl ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        dir="rtl"
      />
      {error && (
        <p className="text-xs text-destructive text-right">
          {field.kind === 'email' ? 'لطفاً یک ایمیل معتبر وارد کن' : 'لطفاً این قسمت رو پر کن'}
        </p>
      )}
    </div>
  );
};

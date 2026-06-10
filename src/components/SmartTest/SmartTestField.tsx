import React from 'react';
import type { SmartField } from '@/data/boundlessSmartTest/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Props {
  field: SmartField;
  value: string;
  onChange: (id: string, v: string) => void;
  userName?: string;
  usdRate?: number | null;
}

const formatIRR = (n: number) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(n));

const renderHtml = (raw: string, userName?: string, usdRate?: number | null) => {
  const safeName = (userName || '').trim();
  let replaced = raw
    .replace(/\{user:display_name\}/g, safeName || 'دوست من')
    .replace(/\{Name:1\}/g, safeName || 'دوست من');

  // Replace legacy currency shortcode with live USD/IRR rate
  const rateText = usdRate
    ? `${formatIRR(usdRate)} تومان`
    : 'در حال دریافت نرخ روز...';
  replaced = replaced.replace(
    /\[mnswmc_currency[^\]]*\]/g,
    `<b class="text-primary">${rateText}</b>`,
  );

  return { __html: replaced };
};

export const SmartTestField: React.FC<Props> = ({ field, value, onChange, userName, usdRate }) => {
  if (field.kind === 'page') return null;
  if (field.kind === 'html') {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-loose [&_a]:text-primary [&_b]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_iframe]:w-full [&_iframe]:h-full"
        dir="rtl"
        dangerouslySetInnerHTML={renderHtml(field.html, userName, usdRate)}
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
        <Label className="text-base font-semibold text-foreground text-right block">
          {field.label}
          {field.required ? <span className="text-destructive"> *</span> : null}
        </Label>
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
                className={`flex flex-row-reverse cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50 ${
                  value === c.value ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <RadioGroupItem id={id} value={c.value} className="mt-1 shrink-0" />
                <span className="flex-1 text-right leading-relaxed">{c.label}</span>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    );
  }

  // text / email / number / tel
  return (
    <div className="space-y-2" dir="rtl">
      <Label htmlFor={field.id} className="text-base font-semibold text-foreground text-right block">
        {field.label}
        {(field as any).required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={field.id}
        type={field.kind === 'number' ? 'number' : field.kind === 'email' ? 'email' : 'text'}
        inputMode={field.kind === 'tel' ? 'tel' : field.kind === 'number' ? 'numeric' : undefined}
        placeholder={(field as any).placeholder}
        value={value}
        onChange={(e) => onChange(field.id, e.target.value)}
        className="text-right"
        dir="rtl"
      />
    </div>
  );
};

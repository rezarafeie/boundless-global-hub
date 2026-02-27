
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Send, Phone, MessageCircle, ChevronDown, CreditCard, Shield, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const ONLINE_PAY_URL = 'https://checkout.rafeie.com/598491';
const RECEIPT_URL = 'https://t.me/m/P5QjZ2H4Mzg0';
const SUPPORT_TELEGRAM = 'https://t.me/rafieiacademy';
const SUPPORT_PHONE = 'tel:+982128427131';
const CARD_NUMBER = '6219861919595958';

const STEPS = ['پرداخت بیعانه', 'ارسال رسید', 'بررسی تأیید', 'دسترسی مشاوره'];

const FAQ_ITEMS = [
  { q: 'مابقی مبلغ چه زمانی پرداخت می‌شود؟', a: 'مابقی مبلغ دوره پس از تأیید بیعانه و قبل از شروع دوره، طبق زمان‌بندی اعلام‌شده پرداخت خواهد شد.' },
  { q: 'بعد از پرداخت بیعانه چه اتفاقی می‌افتد؟', a: 'پس از تأیید رسید پرداخت، دسترسی مشاوره خصوصی برای شما فعال شده و اطلاعات تکمیلی ارسال می‌شود.' },
  { q: 'آیا جایگاه من تضمین‌شده است؟', a: 'بله، با پرداخت بیعانه جایگاه شما رزرو می‌شود و تا تکمیل ظرفیت اعتبار دارد.' },
];

const BoundlessDeposit = () => {
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const copyCard = async () => {
    await navigator.clipboard.writeText(CARD_NUMBER);
    setCopied(true);
    toast.success('شماره کارت کپی شد');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Hero */}
      <section className="px-5 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <motion.h1
            className="text-3xl md:text-4xl font-bold leading-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            جایگاه خود را در{' '}
            <span className="text-primary">برنامه بی‌مرز</span>{' '}
            ثبت کنید
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            با پرداخت بیعانه و تأیید پرداخت، ثبت‌نام خود را تکمیل کنید.
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[
              { icon: Users, label: '+۱۰۰۰ شرکت‌کننده' },
              { icon: Award, label: 'نتایج واقعی' },
              { icon: Shield, label: 'پشتیبانی مستقیم' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <t.icon size={14} className="text-primary" />
                <span>{t.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="px-5 pb-12">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i === 0
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border text-muted-foreground'
                }`}>
                  {i === 0 ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[11px] text-center leading-tight ${i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deposit + Card Section */}
      <section className="px-5 pb-12">
        <div className="max-w-md mx-auto space-y-4">
          {/* Amount Card */}
          <Card className="border">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-muted-foreground text-sm">مبلغ بیعانه</p>
              <p className="text-3xl font-bold tracking-tight">
                ۱,۰۰۰,۰۰۰
                <span className="text-base text-muted-foreground mr-2">تومان</span>
              </p>
              <p className="text-xs text-primary flex items-center justify-center gap-1">
                <Shield size={12} />
                ظرفیت محدود – ثبت‌نام تا اتمام ظرفیت
              </p>
              <a href={ONLINE_PAY_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-12 rounded-xl text-base font-bold mt-2">
                  <CreditCard size={16} className="ml-2" />
                  پرداخت آنلاین بیعانه
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Bank Card - Always Visible */}
          <Card className="border bg-muted/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">کارت به کارت – بلو بانک</span>
              </div>
              <p className="text-xl md:text-2xl font-mono tracking-[0.15em] text-foreground text-left" dir="ltr">
                {CARD_NUMBER.replace(/(.{4})/g, '$1 ').trim()}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">صاحب حساب</p>
                  <p className="text-sm text-foreground">سید عباس رفیعی</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyCard}
                  className={`rounded-lg text-xs h-8 px-3 ${
                    copied ? 'border-green-500 text-green-600 bg-green-50' : ''
                  }`}
                >
                  {copied ? <><Check size={13} className="ml-1" /> کپی شد</> : <><Copy size={13} className="ml-1" /> کپی شماره کارت</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Receipt */}
      <section className="px-5 pb-12">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h2 className="text-lg font-bold">ارسال رسید پرداخت</h2>
          <p className="text-muted-foreground text-sm">پس از پرداخت، رسید خود را از طریق تلگرام ارسال کنید.</p>
          <a href={RECEIPT_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="h-11 rounded-xl px-6 text-sm">
              <Send size={15} className="ml-2" />
              ارسال رسید در تلگرام
            </Button>
          </a>
        </div>
      </section>

      {/* Support */}
      <section className="px-5 pb-12">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h2 className="text-lg font-bold">نیاز به کمک دارید؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <MessageCircle size={16} className="ml-2" />
                پشتیبانی تلگرام
              </Button>
            </a>
            <a href={SUPPORT_PHONE}>
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <Phone size={16} className="ml-2" />
                تماس مستقیم
                <span className="text-[10px] text-muted-foreground mr-1">(۹ تا ۲۱)</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 pb-24">
        <div className="max-w-md mx-auto space-y-3">
          <h2 className="text-lg font-bold text-center mb-4">سوالات متداول</h2>
          {FAQ_ITEMS.map((item, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="flex items-center justify-between w-full rounded-xl border bg-card px-4 py-3 text-sm text-right hover:bg-muted/50 transition-colors group">
                <span>{item.q}</span>
                <ChevronDown size={15} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0 mr-3" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t z-50">
          <a href={ONLINE_PAY_URL} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 rounded-xl text-base font-bold">
              پرداخت بیعانه
            </Button>
          </a>
        </div>
      )}
    </div>
  );
};

export default BoundlessDeposit;

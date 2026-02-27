
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Send, Phone, MessageCircle, ChevronDown, CreditCard, Shield, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const ONLINE_PAY_URL = 'https://checkout.rafeie.com/598491';
const RECEIPT_URL = 'https://t.me/m/P5QjZ2H4Mzg0';
const SUPPORT_TELEGRAM = 'https://t.me/rafieiacademy';
const SUPPORT_PHONE = 'tel:+982128427131';
const CARD_NUMBER = '6219861919595958';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
  })
};

const BoundlessDeposit = () => {
  const [showBankCard, setShowBankCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const copyCard = async () => {
    await navigator.clipboard.writeText(CARD_NUMBER);
    setCopied(true);
    toast.success('شماره کارت کپی شد');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0f0f14] text-white" dir="rtl">
      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <motion.div
            className="flex-1 space-y-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
              جایگاه خود را در
              <span className="bg-gradient-to-l from-red-500 to-red-400 bg-clip-text text-transparent"> برنامه بی‌مرز </span>
              ثبت کنید
            </h1>
            <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-lg">
              با پرداخت بیعانه و تأیید پرداخت، ثبت‌نام خود را تکمیل کنید.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-white/50">
              {[
                { icon: Users, label: '+۱۰۰۰ شرکت‌کننده' },
                { icon: Award, label: 'نتایج واقعی' },
                { icon: Shield, label: 'پشتیبانی مستقیم' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <t.icon size={14} className="text-red-400" />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="w-56 h-56 md:w-72 md:h-72 rounded-3xl bg-gradient-to-br from-red-500/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <span className="text-white/20 text-sm">تصویر برنامه</span>
          </motion.div>
        </div>
      </section>

      {/* PROGRESS STEPS */}
      <section className="px-5 pb-16">
        <motion.div
          className="max-w-3xl mx-auto"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="flex items-center justify-between gap-1">
            {['پرداخت بیعانه', 'ارسال رسید', 'بررسی تأیید', 'دسترسی مشاوره'].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  i === 0
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'border-white/15 text-white/30'
                }`}>
                  {i === 0 ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-xs text-center ${i === 0 ? 'text-white font-medium' : 'text-white/30'}`}>
                  {step}
                </span>
                {i < 3 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
          </div>
          {/* Connecting line */}
          <div className="relative -mt-[52px] mx-auto px-[18%]">
            <div className="h-0.5 bg-white/10 rounded-full" />
            <div className="absolute top-0 right-0 h-0.5 w-1/4 bg-gradient-to-l from-red-500 to-red-500/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* DEPOSIT INFO */}
      <section className="px-5 pb-16">
        <motion.div
          className="max-w-lg mx-auto"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-7 md:p-10 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-white/50 text-sm">مبلغ بیعانه</p>
              <p className="text-4xl font-bold tracking-tight">
                ۱,۰۰۰,۰۰۰
                <span className="text-lg text-white/40 mr-2">تومان</span>
              </p>
              <p className="text-red-400/80 text-xs flex items-center justify-center gap-1">
                <Shield size={12} />
                ظرفیت محدود – ثبت‌نام تا اتمام ظرفیت
              </p>
            </div>

            <div className="space-y-3">
              <a href={ONLINE_PAY_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-l from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/20 border-0">
                  <CreditCard size={18} className="ml-2" />
                  پرداخت آنلاین بیعانه
                </Button>
              </a>
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl text-sm border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
                onClick={() => setShowBankCard(!showBankCard)}
              >
                انتقال کارت به کارت
              </Button>
            </div>

            {/* BANK CARD */}
            {showBankCard && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16162a] border border-white/10 p-6 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">بلو بانک</span>
                  <div className="w-8 h-5 rounded bg-gradient-to-l from-red-500 to-orange-400 opacity-60" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-mono tracking-[0.15em] text-white/90 text-left" dir="ltr">
                    {CARD_NUMBER.replace(/(.{4})/g, '$1 ').trim()}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/30 mb-0.5">صاحب حساب</p>
                    <p className="text-sm text-white/80">سید عباس رفیعی</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={copyCard}
                    className={`rounded-xl text-xs h-9 px-4 transition-all ${
                      copied
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/10'
                    }`}
                  >
                    {copied ? <><Check size={13} className="ml-1" /> کپی شد</> : <><Copy size={13} className="ml-1" /> کپی شماره کارت</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* RECEIPT UPLOAD */}
      <section className="px-5 pb-16">
        <motion.div
          className="max-w-lg mx-auto text-center space-y-5"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <h2 className="text-xl font-bold">ارسال رسید پرداخت</h2>
          <p className="text-white/50 text-sm">پس از پرداخت، رسید خود را از طریق تلگرام ارسال کنید.</p>
          <a href={RECEIPT_URL} target="_blank" rel="noopener noreferrer">
            <Button className="h-13 rounded-2xl px-8 bg-[#229ED9]/15 text-[#229ED9] hover:bg-[#229ED9]/25 border border-[#229ED9]/20 text-sm font-medium">
              <Send size={16} className="ml-2" />
              ارسال رسید در تلگرام
            </Button>
          </a>
        </motion.div>
      </section>

      {/* SUPPORT */}
      <section className="px-5 pb-16">
        <motion.div
          className="max-w-lg mx-auto text-center space-y-5"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <h2 className="text-xl font-bold">نیاز به کمک دارید؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/5 hover:text-white">
                <MessageCircle size={18} className="ml-2" />
                پشتیبانی تلگرام
              </Button>
            </a>
            <a href={SUPPORT_PHONE}>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/5 hover:text-white">
                <Phone size={18} className="ml-2" />
                تماس مستقیم
                <span className="text-[10px] text-white/30 mr-1">(۹ تا ۲۱)</span>
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-5 pb-32">
        <motion.div
          className="max-w-lg mx-auto space-y-3"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <h2 className="text-xl font-bold text-center mb-6">سوالات متداول</h2>
          {[
            { q: 'مابقی مبلغ چه زمانی پرداخت می‌شود؟', a: 'مابقی مبلغ دوره پس از تأیید بیعانه و قبل از شروع دوره، طبق زمان‌بندی اعلام‌شده پرداخت خواهد شد.' },
            { q: 'بعد از پرداخت بیعانه چه اتفاقی می‌افتد؟', a: 'پس از تأیید رسید پرداخت، دسترسی مشاوره خصوصی برای شما فعال شده و اطلاعات تکمیلی ارسال می‌شود.' },
            { q: 'آیا جایگاه من تضمین‌شده است؟', a: 'بله، با پرداخت بیعانه جایگاه شما رزرو می‌شود و تا تکمیل ظرفیت اعتبار دارد.' },
          ].map((item, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="flex items-center justify-between w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-right text-white/80 hover:bg-white/5 transition-colors group">
                <span>{item.q}</span>
                <ChevronDown size={16} className="text-white/30 transition-transform group-data-[state=open]:rotate-180 shrink-0 mr-3" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-5 py-3 text-sm text-white/50 leading-relaxed">
                {item.a}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </motion.div>
      </section>

      {/* STICKY MOBILE CTA */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f0f14]/95 backdrop-blur-md border-t border-white/10 z-50">
          <a href={ONLINE_PAY_URL} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-l from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25 border-0">
              پرداخت بیعانه
            </Button>
          </a>
        </div>
      )}
    </div>
  );
};

export default BoundlessDeposit;

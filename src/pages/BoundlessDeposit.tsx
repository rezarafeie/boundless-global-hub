
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Send, Phone, MessageCircle, ChevronDown, CreditCard, Shield, Users, Award, ArrowLeft, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import useEmblaCarousel from 'embla-carousel-react';

const TESTIMONIAL_VIDEOS = [
  { hash: 'czvw4g5', title: 'نظر دانش‌پذیر ۱' },
  { hash: 'doo2nh1', title: 'نظر دانش‌پذیر ۲' },
  { hash: 'shwn4qf', title: 'نظر دانش‌پذیر ۳' },
  { hash: 'jjup796', title: 'نظر دانش‌پذیر ۴' },
  { hash: 'qyui8z2', title: 'نظر دانش‌پذیر ۵' },
];

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

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: 'rtl', align: 'start' });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const copyCard = async () => {
    await navigator.clipboard.writeText(CARD_NUMBER);
    setCopied(true);
    toast.success('شماره کارت کپی شد');
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">

      {/* ──── HERO with Glow ──── */}
      <section className="relative min-h-[50vh] pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center overflow-hidden">
        {/* Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
        {/* Fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div className="relative z-10 container mx-auto px-5 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-800/20 rounded-full px-5 py-2.5"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">ثبت‌نام فعال است</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                جایگاه خود را در برنامه بی‌مرز ثبت کنید
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              با پرداخت بیعانه و تأیید پرداخت، ثبت‌نام خود را تکمیل کنید.
            </motion.p>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {[
                { icon: Users, label: '+۱۰۰۰ شرکت‌کننده' },
                { icon: Award, label: 'نتایج واقعی' },
                { icon: Shield, label: 'پشتیبانی مستقیم' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <t.icon size={15} className="text-blue-500" />
                  <span>{t.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──── PROGRESS STEPS ──── */}
      <section className="px-5 py-12 md:py-16">
        <div className="max-w-xl mx-auto">
          <div className="flex items-start justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-4 right-[10%] left-[10%] h-[2px] bg-border rounded-full" />
            <div className="absolute top-4 right-[10%] h-[2px] w-[20%] bg-gradient-to-l from-primary to-primary/40 rounded-full" />

            {STEPS.map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2.5 relative z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i === 0
                    ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'border-border bg-background text-muted-foreground'
                }`}>
                  {i === 0 ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[11px] text-center leading-tight ${i === 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── DEPOSIT + BANK CARD ──── */}
      <section className="px-5 pb-14">
        <div className="max-w-md mx-auto space-y-5">
          {/* Amount & Online Pay */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <CardContent className="p-6 md:p-8 text-center space-y-5">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">مبلغ بیعانه</p>
                <p className="text-4xl font-bold tracking-tight">
                  ۱,۰۰۰,۰۰۰
                  <span className="text-base text-muted-foreground mr-2 font-normal">تومان</span>
                </p>
              </div>
              <p className="text-xs text-primary flex items-center justify-center gap-1.5 font-medium">
                <Shield size={13} />
                ظرفیت محدود – ثبت‌نام تا اتمام ظرفیت
              </p>
              <a href={ONLINE_PAY_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-12 rounded-xl text-base font-bold gap-2">
                  <CreditCard size={17} />
                  پرداخت آنلاین بیعانه
                  <ArrowLeft size={15} />
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Bank Card */}
          <Card className="border shadow-sm bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/30">
            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">کارت به کارت – بلو بانک</span>
                <div className="w-8 h-5 rounded bg-gradient-to-l from-blue-500 to-purple-400 opacity-50" />
              </div>
              <p className="text-sm md:text-lg font-mono tracking-[0.05em] text-foreground text-left py-2 whitespace-nowrap" dir="ltr">
                {CARD_NUMBER.replace(/(.{4})/g, '$1 ').trim()}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">صاحب حساب</p>
                  <p className="text-sm font-medium text-foreground">سید عباس رفیعی</p>
                </div>
                <Button
                  size="sm"
                  variant={copied ? 'default' : 'outline'}
                  onClick={copyCard}
                  className={`rounded-lg text-xs h-8 px-3 transition-all ${
                    copied ? 'bg-green-600 hover:bg-green-600 text-white' : ''
                  }`}
                >
                  {copied ? <><Check size={13} className="ml-1" /> کپی شد</> : <><Copy size={13} className="ml-1" /> کپی شماره کارت</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ──── RECEIPT ──── */}
      <section className="px-5 pb-14">
        <div className="max-w-md mx-auto">
          <Card className="border shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                <Send size={20} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold">ارسال رسید پرداخت</h2>
              <p className="text-muted-foreground text-sm">پس از پرداخت، رسید خود را از طریق تلگرام ارسال کنید.</p>
              <a href={RECEIPT_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-11 rounded-xl px-6 text-sm gap-2">
                  <Send size={14} />
                  ارسال رسید در تلگرام
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ──── SUPPORT ──── */}
      <section className="px-5 pb-14">
        <div className="max-w-md mx-auto text-center space-y-5">
          <h2 className="text-lg font-bold">نیاز به کمک دارید؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2">
                <MessageCircle size={16} />
                پشتیبانی تلگرام
              </Button>
            </a>
            <a href={SUPPORT_PHONE}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2">
                <Phone size={16} />
                تماس مستقیم
                <span className="text-[10px] text-muted-foreground">(۹ تا ۲۱)</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ──── TESTIMONIALS VIDEO SLIDER ──── */}
      <section className="px-5 pb-14">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-3">
              <Play size={20} className="text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold">نظرات دانش‌پذیران بدون مرز</h2>
            <p className="text-muted-foreground text-sm">تجربه واقعی شرکت‌کنندگان برنامه بی‌مرز را ببینید</p>
          </div>

          <div className="relative">
            {/* Carousel */}
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex gap-4" style={{ direction: 'rtl' }}>
                {TESTIMONIAL_VIDEOS.map((video, i) => (
                  <div key={i} className="flex-[0_0_85%] sm:flex-[0_0_48%] min-w-0">
                    <Card className="border shadow-sm overflow-hidden">
                      <div className="relative w-full" style={{ paddingTop: '57%' }}>
                        <iframe
                          src={`https://www.aparat.com/video/video/embed/videohash/${video.hash}/vt/frame`}
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-t-xl"
                          title={video.title}
                        />
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section className="px-5 pb-28">
        <div className="max-w-md mx-auto space-y-3">
          <h2 className="text-lg font-bold text-center mb-5">سوالات متداول</h2>
          {FAQ_ITEMS.map((item, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="flex items-center justify-between w-full rounded-xl border bg-card px-4 py-3.5 text-sm text-right hover:bg-muted/50 transition-colors group">
                <span className="font-medium">{item.q}</span>
                <ChevronDown size={15} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0 mr-3" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>

      {/* ──── STICKY MOBILE CTA ──── */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t z-50">
          <a href={ONLINE_PAY_URL} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
              پرداخت بیعانه
            </Button>
          </a>
        </div>
      )}
    </div>
  );
};

export default BoundlessDeposit;

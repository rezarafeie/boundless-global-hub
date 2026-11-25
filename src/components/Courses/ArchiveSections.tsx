import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass, PlayCircle, MessageCircle, Trophy } from 'lucide-react';
import t1 from '@/assets/real/t1.webp.asset.json';
import t2 from '@/assets/real/t2.webp.asset.json';
import t3 from '@/assets/real/t3.webp.asset.json';
import t5 from '@/assets/real/t5.webp.asset.json';
import { courseImage, courseImagePosition } from '@/lib/academyImagery';

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } };

export const FeaturedCourse = () => (
  <section className="px-4 pt-6">
    <div className="container mx-auto">
      <motion.div {...fade} className="grid overflow-hidden rounded-[2rem] border border-border bg-card md:grid-cols-2">
        <div className="relative min-h-[280px] bg-photo-shade md:min-h-[460px]">
          <img src={courseImage('boundless', 'دوره شروع بدون مرز')} alt="دوره شروع بدون مرز" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: courseImagePosition('boundless', 'دوره شروع بدون مرز') }} />
          <div className="absolute inset-0 bg-gradient-to-t from-photo-shade/70 to-transparent md:bg-gradient-to-l md:from-photo-shade/40" />
          <span className="absolute right-5 top-5 rounded-full border border-photo-ink/20 bg-photo-shade/40 px-3 py-1 text-xs text-photo-ink backdrop-blur-md">پیشنهاد ویژه</span>
        </div>
        <div className="flex flex-col justify-center gap-5 p-7 md:p-12">
          <span className="text-xs font-semibold text-muted-foreground">دوره پرچم‌دار آکادمی</span>
          <h2 className="text-3xl font-extrabold leading-tight text-foreground md:text-4xl">شروع بدون مرز</h2>
          <p className="text-base leading-8 text-muted-foreground">از صفر تا ساختن درآمد بین‌المللی؛ مسیری قدم‌به‌قدم، با پشتیبانی، تمرین واقعی و جامعه‌ای که کنارت می‌ماند.</p>
          <ul className="grid grid-cols-2 gap-3 text-sm text-foreground">
            {['ویدیوهای گام‌به‌گام', 'تکلیف و بازخورد', 'پشتیبانی اختصاصی', 'جامعه همراهان'].map((x) => (
              <li key={x} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" />{x}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/courses/boundless" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold text-background transition-opacity hover:opacity-90">مشاهده دوره <ArrowLeft className="h-4 w-4" /></Link>
            <Link to="/course/boundless-taste" className="inline-flex h-12 items-center rounded-full border border-border px-6 text-sm font-semibold text-foreground hover:bg-muted">شروع رایگان</Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const steps = [
  { icon: Compass, title: 'مسیرت را پیدا کن', text: 'با آزمون هوشمند یا مشاوره، دوره‌ای که امروز به آن نیاز داری را انتخاب کن.' },
  { icon: PlayCircle, title: 'یاد بگیر و انجام بده', text: 'هر درس یک قدم عملی دارد؛ تماشا کن، تمرین کن، بازخورد بگیر.' },
  { icon: MessageCircle, title: 'تنها نمان', text: 'پشتیبانی در تلگرام و بله و جامعه‌ای که هم‌مسیر توست.' },
  { icon: Trophy, title: 'نتیجه را ببین', text: 'گواهی، هدیه پایان دوره و قدم بعدی برای رشد بیشتر.' },
];

export const HowItWorks = () => (
  <section className="px-4 py-20 md:py-28">
    <div className="container mx-auto">
      <motion.div {...fade} className="mb-12 max-w-2xl">
        <span className="text-xs font-semibold text-muted-foreground">چطور کار می‌کند</span>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-5xl">یادگیری‌ای که به نتیجه می‌رسد</h2>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div key={s.title} {...fade} transition={{ duration: 0.6, delay: i * 0.08 }} className="rounded-[1.75rem] border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background"><s.icon className="h-5 w-5" /></span>
              <span className="text-3xl font-extrabold text-muted-foreground/30">{(i + 1).toLocaleString('fa-IR')}</span>
            </div>
            <h3 className="mt-6 text-lg font-bold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export const LifeGallery = () => (
  <section className="px-4 pb-8">
    <div className="container mx-auto">
      <motion.div {...fade} className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-muted-foreground">زندگی بدون مرز</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-5xl">چیزی که درس می‌دهیم، خودمان زندگی می‌کنیم</h2>
        </div>
        <Link to="/reza-rafiei" className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground">درباره رضا رفیعی <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-transform group-hover:-translate-x-1"><ArrowLeft className="h-4 w-4" /></span></Link>
      </motion.div>
      <div className="grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4 md:gap-4">
        {[{ s: t5.url, c: 'col-span-2 row-span-2' }, { s: t1.url, c: 'row-span-2' }, { s: t2.url, c: '' }, { s: t3.url, c: '' }].map((g, i) => (
          <motion.div key={i} {...fade} transition={{ duration: 0.6, delay: i * 0.06 }} className={`overflow-hidden rounded-[1.5rem] bg-muted ${g.c}`}>
            <img src={g.s} alt="رضا رفیعی" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

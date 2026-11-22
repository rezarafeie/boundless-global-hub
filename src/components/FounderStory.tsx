import React from 'react';
import { motion } from 'framer-motion';
import { founderImage, sceneGallery } from '@/lib/academyImagery';
import audience from '@/assets/photos/audience.webp.asset.json';

const ease = [0.22, 1, 0.36, 1] as const;
const stats = [
  { n: 'هزاران', t: 'دانشجو در مسیر' },
  { n: 'ده‌ها', t: 'همایش و کارگاه' },
  { n: 'یک', t: 'هدف: زندگی بدون مرز' },
];
const moments = [
  { src: audience.url, alt: 'سالن همایش رضا رفیعی', cls: 'md:col-span-2 md:row-span-2' },
  ...sceneGallery.slice(0, 4).map((src) => ({ src, alt: 'رضا رفیعی', cls: '' })),
];

const FounderStory: React.FC = () => (
  <section id="founder" className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <div className="grid items-center gap-10 md:grid-cols-[5fr_6fr] md:gap-16">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease }}>
          <img src={founderImage} alt="رضا رفیعی" loading="lazy" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-float" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, delay: 0.1, ease }}>
          <p className="text-sm font-medium text-muted-foreground">بنیان‌گذار آکادمی</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-snug text-foreground md:text-6xl">رضا رفیعی</h2>
          <p className="mt-6 text-xl font-bold leading-9 text-foreground md:text-2xl">
            من هم روزی همان‌جایی ایستاده بودم که تو الان ایستاده‌ای.
          </p>
          <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
            با همان سؤال‌ها، همان تردیدها و همان دیوارهای نادیدنی. فرقش فقط یک تصمیم بود. این آکادمی، نقشه‌ی همان مسیر است؛ بی‌تعارف، کاربردی و از دل تجربه.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
            {stats.map((s) => (
              <div key={s.t}>
                <p className="text-2xl font-extrabold text-foreground md:text-3xl">{s.n}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground md:text-sm">{s.t}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-20 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[210px] md:grid-cols-4 md:gap-4">
        {moments.map((m, i) => (
          <motion.div key={m.src} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.06 }}
            className={`group overflow-hidden rounded-2xl bg-muted ${m.cls}`}>
            <img src={m.src} alt={m.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FounderStory;

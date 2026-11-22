import React from 'react';
import { motion } from 'framer-motion';
import portrait from '@/assets/photos/portrait.webp.asset.json';
import audience from '@/assets/photos/audience.webp.asset.json';
import eventStage from '@/assets/photos/event_stage.webp.asset.json';
import group from '@/assets/photos/group.webp.asset.json';
import crowd from '@/assets/photos/crowd.webp.asset.json';
import talk from '@/assets/photos/talk.webp.asset.json';

const moments = [
  { src: audience.url, alt: 'سالن پر از مخاطب در همایش', cls: 'md:col-span-2 md:row-span-2' },
  { src: crowd.url, alt: 'سید عباس رفیعی در دبی', cls: '' },
  { src: talk.url, alt: 'سخنرانی روی صحنه', cls: '' },
  { src: eventStage.url, alt: 'صحنه رویداد', cls: '' },
  { src: group.url, alt: 'عکس گروهی با دانشجویان', cls: '' },
];

const FounderStory: React.FC = () => (
  <section id="founder" className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative">
          <img src={portrait.url} alt="سید عباس رفیعی" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-float" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-sm font-medium text-muted-foreground">بنیان‌گذار آکادمی</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-snug text-foreground md:text-5xl">سید عباس رفیعی</h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            از سالن‌های همایش تا کلاس‌های آنلاین؛ هر چیزی که در این مسیر یاد گرفتم، این‌جا بی‌واسطه و کاربردی با شما به اشتراک می‌گذارم.
          </p>
        </motion.div>
      </div>

      <div className="mt-16 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4 md:gap-4">
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

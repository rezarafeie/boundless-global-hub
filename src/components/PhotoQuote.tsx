import React from 'react';
import { motion } from 'framer-motion';
import { portraitImage } from '@/lib/academyImagery';

const PhotoQuote: React.FC<{ quote?: string; note?: string }> = ({
  quote = 'آدم‌ها با شرایطشان شناخته نمی‌شوند؛ با تصمیمی که در دل همان شرایط می‌گیرند.',
  note = 'رضا رفیعی',
}) => (
  <section className="px-4 py-16 md:py-24">
    <div className="container mx-auto">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-photo-shade text-photo-ink">
        <img src={portraitImage} alt="رضا رفیعی" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover object-[30%_30%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-photo-shade via-photo-shade/80 to-photo-shade/10" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="mr-auto max-w-xl px-8 py-20 md:px-14 md:py-28">
          <p className="text-3xl font-extrabold leading-[1.5] md:text-4xl">«{quote}»</p>
          <p className="mt-6 text-sm text-photo-ink/70">— {note}</p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default PhotoQuote;

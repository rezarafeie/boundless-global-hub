import React from 'react';
import { motion } from 'framer-motion';
import { rafieiServices, serviceGroups, ServiceGroup } from '@/data/rafieiServices';
import ServiceCard from './ServiceCard';

/** Full ecosystem section for one group (home page spreads several of these). */
export const ServiceGroupSection: React.FC<{ group: ServiceGroup; eyebrow?: string }> = ({ group, eyebrow = 'اکوسیستم گروه رفیعی' }) => {
  const g = serviceGroups[group];
  const items = rafieiServices.filter((s) => s.group === group);
  return (
    <section className="px-4 py-14 md:py-20">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8 max-w-2xl md:mb-10">
          <span className="text-xs font-semibold text-muted-foreground">{eyebrow}</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">{g.title}</h2>
          <p className="mt-3 text-base text-muted-foreground">{g.sub}</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {items.map((s, i) => (
            <motion.div key={s.href} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.05 }}
              className={i === 0 ? 'col-span-2 md:col-span-1' : ''}>
              <ServiceCard s={s} large={i === 0} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

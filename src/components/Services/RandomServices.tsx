import React, { useMemo } from 'react';
import { pickServices } from '@/data/rafieiServices';
import ServiceCard from './ServiceCard';

/** A small random selection of Rafiei Group services, for use across pages. */
const RandomServices: React.FC<{ count?: number; title?: string; className?: string; columns?: string }> = ({
  count = 4, title = 'از اکوسیستم گروه رفیعی', className = '', columns = 'grid-cols-2 lg:grid-cols-4',
}) => {
  const items = useMemo(() => pickServices(count), [count]);
  return (
    <section className={`${className}`} dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground md:text-lg">{title}</h3>
        <a href="https://rafiei.co" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">همه سرویس‌ها</a>
      </div>
      <div className={`grid gap-3 ${columns}`}>
        {items.map((s) => <ServiceCard key={s.href} s={s} />)}
      </div>
    </section>
  );
};

export default RandomServices;

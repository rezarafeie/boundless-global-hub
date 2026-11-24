import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpLeft } from 'lucide-react';
import type { RafieiService } from '@/data/rafieiServices';

const ServiceCard: React.FC<{ s: RafieiService; large?: boolean }> = ({ s, large }) => {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex items-center justify-center rounded-2xl bg-foreground text-background ${large ? 'h-12 w-12' : 'h-10 w-10'}`}><s.icon className={large ? 'h-6 w-6' : 'h-5 w-5'} /></span>
        <ArrowUpLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>
      <div className="mt-auto pt-6">
        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground" dir="ltr">{s.en}</span>
        <h3 className={`mt-1 font-extrabold text-foreground ${large ? 'text-xl' : 'text-base'}`}>{s.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{s.tagline}</p>
        {!s.internal && <span className="mt-3 block font-mono text-[11px] text-muted-foreground/70" dir="ltr">{s.href.replace('https://', '')}</span>}
      </div>
    </>
  );
  const cls = `group flex h-full flex-col rounded-[1.75rem] border border-border bg-card p-4 text-right md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-float ${large ? 'min-h-[220px] md:p-6' : 'min-h-[180px]'}`;
  return s.internal
    ? <Link to={s.href} className={cls}>{inner}</Link>
    : <a href={s.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
};

export default ServiceCard;

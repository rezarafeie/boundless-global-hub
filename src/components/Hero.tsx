import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import RandomHeadlineGenerator from './RandomHeadlineGenerator';
import { pickHeroScene } from '@/lib/academyImagery';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundType?: 'default' | 'glow';
  glowTheme?: 'blue' | 'purple' | 'pink';
}

const ease = [0.22, 1, 0.36, 1] as const;

const Hero: React.FC<HeroProps> = ({ title, subtitle, ctaText, ctaLink }) => {
  const { language } = useLanguage();
  const scene = useMemo(pickHeroScene, []);
  return (
    <section className="px-3 pt-3 md:px-4 md:pt-4">
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-photo-shade text-photo-ink">
      <motion.img
        key={scene.image}
        src={scene.image}
        alt={language === 'fa' ? 'رضا رفیعی' : 'Reza Rafiei'}
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease }}
        className={`absolute inset-0 -z-10 h-full w-full object-cover object-[30%_center] md:${scene.position}`}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-photo-shade via-photo-shade/70 to-photo-shade/10 md:bg-gradient-to-l md:from-photo-shade md:via-photo-shade/75 md:to-photo-shade/20" />
      <div className="container mx-auto flex min-h-[78svh] items-end px-6 pt-24 pb-14 md:min-h-[min(78vh,760px)] md:px-12 md:items-center md:pb-24">
        <div className="max-w-xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-photo-ink/20 bg-photo-ink/10 px-4 py-1.5 text-xs font-medium backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {language === 'fa' ? `${scene.eyebrow} · رضا رفیعی` : 'Reza Rafiei'}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-7 text-4xl font-extrabold leading-[1.35] tracking-tight md:text-6xl">
            {title || (language === 'fa' ? scene.line : 'Rafiei Academy')}
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16, ease }}
            className="mt-5 text-lg text-photo-ink/80 md:text-xl [&_*]:!text-photo-ink/80 [&_*]:!bg-none">
            {subtitle ? <p>{subtitle}</p> : language === 'fa' ? <p>{scene.sub}</p> : <RandomHeadlineGenerator />}
          </motion.div>
          {ctaText && ctaLink && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24, ease }}
              className="mt-10 flex flex-wrap gap-3">
              <a href={ctaLink} className="inline-flex h-12 items-center rounded-full bg-photo-ink px-8 text-sm font-semibold text-photo-shade transition-all duration-300 hover:opacity-90 active:scale-[0.98]">
                {ctaText}
              </a>
              <a href="#founder" className="inline-flex h-12 items-center rounded-full border border-photo-ink/25 bg-photo-ink/10 px-7 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-photo-ink/20">
                {language === 'fa' ? 'درباره من' : 'About me'}
              </a>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </section>
  );
};

export default Hero;


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import RandomHeadlineGenerator from './RandomHeadlineGenerator';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundType?: 'default' | 'glow';
  glowTheme?: 'blue' | 'purple' | 'pink';
}

const Hero: React.FC<HeroProps> = ({ 
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundType = 'default',
  glowTheme = 'blue'
}) => {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:linear-gradient(hsl(var(--foreground)/0.045)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_75%)]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-220px] h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-foreground/[0.06] blur-3xl" />
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass shadow-soft inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {language === 'fa' ? 'آموزش آنلاین نسل جدید' : 'Next-gen online learning'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-5xl font-black leading-[1.2] tracking-tight text-foreground md:text-7xl"
          >
            {title || (language === 'fa' ? 'آکادمی رفیعی' : 'Rafiei Academy')}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-lg text-muted-foreground md:text-xl"
          >
            {subtitle ? <p>{subtitle}</p> : <RandomHeadlineGenerator />}
          </motion.div>

          {ctaText && ctaLink && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10"
            >
              <a
                href={ctaLink}
                className="inline-flex h-12 items-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-float transition-all duration-300 ease-smooth hover:opacity-90 active:scale-[0.98]"
              >
                {ctaText}
              </a>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;

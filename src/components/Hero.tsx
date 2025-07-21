
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import RandomHeadlineGenerator from './RandomHeadlineGenerator';
import SaleBadge from './SaleBadge';
import SaleCountdownTimer from './SaleCountdownTimer';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundType?: 'default' | 'glow';
  glowTheme?: 'blue' | 'purple' | 'pink';
  showSale?: boolean;
  originalPrice?: number;
  salePrice?: number;
  saleExpiresAt?: string;
}

const Hero: React.FC<HeroProps> = ({ 
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundType = 'default',
  glowTheme = 'blue',
  showSale = false,
  originalPrice,
  salePrice,
  saleExpiresAt
}) => {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const isSaleActive = showSale && originalPrice && salePrice && saleExpiresAt && new Date(saleExpiresAt) > new Date();

  return (
    <section className="relative min-h-[70vh] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-800/20 rounded-full px-6 py-3"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {language === 'fa' ? '🚀 آموزش آنلاین نسل جدید' : '🚀 Next-Gen Online Learning'}
              </span>
            </motion.div>

            {/* Main Heading */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {title || (language === 'fa' ? 'آکادمی رفیعی' : 'Rafiei Academy')}
                </span>
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {subtitle ? (
                  <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300">
                    {subtitle}
                  </p>
                ) : (
                  <RandomHeadlineGenerator />
                )}
              </motion.div>
            </div>

            {/* Sale Information */}
            {isSaleActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <SaleBadge originalPrice={originalPrice!} salePrice={salePrice!} />
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(salePrice!)}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(originalPrice!)}
                    </span>
                  </div>
                  
                  <SaleCountdownTimer expiresAt={saleExpiresAt!} />
                </div>
              </motion.div>
            )}

            {/* CTA Button */}
            {ctaText && ctaLink && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <a
                  href={ctaLink}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  {ctaText}
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

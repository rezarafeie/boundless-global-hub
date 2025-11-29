import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import BlackFridayCountdown from './BlackFridayCountdown';

interface BlackFridayBannerProps {
  endDate: string;
}

const BlackFridayBanner: React.FC<BlackFridayBannerProps> = ({ endDate }) => {
  return (
    <motion.a
      href="https://rafiei.co/blackfriday"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="block w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b-4 border-yellow-500/50 relative overflow-hidden group cursor-pointer"
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 animate-pulse"></div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-yellow-500/10 rounded-br-full"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-tl-full"></div>
      
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Title */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Zap className="h-6 w-6 md:h-7 md:w-7 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                BLACK FRIDAY
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </h3>
              <p className="text-xs md:text-sm text-zinc-300">تخفیف‌های ویژه برای همه دوره‌ها</p>
            </div>
          </div>
          
          {/* Center - Countdown */}
          <div className="flex-shrink-0">
            <BlackFridayCountdown endDate={endDate} className="scale-90 md:scale-100" />
          </div>
          
          {/* Right side - CTA */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-sm md:text-base shadow-lg group-hover:bg-yellow-400 transition-colors"
          >
            مشاهده تخفیف‌ها →
          </motion.div>
        </div>
      </div>
    </motion.a>
  );
};

export default BlackFridayBanner;

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import BlackFridayCountdown from './BlackFridayCountdown';

interface BlackFridayBannerProps {
  endDate: string;
}

const BlackFridayBanner: React.FC<BlackFridayBannerProps> = ({ endDate }) => {
  const handleClick = () => {
    window.location.href = 'https://rafiei.co/blackfriday';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className="relative bg-gradient-to-r from-black via-yellow-900/20 to-black border-y-4 border-yellow-500 py-8 px-4 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -20,
              opacity: 0,
            }}
            animate={{
              y: window.innerHeight + 20,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="flex items-center gap-3"
          >
            <Sparkles className="h-8 w-8 text-yellow-400 fill-yellow-400" />
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              BLACK FRIDAY
            </h2>
            <Sparkles className="h-8 w-8 text-yellow-400 fill-yellow-400" />
          </motion.div>

          <p className="text-xl md:text-2xl text-yellow-100 font-bold">
            تخفیف‌های ویژه جمعه سیاه - فرصتی استثنایی برای شروع یادگیری
          </p>

          <BlackFridayCountdown endDate={endDate} />

          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-yellow-300 text-lg font-semibold"
          >
            ⏰ زمان محدود - از این فرصت استفاده کنید!
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default BlackFridayBanner;
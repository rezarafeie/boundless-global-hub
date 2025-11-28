import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Tag } from 'lucide-react';
import BlackFridayCountdown from './BlackFridayCountdown';
import { useBlackFridayContext } from '@/contexts/BlackFridayContext';

interface CourseDiscountBannerProps {
  discount: number;
  courseName: string;
  originalPrice: number;
  courseSlug: string;
}

const CourseDiscountBanner: React.FC<CourseDiscountBannerProps> = ({ 
  discount, 
  courseName,
  originalPrice,
  courseSlug
}) => {
  const { settings } = useBlackFridayContext();
  const discountedPrice = originalPrice * (1 - discount / 100);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-8 mb-12 shadow-2xl overflow-hidden"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-black/10 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: -20,
              opacity: 0,
            }}
            animate={{
              y: '120%',
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header with Black Friday Title */}
        <div className="text-center mb-6">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="inline-flex items-center gap-3 bg-black text-yellow-400 px-8 py-3 rounded-full text-2xl md:text-3xl font-black mb-4"
          >
            <Zap className="h-7 w-7 fill-yellow-400" />
            BLACK FRIDAY
            <Zap className="h-7 w-7 fill-yellow-400" />
          </motion.div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-black mb-2">
            🔥 تخفیف ویژه {courseName}
          </h3>
        </div>

        {/* Countdown Timer */}
        {settings?.end_date && (
          <div className="flex justify-center mb-6">
            <BlackFridayCountdown endDate={settings.end_date} />
          </div>
        )}

        {/* Price Section */}
        <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6 items-center text-center">
            {/* Original Price */}
            <div>
              <p className="text-sm text-black/70 font-medium mb-2">قیمت اصلی</p>
              <p className="text-2xl font-bold text-black line-through">
                {formatPrice(originalPrice)} تومان
              </p>
            </div>

            {/* Discount Badge */}
            <div>
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-4 rounded-2xl text-3xl font-black shadow-lg"
              >
                <Tag className="h-8 w-8" />
                {discount}% تخفیف
              </motion.div>
            </div>

            {/* Final Price */}
            <div>
              <p className="text-sm text-black/70 font-medium mb-2">قیمت با تخفیف</p>
              <motion.p
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="text-3xl md:text-4xl font-black text-black"
              >
                {formatPrice(discountedPrice)} تومان
              </motion.p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-lg font-bold text-black/90">
            ⏰ این تخفیف فقط تا پایان تایمر اعتبار دارد!
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseDiscountBanner;

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TelegramRedirect = () => {
  const [searchParams] = useSearchParams();
  
  // Extract query parameters
  const name = searchParams.get('name') || '';
  const lastname = searchParams.get('lastname') || '';
  const phone = searchParams.get('phone') || '';
  const email = searchParams.get('email') || '';
  const course = searchParams.get('course') || '';

  // Generate Telegram message
  const generateTelegramMessage = () => {
    const baseMessage = `درود وقت بخیر
برای فعال سازی پشتیبانی بدون مرز پیام میدم خدمتتون

mba

نام : ${name}
نام خانوادگی : ${lastname}
شماره همراه : ${phone}
ایمیل : ${email}`;
    
    return baseMessage;
  };

  const handleTelegramClick = () => {
    const message = generateTelegramMessage();
    
    // Use encodeURIComponent() to properly encode the full message
    const encodedMessage = encodeURIComponent(message);
    
    // Construct the full Telegram URL with the encoded message
    const telegramUrl = `https://t.me/rafieiacademy?text=${encodedMessage}`;
    
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-4xl w-full shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardContent className="p-8 md:p-16">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Dynamic Course Welcome */}
          {course && (
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                🎉 به دوره {course} خوش آمدید!
              </h1>
            </div>
          )}

          {/* Main Success Message */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              دسترسی شما با موفقیت ایجاد شد
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto">
              فقط کافیست روی دکمه زیر کلیک کنید و همین الان شروع کنید. آماده اید؟
            </p>
          </div>

          {/* Large Static Telegram Button - Main Focus */}
          <div className="text-center mb-12">
            <Button
              onClick={handleTelegramClick}
              className="w-full max-w-2xl h-24 bg-gradient-to-r from-[#0088cc] via-[#00a1e6] to-[#0077b3] hover:from-[#0077b3] hover:via-[#0088cc] hover:to-[#005a94] text-white py-8 px-12 rounded-3xl text-2xl md:text-3xl font-black transition-all duration-300 shadow-2xl border-0"
              size="lg"
            >
              <div className="flex items-center justify-center gap-6">
                <div className="text-right">
                  <div className="font-black text-3xl md:text-4xl mb-1">آماده ام , شروع کنیم!</div>
                </div>
              </div>
            </Button>
            
            {/* Static Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                با کلیک روی دکمه شروع، به پشتیبانی تلگرام آکادمی هدایت می‌شوید. پیام شما به صورت خودکار پر خواهد شد. موفق باشید
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramRedirect;

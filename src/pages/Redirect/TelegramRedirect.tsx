
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TelegramRedirect = () => {
  const [searchParams] = useSearchParams();
  
  // Extract query parameters
  const name = searchParams.get('name') || '';
  const lastname = searchParams.get('lastname') || '';
  const phone = searchParams.get('phone') || '';
  const email = searchParams.get('email') || '';

  // Generate Telegram message
  const generateTelegramMessage = () => {
    const baseMessage = `درود وقت بخیر
برای فعال سازی پشتیبانی بدون مرز پیام میدم خدمتتون
mba
نام : ${name}
نام خانوادگی : ${lastname}
شماره همراه : ${phone}
ایمیل : ${email}`;
    
    return encodeURIComponent(baseMessage);
  };

  const telegramUrl = `https://t.me/rafieiacademy?text=${generateTelegramMessage()}`;

  const handleTelegramClick = () => {
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          ثبت‌نام شما با موفقیت انجام شد
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          برای فعال‌سازی پشتیبانی و دریافت آموزش‌ها و هدایای دوره، روی دکمه زیر کلیک کنید
        </p>

        {/* User Info Display (Optional - for verification) */}
        {(name || lastname || phone || email) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">اطلاعات ثبت شده:</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {name && <div><span className="font-medium">نام:</span> {name}</div>}
              {lastname && <div><span className="font-medium">نام خانوادگی:</span> {lastname}</div>}
              {phone && <div><span className="font-medium">شماره همراه:</span> {phone}</div>}
              {email && <div><span className="font-medium">ایمیل:</span> {email}</div>}
            </div>
          </div>
        )}

        {/* Telegram Button */}
        <Button
          onClick={handleTelegramClick}
          className="w-full max-w-md bg-[#0088cc] hover:bg-[#0077b3] text-white py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          <div className="flex items-center justify-center gap-3">
            {/* Telegram Icon */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.539-.432.672-.864.42l-2.388-1.764-1.152 1.116c-.128.128-.236.236-.484.236l.172-2.436 4.452-4.02c.192-.168-.044-.264-.3-.096L9.732 12.6l-2.388-.756c-.516-.156-.528-.516.108-.768L19.044 7.08c.432-.156.804.108.672.672-.156.744-.432 1.68-.432 1.68l1.284-4.272z"/>
            </svg>
            <span>ارتباط با پشتیبانی تلگرام</span>
          </div>
        </Button>

        {/* Footer Note */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          با کلیک روی دکمه، به صفحه تلگرام هدایت می‌شوید
        </p>
      </div>
    </div>
  );
};

export default TelegramRedirect;

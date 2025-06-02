
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
    
    return encodeURIComponent(baseMessage);
  };

  const telegramUrl = `https://t.me/rafieiacademy?text=${generateTelegramMessage()}`;

  const handleTelegramClick = () => {
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardContent className="p-8 md:p-12">
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
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              دسترسی شما با موفقیت ایجاد شد
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto">
              کافیست روی دکمه شروع کلیک کنید و همین الان شروع کنید. آماده اید؟.
            </p>
          </div>

          {/* User Info Display */}
          {(name || lastname || phone || email) && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border border-blue-200 dark:border-gray-600">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
                  ✨ اطلاعات ثبت شده
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {name && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">نام:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{name}</span>
                    </div>
                  )}
                  {lastname && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">نام خانوادگی:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{lastname}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">شماره همراه:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{phone}</span>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">ایمیل:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Telegram Button */}
          <div className="text-center">
            <Button
              onClick={handleTelegramClick}
              className="w-full max-w-md bg-gradient-to-r from-[#0088cc] to-[#006bb3] hover:from-[#0077b3] hover:to-[#005a94] text-white py-6 px-8 rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] border-0"
              size="lg"
            >
              <div className="flex items-center justify-center gap-4">
                {/* Enhanced Telegram Icon */}
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.539-.432.672-.864.42l-2.388-1.764-1.152 1.116c-.128.128-.236.236-.484.236l.172-2.436 4.452-4.02c.192-.168-.044-.264-.3-.096L9.732 12.6l-2.388-.756c-.516-.156-.528-.516.108-.768L19.044 7.08c.432-.156.804.108.672.672-.156.744-.432 1.68-.432 1.68l1.284-4.272z"/>
                  </svg>
                </div>
                <span className="font-bold">آماده ام . شروع کنیم</span>
              </div>
            </Button>
            
            {/* Footer Note */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              با کلیک روی دکمه شروع ، به پشتیبانی تلگرام آکادمی هدایت می‌شوید. یک پیام آماده حاوی اطلاعات فعال سازی شما در صفحه چت ایجاد میشود . کافیست پیام را ارسال نمایید تا فعالسازی پشتیبانی و دسترسی لینک عضویت در کانال آموزش ها و هدایا به صورت خودکار انجام شود. موفق باشید
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramRedirect;

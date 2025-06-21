
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <MainLayout>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                شرایط استفاده از خدمات
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
                شرایط و قوانین استفاده از خدمات آکادمی رفیعی
              </p>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold mb-3">۱. قبول شرایط</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    با استفاده از خدمات آکادمی رفیعی، شما با شرایط و قوانین زیر موافقت می‌کنید.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-3">۲. استفاده از محتوا</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    تمامی محتویات ارائه شده در این پلتفرم متعلق به آکادمی رفیعی بوده و استفاده غیرمجاز از آن‌ها ممنوع است.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-3">۳. مسئولیت کاربر</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    کاربران موظف به رعایت قوانین و مقررات هستند و مسئولیت استفاده صحیح از خدمات بر عهده آن‌هاست.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfServicePage;

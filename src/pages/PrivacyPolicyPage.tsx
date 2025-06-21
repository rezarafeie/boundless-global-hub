
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <MainLayout>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                سیاست حفظ حریم خصوصی
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
                نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شخصی کاربران
              </p>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold mb-3">۱. جمع‌آوری اطلاعات</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    ما اطلاعات شما را تنها در صورت لزوم و با رضایت شما جمع‌آوری می‌کنیم.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-3">۲. استفاده از اطلاعات</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    اطلاعات جمع‌آوری شده تنها جهت بهبود خدمات و ارتباط با شما استفاده می‌شود.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-3">۳. حفاظت از اطلاعات</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    ما متعهد به حفاظت از اطلاعات شخصی شما هستیم و از بهترین روش‌های امنیتی استفاده می‌کنیم.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-3">۴. اشتراک‌گذاری اطلاعات</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    اطلاعات شما با اشخاص ثالث به اشتراک گذاشته نمی‌شود مگر با اجازه صریح شما.
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

export default PrivacyPolicyPage;

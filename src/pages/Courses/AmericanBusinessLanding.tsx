
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FreeCourseLanding from './FreeCourseLanding';

const AmericanBusinessLanding = () => {
  return (
    <MainLayout>
      <FreeCourseLanding
        title="بیزینس آمریکایی"
        englishTitle="American Business"
        description="آموزش اصول و تکنیک‌های کسب‌وکار آمریکایی برای موفقیت در بازارهای بین‌المللی. از ایده تا اجرای کامل یک کسب‌وکار موفق."
        benefitOne="یادگیری مدل‌های کسب‌وکار آمریکایی"
        benefitTwo="استراتژی‌های بازاریابی و فروش بین‌المللی"
        iconType="message"
        courseSlug="american-business"
      />
    </MainLayout>
  );
};

export default AmericanBusinessLanding;

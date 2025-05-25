
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FreeCourseLanding from './FreeCourseLanding';

const PassiveIncomeLanding = () => {
  return (
    <MainLayout>
      <FreeCourseLanding
        title="درآمد غیرفعال با هوش مصنوعی"
        englishTitle="Passive Income with AI"
        description="کشف راه‌های نوین کسب درآمد بدون حضور فیزیکی با استفاده از ابزارهای هوش مصنوعی. از ایده تا اجرای کامل پروژه‌های درآمدزا."
        benefitOne="شناسایی فرصت‌های درآمدزایی با AI"
        benefitTwo="راه‌اندازی سیستم‌های اتوماتیک درآمد"
        iconType="graduation"
        courseSlug="passive-income-ai"
      />
    </MainLayout>
  );
};

export default PassiveIncomeLanding;

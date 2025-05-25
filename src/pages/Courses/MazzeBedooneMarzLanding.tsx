
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FreeCourseLanding from './FreeCourseLanding';

const MazzeBedooneMarzLanding = () => {
  return (
    <MainLayout>
      <FreeCourseLanding
        title="مزه بدون مرز"
        englishTitle="Boundless Taste"
        description="یک دوره جامع برای کسانی که می‌خواهند طعم واقعی موفقیت را بچشند. در این دوره با استراتژی‌های عملی برای رسیدن به اهدافتان آشنا می‌شوید."
        benefitOne="یادگیری تکنیک‌های مدیریت زمان و انرژی شخصی"
        benefitTwo="ساخت برنامه عملی برای دستیابی به اهداف بلندمدت"
        iconType="book"
        courseSlug="boundless-taste"
      />
    </MainLayout>
  );
};

export default MazzeBedooneMarzLanding;

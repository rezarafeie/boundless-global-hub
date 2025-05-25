
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FreeCourseLanding from './FreeCourseLanding';

const ChangeLanding = () => {
  return (
    <MainLayout>
      <FreeCourseLanding
        title="پروژه تغییر"
        englishTitle="Change Project"
        description="این دوره برای کسانی طراحی شده که می‌خواهند تغییرات مثبت و پایداری در زندگی شخصی و حرفه‌ای خود ایجاد کنند. با ابزارهای عملی برای مدیریت تغییر آشنا شوید."
        benefitOne="روش‌های علمی مدیریت تغییر در زندگی"
        benefitTwo="ساخت نقشه راه برای تحولات شخصی"
        iconType="file"
        courseSlug="change-project"
      />
    </MainLayout>
  );
};

export default ChangeLanding;

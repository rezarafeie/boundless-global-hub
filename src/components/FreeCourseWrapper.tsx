
import React from 'react';
import { useParams } from 'react-router-dom';
import FreeCourseLanding from '@/pages/Courses/FreeCourseLanding';

const FreeCourseWrapper: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // تعریف اطلاعات دوره‌ها بر اساس slug
  const getCourseData = (slug: string) => {
    switch (slug) {
      case 'boundless-taste':
        return {
          title: 'طعم بی‌مرز',
          englishTitle: 'Boundless Taste',
          description: 'نمونه رایگان از دوره اصلی بی‌مرز برای آشنایی با مفاهیم کسب‌وکار بین‌المللی',
          benefitOne: 'آشنایی با مفاهیم پایه کسب‌وکار بین‌المللی',
          benefitTwo: 'تصمیم‌گیری آگاهانه برای شروع کسب‌وکار بین‌المللی',
          iconType: 'book' as const
        };
      
      case 'passive-income-ai':
        return {
          title: 'درآمد غیرفعال با هوش مصنوعی',
          englishTitle: 'Passive Income with AI',
          description: 'آموزش روش‌های کسب درآمد غیرفعال با استفاده از هوش مصنوعی',
          benefitOne: 'یادگیری تولید محتوا با کمک هوش مصنوعی',
          benefitTwo: 'راه‌اندازی جریان درآمد دیجیتال غیرفعال',
          iconType: 'graduation' as const
        };
      
      case 'change-project':
        return {
          title: 'پروژه تغییر',
          englishTitle: 'Change Project',
          description: 'اصول ایجاد تغییرات بنیادین در زندگی و کسب‌وکار',
          benefitOne: 'شناسایی موانع تغییر و راه‌های غلبه بر آن‌ها',
          benefitTwo: 'ایجاد تغییرات پایدار در مسیر موفقیت',
          iconType: 'file' as const
        };
      
      case 'american-business':
        return {
          title: 'کسب‌وکار آمریکایی',
          englishTitle: 'American Business',
          description: 'آموزش اصول راه‌اندازی و مدیریت کسب‌وکار در آمریکا',
          benefitOne: 'یادگیری قوانین و مقررات کسب‌وکار آمریکایی',
          benefitTwo: 'آماده‌سازی برای ورود به بازار آمریکا و توسعه کسب‌وکار',
          iconType: 'message' as const
        };
      
      default:
        return {
          title: 'دوره رایگان',
          description: 'دوره آموزشی رایگان',
          benefitOne: 'یادگیری مفاهیم پایه',
          benefitTwo: 'دسترسی به محتوای آموزشی',
          iconType: 'book' as const
        };
    }
  };

  const courseData = getCourseData(slug || '');

  return <FreeCourseLanding {...courseData} />;
};

export default FreeCourseWrapper;

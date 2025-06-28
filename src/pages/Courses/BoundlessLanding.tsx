
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, Clock, Globe } from 'lucide-react';
import CourseEnrollmentSection from '@/components/Course/CourseEnrollmentSection';

const BoundlessLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            دوره VIP
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            دوره بدون مرز
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            کسب درآمد بین‌المللی و توسعه کسب‌وکار فراتر از مرزها
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  درباره دوره
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  دوره بدون مرز یک برنامه جامع برای کسانی است که می‌خواهند کسب‌وکار خود را 
                  به سطح بین‌المللی ببرند و از بازارهای جهانی کسب درآمد کنند.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">+۲۰۰ دانشجو</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm">۵۰+ ساعت ویدیو</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card>
              <CardHeader>
                <CardTitle>آنچه یاد خواهید گرفت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'کسب درآمد بین‌المللی',
                    'بازاریابی جهانی',
                    'ایجاد برند بین‌المللی',
                    'استراتژی‌های صادرات',
                    'پلتفرم‌های جهانی',
                    'مدیریت ارز و پرداخت'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrollment Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CourseEnrollmentSection
                courseId="boundless-course"
                courseName="دوره بدون مرز"
                isFreeCourse={false}
                price="۴,۹۹۰,۰۰۰ تومان"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoundlessLanding;

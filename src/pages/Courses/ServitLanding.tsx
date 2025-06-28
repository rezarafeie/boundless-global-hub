
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, Clock, Server } from 'lucide-react';
import CourseEnrollmentSection from '@/components/Course/CourseEnrollmentSection';

const ServitLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            دوره تخصصی
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            دوره آموزش سرویت
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            آموزش کامل مدیریت سرور و خدمات میزبانی وب
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-500" />
                  درباره دوره
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  در این دوره تخصصی، تمام نکات مدیریت سرور، پیکربندی خدمات و 
                  بهینه‌سازی عملکرد سیستم‌های میزبانی وب را یاد خواهید گرفت.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">+۱۵۰ دانشجو</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm">۲۵ ساعت ویدیو</span>
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
                    'مدیریت سرور لینوکس',
                    'پیکربندی Apache/Nginx',
                    'امنیت سرور',
                    'پشتیبان‌گیری',
                    'مانیتورینگ سیستم',
                    'بهینه‌سازی عملکرد'
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
                courseId="servit-course"
                courseName="دوره آموزش سرویت"
                isFreeCourse={false}
                price="۲,۴۹۰,۰۰۰ تومان"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServitLanding;

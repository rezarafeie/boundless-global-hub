
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, Clock, Zap } from 'lucide-react';
import CourseEnrollmentSection from '@/components/Course/CourseEnrollmentSection';

const SmartPackLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            پکیج هوشمند
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            پکیج هوشمند دیجیتال مارکتینگ
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            ترکیب بهترین دوره‌های دیجیتال مارکتینگ در یک پکیج کامل
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  درباره پکیج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  پکیج هوشمند شامل مجموعه‌ای از بهترین دوره‌های دیجیتال مارکتینگ است که 
                  به صورت یکپارچه طراحی شده تا شما را از مبتدی به متخصص تبدیل کند.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">+۳۰۰ دانشجو</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm">۸۰+ ساعت ویدیو</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card>
              <CardHeader>
                <CardTitle>شامل این دوره‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'اینستاگرام مارکتینگ کامل',
                    'تلگرام مارکتینگ',
                    'سئو و بهینه‌سازی سایت',
                    'گوگل ادز',
                    'طراحی گرافیک',
                    'کپی رایتینگ'
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
                courseId="smart-pack"
                courseName="پکیج هوشمند دیجیتال مارکتینگ"
                isFreeCourse={false}
                price="۳,۹۹۰,۰۰۰ تومان"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPackLanding;

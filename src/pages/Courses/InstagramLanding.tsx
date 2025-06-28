
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, Clock } from 'lucide-react';
import CourseEnrollmentSection from '@/components/Course/CourseEnrollmentSection';

const InstagramLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
            دوره پرطرفدار
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            دوره جامع اینستاگرام مارکتینگ
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            از صفر تا صد اینستاگرام مارکتینگ و کسب درآمد از شبکه‌های اجتماعی
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  درباره دوره
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  در این دوره کامل، تمام اسرار اینستاگرام مارکتینگ را یاد خواهید گرفت. 
                  از ایجاد محتوای جذاب تا فروش محصولات و خدمات از طریق اینستاگرام.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">+۱۰۰۰ دانشجو</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm">۳۵ ساعت ویدیو</span>
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
                    'استراتژی محتوای اینستاگرام',
                    'تولید محتوای ویروسی',
                    'تبلیغات هدفمند اینستاگرام',
                    'فروش و بازاریابی',
                    'تحلیل و بهینه‌سازی',
                    'ایجاد برند شخصی'
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
                courseId="instagram-marketing"
                courseName="دوره جامع اینستاگرام مارکتینگ"
                isFreeCourse={false}
                price="۱,۹۹۰,۰۰۰ تومان"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramLanding;

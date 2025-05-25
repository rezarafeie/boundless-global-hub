
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CourseRegistrationForm from '@/components/CourseRegistrationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Play, BookOpen, Users, Award, Gift, Star } from 'lucide-react';

interface CourseData {
  title: string;
  englishTitle?: string;
  description: string;
  benefitOne: string;
  benefitTwo: string;
  iconType: 'book' | 'graduation' | 'file' | 'message';
  courseSlug: string;
}

const FreeCourseLanding: React.FC<CourseData> = ({
  title,
  englishTitle,
  description,
  benefitOne,
  benefitTwo,
  iconType,
  courseSlug
}) => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const getIcon = () => {
    switch (iconType) {
      case 'book':
        return <BookOpen className="w-16 h-16" />;
      case 'graduation':
        return <Award className="w-16 h-16" />;
      case 'file':
        return <Star className="w-16 h-16" />;
      case 'message':
        return <Users className="w-16 h-16" />;
      default:
        return <BookOpen className="w-16 h-16" />;
    }
  };

  if (showRegistrationForm) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
          <div className="container max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowRegistrationForm(false)}
                className="mb-4"
              >
                بازگشت به صفحه دوره
              </Button>
            </div>
            <CourseRegistrationForm 
              courseSlug={courseSlug} 
              courseTitle={title}
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 pt-24 pb-16 overflow-hidden">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-green-500 text-white px-6 py-3 text-lg">
              <Gift className="w-5 h-5 mr-2" />
              ۱۰۰٪ رایگان
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {englishTitle && (
                <p className="text-xl text-gray-500 font-medium">
                  {englishTitle}
                </p>
              )}
            </div>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {description}
            </p>
            
            <div className="flex justify-center">
              <div className="text-green-600">
                {getIcon()}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => setShowRegistrationForm(true)}
              >
                <Play className="w-5 h-5 mr-2" />
                شروع دوره رایگان
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>بدون محدودیت زمانی - دسترسی مادام‌العمر</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              چه چیزی یاد خواهید گرفت؟
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <Check size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">مهارت اول</h3>
                      <p className="text-gray-600">{benefitOne}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">مهارت دوم</h3>
                      <p className="text-gray-600">{benefitTwo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              امکانات دوره رایگان
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Play className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">ویدیوهای آموزشی</h3>
                  <p className="text-gray-600 text-sm">
                    دسترسی به ویدیوهای با کیفیت HD
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">جزوه کامل</h3>
                  <p className="text-gray-600 text-sm">
                    دانلود فایل PDF محتوای دوره
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">انجمن دانشجویان</h3>
                  <p className="text-gray-600 text-sm">
                    عضویت در گروه تلگرام اختصاصی
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold">
              آماده شروع یادگیری هستید؟
            </h2>
            <p className="text-xl text-green-100">
              همین الان ثبت‌نام کنید و فوراً به تمام محتوای دوره دسترسی پیدا کنید
            </p>
            
            <Button 
              size="lg" 
              className="bg-white text-green-600 hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowRegistrationForm(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              شروع دوره رایگان
            </Button>
            
            <p className="text-sm text-green-200">
              ✅ بدون نیاز به کارت اعتباری | ✅ دسترسی فوری | ✅ ۱۰۰٪ رایگان
            </p>
          </div>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-30 shadow-lg">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-green-600">{title} - رایگان</div>
              <div className="text-sm text-gray-600">دسترسی فوری و مادام‌العمر</div>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full w-full sm:w-auto"
              onClick={() => setShowRegistrationForm(true)}
            >
              <Play className="w-4 h-4 mr-2" />
              شروع دوره
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FreeCourseLanding;

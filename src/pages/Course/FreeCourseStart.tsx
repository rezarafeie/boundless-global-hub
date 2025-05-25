
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourseActivation } from '@/hooks/useCourseActivation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, Book, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SMSVerificationForm from '@/components/Auth/SMSVerificationForm';

const FreeCourseStart = () => {
  const { courseTitle, slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { activateCourse, loading } = useCourseActivation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isActivated, setIsActivated] = useState(false);
  const [showSMSVerification, setShowSMSVerification] = useState(false);

  // Get course slug from URL params or search params
  const courseSlug = slug || courseTitle || searchParams.get('course') || '';
  const phoneParam = searchParams.get('phone');

  useEffect(() => {
    // If phone parameter exists and user is not logged in, show SMS verification
    if (phoneParam && !user && !authLoading) {
      setShowSMSVerification(true);
      return;
    }

    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (user && courseSlug && !isActivated) {
      handleActivation();
    }
  }, [user, authLoading, courseSlug, isActivated, phoneParam]);

  const handleActivation = async () => {
    if (!courseSlug) {
      toast({
        title: "خطا",
        description: "شناسه دوره یافت نشد",
        variant: "destructive",
      });
      navigate('/courses');
      return;
    }

    const result = await activateCourse(courseSlug, 'free');
    if (result.success) {
      setIsActivated(true);
      if (!result.alreadyActivated) {
        toast({
          title: "تبریک!",
          description: "دوره رایگان با موفقیت فعال شد",
        });
      }
    } else if (result.needsAuth) {
      navigate('/');
    }
  };

  const handleStartCourse = () => {
    navigate(`/course/free/view/${courseSlug}`);
  };

  const handleSMSVerified = () => {
    setShowSMSVerification(false);
    // After SMS verification, user should be logged in automatically
    // The useEffect will handle course activation
  };

  if (showSMSVerification && phoneParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">تایید شماره موبایل</CardTitle>
            </CardHeader>
            <CardContent>
              <SMSVerificationForm
                phone={phoneParam}
                onVerified={handleSMSVerified}
                onBack={() => navigate(-1)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            دوره رایگان فعال شد!
          </h1>
          <p className="text-xl text-gray-600">
            حالا می‌توانید به محتوای دوره دسترسی پیدا کنید
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Play className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>شروع یادگیری</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                به ویدیوهای آموزشی و محتوای دوره دسترسی پیدا کنید
              </p>
              <Button onClick={handleStartCourse} className="w-full">
                شروع دوره
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Book className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>منابع تکمیلی</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                دسترسی به فایل‌های PDF، تمرین‌ها و منابع اضافی
              </p>
              <Button variant="outline" className="w-full">
                مشاهده منابع
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <Users className="w-8 h-8" />
              <h3 className="text-2xl font-bold">به جامعه ما بپیوندید</h3>
            </div>
            <p className="text-blue-100 mb-6">
              با هزاران دانشجوی دیگر در ارتباط باشید و تجربیات خود را به اشتراک بگذارید
            </p>
            <Button variant="secondary" size="lg">
              عضویت در گروه تلگرام
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreeCourseStart;

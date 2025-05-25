
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourseActivation } from '@/hooks/useCourseActivation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, Book, Users, Download, MessageSquare, Bot, HeadphonesIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SMSVerificationForm from '@/components/Auth/SMSVerificationForm';

const FreeCourseStart = () => {
  const { courseTitle, slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { activateCourse, activateAssistant, loading } = useCourseActivation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isActivated, setIsActivated] = useState(false);
  const [showSMSVerification, setShowSMSVerification] = useState(false);
  const [activatedFeatures, setActivatedFeatures] = useState({
    telegram: false,
    aiAssistant: false,
    support: false
  });

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

  const handleFeatureActivation = async (feature: string) => {
    switch (feature) {
      case 'telegram':
        // Simulate telegram join
        setActivatedFeatures(prev => ({ ...prev, telegram: true }));
        toast({
          title: "موفق",
          description: "به گروه تلگرام اضافه شدید",
        });
        // Open telegram link
        window.open('https://t.me/rafieiacademy', '_blank');
        break;
        
      case 'aiAssistant':
        const result = await activateAssistant();
        if (result.success) {
          setActivatedFeatures(prev => ({ ...prev, aiAssistant: true }));
        }
        break;
        
      case 'support':
        setActivatedFeatures(prev => ({ ...prev, support: true }));
        toast({
          title: "موفق",
          description: "پشتیبانی دوره فعال شد",
        });
        break;
    }
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
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 تبریک! دوره رایگان فعال شد
          </h1>
          <p className="text-xl text-gray-600">
            حالا می‌توانید به تمام محتوای دوره دسترسی پیدا کنید
          </p>
        </div>

        <div className="grid gap-8 mb-12">
          {/* Course Access */}
          <Card className="text-center border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <Play className="w-12 h-12 mx-auto mb-4" />
              <CardTitle className="text-2xl">شروع یادگیری</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-gray-600 mb-6 text-lg">
                به ویدیوهای آموزشی و محتوای کامل دوره دسترسی پیدا کنید
              </p>
              <Button onClick={handleStartCourse} size="lg" className="px-8 py-4 text-lg">
                <Play className="w-5 h-5 mr-2" />
                شروع دوره
              </Button>
            </CardContent>
          </Card>

          {/* Course Materials */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Download className="w-6 h-6 text-blue-600" />
                📂 فایل‌های قابل دانلود
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-5 h-5 text-red-600" />
                    <span className="font-semibold">جزوه PDF</span>
                  </div>
                  <span className="text-sm text-gray-600">محتوای کامل دوره</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">فایل‌های تمرین</span>
                  </div>
                  <span className="text-sm text-gray-600">تمرین‌های عملی</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Telegram */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className={`w-12 h-12 mx-auto mb-4 ${activatedFeatures.telegram ? 'text-green-600' : 'text-blue-600'}`} />
                <h3 className="font-bold text-lg mb-2">گروه تلگرام</h3>
                <p className="text-gray-600 text-sm mb-4">
                  عضویت در انجمن اختصاصی دانشجویان
                </p>
                <Button 
                  onClick={() => handleFeatureActivation('telegram')}
                  variant={activatedFeatures.telegram ? "secondary" : "default"}
                  className="w-full"
                  disabled={activatedFeatures.telegram}
                >
                  {activatedFeatures.telegram ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      عضو شدید
                    </>
                  ) : (
                    'عضویت در گروه'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Bot className={`w-12 h-12 mx-auto mb-4 ${activatedFeatures.aiAssistant ? 'text-green-600' : 'text-purple-600'}`} />
                <h3 className="font-bold text-lg mb-2">🤖 دستیار هوشمند</h3>
                <p className="text-gray-600 text-sm mb-4">
                  پاسخ فوری به سوالات شما
                </p>
                <Button 
                  onClick={() => handleFeatureActivation('aiAssistant')}
                  variant={activatedFeatures.aiAssistant ? "secondary" : "default"}
                  className="w-full"
                  disabled={activatedFeatures.aiAssistant}
                >
                  {activatedFeatures.aiAssistant ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      فعال شد
                    </>
                  ) : (
                    'راه‌اندازی AI'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="text-center">
              <CardContent className="p-6">
                <HeadphonesIcon className={`w-12 h-12 mx-auto mb-4 ${activatedFeatures.support ? 'text-green-600' : 'text-orange-600'}`} />
                <h3 className="font-bold text-lg mb-2">🧑‍💬 پشتیبانی دوره</h3>
                <p className="text-gray-600 text-sm mb-4">
                  راهنمایی و حل مشکلات
                </p>
                <Button 
                  onClick={() => handleFeatureActivation('support')}
                  variant={activatedFeatures.support ? "secondary" : "default"}
                  className="w-full"
                  disabled={activatedFeatures.support}
                >
                  {activatedFeatures.support ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      فعال شد
                    </>
                  ) : (
                    'فعال‌سازی'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">آماده شروع هستید؟</h3>
            <p className="text-blue-100 mb-6 text-lg">
              همین حالا اولین قدم را برای تغییر زندگی‌تان بردارید
            </p>
            <Button 
              onClick={handleStartCourse}
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg font-bold"
            >
              <Play className="w-5 h-5 mr-2" />
              شروع دوره رایگان
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreeCourseStart;

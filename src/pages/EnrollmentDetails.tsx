import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  Phone,
  Shield,
  Key,
  BookOpen,
  ArrowLeft,
  Crown,
  PlayCircle,
  Gift,
  HeadphonesIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import StartCourseSection from '@/components/StartCourseSection';

interface EnrollmentData {
  id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  payment_method?: string;
  zarinpal_ref_id?: string;
  created_at: string;
  approved_at?: string;
  receipt_url?: string;
  spotplayer_license_key?: string;
  spotplayer_license_url?: string;
  spotplayer_license_id?: string;
  courses: {
    id: string;
    title: string;
    description: string;
    slug: string;
    redirect_url?: string;
    is_spotplayer_enabled: boolean;
    spotplayer_course_id?: string;
    woocommerce_create_access: boolean;
    support_link?: string;
    telegram_channel_link?: string;
    gifts_link?: string;
    enable_course_access: boolean;
    support_activation_required?: boolean;
    telegram_activation_required?: boolean;
    smart_activation_enabled?: boolean;
    smart_activation_telegram_link?: string;
    telegram_only_access?: boolean;
  };
}

const EnrollmentDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const enrollmentId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [smartActivated, setSmartActivated] = useState(false);

  // Load smart activation status from localStorage on component mount
  useEffect(() => {
    if (!enrollmentId) return;
    
    const activationKey = `activations_${enrollmentId}`;
    const savedActivations = localStorage.getItem(activationKey);
    
    if (savedActivations) {
      try {
        const { smart } = JSON.parse(savedActivations);
        setSmartActivated(smart || false);
      } catch (error) {
        console.error('Error parsing saved activations:', error);
      }
    }
  }, [enrollmentId]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/auth');
        return;
      }
      
      if (enrollmentId) {
        fetchEnrollmentDetails();
      } else {
        navigate('/dashboard');
      }
    }
  }, [enrollmentId, isAuthenticated, authLoading]);

  const fetchEnrollmentDetails = async () => {
    if (!enrollmentId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            slug,
            redirect_url,
            is_spotplayer_enabled,
            spotplayer_course_id,
            woocommerce_create_access,
            support_link,
            telegram_channel_link,
            gifts_link,
            enable_course_access,
            support_activation_required,
            telegram_activation_required,
            smart_activation_enabled,
            smart_activation_telegram_link,
            telegram_only_access
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (error) {
        console.error('Error fetching enrollment:', error);
        setAccessDenied(true);
        return;
      }

      if (!data) {
        setAccessDenied(true);
        return;
      }

      // Check if user has access to this enrollment
      const isAdmin = user?.messengerData?.is_messenger_admin || false;
      const hasAccess = 
        isAdmin || // Admin can see all enrollments
        data.email === user?.email || 
        data.phone === user?.phone ||
        data.chat_user_id === parseInt(user?.id || '0');

      if (!hasAccess) {
        setAccessDenied(true);
        return;
      }

      setEnrollment(data as EnrollmentData);
    } catch (error) {
      console.error('Error:', error);
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCourse = () => {
    if (!enrollment?.courses) return;
    
    if (enrollment.courses.enable_course_access) {
      // Navigate to course access page
      window.open(`/access?course=${enrollment.courses.slug}`, '_blank');
    } else if (enrollment.courses.redirect_url) {
      // Navigate to external course URL
      window.open(enrollment.courses.redirect_url, '_blank');
    } else {
      toast({
        title: 'خطا',
        description: 'لینک دسترسی به دوره یافت نشد',
        variant: 'destructive'
      });
    }
  };

  const handleSmartActivation = () => {
    if (!enrollmentId) return;
    
    // Mark smart activation as clicked in localStorage
    const activationKey = `activations_${enrollmentId}`;
    const savedActivations = localStorage.getItem(activationKey);
    let activations = { support: false, telegram: false, smart: false };
    
    if (savedActivations) {
      try {
        activations = JSON.parse(savedActivations);
      } catch (error) {
        console.error('Error parsing saved activations:', error);
      }
    }
    
    activations.smart = true;
    localStorage.setItem(activationKey, JSON.stringify(activations));
    setSmartActivated(true);
    
    // Open the link
    window.open(enrollment!.courses.smart_activation_telegram_link!, '_blank');
    
    toast({
      title: "فعال‌سازی هوشمند",
      description: "فعال‌سازی هوشمند با موفقیت انجام شد! حالا می‌توانید به دوره‌ها دسترسی پیدا کنید.",
    });
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (accessDenied) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">دسترسی مجاز نیست</h2>
              <p className="text-muted-foreground mb-4">
                شما دسترسی لازم برای مشاهده این ثبت‌نام را ندارید
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                بازگشت به داشبورد
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!enrollment) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">ثبت‌نام یافت نشد</h2>
              <p className="text-muted-foreground mb-4">
                اطلاعات ثبت‌نام مورد نظر یافت نشد
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                بازگشت به داشبورد
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isSuccessfulPayment = enrollment.payment_status === 'success' || enrollment.payment_status === 'completed';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به داشبورد
          </Button>
          <div>
            <h1 className="text-2xl font-bold">جزئیات ثبت‌نام</h1>
            <p className="text-muted-foreground">اطلاعات کامل ثبت‌نام شما در دوره</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isSuccessfulPayment ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  وضعیت ثبت‌نام
                </CardTitle>
                <Badge variant={isSuccessfulPayment ? "default" : "destructive"}>
                  {isSuccessfulPayment ? 'تکمیل شده' : 'در انتظار تایید'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نام و نام خانوادگی:</span>
                    <span className="font-medium">{enrollment.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ایمیل:</span>
                    <span className="font-medium">{enrollment.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">شماره تلفن:</span>
                    <span className="font-medium">{enrollment.phone}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مبلغ پرداختی:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fa-IR').format(enrollment.payment_amount)} تومان
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاریخ ثبت‌نام:</span>
                    <span className="font-medium">
                      {new Intl.DateTimeFormat('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(enrollment.created_at))}
                    </span>
                  </div>
                  {enrollment.zarinpal_ref_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">کد رهگیری:</span>
                      <span className="font-mono font-medium">{enrollment.zarinpal_ref_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                دوره ثبت‌نام شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{enrollment.courses.title}</h3>
                  <p className="text-muted-foreground mb-4">{enrollment.courses.description}</p>
                  
                  {/* Smart Activation Section - Above StartCourse */}
                  {isSuccessfulPayment && enrollment.courses.smart_activation_enabled && enrollment.courses.smart_activation_telegram_link && (
                    <Card className="mb-4 sm:mb-6">
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                            <span className="break-words">
                              {enrollment?.courses?.telegram_only_access 
                                ? 'فعال سازی پشتیبانی و دسترسی به محتوای دوره'
                                : 'فعال‌سازی هوشمند'
                              }
                            </span>
                          </div>
                          {smartActivated && (
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 self-start sm:self-auto">
                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1" />
                              <span className="text-xs sm:text-sm">فعال شده</span>
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                          {enrollment?.courses?.telegram_only_access 
                            ? 'برای دسترسی به دوره و دریافت پشتیبانی، ابتدا فعال‌سازی را انجام دهید'
                            : 'برای دسترسی کامل به دوره، ابتدا فعال‌سازی هوشمند را انجام دهید'
                          }
                        </p>
                        <Button
                          className={`w-full h-11 sm:h-14 text-sm sm:text-base font-bold px-3 sm:px-6 ${
                            smartActivated && !enrollment?.courses?.telegram_only_access
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' 
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transform hover:scale-105'
                          }`}
                          onClick={handleSmartActivation}
                          disabled={smartActivated && !enrollment?.courses?.telegram_only_access}
                          variant={smartActivated && !enrollment?.courses?.telegram_only_access ? "outline" : "default"}
                        >
                          <Send className="h-3 w-3 sm:h-5 sm:w-5 ml-1 sm:ml-2 flex-shrink-0" />
                          <span className="break-words leading-tight text-center">
                            {smartActivated && !enrollment?.courses?.telegram_only_access
                              ? "✅ فعال‌سازی انجام شده" 
                              : enrollment?.courses?.telegram_only_access 
                                ? "⚡ فعال سازی پشتیبانی"
                                : "⚡ فعال‌سازی هوشمند"
                            }
                          </span>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center leading-relaxed">
                          {smartActivated ? "شما با موفقیت فعال‌سازی را انجام داده‌اید" : "پس از کلیک روی این دکمه، صفحه StartCourse فعال خواهد شد"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Telegram Only Access Message */}
                  {isSuccessfulPayment && enrollment.courses.telegram_only_access && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 sm:p-6 border border-blue-200 dark:border-blue-800 text-center mb-4 sm:mb-6">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 text-base sm:text-lg">
                        🔐 دسترسی به محتوای دوره
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                        <strong>دسترسی به محتوای این دوره فقط از طریق فعال‌سازی تلگرام امکان‌پذیر است.</strong>
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                        لطفاً از طریق دکمه‌های فعال‌سازی هوشمند یا فعال‌سازی عادی تلگرام اقدام کنید.
                      </p>
                    </div>
                  )}
                  
                  {isSuccessfulPayment && !enrollment.courses.telegram_only_access && (
                    <StartCourseSection 
                      enrollment={enrollment}
                      course={enrollment.courses}
                      onEnterCourse={handleEnterCourse}
                      userEmail={enrollment.email}
                      key={`course-section-${enrollment.id}-${smartActivated}`}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access & Activation Links */}
          {isSuccessfulPayment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SSO Access */}
              {enrollment.courses.woocommerce_create_access && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                      دسترسی SSO
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      دسترسی یکپارچه به سیستم مدیریت یادگیری
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => window.open(`/sso?course=${enrollment.courses.slug}&email=${enrollment.email}`, '_blank')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      ورود با SSO
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Rafiei Player */}
              {enrollment.courses.is_spotplayer_enabled && enrollment.spotplayer_license_key && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PlayCircle className="h-5 w-5 text-purple-600" />
                      پلیر رفیعی
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      دسترسی به پلیر اختصاصی دوره
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">کلید لایسنس:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {enrollment.spotplayer_license_key}
                        </code>
                      </div>
                      {enrollment.spotplayer_license_url && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(enrollment.spotplayer_license_url!, '_blank')}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          دانلود پلیر
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}


          {/* Important Links */}
          {isSuccessfulPayment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  لینک‌های مهم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollment.courses.telegram_channel_link && (
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => window.open(enrollment.courses.telegram_channel_link!, '_blank')}
                    >
                      <Send className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">کانال تلگرام</span>
                    </Button>
                  )}
                  
                  {enrollment.courses.gifts_link && (
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => window.open(enrollment.courses.gifts_link!, '_blank')}
                    >
                      <Gift className="h-5 w-5 text-green-500" />
                      <span className="text-sm">هدایای دوره</span>
                    </Button>
                  )}
                  
                  {enrollment.courses.support_link && (
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => window.open(enrollment.courses.support_link!, '_blank')}
                    >
                      <HeadphonesIcon className="h-5 w-5 text-purple-500" />
                      <span className="text-sm">پشتیبانی دوره</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                پشتیبانی و ارتباط با ما
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.open('https://t.me/rafieiacademy', '_blank')}
                >
                  <Send className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">تلگرام</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.open('https://wa.me/989123456789', '_blank')}
                >
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <span className="text-sm">واتساپ</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = 'tel:+989123456789'}
                >
                  <Phone className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">تماس تلفنی</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default EnrollmentDetails;
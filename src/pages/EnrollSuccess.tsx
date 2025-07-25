import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw, MessageSquare, Send, Phone, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentAuthService, EnrollmentAuthData } from '@/lib/enrollmentAuthService';
import MainLayout from '@/components/Layout/MainLayout';
import StartCourseSection from '@/components/StartCourseSection';

interface VerificationResult {
  success: boolean;
  refId?: string;
  course?: any;
  enrollment?: any;
  woocommerceOrderId?: number;
  error?: string;
  code?: string;
}

const EnrollSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, login } = useAuth();
  
  const courseSlug = searchParams.get('course');
  const email = searchParams.get('email');
  // Handle both 'Authority' (capital A from Zarinpal) and 'authority' (lowercase)
  const authority = searchParams.get('Authority') || searchParams.get('authority');
  const status = searchParams.get('Status') || searchParams.get('status');
  const enrollmentId = searchParams.get('enrollment');

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [smartActivated, setSmartActivated] = useState(false);

  // Auto-authenticate user after successful enrollment
  useEffect(() => {
    if (result?.success && result?.enrollment && !user && !authenticating) {
      handleAutoAuthentication();
    }
  }, [result, user, authenticating]);

  // Check smart activation status
  useEffect(() => {
    if (result?.enrollment?.id) {
      const activationKey = `activations_${result.enrollment.id}`;
      const savedActivations = localStorage.getItem(activationKey);
      
      if (savedActivations) {
        try {
          const { smart } = JSON.parse(savedActivations);
          setSmartActivated(smart || false);
        } catch (error) {
          console.error('Error parsing saved activations:', error);
        }
      }
    }
  }, [result?.enrollment?.id]);

  // Function to replace user placeholders in smart activation telegram link
  const replacePlaceholders = (template: string, enrollment: any): string => {
    if (!template || !enrollment) return template;
    
    const fullName = enrollment.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return template
      .replace(/{name}/g, firstName)
      .replace(/{lastname}/g, lastName)
      .replace(/{phone}/g, enrollment.phone || '')
      .replace(/{email}/g, enrollment.email || '');
  };

  const handleAutoAuthentication = async () => {
    if (!result?.enrollment) return;
    
    try {
      setAuthenticating(true);
      console.log('🔐 Starting auto-authentication for enrollment:', result.enrollment.id);
      
      // Extract enrollment data for authentication
      const enrollmentAuthData: EnrollmentAuthData = {
        firstName: result.enrollment.full_name?.split(' ')[0] || '',
        lastName: result.enrollment.full_name?.split(' ').slice(1).join(' ') || '',
        email: result.enrollment.email || email || '',
        phone: result.enrollment.phone || '',
        countryCode: result.enrollment.country_code || '+98'
      };
      
      // Attempt automatic authentication
      const authResult = await enrollmentAuthService.createAndLoginAfterEnrollment(
        enrollmentAuthData,
        result.enrollment
      );
      
      if (authResult.success && authResult.user && authResult.token) {
        console.log('✅ Auto-authentication successful');
        
        // Store persistent session
        enrollmentAuthService.storePersistentSession(authResult.user, authResult.token);
        
        // Log in user through auth context
        login(authResult.user, authResult.token);
        
        toast({
          title: 'ورود موفق',
          description: authResult.isNewUser 
            ? 'حساب کاربری شما ایجاد و وارد شدید' 
            : 'با موفقیت وارد شدید',
          variant: 'default',
        });
        
      } else {
        console.warn('Auto-authentication failed:', authResult.error);
        // Don't show error to user, as manual login is still available
      }
    } catch (error) {
      console.error('Error during auto-authentication:', error);
      // Don't show error to user, as manual login is still available
    } finally {
      setAuthenticating(false);
    }
  };

  const updateEnrollmentWithChatUser = async () => {
    if (!user || !result?.enrollment) return;
    
    try {
      await supabase
        .from('enrollments')
        .update({ chat_user_id: parseInt(user.id) })
        .eq('id', result.enrollment.id);
    } catch (error) {
      console.error('Error updating enrollment with chat_user_id:', error);
    }
  };

  useEffect(() => {
    if (authority && enrollmentId && status === 'OK') {
      // Check if this is a free course
      if (authority === 'FREE_COURSE') {
        handleFreeCourseSuccess();
      } else if (authority === 'MANUAL_PAYMENT') {
        // Check if this is a manual payment that's already approved
        handleManualPaymentSuccess();
      } else {
        verifyPayment();
      }
    } else {
      setVerifying(false);
      setResult({
        success: false,
        error: 'پارامترهای پرداخت نامعتبر هستند'
      });
    }
  }, [authority, enrollmentId, status]);

  const handleFreeCourseSuccess = async () => {
    try {
      setVerifying(true);
      
      // Fetch enrollment and course data
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            title,
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
            smart_activation_telegram_link
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError) throw enrollmentError;

      // Set result for free course
      setResult({
        success: true,
        refId: 'FREE_COURSE',
        course: enrollment.courses,
        enrollment: enrollment
      });
      
      toast({
        title: "✅ ثبت‌نام رایگان موفق",
        description: "ثبت‌نام شما در دوره رایگان با موفقیت انجام شد",
      });
    } catch (error) {
      console.error('Free course verification error:', error);
      setResult({
        success: false,
        error: 'خطا در تایید ثبت‌نام رایگان'
      });
      toast({
        title: "خطا",
        description: "خطا در تایید ثبت‌نام رایگان",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualPaymentSuccess = async () => {
    try {
      setVerifying(true);
      
      // Fetch enrollment and course data
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            title,
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
            smart_activation_telegram_link
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError) throw enrollmentError;

      // Check if enrollment is actually approved
      if (enrollment.manual_payment_status === 'approved' && enrollment.payment_status === 'completed') {
        setResult({
          success: true,
          refId: 'MANUAL_PAYMENT_APPROVED',
          course: enrollment.courses,
          enrollment: enrollment,
          woocommerceOrderId: enrollment.woocommerce_order_id
        });
        
        toast({
          title: "✅ پرداخت تایید شد",
          description: "ثبت‌نام شما با موفقیت انجام شد و توسط ادمین تایید شده است",
        });
      } else {
        throw new Error('Manual payment not approved yet');
      }
    } catch (error) {
      console.error('Manual payment verification error:', error);
      setResult({
        success: false,
        error: 'پرداخت هنوز تایید نشده است'
      });
      toast({
        title: "انتظار تایید",
        description: "پرداخت شما هنوز توسط ادمین تایید نشده است",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      
      const response = await supabase.functions.invoke('zarinpal-verify', {
        body: {
          authority,
          enrollmentId
        }
      });

      if (response.error) throw response.error;

      const { data } = response;
      setResult(data);
      
      if (data.success) {
        toast({
          title: "پرداخت موفق",
          description: `ثبت‌نام شما با موفقیت انجام شد. کد رهگیری: ${data.refId}`,
        });
      } else {
        toast({
          title: "خطا در تایید پرداخت",
          description: data.error || "پرداخت تایید نشد",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setResult({
        success: false,
        error: 'خطا در تایید پرداخت'
      });
      toast({
        title: "خطا",
        description: "خطا در تایید پرداخت. لطفا با پشتیبانی تماس بگیرید.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleEnterCourse = () => {
    if (result?.course?.redirect_url) {
      window.open(result.course.redirect_url, '_blank');
    }
  };

  const handleRetry = () => {
    setVerifying(true);
    verifyPayment();
  };

  if (verifying) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">در حال تایید پرداخت</h2>
                <p className="text-muted-foreground">
                  لطفا صبر کنید، پرداخت شما در حال تایید است...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 min-w-0">
        <div className="max-w-2xl mx-auto min-w-0">
          {result?.success ? (
            // Success State
            <Card className="bg-card/80 backdrop-blur-sm border shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl text-green-700 dark:text-green-400 mb-2">
                  🎉 ثبت‌نام موفقیت‌آمیز!
                </CardTitle>
                <p className="text-muted-foreground">
                  پرداخت شما با موفقیت انجام شد و ثبت‌نام تکمیل گردید.
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Activation Requirements (if activated) */}
                {result.course && ((result.course.support_activation_required && !result.course.smart_activation_enabled) || result.course.smart_activation_enabled || result.course.telegram_activation_required) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                      ⚠️ فعال‌سازی‌های مهم
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      برای دسترسی کامل به محتوای دوره، لطفاً موارد زیر را انجام دهید:
                    </p>
                    <div className="space-y-3">
                      {/* Regular Support Activation */}
                      {result.course.support_activation_required && !result.course.smart_activation_enabled && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span>فعال‌سازی پشتیبانی (اجباری)</span>
                        </div>
                      )}
                      
                       {/* Smart Activation */}
                      {result.course.smart_activation_enabled && result.course.smart_activation_telegram_link && (
                        <div 
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border group relative ${
                            smartActivated 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 cursor-default'
                              : 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 border-purple-200 dark:border-purple-800 hover:shadow-md cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!smartActivated) {
                              // Mark smart activation as clicked in localStorage
                              if (result.enrollment?.id) {
                                const activationKey = `activations_${result.enrollment.id}`;
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
                                
                                // Open the link without reloading page
                                window.open(replacePlaceholders(result.course.smart_activation_telegram_link, result.enrollment), '_blank');
                              }
                            }
                          }}
                        >
                          {/* Smart Badge */}
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                            smartActivated 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500'
                          }`}>
                            {smartActivated ? (
                              <CheckCircle className="h-3 w-3 text-white" />
                            ) : (
                              <Zap className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform flex-shrink-0 ${
                            smartActivated 
                              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
                              : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 group-hover:scale-110'
                          }`}>
                            {smartActivated ? (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm flex items-center gap-2">
                              فعال‌سازی هوشمند {smartActivated ? '(فعال شده)' : '(اجباری)'}
                              <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${
                                smartActivated 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}>
                                {smartActivated ? 'فعال' : 'SMART'}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {smartActivated 
                                ? 'فعال‌سازی هوشمند با موفقیت انجام شد'
                                : 'کلیک کنید تا به صورت خودکار فعال شود'
                              }
                            </p>
                          </div>
                          {!smartActivated && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          )}
                        </div>
                      )}
                      
                      {/* Telegram Channel Activation */}
                      {result.course.telegram_activation_required && result.course.telegram_channel_link && (
                        <a 
                          href={result.course.telegram_channel_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all duration-200 border border-blue-200 dark:border-blue-800 hover:shadow-md group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              عضویت در کانال تلگرام (اجباری)
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              کلیک کنید برای عضویت در کانال
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </a>
                      )}
                      
                      {/* Telegram Activation without link - just show requirement */}
                      {result.course.telegram_activation_required && !result.course.telegram_channel_link && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span>عضویت در کانال تلگرام (اجباری)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Course Start Section */}
                <StartCourseSection 
                  enrollment={result.enrollment}
                  course={result.course}
                  onEnterCourse={handleEnterCourse}
                  userEmail={email || ''}
                  key={`course-section-${result.enrollment?.id}-${smartActivated}`}
                />

                {/* Course Action Links (if activation requires not activated) */}
                {/* This will be rendered by StartCourseSection -> CourseActionLinks */}

                {/* Payment Details */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-800 dark:text-green-400 mb-3">جزئیات پرداخت</h3>
                  <div className="space-y-2 text-sm">
                    {/* Show different details based on payment type */}
                    {result.refId === 'FREE_COURSE' ? (
                      // Free course details
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">نوع دوره:</span>
                          <span className="font-medium text-green-600">رایگان</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">زمان ثبت‌نام:</span>
                          <span className="font-medium">{result.enrollment?.created_at ? new Intl.DateTimeFormat('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(result.enrollment.created_at)) : 'نامشخص'}</span>
                        </div>
                      </>
                    ) : result.refId === 'MANUAL_PAYMENT_APPROVED' ? (
                      // Manual payment details
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">مبلغ پرداختی:</span>
                          <span className="font-medium">{result.enrollment?.payment_amount ? new Intl.NumberFormat('fa-IR').format(result.enrollment.payment_amount) + ' تومان' : 'نامشخص'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">زمان تایید:</span>
                          <span className="font-medium">{result.enrollment?.approved_at ? new Intl.DateTimeFormat('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(result.enrollment.approved_at)) : 'نامشخص'}</span>
                        </div>
                        {result.enrollment?.receipt_url && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">رسید پرداخت:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(result.enrollment.receipt_url, '_blank')}
                              className="h-8 px-3 text-xs"
                            >
                              مشاهده رسید
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      // Online payment details
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">کد رهگیری:</span>
                          <span className="font-mono font-medium">{result.refId}</span>
                        </div>
                      </>
                    )}
                    {result.woocommerceOrderId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">شماره سفارش:</span>
                        <span className="font-mono font-medium">{result.woocommerceOrderId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ایمیل:</span>
                      <span className="font-medium">{email}</span>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                {result.course && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-3">دوره ثبت‌نام شده</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{result.course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.course.description}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        فعال
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Support Section */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20 shadow-sm overflow-hidden">
                  <h3 className="font-semibold text-primary mb-4 flex items-center gap-2 text-base md:text-lg">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    پشتیبانی و ارتباط با ما
                  </h3>
                   <div className="space-y-3 md:grid md:grid-cols-3 md:gap-3 md:space-y-0">
                     {/* Telegram Support Link - Always show */}
                     <a 
                       href="https://t.me/rafieiacademy" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-2 md:gap-3 p-3 bg-card/80 rounded-lg hover:bg-card transition-all duration-200 border border-border/50 hover:shadow-md hover:border-primary/30 group min-w-0"
                     >
                       <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                         <Send className="h-4 w-4 text-primary" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-sm">تلگرام</p>
                         <p className="text-xs text-muted-foreground truncate">@rafieiacademy</p>
                       </div>
                       <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                     </a>

                    {/* Rafiei Messenger */}
                    <a 
                      href="https://academy.rafiei.co/messenger" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 md:gap-3 p-3 bg-card/80 rounded-lg hover:bg-card transition-all duration-200 border border-border/50 hover:shadow-md hover:border-primary/30 group min-w-0"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">رفیعی مسنجر</p>
                        <p className="text-xs text-muted-foreground truncate">پیام رسان آکادمی</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>

                    {/* Phone */}
                    <a 
                      href="tel:02128427131" 
                      className="flex items-center gap-2 md:gap-3 p-3 bg-card/80 rounded-lg hover:bg-card transition-all duration-200 border border-border/50 hover:shadow-md hover:border-primary/30 group min-w-0"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">تماس تلفنی</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">021-28427131</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Error State
            <Card className="bg-card/80 backdrop-blur-sm border shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl text-red-700 dark:text-red-400 mb-2">
                  خطا در پرداخت
                </CardTitle>
                <p className="text-muted-foreground">
                  {result?.error || 'پرداخت شما تایید نشد'}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">دلایل احتمالی:</h3>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• لغو پرداخت توسط کاربر</li>
                    <li>• عدم موجودی کافی</li>
                    <li>• خطا در درگاه پرداخت</li>
                    <li>• مشکل در اتصال اینترنت</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    تلاش مجدد
                  </Button>
                  <Button
                    onClick={() => window.history.back()}
                    className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground"
                  >
                    بازگشت
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium mb-1">نیاز به کمک؟</p>
                  <p>
                    در صورت برداشت وجه، لطفا با کد رهگیری با پشتیبانی تماس بگیرید.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default EnrollSuccess;
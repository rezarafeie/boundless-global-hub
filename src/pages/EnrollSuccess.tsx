import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw, MessageSquare, Send, Phone, Zap, Brain, User, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentAuthService, EnrollmentAuthData } from '@/lib/enrollmentAuthService';
import { esanjService } from '@/lib/esanjService';
import { toast } from 'sonner';
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

interface TestEnrollment {
  id: string
  test_id: string
  phone: string
  full_name: string
  email: string
  payment_status: string
  payment_amount: number
  enrollment_status: string
  esanj_employee_id?: number
  esanj_uuid?: string
  birth_year?: number
  sex?: string
  tests: {
    title: string
    test_id: number
    price: number
  }
}

interface TestEnrollmentSuccessViewProps {
  testSlug: string | null
  phone: string | null
  enrollmentId: string | null
  status: string | null
  authority: string | null
}

// Test Enrollment Success Component 
const TestEnrollmentSuccessView: React.FC<TestEnrollmentSuccessViewProps> = ({ 
  testSlug, phone, enrollmentId, status, authority 
}) => {
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<TestEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [processingMessage, setProcessingMessage] = useState('آزمون شما در حال آماده‌سازی است...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollment();
    } else {
      setLoading(false);
    }
  }, [enrollmentId]);

  // Auto-retry logic to check enrollment status and start processing if ready
  useEffect(() => {
    if (enrollment && enrollment.enrollment_status !== 'ready' && !isProcessing) {
      const interval = setInterval(() => {
        fetchEnrollment();
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [enrollment, isProcessing]);

  // Check for auto-processing when enrollment loads
  useEffect(() => {
    if (enrollment && enrollment.enrollment_status !== 'ready' && !isProcessing) {
      checkAndAutoStartProcessing();
    }
  }, [enrollment?.id]); // Only run when enrollment ID changes

  const checkAndAutoStartProcessing = async () => {
    if (!enrollment || isProcessing || enrollment.enrollment_status === 'ready') return;

    console.log('Checking auto-start processing for enrollment:', enrollment.id);
    
    try {
      // First check if enrollment already has birth_year and sex
      if (enrollment.birth_year && enrollment.sex) {
        console.log('Enrollment already has birth_year and sex, processing...');
        await processEsanjTest(enrollment.birth_year.toString(), enrollment.sex);
        return;
      }

      // Check if user has birth_year and sex in chat_users table
      const { data: chatUser, error: userError } = await supabase
        .from('chat_users')
        .select('birth_year, sex')
        .eq('phone', enrollment.phone)
        .single();

      console.log('Chat user data:', chatUser);

      // If user has complete data, start processing automatically
      if (chatUser && chatUser.birth_year && chatUser.sex) {
        console.log('Auto-starting processing with existing user data');
        setAge(chatUser.birth_year.toString());
        setSex(chatUser.sex);
        // Start processing with the user's existing data
        await processEsanjTest(chatUser.birth_year.toString(), chatUser.sex);
        return;
      }

      // If no data found locally, check Test Center database
      console.log('No local data found, checking Test Center database...');
      setProcessingMessage('جستجو در پایگاه داده مرکز سنجش...');
      
      const { data: esanjResult, error: esanjError } = await supabase.functions.invoke('check-esanj-employee', {
        body: { 
          phone: enrollment.phone,
          enrollmentId: enrollment.id
        }
      });

      if (esanjError) {
        console.error('Error checking Esanj employee:', esanjError);
        setProcessingMessage('خطا در جستجوی اطلاعات');
        return;
      }

      if (esanjResult?.found) {
        console.log('Employee found in Test Center, data saved automatically');
        setProcessingMessage('اطلاعات از پایگاه داده مرکز سنجش بازیابی شد');
        // Refresh enrollment data to get the updated birth_year and sex
        await fetchEnrollment();
        // The updated data will trigger another call to this function
        return;
      } else {
        console.log('Employee not found in Test Center, manual input required');
        setProcessingMessage('نیاز به تکمیل اطلاعات');
      }
    } catch (error) {
      console.error('Error checking user data:', error);
      setProcessingMessage('خطا در بررسی اطلاعات');
    }
  };

  // Update UI when enrollment becomes ready AND has required data
  useEffect(() => {
    if (enrollment?.enrollment_status === 'ready' && enrollment.birth_year && enrollment.sex && !isReady) {
      setIsReady(true);
      setProcessingMessage('✅ آزمون شما آماده است!');
      toast.success('آزمون با موفقیت آماده شد');
    }
  }, [enrollment?.enrollment_status, enrollment?.birth_year, enrollment?.sex, isReady]);

  const fetchEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests!inner(
            title,
            test_id,
            price
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (error) {
        console.error('Error fetching enrollment:', error);
        return;
      }

      setEnrollment(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEsanjTest = async (userAge: string, userSex: string) => {
    console.log('Starting processEsanjTest with:', { userAge, userSex, enrollmentId: enrollment?.id });
    
    if (!enrollment) {
      console.error('No enrollment found');
      toast.error('اطلاعات ثبت‌نام یافت نشد');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('در حال ایجاد حساب کاربری...');
    
    try {
      // Convert age to birth year for storage
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(userAge);
      
      // Update chat_users table with birth_year and sex
      const { error: updateUserError } = await supabase
        .from('chat_users')
        .update({
          birth_year: birthYear,
          sex: userSex
        })
        .eq('phone', enrollment.phone);

      if (updateUserError) {
        console.error('Error updating user data:', updateUserError);
        // Continue anyway - not critical
      }

      // Find or create employee in Esanj
      const employee = await esanjService.findOrCreateEmployee(
        enrollment.phone,
        {
          name: enrollment.full_name,
          phone_number: enrollment.phone,
          birth_year: birthYear,
          sex: userSex
        }
      );

      setProcessingMessage('در حال آماده‌سازی آزمون...');

      // Generate UUID for this test session
      const testUuid = crypto.randomUUID();

      // Update enrollment with Esanj details
      const { error: updateError } = await supabase
        .from('test_enrollments')
        .update({
          esanj_employee_id: employee.id,
          esanj_uuid: testUuid,
          birth_year: currentYear - parseInt(userAge),
          sex: userSex,
          enrollment_status: 'ready'
        })
        .eq('id', enrollment.id);

      if (updateError) {
        throw updateError;
      }

      setProcessingMessage('✅ آزمون با موفقیت آماده شد!');
      setShowEmployeeForm(false);
      setIsReady(true);
      
      // Refresh enrollment data
      await fetchEnrollment();
    } catch (error) {
      console.error('Error creating Esanj test:', error);
      toast.error('خطا در آماده‌سازی آزمون');
      setProcessingMessage('خطا در آماده‌سازی آزمون');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateEsanjTest = async () => {
    if (!enrollment) {
      toast.error('اطلاعات ثبت‌نام یافت نشد');
      return;
    }

    // If we don't have age and sex from state, ask for them
    if (!age || !sex) {
      toast.error('لطفاً تمام اطلاعات را وارد کنید');
      return;
    }

    // Validate age range
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      toast.error('سن باید بین 1 تا 150 سال باشد');
      return;
    }

    await processEsanjTest(age, sex);
  };

  const handleStartTest = () => {
    if (enrollment?.enrollment_status === 'ready') {
      navigate(`/access?test=${enrollment.id}`);
    } else {
      setShowEmployeeForm(true);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>در حال بارگذاری...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!enrollment) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">ثبت‌نام یافت نشد</h3>
              <p className="text-muted-foreground mb-4">
                اطلاعات ثبت‌نام شما یافت نشد.
              </p>
              <Button onClick={() => navigate('/tests')}>
                بازگشت به لیست آزمون‌ها
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ثبت‌نام در آزمون موفقیت‌آمیز
            </h1>
            <p className="text-muted-foreground">
              ثبت‌نام شما در آزمون با موفقیت انجام شد
            </p>
          </div>

          {/* Test Processing Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                وضعیت آزمون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                {isReady ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium text-lg">{processingMessage}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="font-medium">{processingMessage}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                جزئیات ثبت‌نام آزمون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">نام:</span>
                  <span className="font-medium">{enrollment.full_name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">تلفن:</span>
                  <span className="font-medium">{enrollment.phone}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">آزمون:</span>
                  <span className="font-medium">{enrollment.tests.title}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">مبلغ:</span>
                  <span className="font-medium">
                    {enrollment.tests.price === 0 ? 'رایگان' : `${enrollment.tests.price.toLocaleString('fa-IR')} تومان`}
                  </span>
                </div>
                
                {enrollment.birth_year && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">سال تولد:</span>
                    <span className="font-medium">{enrollment.birth_year}</span>
                  </div>
                )}
                
                {enrollment.sex && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">جنسیت:</span>
                    <span className="font-medium">{enrollment.sex === 'male' ? 'مرد' : 'زن'}</span>
                  </div>
                )}
                
                {/* Debug info - show when data is missing */}
                {(!enrollment.birth_year || !enrollment.sex) && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <span className="text-sm">⚠️ اطلاعات تکمیلی ثبت نشده</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Badge 
                  variant={enrollment.payment_status === 'completed' ? 'default' : 'secondary'}
                >
                  {enrollment.payment_status === 'completed' ? 'پرداخت موفق' : 'در انتظار پرداخت'}
                </Badge>
                <Badge 
                  variant={enrollment.enrollment_status === 'ready' ? 'default' : 'secondary'}
                >
                  {enrollment.enrollment_status === 'ready' ? 'آماده شروع' : 'در حال آماده‌سازی'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Start Test Section - Only show when ready AND has birth_year and sex */}
          {isReady && enrollment.birth_year && enrollment.sex && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>شروع آزمون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-green-600 font-medium">
                    آزمون شما آماده است! می‌توانید الان شروع کنید.
                  </p>
                  <Button onClick={handleStartTest} size="lg" className="w-full">
                    شروع آزمون
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Birth Year and Sex Form - Show when data is missing, regardless of ready status */}
          {(!enrollment.birth_year || !enrollment.sex) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>تکمیل اطلاعات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  برای آماده‌سازی آزمون، لطفاً اطلاعات زیر را تکمیل کنید:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="age">سن</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="مثال: 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      disabled={isProcessing}
                      min="1"
                      max="150"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sex">جنسیت</Label>
                    <Select value={sex} onValueChange={setSex} disabled={isProcessing}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">مرد</SelectItem>
                        <SelectItem value="female">زن</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateEsanjTest} 
                  disabled={!age || !sex || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      در حال آماده‌سازی...
                    </>
                  ) : (
                    'آماده‌سازی آزمون'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Section for non-ready enrollments */}
          {!isReady && enrollment.enrollment_status !== 'ready' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>آماده‌سازی آزمون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    برای شروع آزمون، ابتدا باید اطلاعات تکمیلی را وارد کنید.
                  </p>
                  <Button onClick={handleStartTest} size="lg" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        در حال آماده‌سازی...
                      </>
                    ) : (
                      'آماده‌سازی آزمون'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Form Modal */}
          <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تکمیل اطلاعات آزمون</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="age">سن</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="مثال: 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="150"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sex">جنسیت</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">مرد</SelectItem>
                      <SelectItem value="female">زن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateEsanjTest}
                  disabled={isProcessing || !age || !sex}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      در حال آماده‌سازی...
                    </>
                  ) : (
                    'آماده‌سازی آزمون'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
};

const EnrollSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login } = useAuth();
  
  const courseSlug = searchParams.get('course');
  const testSlug = searchParams.get('test');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
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

  // Automatic email sending removed - emails handled manually from admin panel

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
    console.log('EnrollSuccess params:', { authority, enrollmentId, status, courseSlug, testSlug, email, phone });
    
    if (authority && enrollmentId) {
      // Check if this is a free course
      if (authority === 'FREE_COURSE') {
        handleFreeCourseSuccess();
      } else if (authority === 'MANUAL_PAYMENT') {
        // Check if this is a manual payment that's already approved
        handleManualPaymentSuccess();
      } else if (status === 'OK' || status === 'NOK') {
        // Zarinpal payment - verify regardless of status to get proper error
        verifyPayment();
      } else {
        // Try to verify anyway for Zarinpal payments without status
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
            smart_activation_telegram_link,
            telegram_only_access
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

  // Remove handleFreeTestSuccess since we're redirecting test enrollments

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
            smart_activation_telegram_link,
            telegram_only_access
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

  // If this is a test enrollment, show test enrollment success components
  if (testSlug) {
    return <TestEnrollmentSuccessView 
      testSlug={testSlug} 
      phone={phone} 
      enrollmentId={enrollmentId} 
      status={status} 
      authority={authority} 
    />
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
          className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-all duration-300 border-2 group relative ${
            smartActivated 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 cursor-default shadow-lg'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 border-green-300 dark:border-green-700 hover:shadow-xl cursor-pointer transform hover:scale-105'
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
                                
                                // Open the link in current tab and then show success page
                                window.location.href = replacePlaceholders(result.course.smart_activation_telegram_link, result.enrollment);
                              }
                            }
                          }}
                        >
                          {/* Smart Badge */}
                          <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                            smartActivated 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}>
                            {smartActivated ? (
                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                            ) : (
                              <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                            )}
                          </div>
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-transform flex-shrink-0 ${
                            smartActivated 
                              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
                              : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 group-hover:scale-110'
                          }`}>
                            {smartActivated ? (
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Send className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-base sm:text-lg flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 leading-tight">
                                <span className="break-words">
                                  {result.course?.telegram_only_access 
                                    ? `⚡ فعال سازی پشتیبانی و دسترسی به محتوای دوره ${smartActivated ? '(فعال شده)' : '(اجباری)'}`
                                    : `⚡ فعال‌سازی هوشمند ${smartActivated ? '(فعال شده)' : '(اجباری)'}`
                                  }
                                </span>
                                <Badge variant="secondary" className={`text-xs sm:text-sm px-2 sm:px-3 py-1 font-bold flex-shrink-0 self-start sm:self-auto ${
                                  smartActivated 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 animate-pulse'
                                }`}>
                                  {smartActivated ? '✅ فعال' : result.course?.telegram_only_access ? '⚡ ضروری' : '🔥 SMART'}
                                </Badge>
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-2 leading-relaxed">
                                {smartActivated 
                                  ? '✅ فعال‌سازی با موفقیت انجام شد'
                                  : result.course?.telegram_only_access 
                                    ? '👆 برای دسترسی به دوره و دریافت پشتیبانی کلیک کنید'
                                    : '👆 کلیک کنید تا به صورت خودکار فعال شود'
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

                {/* Telegram Only Access Message */}
                {result.course?.telegram_only_access && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 text-center">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 text-lg">
                      🔐 دسترسی به محتوای دوره
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-4">
                      <strong>دسترسی به محتوای این دوره فقط از طریق فعال‌سازی تلگرام امکان‌پذیر است.</strong>
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      لطفاً از طریق دکمه‌های فعال‌سازی هوشمند یا فعال‌سازی عادی تلگرام اقدام کنید.
                    </p>
                  </div>
                )}

                {/* Course Start Section - Only show if not telegram-only */}
                {!result.course?.telegram_only_access && (
                  <StartCourseSection 
                    enrollment={result.enrollment}
                    course={result.course}
                    onEnterCourse={handleEnterCourse}
                    userEmail={email || ''}
                    key={`course-section-${result.enrollment?.id}-${smartActivated}`}
                  />
                )}

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
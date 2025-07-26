import React, { useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, BarChart3, Settings, Webhook, UserCheck, Mail, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { messengerService } from '@/lib/messengerService';
import CourseManagement from '@/components/Admin/CourseManagement';
import { WebhookManagement } from '@/components/Admin/WebhookManagement';
import EmailSettings from '@/components/Admin/EmailSettings';
import PendingApprovalPayments from '@/components/Admin/PendingApprovalPayments';
import PendingPaymentsSummary from '@/components/Admin/PendingPaymentsSummary';
import PaginatedUsersTable from '@/components/Admin/PaginatedUsersTable';
import PaginatedEnrollmentsTable from '@/components/Admin/PaginatedEnrollmentsTable';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            خطایی در نمایش این بخش رخ داده است. لطفاً صفحه را بازخوانی کنید.
            {this.state.error && (
              <details className="mt-2 text-xs text-red-600">
                <summary>جزئیات خطا</summary>
                <pre className="mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    <span className="mr-2 text-muted-foreground">در حال بارگذاری...</span>
  </div>
);

const EnrollmentAdmin: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      // First check if user is authenticated
      if (isLoading) {
        return; // Still loading, wait
      }

      if (!isAuthenticated || !user) {
        console.log('User not authenticated');
        setCheckingRole(false);
        setHasAccess(false);
        return;
      }

      try {
        console.log('Checking user role for:', user);
        // Get detailed user info from messenger service
        const detailedUser = await messengerService.getUserByPhone(user.phone || '');
        
        if (!detailedUser) {
          console.log('User not found in messenger service');
          setHasAccess(false);
          setCheckingRole(false);
          return;
        }

        console.log('User details:', detailedUser);
        
        // Check if user has admin or enrollments_manager role
        const allowedRoles = ['admin', 'enrollments_manager'];
        const userRole = detailedUser.role || 'user';
        
        console.log('User role:', userRole, 'Is messenger admin:', detailedUser.is_messenger_admin);
        
        if (allowedRoles.includes(userRole) || detailedUser.is_messenger_admin) {
          console.log('User has access');
          setHasAccess(true);
        } else {
          console.log('User does not have required role');
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setHasAccess(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [isAuthenticated, user, isLoading, navigate]);

  // Show loading while checking authentication or if not authenticated
  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or user doesn't have required role
  if (!isAuthenticated || !user || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-800">دسترسی محدود</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-red-700">
                شما مجوز دسترسی به این بخش را ندارید. این صفحه فقط برای مدیران و مدیران ثبت‌نام‌ها قابل دسترسی است.
              </p>
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <p className="font-medium mb-1">نقش‌های مجاز:</p>
                <ul className="text-right space-y-1">
                  <li>• مدیر سیستم</li>
                  <li>• مدیر ثبت‌نام‌ها</li>
                </ul>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                variant="outline"
              >
                بازگشت به صفحه اصلی
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            پنل مدیریت آکادمی رفیعی
          </h1>
          <p className="text-muted-foreground">مدیریت دوره‌ها و ثبت‌نام‌ها</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="w-full flex flex-wrap justify-start bg-white/70 backdrop-blur-sm p-2 gap-2">
            <TabsTrigger value="courses" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">دوره‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">ثبت‌نام‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">کاربران</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Webhook className="h-4 w-4" />
              <span className="hidden sm:inline">وب‌هوک‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">آمار</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2 min-w-0 flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-200">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">ایمیل</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">تنظیمات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <CourseManagement />
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <PendingApprovalPayments />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <PaginatedEnrollmentsTable />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <PaginatedUsersTable />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <WebhookManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">تنظیمات ایمیل</h3>
              <p className="text-blue-700 mb-4">برای مدیریت کامل ایمیل‌ها و تنظیمات Gmail به صفحه اختصاصی مراجعه کنید.</p>
              <a 
                href="/enroll/admin/email" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>مدیریت ایمیل‌ها</span>
              </a>
            </div>
            <EmailSettings />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PendingPaymentsSummary />
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">کل فروش</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ۱۲۵,۰۰۰,۰۰۰ تومان
                  </div>
                  <p className="text-sm text-muted-foreground">در این ماه</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">تعداد ثبت‌نام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">۴۲</div>
                  <p className="text-sm text-muted-foreground">در این ماه</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">نرخ تبدیل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">۸۵٪</div>
                  <p className="text-sm text-muted-foreground">بازدید به خرید</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>آمار فروش هفتگی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    نمودار آمار در نسخه‌های بعدی اضافه خواهد شد
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>تنظیمات سیستم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">تنظیمات پرداخت</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• درگاه: زرین‌پال</li>
                      <li>• واحد پول: تومان</li>
                      <li>• تایید خودکار: فعال</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">تنظیمات WooCommerce</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• دامنه: auth.rafiei.co</li>
                      <li>• API: فعال</li>
                      <li>• سفارش خودکار: فعال</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">اطلاعات مهم</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• تمام پرداخت‌ها از طریق زرین‌پال امن هستند</li>
                    <li>• سفارشات به صورت خودکار در WooCommerce ثبت می‌شوند</li>
                    <li>• ایمیل‌های تایید به صورت خودکار ارسال می‌شوند</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnrollmentAdmin;
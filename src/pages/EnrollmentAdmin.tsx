import React, { useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { messengerService } from '@/lib/messengerService';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import CourseManagement from '@/components/Admin/CourseManagement';
import EmailSettings from '@/components/Admin/EmailSettings';
import PendingApprovalPayments from '@/components/Admin/PendingApprovalPayments';
import PaginatedUsersTable from '@/components/Admin/PaginatedUsersTable';
import PaginatedEnrollmentsTable from '@/components/Admin/PaginatedEnrollmentsTable';
import AnalyticsReports from '@/components/Admin/AnalyticsReports';
import AdminSettingsPanel from '@/components/Admin/AdminSettingsPanel';

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
  const [activeView, setActiveView] = useState<'dashboard' | 'courses' | 'enrollments' | 'users' | 'analytics' | 'settings'>('dashboard');

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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'courses':
        return <CourseManagement />;
      case 'enrollments':
        return (
          <div className="space-y-6">
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
          </div>
        );
      case 'users':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <PaginatedUsersTable />
            </Suspense>
          </ErrorBoundary>
        );
      case 'analytics':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <AnalyticsReports />
            </Suspense>
          </ErrorBoundary>
        );
      case 'settings':
        return <AdminSettingsPanel />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full bg-gray-50" dir="rtl">
        {/* Academy Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">ر</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">آکادمی رفیعی</h1>
              <p className="text-sm text-gray-500">پنل مدیریت</p>
            </div>
          </div>
          <SidebarTrigger className="ml-2" />
        </header>

        <div className="flex w-full">
          <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
          
          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto bg-white" style={{ direction: 'rtl' }}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                {renderContent()}
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EnrollmentAdmin;

import React, { useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield, Menu } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { messengerService } from '@/lib/messengerService';
import { supabase } from '@/integrations/supabase/client';

import Header from '@/components/Layout/Header';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';

// Lazy load admin components
const AdminDashboard = React.lazy(() => import('@/components/Admin/AdminDashboard'));
const CourseManagement = React.lazy(() => import('@/components/Admin/CourseManagement'));
const PendingApprovalPayments = React.lazy(() => import('@/components/Admin/PendingApprovalPayments'));
const PaginatedUsersTable = React.lazy(() => import('@/components/Admin/PaginatedUsersTable'));
const PaginatedEnrollmentsTable = React.lazy(() => import('@/components/Admin/PaginatedEnrollmentsTable'));
const AnalyticsReports = React.lazy(() => import('@/components/Admin/AnalyticsReports'));
const AdminSettingsPanel = React.lazy(() => import('@/components/Admin/AdminSettingsPanel'));
const EnrollmentCRM = React.lazy(() => import('@/components/Admin/EnrollmentCRM').then(module => ({ default: module.EnrollmentCRM })));
const LeadManagement = React.lazy(() => import('@/components/Admin/LeadManagement'));
const SimplifiedLeadManagement = React.lazy(() => import('@/components/Admin/SimplifiedLeadManagement'));
const SalesAgentLeads = React.lazy(() => import('@/components/Admin/SalesAgentLeads'));
const SalesAgentFinancials = React.lazy(() => import('@/components/Admin/SalesAgentFinancials'));
const SalesAgentPipeline = React.lazy(() => import('@/components/Admin/SalesAgentPipeline'));
const SalesAgentPipelineView = React.lazy(() => import('@/components/Admin/SalesAgentPipelineView'));
const PipelineBuilder = React.lazy(() => import('@/components/Admin/PipelineBuilder'));
const PipelineReports = React.lazy(() => import('@/components/Admin/PipelineReports'));
const AgentActivityDashboard = React.lazy(() => import('@/components/Admin/AgentActivityDashboard'));
const SalesDashboard = React.lazy(() => import('@/components/Admin/SalesDashboard'));
const TestManagement = React.lazy(() => import('@/components/Admin/TestManagement'));
const WebinarManagement = React.lazy(() => import('@/components/Admin/WebinarManagement'));
const RecruitmentManagement = React.lazy(() => import('@/components/Admin/RecruitmentManagement'));
const InternshipManagement = React.lazy(() => import('@/components/Admin/InternshipManagement'));
const DailyReportsTab = React.lazy(() => import('@/components/Admin/DailyReportsTab'));
const AccountingTabs = React.lazy(() => import('@/components/Admin/Accounting/AccountingTabs'));
const AccountingCommissions = React.lazy(() => import('@/components/Admin/Accounting/AccountingCommissions'));
const AccountingReports = React.lazy(() => import('@/components/Admin/Accounting/AccountingReports'));
const AccountingProducts = React.lazy(() => import('@/components/Admin/Accounting/AccountingProducts'));
const SalesAgentDashboard = React.lazy(() => import('@/components/Admin/Accounting/SalesAgentDashboard'));
const ConsultationManagement = React.lazy(() => import('@/components/Admin/ConsultationManagement'));

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
        <Alert className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-foreground">
            خطایی در نمایش این بخش رخ داده است. لطفاً صفحه را بازخوانی کنید.
            {this.state.error && (
              <details className="mt-2 text-xs text-muted-foreground">
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
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="mr-2 text-muted-foreground">در حال بارگذاری...</span>
  </div>
);

const EnrollmentAdmin: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'courses' | 'enrollments' | 'sales' | 'leads' | 'users' | 'analytics' | 'settings' | 'crm' | 'recruitment' | 'internships' | 'tests' | 'webinars' | 'daily-reports' | 'accounting' | 'pipeline' | 'pipeline-builder' | 'agent-financials' | 'consultations'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMessengerAdmin, setIsMessengerAdmin] = useState(false);
  const [isSalesAgent, setIsSalesAgent] = useState(false);
  const [useFullLeadsSystem, setUseFullLeadsSystem] = useState(false);

  // Fetch admin settings for leads system and listen for changes
  useEffect(() => {
    const fetchLeadsSystemSetting = async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('use_full_leads_system')
        .eq('id', 1)
        .single();
      
      console.log('Fetched leads system setting:', data, error);
      if (data && !error) {
        setUseFullLeadsSystem(data.use_full_leads_system === true);
      }
    };
    fetchLeadsSystemSetting();

    // Subscribe to changes in admin_settings
    const channel = supabase
      .channel('admin_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'admin_settings', filter: 'id=eq.1' },
        (payload) => {
          console.log('Admin settings changed:', payload);
          if (payload.new && 'use_full_leads_system' in payload.new) {
            setUseFullLeadsSystem(payload.new.use_full_leads_system === true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        
        // Check if user has admin, enrollments_manager role, sales_manager, or is sales agent
        const allowedRoles = ['admin', 'enrollments_manager', 'sales_manager', 'sales_agent'];
        const userRole = detailedUser.role || 'user';
        
        console.log('User role:', userRole, 'Is messenger admin:', detailedUser.is_messenger_admin);
        
        // Check if user is a sales agent
        const { data: salesAgent, error } = await supabase
          .from('sales_agents')
          .select('*')
          .eq('user_id', detailedUser.id)
          .eq('is_active', true)
          .single();

        const isSalesAgent = !!salesAgent && !error;
        
        if (allowedRoles.includes(userRole) || detailedUser.is_messenger_admin || isSalesAgent) {
          console.log('User has access');
          setHasAccess(true);
          setUserRole(userRole);
          setIsMessengerAdmin(detailedUser.is_messenger_admin || false);
          setIsSalesAgent(isSalesAgent);
          
          // Set default view based on user role
          if (userRole === 'enrollments_manager' && !detailedUser.is_messenger_admin) {
            setActiveView('enrollments'); // Show enrollments by default for enrollment managers
          } else if (userRole === 'sales_manager' && !detailedUser.is_messenger_admin) {
            setActiveView('sales'); // Show sales dashboard by default for sales managers
          } else if (isSalesAgent && !detailedUser.is_messenger_admin) {
            setActiveView('leads'); // Show leads by default for sales agents
          }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or user doesn't have required role
  if (!isAuthenticated || !user || !hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card className="border-destructive/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-foreground">دسترسی محدود</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                شما مجوز دسترسی به این بخش را ندارید. این صفحه فقط برای مدیران، مدیران ثبت‌نام‌ها و نمایندگان فروش قابل دسترسی است.
              </p>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p className="font-medium mb-1">نقش‌های مجاز:</p>
                <ul className="text-right space-y-1">
                  <li>• مدیر سیستم</li>
                  <li>• مدیر ثبت‌نام‌ها</li>
                  <li>• نماینده فروش</li>
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

  const handleViewChange = (view: string) => {
    setActiveView(view as typeof activeView);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        // Don't show dashboard summary for enrollment managers or sales agents who are not messenger admins
        if ((userRole === 'enrollments_manager' || isSalesAgent) && !isMessengerAdmin) {
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
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminDashboard />
            </Suspense>
          </ErrorBoundary>
        );
      case 'courses':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <CourseManagement />
            </Suspense>
          </ErrorBoundary>
        );
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
      case 'sales':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <SalesDashboard 
                onViewChange={(view) => setActiveView(view as typeof activeView)}
                isSalesAgent={isSalesAgent}
                isAdmin={isMessengerAdmin}
                isSalesManager={userRole === 'sales_manager'}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case 'leads':
        // Sales agents see simplified lead view with just their leads
        if (isSalesAgent && !isMessengerAdmin) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <SalesAgentLeads />
              </Suspense>
            </ErrorBoundary>
          );
        }
        // Admins and sales managers see either full or simplified lead management
        if (useFullLeadsSystem) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <LeadManagement />
              </Suspense>
            </ErrorBoundary>
          );
        }
        return (
          <div className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <AgentActivityDashboard />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <SimplifiedLeadManagement />
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
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminSettingsPanel />
            </Suspense>
          </ErrorBoundary>
        );
      case 'crm':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <EnrollmentCRM />
            </Suspense>
          </ErrorBoundary>
        );
      case 'recruitment':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <RecruitmentManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'internships':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <InternshipManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'tests':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <TestManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'accounting':
        // Sales agents (not admins/managers) see only their own financials
        if (isSalesAgent && !isMessengerAdmin && userRole !== 'sales_manager') {
          return (
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <SalesAgentFinancials />
              </Suspense>
            </ErrorBoundary>
          );
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <AccountingTabs />
            </Suspense>
          </ErrorBoundary>
        );
      case 'pipeline':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <SalesAgentPipelineView />
            </Suspense>
          </ErrorBoundary>
        );
      case 'pipeline-builder':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <PipelineBuilder />
            </Suspense>
          </ErrorBoundary>
        );
      case 'agent-financials':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <SalesAgentFinancials />
            </Suspense>
          </ErrorBoundary>
        );
      case 'webinars':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <WebinarManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'daily-reports':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <DailyReportsTab />
            </Suspense>
          </ErrorBoundary>
        );
      case 'consultations':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ConsultationManagement />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        // Don't show dashboard summary for enrollment managers or sales agents who are not messenger admins
        if ((userRole === 'enrollments_manager' || isSalesAgent) && !isMessengerAdmin) {
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
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminDashboard />
            </Suspense>
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col" dir="rtl">
      {/* Academy Main Header */}
      <Header />
      
      {/* Mobile Menu Button Overlay */}
      <div className="lg:hidden fixed top-0 left-0 z-[10001] h-16 w-full pointer-events-none">
        <div className="flex items-center h-full px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="pointer-events-auto rounded-full hover:bg-accent"
          >
            <Menu size={20} className="text-foreground" />
          </Button>
        </div>
      </div>
      
      <div className="flex w-full flex-1 h-full pt-16">
        <AdminSidebar 
          activeView={activeView} 
          onViewChange={handleViewChange}
          isOpen={isMobileSidebarOpen}
          onToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          userRole={userRole}
          isMessengerAdmin={isMessengerAdmin}
          isSalesAgent={isSalesAgent}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-background h-full" style={{ direction: 'rtl' }}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default EnrollmentAdmin;

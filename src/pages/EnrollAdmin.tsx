import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Search, Filter, Clock, CreditCard, FileText, User, Mail, Phone, Calendar, Plus, Edit, BookOpen, DollarSign, Users, ExternalLink, BarChart3, Play, Webhook, TrendingUp, Upload, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import DiscountManagement from '@/components/Admin/DiscountManagement';
import AnalyticsReports from '@/components/Admin/AnalyticsReports';
import CourseManagement from '@/components/Admin/CourseManagement';
import { WebhookManagement } from '@/components/Admin/WebhookManagement';
import { 
  sendEnrollmentManualPaymentApproved, 
  sendEnrollmentManualPaymentRejected,
  sendEnrollmentManualPaymentSubmitted
} from '@/lib/enrollmentWebhookService';
import { DataImportSection } from '@/components/admin/DataImportSection';
import UserManagement from '@/components/Admin/UserManagement';
import { UserCRM } from '@/components/Admin/UserProfile/UserCRM';
import ShortLinksManager from '@/components/admin/ShortLinksManager';

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  is_active: boolean;
  redirect_url: string | null;
  spotplayer_course_id: string | null;
  is_spotplayer_enabled: boolean;
  create_test_license: boolean;
  woocommerce_create_access: boolean;
  support_link: string | null;
  telegram_channel_link: string | null;
  gifts_link: string | null;
  enable_course_access: boolean;
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_amount: number;
  payment_status: string;
  payment_method: string;
  manual_payment_status: string | null;
  receipt_url: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  chat_user_id: number | null;
  zarinpal_ref_id?: string | null;
  zarinpal_authority?: string | null;
  woocommerce_order_id?: number | null;
  courses: {
    title: string;
    slug: string;
  };
}

const EnrollAdmin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showEnrollmentDetails, setShowEnrollmentDetails] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'enrollments' | 'discounts' | 'courses' | 'webhooks' | 'reports' | 'data-import' | 'users' | 'shortlinks'>('dashboard');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalEnrollments: 0,
    totalSales: 0,
    todayEnrollments: 0,
    enrollmentsByCourse: [] as { title: string; enrollments_count: number }[],
    recentEnrollments: [] as any[]
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    // Check for tab parameter and set active view
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'enrollments', 'discounts', 'courses', 'webhooks', 'reports', 'data-import', 'users', 'shortlinks'].includes(tab)) {
      setActiveView(tab as 'dashboard' | 'enrollments' | 'discounts' | 'courses' | 'webhooks' | 'reports' | 'data-import' | 'users' | 'shortlinks');
    }
    
    Promise.all([fetchEnrollments(), fetchCourses(), fetchAnalytics()]);
  }, [searchParams]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Total Users
      const { count: totalUsers, error: usersError } = await supabase
        .from('chat_users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Total Enrollments
      const { count: totalEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      if (enrollmentsError) throw enrollmentsError;

      // Total Sales (successful transactions)
      const { data: salesData, error: salesError } = await supabase
        .from('enrollments')
        .select('payment_amount')
        .in('payment_status', ['completed', 'success']);

      if (salesError) throw salesError;

      const totalSales = salesData?.reduce((sum, enrollment) => sum + enrollment.payment_amount, 0) || 0;

      // Today's Enrollments
      const today = new Date().toISOString().split('T')[0];
      const { count: todayEnrollments, error: todayError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      if (todayError) throw todayError;

      // Enrollments by Course - Get ALL records
      const { data: enrollmentsByCourse, error: courseEnrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses!inner(title)
        `);

      if (courseEnrollmentsError) throw courseEnrollmentsError;

      // Group by course and count
      const courseStats = enrollmentsByCourse?.reduce((acc: any, enrollment: any) => {
        const courseTitle = enrollment.courses?.title || 'نامشخص';
        acc[courseTitle] = (acc[courseTitle] || 0) + 1;
        return acc;
      }, {}) || {};

      const enrollmentsByCourseData = Object.entries(courseStats)
        .map(([title, count]) => ({ title, enrollments_count: count as number }))
        .sort((a, b) => b.enrollments_count - a.enrollments_count);

      // Recent Enrollments (latest 50)
      const { data: recentEnrollments, error: recentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          email,
          created_at,
          courses!inner(title)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (recentError) throw recentError;

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalEnrollments: totalEnrollments || 0,
        totalSales,
        todayEnrollments: todayEnrollments || 0,
        enrollmentsByCourse: enrollmentsByCourseData,
        recentEnrollments: recentEnrollments || []
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری آمار",
        variant: "destructive"
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری لیست دوره‌ها",
        variant: "destructive"
      });
    }
  };

  const fetchEnrollments = async () => {
    try {
      // Only fetch basic course info for search functionality
      const coursesResult = await supabase
        .from('courses')
        .select(`
          id, title, description, slug, price, is_active, redirect_url, 
          spotplayer_course_id, is_spotplayer_enabled, create_test_license, 
          woocommerce_create_access, support_link, telegram_channel_link, 
          gifts_link, enable_course_access, created_at
        `);

      if (coursesResult.error) throw coursesResult.error;
      setCourses(coursesResult.data || []);
      
      // Don't fetch enrollments initially - only search when user types
      setEnrollments([]);
      setFilteredEnrollments([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داده‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getEnrolledUsersCount = (courseId: string) => {
    return enrollments.filter(e => e.course_id === courseId && e.payment_status === 'completed').length;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 ml-1" />در انتظار</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 ml-1" />تایید شده</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 ml-1" />رد شده</Badge>;
      default:
        return null; // Don't show badge for null/unknown manual payment status
    }
  };

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 ml-1" />پرداخت شده</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 ml-1" />در انتظار پرداخت</Badge>;
      case 'failed':
      case 'error':
      case 'cancelled_payment':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" />ناموفق</Badge>;
      default:
        return <Badge variant="outline">{status || 'در انتظار'}</Badge>;
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);

  const [searchLoading, setSearchLoading] = useState(false);

  // Real-time search function
  const searchEnrollments = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredEnrollments([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Search in the database with ilike for case-insensitive partial matching
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(100); // Limit results for performance

      if (enrollmentsError) throw enrollmentsError;

      // Get course data for the found enrollments
      const courseIds = [...new Set(enrollmentsData?.map(e => e.course_id) || [])];
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, slug')
        .in('id', courseIds);

      if (coursesError) throw coursesError;

      // Create courses lookup map
      const coursesMap = new Map(
        (coursesData || []).map(course => [course.id, course])
      );

      // Join enrollments with course data
      const enrollmentsWithCourses = (enrollmentsData || []).map(enrollment => ({
        ...enrollment,
        courses: coursesMap.get(enrollment.course_id) || { title: 'دوره نامشخص', slug: '' }
      }));

      // Also search by course title
      const { data: courseSearchData, error: courseSearchError } = await supabase
        .from('courses')
        .select('id, title, slug')
        .ilike('title', `%${searchQuery}%`);

      if (!courseSearchError && courseSearchData?.length) {
        const courseIds = courseSearchData.map(c => c.id);
        const { data: enrollmentsByCourse, error: enrollmentsByCourseError } = await supabase
          .from('enrollments')
          .select('*')
          .in('course_id', courseIds)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!enrollmentsByCourseError && enrollmentsByCourse?.length) {
          const enrollmentsByCourseWithCourses = enrollmentsByCourse.map(enrollment => ({
            ...enrollment,
            courses: coursesMap.get(enrollment.course_id) || 
                     courseSearchData.find(c => c.id === enrollment.course_id) || 
                     { title: 'دوره نامشخص', slug: '' }
          }));

          // Merge results and remove duplicates
          const allResults = [...enrollmentsWithCourses, ...enrollmentsByCourseWithCourses];
          const uniqueResults = allResults.filter((enrollment, index, self) => 
            index === self.findIndex(e => e.id === enrollment.id)
          );

          setFilteredEnrollments(uniqueResults);
        } else {
          setFilteredEnrollments(enrollmentsWithCourses);
        }
      } else {
        setFilteredEnrollments(enrollmentsWithCourses);
      }

    } catch (error) {
      console.error('Error searching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در جستجوی ثبت‌نام‌ها",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchEnrollments(searchTerm);
    }, 300); // 300ms delay for debouncing

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleViewDetails = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setAdminNotes(''); // Reset admin notes when opening details
    setShowEnrollmentDetails(true);
  };

  const handleEditCourse = (course: Course) => {
    window.location.href = `/enroll/admin/course/${course.id}`;
  };

  const handleCreateCourse = () => {
    window.location.href = '/enroll/admin/course/new';
  };

  const handleOpenUserDetails = async (enrollment: Enrollment) => {
    try {
      // Fetch user details from chat_users table
      const { data: userData, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', enrollment.phone)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Set user data with enrollment info as fallback
      const userDetails = userData || {
        id: null,
        name: enrollment.full_name,
        phone: enrollment.phone,
        email: enrollment.email,
        is_approved: false,
        created_at: enrollment.created_at
      };

      setSelectedUser(userDetails);
      setShowUserDetails(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات کاربر",
        variant: "destructive"
      });
    }
  };


  const handleApprove = async () => {
    if (!selectedEnrollment) return;

    setProcessing(true);
    try {
      // Update enrollment status
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'approved',
          payment_status: 'completed',
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedEnrollment.id);

      if (updateError) throw updateError;

      // Get course data for webhook
      const course = courses.find(c => c.id === selectedEnrollment.course_id);
      const user = {
        name: selectedEnrollment.full_name,
        email: selectedEnrollment.email,
        phone: selectedEnrollment.phone
      };

      // Send webhook for manual payment approval
      try {
        await sendEnrollmentManualPaymentApproved(selectedEnrollment, user, course);
      } catch (webhookError) {
        console.warn('Webhook call failed:', webhookError);
      }

      // Call WooCommerce API (similar to successful Zarinpal payment)
      try {
        const { error: wooError } = await supabase.functions.invoke('zarinpal-verify', {
          body: {
            authority: 'MANUAL_PAYMENT',
            enrollmentId: selectedEnrollment.id,
            manualApproval: true
          }
        });

        if (wooError) {
          console.warn('WooCommerce API call failed:', wooError);
        }
      } catch (wooError) {
        console.warn('WooCommerce API call failed:', wooError);
      }

      toast({
        title: "✅ تایید شد",
        description: "پرداخت تایید شد. کاربر به صفحه موفقیت منتقل می‌شود",
      });

      // Refresh the list and update current enrollment
      await fetchEnrollments();
      
      // Update the selected enrollment to show new status
      const updatedEnrollment = {
        ...selectedEnrollment,
        manual_payment_status: 'approved',
        payment_status: 'completed',
        approved_by: 'Admin',
        approved_at: new Date().toISOString()
      };
      setSelectedEnrollment(updatedEnrollment);

    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "خطا",
        description: "خطا در تایید پرداخت",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEnrollment) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'rejected',
          admin_notes: adminNotes || null,
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedEnrollment.id);

      if (error) throw error;

      // Get course data for webhook
      const course = courses.find(c => c.id === selectedEnrollment.course_id);
      const user = {
        name: selectedEnrollment.full_name,
        email: selectedEnrollment.email,
        phone: selectedEnrollment.phone
      };

      // Send webhook for manual payment rejection
      try {
        await sendEnrollmentManualPaymentRejected(selectedEnrollment, user, course);
      } catch (webhookError) {
        console.warn('Webhook call failed:', webhookError);
      }

      toast({
        title: "❌ رد شد",
        description: "پرداخت رد شد. کاربر به صفحه رد منتقل می‌شود",
      });

      await fetchEnrollments();
      
      // Update the selected enrollment to show new status
      const updatedEnrollment = {
        ...selectedEnrollment,
        manual_payment_status: 'rejected',
        admin_notes: adminNotes || null,
        approved_by: 'Admin',
        approved_at: new Date().toISOString()
      };
      setSelectedEnrollment(updatedEnrollment);
      setAdminNotes(''); // Clear admin notes after successful rejection

    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "خطا",
        description: "خطا در رد کردن پرداخت",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {showEnrollmentDetails && selectedEnrollment ? (
        // Full Page Enrollment Details View
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-10 bg-background border-b">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">جزئیات ثبت‌نام</h1>
                  <p className="text-muted-foreground">بررسی و تایید پرداخت دستی</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenUserDetails(selectedEnrollment)}
                  >
                    <User className="h-4 w-4 ml-2" />
                    جزئیات کاربر
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEnrollmentDetails(false)}
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    بستن
                  </Button>
                </div>
              </div>
          </div>
          
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام و نام خانوادگی</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEnrollment.full_name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>ایمیل</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedEnrollment.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>شماره تلفن</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEnrollment.phone}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>تاریخ ثبت‌نام</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedEnrollment.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="space-y-2">
                <Label>دوره انتخابی</Label>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedEnrollment.courses?.title}</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(selectedEnrollment.payment_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {selectedEnrollment.receipt_url && (
                <div className="space-y-2">
                  <Label>رسید پرداخت</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={selectedEnrollment.receipt_url} 
                      alt="Receipt" 
                      className="w-full h-auto max-h-96 object-contain bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">جزئیات پرداخت</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وضعیت پرداخت</Label>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(selectedEnrollment.payment_status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>روش پرداخت</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm">{selectedEnrollment.payment_method || 'نامشخص'}</span>
                    </div>
                  </div>
                  
                  {selectedEnrollment.zarinpal_ref_id && (
                    <div className="space-y-2">
                      <Label>کد رهگیری زرین‌پال</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-sm font-mono">{selectedEnrollment.zarinpal_ref_id}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedEnrollment.zarinpal_authority && (
                    <div className="space-y-2">
                      <Label>Authority زرین‌پال</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-sm font-mono">{selectedEnrollment.zarinpal_authority}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedEnrollment.woocommerce_order_id && (
                    <div className="space-y-2">
                      <Label>شناسه سفارش ووکامرس</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-sm font-mono">{selectedEnrollment.woocommerce_order_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CRM Notes */}
              {selectedEnrollment.chat_user_id && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">مدیریت CRM کاربر</Label>
                  <UserCRM userId={selectedEnrollment.chat_user_id} />
                </div>
              )}

              {/* Current Status */}
              <div className="flex items-center gap-4">
                <Label>وضعیت بررسی فعلی:</Label>
                {getStatusBadge(selectedEnrollment.manual_payment_status)}
              </div>

              {/* Admin Notes for Rejection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>یادداشت مدیر (در صورت رد درخواست)</Label>
                  <Textarea 
                    placeholder="دلیل رد درخواست را بنویسید..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    این یادداشت در صورت رد درخواست به کاربر نمایش داده خواهد شد
                  </p>
                </div>
              </div>

              {/* Action Buttons - Always Available */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className={`flex-1 ${
                    selectedEnrollment.manual_payment_status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  {selectedEnrollment.manual_payment_status === 'approved' ? 'تایید شده ✓' : 'تایید پرداخت'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className={`flex-1 ${
                    selectedEnrollment.manual_payment_status === 'rejected' 
                      ? 'bg-red-700 hover:bg-red-800' 
                      : ''
                  }`}
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  {selectedEnrollment.manual_payment_status === 'rejected' ? 'رد شده ✗' : 'رد پرداخت'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Main Admin Panel View
        <div className="flex min-h-screen w-full">
          {/* Desktop Sidebar - Always visible */}
          <div className="hidden lg:block">
            <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b lg:hidden">
              <div className="flex items-center justify-start px-4 py-3">
                <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
              </div>
            </div>
              
              <div className="container mx-auto px-4 md:px-6 py-6 max-w-none">
              
              {/* Dashboard View */}
              {activeView === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">داشبورد آمار و تحلیل</h1>
                      <p className="text-muted-foreground mt-2">مرور کلی از وضعیت سیستم و آمار فروش</p>
                    </div>
                    <Button 
                      onClick={() => {
                        Promise.all([fetchEnrollments(), fetchCourses(), fetchAnalytics()]);
                        toast({
                          title: "به‌روزرسانی",
                          description: "داده‌ها به‌روزرسانی شدند",
                        });
                      }} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={analyticsLoading}
                    >
                      <Activity className="h-4 w-4" />
                      به‌روزرسانی
                    </Button>
                  </div>

                  {analyticsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">در حال بارگذاری آمار...</p>
                    </div>
                  )}

                  {/* 📊 1. SUMMARY CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">کل کاربران</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.totalUsers.toLocaleString('fa-IR')}</p>
                          </div>
                          <User className="h-12 w-12 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">کل ثبت‌نام‌ها</p>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{analytics.totalEnrollments.toLocaleString('fa-IR')}</p>
                          </div>
                          <BookOpen className="h-12 w-12 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">کل فروش</p>
                            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                              {new Intl.NumberFormat('fa-IR').format(analytics.totalSales)} ت
                            </p>
                          </div>
                          <CreditCard className="h-12 w-12 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">ثبت‌نام امروز</p>
                            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{analytics.todayEnrollments.toLocaleString('fa-IR')}</p>
                          </div>
                          <Clock className="h-12 w-12 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 📈 2. ENROLLMENTS BY COURSE */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-6 w-6" />
                        ثبت‌نام‌ها بر اساس دوره
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.enrollmentsByCourse.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">هیچ داده‌ای یافت نشد</p>
                      ) : (
                        <div className="space-y-4">
                          {analytics.enrollmentsByCourse.map((course, index) => (
                            <div key={course.title} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                                  index === 0 ? 'from-blue-500 to-purple-500' :
                                  index === 1 ? 'from-green-500 to-blue-500' :
                                  index === 2 ? 'from-orange-500 to-red-500' :
                                  'from-gray-400 to-gray-600'
                                }`}></div>
                                <span className="font-medium">{course.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-primary">{course.enrollments_count.toLocaleString('fa-IR')}</span>
                                <span className="text-sm text-muted-foreground">ثبت‌نام</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 🕵️‍♂️ 3. RECENT ENROLLMENTS */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        آخرین ثبت‌نام‌ها (۵۰ مورد اخیر)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.recentEnrollments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">هیچ ثبت‌نامی یافت نشد</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>شناسه</TableHead>
                                <TableHead>نام کاربر</TableHead>
                                <TableHead>ایمیل</TableHead>
                                <TableHead>دوره</TableHead>
                                <TableHead>تاریخ ثبت‌نام</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {analytics.recentEnrollments.map((enrollment) => (
                                <TableRow key={enrollment.id}>
                                  <TableCell className="font-mono text-xs">
                                    {enrollment.id.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {enrollment.full_name}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {enrollment.email}
                                  </TableCell>
                                  <TableCell>
                                    {enrollment.courses?.title || 'نامشخص'}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {new Intl.DateTimeFormat('fa-IR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }).format(new Date(enrollment.created_at))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Enrollments View */}
              {activeView === 'enrollments' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">مدیریت ثبت‌نام‌ها</h1>
                    <p className="text-muted-foreground mt-2">جستجو در بین همه ثبت‌نام‌ها</p>
                  </div>

                  {/* Search Box */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="جستجو بر اساس نام، ایمیل، شماره تلفن یا دوره..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>

                    {/* Search Results */}
                    {searchLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">در حال جستجو...</p>
                      </div>
                    ) : searchTerm ? (
                      filteredEnrollments.length === 0 ? (
                        <div className="text-center py-12">
                          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium text-muted-foreground">
                            هیچ ثبت‌نامی یافت نشد
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            جستجوی جدیدی انجام دهید
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {filteredEnrollments.length} ثبت‌نام یافت شد
                          </p>
                          {filteredEnrollments.map((enrollment) => (
                            <Card key={enrollment.id} className="p-4 hover:shadow-md transition-shadow">
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-base">{enrollment.full_name}</h4>
                                    <p className="text-sm text-muted-foreground break-all">{enrollment.email}</p>
                                    <p className="text-sm text-muted-foreground">{enrollment.phone}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-1 sm:space-y-1 sm:text-right">
                                    {getPaymentStatusBadge(enrollment.payment_status)}
                                    {getStatusBadge(enrollment.manual_payment_status)}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">دوره:</span>
                                    <p className="font-medium break-words">{enrollment.courses?.title || 'نامشخص'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">مبلغ:</span>
                                    <p className="font-mono">{formatPrice(enrollment.payment_amount)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">تاریخ:</span>
                                    <p className="text-xs sm:text-sm">{formatDate(enrollment.created_at)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">شناسه:</span>
                                    <p className="font-mono text-xs">{enrollment.id.slice(0, 8)}...</p>
                                  </div>
                                </div>
                                
                                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 pt-2 border-t`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => window.open(`/enroll/details?id=${enrollment.id}`, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 ml-1" />
                                    جزئیات کامل
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleViewDetails(enrollment)}
                                  >
                                    <Eye className="h-4 w-4 ml-1" />
                                    مشاهده سریع
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                      if (enrollment.chat_user_id) {
                                        navigate(`/enroll/admin/users/${enrollment.chat_user_id}`);
                                      } else {
                                        handleOpenUserDetails(enrollment);
                                      }
                                    }}
                                  >
                                    <User className="h-4 w-4 ml-1" />
                                    پروفایل کاربر
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">جستجوی ثبت‌نام‌ها</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          از کادر جستجو برای یافتن ثبت‌نام‌ها استفاده کنید
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          می‌توانید بر اساس نام، ایمیل، شماره تلفن یا نام دوره جستجو کنید
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Discount Management View */}
              {activeView === 'discounts' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">مدیریت کدهای تخفیف</h1>
                    <p className="text-muted-foreground mt-2">ایجاد و مدیریت کدهای تخفیف برای دوره‌ها</p>
                  </div>
                  <DiscountManagement />
                </div>
              )}

              {/* Courses View */}
              {activeView === 'courses' && (
                <div className="space-y-6">
                  <CourseManagement />
                </div>
              )}

              {/* Reports View */}
              {activeView === 'reports' && (
                <div className="space-y-6">
                  <AnalyticsReports />
                </div>
              )}

              {/* Data Import View */}
              {activeView === 'data-import' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">وارد کردن داده</h1>
                    <p className="text-muted-foreground mt-2">وارد کردن کاربران از فایل CSV و اختصاص دسترسی به دوره‌ها</p>
                  </div>
                  <DataImportSection />
                </div>
              )}

              {/* Webhooks View */}
              {activeView === 'webhooks' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">مدیریت وب‌هوک‌ها</h1>
                    <p className="text-muted-foreground mt-2">مدیریت و نظارت بر وب‌هوک‌های سیستم</p>
                  </div>
                  <WebhookManagement />
                </div>
              )}

              {/* Users View */}
              {activeView === 'users' && (
                <div className="space-y-6">
                  <UserManagement />
                </div>
              )}

              {/* Short Links View */}
              {activeView === 'shortlinks' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">مدیریت لینک‌های کوتاه</h1>
                    <p className="text-muted-foreground mt-2">ایجاد و مدیریت لینک‌های کوتاه برای l.rafiei.co</p>
                  </div>
                  <ShortLinksManager />
                </div>
              )}
              </div>
            </main>
          </div>
        )}

        {/* User Details Full Screen Popup */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 z-50 min-h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background border-b">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">جزئیات کاربر</h1>
                  <p className="text-muted-foreground">اطلاعات کامل کاربر</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowUserDetails(false)}
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  بستن
                </Button>
              </div>
            </div>
            
            <div className="container mx-auto px-4 py-6 max-w-6xl h-full overflow-y-auto">
              <div className="space-y-6">
                {/* Basic User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      اطلاعات کاربر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نام</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedUser.name || 'نامشخص'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>شماره تلفن</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedUser.phone}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ایمیل</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedUser.email || 'نامشخص'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>تاریخ عضویت</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(selectedUser.created_at)}</span>
                        </div>
                      </div>

                      {selectedUser.username && (
                        <div className="space-y-2">
                          <Label>نام کاربری</Label>
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedUser.username}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>وضعیت تایید</Label>
                        <div className="flex items-center gap-2">
                          {selectedUser.is_approved ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              تایید شده
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              <XCircle className="h-3 w-3 ml-1" />
                              تایید نشده
                            </Badge>
                          )}
                        </div>
                      </div>

                      {selectedUser.bedoun_marz !== undefined && (
                        <div className="space-y-2">
                          <Label>عضویت بدون مرز</Label>
                          <div className="flex items-center gap-2">
                            {selectedUser.bedoun_marz ? (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                <CheckCircle className="h-3 w-3 ml-1" />
                                عضو بدون مرز
                              </Badge>
                            ) : (
                              <Badge variant="outline">عضو عادی</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedUser.last_seen && (
                        <div className="space-y-2">
                          <Label>آخرین بازدید</Label>
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(selectedUser.last_seen)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bio Section */}
                {selectedUser.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>بیوگرافی</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{selectedUser.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* CRM Section for registered users */}
                {selectedUser.id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        مدیریت CRM
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserCRM userId={selectedUser.id} />
                    </CardContent>
                  </Card>
                )}

                {/* Additional User Details */}
                {(selectedUser.is_messenger_admin || selectedUser.is_support_agent) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>نقش‌های سیستمی</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.is_messenger_admin && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            مدیر پیام‌رسان
                          </Badge>
                        )}
                        {selectedUser.is_support_agent && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            نماینده پشتیبانی
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
    </MainLayout>
  );
};

export default EnrollAdmin;

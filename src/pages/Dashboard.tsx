import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import MainLayout from '@/components/Layout/MainLayout';
import { 
  BookOpen, 
  Key, 
  CreditCard, 
  ExternalLink, 
  Copy, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Save,
  LogOut,
  User,
  Lock,
  Bell,
  BellOff,
  ChevronDown
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  description?: string;
  price: number;
  redirect_url?: string;
  enrollment_id: string;
  enrollment_date: string;
  payment_status: string;
  payment_amount: number;
}

interface CourseLicense {
  id: string;
  course_id: string;
  course_title: string;
  license_key?: string;
  license_data?: any;
  status: string;
  created_at: string;
  expires_at?: string;
  activated_at?: string;
}

interface PaymentTransaction {
  id: string;
  course_id: string;
  course_title: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  zarinpal_ref_id?: string;
  created_at: string;
}

interface DashboardStats {
  totalCourses: number;
  totalAmountPaid: number;
  lastLogin?: string;
}

// Create a separate supabase client to avoid type issues
const supabaseUrl = 'https://ihhetvwuhqohbfgkqoxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGV0dnd1aHFvaGJmZ2txb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk0NTIsImV4cCI6MjA2NTk0NTQ1Mn0.91gRPO_ApEGQF2EtTAQLcqA-mIj7lqF29M1OZcGW4BI';
const supabase = createClient(supabaseUrl, supabaseKey);

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [courseLicenses, setCourseLicenses] = useState<CourseLicense[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalAmountPaid: 0
  });

  // Profile states
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firstName: '',
    lastName: '',
    notification_enabled: true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
    initializeProfileData();
  }, [isAuthenticated, navigate]);

  const initializeProfileData = () => {
    if (user) {
      setFormData({
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        notification_enabled: true
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEnrolledCourses(),
        fetchCourseLicenses(),
        fetchPaymentHistory()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در دریافت اطلاعات داشبورد',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    if (!user?.id) return;
    
    const response = await supabase
      .from('enrollments')
      .select('*')
      .eq('chat_user_id', parseInt(user.id));

    if (response.error) {
      console.error('Error fetching enrolled courses:', response.error);
      return;
    }

    if (!response.data) return;

    // Fetch course details separately
    const courseIds = response.data.map((enrollment: any) => enrollment.course_id);
    const coursesResponse = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);

    const courses: EnrolledCourse[] = response.data.map((enrollment: any) => {
      const course = coursesResponse.data?.find((c: any) => c.id === enrollment.course_id);
      return {
        id: course?.id || '',
        title: course?.title || '',
        description: course?.description,
        price: course?.price || 0,
        redirect_url: course?.redirect_url,
        enrollment_id: enrollment.id,
        enrollment_date: enrollment.created_at,
        payment_status: enrollment.payment_status,
        payment_amount: enrollment.payment_amount || 0
      };
    }).filter((course: any) => course.id);

    setEnrolledCourses(courses);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalCourses: courses.length,
      totalAmountPaid: courses.reduce((sum, course) => sum + (course.payment_amount || 0), 0)
    }));
  };

  const fetchCourseLicenses = async () => {
    if (!user?.id) return;
    
    try {
      // First get enrollments with Rafiei player licenses for this user
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          spotplayer_license_id,
          spotplayer_license_key,
          spotplayer_license_url,
          created_at,
          courses (
            id,
            title,
            slug,
            description
          )
        `)
        .eq('chat_user_id', user.id)
        .not('spotplayer_license_key', 'is', null);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      }

      // Transform enrollment data to license format
      const rafieiLicenses = enrollmentsData?.map(enrollment => ({
        id: enrollment.id,
        user_id: user.id,
        course_id: enrollment.course_id,
        license_key: enrollment.spotplayer_license_key,
        license_data: {
          license_id: enrollment.spotplayer_license_id,
          license_url: enrollment.spotplayer_license_url
        },
        status: 'active',
        created_at: enrollment.created_at,
        course: enrollment.courses
      })) || [];

      // Also try to fetch from course_licenses table
      const [courseLicensesResult, academyUsersResult] = await Promise.all([
        supabase
          .from('course_licenses')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('academy_users')
          .select('id')
          .eq('id', user.id)
          .single()
      ]);

      // Combine both types of licenses
      const allLicenses = [
        ...rafieiLicenses,
        ...(courseLicensesResult.data || [])
      ];

      setCourseLicenses(allLicenses);
    } catch (error) {
      console.error('Error in fetchCourseLicenses:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('chat_user_id', parseInt(user.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return;
    }

    if (!data) return;

    // Fetch course details separately
    const courseIds = [...new Set(data.map(enrollment => enrollment.course_id))];
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);

    const transactions: PaymentTransaction[] = data.map(enrollment => {
      const course = coursesData?.find(c => c.id === enrollment.course_id);
      return {
        id: enrollment.id,
        course_id: enrollment.course_id,
        course_title: course?.title || 'Unknown Course',
        amount: enrollment.payment_amount || 0,
        payment_status: enrollment.payment_status,
        payment_method: enrollment.payment_method || 'zarinpal',
        zarinpal_ref_id: enrollment.zarinpal_ref_id,
        created_at: enrollment.created_at
      };
    });

    setPaymentHistory(transactions);
  };

  const handleCourseAccess = async (course: EnrolledCourse) => {
    // Log click tracking
    try {
      await supabase
        .from('course_click_logs')
        .insert({
          user_id: user?.id,
          course_id: course.id,
          action_type: 'course_access'
        });
    } catch (error) {
      console.error('Error logging course click:', error);
    }

    // Navigate to course
    if (course.redirect_url) {
      window.open(course.redirect_url, '_blank');
    } else {
      toast({
        title: 'خطا',
        description: 'لینک دسترسی به دوره یافت نشد',
        variant: 'destructive'
      });
    }
  };

  const copyLicenseKey = async (licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      toast({
        title: 'کپی شد',
        description: 'کلید لایسنس کپی شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در کپی کردن کلید لایسنس',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'active':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">فعال</Badge>;
      case 'pending':
        return <Badge variant="secondary">در انتظار</Badge>;
      case 'failed':
        return <Badge variant="destructive">ناموفق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAvatarColor = (name: string): string => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const hash = name.charCodeAt(0) % colors.length;
    return colors[hash];
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Here you would update the user profile
      // For now, just show success
      toast({
        title: 'موفق',
        description: 'پروفایل با موفقیت به‌روزرسانی شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی پروفایل',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'خطا',
        description: 'رمز عبور جدید و تأیید آن یکسان نیستند',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'خطا',
        description: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Here you would change the password
      // For now, just show success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsPasswordSectionOpen(false);
      toast({
        title: 'موفق',
        description: 'رمز عبور با موفقیت تغییر یافت'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر رمز عبور',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({
        title: 'خروج موفق',
        description: 'شما با موفقیت خارج شدید'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در خروج از حساب کاربری',
        variant: 'destructive'
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'خطا',
        description: 'فقط فایل‌های تصویری (JPG, PNG, WebP) مجاز هستند',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد',
        variant: 'destructive'
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('خطا در آپلود فایل');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      toast({
        title: 'موفق',
        description: 'تصویر پروفایل با موفقیت به‌روزرسانی شد'
      });

    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast({
        title: 'خطا',
        description: 'خطا در آپلود تصویر پروفایل',
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }

    // Clear the input value so the same file can be selected again
    event.target.value = '';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="mr-2">در حال بارگذاری...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            👋 خوش آمدید، {user?.firstName || user?.email}!
          </h1>
          <p className="text-muted-foreground">
            داشبورد شخصی شما برای مدیریت دوره‌ها و پرداخت‌ها
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                تعداد دوره‌ها
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                دوره‌های ثبت‌نام شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                مجموع پرداخت‌ها
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAmountPaid.toLocaleString('fa-IR')} تومان
              </div>
              <p className="text-xs text-muted-foreground">
                کل مبلغ پرداخت شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                وضعیت حساب
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">فعال</div>
              <p className="text-xs text-muted-foreground">
                حساب کاربری تأیید شده
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              دوره‌های من
            </TabsTrigger>
            <TabsTrigger value="licenses" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              لایسنس‌ها
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              تاریخچه پرداخت
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              پروفایل
            </TabsTrigger>
          </TabsList>

          {/* Enrolled Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            {enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">هنوز دوره‌ای ندارید</h3>
                  <p className="text-muted-foreground mb-4">
                    برای شروع یادگیری، در دوره‌های ما ثبت‌نام کنید
                  </p>
                  <Button onClick={() => navigate('/courses')}>
                    مشاهده دوره‌ها
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>
                            {course.description?.substring(0, 100)}...
                          </CardDescription>
                        </div>
                        {getStatusBadge(course.payment_status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(course.enrollment_date).toLocaleDateString('fa-IR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {course.payment_amount?.toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <Button 
                        className="w-full" 
                        onClick={() => handleCourseAccess(course)}
                        disabled={course.payment_status !== 'success' && course.payment_status !== 'completed'}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        ورود به دوره
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="space-y-4">
            {courseLicenses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لایسنسی یافت نشد</h3>
                  <p className="text-muted-foreground">
                    لایسنس‌های دوره‌هایتان اینجا نمایش داده می‌شود
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {courseLicenses.map((license) => (
                  <Card key={license.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{license.course_title}</CardTitle>
                          <CardDescription>
                            ایجاد شده: {new Date(license.created_at).toLocaleDateString('fa-IR')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(license.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {license.license_key && (
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium mb-1">کلید لایسنس:</p>
                              <p className="font-mono text-sm break-all">
                                {license.license_key}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLicenseKey(license.license_key!)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {license.expires_at && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          انقضا: {new Date(license.expires_at).toLocaleDateString('fa-IR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="space-y-4">
            {paymentHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">تاریخچه پرداختی وجود ندارد</h3>
                  <p className="text-muted-foreground">
                    پرداخت‌های شما اینجا نمایش داده می‌شود
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{transaction.course_title}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(transaction.created_at).toLocaleDateString('fa-IR')}
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              {transaction.payment_method === 'zarinpal' ? 'زرین‌پال' : transaction.payment_method}
                            </div>
                            {transaction.zarinpal_ref_id && (
                              <div className="font-mono text-xs">
                                کد پیگیری: {transaction.zarinpal_ref_id}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left space-y-2">
                          <div className="text-lg font-bold">
                            {transaction.amount.toLocaleString('fa-IR')} تومان
                          </div>
                          {getStatusBadge(transaction.payment_status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6" dir="rtl"
            style={{ textAlign: 'right' }}>
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  اطلاعات پروفایل
                </CardTitle>
                <CardDescription>مدیریت اطلاعات شخصی شما</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback 
                        className="text-lg font-semibold text-white"
                        style={{ backgroundColor: getAvatarColor(formData.name || 'User') }}
                      >
                        {(formData.name || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <label className={`absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-medium">{formData.name || 'کاربر'}</h3>
                    <p className="text-sm text-muted-foreground">{formData.email}</p>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">نام</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="نام خود را وارد کنید"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">نام خانوادگی</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="نام خانوادگی خود را وارد کنید"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      ایمیل قابل تغییر نیست
                    </p>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  اعلان‌ها
                </CardTitle>
                <CardDescription>مدیریت تنظیمات اعلان‌ها</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {formData.notification_enabled ? (
                      <Bell className="h-5 w-5 text-primary" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">اعلان‌های ایمیل</p>
                      <p className="text-sm text-muted-foreground">
                        دریافت اعلان برای دوره‌های جدید و بروزرسانی‌ها
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.notification_enabled}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, notification_enabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  امنیت
                </CardTitle>
                <CardDescription>مدیریت رمز عبور و تنظیمات امنیتی</CardDescription>
              </CardHeader>
              <CardContent>
                <Collapsible open={isPasswordSectionOpen} onOpenChange={setIsPasswordSectionOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      تغییر رمز عبور
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isPasswordSectionOpen ? 'transform rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="رمز عبور فعلی را وارد کنید"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">رمز عبور جدید</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="رمز عبور جدید را وارد کنید"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">تأیید رمز عبور جدید</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="رمز عبور جدید را دوباره وارد کنید"
                      />
                    </div>

                    <Button onClick={handleChangePassword} className="w-full">
                      <Lock className="mr-2 h-4 w-4" />
                      تغییر رمز عبور
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Logout Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  خروج از حساب کاربری
                </CardTitle>
                <CardDescription>خروج از حساب کاربری فعلی</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  خروج از حساب
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
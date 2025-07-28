
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp,
  UserCheck,
  Clock,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  CalendarIcon,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  totalRevenue: number;
  totalEnrollments: number;
  activeCourses: number;
  approvedUsers: number;
  pendingPayments: number;
  recentEnrollments: any[];
  popularCourses: any[];
  pendingEnrollmentsList: any[];
}

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalEnrollments: 0,
    activeCourses: 0,
    approvedUsers: 0,
    pendingPayments: 0,
    recentEnrollments: [],
    popularCourses: [],
    pendingEnrollmentsList: []
  });
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('last_24_hours');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  // Default to boundless course on initial load
  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      // Set boundless course as default
      const boundlessCourse = courses.find(course => course.slug === 'boundless-taste');
      if (boundlessCourse) {
        setSelectedCourse(boundlessCourse.id);
      }
    }
  }, [courses]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up realtime subscription for new enrollments
    const enrollmentsChannel = supabase
      .channel('enrollments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollments'
        },
        () => {
          console.log('New enrollment detected, refreshing data...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentsChannel);
    };
  }, [selectedCourse, selectedDateRange, customDateFrom, customDateTo]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let fromDate: Date, toDate: Date;

    switch (selectedDateRange) {
      case 'last_24_hours':
        fromDate = subDays(now, 1);
        toDate = now;
        break;
      case 'last_7_days':
        fromDate = subDays(now, 7);
        toDate = now;
        break;
      case 'last_30_days':
        fromDate = subDays(now, 30);
        toDate = now;
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          fromDate = startOfDay(customDateFrom);
          toDate = endOfDay(customDateTo);
        } else {
          fromDate = subDays(now, 1);
          toDate = now;
        }
        break;
      default:
        fromDate = subDays(now, 1);
        toDate = now;
    }

    return { fromDate, toDate };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { fromDate, toDate } = getDateRange();

      // Fetch total revenue from successful enrollments with filters
      let revenueQuery = supabase
        .from('enrollments')
        .select('payment_amount')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .in('payment_status', ['completed', 'success']);
      
      // Apply course filter if selected
      if (selectedCourse) {
        revenueQuery = revenueQuery.eq('course_id', selectedCourse);
      }

      const { data: revenueData } = await revenueQuery;
      const totalRevenue = revenueData?.reduce((sum, enrollment) => sum + (enrollment.payment_amount || 0), 0) || 0;

      // Fetch total enrollments with filters
      let enrollmentsCountQuery = supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      
      // Apply course filter if selected
      if (selectedCourse) {
        enrollmentsCountQuery = enrollmentsCountQuery.eq('course_id', selectedCourse);
      }

      const { count: totalEnrollments } = await enrollmentsCountQuery;

      // Fetch active courses (not filtered by date)
      const { count: activeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch approved users (not filtered by date)
      const { count: approvedUsers } = await supabase
        .from('chat_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      // Fetch pending payments count with correct filtering for manual payments
      let pendingQuery = supabase
        .from('enrollments')
        .select('*')
        .eq('payment_method', 'manual')
        .in('payment_status', ['pending', 'awaiting_approval']);

      // Apply course filter to pending payments if selected
      if (selectedCourse) {
        pendingQuery = pendingQuery.eq('course_id', selectedCourse);
      }

      const { data: pendingPaymentsData } = await pendingQuery;

      // Filter for manual payments that haven't been approved or rejected yet
      const filteredPendingPayments = pendingPaymentsData?.filter(enrollment => 
        enrollment.payment_method === 'manual' && 
        (enrollment.payment_status === 'pending' || enrollment.payment_status === 'awaiting_approval') &&
        (!enrollment.manual_payment_status || 
         enrollment.manual_payment_status === null || 
         enrollment.manual_payment_status === 'pending')
      ) || [];

      const pendingPayments = filteredPendingPayments.length;

      // Fetch pending payments list (limited to 5 for dashboard) with course info
      let pendingListQuery = supabase
        .from('enrollments')
        .select(`
          *,
          courses(title, slug)
        `)
        .eq('payment_method', 'manual')
        .in('payment_status', ['pending', 'awaiting_approval'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Apply course filter to pending payments list if selected
      if (selectedCourse) {
        pendingListQuery = pendingListQuery.eq('course_id', selectedCourse);
      }

      const { data: pendingEnrollmentsList } = await pendingListQuery;

      // Filter the list as well
      const filteredPendingList = pendingEnrollmentsList?.filter(enrollment => 
        enrollment.payment_method === 'manual' && 
        (enrollment.payment_status === 'pending' || enrollment.payment_status === 'awaiting_approval') &&
        (!enrollment.manual_payment_status || 
         enrollment.manual_payment_status === null || 
         enrollment.manual_payment_status === 'pending')
      ) || [];

      // Fetch recent enrollments with filters
      let recentQuery = supabase
        .from('enrollments')
        .select(`
          *,
          courses(title)
        `)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Apply course filter if selected
      if (selectedCourse) {
        recentQuery = recentQuery.eq('course_id', selectedCourse);
      }

      const { data: recentEnrollments } = await recentQuery;

      // Fetch popular courses by enrollment count (with date filter but not course filter)
      const { data: popularCourses } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments!inner(id, payment_amount, created_at)
        `)
        .eq('is_active', true)
        .gte('enrollments.created_at', fromDate.toISOString())
        .lte('enrollments.created_at', toDate.toISOString())
        .limit(5);

      console.log('Pending payments count:', pendingPayments);
      console.log('Filtered pending enrollments list:', filteredPendingList);
      console.log('Date range:', { fromDate, toDate });
      console.log('Selected course:', selectedCourse);

      setStats({
        totalRevenue,
        totalEnrollments: totalEnrollments || 0,
        activeCourses: activeCourses || 0,
        approvedUsers: approvedUsers || 0,
        pendingPayments: pendingPayments,
        recentEnrollments: recentEnrollments || [],
        popularCourses: popularCourses || [],
        pendingEnrollmentsList: filteredPendingList
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات داشبورد",
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
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const persianDate = date.toLocaleDateString('fa-IR');
    const time = date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return `${persianDate} - ${time}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays === 1) return 'دیروز';
    return `${diffDays} روز پیش`;
  };

  const handleApprovePayment = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'approved',
          payment_status: 'completed',
          approved_at: new Date().toISOString(),
          approved_by: 'admin'
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "پرداخت با موفقیت تایید شد"
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "خطا",
        description: "خطا در تایید پرداخت",
        variant: "destructive"
      });
    }
  };

  const handleRejectPayment = async (enrollmentId: string) => {
    try {
      const reason = window.prompt('دلیل رد درخواست را وارد کنید:');
      if (reason === null) {
        // User cancelled the prompt
        return;
      }
      if (!reason || reason.trim() === '') {
        toast({
          title: "خطا",
          description: "لطفا دلیل رد درخواست را وارد کنید",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'rejected',
          payment_status: 'failed',
          admin_notes: reason.trim(),
          approved_by: 'admin'
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "پرداخت رد شد"
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "خطا",
        description: "خطا در رد پرداخت",
        variant: "destructive"
      });
    }
  };

  const handleViewEnrollmentDetails = (enrollmentId: string) => {
    window.open(`/enroll/admin/enrollment/${enrollmentId}`, '_blank');
  };

  const handleViewUserDetails = (chatUserId: number | null) => {
    if (chatUserId) {
      window.open(`/enroll/admin/users/${chatUserId}`, '_blank');
    }
  };

  const handleViewEnrollDetails = (enrollmentId: string) => {
    window.open(`/enroll/details?id=${enrollmentId}`, '_blank');
  };

  const dashboardCards = [
    {
      title: 'کل درآمد',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      loading: loading
    },
    {
      title: 'کل ثبت‌نام‌ها',
      value: stats.totalEnrollments.toLocaleString('fa-IR'),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      loading: loading
    },
    {
      title: 'دوره‌های فعال',
      value: stats.activeCourses.toLocaleString('fa-IR'),
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      loading: loading
    },
    {
      title: 'کاربران تایید شده',
      value: stats.approvedUsers.toLocaleString('fa-IR'),
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      loading: loading
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">خانه</h1>
          <p className="text-gray-600 mt-1">نمای کلی آکادمی رفیعی</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5 text-blue-600" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">دوره</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="همه دوره‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه دوره‌ها</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">بازه زمانی</label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_24_hours">۲۴ ساعت گذشته</SelectItem>
                  <SelectItem value="last_7_days">۷ روز گذشته</SelectItem>
                  <SelectItem value="last_30_days">۳۰ روز گذشته</SelectItem>
                  <SelectItem value="custom">سفارشی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date From */}
            {selectedDateRange === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">از تاریخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, 'yyyy/MM/dd') : 'انتخاب تاریخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Custom Date To */}
            {selectedDateRange === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">تا تاریخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, 'yyyy/MM/dd') : 'انتخاب تاریخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <Card key={index} className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                  {card.loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Enrollments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-blue-600" />
              ثبت‌نام‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.recentEnrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هنوز ثبت‌نامی وجود ندارد
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                        >
                          {enrollment.full_name}
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewEnrollDetails(enrollment.id)}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="مشاهده جزئیات ثبت‌نام"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{enrollment.courses?.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{formatDateTime(enrollment.created_at)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-medium text-green-600">{formatPrice(enrollment.payment_amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Courses */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              دوره‌های محبوب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.popularCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هنوز دوره‌ای وجود ندارد
              </div>
            ) : (
              <div className="space-y-3">
                {stats.popularCourses.map((course, index) => {
                  const enrollmentCount = course.enrollments?.length || 0;
                  
                  return (
                    <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                        <p className="text-sm text-gray-500">دوره فعال</p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{enrollmentCount} ثبت‌نام</p>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Section */}
      {stats.pendingPayments > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              پرداخت‌های در انتظار تایید
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {stats.pendingPayments}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.pendingEnrollmentsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هیچ پرداخت در انتظار تاییدی وجود ندارد
              </div>
            ) : (
              <>
                {/* Mobile Layout - Card-based */}
                <div className="block md:hidden space-y-3">
                  {stats.pendingEnrollmentsList.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block w-full text-right"
                          >
                            {enrollment.full_name}
                          </button>
                          <p className="text-sm text-gray-600 truncate">{enrollment.courses?.title}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="جزئیات ثبت‌نام"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprovePayment(enrollment.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="تایید پرداخت"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectPayment(enrollment.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="رد پرداخت"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="font-medium text-green-600">{formatPrice(enrollment.payment_amount)}</span>
                        <span>•</span>
                        <span>{formatDateTime(enrollment.created_at)}</span>
                        {enrollment.receipt_url && (
                          <>
                            <span>•</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => window.open(enrollment.receipt_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              رسید
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Layout - Original cards */}
                <div className="hidden md:block space-y-3">
                  {stats.pendingEnrollmentsList.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block w-full text-right"
                        >
                          {enrollment.full_name}
                        </button>
                        <p className="text-sm text-gray-600 truncate">{enrollment.courses?.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-medium text-green-600">{formatPrice(enrollment.payment_amount)}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatDateTime(enrollment.created_at)}</span>
                          {enrollment.receipt_url && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                                onClick={() => window.open(enrollment.receipt_url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                رسید
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="جزئیات ثبت‌نام"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprovePayment(enrollment.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="تایید پرداخت"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectPayment(enrollment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="رد پرداخت"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {stats.pendingPayments > 5 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      {stats.pendingPayments - 5} پرداخت دیگر در انتظار تایید... 
                    </p>
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      مشاهده همه
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;

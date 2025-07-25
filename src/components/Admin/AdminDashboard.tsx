import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total revenue from successful enrollments
      const { data: revenueData } = await supabase
        .from('enrollments')
        .select('payment_amount')
        .in('payment_status', ['completed', 'success']);

      const totalRevenue = revenueData?.reduce((sum, enrollment) => sum + (enrollment.payment_amount || 0), 0) || 0;

      // Fetch total enrollments
      const { count: totalEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Fetch active courses
      const { count: activeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch approved users
      const { count: approvedUsers } = await supabase
        .from('chat_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      // Fetch pending payments count
      const { count: pendingPayments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('payment_method', 'manual')
        .eq('payment_status', 'pending')
        .is('manual_payment_status', null);

      // Fetch pending payments list (limited to 5 for dashboard)
      const { data: pendingEnrollmentsList } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(title, slug)
        `)
        .eq('payment_method', 'manual')
        .eq('payment_status', 'pending')
        .is('manual_payment_status', null)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent enrollments
      const { data: recentEnrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch popular courses by enrollment count
      const { data: popularCourses } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments(id, payment_amount)
        `)
        .eq('is_active', true)
        .limit(5);

      setStats({
        totalRevenue,
        totalEnrollments: totalEnrollments || 0,
        activeCourses: activeCourses || 0,
        approvedUsers: approvedUsers || 0,
        pendingPayments: pendingPayments || 0,
        recentEnrollments: recentEnrollments || [],
        popularCourses: popularCourses || [],
        pendingEnrollmentsList: pendingEnrollmentsList || []
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
    const reason = prompt('دلیل رد درخواست را وارد کنید:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'rejected',
          payment_status: 'failed',
          admin_notes: reason,
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
                      <p className="font-medium text-gray-900 truncate">{enrollment.full_name}</p>
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
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.pendingEnrollmentsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هیچ پرداخت در انتظار تاییدی وجود ندارد
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingEnrollmentsList.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{enrollment.full_name}</p>
                        <span className="text-sm text-gray-500">•</span>
                        <p className="text-sm text-gray-600">{enrollment.courses?.title}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatPrice(enrollment.payment_amount)}</span>
                        <span>•</span>
                        <span>{formatDate(enrollment.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovePayment(enrollment.id)}
                        className="text-green-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        تایید
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectPayment(enrollment.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        رد
                      </Button>
                    </div>
                  </div>
                ))}
                {stats.pendingPayments > 5 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                      {stats.pendingPayments - 5} پرداخت دیگر در انتظار تایید... 
                    </p>
                    <Button variant="ghost" size="sm" className="mt-2 text-orange-600 hover:text-orange-700">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      مشاهده همه
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
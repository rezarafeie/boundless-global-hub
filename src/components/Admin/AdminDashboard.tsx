import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AIGreetingBanner from './AIGreetingBanner';

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

      // Fetch pending payments count with correct filtering for manual payments
      const { data: pendingPaymentsData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('payment_method', 'manual')
        .in('payment_status', ['pending', 'awaiting_approval']);

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
      const { data: pendingEnrollmentsList } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(title, slug)
        `)
        .eq('payment_method', 'manual')
        .in('payment_status', ['pending', 'awaiting_approval'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Filter the list as well
      const filteredPendingList = pendingEnrollmentsList?.filter(enrollment => 
        enrollment.payment_method === 'manual' && 
        (enrollment.payment_status === 'pending' || enrollment.payment_status === 'awaiting_approval') &&
        (!enrollment.manual_payment_status || 
         enrollment.manual_payment_status === null || 
         enrollment.manual_payment_status === 'pending')
      ) || [];

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

      console.log('Pending payments count:', pendingPayments);
      console.log('Filtered pending enrollments list:', filteredPendingList);

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
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      loading: loading
    },
    {
      title: 'کل ثبت‌نام‌ها',
      value: stats.totalEnrollments.toLocaleString('fa-IR'),
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      loading: loading
    },
    {
      title: 'دوره‌های فعال',
      value: stats.activeCourses.toLocaleString('fa-IR'),
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      loading: loading
    },
    {
      title: 'کاربران تایید شده',
      value: stats.approvedUsers.toLocaleString('fa-IR'),
      icon: UserCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      loading: loading
    }
  ];

  return (
    <div className="space-y-8">
      {/* AI Greeting Banner */}
      <AIGreetingBanner onRefresh={fetchDashboardData} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">خانه</h1>
          <p className="text-muted-foreground mt-1">نمای کلی آکادمی رفیعی</p>
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="ltr">
            {dashboardCards.map((card, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-muted-foreground mb-2">{card.title}</p>
                      {card.loading ? (
                        <div className="h-8 bg-muted rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold">{card.value}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Enrollments */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              ثبت‌نام‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.recentEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز ثبت‌نامی وجود ندارد
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-start gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                          className="font-medium text-primary hover:underline truncate"
                        >
                          {enrollment.full_name}
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewEnrollDetails(enrollment.id)}
                          className="h-6 w-6 p-0 hover:bg-accent"
                          title="مشاهده جزئیات ثبت‌نام"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{enrollment.courses?.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDateTime(enrollment.created_at)}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium text-primary">{formatPrice(enrollment.payment_amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Courses */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              دوره‌های محبوب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.popularCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز دوره‌ای وجود ندارد
              </div>
            ) : (
              <div className="space-y-3">
                {stats.popularCourses.map((course, index) => {
                  const enrollmentCount = course.enrollments?.length || 0;
                  
                  return (
                    <div key={course.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">دوره فعال</p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{enrollmentCount} ثبت‌نام</p>
                        <Badge variant="secondary">
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
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-primary" />
              پرداخت‌های در انتظار تایید
              <Badge variant="secondary">
                {stats.pendingPayments}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : stats.pendingEnrollmentsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هیچ پرداخت در انتظار تاییدی وجود ندارد
              </div>
            ) : (
              <>
                {/* Mobile Layout - Card-based */}
                <div className="block md:hidden space-y-3">
                  {stats.pendingEnrollmentsList.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                            className="font-medium text-primary hover:underline truncate block w-full text-right"
                          >
                            {enrollment.full_name}
                          </button>
                          <p className="text-sm text-muted-foreground truncate">{enrollment.courses?.title}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="جزئیات ثبت‌نام"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprovePayment(enrollment.id)}
                            className="h-8 w-8 p-0 text-primary hover:bg-accent"
                            title="تایید پرداخت"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectPayment(enrollment.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="رد پرداخت"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-primary">{formatPrice(enrollment.payment_amount)}</span>
                        <span>•</span>
                        <span>{formatDateTime(enrollment.created_at)}</span>
                        {enrollment.receipt_url && (
                          <>
                            <span>•</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto p-0 text-xs hover:underline"
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
                    <div key={enrollment.id} className="flex items-start gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                          className="font-medium text-primary hover:underline truncate block w-full text-right"
                        >
                          {enrollment.full_name}
                        </button>
                        <p className="text-sm text-muted-foreground truncate">{enrollment.courses?.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-medium text-primary">{formatPrice(enrollment.payment_amount)}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(enrollment.created_at)}</span>
                          {enrollment.receipt_url && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto p-0 text-xs hover:underline"
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
                          className="h-8 w-8 p-0 hover:bg-accent"
                          title="جزئیات ثبت‌نام"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprovePayment(enrollment.id)}
                          className="h-8 w-8 p-0 text-primary hover:bg-accent"
                          title="تایید پرداخت"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectPayment(enrollment.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
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
                    <p className="text-sm text-muted-foreground mb-2">
                      {stats.pendingPayments - 5} پرداخت دیگر در انتظار تایید... 
                    </p>
                    <Button variant="ghost" size="sm">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

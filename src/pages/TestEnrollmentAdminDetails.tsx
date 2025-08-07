import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Phone,
  Shield,
  BookOpen,
  PlayCircle,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  Clock,
  Activity,
  Copy,
  Hash,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface TestEnrollmentData {
  id: string;
  test_id: string;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  payment_method?: string;
  enrollment_status: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  tests: {
    id: string;
    title: string;
    description?: string;
    slug: string;
    price: number;
  };
}

interface UserActivity {
  id: string;
  event_type: string;
  reference: string | null;
  metadata: any;
  created_at: string;
}

const TestEnrollmentAdminDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<TestEnrollmentData | null>(null);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEnrollmentDetails();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (enrollment?.user_id) {
      fetchUserActivity();
    }
  }, [enrollment?.user_id]);

  const fetchEnrollmentDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests (
            id,
            title,
            description,
            slug,
            price
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching test enrollment:', error);
        setError(true);
        return;
      }

      setEnrollment(data as TestEnrollmentData);
    } catch (error) {
      console.error('Error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPaymentAction = async (action: 'approve' | 'reject') => {
    if (!id) return;
    
    try {
      setActionLoading(true);
      
      const updateData = {
        payment_status: action === 'approve' ? 'completed' : 'failed',
        enrollment_status: action === 'approve' ? 'ready' : 'cancelled',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('test_enrollments')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating test enrollment:', error);
        toast({
          title: 'خطا',
          description: 'خطا در به‌روزرسانی ثبت‌نام آزمون',
          variant: 'destructive'
        });
        return;
      }

      // Refresh data
      await fetchEnrollmentDetails();
      
      toast({
        title: 'موفق',
        description: action === 'approve' ? 'پرداخت آزمون تایید شد' : 'پرداخت آزمون رد شد',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در انجام عملیات',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    if (!enrollment?.user_id) return;
    
    try {
      setActivityLoading(true);
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', enrollment.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching user activity:', error);
        return;
      }

      setUserActivity(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'در انتظار', variant: 'secondary' as const },
      'ready': { label: 'آماده', variant: 'default' as const },
      'completed': { label: 'تکمیل شده', variant: 'default' as const },
      'cancelled': { label: 'لغو شده', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'در انتظار پرداخت', variant: 'secondary' as const },
      'completed': { label: 'پرداخت شده', variant: 'default' as const },
      'failed': { label: 'ناموفق', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">خطا در بارگذاری</h2>
              <p className="text-muted-foreground mb-4">
                ثبت‌نام آزمون مورد نظر یافت نشد یا خطایی رخ داده است
              </p>
              <Button onClick={() => navigate('/enroll/admin/tests')}>
                بازگشت به لیست آزمون‌ها
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isPendingManualPayment = enrollment.payment_method === 'manual' && enrollment.payment_status === 'pending';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/enroll/admin/tests')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">جزئیات ثبت‌نام آزمون</h1>
              <p className="text-muted-foreground">پنل مدیریت ثبت‌نام آزمون - دسترسی ویژه ادمین</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enrollment ID Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium text-primary">شناسه ثبت‌نام آزمون</h3>
                    <p className="text-sm text-muted-foreground">Test Enrollment ID</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1 bg-muted rounded font-mono text-sm">
                    {enrollment.id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(enrollment.id);
                      toast({
                        title: "کپی شد",
                        description: "شناسه ثبت‌نام در کلیپ‌بورد کپی شد",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Payment Actions Card */}
          {isPendingManualPayment && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  عملیات پرداخت دستی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  این ثبت‌نام با روش پرداخت دستی انجام شده و نیاز به تایید دارد.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleManualPaymentAction('approve')}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ThumbsUp className="h-4 w-4 mr-2" />
                    )}
                    تایید پرداخت
                  </Button>
                  <Button
                    onClick={() => handleManualPaymentAction('reject')}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 mr-2" />
                    )}
                    رد پرداخت
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                اطلاعات آزمون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نام آزمون</label>
                  <p className="mt-1 font-semibold">{enrollment.tests.title}</p>
                </div>
                {enrollment.tests.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">توضیحات</label>
                    <p className="mt-1 text-sm text-muted-foreground">{enrollment.tests.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">قیمت آزمون</label>
                  <p className="mt-1">
                    {enrollment.tests.price === 0 
                      ? 'رایگان' 
                      : `${enrollment.tests.price.toLocaleString()} تومان`
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">شناسه آزمون</label>
                  <p className="mt-1 font-mono text-sm">{enrollment.test_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                اطلاعات کاربر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نام و نام خانوادگی</label>
                  <p className="mt-1 font-semibold">{enrollment.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ایمیل</label>
                  <p className="mt-1">{enrollment.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">شماره تماس</label>
                    <p className="mt-1">{enrollment.phone}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">شناسه کاربر</label>
                  <p className="mt-1 font-mono text-sm">{enrollment.user_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-purple-600" />
                اطلاعات پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">مبلغ پرداختی</label>
                  <p className="mt-1 font-semibold text-lg">
                    {enrollment.payment_amount === 0 
                      ? 'رایگان' 
                      : `${enrollment.payment_amount.toLocaleString()} تومان`
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">روش پرداخت</label>
                  <p className="mt-1">{enrollment.payment_method === 'manual' ? 'پرداخت دستی' : 'آنلاین'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">وضعیت پرداخت</label>
                  <div className="mt-1">{getPaymentStatusBadge(enrollment.payment_status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">وضعیت ثبت‌نام</label>
                  <div className="mt-1">{getStatusBadge(enrollment.enrollment_status)}</div>
                </div>
                {enrollment.receipt_url && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">رسید پرداخت</label>
                    <div className="mt-1">
                      <Button
                        variant="outline"
                        onClick={() => window.open(enrollment.receipt_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        مشاهده رسید
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                تاریخ و زمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاریخ ثبت‌نام</label>
                  <p className="mt-1">{format(new Date(enrollment.created_at), 'yyyy/MM/dd HH:mm', { locale: faIR })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">آخرین بروزرسانی</label>
                  <p className="mt-1">{format(new Date(enrollment.updated_at), 'yyyy/MM/dd HH:mm', { locale: faIR })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User CRM Section */}
          {enrollment.user_id && (
            <UserCRM 
              userId={enrollment.user_id} 
              userName={enrollment.full_name}
              userPhone={enrollment.phone}
              userEmail={enrollment.email}
            />
          )}

          {/* User Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                فعالیت‌های اخیر کاربر
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : userActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  هیچ فعالیتی ثبت نشده است
                </p>
              ) : (
                <div className="space-y-3">
                  {userActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.event_type}</p>
                        {activity.reference && (
                          <p className="text-sm text-muted-foreground">{activity.reference}</p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(activity.created_at), 'MM/dd HH:mm', { locale: faIR })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestEnrollmentAdminDetails;
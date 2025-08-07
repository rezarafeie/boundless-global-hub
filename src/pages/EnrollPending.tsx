import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';

const EnrollPending: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const orderId = searchParams.get('orderId');
  const enrollmentType = searchParams.get('type'); // 'test' for test enrollments

  const fetchEnrollmentStatus = async () => {
    if (!orderId) return;

    try {
      let data, error;

      if (enrollmentType === 'test') {
        // Fetch test enrollment
        const response = await supabase
          .from('test_enrollments')
          .select(`
            *,
            tests (
              title,
              slug
            )
          `)
          .eq('id', orderId)
          .single();
        
        data = response.data;
        error = response.error;
      } else {
        // Fetch regular enrollment
        const response = await supabase
          .from('enrollments')
          .select(`
            *,
            courses (
              title,
              slug
            )
          `)
          .eq('id', orderId)
          .single();
        
        data = response.data;
        error = response.error;
      }

      if (error) throw error;

      setEnrollmentData(data);

      // Check if status changed and redirect accordingly
      if (enrollmentType === 'test') {
        // For test enrollments, check payment_status instead of manual_payment_status
        if (data.payment_status === 'completed' || data.payment_status === 'success') {
          const successUrl = `/enroll/success?test=${data.tests?.slug}&phone=${data.phone}&enrollment=${data.id}&status=OK&type=test`;
          navigate(successUrl);
        } else if (data.payment_status === 'failed' || data.payment_status === 'rejected') {
          navigate(`/enroll/reject?orderId=${data.id}&type=test`);
        }
      } else {
        // For regular enrollments
        if (data.manual_payment_status === 'approved') {
          const successUrl = `/enroll/success?course=${data.courses.slug}&email=${data.email}&enrollment=${data.id}&status=OK&Authority=MANUAL_PAYMENT`;
          navigate(successUrl);
        } else if (data.manual_payment_status === 'rejected') {
          navigate(`/enroll/reject?orderId=${data.id}`);
        }
      }

    } catch (error) {
      console.error('Error fetching enrollment:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری وضعیت ثبت‌نام",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchEnrollmentStatus();
  };

  useEffect(() => {
    fetchEnrollmentStatus();

    // Set up real-time subscription for status changes
    const tableName = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
    const channel = supabase
      .channel('enrollment-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Enrollment status updated:', payload);
          fetchEnrollmentStatus();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds as backup
    const interval = setInterval(fetchEnrollmentStatus, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [orderId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!enrollmentData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">ثبت‌نام یافت نشد</h1>
            <p className="text-muted-foreground mb-6">ثبت‌نام با شناسه مورد نظر یافت نشد</p>
            <Button onClick={() => navigate('/enroll')}>بازگشت به صفحه ثبت‌نام</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Status Card */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Clock className="h-16 w-16 text-amber-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl">در انتظار بررسی پرداخت</CardTitle>
              <p className="text-muted-foreground">
                رسید پرداخت شما ارسال شد و در حال بررسی توسط تیم پشتیبانی است
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <Clock className="h-3 w-3 ml-1" />
                در انتظار تایید
              </Badge>
              
              <Button 
                onClick={handleManualRefresh}
                disabled={refreshing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'در حال بررسی...' : 'بررسی مجدد وضعیت'}
              </Button>
            </CardContent>
          </Card>

          {/* Enrollment Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>جزئیات ثبت‌نام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">شناسه ثبت‌نام</label>
                  <p className="font-mono text-sm">{enrollmentData.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{enrollmentType === 'test' ? 'نام آزمون' : 'نام دوره'}</label>
                  <p>{enrollmentType === 'test' ? enrollmentData.tests?.title : enrollmentData.courses?.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نام و نام خانوادگی</label>
                  <p>{enrollmentData.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ایمیل</label>
                  <p>{enrollmentData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">شماره تماس</label>
                  <p>{enrollmentData.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">مبلغ پرداختی</label>
                  <p className="font-semibold text-primary">{formatPrice(enrollmentData.payment_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاریخ ثبت‌نام</label>
                  <p>{formatDate(enrollmentData.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">روش پرداخت</label>
                  <p>واریز نقدی</p>
                </div>
              </div>

              {enrollmentData.receipt_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رسید پرداخت</label>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(enrollmentData.receipt_url, '_blank')}
                    >
                      مشاهده رسید
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>مراحل بعدی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">رسید پرداخت ارسال شد</p>
                    <p className="text-sm text-muted-foreground">رسید شما با موفقیت دریافت شد</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">در حال بررسی توسط تیم پشتیبانی</p>
                    <p className="text-sm text-muted-foreground">معمولاً تا 24 ساعت زمان می‌برد</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 border-2 border-muted rounded-full mt-0.5" />
                  <div>
                    <p className="font-medium text-muted-foreground">تایید نهایی و ارسال لینک دسترسی</p>
                    <p className="text-sm text-muted-foreground">پس از تایید، لینک دسترسی به ایمیل شما ارسال می‌شود</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            این صفحه به صورت خودکار هر 30 ثانیه بروزرسانی می‌شود
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EnrollPending;
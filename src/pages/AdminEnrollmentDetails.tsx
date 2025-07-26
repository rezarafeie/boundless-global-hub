import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  Phone,
  Shield,
  Key,
  BookOpen,
  Crown,
  PlayCircle,
  Gift,
  HeadphonesIcon,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnrollmentData {
  id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  payment_method?: string;
  zarinpal_ref_id?: string;
  created_at: string;
  approved_at?: string;
  receipt_url?: string;
  admin_notes?: string;
  manual_payment_status?: string;
  approved_by?: string;
  spotplayer_license_key?: string;
  spotplayer_license_url?: string;
  spotplayer_license_id?: string;
  courses: {
    id: string;
    title: string;
    description: string;
    slug: string;
    redirect_url?: string;
    is_spotplayer_enabled: boolean;
    spotplayer_course_id?: string;
    woocommerce_create_access: boolean;
    support_link?: string;
    telegram_channel_link?: string;
    gifts_link?: string;
    enable_course_access: boolean;
    support_activation_required?: boolean;
    telegram_activation_required?: boolean;
    smart_activation_enabled?: boolean;
    smart_activation_telegram_link?: string;
  };
}

const AdminEnrollmentDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const enrollmentId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollmentDetails();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [enrollmentId]);

  const fetchEnrollmentDetails = async () => {
    if (!enrollmentId) return;
    
    try {
      setLoading(true);
      
      const { data: responseData, error } = await supabase.functions.invoke('admin-enrollment-access', {
        body: { enrollmentId }
      });

      if (error || !responseData?.success) {
        console.error('Error fetching enrollment:', error);
        setError(true);
        return;
      }

      setEnrollment(responseData.enrollment as EnrollmentData);
      setNotes(responseData.enrollment.admin_notes || '');
    } catch (error) {
      console.error('Error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!enrollmentId) return;
    
    try {
      setActionLoading(true);
      
      const { data: responseData, error } = await supabase.functions.invoke('admin-enrollment-access', {
        body: { 
          enrollmentId, 
          action, 
          notes,
          adminId: 'webhook_admin'
        }
      });

      if (error || !responseData?.success) {
        console.error('Error updating enrollment:', error);
        toast({
          title: 'خطا',
          description: 'خطا در به‌روزرسانی ثبت‌نام',
          variant: 'destructive'
        });
        return;
      }

      setEnrollment(responseData.enrollment);
      toast({
        title: 'موفق',
        description: action === 'approve' ? 'ثبت‌نام تایید شد' : 'ثبت‌نام رد شد',
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
                ثبت‌نام مورد نظر یافت نشد یا خطایی رخ داده است
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isSuccessfulPayment = enrollment.payment_status === 'success' || enrollment.payment_status === 'completed';
  const isPendingManualPayment = enrollment.payment_method === 'manual' && enrollment.payment_status === 'pending';
  const isManuallyApproved = enrollment.manual_payment_status === 'approved';
  const isManuallyRejected = enrollment.manual_payment_status === 'rejected';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">مشاهده سریع ثبت‌نام</h1>
              <p className="text-muted-foreground">پنل مدیریت ثبت‌نام - دسترسی ویژه ادمین</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Admin Actions Card */}
          {isPendingManualPayment && !isManuallyApproved && !isManuallyRejected && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  عملیات مدیریت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">یادداشت مدیر:</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="یادداشت خود را اینجا وارد کنید..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    تایید ثبت‌نام
                  </Button>
                  <Button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserX className="h-4 w-4 mr-2" />
                    )}
                    رد ثبت‌نام
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isSuccessfulPayment || isManuallyApproved ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : isManuallyRejected ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-orange-500" />
                  )}
                  وضعیت ثبت‌نام
                </CardTitle>
                <div className="flex gap-2">
                  {isManuallyApproved && (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
                      تایید شده توسط مدیر
                    </Badge>
                  )}
                  {isManuallyRejected && (
                    <Badge variant="destructive">
                      رد شده توسط مدیر
                    </Badge>
                  )}
                  <Badge variant={isSuccessfulPayment || isManuallyApproved ? "default" : "destructive"}>
                    {isSuccessfulPayment || isManuallyApproved ? 'تکمیل شده' : 
                     isManuallyRejected ? 'رد شده' : 'در انتظار تایید'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نام و نام خانوادگی:</span>
                    <span className="font-medium">{enrollment.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ایمیل:</span>
                    <span className="font-medium">{enrollment.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">شماره تلفن:</span>
                    <span className="font-medium">{enrollment.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">روش پرداخت:</span>
                    <span className="font-medium">
                      {enrollment.payment_method === 'manual' ? 'واریز دستی' : 'آنلاین'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مبلغ پرداختی:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fa-IR').format(enrollment.payment_amount)} تومان
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاریخ ثبت‌نام:</span>
                    <span className="font-medium">
                      {new Intl.DateTimeFormat('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(enrollment.created_at))}
                    </span>
                  </div>
                  {enrollment.approved_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاریخ تایید:</span>
                      <span className="font-medium">
                        {new Intl.DateTimeFormat('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(enrollment.approved_at))}
                      </span>
                    </div>
                  )}
                  {enrollment.zarinpal_ref_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">کد رهگیری:</span>
                      <span className="font-mono font-medium">{enrollment.zarinpal_ref_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {enrollment.admin_notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">یادداشت مدیر:</span>
                  </div>
                  <p className="text-sm">{enrollment.admin_notes}</p>
                </div>
              )}

              {/* Receipt */}
              {enrollment.receipt_url && (
                <div className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">رسید پرداخت</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <img 
                        src={enrollment.receipt_url} 
                        alt="رسید پرداخت"
                        className="w-full max-w-md mx-auto rounded-lg shadow-sm border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackDiv = target.nextElementSibling as HTMLElement;
                          if (fallbackDiv) fallbackDiv.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-center">
                        <Button
                          variant="outline"
                          onClick={() => window.open(enrollment.receipt_url, '_blank')}
                          className="mt-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          مشاهده رسید پرداخت
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                اطلاعات دوره
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{enrollment.courses.title}</h3>
                  <p className="text-muted-foreground">{enrollment.courses.description}</p>
                </div>

                {/* Course Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {enrollment.courses.woocommerce_create_access && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>دسترسی SSO</span>
                    </div>
                  )}
                  {enrollment.courses.is_spotplayer_enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <PlayCircle className="h-4 w-4 text-purple-600" />
                      <span>پلیر رفیعی</span>
                    </div>
                  )}
                  {enrollment.courses.enable_course_access && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span>دسترسی دوره</span>
                    </div>
                  )}
                  {enrollment.courses.smart_activation_enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <Key className="h-4 w-4 text-orange-600" />
                      <span>فعال‌سازی هوشمند</span>
                    </div>
                  )}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                  {enrollment.courses.support_link && (
                    <Button variant="outline" asChild>
                      <a href={enrollment.courses.support_link} target="_blank" rel="noopener noreferrer">
                        <HeadphonesIcon className="h-4 w-4 mr-2" />
                        پشتیبانی
                      </a>
                    </Button>
                  )}
                  {enrollment.courses.telegram_channel_link && (
                    <Button variant="outline" asChild>
                      <a href={enrollment.courses.telegram_channel_link} target="_blank" rel="noopener noreferrer">
                        <Send className="h-4 w-4 mr-2" />
                        کانال تلگرام
                      </a>
                    </Button>
                  )}
                  {enrollment.courses.gifts_link && (
                    <Button variant="outline" asChild>
                      <a href={enrollment.courses.gifts_link} target="_blank" rel="noopener noreferrer">
                        <Gift className="h-4 w-4 mr-2" />
                        هدایا
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminEnrollmentDetails;
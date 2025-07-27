
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnrollmentDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  manual_payment_status: string | null;
  payment_amount: number;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  course_id: string;
  receipt_url: string | null;
  admin_notes: string | null;
  chat_user_id: number | null;
  approved_by: string | null;
  approved_at: string | null;
  zarinpal_ref_id: string | null;
  zarinpal_authority: string | null;
  country_code: string | null;
  spotplayer_license_key: string | null;
  spotplayer_license_url: string | null;
  spotplayer_license_id: string | null;
  woocommerce_order_id: number | null;
  courses: {
    title: string;
    slug: string;
    price: number;
    description: string;
    redirect_url: string | null;
  };
  chat_users?: {
    name: string;
    username: string | null;
    is_approved: boolean;
    bedoun_marz: boolean;
    role: string | null;
  } | null;
}

const AdminEnrollmentDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const enrollmentId = searchParams.get('id');
  
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [manualPaymentStatus, setManualPaymentStatus] = useState('');

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollmentDetails();
    }
  }, [enrollmentId]);

  const fetchEnrollmentDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            title,
            slug,
            price,
            description,
            redirect_url
          ),
          chat_users (
            name,
            username,
            is_approved,
            bedoun_marz,
            role
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (error) throw error;

      setEnrollment(data);
      setAdminNotes(data.admin_notes || '');
      setPaymentStatus(data.payment_status || '');
      setManualPaymentStatus(data.manual_payment_status || '');
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری جزئیات ثبت‌نام",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!enrollment) return;

    try {
      setSaving(true);
      const updateData: any = {
        admin_notes: adminNotes || null,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };

      if (enrollment.payment_method === 'manual') {
        updateData.manual_payment_status = manualPaymentStatus || null;
        
        if (manualPaymentStatus === 'approved') {
          updateData.payment_status = 'completed';
          updateData.approved_at = new Date().toISOString();
          updateData.approved_by = 'admin';
        } else if (manualPaymentStatus === 'rejected') {
          updateData.payment_status = 'rejected';
        }
      }

      const { error } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollment.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تغییرات با موفقیت ذخیره شد"
      });

      // Refresh the data
      await fetchEnrollmentDetails();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره تغییرات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fa-IR'),
      time: date.toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getStatusBadge = (status: string, manualStatus: string | null = null) => {
    if (manualStatus) {
      switch (manualStatus) {
        case 'approved':
          return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>;
        case 'rejected':
          return <Badge variant="destructive">رد شده</Badge>;
        default:
          return <Badge className="bg-orange-100 text-orange-800">در انتظار بررسی</Badge>;
      }
    }

    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-100 text-green-800">تکمیل شده</Badge>;
      case 'failed':
      case 'cancelled_payment':
        return <Badge variant="destructive">ناموفق</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>;
      case 'rejected':
        return <Badge variant="destructive">رد شده</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!enrollmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            شناسه ثبت‌نام مشخص نشده است
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ثبت‌نام مورد نظر یافت نشد
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const createdDateTime = formatDateTime(enrollment.created_at);
  const updatedDateTime = formatDateTime(enrollment.updated_at);

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/enrollments')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              بازگشت به لیست ثبت‌نام‌ها
            </Button>
            <h1 className="text-2xl font-bold">مدیریت ثبت‌نام</h1>
            <p className="text-muted-foreground">مدیریت و بررسی جزئیات ثبت‌نام</p>
          </div>
          <Button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                اطلاعات کاربر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>نام کامل</Label>
                <div className="font-medium">{enrollment.full_name}</div>
              </div>
              <div>
                <Label>شماره تلفن</Label>
                <div className="font-medium">{enrollment.phone}</div>
              </div>
              <div>
                <Label>ایمیل</Label>
                <div className="font-medium">{enrollment.email}</div>
              </div>
              <div>
                <Label>کد کشور</Label>
                <div className="font-medium">{enrollment.country_code || '+98'}</div>
              </div>
              {enrollment.chat_users && (
                <>
                  <Separator />
                  <div>
                    <Label>اطلاعات در سیستم چت</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span>نام کاربری:</span>
                        <span>{enrollment.chat_users.username || 'ندارد'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>وضعیت تایید:</span>
                        <Badge variant={enrollment.chat_users.is_approved ? "default" : "secondary"}>
                          {enrollment.chat_users.is_approved ? 'تایید شده' : 'تایید نشده'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>بدون مرز:</span>
                        <Badge variant={enrollment.chat_users.bedoun_marz ? "default" : "secondary"}>
                          {enrollment.chat_users.bedoun_marz ? 'بله' : 'خیر'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>نقش:</span>
                        <span>{enrollment.chat_users.role || 'کاربر'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                اطلاعات دوره
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>عنوان دوره</Label>
                <div className="font-medium">{enrollment.courses.title}</div>
              </div>
              <div>
                <Label>نامک دوره</Label>
                <div className="font-medium">{enrollment.courses.slug}</div>
              </div>
              <div>
                <Label>قیمت دوره</Label>
                <div className="font-medium">{formatPrice(enrollment.courses.price)}</div>
              </div>
              <div>
                <Label>توضیحات</Label>
                <div className="text-sm text-muted-foreground">
                  {enrollment.courses.description || 'بدون توضیحات'}
                </div>
              </div>
              {enrollment.courses.redirect_url && (
                <div>
                  <Label>لینک بازگشت</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(enrollment.courses.redirect_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    مشاهده
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                اطلاعات پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>مبلغ پرداختی</Label>
                <div className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {formatPrice(enrollment.payment_amount)}
                </div>
              </div>
              <div>
                <Label>روش پرداخت</Label>
                <div className="font-medium">
                  {enrollment.payment_method === 'zarinpal' ? 'زرین‌پال' : 
                   enrollment.payment_method === 'manual' ? 'پرداخت دستی' : 
                   enrollment.payment_method || 'نامشخص'}
                </div>
              </div>
              <div>
                <Label>وضعیت پرداخت</Label>
                <div className="mb-2">
                  {getStatusBadge(enrollment.payment_status, enrollment.manual_payment_status)}
                </div>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب وضعیت پرداخت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="failed">ناموفق</SelectItem>
                    <SelectItem value="cancelled_payment">لغو شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {enrollment.payment_method === 'manual' && (
                <div>
                  <Label>وضعیت تایید دستی</Label>
                  <Select value={manualPaymentStatus} onValueChange={setManualPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت تایید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">در انتظار بررسی</SelectItem>
                      <SelectItem value="approved">تایید شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {enrollment.zarinpal_ref_id && (
                <div>
                  <Label>شناسه مرجع زرین‌پال</Label>
                  <div className="font-medium">{enrollment.zarinpal_ref_id}</div>
                </div>
              )}
              
              {enrollment.zarinpal_authority && (
                <div>
                  <Label>Authority زرین‌پال</Label>
                  <div className="font-medium text-xs">{enrollment.zarinpal_authority}</div>
                </div>
              )}

              {enrollment.receipt_url && (
                <div>
                  <Label>رسید پرداخت</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(enrollment.receipt_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    مشاهده رسید
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                اطلاعات زمانی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>زمان ثبت‌نام</Label>
                <div className="font-medium">
                  {createdDateTime.date} - {createdDateTime.time}
                </div>
              </div>
              <div>
                <Label>آخرین به‌روزرسانی</Label>
                <div className="font-medium">
                  {updatedDateTime.date} - {updatedDateTime.time}
                </div>
              </div>
              {enrollment.approved_at && (
                <div>
                  <Label>زمان تایید</Label>
                  <div className="font-medium">
                    {formatDateTime(enrollment.approved_at).date} - {formatDateTime(enrollment.approved_at).time}
                  </div>
                </div>
              )}
              {enrollment.approved_by && (
                <div>
                  <Label>تایید شده توسط</Label>
                  <div className="font-medium">{enrollment.approved_by}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* License Information */}
        {(enrollment.spotplayer_license_key || enrollment.spotplayer_license_url || enrollment.spotplayer_license_id) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                اطلاعات لایسنس
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment.spotplayer_license_key && (
                <div>
                  <Label>کلید لایسنس</Label>
                  <div className="font-medium">{enrollment.spotplayer_license_key}</div>
                </div>
              )}
              {enrollment.spotplayer_license_url && (
                <div>
                  <Label>لینک لایسنس</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(enrollment.spotplayer_license_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    مشاهده لایسنس
                  </Button>
                </div>
              )}
              {enrollment.spotplayer_license_id && (
                <div>
                  <Label>شناسه لایسنس</Label>
                  <div className="font-medium">{enrollment.spotplayer_license_id}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              یادداشت‌های مدیریت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="یادداشت‌های مدیریت برای این ثبت‌نام..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEnrollmentDetails;

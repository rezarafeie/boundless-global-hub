
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, DollarSign, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingEnrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  manual_payment_status: string;
  payment_amount: number;
  created_at: string;
  course_id: string;
  receipt_url: string | null;
  admin_notes: string | null;
  chat_user_id: number | null;
  courses: {
    title: string;
    slug: string;
  };
}

interface PendingApprovalPaymentsProps {
  onRefresh?: () => void;
}

const PendingApprovalPayments: React.FC<PendingApprovalPaymentsProps> = ({ onRefresh }) => {
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      console.log('Fetching pending manual payments for approval...');
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            title,
            slug
          )
        `)
        .eq('payment_method', 'manual')
        .in('payment_status', ['pending', 'awaiting_approval'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending payments:', error);
        throw error;
      }
      
      console.log('Raw enrollments data:', data);
      
      // Filter for manual payments that haven't been approved or rejected yet
      const filteredData = data?.filter(enrollment => 
        enrollment.payment_method === 'manual' && 
        (enrollment.payment_status === 'pending' || enrollment.payment_status === 'awaiting_approval') &&
        (!enrollment.manual_payment_status || 
         enrollment.manual_payment_status === null || 
         enrollment.manual_payment_status === 'pending')
      ) || [];
      
      console.log('Filtered pending manual payments:', filteredData);
      console.log('Number of pending manual payments:', filteredData.length);
      setPendingEnrollments(filteredData);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری پرداخت‌های در انتظار تایید",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
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

      fetchPendingPayments();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "خطا",
        description: "خطا در تایید پرداخت",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (enrollmentId: string) => {
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

      fetchPendingPayments();
      if (onRefresh) onRefresh();
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

  const handleViewEnrollDetails = (enrollmentId: string) => {
    window.open(`/enroll/details?id=${enrollmentId}`, '_blank');
  };

  const handleViewUserDetails = (chatUserId: number | null) => {
    if (chatUserId) {
      window.open(`/enroll/admin/users/${chatUserId}`, '_blank');
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          پرداخت‌های در انتظار تایید
          {pendingEnrollments.length > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {pendingEnrollments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingEnrollments.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold text-green-700 mb-2">عالی! همه پرداخت‌ها بررسی شده</h3>
            <p className="text-muted-foreground">در حال حاضر هیچ پرداخت دستی در انتظار تایید نیست</p>
            <p className="text-sm text-muted-foreground mt-2">
              پرداخت‌های دستی جدید که نیاز به تایید دارند در اینجا نمایش داده خواهند شد
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کاربر</TableHead>
                    <TableHead>دوره</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>رسید</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <button
                              onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {enrollment.full_name}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{enrollment.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{enrollment.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{enrollment.courses.title}</div>
                          <div className="text-sm text-muted-foreground">{enrollment.courses.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatPrice(enrollment.payment_amount)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                      <TableCell>
                        {enrollment.receipt_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(enrollment.receipt_url!, '_blank')}
                          >
                            مشاهده رسید
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">ندارد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEnrollDetails(enrollment.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="مشاهده ثبت‌نام"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                            className="text-purple-600 hover:text-purple-700"
                            title="جزئیات ثبت‌نام"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(enrollment.id)}
                            className="text-green-600 hover:text-green-700"
                            title="تایید پرداخت"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(enrollment.id)}
                            className="text-red-600 hover:text-red-700"
                            title="رد پرداخت"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {pendingEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="border border-orange-200">
                  <CardContent className="p-4 space-y-3">
                    {/* User Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <button
                            onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                          >
                            {enrollment.full_name}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{enrollment.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{enrollment.phone}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 flex-shrink-0">
                        در انتظار
                      </Badge>
                    </div>

                    {/* Course and Amount */}
                    <div className="border-t pt-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{enrollment.courses.title}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.courses.slug}</p>
                        </div>
                        <div className="text-left flex-shrink-0 ml-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatPrice(enrollment.payment_amount)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(enrollment.created_at)}</span>
                        {enrollment.receipt_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                            onClick={() => window.open(enrollment.receipt_url!, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            رسید
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewEnrollDetails(enrollment.id)}
                          className="text-blue-600 hover:text-blue-700 flex-1 min-w-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="truncate">مشاهده</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                          className="text-purple-600 hover:text-purple-700 flex-1 min-w-0"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          <span className="truncate">جزئیات</span>
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(enrollment.id)}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(enrollment.id)}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          رد
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovalPayments;

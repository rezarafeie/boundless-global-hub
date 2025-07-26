import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, DollarSign } from 'lucide-react';
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
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
          <div className="overflow-x-auto">
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
                          <span className="font-medium">{enrollment.full_name}</span>
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
                          onClick={() => handleApprove(enrollment.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(enrollment.id)}
                          className="text-red-600 hover:text-red-700"
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
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovalPayments;

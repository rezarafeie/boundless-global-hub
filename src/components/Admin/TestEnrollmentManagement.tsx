import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Search, Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';

interface TestEnrollment {
  id: string;
  user_id: number;
  test_id: string;
  phone: string;
  full_name: string;
  email: string;
  payment_amount: number;
  enrollment_status: string;
  payment_status: string;
  created_at: string;
  test?: {
    title: string;
    slug: string;
  };
}

const TestEnrollmentManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<TestEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTestEnrollments();
  }, []);

  const fetchTestEnrollments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests (
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching test enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت ثبت‌نام‌های آزمون",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEnrollmentStatus = async (enrollmentId: string, status: string, paymentStatus?: string) => {
    try {
      const updateData: any = { enrollment_status: status };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { error } = await supabase
        .from('test_enrollments')
        .update(updateData)
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "وضعیت ثبت‌نام به‌روزرسانی شد",
      });

      fetchTestEnrollments();
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت",
        variant: "destructive"
      });
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

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.phone.includes(searchTerm) ||
    enrollment.test?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="جستجو بر اساس نام، ایمیل، تلفن یا نام آزمون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchTestEnrollments}>
          بروزرسانی
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ثبت‌نام‌های آزمون ({filteredEnrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام آزمون</TableHead>
                  <TableHead>نام و نام خانوادگی</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>تلفن</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت ثبت‌نام</TableHead>
                  <TableHead>وضعیت پرداخت</TableHead>
                  <TableHead>تاریخ ثبت‌نام</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.test?.title || 'آزمون ناشناخته'}
                    </TableCell>
                    <TableCell>{enrollment.full_name}</TableCell>
                    <TableCell>{enrollment.email}</TableCell>
                    <TableCell>{enrollment.phone}</TableCell>
                    <TableCell>
                      {enrollment.payment_amount === 0 
                        ? 'رایگان' 
                        : `${enrollment.payment_amount.toLocaleString()} تومان`
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(enrollment.enrollment_status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(enrollment.payment_status)}</TableCell>
                    <TableCell>
                      {format(new Date(enrollment.created_at), 'yyyy/MM/dd HH:mm', { locale: faIR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {enrollment.enrollment_status === 'pending' && enrollment.payment_status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEnrollmentStatus(enrollment.id, 'ready')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            تایید
                          </Button>
                        )}
                        
                        {enrollment.enrollment_status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEnrollmentStatus(enrollment.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            لغو
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredEnrollments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              هیچ ثبت‌نام آزمونی یافت نشد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEnrollmentManagement;
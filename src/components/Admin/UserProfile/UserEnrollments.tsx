import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Enrollment {
  id: string;
  course_id: string;
  created_at: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
  zarinpal_ref_id: string;
  zarinpal_authority: string;
  course_title?: string;
  course_price?: number;
}

interface UserEnrollmentsProps {
  userId: number;
}

export function UserEnrollments({ userId }: UserEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, [userId]);

  const fetchEnrollments = async () => {
    try {
      // First get the user's phone number
      const { data: userData } = await supabase
        .from('chat_users')
        .select('phone')
        .eq('id', userId)
        .single();

      if (!userData) return;

      // Then get enrollments by phone
      const { data: enrollmentData, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          created_at,
          payment_status,
          payment_amount,
          payment_method,
          zarinpal_ref_id,
          zarinpal_authority,
          courses (
            title,
            price
          )
        `)
        .eq('phone', userData.phone)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = enrollmentData?.map(item => ({
        ...item,
        course_title: item.courses?.title,
        course_price: item.courses?.price
      })) || [];

      setEnrollments(formattedData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <Badge variant="default" className="text-xs">پرداخت شده</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">در انتظار</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">ناموفق</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            ثبت‌نام در دوره‌ها ({enrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ ثبت‌نامی برای این کاربر یافت نشد.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">دوره</TableHead>
                      <TableHead className="text-right">تاریخ ثبت‌نام</TableHead>
                      <TableHead className="text-right">مبلغ پرداختی</TableHead>
                      <TableHead className="text-right">روش پرداخت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">شناسه تراکنش</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{enrollment.course_title || 'دوره نامشخص'}</p>
                            <p className="text-xs text-muted-foreground">
                              قیمت دوره: {formatPrice(enrollment.course_price || 0)} تومان
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(enrollment.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-sm">{formatPrice(enrollment.payment_amount)} تومان</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {enrollment.payment_method === 'zarinpal' ? 'زرین‌پال' : enrollment.payment_method || 'نامشخص'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(enrollment.payment_status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {enrollment.zarinpal_ref_id ? (
                              <p>مرجع: {enrollment.zarinpal_ref_id}</p>
                            ) : (
                              <p className="text-muted-foreground">نامشخص</p>
                            )}
                            {enrollment.zarinpal_authority && (
                              <p className="text-xs text-muted-foreground">
                                Auth: {enrollment.zarinpal_authority.slice(0, 10)}...
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/enroll/admin/enrollments/${enrollment.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 ml-1" />
                            جزئیات
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{enrollment.course_title || 'دوره نامشخص'}</h4>
                          <p className="text-xs text-muted-foreground">
                            قیمت دوره: {formatPrice(enrollment.course_price || 0)} تومان
                          </p>
                        </div>
                        {getPaymentStatusBadge(enrollment.payment_status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">تاریخ:</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{formatDate(enrollment.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">مبلغ:</span>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{formatPrice(enrollment.payment_amount)} تومان</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">روش پرداخت:</span>
                          <Badge variant="outline" className="text-xs">
                            {enrollment.payment_method === 'zarinpal' ? 'زرین‌پال' : enrollment.payment_method || 'نامشخص'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">شناسه:</span>
                          <div className="text-xs text-left">
                            {enrollment.zarinpal_ref_id ? (
                              <p>مرجع: {enrollment.zarinpal_ref_id}</p>
                            ) : (
                              <p className="text-muted-foreground">نامشخص</p>
                            )}
                            {enrollment.zarinpal_authority && (
                              <p className="text-xs text-muted-foreground">
                                Auth: {enrollment.zarinpal_authority.slice(0, 10)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open(`/enroll/admin/enrollments/${enrollment.id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 ml-1" />
                          مشاهده جزئیات کامل
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
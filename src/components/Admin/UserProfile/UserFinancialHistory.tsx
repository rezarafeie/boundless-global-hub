import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Receipt, CreditCard, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface UserFinancialHistoryProps {
  userId: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_type: string;
  is_installment: boolean;
  created_at: string;
  due_date: string | null;
  notes: string | null;
}

interface Installment {
  id: string;
  invoice_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

interface Enrollment {
  id: string;
  full_name: string;
  payment_amount: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  course: { title: string } | null;
}

const UserFinancialHistory: React.FC<UserFinancialHistoryProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    totalPending: 0,
    totalEnrollments: 0
  });

  useEffect(() => {
    fetchFinancialData();
  }, [userId]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Fetch installments for user's invoices
      if (invoicesData && invoicesData.length > 0) {
        const invoiceIds = invoicesData.map(inv => inv.id);
        const { data: installmentsData, error: installmentsError } = await supabase
          .from('installments')
          .select('*')
          .in('invoice_id', invoiceIds)
          .order('due_date', { ascending: true });

        if (installmentsError) throw installmentsError;
        setInstallments(installmentsData || []);
      }

      // Fetch enrollments with payment info
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          payment_amount,
          payment_status,
          payment_method,
          created_at,
          courses(title)
        `)
        .eq('chat_user_id', userId)
        .order('created_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      
      const formattedEnrollments = (enrollmentsData || []).map(e => ({
        ...e,
        course: e.courses as { title: string } | null
      }));
      setEnrollments(formattedEnrollments);

      // Calculate stats
      const totalPaid = (invoicesData || [])
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const totalPending = (invoicesData || [])
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0);

      setStats({
        totalInvoices: invoicesData?.length || 0,
        totalPaid,
        totalPending,
        totalEnrollments: enrollmentsData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy/MM/dd');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'paid': { label: 'پرداخت شده', variant: 'default' },
      'partially_paid': { label: 'پرداخت ناقص', variant: 'secondary' },
      'unpaid': { label: 'پرداخت نشده', variant: 'destructive' },
      'pending': { label: 'در انتظار', variant: 'outline' },
      'completed': { label: 'تکمیل شده', variant: 'default' },
      'success': { label: 'موفق', variant: 'default' },
      'failed': { label: 'ناموفق', variant: 'destructive' },
      'cancelled': { label: 'لغو شده', variant: 'destructive' },
      'overdue': { label: 'سررسید گذشته', variant: 'destructive' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const methods: Record<string, string> = {
      'zarinpal': 'زرین پال',
      'card_to_card': 'کارت به کارت',
      'manual': 'دستی',
      'online': 'آنلاین'
    };
    return methods[method || ''] || method || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mr-4">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">تعداد فاکتورها</p>
                <p className="text-xl font-bold">{stats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">مجموع پرداختی</p>
                <p className="text-lg font-bold text-green-600">{formatPrice(stats.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">بدهی باقی‌مانده</p>
                <p className="text-lg font-bold text-orange-600">{formatPrice(stats.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">ثبت‌نام‌ها</p>
                <p className="text-xl font-bold">{stats.totalEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">فاکتورها ({invoices.length})</TabsTrigger>
          <TabsTrigger value="installments">اقساط ({installments.length})</TabsTrigger>
          <TabsTrigger value="enrollments">پرداخت‌های ثبت‌نام ({enrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">فاکتورها</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">فاکتوری یافت نشد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره فاکتور</TableHead>
                      <TableHead>مبلغ کل</TableHead>
                      <TableHead>پرداخت شده</TableHead>
                      <TableHead>نوع پرداخت</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatPrice(invoice.total_amount)}</TableCell>
                        <TableCell>{formatPrice(invoice.paid_amount)}</TableCell>
                        <TableCell>
                          {invoice.is_installment ? (
                            <Badge variant="outline">اقساطی</Badge>
                          ) : (
                            getPaymentMethodLabel(invoice.payment_type)
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatDate(invoice.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 ml-1" />
                            مشاهده
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اقساط</CardTitle>
            </CardHeader>
            <CardContent>
              {installments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">قسطی یافت نشد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره قسط</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>سررسید</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ پرداخت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>قسط {installment.installment_number}</TableCell>
                        <TableCell>{formatPrice(installment.amount)}</TableCell>
                        <TableCell>{formatDate(installment.due_date)}</TableCell>
                        <TableCell>{getStatusBadge(installment.status)}</TableCell>
                        <TableCell>
                          {installment.paid_at ? formatDate(installment.paid_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">پرداخت‌های ثبت‌نام دوره</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">ثبت‌نامی یافت نشد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>دوره</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>روش پرداخت</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.course?.title || '-'}</TableCell>
                        <TableCell>{formatPrice(enrollment.payment_amount)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(enrollment.payment_method)}</TableCell>
                        <TableCell>{getStatusBadge(enrollment.payment_status)}</TableCell>
                        <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserFinancialHistory;

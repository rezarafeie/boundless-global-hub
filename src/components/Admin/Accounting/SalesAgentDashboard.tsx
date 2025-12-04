import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  is_installment: boolean;
  created_at: string;
  customer?: { name: string; phone: string };
}

interface Installment {
  id: string;
  invoice_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  invoice?: { invoice_number: string; customer?: { name: string } };
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  invoice?: { invoice_number: string; total_amount: number };
}

interface CommissionPayment {
  id: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  paid_at: string;
}

export const SalesAgentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [earnedCommissions, setEarnedCommissions] = useState<Commission[]>([]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);

  useEffect(() => {
    const sessionData = localStorage.getItem('messenger_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session?.user?.id) {
        setAgentId(session.user.id);
        fetchAgentData(session.user.id);
      }
    }
  }, []);

  const fetchAgentData = async (id: number) => {
    setLoading(true);
    try {
      // Fetch agent's invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('sales_agent_id', id)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        const enrichedInvoices = await Promise.all(
          invoicesData.map(async (inv) => {
            const { data: customer } = await supabase
              .from('chat_users')
              .select('name, phone')
              .eq('id', inv.customer_id)
              .single();
            return { ...inv, customer };
          })
        );
        setInvoices(enrichedInvoices);

        // Fetch installments for agent's invoices
        const invoiceIds = invoicesData.map(i => i.id);
        if (invoiceIds.length > 0) {
          const { data: installmentsData } = await supabase
            .from('installments')
            .select('*')
            .in('invoice_id', invoiceIds)
            .eq('status', 'pending')
            .order('due_date', { ascending: true });

          if (installmentsData) {
            const enrichedInstallments = await Promise.all(
              installmentsData.map(async (inst) => {
                const invoice = enrichedInvoices.find(i => i.id === inst.invoice_id);
                return { ...inst, invoice: { invoice_number: invoice?.invoice_number || '', customer: invoice?.customer } };
              })
            );
            setInstallments(enrichedInstallments);
          }
        }
      }

      // Fetch earned commissions
      const { data: commissionsData } = await supabase
        .from('earned_commissions')
        .select('*')
        .eq('agent_id', id)
        .order('created_at', { ascending: false });

      if (commissionsData) {
        const enrichedCommissions = await Promise.all(
          commissionsData.map(async (ec) => {
            const { data: invoice } = await supabase
              .from('invoices')
              .select('invoice_number, total_amount')
              .eq('id', ec.invoice_id)
              .single();
            return { ...ec, invoice };
          })
        );
        setEarnedCommissions(enrichedCommissions);
      }

      // Fetch commission payments
      const { data: paymentsData } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('agent_id', id)
        .order('paid_at', { ascending: false });

      if (paymentsData) {
        setCommissionPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    }
    setLoading(false);
  };

  const totalSales = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0);
  const totalCommissionEarned = earnedCommissions.reduce((sum, ec) => sum + Number(ec.amount), 0);
  const totalCommissionPaid = commissionPayments.reduce((sum, cp) => sum + Number(cp.amount), 0);
  const pendingCommission = totalCommissionEarned - totalCommissionPaid;
  const pendingInstallments = installments.length;

  const exportToExcel = () => {
    const headers = ['شماره فاکتور', 'مشتری', 'مبلغ', 'وضعیت', 'تاریخ'];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.customer?.name || '',
      inv.total_amount.toString(),
      inv.status === 'paid' ? 'پرداخت شده' : 'در انتظار',
      format(new Date(inv.created_at), 'yyyy/MM/dd')
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `فاکتورهای-من-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">پرداخت شده</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-500">پرداخت جزئی</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-500">پرداخت نشده</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500">در انتظار</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">داشبورد فروش من</h1>
        <Button variant="outline" onClick={exportToExcel}>
          <Download className="ml-2 h-4 w-4" />
          خروجی Excel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
                <p className="text-muted-foreground">کل فروش (تومان)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalCommissionEarned.toLocaleString()}</div>
                <p className="text-muted-foreground">کمیسیون کسب شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{pendingCommission.toLocaleString()}</div>
                <p className="text-muted-foreground">در انتظار تسویه</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{pendingInstallments}</div>
                <p className="text-muted-foreground">اقساط در انتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">فاکتورهای من</TabsTrigger>
          <TabsTrigger value="installments">پیگیری اقساط</TabsTrigger>
          <TabsTrigger value="commissions">کمیسیون‌ها</TabsTrigger>
          <TabsTrigger value="settlements">تسویه‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره فاکتور</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>پرداخت شده</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        فاکتوری ثبت نشده است
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          <div>{invoice.customer?.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customer?.phone}</div>
                        </TableCell>
                        <TableCell>{Number(invoice.total_amount).toLocaleString()} تومان</TableCell>
                        <TableCell>{Number(invoice.paid_amount).toLocaleString()} تومان</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{format(new Date(invoice.created_at), 'yyyy/MM/dd')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <CardTitle>اقساط در انتظار پیگیری</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>فاکتور</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>قسط</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>سررسید</TableHead>
                    <TableHead>وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        قسطی در انتظار پیگیری نیست
                      </TableCell>
                    </TableRow>
                  ) : (
                    installments.map(inst => (
                      <TableRow key={inst.id}>
                        <TableCell className="font-mono">{inst.invoice?.invoice_number}</TableCell>
                        <TableCell>{inst.invoice?.customer?.name}</TableCell>
                        <TableCell>قسط {inst.installment_number}</TableCell>
                        <TableCell>{Number(inst.amount).toLocaleString()} تومان</TableCell>
                        <TableCell>
                          <span className={new Date(inst.due_date) < new Date() ? 'text-red-600' : ''}>
                            {format(new Date(inst.due_date), 'yyyy/MM/dd')}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(inst.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>فاکتور</TableHead>
                    <TableHead>مبلغ فاکتور</TableHead>
                    <TableHead>کمیسیون</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnedCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        کمیسیونی ثبت نشده است
                      </TableCell>
                    </TableRow>
                  ) : (
                    earnedCommissions.map(ec => (
                      <TableRow key={ec.id}>
                        <TableCell className="font-mono">{ec.invoice?.invoice_number}</TableCell>
                        <TableCell>{Number(ec.invoice?.total_amount || 0).toLocaleString()} تومان</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {Number(ec.amount).toLocaleString()} تومان
                        </TableCell>
                        <TableCell>
                          {ec.status === 'paid' 
                            ? <Badge className="bg-green-500">تسویه شده</Badge>
                            : <Badge className="bg-orange-500">در انتظار</Badge>
                          }
                        </TableCell>
                        <TableCell>{format(new Date(ec.created_at), 'yyyy/MM/dd')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle>تاریخچه تسویه‌ها</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>روش پرداخت</TableHead>
                    <TableHead>شماره پیگیری</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        تسویه‌ای انجام نشده است
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissionPayments.map(cp => (
                      <TableRow key={cp.id}>
                        <TableCell className="font-bold text-green-600">
                          {Number(cp.amount).toLocaleString()} تومان
                        </TableCell>
                        <TableCell>
                          {cp.payment_method === 'bank_transfer' ? 'انتقال بانکی' :
                           cp.payment_method === 'cash' ? 'نقدی' : 'کارت به کارت'}
                        </TableCell>
                        <TableCell>{cp.reference_number || '-'}</TableCell>
                        <TableCell>{format(new Date(cp.paid_at), 'yyyy/MM/dd')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesAgentDashboard;

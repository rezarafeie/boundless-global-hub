import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock, X, Phone, User } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns-jalali';

interface Installment {
  id: string;
  invoice_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
  notes: string | null;
  invoice?: {
    invoice_number: string;
    customer_id: number;
    total_amount: number;
    customer?: {
      name: string;
      phone: string;
    };
  };
}

interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
}

export const AccountingInstallments: React.FC = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'card_to_card',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const { data: installmentsData, error } = await supabase
        .from('installments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Enrich with invoice and customer data
      if (installmentsData) {
        const enriched = await Promise.all(
          installmentsData.map(async (inst) => {
            const { data: invoice } = await supabase
              .from('invoices')
              .select('invoice_number, customer_id, total_amount')
              .eq('id', inst.invoice_id)
              .single();
            
            let customer = null;
            if (invoice?.customer_id) {
              const { data: customerData } = await supabase
                .from('chat_users')
                .select('name, phone')
                .eq('id', invoice.customer_id)
                .single();
              customer = customerData;
            }

            return {
              ...inst,
              invoice: invoice ? { ...invoice, customer } : null
            };
          })
        );
        setInstallments(enriched);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast.error('خطا در دریافت اطلاعات اقساط');
    }
    setLoading(false);
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment || !paymentForm.amount) {
      toast.error('لطفا مبلغ پرداخت را وارد کنید');
      return;
    }

    try {
      const sessionData = localStorage.getItem('messenger_session');
      const session = sessionData ? JSON.parse(sessionData) : null;
      const recordedBy = session?.user?.id || null;

      // Record payment
      await supabase.from('payment_records').insert({
        invoice_id: selectedInstallment.invoice_id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || `پرداخت قسط ${selectedInstallment.installment_number}`,
        recorded_by: recordedBy
      });

      // Update installment status
      await supabase
        .from('installments')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          notes: paymentForm.notes || null
        })
        .eq('id', selectedInstallment.id);

      // Update invoice paid amount
      const { data: invoice } = await supabase
        .from('invoices')
        .select('paid_amount, total_amount')
        .eq('id', selectedInstallment.invoice_id)
        .single();

      if (invoice) {
        const newPaidAmount = Number(invoice.paid_amount) + parseFloat(paymentForm.amount);
        await supabase
          .from('invoices')
          .update({ 
            paid_amount: newPaidAmount,
            status: newPaidAmount >= Number(invoice.total_amount) ? 'paid' : 'partially_paid'
          })
          .eq('id', selectedInstallment.invoice_id);
      }

      toast.success('پرداخت قسط با موفقیت ثبت شد');
      setIsPaymentDialogOpen(false);
      setSelectedInstallment(null);
      setPaymentForm({ amount: '', payment_method: 'card_to_card', reference_number: '', notes: '' });
      fetchInstallments();
    } catch (error) {
      console.error('Error paying installment:', error);
      toast.error('خطا در ثبت پرداخت');
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />پرداخت شده</Badge>;
    }
    
    const due = new Date(dueDate);
    const daysUntilDue = differenceInDays(due, new Date());
    
    if (isPast(due)) {
      return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" />عقب افتاده</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge className="bg-orange-500"><Clock className="h-3 w-3 mr-1" />نزدیک سررسید</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />در انتظار</Badge>;
  };

  const filteredInstallments = installments.filter(inst => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return inst.status !== 'paid';
    if (statusFilter === 'paid') return inst.status === 'paid';
    if (statusFilter === 'overdue') return inst.status !== 'paid' && isPast(new Date(inst.due_date));
    return true;
  });

  const stats = {
    total: installments.length,
    pending: installments.filter(i => i.status !== 'paid').length,
    paid: installments.filter(i => i.status === 'paid').length,
    overdue: installments.filter(i => i.status !== 'paid' && isPast(new Date(i.due_date))).length,
    totalPending: installments.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
    overdueAmount: installments.filter(i => i.status !== 'paid' && isPast(new Date(i.due_date))).reduce((sum, i) => sum + Number(i.amount), 0)
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت اقساط</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="paid">پرداخت شده</SelectItem>
            <SelectItem value="overdue">عقب افتاده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-muted-foreground">کل اقساط</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-muted-foreground">در انتظار پرداخت</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
                <p className="text-muted-foreground">عقب افتاده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalPending.toLocaleString()}</div>
                <p className="text-muted-foreground">مبلغ در انتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">
                  {stats.overdue} قسط با مبلغ {stats.overdueAmount.toLocaleString()} تومان عقب افتاده است
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">لطفا با مشتریان تماس بگیرید</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>فاکتور</TableHead>
                <TableHead>مشتری</TableHead>
                <TableHead>شماره قسط</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>سررسید</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">در حال بارگذاری...</TableCell>
                </TableRow>
              ) : filteredInstallments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">قسطی یافت نشد</TableCell>
                </TableRow>
              ) : (
                filteredInstallments.map(installment => (
                  <TableRow key={installment.id} className={isPast(new Date(installment.due_date)) && installment.status !== 'paid' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell className="font-mono">{installment.invoice?.invoice_number || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{installment.invoice?.customer?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {installment.invoice?.customer?.phone || '-'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>قسط {installment.installment_number}</TableCell>
                    <TableCell>{Number(installment.amount).toLocaleString()} تومان</TableCell>
                    <TableCell>{format(new Date(installment.due_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{getStatusBadge(installment.status, installment.due_date)}</TableCell>
                    <TableCell>
                      {installment.status !== 'paid' && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedInstallment(installment);
                            setPaymentForm({ ...paymentForm, amount: installment.amount.toString() });
                            setIsPaymentDialogOpen(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          ثبت پرداخت
                        </Button>
                      )}
                      {installment.status === 'paid' && installment.paid_at && (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(installment.paid_at), 'yyyy/MM/dd')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md z-[9999]" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>ثبت پرداخت قسط</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsPaymentDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedInstallment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>فاکتور: <span className="font-mono">{selectedInstallment.invoice?.invoice_number}</span></div>
                  <div>قسط: {selectedInstallment.installment_number}</div>
                  <div>مشتری: {selectedInstallment.invoice?.customer?.name}</div>
                  <div>سررسید: {format(new Date(selectedInstallment.due_date), 'yyyy/MM/dd')}</div>
                </div>
              </div>

              <div>
                <Label>مبلغ پرداخت (تومان)</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              <div>
                <Label>روش پرداخت</Label>
                <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm({ ...paymentForm, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="card_to_card">کارت به کارت</SelectItem>
                    <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
                    <SelectItem value="cash">نقدی</SelectItem>
                    <SelectItem value="online">آنلاین</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>شماره پیگیری</Label>
                <Input
                  value={paymentForm.reference_number}
                  onChange={e => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                  placeholder="اختیاری"
                />
              </div>

              <div>
                <Label>یادداشت</Label>
                <Textarea
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button className="w-full" onClick={handlePayInstallment}>
                <CheckCircle className="h-4 w-4 mr-2" />
                ثبت پرداخت
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingInstallments;

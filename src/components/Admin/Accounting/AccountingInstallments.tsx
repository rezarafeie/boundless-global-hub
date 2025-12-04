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
import { toast } from 'sonner';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock, X, Phone, User, Plus } from 'lucide-react';
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

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: number;
  total_amount: number;
  paid_amount: number;
  is_installment: boolean;
  status: string;
}

export const AccountingInstallments: React.FC = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [installmentInvoices, setInstallmentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'card_to_card',
    reference_number: '',
    notes: ''
  });

  const [createForm, setCreateForm] = useState({
    invoice_id: '',
    count: '3',
  });

  useEffect(() => {
    fetchInstallments();
    fetchInstallmentInvoices();
  }, []);

  const fetchInstallmentInvoices = async () => {
    try {
      // Fetch invoices that are installment type but don't have installments yet
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_id, total_amount, paid_amount, is_installment, status')
        .eq('is_installment', true);

      if (invoices) {
        // Check which ones don't have installments
        const invoicesWithoutInstallments = [];
        for (const inv of invoices) {
          const { count } = await supabase
            .from('installments')
            .select('*', { count: 'exact', head: true })
            .eq('invoice_id', inv.id);
          
          if (!count || count === 0) {
            invoicesWithoutInstallments.push(inv);
          }
        }
        setInstallmentInvoices(invoicesWithoutInstallments);
      }
    } catch (error) {
      console.error('Error fetching installment invoices:', error);
    }
  };

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const { data: installmentsData, error } = await supabase
        .from('installments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Enrich with invoice and customer data
      if (installmentsData && installmentsData.length > 0) {
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
      } else {
        setInstallments([]);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast.error('خطا در دریافت اطلاعات اقساط');
    }
    setLoading(false);
  };

  const handleCreateInstallments = async () => {
    if (!createForm.invoice_id || !createForm.count) {
      toast.error('لطفا فاکتور و تعداد اقساط را انتخاب کنید');
      return;
    }

    try {
      const invoice = installmentInvoices.find(i => i.id === createForm.invoice_id);
      if (!invoice) return;

      const count = parseInt(createForm.count);
      const installmentAmount = (Number(invoice.total_amount) - Number(invoice.paid_amount)) / count;
      const installments = [];
      
      for (let i = 0; i < count; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        installments.push({
          invoice_id: createForm.invoice_id,
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString(),
          status: 'pending'
        });
      }

      const { error } = await supabase.from('installments').insert(installments);
      if (error) throw error;

      toast.success('اقساط با موفقیت ایجاد شد');
      setIsCreateDialogOpen(false);
      setCreateForm({ invoice_id: '', count: '3' });
      fetchInstallments();
      fetchInstallmentInvoices();
    } catch (error) {
      console.error('Error creating installments:', error);
      toast.error('خطا در ایجاد اقساط');
    }
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">مدیریت اقساط</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {installmentInvoices.length > 0 && (
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 ml-1" />
              <span className="hidden xs:inline">ایجاد اقساط</span>
              <span className="xs:hidden">اقساط</span>
            </Button>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div>
                <div className="text-lg md:text-2xl font-bold">{stats.total}</div>
                <p className="text-xs md:text-sm text-muted-foreground">کل اقساط</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
              <div>
                <div className="text-lg md:text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs md:text-sm text-muted-foreground">در انتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              <div>
                <div className="text-lg md:text-2xl font-bold text-red-500">{stats.overdue}</div>
                <p className="text-xs md:text-sm text-muted-foreground">عقب افتاده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-4">
              <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div>
                <div className="text-lg md:text-2xl font-bold">{stats.totalPending.toLocaleString()}</div>
                <p className="text-xs md:text-sm text-muted-foreground">مبلغ در انتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400 text-sm md:text-base">
                  {stats.overdue} قسط با مبلغ {stats.overdueAmount.toLocaleString()} تومان عقب افتاده است
                </p>
                <p className="text-xs md:text-sm text-red-600 dark:text-red-500">لطفا با مشتریان تماس بگیرید</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installments Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>فاکتور</TableHead>
                <TableHead className="hidden md:table-cell">مشتری</TableHead>
                <TableHead>قسط</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead className="hidden sm:table-cell">سررسید</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {installments.length === 0 ? (
                      <div className="space-y-2">
                        <p>قسطی یافت نشد</p>
                        {installmentInvoices.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 ml-1" />
                            ایجاد اقساط برای فاکتورهای اقساطی
                          </Button>
                        )}
                      </div>
                    ) : 'قسطی با این فیلتر یافت نشد'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstallments.map(installment => (
                  <TableRow key={installment.id} className={isPast(new Date(installment.due_date)) && installment.status !== 'paid' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell className="font-mono text-xs md:text-sm">{installment.invoice?.invoice_number || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{installment.invoice?.customer?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {installment.invoice?.customer?.phone || '-'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">قسط {installment.installment_number}</TableCell>
                    <TableCell className="text-xs md:text-sm">{Number(installment.amount).toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{format(new Date(installment.due_date), 'yyyy/MM/dd')}</TableCell>
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
                          className="text-xs"
                        >
                          <CreditCard className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                          <span className="hidden md:inline">ثبت پرداخت</span>
                        </Button>
                      )}
                      {installment.status === 'paid' && installment.paid_at && (
                        <span className="text-xs text-muted-foreground">
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

      {/* Create Installments Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md z-[9999]" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>ایجاد اقساط</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>فاکتور اقساطی</Label>
              <Select value={createForm.invoice_id} onValueChange={v => setCreateForm({...createForm, invoice_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب فاکتور" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {installmentInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {Number(inv.total_amount).toLocaleString()} تومان
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>تعداد اقساط</Label>
              <Select value={createForm.count} onValueChange={v => setCreateForm({...createForm, count: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} قسط</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleCreateInstallments}>
              <Plus className="h-4 w-4 mr-2" />
              ایجاد اقساط
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Loader2, 
  FileText, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { useAuth } from '@/contexts/AuthContext';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_type: string;
  is_installment: boolean;
  due_date: string | null;
  notes: string | null;
  created_at: string;
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

interface Customer {
  id: number;
  name: string;
  phone: string;
}

const SalesAgentFinancials: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');
  
  // Dialog states
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    total_amount: '',
    payment_type: 'card',
    is_installment: false,
    notes: '',
    due_date: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    if (user?.messengerData?.id) {
      fetchData();
    }
  }, [user?.messengerData?.id]);

  const fetchData = async () => {
    if (!user?.messengerData?.id) return;
    
    setLoading(true);
    try {
      // Fetch invoices for this sales agent
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          chat_users!invoices_customer_id_fkey(id, name, phone)
        `)
        .eq('sales_agent_id', user.messengerData.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      const processedInvoices = (invoicesData || []).map(inv => ({
        ...inv,
        customer_name: (inv.chat_users as any)?.name || 'نامشخص',
        customer_phone: (inv.chat_users as any)?.phone || ''
      }));

      setInvoices(processedInvoices);

      // Calculate stats
      const totalAmount = processedInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const paidAmount = processedInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
      
      setStats({
        totalInvoices: processedInvoices.length,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount
      });

      // Fetch installments for these invoices
      if (processedInvoices.length > 0) {
        const invoiceIds = processedInvoices.map(inv => inv.id);
        const { data: installmentsData } = await supabase
          .from('installments')
          .select('*')
          .in('invoice_id', invoiceIds)
          .order('due_date', { ascending: true });

        setInstallments(installmentsData || []);
      }

      // Fetch customers for dropdown
      const { data: customersData } = await supabase
        .from('chat_users')
        .select('id, name, phone')
        .eq('is_approved', true)
        .order('name', { ascending: true })
        .limit(500);

      setCustomers(customersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.customer_id || !newInvoice.total_amount) {
      toast({
        title: "خطا",
        description: "لطفاً مشتری و مبلغ را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .insert([{
          customer_id: parseInt(newInvoice.customer_id),
          total_amount: parseFloat(newInvoice.total_amount),
          payment_type: newInvoice.payment_type,
          is_installment: newInvoice.is_installment,
          notes: newInvoice.notes || null,
          due_date: newInvoice.due_date || null,
          sales_agent_id: user?.messengerData?.id,
          status: 'unpaid',
          paid_amount: 0,
          invoice_number: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        }]);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "فاکتور با موفقیت ایجاد شد"
      });

      setShowNewInvoice(false);
      setNewInvoice({
        customer_id: '',
        total_amount: '',
        payment_type: 'card',
        is_installment: false,
        notes: '',
        due_date: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "خطا",
        description: "خطا در ایجاد فاکتور",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'yyyy/MM/dd');
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString() + ' تومان';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">پرداخت شده</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">پرداخت جزئی</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">پرداخت نشده</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">معوق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کل فاکتورها</p>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مبلغ کل</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">دریافت شده</p>
                <p className="text-lg font-bold">{formatCurrency(stats.paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">در انتظار</p>
                <p className="text-lg font-bold">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setShowNewInvoice(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          فاکتور جدید
        </Button>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices">فاکتورها</TabsTrigger>
          <TabsTrigger value="installments">اقساط</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره فاکتور</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>مبلغ کل</TableHead>
                    <TableHead>پرداخت شده</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        فاکتوری یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{invoice.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.paid_amount)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(invoice.created_at)}
                        </TableCell>
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>قسط</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>سررسید</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ پرداخت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        قسطی یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    installments.map(inst => (
                      <TableRow key={inst.id}>
                        <TableCell>قسط {inst.installment_number}</TableCell>
                        <TableCell>{formatCurrency(inst.amount)}</TableCell>
                        <TableCell>{formatDate(inst.due_date)}</TableCell>
                        <TableCell>{getStatusBadge(inst.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inst.paid_at ? formatDate(inst.paid_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Invoice Dialog */}
      <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ایجاد فاکتور جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>مشتری</Label>
              <Select 
                value={newInvoice.customer_id} 
                onValueChange={(value) => setNewInvoice({...newInvoice, customer_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب مشتری" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>مبلغ (تومان)</Label>
              <Input 
                type="number"
                value={newInvoice.total_amount}
                onChange={(e) => setNewInvoice({...newInvoice, total_amount: e.target.value})}
                placeholder="مثال: 1000000"
              />
            </div>
            <div>
              <Label>نوع پرداخت</Label>
              <Select 
                value={newInvoice.payment_type} 
                onValueChange={(value) => setNewInvoice({...newInvoice, payment_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">کارت به کارت</SelectItem>
                  <SelectItem value="online">آنلاین</SelectItem>
                  <SelectItem value="cash">نقدی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>سررسید (اختیاری)</Label>
              <Input 
                type="date"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label>توضیحات (اختیاری)</Label>
              <Textarea 
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                placeholder="توضیحات..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewInvoice(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreateInvoice} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ایجاد فاکتور'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesAgentFinancials;

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, FileText, Eye, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: number;
  sales_agent_id: number | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_type: string;
  is_installment: boolean;
  notes: string | null;
  created_at: string;
  customer?: { name: string; phone: string };
  agent?: { name: string } | null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
}

export const AccountingInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    product_type: 'course',
    product_id: '',
    amount: '',
    payment_type: 'online',
    is_installment: false,
    installment_count: 2,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, customersRes, coursesRes, productsRes] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_users').select('id, name, phone').eq('is_approved', true),
        supabase.from('courses').select('id, title, price').eq('is_active', true),
        supabase.from('products').select('*').eq('is_active', true)
      ]);

      if (invoicesRes.data) {
        // Fetch customer and agent names for each invoice
        const invoicesWithDetails = await Promise.all(
          invoicesRes.data.map(async (inv) => {
            const [customerRes, agentRes] = await Promise.all([
              supabase.from('chat_users').select('name, phone').eq('id', inv.customer_id).single(),
              inv.sales_agent_id 
                ? supabase.from('chat_users').select('name').eq('id', inv.sales_agent_id).single()
                : Promise.resolve({ data: null })
            ]);
            return {
              ...inv,
              customer: customerRes.data,
              agent: agentRes.data
            };
          })
        );
        setInvoices(invoicesWithDetails);
      }

      if (customersRes.data) setCustomers(customersRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطا در دریافت اطلاعات');
    }
    setLoading(false);
  };

  const handleCreateInvoice = async () => {
    if (!formData.customer_id || !formData.product_id || !formData.amount) {
      toast.error('لطفا همه فیلدها را پر کنید');
      return;
    }

    try {
      // Get current user as sales agent
      const sessionData = localStorage.getItem('messenger_session');
      const session = sessionData ? JSON.parse(sessionData) : null;
      const agentId = session?.user?.id || null;

      const invoiceData: any = {
        customer_id: parseInt(formData.customer_id),
        sales_agent_id: agentId,
        total_amount: parseFloat(formData.amount),
        payment_type: formData.is_installment ? 'installment' : formData.payment_type,
        is_installment: formData.is_installment,
        notes: formData.notes || null
      };

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      // Create invoice item
      const selectedProduct = formData.product_type === 'course'
        ? courses.find(c => c.id === formData.product_id)
        : products.find(p => p.id === formData.product_id);

      await supabase.from('invoice_items').insert({
        invoice_id: invoice.id,
        course_id: formData.product_type === 'course' ? formData.product_id : null,
        product_id: formData.product_type !== 'course' ? formData.product_id : null,
        description: selectedProduct ? (formData.product_type === 'course' ? (selectedProduct as Course).title : (selectedProduct as Product).name) : 'محصول',
        unit_price: parseFloat(formData.amount),
        total_price: parseFloat(formData.amount)
      });

      // Create installments if needed
      if (formData.is_installment) {
        const installmentAmount = parseFloat(formData.amount) / formData.installment_count;
        const installments = [];
        for (let i = 0; i < formData.installment_count; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          installments.push({
            invoice_id: invoice.id,
            installment_number: i + 1,
            amount: installmentAmount,
            due_date: dueDate.toISOString()
          });
        }
        await supabase.from('installments').insert(installments);
      }

      toast.success('فاکتور با موفقیت ایجاد شد');
      setIsCreateOpen(false);
      setFormData({
        customer_id: '',
        product_type: 'course',
        product_id: '',
        amount: '',
        payment_type: 'online',
        is_installment: false,
        installment_count: 2,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('خطا در ایجاد فاکتور');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">پرداخت شده</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-500">پرداخت جزئی</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-500">پرداخت نشده</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">لغو شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.includes(searchTerm) ||
      inv.customer?.name?.includes(searchTerm) ||
      inv.customer?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت فاکتورها</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              فاکتور جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>ایجاد فاکتور جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>مشتری</Label>
                <Select value={formData.customer_id} onValueChange={v => setFormData({...formData, customer_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مشتری" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} - {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>نوع محصول</Label>
                <Select value={formData.product_type} onValueChange={v => setFormData({...formData, product_type: v, product_id: ''})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">دوره آموزشی</SelectItem>
                    <SelectItem value="service">خدمات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>محصول</Label>
                <Select value={formData.product_id} onValueChange={v => {
                  const selectedItem = formData.product_type === 'course' 
                    ? courses.find(c => c.id === v)
                    : products.find(p => p.id === v);
                  setFormData({
                    ...formData, 
                    product_id: v,
                    amount: selectedItem ? selectedItem.price.toString() : ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب محصول" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.product_type === 'course' 
                      ? courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title} - {c.price.toLocaleString()} تومان
                          </SelectItem>
                        ))
                      : products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {p.price.toLocaleString()} تومان
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>مبلغ (تومان)</Label>
                <Input 
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <Label>نوع پرداخت</Label>
                <Select value={formData.payment_type} onValueChange={v => setFormData({...formData, payment_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">آنلاین</SelectItem>
                    <SelectItem value="card_to_card">کارت به کارت</SelectItem>
                    <SelectItem value="manual">دستی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is_installment"
                  checked={formData.is_installment}
                  onChange={e => setFormData({...formData, is_installment: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_installment">پرداخت اقساطی</Label>
              </div>

              {formData.is_installment && (
                <div>
                  <Label>تعداد اقساط</Label>
                  <Input 
                    type="number"
                    min="2"
                    max="12"
                    value={formData.installment_count}
                    onChange={e => setFormData({...formData, installment_count: parseInt(e.target.value)})}
                  />
                </div>
              )}

              <div>
                <Label>یادداشت</Label>
                <Textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <Button className="w-full" onClick={handleCreateInvoice}>
                ایجاد فاکتور
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="جستجو..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="unpaid">پرداخت نشده</SelectItem>
            <SelectItem value="partially_paid">پرداخت جزئی</SelectItem>
            <SelectItem value="paid">پرداخت شده</SelectItem>
            <SelectItem value="cancelled">لغو شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-muted-foreground">کل فاکتورها</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
            <p className="text-muted-foreground">پرداخت شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">
              {invoices.filter(i => i.status === 'unpaid').length}
            </div>
            <p className="text-muted-foreground">پرداخت نشده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {invoices.reduce((sum, i) => sum + Number(i.total_amount), 0).toLocaleString()}
            </div>
            <p className="text-muted-foreground">مجموع (تومان)</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
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
                <TableHead>نوع پرداخت</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    در حال بارگذاری...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    فاکتوری یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <div>{invoice.customer?.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.customer?.phone}</div>
                    </TableCell>
                    <TableCell>{Number(invoice.total_amount).toLocaleString()} تومان</TableCell>
                    <TableCell>{Number(invoice.paid_amount).toLocaleString()} تومان</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.is_installment ? 'اقساطی' : 
                        invoice.payment_type === 'online' ? 'آنلاین' :
                        invoice.payment_type === 'card_to_card' ? 'کارت به کارت' : 'دستی'}
                    </TableCell>
                    <TableCell>{format(new Date(invoice.created_at), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingInvoices;

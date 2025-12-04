import React, { useState, useEffect, useMemo } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, FileText, Eye, Search, Calendar, User, Phone, Mail, X, Trash2, Edit } from 'lucide-react';
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

interface InvoiceItem {
  id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
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
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string; is_messenger_admin: boolean } | null>(null);
  
  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Predefined services
  const predefinedServices = [
    { id: 'company_registration', name: 'ثبت شرکت', price: 0 },
    { id: 'bank_account', name: 'افتتاح حساب', price: 0 },
    { id: 'sim_card', name: 'سیم کارت', price: 0 },
    { id: 'digital_services', name: 'خدمات دیجیتال', price: 0 },
    { id: 'other', name: 'سایر', price: 0 },
  ];

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    product_type: 'course',
    product_id: '',
    amount: '',
    payment_type: 'online',
    is_installment: false,
    installment_count: 2,
    notes: '',
    description: ''
  });

  // Check if user can edit/delete invoice - for admin panel, allow all users to edit/delete
  const canEditInvoice = (invoice: Invoice) => {
    // In admin panel, show edit for all users
    return true;
  };

  const canDeleteInvoice = (invoice: Invoice) => {
    // In admin panel, show delete for all users
    return true;
  };

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return [];
    const term = customerSearchTerm.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [customers, customerSearchTerm]);

  useEffect(() => {
    fetchData();
    // Get current user info
    const sessionData = localStorage.getItem('messenger_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setCurrentUser({
        id: session?.user?.id,
        role: session?.user?.role || 'user',
        is_messenger_admin: session?.user?.is_messenger_admin || false
      });
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, customersRes, coursesRes, productsRes] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_users').select('id, name, phone, email'),
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
      let itemDescription = '';
      if (formData.product_type === 'course') {
        const selectedCourse = courses.find(c => c.id === formData.product_id);
        itemDescription = selectedCourse?.title || 'دوره';
      } else {
        const selectedService = predefinedServices.find(s => s.id === formData.product_id);
        itemDescription = selectedService?.name || 'خدمات';
      }
      
      // Add custom description if provided
      if (formData.description) {
        itemDescription = `${itemDescription} - ${formData.description}`;
      }

      await supabase.from('invoice_items').insert({
        invoice_id: invoice.id,
        course_id: formData.product_type === 'course' ? formData.product_id : null,
        product_id: null,
        description: itemDescription,
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
        notes: '',
        description: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('خطا در ایجاد فاکتور');
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewOpen(true);
    // Fetch invoice items
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);
    setInvoiceItems(data || []);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice({ ...invoice });
    setIsEditOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: selectedInvoice.status,
          paid_amount: selectedInvoice.paid_amount,
          notes: selectedInvoice.notes
        })
        .eq('id', selectedInvoice.id);
      
      if (error) throw error;
      
      toast.success('فاکتور با موفقیت بروزرسانی شد');
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('خطا در بروزرسانی فاکتور');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return;
    try {
      // Delete invoice items first
      await supabase.from('invoice_items').delete().eq('invoice_id', deleteInvoice.id);
      // Delete installments if any
      await supabase.from('installments').delete().eq('invoice_id', deleteInvoice.id);
      // Delete the invoice
      const { error } = await supabase.from('invoices').delete().eq('id', deleteInvoice.id);
      
      if (error) throw error;
      
      toast.success('فاکتور با موفقیت حذف شد');
      setDeleteInvoice(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('خطا در حذف فاکتور');
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
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCustomerSearchTerm('');
            setSelectedCustomer(null);
            setShowCustomerResults(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              فاکتور جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-none w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-0" dir="rtl">
            <div className="flex flex-col h-[100dvh] max-h-[100dvh] text-right">
              <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0">
                <div className="flex items-center justify-between flex-row-reverse">
                  <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                  <DialogTitle className="text-lg sm:text-xl">ایجاد فاکتور جدید</DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                  {/* Customer Search Section */}
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-row-reverse justify-end">
                        انتخاب مشتری
                        <User className="h-5 w-5" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedCustomer ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse w-full sm:w-auto">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base">{selectedCustomer.name}</p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 flex-row-reverse">
                                  {selectedCustomer.phone}
                                  <Phone className="h-3 w-3" />
                                </span>
                                {selectedCustomer.email && (
                                  <span className="flex items-center gap-1 flex-row-reverse">
                                    {selectedCustomer.email}
                                    <Mail className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setFormData({...formData, customer_id: ''});
                              setCustomerSearchTerm('');
                            }}
                          >
                            تغییر
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="جستجو با نام، شماره تلفن یا ایمیل..."
                              value={customerSearchTerm}
                              onChange={e => {
                                setCustomerSearchTerm(e.target.value);
                                setShowCustomerResults(true);
                              }}
                              onFocus={() => setShowCustomerResults(true)}
                              className="pr-10 text-right"
                            />
                          </div>
                          
                          {showCustomerResults && customerSearchTerm && (
                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-auto">
                              {filteredCustomers.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                  مشتری یافت نشد
                                </div>
                              ) : (
                                filteredCustomers.map(customer => (
                                  <button
                                    key={customer.id}
                                    className="w-full p-3 text-right hover:bg-muted flex items-center gap-3 flex-row-reverse border-b last:border-0"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setFormData({...formData, customer_id: customer.id.toString()});
                                      setShowCustomerResults(false);
                                      setCustomerSearchTerm('');
                                    }}
                                  >
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                      <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                      <p className="font-medium truncate">{customer.name}</p>
                                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                                        <span>{customer.phone}</span>
                                        {customer.email && <span className="truncate">{customer.email}</span>}
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Product Selection */}
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-row-reverse justify-end">
                        محصول / خدمات
                        <FileText className="h-5 w-5" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-right block">نوع محصول</Label>
                        <Select value={formData.product_type} onValueChange={v => setFormData({...formData, product_type: v, product_id: '', amount: ''})}>
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="course">دوره آموزشی</SelectItem>
                            <SelectItem value="service">خدمات</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-right block">{formData.product_type === 'course' ? 'دوره' : 'نوع خدمات'}</Label>
                        <Select value={formData.product_id} onValueChange={v => {
                          if (formData.product_type === 'course') {
                            const selectedCourse = courses.find(c => c.id === v);
                            setFormData({
                              ...formData, 
                              product_id: v,
                              amount: selectedCourse ? selectedCourse.price.toString() : ''
                            });
                          } else {
                            const selectedService = predefinedServices.find(s => s.id === v);
                            setFormData({
                              ...formData, 
                              product_id: v,
                              amount: selectedService?.price ? selectedService.price.toString() : formData.amount
                            });
                          }
                        }}>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder={formData.product_type === 'course' ? 'انتخاب دوره' : 'انتخاب خدمات'} />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.product_type === 'course' 
                              ? courses.map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.title} - {c.price.toLocaleString()} تومان
                                  </SelectItem>
                                ))
                              : predefinedServices.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-right block">مبلغ (تومان)</Label>
                        <Input 
                          type="number"
                          value={formData.amount}
                          onChange={e => setFormData({...formData, amount: e.target.value})}
                          className="text-base sm:text-lg font-semibold text-right"
                          placeholder="مبلغ را وارد کنید"
                        />
                      </div>

                      <div>
                        <Label className="text-right block">توضیحات (اختیاری)</Label>
                        <Textarea 
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          placeholder="جزئیات بیشتر درباره محصول یا خدمات..."
                          rows={2}
                          className="text-right"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Options */}
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-row-reverse justify-end">
                        نحوه پرداخت
                        <Calendar className="h-5 w-5" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-right block">نوع پرداخت</Label>
                        <Select value={formData.payment_type} onValueChange={v => setFormData({...formData, payment_type: v})}>
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">آنلاین</SelectItem>
                            <SelectItem value="card_to_card">کارت به کارت</SelectItem>
                            <SelectItem value="manual">دستی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 flex-row-reverse justify-end">
                        <Label htmlFor="is_installment">پرداخت اقساطی</Label>
                        <input 
                          type="checkbox"
                          id="is_installment"
                          checked={formData.is_installment}
                          onChange={e => setFormData({...formData, is_installment: e.target.checked})}
                          className="rounded"
                        />
                      </div>

                      {formData.is_installment && (
                        <div>
                          <Label className="text-right block">تعداد اقساط</Label>
                          <Input 
                            type="number"
                            min="2"
                            max="12"
                            value={formData.installment_count}
                            onChange={e => setFormData({...formData, installment_count: parseInt(e.target.value)})}
                            className="text-right"
                          />
                          {formData.amount && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-right">
                              مبلغ هر قسط: {(parseFloat(formData.amount) / formData.installment_count).toLocaleString()} تومان
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg text-right">یادداشت</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        placeholder="توضیحات اضافی..."
                        rows={3}
                        className="text-right"
                      />
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="pb-4 sm:pb-6">
                    <Button 
                      className="w-full h-10 sm:h-12 text-base sm:text-lg" 
                      onClick={handleCreateInvoice}
                      disabled={!selectedCustomer || !formData.product_id || !formData.amount}
                    >
                      ایجاد فاکتور
                    </Button>
                  </div>
                </div>
              </div>
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
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditInvoice(invoice) && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(invoice)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteInvoice(invoice) && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteInvoice(invoice)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-none w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-0 z-[100]" dir="rtl">
          <div className="flex flex-col h-[100dvh] max-h-[100dvh] text-right bg-background">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0">
              <div className="flex items-center justify-between flex-row-reverse">
                <Button variant="ghost" size="icon" onClick={() => setIsViewOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
                <DialogTitle className="text-lg sm:text-xl">جزئیات فاکتور</DialogTitle>
              </div>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              {selectedInvoice && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">شماره فاکتور</Label>
                          <p className="font-mono font-semibold">{selectedInvoice.invoice_number}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">تاریخ</Label>
                          <p>{format(new Date(selectedInvoice.created_at), 'yyyy/MM/dd')}</p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <Label className="text-muted-foreground">مشتری</Label>
                        <p className="font-semibold">{selectedInvoice.customer?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedInvoice.customer?.phone}</p>
                      </div>

                      {selectedInvoice.agent && (
                        <div>
                          <Label className="text-muted-foreground">فروشنده</Label>
                          <p>{selectedInvoice.agent.name}</p>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <Label className="text-muted-foreground">آیتم‌ها</Label>
                        {invoiceItems.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {invoiceItems.map(item => (
                              <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>{item.description}</span>
                                <span className="font-semibold">{Number(item.total_price).toLocaleString()} تومان</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm mt-1">بدون آیتم</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <Label className="text-muted-foreground">مبلغ کل</Label>
                          <p className="font-semibold text-lg">{Number(selectedInvoice.total_amount).toLocaleString()} تومان</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">پرداخت شده</Label>
                          <p className="font-semibold text-lg text-green-500">{Number(selectedInvoice.paid_amount).toLocaleString()} تومان</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <Label className="text-muted-foreground">وضعیت</Label>
                          <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">نوع پرداخت</Label>
                          <p>{selectedInvoice.is_installment ? 'اقساطی' : 
                            selectedInvoice.payment_type === 'online' ? 'آنلاین' :
                            selectedInvoice.payment_type === 'card_to_card' ? 'کارت به کارت' : 'دستی'}</p>
                        </div>
                      </div>

                      {selectedInvoice.notes && (
                        <div className="border-t pt-4">
                          <Label className="text-muted-foreground">یادداشت</Label>
                          <p className="text-sm mt-1">{selectedInvoice.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-none w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-0 z-[100]" dir="rtl">
          <div className="flex flex-col h-[100dvh] max-h-[100dvh] text-right bg-background">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0">
              <div className="flex items-center justify-between flex-row-reverse">
                <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
                <DialogTitle className="text-lg sm:text-xl">ویرایش فاکتور</DialogTitle>
              </div>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              {selectedInvoice && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <Label className="text-right block">وضعیت</Label>
                        <Select 
                          value={selectedInvoice.status} 
                          onValueChange={(v) => setSelectedInvoice({...selectedInvoice, status: v})}
                        >
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150]">
                            <SelectItem value="unpaid">پرداخت نشده</SelectItem>
                            <SelectItem value="partially_paid">پرداخت جزئی</SelectItem>
                            <SelectItem value="paid">پرداخت شده</SelectItem>
                            <SelectItem value="cancelled">لغو شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-right block">مبلغ پرداخت شده</Label>
                        <Input
                          type="number"
                          value={selectedInvoice.paid_amount}
                          onChange={(e) => setSelectedInvoice({...selectedInvoice, paid_amount: parseFloat(e.target.value) || 0})}
                          className="text-right"
                        />
                      </div>

                      <div>
                        <Label className="text-right block">یادداشت</Label>
                        <Textarea
                          value={selectedInvoice.notes || ''}
                          onChange={(e) => setSelectedInvoice({...selectedInvoice, notes: e.target.value})}
                          className="text-right"
                          rows={3}
                        />
                      </div>

                      <Button className="w-full" onClick={handleUpdateInvoice}>
                        ذخیره تغییرات
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoice} onOpenChange={(open) => !open && setDeleteInvoice(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">آیا از حذف فاکتور مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              فاکتور شماره {deleteInvoice?.invoice_number} حذف خواهد شد. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountingInvoices;

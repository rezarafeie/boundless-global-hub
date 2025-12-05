import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, FileText, Eye, Search, Calendar, User, Phone, Mail, X, Trash2, Edit, Copy, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
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
  payment_review_status: string | null;
  receipt_url: string | null;
  customer?: { name: string; phone: string };
  agent?: { name: string } | null;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  course_id: string | null;
  product_id: string | null;
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

interface SalesAgent {
  id: number;
  name: string;
}

export const AccountingInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFreeInvoices, setShowFreeInvoices] = useState<boolean>(false);
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string; is_messenger_admin: boolean } | null>(null);
  const [invoiceItemsMap, setInvoiceItemsMap] = useState<Record<string, InvoiceItem[]>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Predefined services that should exist in the database
  const predefinedServiceNames = ['ثبت شرکت', 'افتتاح حساب', 'سیم کارت', 'خدمات دیجیتال', 'سایر'];

  const ensurePredefinedServices = async () => {
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name')
      .in('name', predefinedServiceNames);

    const existingNames = existingProducts?.map(p => p.name) || [];
    const missingServices = predefinedServiceNames.filter(name => !existingNames.includes(name));

    if (missingServices.length > 0) {
      await supabase.from('products').insert(
        missingServices.map(name => ({
          name,
          type: 'service',
          price: 0,
          is_active: true
        }))
      );
    }
  };

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
      // Ensure predefined services exist in products table
      await ensurePredefinedServices();
      
      const [invoicesRes, customersRes, coursesRes, productsRes, agentsRes] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_users').select('id, name, phone, email'),
        supabase.from('courses').select('id, title, price').eq('is_active', true),
        supabase.from('products').select('*').eq('is_active', true),
        supabase.from('sales_agents').select('id, user_id, chat_users!sales_agents_user_id_fkey(name)').eq('is_active', true)
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
        
        // Fetch all invoice items for filtering by course
        const invoiceIds = invoicesRes.data.map(i => i.id);
        if (invoiceIds.length > 0) {
          const { data: allItems } = await supabase
            .from('invoice_items')
            .select('*')
            .in('invoice_id', invoiceIds);
          
          if (allItems) {
            const itemsMap: Record<string, InvoiceItem[]> = {};
            allItems.forEach(item => {
              if (!itemsMap[item.invoice_id]) {
                itemsMap[item.invoice_id] = [];
              }
              itemsMap[item.invoice_id].push(item);
            });
            setInvoiceItemsMap(itemsMap);
          }
        }
      }

      if (customersRes.data) setCustomers(customersRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      if (agentsRes.data) {
        const agents = agentsRes.data.map((a: any) => ({
          id: a.user_id,
          name: a.chat_users?.name || 'Unknown'
        }));
        setSalesAgents(agents);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطا در دریافت اطلاعات');
    }
    setLoading(false);
  };

  const syncPaymentsToInvoices = async () => {
    setIsSyncing(true);
    try {
      // Fetch all successful enrollments that don't have invoices yet
      const { data: enrollments, error: fetchError } = await supabase
        .from('enrollments')
        .select(`
          id, full_name, phone, email, payment_status, payment_method, payment_amount, 
          chat_user_id, course_id, created_at,
          courses!enrollments_course_id_fkey(title)
        `)
        .in('payment_status', ['completed', 'success'])
        .gt('payment_amount', 0)
        .not('chat_user_id', 'is', null);
      
      if (fetchError) throw fetchError;
      
      // Get existing invoice enrollment_ids
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('enrollment_id')
        .not('enrollment_id', 'is', null);
      
      const existingEnrollmentIds = new Set(existingInvoices?.map(i => i.enrollment_id) || []);
      
      // Filter enrollments without invoices
      const enrollmentsToSync = enrollments?.filter(e => !existingEnrollmentIds.has(e.id)) || [];
      
      if (enrollmentsToSync.length === 0) {
        toast.info('همه پرداخت‌های موفق قبلا به فاکتور تبدیل شده‌اند');
        setIsSyncing(false);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const enrollment of enrollmentsToSync) {
        try {
          // Determine payment type based on payment_method
          let paymentType = 'online';
          if (enrollment.payment_method === 'کارت به کارت' || enrollment.payment_method === 'manual') {
            paymentType = 'card_to_card';
          } else if (enrollment.payment_method === 'zarinpal') {
            paymentType = 'online';
          }
          
          // Generate invoice number
          const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');
          
          // Create invoice
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              invoice_number: invoiceNumber || `AUTO-${Date.now()}`,
              customer_id: enrollment.chat_user_id!,
              enrollment_id: enrollment.id,
              total_amount: enrollment.payment_amount,
              paid_amount: enrollment.payment_amount,
              status: 'paid',
              payment_type: paymentType,
              is_installment: false,
              notes: `همگام‌سازی خودکار از ${enrollment.payment_method || 'پرداخت آنلاین'}`
            })
            .select()
            .single();
          
          if (invoiceError) {
            console.error('Error creating invoice for enrollment:', enrollment.id, invoiceError);
            errorCount++;
            continue;
          }
          
          // Create invoice item
          const courseTitle = (enrollment.courses as any)?.title || 'دوره';
          await supabase.from('invoice_items').insert({
            invoice_id: invoice.id,
            course_id: enrollment.course_id,
            description: courseTitle,
            unit_price: enrollment.payment_amount,
            total_price: enrollment.payment_amount,
            quantity: 1
          });
          
          successCount++;
        } catch (err) {
          console.error('Error syncing enrollment:', enrollment.id, err);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} فاکتور با موفقیت ایجاد شد`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} فاکتور با خطا مواجه شد`);
      }
      
      fetchData();
    } catch (error) {
      console.error('Error syncing payments:', error);
      toast.error('خطا در همگام‌سازی پرداخت‌ها');
    }
    setIsSyncing(false);
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
        const selectedProduct = products.find(p => p.id === formData.product_id);
        itemDescription = selectedProduct?.name || 'خدمات';
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

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/enroll/admin/invoice/${invoice.id}`);
  };

  const copyInvoiceLink = (invoice: Invoice) => {
    const link = `${window.location.origin}/invoice/${invoice.id}`;
    navigator.clipboard.writeText(link);
    toast.success('لینک فاکتور کپی شد');
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
      // Delete payment records first
      const { error: paymentError } = await supabase.from('payment_records').delete().eq('invoice_id', deleteInvoice.id);
      if (paymentError) console.warn('Payment records delete warning:', paymentError);
      
      // Delete earned commissions
      const { error: commError } = await supabase.from('earned_commissions').delete().eq('invoice_id', deleteInvoice.id);
      if (commError) console.warn('Earned commissions delete warning:', commError);
      
      // Delete invoice items
      const { error: itemsError } = await supabase.from('invoice_items').delete().eq('invoice_id', deleteInvoice.id);
      if (itemsError) console.warn('Invoice items delete warning:', itemsError);
      
      // Delete installments if any
      const { error: installmentsError } = await supabase.from('installments').delete().eq('invoice_id', deleteInvoice.id);
      if (installmentsError) console.warn('Installments delete warning:', installmentsError);
      
      // Delete the invoice
      const { error } = await supabase.from('invoices').delete().eq('id', deleteInvoice.id);
      
      if (error) {
        console.error('Invoice delete error:', error);
        throw error;
      }
      
      toast.success('فاکتور با موفقیت حذف شد');
      setDeleteInvoice(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(`خطا در حذف فاکتور: ${error?.message || 'Unknown error'}`);
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    // Check payment_review_status first
    if (invoice.payment_review_status === 'pending_review') {
      return <Badge className="bg-yellow-500">در انتظار تایید</Badge>;
    }
    if (invoice.payment_review_status === 'rejected') {
      return <Badge className="bg-orange-500">رد شده</Badge>;
    }
    
    // Then check regular status
    switch (invoice.status) {
      case 'paid':
        return <Badge className="bg-green-500">پرداخت شده</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">پرداخت جزئی</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-500">پرداخت نشده</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">لغو شده</Badge>;
      default:
        return <Badge variant="outline">{invoice.status}</Badge>;
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Exclude free/0 price invoices by default
      if (!showFreeInvoices && inv.total_amount === 0) {
        return false;
      }
      
      const matchesSearch = 
        inv.invoice_number.includes(searchTerm) ||
        inv.customer?.name?.includes(searchTerm) ||
        inv.customer?.phone?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesAgent = agentFilter === 'all' || inv.sales_agent_id === parseInt(agentFilter);
      
      // Filter by course
      let matchesCourse = courseFilter === 'all';
      if (!matchesCourse && invoiceItemsMap[inv.id]) {
        matchesCourse = invoiceItemsMap[inv.id].some(item => item.course_id === courseFilter);
      }
      
      // Filter by date range
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(inv.created_at) >= new Date(dateFrom);
      }
      if (dateTo && matchesDate) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = new Date(inv.created_at) <= toDate;
      }
      
      return matchesSearch && matchesStatus && matchesAgent && matchesCourse && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, agentFilter, courseFilter, dateFrom, dateTo, showFreeInvoices, invoiceItemsMap]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">مدیریت فاکتورها</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            size="sm" 
            variant="outline"
            onClick={syncPaymentsToInvoices}
            disabled={isSyncing}
            className="flex-1 sm:flex-none"
          >
            {isSyncing ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="ml-2 h-4 w-4" />
            )}
            همگام‌سازی پرداخت‌ها
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setCustomerSearchTerm('');
              setSelectedCustomer(null);
              setShowCustomerResults(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none">
                <Plus className="ml-2 h-4 w-4" />
                فاکتور جدید
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-none w-screen h-[calc(100dvh-60px)] max-h-[calc(100dvh-60px)] m-0 p-0 rounded-none border-0 top-[60px] translate-y-0 pointer-events-auto" dir="rtl">
            <div className="flex flex-col h-full max-h-full text-right overflow-hidden">
              <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0">
                <div className="flex items-center justify-between flex-row-reverse">
                  <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                  <DialogTitle className="text-lg sm:text-xl">ایجاد فاکتور جدید</DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-4 pointer-events-auto touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                            const selectedProduct = products.find(p => p.id === v);
                            setFormData({
                              ...formData, 
                              product_id: v,
                              amount: selectedProduct?.price ? selectedProduct.price.toString() : formData.amount
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
                              : products.map(p => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} {p.price > 0 ? `- ${p.price.toLocaleString()} تومان` : ''}
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

                </div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="shrink-0 border-t bg-background px-4 sm:px-6 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <div className="max-w-2xl mx-auto flex flex-row gap-3">
                  <Button 
                    variant="outline"
                    className="flex-1 h-12 text-base sm:text-lg border-2" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    بستن
                  </Button>
                  <Button 
                    className="flex-1 h-12 text-base sm:text-lg" 
                    onClick={handleCreateInvoice}
                    disabled={!selectedCustomer || !formData.product_id || !formData.amount}
                  >
                    ایجاد فاکتور
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* First row: Search and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="جستجو..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="unpaid">پرداخت نشده</SelectItem>
                <SelectItem value="partially_paid">پرداخت جزئی</SelectItem>
                <SelectItem value="paid">پرداخت شده</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="دوره" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دوره‌ها</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="فروشنده" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه فروشندگان</SelectItem>
                {salesAgents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Second row: Date range and options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">از تاریخ</Label>
              <Input 
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">تا تاریخ</Label>
              <Input 
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 h-10">
              <input
                type="checkbox"
                id="showFreeInvoices"
                checked={showFreeInvoices}
                onChange={e => setShowFreeInvoices(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showFreeInvoices" className="text-sm cursor-pointer">نمایش رایگان‌ها</Label>
            </div>
            <div className="flex gap-2">
              {(dateFrom || dateTo || courseFilter !== 'all' || agentFilter !== 'all' || statusFilter !== 'all' || searchTerm || showFreeInvoices) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setCourseFilter('all');
                    setAgentFilter('all');
                    setStatusFilter('all');
                    setSearchTerm('');
                    setShowFreeInvoices(false);
                  }}
                  className="flex-1"
                >
                  <X className="ml-1 h-4 w-4" />
                  پاک کردن
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="text-lg md:text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">کل فاکتورها</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="text-lg md:text-2xl font-bold text-green-500">
              {filteredInvoices.filter(i => i.status === 'paid').length}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">پرداخت شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="text-lg md:text-2xl font-bold text-red-500">
              {filteredInvoices.filter(i => i.status === 'unpaid').length}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">پرداخت نشده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="text-lg md:text-2xl font-bold">
              {filteredInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0).toLocaleString()}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">مجموع (تومان)</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>فاکتور</TableHead>
                <TableHead className="hidden md:table-cell">مشتری</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead className="hidden sm:table-cell">پرداختی</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="hidden md:table-cell">نوع</TableHead>
                <TableHead className="hidden sm:table-cell">تاریخ</TableHead>
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
                    <TableCell className="font-mono text-xs md:text-sm">
                      <div>{invoice.invoice_number}</div>
                      <div className="text-muted-foreground md:hidden">{invoice.customer?.name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{invoice.customer?.name}</div>
                      <div className="text-xs text-muted-foreground">{invoice.customer?.phone}</div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{Number(invoice.total_amount).toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs md:text-sm">{Number(invoice.paid_amount).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(invoice)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {invoice.is_installment ? 'اقساطی' : 
                        invoice.payment_type === 'online' ? 'آنلاین' :
                        invoice.payment_type === 'card_to_card' ? 'کارت' : 'دستی'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{format(new Date(invoice.created_at), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)} title="مشاهده">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyInvoiceLink(invoice)} title="کپی لینک">
                          <Copy className="h-4 w-4" />
                        </Button>
                        {canEditInvoice(invoice) && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(invoice)} title="ویرایش">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteInvoice(invoice) && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteInvoice(invoice)} className="text-destructive hover:text-destructive" title="حذف">
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
        <DialogContent className="max-w-none w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-0 z-[9999]" dir="rtl">
          <div className="flex flex-col h-[100dvh] max-h-[100dvh] text-right bg-background">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0 relative z-10">
              <div className="flex items-center justify-between flex-row-reverse">
                <Button variant="ghost" size="icon" onClick={() => setIsViewOpen(false)} className="relative z-20">
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
                          <div className="mt-1">{getStatusBadge(selectedInvoice)}</div>
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
        <DialogContent className="max-w-none w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-0 z-[9999]" dir="rtl">
          <div className="flex flex-col h-[100dvh] max-h-[100dvh] text-right bg-background">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0 relative z-10">
              <div className="flex items-center justify-between flex-row-reverse">
                <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(false)} className="relative z-20">
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
        <AlertDialogContent dir="rtl" className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">آیا از حذف فاکتور مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              فاکتور شماره {deleteInvoice?.invoice_number} حذف خواهد شد. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteInvoice();
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountingInvoices;

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Search, Calendar, User, Phone, Mail, X } from 'lucide-react';

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

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  salesAgentId?: number;
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  salesAgentId
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Predefined services
  const predefinedServiceNames = ['ثبت شرکت', 'افتتاح حساب', 'سیم کارت', 'خدمات دیجیتال', 'سایر'];

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
    if (open) {
      fetchData();
    }
  }, [open]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      await ensurePredefinedServices();
      
      const [customersRes, coursesRes, productsRes] = await Promise.all([
        supabase.from('chat_users').select('id, name, phone, email'),
        supabase.from('courses').select('id, title, price').eq('is_active', true),
        supabase.from('products').select('*').eq('is_active', true)
      ]);

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
      // Get agent ID from props or session
      let agentId = salesAgentId;
      if (!agentId) {
        const sessionData = localStorage.getItem('messenger_session');
        const session = sessionData ? JSON.parse(sessionData) : null;
        agentId = session?.user?.id || null;
      }

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
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('خطا در ایجاد فاکتور');
    }
  };

  const resetForm = () => {
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
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setShowCustomerResults(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-none w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-0" dir="rtl">
        <div className="flex flex-col h-[100dvh] max-h-[100dvh] text-right">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-background shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl">ایجاد فاکتور جدید</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
                <X className="h-5 w-5" />
              </Button>
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

              {/* Submit Button */}
              <div className="pb-4 sm:pb-6 space-y-3">
                <Button 
                  className="w-full h-10 sm:h-12 text-base sm:text-lg" 
                  onClick={handleCreateInvoice}
                  disabled={!selectedCustomer || !formData.product_id || !formData.amount}
                >
                  ایجاد فاکتور
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-10 sm:h-12 text-base sm:text-lg" 
                  onClick={handleClose}
                >
                  بستن
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

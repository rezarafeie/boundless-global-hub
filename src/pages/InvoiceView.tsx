import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, CreditCard, Upload, CheckCircle, Clock, XCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_type: string;
  is_installment: boolean;
  notes: string | null;
  created_at: string;
  receipt_url: string | null;
  payment_review_status: string | null;
  rejection_reason: string | null;
  customer?: { name: string; phone: string; email: string | null };
}

interface InvoiceItem {
  id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

const SUPABASE_URL = "https://ihhetvwuhqohbfgkqoxw.supabase.co";

export default function InvoiceView() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Fetch customer
      let customer = null;
      if (invoiceData?.customer_id) {
        const { data: customerData } = await supabase
          .from('chat_users')
          .select('name, phone, email')
          .eq('id', invoiceData.customer_id)
          .single();
        customer = customerData;
      }

      setInvoice({ ...invoiceData, customer } as Invoice);

      // Fetch items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      setItems(itemsData || []);

      // Fetch installments if applicable
      if (invoiceData?.is_installment) {
        const { data: installmentsData } = await supabase
          .from('installments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('installment_number', { ascending: true });
        setInstallments(installmentsData || []);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('خطا در دریافت فاکتور');
    }
    setLoading(false);
  };

  const handleZarinpalPayment = async () => {
    if (!invoice) return;
    setPaymentLoading(true);
    
    try {
      const remainingAmount = Number(invoice.total_amount) - Number(invoice.paid_amount);
      
      // Call Zarinpal payment edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/invoice-zarinpal-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: remainingAmount,
          description: `پرداخت فاکتور ${invoice.invoice_number}`,
          callback_url: `${window.location.origin}/invoice/${invoice.id}/callback`
        })
      });

      const data = await response.json();
      
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'خطا در اتصال به درگاه پرداخت');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'خطا در پرداخت');
    }
    setPaymentLoading(false);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !invoice) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoice.id}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const receiptUrl = `${SUPABASE_URL}/storage/v1/object/public/invoice-receipts/${filePath}`;

      // Update invoice with receipt URL and set status to pending_review
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          receipt_url: receiptUrl,
          payment_review_status: 'pending_review'
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      toast.success('رسید با موفقیت بارگذاری شد. منتظر تایید باشید.');
      fetchInvoice();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('خطا در بارگذاری رسید');
    }
    setUploading(false);
  };

  const getStatusBadge = () => {
    if (!invoice) return null;

    if (invoice.status === 'paid') {
      return <Badge className="bg-green-500 text-lg px-4 py-2"><CheckCircle className="h-4 w-4 mr-2" />پرداخت شده</Badge>;
    }

    if (invoice.payment_review_status === 'pending_review') {
      return <Badge className="bg-yellow-500 text-lg px-4 py-2"><Clock className="h-4 w-4 mr-2" />در انتظار تایید</Badge>;
    }

    if (invoice.payment_review_status === 'rejected') {
      return <Badge className="bg-red-500 text-lg px-4 py-2"><XCircle className="h-4 w-4 mr-2" />رد شده</Badge>;
    }

    if (invoice.status === 'partially_paid') {
      return <Badge className="bg-orange-500 text-lg px-4 py-2"><AlertCircle className="h-4 w-4 mr-2" />پرداخت جزئی</Badge>;
    }

    return <Badge variant="outline" className="text-lg px-4 py-2"><Clock className="h-4 w-4 mr-2" />در انتظار پرداخت</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">فاکتور یافت نشد</h2>
            <p className="text-muted-foreground">لینک فاکتور نامعتبر است یا فاکتور حذف شده است.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingAmount = Number(invoice.total_amount) - Number(invoice.paid_amount);
  const canPay = invoice.status !== 'paid' && invoice.payment_review_status !== 'pending_review';

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">فاکتور {invoice.invoice_number}</CardTitle>
            </div>
            {getStatusBadge()}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">مشتری:</span>
                <p className="font-medium">{invoice.customer?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">تاریخ:</span>
                <p className="font-medium">{format(new Date(invoice.created_at), 'yyyy/MM/dd')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">تلفن:</span>
                <p className="font-medium">{invoice.customer?.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">نوع پرداخت:</span>
                <p className="font-medium">
                  {invoice.is_installment ? 'اقساطی' : 
                    invoice.payment_type === 'online' ? 'آنلاین' :
                    invoice.payment_type === 'card_to_card' ? 'کارت به کارت' : 'دستی'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejection Message */}
        {invoice.payment_review_status === 'rejected' && invoice.rejection_reason && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">رسید پرداخت رد شد</p>
                  <p className="text-sm text-red-600 dark:text-red-500 mt-1">{invoice.rejection_reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">اقلام فاکتور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {Number(item.unit_price).toLocaleString()} تومان
                    </p>
                  </div>
                  <p className="font-bold">{Number(item.total_price).toLocaleString()} تومان</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Installments */}
        {installments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اقساط</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {installments.map(inst => (
                  <div key={inst.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">قسط {inst.installment_number}</p>
                      <p className="text-sm text-muted-foreground">
                        سررسید: {format(new Date(inst.due_date), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{Number(inst.amount).toLocaleString()} تومان</p>
                      <Badge className={inst.status === 'paid' ? 'bg-green-500' : 'bg-gray-500'}>
                        {inst.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>مبلغ کل:</span>
                <span className="font-bold">{Number(invoice.total_amount).toLocaleString()} تومان</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>پرداخت شده:</span>
                <span className="font-bold">{Number(invoice.paid_amount).toLocaleString()} تومان</span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex justify-between text-xl text-red-600 pt-2 border-t">
                  <span>مانده:</span>
                  <span className="font-bold">{remainingAmount.toLocaleString()} تومان</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receipt Preview */}
        {invoice.receipt_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                رسید بارگذاری شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={invoice.receipt_url} 
                alt="رسید پرداخت" 
                className="w-full max-h-96 object-contain rounded-lg border"
              />
            </CardContent>
          </Card>
        )}

        {/* Payment Options */}
        {canPay && remainingAmount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">پرداخت فاکتور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zarinpal Payment */}
              <Button 
                className="w-full h-14 text-lg" 
                onClick={handleZarinpalPayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                پرداخت آنلاین (زرین‌پال)
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">یا</span>
                </div>
              </div>

              {/* Manual Payment */}
              <div className="space-y-3">
                <p className="text-center text-muted-foreground">
                  پرداخت کارت به کارت و بارگذاری رسید
                </p>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">شماره کارت:</p>
                  <p className="text-xl font-mono font-bold tracking-wider">6037-9974-1234-5678</p>
                  <p className="text-sm text-muted-foreground mt-2">به نام: آکادمی رفیعی</p>
                </div>
                
                <div>
                  <Label htmlFor="receipt" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="font-medium">بارگذاری رسید پرداخت</p>
                          <p className="text-sm text-muted-foreground">عکس یا اسکرین‌شات رسید را آپلود کنید</p>
                        </>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptUpload}
                    disabled={uploading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Review Message */}
        {invoice.payment_review_status === 'pending_review' && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6 text-center">
              <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">رسید در حال بررسی است</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                پس از تایید رسید توسط تیم پشتیبانی، وضعیت فاکتور به‌روزرسانی خواهد شد.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {invoice.status === 'paid' && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">فاکتور پرداخت شده است</h3>
              <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                با تشکر از پرداخت شما.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
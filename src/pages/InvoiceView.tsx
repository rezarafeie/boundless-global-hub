import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, CreditCard, Upload, CheckCircle, Clock, XCircle, AlertCircle, 
  Loader2, Image as ImageIcon, Download, Share2, Phone, Mail, MapPin, 
  Calendar, User, Building, Copy, FileImage
} from 'lucide-react';
import { format } from 'date-fns-jalali';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import rafieiLogo from '@/assets/rafiei-invoice-logo.png';

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
  due_date: string | null;
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

// Company info
const COMPANY_INFO = {
  name: 'آکادمی رفیعی',
  phone: '021-28427131',
  email: 'sales@rafiei.co',
  website: 'rafiei.co',
  address: 'تهران , محمودیه , خیابان سالار'
};

export default function InvoiceView() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      setItems(itemsData || []);

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

  const downloadAsPDF = async () => {
    if (!invoiceRef.current || !invoice) return;
    setExporting(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoice.invoice_number}.pdf`);
      toast.success('PDF دانلود شد');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('خطا در ایجاد PDF');
    }
    setExporting(false);
  };

  const downloadAsImage = async () => {
    if (!invoiceRef.current || !invoice) return;
    setExporting(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `invoice-${invoice.invoice_number}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      toast.success('تصویر دانلود شد');
    } catch (error) {
      console.error('Image export error:', error);
      toast.error('خطا در ایجاد تصویر');
    }
    setExporting(false);
  };

  const shareInvoice = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاکتور ${invoice?.invoice_number}`,
          text: `مشاهده فاکتور ${invoice?.invoice_number} - آکادمی رفیعی`,
          url: url
        });
      } catch (error) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('لینک کپی شد');
  };

  const getStatusBadge = () => {
    if (!invoice) return null;

    if (invoice.status === 'paid') {
      return <Badge className="bg-green-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />پرداخت شده</Badge>;
    }

    if (invoice.payment_review_status === 'pending_review') {
      return <Badge className="bg-yellow-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 flex items-center gap-1 w-fit"><Clock className="h-3 w-3 sm:h-4 sm:w-4" />در انتظار تایید</Badge>;
    }

    if (invoice.payment_review_status === 'rejected') {
      return <Badge className="bg-red-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3 sm:h-4 sm:w-4" />رد شده</Badge>;
    }

    if (invoice.status === 'partially_paid') {
      return <Badge className="bg-orange-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />پرداخت جزئی</Badge>;
    }

    return <Badge className="border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm px-2 sm:px-3 py-1 flex items-center gap-1 w-fit"><Clock className="h-3 w-3 sm:h-4 sm:w-4" />در انتظار پرداخت</Badge>;
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'online': return 'آنلاین';
      case 'card_to_card': return 'کارت به کارت';
      case 'manual': return 'دستی';
      default: return type;
    }
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
    <div className="min-h-screen bg-muted/30 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center print:hidden">
          <Button variant="outline" size="sm" onClick={downloadAsPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
            دانلود PDF
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsImage} disabled={exporting}>
            <FileImage className="h-4 w-4 ml-2" />
            دانلود تصویر
          </Button>
          <Button variant="outline" size="sm" onClick={shareInvoice}>
            <Share2 className="h-4 w-4 ml-2" />
            اشتراک‌گذاری
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(window.location.href)}>
            <Copy className="h-4 w-4 ml-2" />
            کپی لینک
          </Button>
        </div>

        {/* Formal Invoice */}
        <div ref={invoiceRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-l from-slate-800 to-slate-900 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-4">
                <img src={rafieiLogo} alt="Logo" className="h-10 w-10 sm:h-16 sm:w-16 object-contain" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold">{COMPANY_INFO.name}</h1>
                  <p className="text-slate-300 text-xs sm:text-sm">{COMPANY_INFO.website}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xl sm:text-3xl font-bold">فاکتور</p>
                <p className="text-slate-300 text-xs sm:text-base">INVOICE</p>
              </div>
            </div>
          </div>

          {/* Invoice Info Bar */}
          <div className="bg-slate-100 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              {/* Status Badge - Mobile first, top right */}
              <div className="order-first sm:order-last self-start sm:self-center">
                {getStatusBadge()}
              </div>
              
              {/* Invoice Details */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div>
                  <p className="text-xs text-slate-500">شماره فاکتور</p>
                  <p className="font-bold text-base sm:text-lg text-slate-800">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">تاریخ صدور</p>
                  <p className="font-medium text-sm sm:text-base text-slate-700">{format(new Date(invoice.created_at), 'yyyy/MM/dd')}</p>
                </div>
                {invoice.due_date && (
                  <div>
                    <p className="text-xs text-slate-500">سررسید</p>
                    <p className="font-medium text-sm sm:text-base text-slate-700">{format(new Date(invoice.due_date), 'yyyy/MM/dd')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Info */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Company Info */}
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-bold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Building className="h-4 w-4" />
                مشخصات فروشنده
              </h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <p className="font-medium text-slate-800">{COMPANY_INFO.name}</p>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3 w-3" />
                  <span>{COMPANY_INFO.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-3 w-3" />
                  <span>{COMPANY_INFO.email}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="h-3 w-3 mt-0.5" />
                  <span>{COMPANY_INFO.address}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-bold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <User className="h-4 w-4" />
                مشخصات خریدار
              </h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <p className="font-medium text-slate-800">{invoice.customer?.name || '-'}</p>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{invoice.customer?.phone || '-'}</span>
                </div>
                {invoice.customer?.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3 w-3" />
                    <span>{invoice.customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="h-3 w-3" />
                  <span>نوع پرداخت: {invoice.is_installment ? 'اقساطی' : getPaymentTypeLabel(invoice.payment_type)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-4 sm:px-6 pb-4 overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs sm:text-sm">
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-right rounded-tr-lg">ردیف</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-right">شرح کالا / خدمات</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">تعداد</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">قیمت واحد</th>
                  <th className="py-2 sm:py-3 px-2 sm:px-4 text-left rounded-tl-lg">مبلغ کل</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-600 text-xs sm:text-sm">{index + 1}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-slate-800 text-xs sm:text-sm">{item.description}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-slate-600 text-xs sm:text-sm">{item.quantity}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-left text-slate-600 text-xs sm:text-sm">{Number(item.unit_price).toLocaleString()} تومان</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-left font-bold text-slate-800 text-xs sm:text-sm">{Number(item.total_price).toLocaleString()} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Installments if applicable */}
          {installments.length > 0 && (
            <div className="px-6 pb-4">
              <h3 className="font-bold text-slate-700 mb-3">جدول اقساط</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-700">
                    <th className="py-2 px-4 text-right">قسط</th>
                    <th className="py-2 px-4 text-center">تاریخ سررسید</th>
                    <th className="py-2 px-4 text-left">مبلغ</th>
                    <th className="py-2 px-4 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst) => (
                    <tr key={inst.id} className="border-b border-slate-100">
                      <td className="py-2 px-4 text-slate-600">قسط {inst.installment_number}</td>
                      <td className="py-2 px-4 text-center text-slate-600">{format(new Date(inst.due_date), 'yyyy/MM/dd')}</td>
                      <td className="py-2 px-4 text-left font-medium">{Number(inst.amount).toLocaleString()} تومان</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${inst.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inst.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="flex justify-end">
              <div className="w-full sm:w-80 bg-slate-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex justify-between text-slate-600 text-sm sm:text-base">
                  <span>جمع کل:</span>
                  <span className="font-medium">{Number(invoice.total_amount).toLocaleString()} تومان</span>
                </div>
                <div className="flex justify-between text-green-600 text-sm sm:text-base">
                  <span>پرداخت شده:</span>
                  <span className="font-medium">{Number(invoice.paid_amount).toLocaleString()} تومان</span>
                </div>
                {remainingAmount > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-base sm:text-lg">
                      <span className="font-bold text-slate-800">مانده قابل پرداخت:</span>
                      <span className="font-bold text-red-600">{remainingAmount.toLocaleString()} تومان</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-4 sm:px-6 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-amber-800"><strong>توضیحات:</strong> {invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-slate-100 px-4 sm:px-6 py-3 sm:py-4 text-center text-xs text-slate-500">
            <p>{COMPANY_INFO.website} | {COMPANY_INFO.email}</p>
          </div>
        </div>

        {/* Rejection Message */}
        {invoice.payment_review_status === 'rejected' && invoice.rejection_reason && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20 print:hidden">
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

        {/* Receipt Preview */}
        {invoice.receipt_url && (
          <Card className="print:hidden">
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
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-lg">پرداخت فاکتور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full h-14 text-lg" 
                onClick={handleZarinpalPayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                ) : (
                  <CreditCard className="h-5 w-5 ml-2" />
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

              <div className="space-y-3">
                <p className="text-center text-muted-foreground">
                  پرداخت کارت به کارت و بارگذاری رسید
                </p>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">شماره کارت:</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('6219861919595958');
                      toast.success('شماره کارت کپی شد');
                    }}
                    className="text-xl font-mono font-bold tracking-wider hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto"
                  >
                    6219-8619-1959-5958
                    <Copy className="h-4 w-4" />
                  </button>
                  <p className="text-sm text-muted-foreground mt-2">به نام: سید عباس رفیعی</p>
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
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 print:hidden">
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
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20 print:hidden">
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

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, ArrowRight, CheckCircle, Clock, XCircle, AlertCircle, Loader2, Image as ImageIcon, Copy, ExternalLink, User, Phone, Mail, Edit, Trash2, Upload } from 'lucide-react';
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
  sales_agent_id: number | null;
  customer?: { name: string; phone: string; email: string | null };
  agent?: { name: string } | null;
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

export default function InvoiceAdmin() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Fetch agent
      let agent = null;
      if (invoiceData?.sales_agent_id) {
        const { data: agentData } = await supabase
          .from('chat_users')
          .select('name')
          .eq('id', invoiceData.sales_agent_id)
          .single();
        agent = agentData;
      }

      setInvoice({ ...invoiceData, customer, agent } as Invoice);

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

  const handleApprovePayment = async () => {
    if (!invoice) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: invoice.total_amount,
          payment_review_status: 'approved'
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success('پرداخت با موفقیت تایید شد');
      fetchInvoice();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('خطا در تایید پرداخت');
    }
    setProcessing(false);
  };

  const handleRejectPayment = async () => {
    if (!invoice || !rejectionReason.trim()) {
      toast.error('لطفا دلیل رد را وارد کنید');
      return;
    }
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          payment_review_status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success('پرداخت رد شد');
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      fetchInvoice();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('خطا در رد پرداخت');
    }
    setProcessing(false);
  };

  const copyInvoiceLink = () => {
    const link = `${window.location.origin}/invoice/${invoice?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('لینک فاکتور کپی شد');
  };

  const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !invoice) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('لطفا فقط فایل تصویری آپلود کنید');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `receipts/${invoice.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-receipts')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('invoice-receipts')
        .getPublicUrl(fileName);

      // Update invoice with receipt URL and set to pending review
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          receipt_url: urlData.publicUrl,
          payment_review_status: 'pending_review'
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      toast.success('رسید با موفقیت آپلود شد');
      fetchInvoice();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('خطا در آپلود رسید');
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = () => {
    if (!invoice) return null;

    if (invoice.status === 'paid') {
      return <Badge className="bg-green-500"><CheckCircle className="h-4 w-4 mr-1" />پرداخت شده</Badge>;
    }

    if (invoice.payment_review_status === 'pending_review') {
      return <Badge className="bg-yellow-500"><Clock className="h-4 w-4 mr-1" />در انتظار تایید</Badge>;
    }

    if (invoice.payment_review_status === 'rejected') {
      return <Badge className="bg-red-500"><XCircle className="h-4 w-4 mr-1" />رد شده</Badge>;
    }

    if (invoice.status === 'partially_paid') {
      return <Badge className="bg-orange-500"><AlertCircle className="h-4 w-4 mr-1" />پرداخت جزئی</Badge>;
    }

    return <Badge variant="outline"><Clock className="h-4 w-4 mr-1" />در انتظار پرداخت</Badge>;
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
            <Button onClick={() => navigate('/enroll/admin')} className="mt-4">
              بازگشت به پنل
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingAmount = Number(invoice.total_amount) - Number(invoice.paid_amount);

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/enroll/admin')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyInvoiceLink}>
              <Copy className="h-4 w-4 ml-1" />
              کپی لینک
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}>
              <ExternalLink className="h-4 w-4 ml-1" />
              مشاهده کاربر
            </Button>
          </div>
        </div>

        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">فاکتور {invoice.invoice_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(invoice.created_at), 'yyyy/MM/dd - HH:mm')}
                  </p>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">مشتری</p>
                  <p className="font-medium">{invoice.customer?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">تلفن</p>
                  <p className="font-medium">{invoice.customer?.phone}</p>
                </div>
              </div>
              {invoice.customer?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ایمیل</p>
                    <p className="font-medium">{invoice.customer?.email}</p>
                  </div>
                </div>
              )}
              {invoice.agent && (
                <div>
                  <p className="text-xs text-muted-foreground">نماینده فروش</p>
                  <p className="font-medium">{invoice.agent.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Review Actions */}
        {invoice.payment_review_status === 'pending_review' && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <Clock className="h-5 w-5" />
                رسید در انتظار تایید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice.receipt_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">رسید بارگذاری شده:</p>
                  <img 
                    src={invoice.receipt_url} 
                    alt="رسید پرداخت" 
                    className="max-w-full max-h-96 object-contain rounded-lg border cursor-pointer"
                    onClick={() => window.open(invoice.receipt_url!, '_blank')}
                  />
                </div>
              )}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprovePayment}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  تایید پرداخت
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setIsRejectDialogOpen(true)}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  رد پرداخت
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipt Preview for Other Statuses */}
        {invoice.receipt_url && invoice.payment_review_status !== 'pending_review' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                رسید پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={invoice.receipt_url} 
                alt="رسید پرداخت" 
                className="max-w-full max-h-96 object-contain rounded-lg border cursor-pointer"
                onClick={() => window.open(invoice.receipt_url!, '_blank')}
              />
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">اقلام فاکتور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2">شرح</th>
                    <th className="text-center py-2">تعداد</th>
                    <th className="text-center py-2">قیمت واحد</th>
                    <th className="text-left py-2">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.description}</td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-center py-3">{Number(item.unit_price).toLocaleString()}</td>
                      <td className="text-left py-3 font-bold">{Number(item.total_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <div className="space-y-2">
                {installments.map(inst => (
                  <div key={inst.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
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
            <div className="space-y-3 max-w-md mr-auto">
              <div className="flex justify-between text-lg">
                <span>مبلغ کل:</span>
                <span className="font-bold">{Number(invoice.total_amount).toLocaleString()} تومان</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>پرداخت شده:</span>
                <span className="font-bold">{Number(invoice.paid_amount).toLocaleString()} تومان</span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex justify-between text-xl text-red-600 pt-3 border-t">
                  <span>مانده:</span>
                  <span className="font-bold">{remainingAmount.toLocaleString()} تومان</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Upload Receipt Section - Only show if not paid */}
        {invoice.status !== 'paid' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                آپلود رسید پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                از این بخش می‌توانید رسید پرداخت مشتری را آپلود کنید.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadReceipt}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    در حال آپلود...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {invoice.receipt_url ? 'تغییر رسید' : 'آپلود رسید'}
                  </>
                )}
              </Button>
              {invoice.receipt_url && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">رسید فعلی:</p>
                  <img
                    src={invoice.receipt_url}
                    alt="رسید پرداخت"
                    className="max-w-full max-h-48 object-contain rounded-lg border cursor-pointer"
                    onClick={() => window.open(invoice.receipt_url!, '_blank')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">یادداشت</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason */}
        {invoice.payment_review_status === 'rejected' && invoice.rejection_reason && (
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">دلیل رد پرداخت</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{invoice.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>رد پرداخت</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>دلیل رد پرداخت</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="دلیل رد پرداخت را وارد کنید..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="flex-1">
                  انصراف
                </Button>
                <Button variant="destructive" onClick={handleRejectPayment} disabled={processing} className="flex-1">
                  {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  رد پرداخت
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Upload, Clock, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ManualPaymentSectionProps {
  course: {
    id: string;
    title: string;
    price: number;
  };
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onPaymentMethodChange: (method: 'zarinpal' | 'manual') => void;
  selectedMethod: 'zarinpal' | 'manual';
}

const ManualPaymentSection: React.FC<ManualPaymentSectionProps> = ({
  course,
  formData,
  onPaymentMethodChange,
  selectedMethod
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showWaitingModal, setShowWaitingModal] = useState(false);

  const bankAccount = {
    number: "6219861919595958",
    bank: "بلو بانک",
    name: "سید عباس رفیعی"
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: "شماره کارت در کلیپ‌بورد کپی شد",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "خطا",
        description: "لطفا فایل تصویری (JPG, PNG, WEBP) آپلود کنید",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطا",
        description: "حجم فایل نباید بیشتر از 5 مگابایت باشد",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
  };

  const submitManualPayment = async () => {
    console.log('submitManualPayment called with:', { 
      uploadedFile: !!uploadedFile, 
      formData,
      course: { id: course.id, title: course.title }
    });

    if (!uploadedFile) {
      toast({
        title: "خطا",
        description: "لطفا رسید پرداخت را آپلود کنید",
        variant: "destructive"
      });
      return;
    }

    // Check if all required form fields are filled
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "خطا",
        description: "لطفا تمام فیلدهای فرم را تکمیل کنید",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      console.log('Starting manual payment submission...');
      
      // Upload receipt to storage
      const fileName = `${Date.now()}_${course.id}_${formData.email.replace(/[^a-zA-Z0-9]/g, '_')}_receipt.${uploadedFile.name.split('.').pop()}`;
      console.log('Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, uploadedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Create enrollment record with manual payment
      const enrollmentData = {
        course_id: course.id,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        payment_amount: course.price,
        payment_status: 'pending',
        payment_method: 'manual',
        manual_payment_status: 'pending' as const,
        receipt_url: publicUrl
      };

      console.log('Creating enrollment with data:', enrollmentData);

      const { data: createdEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single();

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError);
        throw enrollmentError;
      }

      console.log('Enrollment created successfully:', createdEnrollment);

      setShowWaitingModal(true);
      
      toast({
        title: "رسید آپلود شد",
        description: "رسید پرداخت شما با موفقیت ثبت شد و در انتظار تایید است",
      });

      // Reset form
      setUploadedFile(null);
      const fileInput = document.getElementById('receipt') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Manual payment error:', error);
      toast({
        title: "خطا",
        description: `خطا در ثبت پرداخت دستی: ${error.message || 'خطای نامشخص'}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Payment Method Selection */}
      <div className="space-y-4 mb-6">
        <Label className="text-base font-medium">روش پرداخت:</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zarinpal Payment */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedMethod === 'zarinpal' 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onPaymentMethodChange('zarinpal')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  selectedMethod === 'zarinpal' 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {selectedMethod === 'zarinpal' && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="font-medium">پرداخت آنلاین</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    درگاه امن زرین‌پال
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Payment */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedMethod === 'manual' 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onPaymentMethodChange('manual')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  selectedMethod === 'manual' 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {selectedMethod === 'manual' && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="font-medium">کارت به کارت</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    واریز دستی + آپلود رسید
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Payment Details */}
      {selectedMethod === 'manual' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              مشخصات حساب برای واریز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bank Details */}
            <div className="grid gap-4 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">شماره کارت:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold">{bankAccount.number}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankAccount.number)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">بانک:</span>
                <span className="font-medium">{bankAccount.bank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نام صاحب حساب:</span>
                <span className="font-medium">{bankAccount.name}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">مبلغ قابل پرداخت:</span>
                <span className="text-xl font-bold text-primary">{formatPrice(course.price)}</span>
              </div>
            </div>

            {/* Upload Receipt */}
            <div className="space-y-4">
              <Label htmlFor="receipt">آپلود رسید پرداخت:</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploadedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  فایل انتخاب شده: {uploadedFile.name}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                فرمت‌های پشتیبانی شده: JPG, PNG, WEBP (حداکثر 5 مگابایت)
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={submitManualPayment}
              disabled={!uploadedFile || uploading}
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              size="lg"
            >
              {uploading ? (
                <>
                  <Clock className="h-5 w-5 animate-spin ml-2" />
                  در حال آپلود...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 ml-2" />
                  ثبت پرداخت دستی
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Waiting for Approval Modal */}
      <Dialog open={showWaitingModal} onOpenChange={setShowWaitingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">در انتظار تایید</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">رسید پرداخت شما ثبت شد</p>
              <p className="text-sm text-muted-foreground">
                پرداخت شما در حال بررسی است و پس از تایید، لینک دوره برای شما ارسال خواهد شد.
              </p>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              منتظر تایید ادمین
            </Badge>
            <Button
              variant="outline"
              onClick={() => setShowWaitingModal(false)}
              className="w-full"
            >
              متوجه شدم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManualPaymentSection;
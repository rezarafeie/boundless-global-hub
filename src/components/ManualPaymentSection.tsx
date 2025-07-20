
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Upload, Clock, CheckCircle, Copy, AlertCircle, Loader2 } from 'lucide-react';
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
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const validateForm = () => {
    console.log('🔍 Starting form validation...');
    const errors: string[] = [];
    
    if (!formData.firstName?.trim()) {
      errors.push('نام الزامی است');
    }
    if (!formData.lastName?.trim()) {
      errors.push('نام خانوادگی الزامی است');
    }
    if (!formData.email?.trim()) {
      errors.push('ایمیل الزامی است');
    } else if (!formData.email.includes('@')) {
      errors.push('ایمیل معتبر نیست');
    }
    if (!formData.phone?.trim()) {
      errors.push('شماره تلفن الزامی است');
    }
    if (!uploadedFile) {
      errors.push('رسید پرداخت الزامی است');
    }

    console.log('📋 Form validation result:', { 
      errors, 
      formData: {
        firstName: formData.firstName?.trim() || 'empty',
        lastName: formData.lastName?.trim() || 'empty', 
        email: formData.email?.trim() || 'empty',
        phone: formData.phone?.trim() || 'empty'
      },
      hasFile: !!uploadedFile 
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File upload triggered');
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📄 File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      toast({
        title: "خطا",
        description: "لطفا فایل تصویری (JPG, PNG, WEBP) آپلود کنید",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      toast({
        title: "خطا",
        description: "حجم فایل نباید بیشتر از 5 مگابایت باشد",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ File validation passed');
    setUploadedFile(file);
    setValidationErrors(prev => prev.filter(error => !error.includes('رسید')));
    
    toast({
      title: "موفق",
      description: `فایل ${file.name} انتخاب شد`,
    });
  };

  const submitManualPayment = async () => {
    console.log('🚀 Manual payment submission started');
    console.log('📊 Initial state:', { 
      uploadedFile: !!uploadedFile, 
      formData,
      course: { id: course.id, title: course.title }
    });

    // Reset progress and errors
    setProgress(0);
    setCurrentStep('در حال بررسی اطلاعات...');
    setValidationErrors([]);

    try {
      // Step 1: Validate form
      setProgress(10);
      setCurrentStep('بررسی صحت اطلاعات...');
      
      if (!validateForm()) {
        console.error('❌ Form validation failed');
        toast({
          title: "خطا در اعتبارسنجی",
          description: "لطفا خطاهای فرم را برطرف کنید",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Form validation passed');
      setUploading(true);

      // Step 2: Prepare file upload
      setProgress(20);
      setCurrentStep('آماده‌سازی آپلود فایل...');
      
      const fileName = `${Date.now()}_${course.id}_${formData.email.replace(/[^a-zA-Z0-9]/g, '_')}_receipt.${uploadedFile!.name.split('.').pop()}`;
      console.log('📤 Uploading file with name:', fileName);
      
      // Step 3: Upload to Supabase Storage
      setProgress(40);
      setCurrentStep('آپلود رسید...');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, uploadedFile!);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`خطا در آپلود فایل: ${uploadError.message}`);
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Step 4: Get public URL
      setProgress(60);
      setCurrentStep('دریافت لینک فایل...');
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', publicUrl);

      // Step 5: Create enrollment record using edge function
      setProgress(80);
      setCurrentStep('ثبت اطلاعات پرداخت...');
      
      const enrollmentData = {
        course_id: course.id,
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        payment_amount: course.price,
        payment_method: 'manual',
        manual_payment_status: 'pending',
        receipt_url: publicUrl
      };

      console.log('💾 Creating enrollment with data:', enrollmentData);

      // Try edge function first
      let createdEnrollment;
      try {
        console.log('🔧 Attempting edge function call...');
        const { data: functionResult, error: functionError } = await supabase.functions
          .invoke('create-enrollment', {
            body: enrollmentData
          });

        if (functionError) {
          console.error('❌ Edge function error:', functionError);
          throw functionError;
        }

        if (!functionResult?.success) {
          console.error('❌ Edge function returned error:', functionResult);
          throw new Error(functionResult?.error || 'Edge function failed');
        }

        createdEnrollment = functionResult.enrollment;
        console.log('✅ Enrollment created via edge function:', createdEnrollment);

      } catch (functionError) {
        console.warn('⚠️ Edge function failed, trying direct insert:', functionError);
        
        // Fallback to direct insert
        const { data: directResult, error: directError } = await supabase
          .from('enrollments')
          .insert(enrollmentData)
          .select()
          .single();

        if (directError) {
          console.error('❌ Direct insert also failed:', directError);
          throw new Error(`خطا در ثبت اطلاعات: ${directError.message}`);
        }

        createdEnrollment = directResult;
        console.log('✅ Enrollment created via direct insert:', createdEnrollment);
      }

      // Step 6: Complete
      setProgress(100);
      setCurrentStep('تکمیل شد!');

      setTimeout(() => {
        setShowWaitingModal(true);
        
        toast({
          title: "رسید آپلود شد",
          description: "رسید پرداخت شما با موفقیت ثبت شد و در انتظار تایید است",
        });

        // Reset form
        setUploadedFile(null);
        setValidationErrors([]);
        const fileInput = document.getElementById('receipt') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 500);

    } catch (error: any) {
      console.error('❌ Manual payment error:', error);
      setCurrentStep('خطا در پردازش');
      
      toast({
        title: "خطا",
        description: error.message || 'خطای نامشخص در ثبت پرداخت دستی',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (!showWaitingModal) {
        setProgress(0);
        setCurrentStep('');
      }
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
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Progress Indicator */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

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
                disabled={uploading}
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
              onClick={() => {
                console.log('🔘 Submit button clicked!');
                console.log('📊 Current state:', {
                  uploading,
                  validationErrorsLength: validationErrors.length,
                  hasFile: !!uploadedFile,
                  formData
                });
                submitManualPayment();
              }}
              disabled={uploading || validationErrors.length > 0}
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  {currentStep || 'در حال پردازش...'}
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

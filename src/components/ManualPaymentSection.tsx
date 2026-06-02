import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard, FileText, Upload, Loader2, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TetherlandService } from '@/lib/tetherlandService';

interface Course {
  id: string;
  title: string;
  price: number;
  use_dollar_price?: boolean;
  usd_price?: number | null;
}

interface Test {
  id: string;
  title: string;
  price: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

interface ManualPaymentSectionProps {
  course?: Course;
  test?: Test;
  formData: FormData;
  onPaymentMethodChange: (method: 'zarinpal' | 'manual') => void;
  selectedMethod: 'zarinpal' | 'manual';
  finalRialPrice?: number | null; // For dollar-priced courses
  discountedPrice?: number | null; // For discounted price
  salePrice?: number | null; // For sale price
  isOnSale?: boolean; // Sale status
}

const ManualPaymentSection: React.FC<ManualPaymentSectionProps> = ({
  course,
  test,
  formData,
  onPaymentMethodChange,
  selectedMethod,
  finalRialPrice,
  discountedPrice,
  salePrice,
  isOnSale,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.firstName.trim()) {
      errors.push('نام الزامی است');
    }
    if (!formData.lastName.trim()) {
      errors.push('نام خانوادگی الزامی است');
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.push('ایمیل معتبر الزامی است');
    }
    if (!formData.phone.trim()) {
      errors.push('شماره تلفن الزامی است');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "خطا",
        description: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "خطا", 
        description: "فرمت فایل مجاز نیست. لطفا فایل JPG، PNG یا PDF آپلود کنید",
        variant: "destructive"
      });
      return;
    }

    console.log('📁 File upload triggered');
    console.log('📄 File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2)
    });

    setUploadedFile(file);
    console.log('✅ File validation passed');
  };

  const handleManualPaymentSubmit = async () => {
    console.log('🔘 Submit button clicked!');
    console.log('📊 Current state:', {
      uploading,
      validationErrorsLength: validationErrors.length,
      hasFile: !!uploadedFile,
      formData
    });

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    if (!uploadedFile) {
      toast({
        title: "خطا",
        description: "لطفا رسید پرداخت را آپلود کنید",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    console.log('🚀 Manual payment submission started');
    console.log('📊 Initial state:', {
      uploadedFile: !!uploadedFile,
      formData,
      course: course ? { id: course.id, title: course.title } : null,
      test: test ? { id: test.id, title: test.title } : null
    });

    try {
      console.log('🔍 Starting form validation...');
      
      const validationResult = validateForm();
      console.log('📋 Form validation result:', {
        errors: validationErrors,
        formData,
        hasFile: !!uploadedFile
      });

      if (!validationResult) {
        console.log('❌ Form validation failed');
        return;
      }

      console.log('✅ Form validation passed');

      // Create unique filename with timestamp and user info
      const timestamp = Date.now();
      const emailSafe = formData.email.replace(/[@.]/g, '_');
      const fileExtension = uploadedFile.name.split('.').pop();
      const entityId = course?.id || test?.id || 'unknown';
      const fileName = `${timestamp}_${entityId}_${emailSafe}_receipt.${fileExtension}`;

      console.log('📤 Uploading file with name:', fileName);

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, uploadedFile);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', publicUrl);

      // Create enrollment with uploaded receipt
      let paymentAmount: number;
      let enrollmentData: any;

      if (test) {
        // Test enrollment
        paymentAmount = test.price;
        console.log('🧪 MANUAL PAYMENT - Test price:', test.price);
        
        enrollmentData = {
          test_id: test.id,
          user_id: user?.id ? parseInt(user.id) : null,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          payment_amount: paymentAmount,
          enrollment_status: 'pending',
          payment_status: 'pending',
          payment_method: 'manual',
          receipt_url: publicUrl
        };
      } else if (course) {
        // Course enrollment - PRIORITY: Sale price > Discount price > Final Rial price (for USD) > Course price
        paymentAmount = course.price;
        
        if (isOnSale && salePrice !== null) {
          paymentAmount = salePrice;
          console.log('🏷️ MANUAL PAYMENT - Using SALE PRICE:', salePrice);
        } else if (discountedPrice !== null) {
          paymentAmount = discountedPrice;
          console.log('🎯 MANUAL PAYMENT - Using DISCOUNT PRICE:', discountedPrice);
        } else if (finalRialPrice) {
          paymentAmount = finalRialPrice;
          console.log('💱 MANUAL PAYMENT - Using FINAL RIAL PRICE:', finalRialPrice);
        } else {
          console.log('💰 MANUAL PAYMENT - Using BASE PRICE:', course.price);
        }
        
        enrollmentData = {
          course_id: course.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          country_code: formData.countryCode,
          payment_amount: paymentAmount,
          payment_method: 'manual',
          manual_payment_status: 'pending' as const,
          receipt_url: publicUrl,
          chat_user_id: user?.id ? parseInt(user.id) : null
        };
      } else {
        throw new Error('No course or test provided');
      }

      console.log('💾 Creating enrollment with data:', enrollmentData);

      if (test) {
        // Handle test enrollment directly
        const { data: directResult, error: directError } = await supabase
          .from('test_enrollments')
          .insert(enrollmentData)
          .select()
          .single();

        if (directError) {
          console.error('❌ Test enrollment insert failed:', directError);
          throw directError;
        }

        console.log('✅ Test enrollment created:', directResult);
        
        // Redirect to pending page with enrollment ID
        window.location.href = `/enroll/pending?orderId=${directResult.id}&type=test`;
        return;
      } else {
        // Handle course enrollment
        console.log('🔧 Attempting edge function call...');
        
        // Try edge function first
        const { data: edgeResult, error: edgeError } = await supabase.functions
          .invoke('create-enrollment', {
            body: enrollmentData
          });

        if (edgeError) {
          console.warn('⚠️ Edge function failed, trying direct insert:', edgeError);
          
          // Fallback to direct insert
          const { data: directResult, error: directError } = await supabase
            .from('enrollments')
            .insert(enrollmentData)
            .select()
            .single();

          if (directError) {
            console.error('❌ Direct insert also failed:', directError);
            throw directError;
          }

          console.log('✅ Enrollment created via direct insert:', directResult);
          
          // Redirect to pending page with enrollment ID
          window.location.href = `/enroll/pending?orderId=${directResult.id}`;
          return;
        } else {
          console.log('✅ Enrollment created via edge function:', edgeResult.enrollment);
          
          // Redirect to pending page with enrollment ID
          const enrollmentId = edgeResult.enrollment?.id;
          if (enrollmentId) {
            window.location.href = `/enroll/pending?orderId=${enrollmentId}`;
            return;
          }
        }
      }
      
      toast({
        title: "ثبت موفق",
        description: "رسید پرداخت با موفقیت ارسال شد و در انتظار تایید است",
      });

    } catch (error) {
      console.error('❌ Manual payment submission error:', error);
      toast({
        title: "خطا در ثبت",
        description: "خطا در ثبت کارت به کارت. لطفا مجددا تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      console.log('🏁 Manual payment submission completed');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium text-foreground text-right">روش پرداخت</Label>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => onPaymentMethodChange(value as 'zarinpal' | 'manual')}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 space-x-reverse flex-row-reverse">
            <Label 
              htmlFor="zarinpal" 
              className="flex items-center gap-3 cursor-pointer p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors w-full flex-row-reverse text-right"
            >
              <div className="text-right">
                <div className="font-medium text-foreground text-right">پرداخت آنلاین</div>
                <div className="text-sm text-muted-foreground text-right">از طریق درگاه زرین‌پال</div>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </Label>
            <RadioGroupItem value="zarinpal" id="zarinpal" />
          </div>
          <div className="flex items-center space-x-2 space-x-reverse flex-row-reverse">
            <Label 
              htmlFor="manual" 
              className="flex items-center gap-3 cursor-pointer p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors w-full flex-row-reverse text-right"
            >
              <div className="text-right">
                <div className="font-medium text-foreground text-right">کارت به کارت</div>
                <div className="text-sm text-muted-foreground text-right">واریز به حساب و آپلود رسید</div>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </Label>
            <RadioGroupItem value="manual" id="manual" />
          </div>
        </RadioGroup>
      </div>

      {/* Manual Payment Section */}
      {selectedMethod === 'manual' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-800 dark:text-amber-200 text-lg space-y-2">
                 <div className="flex items-center justify-between">
                   <span>مبلغ قابل پرداخت:</span>
                   <span className="text-xl">
                     {test 
                       ? formatPrice(test.price)
                       : isOnSale && salePrice !== null
                         ? formatPrice(salePrice)
                         : discountedPrice !== null 
                           ? formatPrice(discountedPrice)
                            : finalRialPrice 
                              ? TetherlandService.formatIRRAmount(finalRialPrice) + ' تومان'
                             : course ? formatPrice(course.price) : '0 تومان'
                     }
                   </span>
                 </div>
                
                {/* Show USD price if available */}
                {course?.use_dollar_price && course?.usd_price && (
                  <div className="flex items-center justify-between text-sm border-t border-amber-200 pt-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>قیمت اصلی (دلار):</span>
                    </div>
                    <span className="font-medium">
                      {TetherlandService.formatUSDAmount(course.usd_price)}
                    </span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Bank Account Info */}
          <div className="bg-muted/50 rounded-lg p-6 border-2 border-dashed border-primary/20">
            <h4 className="font-semibold text-foreground mb-4">اطلاعات حساب بانکی:</h4>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">نام بانک:</span>
                <span className="font-medium text-foreground">بلوبانک</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">شماره کارت:</span>
                <span className="font-mono font-medium text-foreground">6219861919595958</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">نام صاحب حساب:</span>
                <span className="font-medium text-foreground">سید عباس رفیعی</span>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-foreground">
              آپلود رسید پرداخت <span className="text-destructive">*</span>
            </Label>
            
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                uploadedFile 
                  ? "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700" 
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="receipt-upload"
              />
              <Label htmlFor="receipt-upload" className="cursor-pointer">
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      فایل با موفقیت انتخاب شد
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      کلیک کنید تا رسید پرداخت را آپلود کنید
                    </p>
                    <p className="text-xs text-muted-foreground">
                      فرمت‌های مجاز: JPG, PNG, PDF
                    </p>
                  </div>
                )}
              </Label>
            </div>

            {uploadedFile && (
              <div className="text-sm text-muted-foreground">
                <p>حجم فایل: {(uploadedFile.size / 1024 / 1024).toFixed(2)} مگابایت</p>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">خطاهای فرم:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleManualPaymentSubmit}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={submitting || uploading || !uploadedFile}
          >
            {submitting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin ml-2" />
                در حال ارسال...
              </>
            ) : (
              <>
                <FileText className="h-6 w-6 ml-2" />
                ثبت کارت به کارت
              </>
            )}
          </Button>

          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">راهنمای کارت به کارت</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• مبلغ را به حساب مشخص شده واریز کنید</li>
                  <li>• رسید پرداخت را آپلود کنید</li>
                  <li>• پس از بررسی، دسترسی به دوره فعال می‌شود</li>
                  
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Approval Modal */}
      <Dialog open={showWaitingModal} onOpenChange={setShowWaitingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              در انتظار تایید
            </DialogTitle>
            <DialogDescription>
              پرداخت شما با موفقیت ثبت شد و در انتظار تایید ادمین است.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">ثبت‌نام در حال بررسی</h3>
              <p className="text-muted-foreground text-sm">
                رسید پرداخت شما دریافت شد و در حال بررسی توسط تیم ماست.
              </p>
            </div>
            
            {enrollmentId && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">کد پیگیری:</p>
                <p className="font-mono font-medium text-foreground">{enrollmentId}</p>
              </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">مراحل بعدی:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• بررسی رسید پرداخت</li>
                <li>• ارسال ایمیل تایید</li>
                <li>• فعال‌سازی دسترسی به دوره</li>
              </ul>
            </div>
            
            <Button
              onClick={() => setShowWaitingModal(false)}
              className="w-full"
              variant="outline"
            >
              متوجه شدم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualPaymentSection;
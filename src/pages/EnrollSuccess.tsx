import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EnrollHeader from '@/components/Layout/EnrollHeader';

interface VerificationResult {
  success: boolean;
  refId?: string;
  course?: any;
  enrollment?: any;
  woocommerceOrderId?: number;
  error?: string;
  code?: string;
}

const EnrollSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const courseSlug = searchParams.get('course');
  const email = searchParams.get('email');
  // Handle both 'Authority' (capital A from Zarinpal) and 'authority' (lowercase)
  const authority = searchParams.get('Authority') || searchParams.get('authority');
  const status = searchParams.get('Status') || searchParams.get('status');
  const enrollmentId = searchParams.get('enrollment');

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (authority && enrollmentId && status === 'OK') {
      verifyPayment();
    } else {
      setVerifying(false);
      setResult({
        success: false,
        error: 'پارامترهای پرداخت نامعتبر هستند'
      });
    }
  }, [authority, enrollmentId, status]);

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      
      const response = await supabase.functions.invoke('zarinpal-verify', {
        body: {
          authority,
          enrollmentId
        }
      });

      if (response.error) throw response.error;

      const { data } = response;
      setResult(data);
      
      if (data.success) {
        toast({
          title: "پرداخت موفق",
          description: `ثبت‌نام شما با موفقیت انجام شد. کد رهگیری: ${data.refId}`,
        });
      } else {
        toast({
          title: "خطا در تایید پرداخت",
          description: data.error || "پرداخت تایید نشد",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setResult({
        success: false,
        error: 'خطا در تایید پرداخت'
      });
      toast({
        title: "خطا",
        description: "خطا در تایید پرداخت. لطفا با پشتیبانی تماس بگیرید.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleEnterCourse = () => {
    if (result?.course?.redirect_url) {
      window.open(result.course.redirect_url, '_blank');
    }
  };

  const handleRetry = () => {
    setVerifying(true);
    verifyPayment();
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
              <h2 className="text-xl font-semibold mb-2">در حال تایید پرداخت</h2>
              <p className="text-muted-foreground">
                لطفا صبر کنید، پرداخت شما در حال تایید است...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <EnrollHeader showBackButton={false} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {result?.success ? (
            // Success State
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700 mb-2">
                  🎉 ثبت‌نام موفقیت‌آمیز!
                </CardTitle>
                <p className="text-muted-foreground">
                  پرداخت شما با موفقیت انجام شد و ثبت‌نام تکمیل گردید.
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Payment Details */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">جزئیات پرداخت</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">کد رهگیری:</span>
                      <span className="font-mono font-medium">{result.refId}</span>
                    </div>
                    {result.woocommerceOrderId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">شماره سفارش:</span>
                        <span className="font-mono font-medium">{result.woocommerceOrderId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ایمیل:</span>
                      <span className="font-medium">{email}</span>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                {result.course && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-3">دوره ثبت‌نام شده</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{result.course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.course.description}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">
                        فعال
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleEnterCourse}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
                    size="lg"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    ورود به دوره
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-2">اطلاعات مهم</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• اطلاعات دسترسی به ایمیل شما ارسال شده است</li>
                    <li>• در صورت بروز مشکل با پشتیبانی تماس بگیرید</li>
                    <li>• کد رهگیری را برای پیگیری نگه دارید</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Error State
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-red-700 mb-2">
                  خطا در پرداخت
                </CardTitle>
                <p className="text-muted-foreground">
                  {result?.error || 'پرداخت شما تایید نشد'}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-red-800 mb-2">دلایل احتمالی:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• لغو پرداخت توسط کاربر</li>
                    <li>• عدم موجودی کافی</li>
                    <li>• خطا در درگاه پرداخت</li>
                    <li>• مشکل در اتصال اینترنت</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    تلاش مجدد
                  </Button>
                  <Button
                    onClick={() => window.history.back()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    بازگشت
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">نیاز به کمک؟</p>
                  <p>
                    در صورت برداشت وجه، لطفا با کد رهگیری با پشتیبانی تماس بگیرید.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollSuccess;
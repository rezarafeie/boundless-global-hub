
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useZarinpalPayment } from '@/hooks/useZarinpalPayment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';

const PaymentSuccess = () => {
  const { courseSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, getCoursePrice } = useZarinpalPayment();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [refId, setRefId] = useState<string>('');

  useEffect(() => {
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    if (!authority || !courseSlug) {
      setVerificationStatus('failed');
      return;
    }

    if (status !== 'OK') {
      setVerificationStatus('failed');
      return;
    }

    // Verify payment
    const handleVerification = async () => {
      const amount = getCoursePrice(courseSlug);
      if (!amount) {
        setVerificationStatus('failed');
        return;
      }

      const result = await verifyPayment(authority, amount);
      
      if (result.success) {
        setVerificationStatus('success');
        setRefId(result.ref_id);
        
        // Redirect to course after 3 seconds
        setTimeout(() => {
          navigate(`/start/paid-course?course=${courseSlug}`);
        }, 3000);
      } else {
        setVerificationStatus('failed');
      }
    };

    handleVerification();
  }, [searchParams, courseSlug, verifyPayment, getCoursePrice, navigate]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">در حال تایید پرداخت...</h2>
            <p className="text-gray-600">لطفاً صبر کنید</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2 text-green-600">پرداخت موفق!</h2>
            <p className="text-gray-600 mb-4">دوره شما با موفقیت فعال شد</p>
            {refId && (
              <p className="text-sm text-gray-500 mb-6">
                شماره پیگیری: {refId}
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              در حال انتقال به صفحه دوره...
            </p>
            <Button 
              onClick={() => navigate(`/start/paid-course?course=${courseSlug}`)}
              className="rounded-full"
            >
              ورود به دوره
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2 text-red-600">پرداخت ناموفق</h2>
            <p className="text-gray-600 mb-6">
              متأسفانه پرداخت شما تأیید نشد. لطفاً مجدداً تلاش کنید.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate(`/course/${courseSlug}`)}
                className="rounded-full w-full"
              >
                بازگشت به صفحه دوره
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/support')}
                className="rounded-full w-full"
              >
                تماس با پشتیبانی
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PaymentSuccess;

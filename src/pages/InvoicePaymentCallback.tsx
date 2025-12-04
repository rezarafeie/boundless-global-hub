import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const SUPABASE_URL = "https://ihhetvwuhqohbfgkqoxw.supabase.co";

export default function InvoicePaymentCallback() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const authority = searchParams.get('Authority');
    const zarinpalStatus = searchParams.get('Status');

    if (zarinpalStatus !== 'OK' || !authority) {
      setStatus('failed');
      setMessage('پرداخت توسط کاربر لغو شد');
      return;
    }

    try {
      // Verify payment with edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/invoice-zarinpal-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          authority
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('پرداخت با موفقیت انجام شد');
      } else {
        setStatus('failed');
        setMessage(data.error || 'خطا در تایید پرداخت');
      }
    } catch (error: any) {
      console.error('Verify error:', error);
      setStatus('failed');
      setMessage('خطا در بررسی وضعیت پرداخت');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-bold">در حال بررسی پرداخت...</h2>
              <p className="text-muted-foreground">لطفا صبر کنید</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-xl font-bold text-green-600">{message}</h2>
              <p className="text-muted-foreground">فاکتور شما پرداخت شده است</p>
              <Button onClick={() => navigate(`/invoice/${invoiceId}`)} className="w-full">
                مشاهده فاکتور
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500" />
              <h2 className="text-xl font-bold text-red-600">پرداخت ناموفق</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => navigate(`/invoice/${invoiceId}`)} className="w-full">
                بازگشت به فاکتور
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
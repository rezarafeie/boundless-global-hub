import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PaymentTest: React.FC = () => {
  const [authority, setAuthority] = useState('A000000000000000000000000000xqnznppx');
  const [enrollmentId, setEnrollmentId] = useState('a9f8e27e-7446-42e3-9494-aa67b121d2b6');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testVerification = async () => {
    setLoading(true);
    try {
      console.log('Testing payment verification with:', { authority, enrollmentId });
      
      const response = await supabase.functions.invoke('zarinpal-verify', {
        body: {
          authority,
          enrollmentId
        }
      });

      console.log('Verification response:', response);
      setResult(response);
      
      if (response.error) {
        toast({
          title: "خطا",
          description: response.error.message || 'خطا در تایید پرداخت',
          variant: "destructive"
        });
      } else if (response.data?.success) {
        toast({
          title: "موفق",
          description: "پرداخت تایید شد",
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "خطا",
        description: "خطا در تست تایید پرداخت",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>تست تایید پرداخت زرین‌پال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Authority</label>
            <Input
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              placeholder="وارد کنید authority"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Enrollment ID</label>
            <Input
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              placeholder="وارد کنید enrollment ID"
            />
          </div>
          
          <Button onClick={testVerification} disabled={loading}>
            {loading ? 'در حال تست...' : 'تست تایید پرداخت'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">نتیجه:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTest;
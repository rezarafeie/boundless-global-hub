
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SMSVerificationFormProps {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}

const SMSVerificationForm: React.FC<SMSVerificationFormProps> = ({
  phone,
  onVerified,
  onBack
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { verifySMSCode } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "خطا",
        description: "کد تایید باید 6 رقم باشد",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifySMSCode(phone, code);
      if (result.success) {
        toast({
          title: "موفق",
          description: "شما با موفقیت وارد شدید",
        });
        onVerified();
      } else {
        toast({
          title: "خطا",
          description: result.error || "کد تایید نامعتبر",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تایید کد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          کد تایید به شماره {phone} ارسال شد
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="code">کد تایید</Label>
        <Input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          className="text-center text-xl tracking-widest"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "در حال تایید..." : "تایید کد"}
      </Button>
      
      <Button variant="link" onClick={onBack} className="w-full">
        بازگشت
      </Button>
    </form>
  );
};

export default SMSVerificationForm;

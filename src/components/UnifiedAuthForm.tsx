
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone } from 'lucide-react';

interface UnifiedAuthFormProps {
  courseSlug: string;
  onSuccess?: () => void;
}

const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({ courseSlug, onSuccess }) => {
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { sendSMSVerification, signInWithMagicLink } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contact) {
      toast({
        title: "خطا",
        description: "لطفا ایمیل یا شماره موبایل خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const isEmail = contact.includes('@');
      const isPhone = /^[0-9+\s-()]+$/.test(contact);
      
      if (isEmail) {
        // Send magic link
        const result = await signInWithMagicLink(contact);
        if (result.error) {
          toast({
            title: "خطا",
            description: "خطا در ارسال لینک ورود",
            variant: "destructive",
          });
        } else {
          toast({
            title: "موفق",
            description: "لینک ورود به ایمیل شما ارسال شد",
          });
          if (onSuccess) onSuccess();
        }
      } else if (isPhone) {
        // Send SMS
        const result = await sendSMSVerification(contact);
        if (result.success) {
          toast({
            title: "موفق",
            description: "کد تایید به شماره شما ارسال شد",
          });
          // Redirect to SMS verification page
          window.location.href = `/start/free-course/${courseSlug}?phone=${encodeURIComponent(contact)}`;
        } else {
          toast({
            title: "خطا",
            description: result.error || "خطا در ارسال کد تایید",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "خطا",
          description: "لطفا ایمیل یا شماره موبایل معتبر وارد کنید",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ارسال درخواست",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmail = contact.includes('@');
  const isPhone = /^[0-9+\s-()]+$/.test(contact);

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">دسترسی فوری به دوره</h3>
        <p className="text-gray-600">با ایمیل یا شماره موبایل خود وارد شوید</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact" className="flex items-center gap-2">
            {isEmail ? <Mail size={16} /> : isPhone ? <Phone size={16} /> : null}
            ایمیل یا شماره موبایل
          </Label>
          <Input
            id="contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="example@mail.com یا 09123456789"
            className="text-lg py-3"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "در حال ارسال..." : isEmail ? "ارسال لینک ورود" : isPhone ? "ارسال کد تایید" : "ادامه"}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          با ورود، شرایط استفاده و حریم خصوصی را می‌پذیرید
        </p>
      </form>
    </div>
  );
};

export default UnifiedAuthForm;

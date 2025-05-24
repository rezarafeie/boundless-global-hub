
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Phone, Mail } from "lucide-react";

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

type AuthStep = "contact" | "verification" | "magic-link-sent";

const AuthenticationModal = ({ isOpen, onClose, redirectTo }: AuthenticationModalProps) => {
  const { sendSMSVerification, verifySMSCode, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<AuthStep>("contact");
  const [contact, setContact] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^09\d{9}$/.test(phone);

  const handleContactSubmit = async () => {
    if (!contact) {
      toast({
        title: "خطا",
        description: "لطفاً ایمیل یا شماره موبایل خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    const isContactPhone = isValidPhone(contact);
    const isContactEmail = isValidEmail(contact);

    if (!isContactPhone && !isContactEmail) {
      toast({
        title: "خطا",
        description: "لطفاً ایمیل یا شماره موبایل معتبر وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsPhone(isContactPhone);
    setIsLoading(true);

    if (isContactPhone) {
      // Send SMS verification
      const result = await sendSMSVerification(contact);
      if (result.success) {
        setStep("verification");
        toast({
          title: "کد ارسال شد",
          description: "کد تایید به شماره موبایل شما ارسال شد",
        });
      } else {
        toast({
          title: "خطا",
          description: result.error || "خطا در ارسال کد",
          variant: "destructive",
        });
      }
    } else {
      // Send magic link for email
      const result = await signInWithMagicLink(contact);
      if (result.error) {
        toast({
          title: "خطا",
          description: "خطا در ارسال لینک ورود",
          variant: "destructive",
        });
      } else {
        setStep("magic-link-sent");
        toast({
          title: "لینک ارسال شد",
          description: "لینک ورود به ایمیل شما ارسال شد",
        });
      }
    }

    setIsLoading(false);
  };

  const handleVerificationSubmit = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "خطا",
        description: "کد تایید باید 6 رقم باشد",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await verifySMSCode(contact, verificationCode);
    
    if (result.success) {
      toast({
        title: "موفق",
        description: "ورود موفقیت‌آمیز",
      });
      onClose();
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      }
    } else {
      toast({
        title: "خطا",
        description: result.error || "کد تایید نامعتبر",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setStep("contact");
    setContact("");
    setVerificationCode("");
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            ورود / ثبت نام
          </DialogTitle>
        </DialogHeader>

        {step === "contact" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact">ایمیل یا شماره موبایل</Label>
              <div className="relative">
                <Input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="example@mail.com یا 09123456789"
                  className="pl-10"
                />
                {isValidEmail(contact) ? (
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                ) : isValidPhone(contact) ? (
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                ) : null}
              </div>
            </div>
            <Button 
              onClick={handleContactSubmit} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ادامه
            </Button>
          </div>
        )}

        {step === "verification" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                کد تایید به شماره {contact} ارسال شد
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">کد تایید</Label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="text-center text-xl tracking-wider"
              />
            </div>
            <Button 
              onClick={handleVerificationSubmit} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              تایید
            </Button>
            <Button variant="link" onClick={() => setStep("contact")} className="w-full">
              بازگشت
            </Button>
          </div>
        )}

        {step === "magic-link-sent" && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800 mb-2">لینک ورود ارسال شد</h3>
              <p className="text-sm text-green-700">
                لینک ورود به ایمیل {contact} ارسال شد. روی لینک کلیک کنید تا وارد شوید.
              </p>
            </div>
            <Button variant="link" onClick={() => setStep("contact")} className="w-full">
              بازگشت
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthenticationModal;

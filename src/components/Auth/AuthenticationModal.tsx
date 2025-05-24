
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

type AuthStep = "contact" | "verification" | "registration" | "login";

const AuthenticationModal = ({ isOpen, onClose, redirectTo }: AuthenticationModalProps) => {
  const { signIn, signUp, sendSMSVerification, verifySMSCode } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<AuthStep>("contact");
  const [contact, setContact] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  
  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

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
      // For email, check if user exists (simulation)
      const userExists = Math.random() > 0.5; // In real app, check with API
      setStep(userExists ? "login" : "registration");
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

  const handleRegistration = async () => {
    if (!firstName || !lastName || !password) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدها را پر کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await signUp(contact, password, {
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
    });

    if (result.error) {
      toast({
        title: "خطا",
        description: "خطا در ثبت نام",
        variant: "destructive",
      });
    } else {
      toast({
        title: "موفق",
        description: "ثبت نام موفقیت‌آمیز",
      });
      onClose();
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "خطا",
        description: "لطفاً رمز عبور خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await signIn(contact, password);

    if (result.error) {
      toast({
        title: "خطا",
        description: "ایمیل یا رمز عبور نادرست",
        variant: "destructive",
      });
    } else {
      onClose();
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      }
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setStep("contact");
    setContact("");
    setVerificationCode("");
    setFirstName("");
    setLastName("");
    setPassword("");
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

        {step === "registration" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">نام</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={contact}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل 6 کاراکتر"
              />
            </div>
            <Button 
              onClick={handleRegistration} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ثبت نام
            </Button>
            <Button variant="link" onClick={() => setStep("contact")} className="w-full">
              بازگشت
            </Button>
          </div>
        )}

        {step === "login" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={contact}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور خود را وارد کنید"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ورود
            </Button>
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

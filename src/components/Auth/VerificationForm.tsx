
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface VerificationFormProps {
  method: "email" | "phone";
  contact: string;
  onVerified: (success: boolean) => void;
  onBack: () => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  method,
  contact,
  onVerified,
  onBack
}) => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const { verifyOTP, signIn } = useAuth();
  
  const [code, setCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast({
        title: translations.error || "Error",
        description: translations.invalidCode || "Invalid verification code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Verify the OTP token
      const success = await verifyOTP(
        method === "email" ? contact : null,
        method === "phone" ? contact : null,
        code
      );
      
      // Call the onVerified callback with the result
      onVerified(success);
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setTimeLeft(120);
    
    try {
      // Resend verification code
      await signIn(
        method === "email" ? contact : "",
        method === "phone" ? contact : ""
      );
      
      toast({
        title: translations.codeSent || "Code sent",
        description: method === "email" 
          ? `${translations.codeEmailSent || "Code sent to"} ${contact}` 
          : `${translations.codePhoneSent || "Code sent to"} ${contact}`,
      });
    } catch (error) {
      console.error("Error resending code:", error);
      toast({
        title: translations.error || "Error",
        description: translations.error || "Error resending code",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="font-medium">
          {method === "email" 
            ? `${translations.codeEmailSent || "Code sent to"} ${contact}`
            : `${translations.codePhoneSent || "Code sent to"} ${contact}`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {translations.codeExpires || "Code expires in"} {formatTime(timeLeft)}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">{translations.verify || "Verification Code"}</Label>
          <Input
            id="verificationCode"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            className="text-center text-xl tracking-widest letter-spacing-4"
          />
        </div>
        
        <Button type="submit" className="w-full">{translations.verify || "Verify"}</Button>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="link" 
            onClick={onBack}
            className="text-sm px-0"
          >
            {translations.back || "Back"}
          </Button>
          
          <Button
            variant="link"
            onClick={handleResendCode}
            disabled={timeLeft > 0 && timeLeft < 120 || isResending}
            className="text-sm px-0"
          >
            {isResending ? translations.creating || "Sending..." : translations.resendCode || "Resend Code"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;


import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

interface VerificationFormProps {
  method: "email" | "phone";
  contact: string;
  onVerified: () => void;
  onBack: () => void;
}

const VerificationForm = ({ method, contact, onVerified, onBack }: VerificationFormProps) => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleResendCode = () => {
    toast({
      title: translations.codeSent,
      description: method === "email" 
        ? `${translations.codeEmailSent} ${contact}` 
        : `${translations.codePhoneSent} ${contact}`,
    });
    setTimeLeft(120);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: translations.error,
        description: translations.invalidCode,
        variant: "destructive",
      });
      return;
    }
    
    // Simulate verification API call
    setTimeout(() => {
      toast({
        title: translations.verificationSuccess,
        description: translations.loginSuccess,
      });
      onVerified();
    }, 1000);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-center mb-4">
        {method === "email" 
          ? `${translations.codeEmailSent} ${contact}` 
          : `${translations.codePhoneSent} ${contact}`
        }
      </div>
      
      <InputOTP maxLength={6} value={code} onChange={setCode}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      
      <div className="text-center text-sm">
        {timeLeft > 0 ? (
          <p>{translations.codeExpires} {formatTime()}</p>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleResendCode}
          >
            {translations.resendCode}
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={onBack}
        >
          {translations.back}
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-black hover:bg-gray-800 text-white"
          disabled={code.length !== 6}
        >
          {translations.verify}
        </Button>
      </div>
    </form>
  );
};

export default VerificationForm;

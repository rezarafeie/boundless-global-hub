
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface VerificationFormProps {
  method: "email" | "phone";
  contact: string;
  onVerified: (userExists: boolean) => void;
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
  const [code, setCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast({
        title: translations.error,
        description: translations.invalidCode,
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would validate the code with an API
    // For demo, we'll randomly determine if user exists
    const userExists = Math.random() > 0.5;
    
    toast({
      title: translations.success || "Success",
      description: translations.verificationSuccess,
    });
    
    // Call the onVerified callback with the userExists result
    onVerified(userExists);
  };

  const handleResendCode = () => {
    setIsResending(true);
    setTimeLeft(120);
    
    // Simulate resending the code
    setTimeout(() => {
      setIsResending(false);
      toast({
        title: translations.codeSent,
        description: method === "email" 
          ? `${translations.codeEmailSent} ${contact}`
          : `${translations.codePhoneSent} ${contact}`,
      });
    }, 1500);
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
            ? `${translations.codeEmailSent} ${contact}`
            : `${translations.codePhoneSent} ${contact}`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {translations.codeExpires} {formatTime(timeLeft)}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">{translations.verify}</Label>
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
        
        <Button type="submit" className="w-full">{translations.verify}</Button>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="link" 
            onClick={onBack}
            className="text-sm px-0"
          >
            {translations.back}
          </Button>
          
          <Button
            variant="link"
            onClick={handleResendCode}
            disabled={timeLeft > 0 && timeLeft < 120 || isResending}
            className="text-sm px-0"
          >
            {isResending ? translations.creating : translations.resendCode}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;


import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onRequestVerification: (method: "email" | "phone", contact: string) => void;
}

const LoginForm = ({ onLoginSuccess, onRequestVerification }: LoginFormProps) => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usePassword) {
      // Simulate password login
      // In a real app, this would make an API call to verify credentials
      setTimeout(() => {
        toast({
          title: translations.loginSuccess,
          description: translations.welcomeBack,
        });
        onLoginSuccess();
      }, 1000);
    } else {
      // Request verification code
      const contact = loginMethod === "email" ? email : phone;
      if (!contact) {
        toast({
          title: translations.error,
          description: loginMethod === "email" 
            ? translations.enterEmail 
            : translations.enterPhone,
          variant: "destructive",
        });
        return;
      }
      
      onRequestVerification(loginMethod, contact);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={loginMethod} onValueChange={(v: string) => setLoginMethod(v as "email" | "phone")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">{translations.email}</TabsTrigger>
          <TabsTrigger value="phone">{translations.phone}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">{translations.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required={loginMethod === "email"}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="phone" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{translations.phone}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              required={loginMethod === "phone"}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {usePassword && (
        <div className="space-y-2">
          <Label htmlFor="password">{translations.password}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={usePassword}
          />
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => setUsePassword(!usePassword)}
        >
          {usePassword ? translations.useVerificationCode : translations.usePassword}
        </Button>
      </div>
      
      <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white">
        {usePassword ? translations.login : translations.sendVerificationCode}
      </Button>
    </form>
  );
};

export default LoginForm;

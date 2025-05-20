
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import VerificationForm from "./VerificationForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  isPaid: boolean;
}

type AuthStep = "initial" | "verification" | "registration" | "password";

const AuthModal = ({ isOpen, onClose, courseTitle, isPaid }: AuthModalProps) => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  
  const [authStep, setAuthStep] = useState<AuthStep>("initial");
  const [contactValue, setContactValue] = useState<string>("");
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  
  // Registration form data
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactValue) {
      toast({
        title: translations.error,
        description: translations.enterEmail,
        variant: "destructive",
      });
      return;
    }
    
    // Check if it's an email or phone number
    const isEmail = contactValue.includes('@');
    setVerificationMethod(isEmail ? "email" : "phone");
    
    // Simulate checking if user exists (in a real app, this would be an API call)
    const userExists = Math.random() > 0.5; // Randomly determine if user exists for demo
    
    if (userExists) {
      // User exists, show verification screen
      setAuthStep("verification");
    } else {
      // New user, show registration form
      setAuthStep("registration");
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !password) {
      toast({
        title: translations.error,
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate successful registration (in a real app, this would be an API call)
    toast({
      title: "Success",
      description: translations.registrationSuccess,
    });
    
    // Redirect based on course type
    handleLoginSuccess();
  };

  const handleVerificationSuccess = () => {
    // Successful verification, redirect based on course type
    handleLoginSuccess();
  };
  
  const handleShowPasswordLogin = () => {
    setAuthStep("password");
  };
  
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: translations.error,
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate successful login (in a real app, this would be an API call)
    toast({
      title: "Success",
      description: translations.loginSuccess,
    });
    
    // Redirect based on course type
    handleLoginSuccess();
  };

  const handleLoginSuccess = () => {
    // Redirect based on course type
    if (isPaid) {
      window.location.href = "/course/paid/" + encodeURIComponent(courseTitle);
    } else if (courseTitle) {
      window.location.href = "/course/free/" + encodeURIComponent(courseTitle);
    } else {
      onClose();
    }
  };

  const resetForm = () => {
    setAuthStep("initial");
    setContactValue("");
    setFirstName("");
    setLastName("");
    setPassword("");
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
          <DialogTitle className="text-xl font-bold">
            {courseTitle ? translations.accessCourse : translations.loginRegister}
          </DialogTitle>
          {courseTitle && (
            <DialogDescription>
              {courseTitle} - {isPaid ? translations.paidCoursesTitle : translations.freeCoursesTitle}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {authStep === "initial" && (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact">{translations.enterEmail}</Label>
              <Input 
                id="contact"
                type="text" 
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={translations.email}
              />
            </div>
            <Button type="submit" className="w-full mt-4">{translations.login}</Button>
          </form>
        )}
        
        {authStep === "verification" && (
          <VerificationForm
            method={verificationMethod}
            contact={contactValue}
            onVerified={handleVerificationSuccess}
            onBack={() => setAuthStep("initial")}
          />
        )}
        
        {authStep === "registration" && (
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{translations.firstName}</Label>
              <Input 
                id="firstName"
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={translations.firstName}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">{translations.lastName}</Label>
              <Input 
                id="lastName"
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={translations.lastName}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact">{translations.email}</Label>
              <Input 
                id="contact"
                type="text" 
                value={contactValue}
                readOnly
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{translations.password}</Label>
              <Input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={translations.password}
              />
            </div>
            
            <Button type="submit" className="w-full mt-4">{translations.register}</Button>
            
            <div className="text-center">
              <Button variant="link" onClick={() => setAuthStep("initial")}>
                {translations.back}
              </Button>
            </div>
          </form>
        )}
        
        {authStep === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="text-center mb-4">
              <div className="font-medium">{translations.welcomeBack}</div>
              <div className="text-sm text-muted-foreground">{contactValue}</div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{translations.password}</Label>
              <Input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={translations.password}
              />
            </div>
            
            <Button type="submit" className="w-full mt-4">{translations.login}</Button>
            
            <div className="text-center">
              <Button variant="link" onClick={() => setAuthStep("initial")}>
                {translations.back}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;


import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import VerificationForm from "./VerificationForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
  isPaid?: boolean;
  courseId?: string;
  onSuccess?: () => void;
}

type AuthStep = "initial" | "verification" | "registration" | "password";

const AuthModal = ({ isOpen, onClose, courseTitle, isPaid = false, courseId, onSuccess }: AuthModalProps) => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const { signIn, signUp, activateCourse } = useAuth();
  
  const [authStep, setAuthStep] = useState<AuthStep>("initial");
  const [contactValue, setContactValue] = useState<string>("");
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  
  // Registration form data
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  
  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setAuthStep("initial");
      setContactValue("");
      setFirstName("");
      setLastName("");
    }
  }, [isOpen]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactValue) {
      toast({
        title: translations.error,
        description: translations.enterEmail || "Please enter email or phone",
        variant: "destructive",
      });
      return;
    }
    
    // Check if it's an email or phone number
    const isEmail = contactValue.includes('@');
    setVerificationMethod(isEmail ? "email" : "phone");
    
    // Send verification code
    try {
      await signIn(isEmail ? contactValue : "", !isEmail ? contactValue : "");
      // Always show verification first
      setAuthStep("verification");
    } catch (error) {
      console.error("Error sending verification:", error);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName) {
      toast({
        title: translations.error,
        description: translations.fillAllFields || "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Register new user
      const isEmail = contactValue.includes('@');
      await signUp(
        isEmail ? contactValue : "", 
        !isEmail ? contactValue : "", 
        firstName, 
        lastName
      );
      
      // If there's a course to activate, do it
      if (courseId && courseTitle) {
        await activateCourse(courseId, courseTitle, !!isPaid);
      }
      
      // Close modal and callback
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleVerificationSuccess = async (success: boolean) => {
    if (success) {
      // User exists and is now logged in
      if (courseId && courseTitle) {
        await activateCourse(courseId, courseTitle, !!isPaid);
      }
      
      // Close modal and callback
      onClose();
      if (onSuccess) onSuccess();
    } else {
      // New user, show registration form
      setAuthStep("registration");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {courseTitle ? translations.accessCourse || "Access Course" : translations.loginRegister || "Login / Register"}
          </DialogTitle>
          {courseTitle && (
            <DialogDescription>
              {courseTitle} - {isPaid ? translations.paidCoursesTitle || "Paid Course" : translations.freeCoursesTitle || "Free Course"}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {authStep === "initial" && (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact">{translations.enterEmailOrPhone || "Enter your email or phone number"}</Label>
              <Input 
                id="contact"
                type="text" 
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={translations.emailOrPhonePlaceholder || "example@mail.com | 09123456789"}
              />
            </div>
            <Button type="submit" className="w-full mt-4">{translations.continue || "Continue"}</Button>
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
              <Label htmlFor="firstName">{translations.firstName || "First Name"}</Label>
              <Input 
                id="firstName"
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={translations.firstNamePlaceholder || "First Name"}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">{translations.lastName || "Last Name"}</Label>
              <Input 
                id="lastName"
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={translations.lastNamePlaceholder || "Last Name"}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact">{translations.emailOrPhone || "Email or Phone"}</Label>
              <Input 
                id="contact"
                type="text" 
                value={contactValue}
                readOnly
                className="bg-gray-50"
              />
            </div>
            
            <Button type="submit" className="w-full mt-4">{translations.register || "Register"}</Button>
            
            <div className="text-center">
              <Button variant="link" onClick={() => setAuthStep("initial")}>
                {translations.back || "Back"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

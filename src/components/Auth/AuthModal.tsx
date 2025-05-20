
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import VerificationForm from "./VerificationForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  isPaid: boolean;
}

const AuthModal = ({ isOpen, onClose, courseTitle, isPaid }: AuthModalProps) => {
  const { translations } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [verificationContact, setVerificationContact] = useState<string>("");

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

  const handleSendVerification = (method: "email" | "phone", contact: string) => {
    setVerificationMethod(method);
    setVerificationContact(contact);
    setShowVerification(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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

        {showVerification ? (
          <VerificationForm
            method={verificationMethod}
            contact={verificationContact}
            onVerified={handleLoginSuccess}
            onBack={() => setShowVerification(false)}
          />
        ) : (
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">{translations.login}</TabsTrigger>
              <TabsTrigger value="register">{translations.register}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <LoginForm 
                onLoginSuccess={handleLoginSuccess}
                onRequestVerification={handleSendVerification}
              />
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <RegisterForm 
                onRegisterSuccess={handleLoginSuccess}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;


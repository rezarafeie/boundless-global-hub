
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
  courseSlug?: string;
  isPaid?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  courseTitle, 
  courseSlug,
  isPaid = false 
}) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSuccess = () => {
    onClose();
    
    // Redirect based on course type
    if (courseSlug) {
      if (isPaid) {
        window.location.href = `/checkout/${courseSlug}`;
      } else {
        window.location.href = `/start/free-course/${courseSlug}`;
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLogin ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری'}
          </DialogTitle>
          {courseTitle && (
            <p className="text-center text-sm text-gray-600">
              برای دسترسی به دوره "{courseTitle}"
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {isLogin ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? 'حساب کاربری ندارید؟ ثبت‌نام کنید' : 'حساب کاربری دارید؟ وارد شوید'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

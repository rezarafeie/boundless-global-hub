
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AuthenticationModal from './AuthenticationModal';
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
    <AuthenticationModal 
      isOpen={isOpen}
      onClose={onClose}
      redirectTo={courseSlug ? (isPaid ? `/checkout/${courseSlug}` : `/start/free-course/${courseSlug}`) : undefined}
    />
  );
};

export default AuthModal;

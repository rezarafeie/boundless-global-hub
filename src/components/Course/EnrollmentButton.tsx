
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRafieiAuth } from '@/hooks/useRafieiAuth';
import { RafieiUser } from '@/lib/rafieiAuth';
import RafieiAuth from '@/components/Auth/RafieiAuth';
import { toast } from 'sonner';

interface EnrollmentButtonProps {
  courseId: string;
  courseName: string;
  isFreeCourse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const EnrollmentButton: React.FC<EnrollmentButtonProps> = ({
  courseId,
  courseName,
  isFreeCourse = false,
  className,
  children
}) => {
  const { 
    isAuthOpen, 
    openAuth, 
    closeAuth, 
    handleAuthSuccess,
    isAuthenticated 
  } = useRafieiAuth({
    onSuccess: (user: RafieiUser, token: string) => {
      // Continue with enrollment process
      handleEnrollment();
    },
    enrollmentMode: true
  });

  const handleEnrollment = () => {
    // Here you would implement the actual enrollment logic
    toast.success(`ثبت‌نام در دوره ${courseName} با موفقیت انجام شد`);
  };

  const handleClick = () => {
    if (isAuthenticated) {
      handleEnrollment();
    } else {
      openAuth();
    }
  };

  return (
    <>
      <Button onClick={handleClick} className={className}>
        {children || (isFreeCourse ? 'ثبت‌نام رایگان' : 'ثبت‌نام در دوره')}
      </Button>

      <Dialog open={isAuthOpen} onOpenChange={closeAuth}>
        <DialogContent className="p-0 max-w-md">
          <RafieiAuth
            onSuccess={handleAuthSuccess}
            onCancel={closeAuth}
            enrollmentMode={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnrollmentButton;

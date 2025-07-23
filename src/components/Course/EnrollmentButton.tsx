
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRafieiAuth } from '@/hooks/useRafieiAuth';
import RafieiAuth from '@/components/Auth/RafieiAuth';
import { toast } from 'sonner';
import { activityService } from '@/lib/activityService';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const { 
    isAuthOpen, 
    openAuth, 
    closeAuth, 
    handleAuthSuccess,
    isAuthenticated 
  } = useRafieiAuth({
    onSuccess: (user, token) => {
      // Continue with enrollment process
      handleEnrollment();
    },
    enrollmentMode: true
  });

  const handleEnrollment = async () => {
    // Log enrollment activity
    if (user?.id) {
      await activityService.logActivity(
        Number(user.id),
        'course_enrolled',
        courseId,
        { course_name: courseName }
      );
    }
    
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

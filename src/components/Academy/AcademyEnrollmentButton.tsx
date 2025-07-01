
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAcademyAuth } from '@/contexts/AcademyAuthContext';
import { academyAuth, AcademyCourse } from '@/lib/academyAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AcademyAuth from './AcademyAuth';
import { Loader2, ExternalLink } from 'lucide-react';

interface AcademyEnrollmentButtonProps {
  courseSlug: string;
  className?: string;
  children?: React.ReactNode;
}

const AcademyEnrollmentButton: React.FC<AcademyEnrollmentButtonProps> = ({
  courseSlug,
  className,
  children
}) => {
  const { user } = useAcademyAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [settings, setSettings] = useState({ use_old_auth_system: true, enrollment_enabled: true });
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadCourseAndSettings();
  }, [courseSlug]);

  useEffect(() => {
    if (user && course) {
      checkEnrollmentStatus();
    }
  }, [user, course]);

  const loadCourseAndSettings = async () => {
    try {
      // Load course
      const { data: courseData } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('slug', courseSlug)
        .single();

      if (courseData) {
        setCourse({
          ...courseData,
          features: Array.isArray(courseData.features) ? courseData.features : []
        });
      }

      // Load settings
      const settingsData = await academyAuth.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading course/settings:', error);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user || !course) return;

    try {
      const { data } = await supabase
        .from('academy_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .single();

      setIsEnrolled(!!data);
    } catch (error) {
      // Error means not enrolled
      setIsEnrolled(false);
    }
  };

  const handleEnrollClick = async () => {
    if (!settings.enrollment_enabled) {
      toast({
        title: 'توجه',
        description: 'ثبت‌نام در حال حاضر امکان‌پذیر نیست',
        variant: 'destructive',
      });
      return;
    }

    // Use old auth system (iframe)
    if (settings.use_old_auth_system) {
      window.open('https://auth.rafiei.co', '_blank');
      return;
    }

    // Use new academy system
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!course) {
      toast({
        title: 'خطا',
        description: 'دوره یافت نشد',
        variant: 'destructive',
      });
      return;
    }

    if (isEnrolled) {
      handleAccessCourse();
      return;
    }

    await handleEnrollment();
  };

  const handleEnrollment = async () => {
    if (!user || !course) return;

    setLoading(true);
    try {
      const result = await academyAuth.enrollUserInCourse(user.id, course.id);
      
      if (result.success) {
        setIsEnrolled(true);
        toast({
          title: 'موفقیت',
          description: 'با موفقیت در دوره ثبت‌نام شدید',
        });
        
        // Redirect to course access page
        setTimeout(() => {
          handleAccessCourse();
        }, 1000);
      } else {
        toast({
          title: 'خطا',
          description: result.error || 'خطا در ثبت‌نام',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ثبت‌نام',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCourse = () => {
    if (course?.redirect_after_enroll) {
      window.location.href = course.redirect_after_enroll;
    } else {
      toast({
        title: 'موفقیت',
        description: 'شما در این دوره ثبت‌نام کرده‌اید',
      });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    if (course) {
      handleEnrollment();
    }
  };

  const getButtonText = () => {
    if (settings.use_old_auth_system) {
      return children || 'ثبت‌نام در دوره';
    }
    
    if (!user) {
      return children || 'ثبت‌نام در دوره';
    }
    
    if (isEnrolled) {
      return 'ورود به دوره';
    }
    
    return children || 'ثبت‌نام در دوره';
  };

  const getButtonIcon = () => {
    if (loading) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }
    
    if (settings.use_old_auth_system) {
      return <ExternalLink className="mr-2 h-4 w-4" />;
    }
    
    return null;
  };

  if (!settings.enrollment_enabled) {
    return (
      <Button disabled className={className}>
        ثبت‌نام بسته شده
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleEnrollClick}
        disabled={loading}
        className={className}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت‌نام در دوره</DialogTitle>
          </DialogHeader>
          <AcademyAuth
            courseSlug={courseSlug}
            onSuccess={handleAuthSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AcademyEnrollmentButton;

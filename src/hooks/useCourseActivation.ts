
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useCourseActivation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const activateCourse = async (courseSlug: string, courseType: 'free' | 'paid') => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای دسترسی به دوره ابتدا وارد شوید",
        variant: "destructive",
      });
      return { success: false, needsAuth: true };
    }

    setLoading(true);
    try {
      // Check if course already activated
      const { data: existingCourse } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_slug', courseSlug)
        .single();

      if (existingCourse) {
        // Course already activated, redirect to course page
        const redirectPath = courseType === 'paid' 
          ? `/start/paid-course?course=${courseSlug}`
          : `/start/free-course?course=${courseSlug}`;
        
        window.location.href = redirectPath;
        return { success: true, alreadyActivated: true };
      }

      // Activate new course
      const { error } = await supabase
        .from('user_courses')
        .insert({
          user_id: user.id,
          course_slug: courseSlug,
          course_type: courseType,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "دوره با موفقیت فعال شد",
      });

      // Redirect to course page
      const redirectPath = courseType === 'paid' 
        ? `/start/paid-course?course=${courseSlug}`
        : `/start/free-course?course=${courseSlug}`;
      
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1000);

      return { success: true };
    } catch (error) {
      console.error('Course activation error:', error);
      toast({
        title: "خطا",
        description: "خطا در فعال‌سازی دوره",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const activateTest = async (testSlug: string) => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای دسترسی به تست ابتدا وارد شوید",
        variant: "destructive",
      });
      return { success: false, needsAuth: true };
    }

    setLoading(true);
    try {
      // Check if test already activated
      const { data: existingTest } = await supabase
        .from('user_tests')
        .select('*')
        .eq('user_id', user.id)
        .eq('test_slug', testSlug)
        .single();

      if (existingTest) {
        toast({
          title: "اطلاع",
          description: "شما قبلاً این تست را انجام داده‌اید",
        });
        return { success: true, alreadyActivated: true };
      }

      // Activate new test
      const { error } = await supabase
        .from('user_tests')
        .insert({
          user_id: user.id,
          test_slug: testSlug,
          status: 'started'
        });

      if (error) throw error;

      toast({
        title: "موفق",
        description: "تست با موفقیت فعال شد",
      });

      return { success: true };
    } catch (error) {
      console.error('Test activation error:', error);
      toast({
        title: "خطا",
        description: "خطا در فعال‌سازی تست",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const activateAssistant = async () => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای دسترسی به دستیار ابتدا وارد شوید",
        variant: "destructive",
      });
      return { success: false, needsAuth: true };
    }

    setLoading(true);
    try {
      // Check if assistant already activated
      const { data: existingAssistant } = await supabase
        .from('user_assistant')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingAssistant) {
        // Update last used
        await supabase
          .from('user_assistant')
          .update({ 
            last_used: new Date().toISOString(),
            usage_count: (existingAssistant.usage_count || 0) + 1
          })
          .eq('user_id', user.id);
      } else {
        // Create new assistant record
        await supabase
          .from('user_assistant')
          .insert({
            user_id: user.id,
            is_enabled: true,
            usage_count: 1
          });
      }

      toast({
        title: "موفق",
        description: "دستیار هوشمند فعال شد",
      });

      // Open AI assistant
      window.open('https://ai.rafiei.co', '_blank');

      return { success: true };
    } catch (error) {
      console.error('Assistant activation error:', error);
      toast({
        title: "خطا",
        description: "خطا در فعال‌سازی دستیار",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    activateCourse,
    activateTest,
    activateAssistant,
    loading
  };
};


import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CoursePrice {
  [key: string]: number;
}

const COURSE_PRICES: CoursePrice = {
  'boundless': 2500000, // 2.5 million toman
  'instagram': 1500000, // 1.5 million toman
  'wealth': 2000000, // 2 million toman
  'metaverse': 3000000, // 3 million toman
};

export const useZarinpalPayment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (courseSlug: string) => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای خرید دوره ابتدا وارد شوید",
        variant: "destructive",
      });
      return { success: false, needsAuth: true };
    }

    setLoading(true);
    try {
      // Get user profile for additional info
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const amount = COURSE_PRICES[courseSlug];
      if (!amount) {
        throw new Error('قیمت دوره مشخص نشده');
      }

      const { data, error } = await supabase.functions.invoke('zarinpal-request', {
        body: {
          courseSlug,
          amount,
          userEmail: user.email,
          userMobile: profile?.phone || '',
          userName: profile?.full_name || user.email
        }
      });

      if (error) throw error;

      if (data.success) {
        // Redirect to Zarinpal
        window.location.href = data.paymentUrl;
        return { success: true };
      } else {
        throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "خطا",
        description: "خطا در شروع فرآیند پرداخت",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (authority: string, amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('zarinpal-verify', {
        body: { authority, amount }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    initiatePayment,
    verifyPayment,
    loading,
    getCoursePrice: (courseSlug: string) => COURSE_PRICES[courseSlug]
  };
};

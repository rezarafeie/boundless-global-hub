import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';

interface Webinar {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  webinar_link: string;
  description: string | null;
  created_at: string;
}

interface SignupFormData {
  mobile_number: string;
}

const WebinarLanding: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SignupFormData>();

  useEffect(() => {
    if (slug) {
      fetchWebinar();
    }
  }, [slug]);

  const fetchWebinar = async () => {
    try {
      const { data, error } = await supabase
        .from('webinar_entries')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setWebinar(null);
        } else {
          throw error;
        }
      } else {
        setWebinar(data);
      }
    } catch (error) {
      console.error('Error fetching webinar:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات وبینار",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const validateIranianMobile = (value: string) => {
    // Remove spaces and special characters
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    
    // Check Iranian mobile number patterns
    const iranianMobileRegex = /^(\+98|0098|98|0)?9[0-9]{9}$/;
    
    if (!iranianMobileRegex.test(cleaned)) {
      return 'شماره موبایل وارد شده معتبر نمی‌باشد';
    }
    
    return true;
  };

  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove country code prefixes
    if (cleaned.startsWith('98')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0098')) {
      cleaned = cleaned.substring(4);
    }
    
    // Add leading 0 if not present
    if (!cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '0' + cleaned;
    }
    
    return cleaned;
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!webinar) return;
    
    setSubmitting(true);
    
    try {
      const normalizedPhone = normalizePhoneNumber(data.mobile_number);
      
      // Check if already registered
      const { data: existingSignup, error: checkError } = await supabase
        .from('webinar_signups')
        .select('id')
        .eq('webinar_id', webinar.id)
        .eq('mobile_number', normalizedPhone)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSignup) {
        toast({
          title: "اطلاع",
          description: "این شماره قبلاً در وبینار ثبت‌نام شده است",
          variant: "default"
        });
        // Still redirect to webinar
        window.location.href = webinar.webinar_link;
        return;
      }

      // Insert new signup
      const { error: insertError } = await supabase
        .from('webinar_signups')
        .insert([{
          webinar_id: webinar.id,
          mobile_number: normalizedPhone
        }]);

      if (insertError) throw insertError;

      toast({
        title: "موفقیت",
        description: "در حال انتقال به وبینار...",
      });
      
      // Redirect to webinar link
      setTimeout(() => {
        window.location.href = webinar.webinar_link;
      }, 1000);

    } catch (error) {
      console.error('Error submitting signup:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!webinar) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardContent className="p-8 text-center space-y-6">
            {/* Website Logo */}
            <div className="w-20 h-20 mx-auto mb-2">
              <img 
                src="/lovable-uploads/f3ccf762-5b2a-4b10-bd9c-c03d041733c0.png" 
                alt="Website Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {webinar.title}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(webinar.start_date).toLocaleDateString('fa-IR', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('mobile_number', {
                      required: 'شماره موبایل الزامی است',
                      validate: validateIranianMobile
                    })}
                    type="tel"
                    placeholder="09123456789"
                    className="pr-10 text-left text-center text-lg"
                    dir="ltr"
                  />
                </div>
                {errors.mobile_number && (
                  <p className="text-sm text-destructive">
                    {errors.mobile_number.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold" 
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال پردازش...
                  </div>
                ) : (
                  'ورود به وبینار'
                )}
              </Button>
            </form>

            {/* Instructions */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              شماره تلفن خود را وارد کنید و روی دکمه ورود به وبینار بزنید و در صفحه باز شده روی دکمه ورود به عنوان میهمان کلیک کنید
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebinarLanding;
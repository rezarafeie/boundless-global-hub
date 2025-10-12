import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Calendar, Video, CheckCircle, ExternalLink } from 'lucide-react';
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
  telegram_channel_link: string | null;
  created_at: string;
}

interface RegistrationFormData {
  mobile_number: string;
}

const WebinarRegistration: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormData>();

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
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    const iranianMobileRegex = /^(\+98|0098|98|0)?9[0-9]{9}$/;
    
    if (!iranianMobileRegex.test(cleaned)) {
      return 'شماره موبایل وارد شده معتبر نمی‌باشد';
    }
    
    return true;
  };

  const normalizePhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('98')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0098')) {
      cleaned = cleaned.substring(4);
    }
    
    if (!cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '0' + cleaned;
    }
    
    return cleaned;
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (!webinar) return;
    
    setSubmitting(true);
    
    try {
      const normalizedPhone = normalizePhoneNumber(data.mobile_number);
      
      // Check if already registered
      const { data: existingReg, error: checkError } = await supabase
        .from('webinar_registrations')
        .select('id')
        .eq('webinar_id', webinar.id)
        .eq('mobile_number', normalizedPhone)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingReg) {
        toast({
          title: "اطلاع",
          description: "این شماره قبلاً در وبینار ثبت‌نام شده است",
          variant: "default"
        });
        setRegistrationSuccess(true);
        return;
      }

      // Insert new registration
      const { error: insertError } = await supabase
        .from('webinar_registrations')
        .insert([{
          webinar_id: webinar.id,
          mobile_number: normalizedPhone
        }]);

      if (insertError) throw insertError;

      setRegistrationSuccess(true);
      
      toast({
        title: "موفقیت",
        description: "ثبت‌نام شما با موفقیت انجام شد",
      });

    } catch (error) {
      console.error('Error submitting registration:', error);
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

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  ثبت‌نام موفق!
                </h1>
                <p className="text-muted-foreground">
                  ثبت‌نام شما در وبینار با موفقیت انجام شد
                </p>
              </div>

              {webinar.telegram_channel_link && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    برای دریافت اطلاعات بیشتر، به کانال تلگرام ما بپیوندید:
                  </p>
                  <Button 
                    asChild
                    className="w-full"
                    size="lg"
                  >
                    <a 
                      href={webinar.telegram_channel_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      ورود به کانال تلگرام
                    </a>
                  </Button>
                </div>
              )}

              <div className="pt-4">
                <Link to={`/webinar/${webinar.slug}/login`}>
                  <Button variant="outline" className="w-full">
                    ورود به وبینار
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardContent className="p-8 md:p-12 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Video className="h-10 w-10 text-primary" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {webinar.title}
              </h1>
              
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span className="text-lg">
                  {new Date(webinar.start_date).toLocaleDateString('fa-IR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {' • '}
                  {new Date(webinar.start_date).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Description */}
            {webinar.description && (
              <div className="bg-muted/30 rounded-lg p-6">
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-center">
                  {webinar.description}
                </p>
              </div>
            )}

            {/* Registration Form */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-foreground">
                ثبت‌نام در وبینار
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...register('mobile_number', {
                        required: 'شماره موبایل الزامی است',
                        validate: validateIranianMobile
                      })}
                      type="tel"
                      placeholder="09123456789"
                      className="pr-10 h-12 text-lg"
                      dir="ltr"
                    />
                  </div>
                  {errors.mobile_number && (
                    <p className="text-sm text-destructive text-center">
                      {errors.mobile_number.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold" 
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      در حال پردازش...
                    </div>
                  ) : (
                    'ثبت‌نام در وبینار'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  قبلاً ثبت‌نام کرده‌اید؟{' '}
                  <Link 
                    to={`/webinar/${webinar.slug}/login`} 
                    className="text-primary hover:underline font-medium"
                  >
                    ورود به وبینار
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebinarRegistration;
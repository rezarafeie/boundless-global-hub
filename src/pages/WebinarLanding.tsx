import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, ArrowLeft, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import WebinarCountdown from '@/components/WebinarCountdown';
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
  const [signupCount, setSignupCount] = useState(0);
  
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
        fetchSignupCount(data.id);
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

  const fetchSignupCount = async (webinarId: string) => {
    try {
      const { count, error } = await supabase
        .from('webinar_signups')
        .select('*', { count: 'exact', head: true })
        .eq('webinar_id', webinarId);

      if (error) throw error;
      setSignupCount(count || 0);
    } catch (error) {
      console.error('Error fetching signup count:', error);
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
        description: "ثبت‌نام شما با موفقیت انجام شد. در حال انتقال به وبینار...",
      });

      // Update signup count
      setSignupCount(prev => prev + 1);
      
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!webinar) {
    return <Navigate to="/404" replace />;
  }

  const isWebinarStarted = new Date(webinar.start_date) <= new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <Badge variant="secondary" className="mb-4">
            <Calendar className="h-3 w-3 ml-1" />
            وبینار آنلاین
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl lg:text-3xl font-bold text-right">
                  {webinar.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {webinar.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">درباره این وبینار</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {webinar.description}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">زمان برگزاری</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(webinar.start_date).toLocaleDateString('fa-IR', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">تعداد ثبت‌نام</p>
                      <p className="text-sm text-muted-foreground">
                        {signupCount.toLocaleString('fa-IR')} نفر
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Countdown & Signup */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown */}
            {!isWebinarStarted && (
              <WebinarCountdown endDate={webinar.start_date} />
            )}

            {/* Signup Form */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-primary">
                  {isWebinarStarted ? 'ورود به وبینار' : 'ثبت‌نام در وبینار'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isWebinarStarted 
                    ? 'برای ورود به وبینار شماره موبایل خود را وارد کنید'
                    : 'شماره موبایل خود را وارد کنید تا از شروع وبینار مطلع شوید'
                  }
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...register('mobile_number', {
                          required: 'شماره موبایل الزامی است',
                          validate: validateIranianMobile
                        })}
                        type="tel"
                        placeholder="09123456789"
                        className="pr-10 text-left"
                        dir="ltr"
                      />
                    </div>
                    {errors.mobile_number && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.mobile_number.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        در حال پردازش...
                      </div>
                    ) : (
                      isWebinarStarted ? 'ورود به وبینار' : 'ثبت‌نام و ورود'
                    )}
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-xs text-muted-foreground">
                    با ثبت‌نام، شما با {' '}
                    <span className="text-primary">قوانین و مقررات</span>
                    {' '} موافقت می‌کنید
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4 text-center">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {signupCount.toLocaleString('fa-IR')}
                    </div>
                    <div className="text-xs text-muted-foreground">ثبت‌نام شده</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">رایگان</div>
                    <div className="text-xs text-muted-foreground">شرکت در وبینار</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarLanding;
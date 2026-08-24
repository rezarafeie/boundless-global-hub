import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Calendar, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { enhancedWebhookManager } from '@/lib/enhancedWebhookManager';
import { consumeWebinarLoginToken, getWlTokenFromUrl, clearWlFromUrl } from '@/lib/webinarAutoLogin';
import { enterWebinarLocally, normalizeWebinarPhone } from '@/lib/webinarEntryQueue';
import { readCachedParticipant, writeCachedWebinar } from '@/lib/webinarCache';


interface Webinar {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  webinar_link: string;
  description: string | null;
  created_at: string;
  status: string;
  login_method: string;
}

interface SignupFormData {
  mobile_number: string;
  display_name: string;
}

const normalizePhoneNumber = normalizeWebinarPhone;

const WebinarLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigateTo = useNavigate();
  const { toast } = useToast();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SignupFormData>();

  useEffect(() => {
    if (slug) fetchWebinar();
  }, [slug]);

  // One-click auto-login coming from Telegram (?wl=TOKEN)
  useEffect(() => {
    const wl = getWlTokenFromUrl();
    if (!wl) return;
    let cancelled = false;
    (async () => {
      const res = await consumeWebinarLoginToken(wl);
      clearWlFromUrl();
      if (cancelled || !res) return;
      window.location.href = `/webinar/${res.slug || slug}/live`;
    })();
    return () => { cancelled = true; };
  }, [slug]);


  // Already entered? Decided purely from the local record — no Supabase call.
  useEffect(() => {
    if (!webinar || webinar.login_method !== 'interactive') return;
    const cached = readCachedParticipant(webinar.id);
    if (cached) window.location.href = `/webinar/${slug}/live`;
  }, [webinar, slug]);

  const fetchWebinar = async () => {
    try {
      const { data, error } = await supabase
        .from('webinar_entries')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') setWebinar(null);
        else throw error;
      } else {
        setWebinar(data);
        writeCachedWebinar(data as any);
      }
    } catch (error) {
      console.error('Error fetching webinar:', error);
      toast({ title: "خطا", description: "خطا در دریافت اطلاعات وبینار", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!webinar) return;
    setSubmitting(true);

    try {
      // Local-first entry: the viewer is admitted from a local record with no
      // network round-trip. A background job syncs entries every 5 minutes.
      enterWebinarLocally({
        webinarId: webinar.id,
        webinarSlug: webinar.slug,
        webinarTitle: webinar.title,
        webinarStartDate: webinar.start_date,
        phone: data.mobile_number,
        displayName: data.display_name || null,
      });

      toast({ title: "موفقیت", description: "در حال انتقال..." });

      if (webinar.login_method === 'interactive') {
        navigateTo(`/webinar/${slug}/live`, { replace: true });
      } else {
        window.location.href = webinar.webinar_link;
      }
    } catch (error) {
      console.error('Error submitting signup:', error);
      toast({ title: "خطا", description: "خطا در ورود. لطفاً دوباره تلاش کنید", variant: "destructive" });
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

  if (!webinar) return <Navigate to="/404" replace />;

  const isLive = webinar.status === 'live';
  const isInteractive = webinar.login_method === 'interactive';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Video className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{webinar.title}</h1>
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
              {isLive && isInteractive && (
                <span className="inline-block bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">🔴 پخش زنده</span>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('mobile_number', {
                      required: 'شماره تلفن الزامی است',
                      validate: (value) => {
                        const cleaned = value.replace(/[^\d+]/g, '');
                        if (cleaned.length < 8) return 'شماره تلفن باید حداقل ۸ رقم باشد';
                        return true;
                      }
                    })}
                    type="tel"
                    placeholder="+989123456789"
                    className="pr-10 text-left text-center text-lg"
                    dir="ltr"
                  />
                </div>
                {errors.mobile_number && (
                  <p className="text-sm text-destructive">{errors.mobile_number.message}</p>
                )}
              </div>

              {isInteractive && (
                <div>
                  <Input
                    {...register('display_name')}
                    placeholder="نام نمایشی (اختیاری)"
                    dir="rtl"
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال پردازش...
                  </div>
                ) : isInteractive ? (
                  'ورود به پخش زنده'
                ) : (
                  'ورود به وبینار'
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {isInteractive
                ? 'شماره تلفن خود را وارد کنید تا وارد صفحه پخش زنده شوید'
                : 'شماره تلفن خود را وارد کنید و روی دکمه ورود به وبینار بزنید و در صفحه باز شده روی دکمه ورود به عنوان میهمان کلیک کنید'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebinarLogin;

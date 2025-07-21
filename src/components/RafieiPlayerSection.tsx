
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Download, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RafieiPlayerSectionProps {
  enrollment: {
    id: string;
    course_id: string;
    payment_amount: number;
    created_at: string;
    full_name: string;
    phone: string;
    spotplayer_license_id?: string;
    spotplayer_license_key?: string;
    spotplayer_license_url?: string;
  } | undefined;
  course: {
    id: string;
    title: string;
    description?: string;
    redirect_url?: string;
    is_spotplayer_enabled?: boolean;
    spotplayer_course_id?: string;
  } | undefined;
}

const RafieiPlayerSection: React.FC<RafieiPlayerSectionProps> = ({ enrollment, course }) => {
  const [isCreatingLicense, setIsCreatingLicense] = useState(false);
  const [licenseData, setLicenseData] = useState<{
    license_id?: string;
    license_key?: string;
    license_url?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();

  // Load existing license data on component mount
  useEffect(() => {
    if (enrollment?.spotplayer_license_id && enrollment?.spotplayer_license_key) {
      setLicenseData({
        license_id: enrollment.spotplayer_license_id,
        license_key: enrollment.spotplayer_license_key,
        license_url: enrollment.spotplayer_license_url
      });
    }
  }, [enrollment]);

  const createLicense = async () => {
    if (!enrollment || !course) {
      toast({
        title: "خطا",
        description: "اطلاعات ثبت‌نام یا دوره یافت نشد.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingLicense(true);
    
    try {
      console.log('Sending license creation request with data:', {
        enrollmentId: enrollment.id,
        userFullName: enrollment.full_name,
        userPhone: enrollment.phone,
        courseId: enrollment.course_id
      });

      const { data, error } = await supabase.functions.invoke('create-spotplayer-license', {
        body: {
          enrollmentId: enrollment.id,
          userFullName: enrollment.full_name,
          userPhone: enrollment.phone,
          courseId: enrollment.course_id
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('License creation response:', data);

      if (data?.success) {
        const newLicenseData = {
          license_id: data.license.id,
          license_key: data.license.key,
          license_url: data.license.url
        };
        
        setLicenseData(newLicenseData);
        
        // Update the enrollment in database
        await supabase
          .from('enrollments')
          .update({
            spotplayer_license_id: data.license.id,
            spotplayer_license_key: data.license.key,
            spotplayer_license_url: data.license.url
          })
          .eq('id', enrollment.id);
        
        toast({
          title: "لایسنس و شروع آموزش ایجاد شد",
          description: "لایسنس شما با موفقیت ایجاد شد و آماده استفاده است.",
        });
      } else {
        throw new Error(data?.error || 'خطا در ایجاد لایسنس');
      }
    } catch (error) {
      console.error('License creation error:', error);
      toast({
        title: "خطا در ایجاد لایسنس",
        description: "متأسفانه در ایجاد لایسنس خطایی رخ داد. لطفاً مجدداً تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLicense(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "کپی شد",
        description: "کد لایسنس در کلیپ‌بورد کپی شد.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "خطا",
        description: "امکان کپی کردن وجود ندارد",
        variant: "destructive",
      });
    }
  };

  const handlePlayerClick = () => {
    window.open('https://app.rafeie.com/player/', '_blank');
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-purple-50/80 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-purple-950/40 backdrop-blur-sm">
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10" />
      
      <CardHeader className="relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-purple-700 dark:text-purple-300 text-xl md:text-2xl font-bold">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 flex items-center justify-center border-2 border-purple-200 dark:border-purple-700">
              <Play className="h-6 w-6" />
            </div>
            رفیعی پلیر
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-sm px-3 py-1">
              <Download className="h-4 w-4 ml-1" />
              دانلود دائمی
            </Badge>
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 text-sm px-3 py-1">
              کیفیت عالی
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <div className="bg-white/80 dark:bg-black/30 rounded-2xl p-6 border border-purple-100 dark:border-purple-800 shadow-lg backdrop-blur-sm">
          <h4 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
            ⭐ مزایای رفیعی پلیر
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">دانلود دوره برای تماشای آفلاین</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">دسترسی دائمی و بدون انقضا</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">کیفیت تصویر عالی</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">پشتیبانی از تمامی پلتفرم‌ها</span>
            </div>
          </div>
        </div>

        {licenseData?.license_key ? (
          <div className="space-y-4">
            {/* License Box */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 rounded-xl p-4 border-2 border-green-200 dark:border-green-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">لایسنس فعال</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-xs">
                  آماده استفاده
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-green-700 dark:text-green-300 block mb-2">
                  🔑 کد لایسنس شما:
                </label>
                <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-green-200 dark:border-green-800 p-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-200 px-3 py-2 rounded-md text-sm font-mono border border-green-200 dark:border-green-700 break-all overflow-hidden">
                      {licenseData.license_key}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(licenseData.license_key!)}
                    className="w-full mt-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 hover:border-green-400 dark:hover:border-green-600"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 ml-2" />
                        کپی شد ✓
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 ml-2" />
                        کپی کردن لایسنس
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePlayerClick}
              className="w-full h-14 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:from-purple-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 text-base font-semibold"
              size="lg"
            >
              <Play className="ml-3 h-5 w-5" />
              <span className="flex-1 text-center">🎬 ورود به رفیعی پلیر و شروع آموزش</span>
              <ExternalLink className="mr-3 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={createLicense}
            disabled={isCreatingLicense}
            className="w-full h-14 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:from-purple-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 text-base font-semibold disabled:opacity-50"
          >
            {isCreatingLicense ? (
              <>
                <Loader2 className="ml-3 h-5 w-5 animate-spin" />
                <span className="flex-1 text-center">در حال ایجاد لایسنس...</span>
              </>
            ) : (
              <>
                <Download className="ml-3 h-5 w-5" />
                <span className="flex-1 text-center">🚀 ایجاد لایسنس و شروع آموزش</span>
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RafieiPlayerSection;

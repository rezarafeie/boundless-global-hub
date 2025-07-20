
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
          title: "لایسنس رفیعی پلیر ایجاد شد",
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
    <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Play className="h-5 w-5" />
            رفیعی پلیر
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
            <Download className="h-3 w-3 ml-1" />
            دانلود دائمی
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">مزایای رفیعی پلیر:</h4>
          <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
            <li>• دانلود دوره برای تماشای آفلاین</li>
            <li>• دسترسی دائمی و بدون انقضا</li>
            <li>• کیفیت تصویر عالی</li>
            <li>• پشتیبانی از تمامی پلتفرم‌ها</li>
          </ul>
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
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
              size="lg"
            >
              <Play className="ml-2 h-5 w-5" />
              🎬 ورود به رفیعی پلیر
              <ExternalLink className="mr-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={createLicense}
            disabled={isCreatingLicense}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white"
          >
            {isCreatingLicense ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ایجاد لایسنس...
              </>
            ) : (
              <>
                <Download className="ml-2 h-4 w-4" />
                ایجاد لایسنس رفیعی پلیر
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RafieiPlayerSection;

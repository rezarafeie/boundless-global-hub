import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Download, Loader2, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RafieiPlayerSectionProps {
  enrollment: {
    id: string;
    course_id: string;
    payment_amount: number;
    created_at: string;
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
  } | null>(enrollment?.spotplayer_license_id ? {
    license_id: enrollment.spotplayer_license_id,
    license_key: enrollment.spotplayer_license_key,
    license_url: enrollment.spotplayer_license_url
  } : null);
  
  const { toast } = useToast();

  const createLicense = async () => {
    if (!enrollment || !course) return;

    setIsCreatingLicense(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-spotplayer-license', {
        body: {
          enrollment: enrollment,
          course: course,
          user: {
            email: 'user@example.com', // This should come from enrollment data
            name: enrollment.id // This should come from enrollment data
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Refresh enrollment data to get the license
        const { data: updatedEnrollment, error: fetchError } = await supabase
          .from('enrollments')
          .select('spotplayer_license_id, spotplayer_license_key, spotplayer_license_url')
          .eq('id', enrollment.id)
          .single();

        if (!fetchError && updatedEnrollment) {
          setLicenseData({
            license_id: updatedEnrollment.spotplayer_license_id,
            license_key: updatedEnrollment.spotplayer_license_key,
            license_url: updatedEnrollment.spotplayer_license_url
          });
          toast({
            title: "لایسنس رفیعی پلیر ایجاد شد",
            description: "لایسنس شما با موفقیت ایجاد شد و آماده استفاده است.",
          });
        }
      } else {
        throw new Error(data?.message || 'خطا در ایجاد لایسنس');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: "کد لایسنس در کلیپ‌بورد کپی شد.",
    });
  };

  const handlePlayerClick = () => {
    window.open('https://app.rafeie.com/player/', '_blank');
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Play className="h-5 w-5" />
            رفیعی پلیر
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
            <Download className="h-3 w-3 ml-1" />
            دانلود دائمی
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/50 rounded-lg p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-700 mb-2">مزایای رفیعی پلیر:</h4>
          <ul className="text-sm text-purple-600 space-y-1">
            <li>• دانلود دوره برای تماشای آفلاین</li>
            <li>• دسترسی دائمی و بدون انقضا</li>
            <li>• کیفیت تصویر عالی</li>
            <li>• پشتیبانی از تمامی پلتفرم‌ها</li>
          </ul>
        </div>

        {licenseData?.license_key ? (
          <div className="space-y-3">
            <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
              <label className="text-sm font-medium text-purple-700 block mb-1">
                کد لایسنس:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-purple-50 text-purple-800 px-2 py-1 rounded text-sm font-mono">
                  {licenseData.license_key}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(licenseData.license_key!)}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePlayerClick}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Play className="ml-2 h-4 w-4" />
              🎬 تماشا در رفیعی پلیر
              <ExternalLink className="mr-2 h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={createLicense}
            disabled={isCreatingLicense}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Users, VideoOff, Loader2 } from 'lucide-react';

interface EnhancedRafieiMeetCardProps {
  isActive: boolean;
  meetUrl?: string;
  title?: string;
  description?: string;
}

const EnhancedRafieiMeetCard: React.FC<EnhancedRafieiMeetCardProps> = ({ 
  isActive, 
  meetUrl = "https://meet.jit.si/RAFIEIMEETROOM",
  title = "جلسه تصویری رفیعی",
  description = "جلسه تصویری زنده برای اعضای بدون مرز"
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleFullscreen = async () => {
    try {
      const iframe = document.querySelector('.rafiei-meet-iframe') as HTMLIFrameElement;
      
      if (!iframe) {
        window.open(meetUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        if (iframe.requestFullscreen) {
          await iframe.requestFullscreen();
        } else if ((iframe as any).webkitRequestFullscreen) {
          await (iframe as any).webkitRequestFullscreen();
        } else if ((iframe as any).mozRequestFullScreen) {
          await (iframe as any).mozRequestFullScreen();
        } else if ((iframe as any).msRequestFullscreen) {
          await (iframe as any).msRequestFullscreen();
        } else {
          window.open(meetUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      window.open(meetUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  const handleIframeLoad = () => {
    console.log('Rafiei Meet iframe loaded successfully');
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    console.error('Rafiei Meet iframe failed to load');
    setIframeLoaded(false);
  };

  if (!isActive) {
    return (
      <Card className="relative overflow-hidden border-2 border-gray-300 bg-gray-100 dark:bg-gray-800 opacity-60">
        <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <VideoOff className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-semibold">🔒 جلسه تصویری فعال نیست</p>
            <p className="text-sm mt-1">در حال حاضر جلسه‌ای برگزار نمی‌شود</p>
          </div>
        </div>
        <CardHeader className="border-b bg-gray-50 dark:bg-gray-900">
          <CardTitle className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <span className="text-2xl">🎥</span>
            <span>{title}</span>
          </CardTitle>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-gray-400">
              <div className="w-16 h-16 mx-auto mb-2 opacity-30 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                🎥
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-2 border-amber-500 shadow-2xl bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50">
        <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="text-2xl">🎥</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2 mr-auto text-sm text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">🟢 فعال</span>
            </div>
          </div>
        </CardTitle>
        {description && (
          <p className="text-amber-800 dark:text-amber-200 text-sm mt-2">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="aspect-video bg-black relative">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">در حال بارگذاری جلسه...</p>
              </div>
            </div>
          )}

          <iframe
            className="rafiei-meet-iframe w-full h-full"
            src={meetUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write; geolocation"
            allowFullScreen
            style={{ 
              border: 'none', 
              borderRadius: '0',
              minHeight: '400px'
            }}
            title="جلسه تصویری رفیعی"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
        
        <div className="absolute top-3 left-3 z-20">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFullscreen}
            className="bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-sm shadow-lg"
            title="نمایش در تمام صفحه"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            تمام صفحه
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedRafieiMeetCard;

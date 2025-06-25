
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Users, Maximize2 } from 'lucide-react';
import type { RafieiMeetSettings } from '@/lib/rafieiMeet';

interface RafieiMeetSectionProps {
  settings: RafieiMeetSettings;
}

const RafieiMeetSection: React.FC<RafieiMeetSectionProps> = ({ settings }) => {
  const handleFullscreen = async () => {
    try {
      const iframe = document.querySelector('.rafiei-meet-main-iframe') as HTMLIFrameElement;
      
      if (!iframe) {
        window.open(settings.meet_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        return;
      }

      if (iframe.requestFullscreen) {
        await iframe.requestFullscreen();
      } else if ((iframe as any).webkitRequestFullscreen) {
        await (iframe as any).webkitRequestFullscreen();
      } else if ((iframe as any).mozRequestFullScreen) {
        await (iframe as any).mozRequestFullScreen();
      } else if ((iframe as any).msRequestFullscreen) {
        await (iframe as any).msRequestFullscreen();
      } else {
        window.open(settings.meet_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      window.open(settings.meet_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  if (!settings.is_active) return null;

  return (
    <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Video className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-lg">{settings.title}</span>
          </div>
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
            زنده
          </Badge>
        </CardTitle>
        {settings.description && (
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            {settings.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg mx-4 mb-4 overflow-hidden">
          <iframe
            className="rafiei-meet-main-iframe"
            src="https://meet.jit.si/RAFIEIMEETROOM"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write; geolocation"
            allowFullScreen
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              borderRadius: '8px'
            }}
            title="جلسه تصویری رفیعی"
          />
          
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <Badge className="bg-black/70 text-white backdrop-blur-sm">
              <Users className="w-3 h-3 mr-1" />
              جلسه فعال
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFullscreen}
              className="bg-black/70 hover:bg-black/90 text-white border-none backdrop-blur-sm"
              title="نمایش در تمام صفحه"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              تمام صفحه
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RafieiMeetSection;

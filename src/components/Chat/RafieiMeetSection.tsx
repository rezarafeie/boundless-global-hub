
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Maximize2 } from 'lucide-react';
import type { RafieiMeetSettings } from '@/lib/rafieiMeet';

interface RafieiMeetSectionProps {
  settings: RafieiMeetSettings;
}

const RafieiMeetSection: React.FC<RafieiMeetSectionProps> = ({ settings }) => {
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
            src={settings.meet_url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              borderRadius: '8px'
            }}
            title="جلسه تصویری رفیعی"
          />
          
          {/* Overlay controls */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className="bg-black/70 text-white backdrop-blur-sm">
              <Users className="w-3 h-3 mr-1" />
              جلسه فعال
            </Badge>
            <Badge className="bg-black/70 text-white backdrop-blur-sm">
              <Maximize2 className="w-3 h-3 mr-1" />
              تمام صفحه
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RafieiMeetSection;

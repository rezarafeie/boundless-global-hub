
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Maximize2, Users, Radio, RadioIcon } from 'lucide-react';

interface LiveStreamCardProps {
  isActive: boolean;
  streamCode?: string;
  title?: string;
  viewers?: number;
}

const LiveStreamCard: React.FC<LiveStreamCardProps> = ({ 
  isActive, 
  streamCode,
  title = "پخش زنده",
  viewers = 0
}) => {
  const handleFullscreen = () => {
    const iframe = document.querySelector('.live-stream-iframe') as HTMLIFrameElement;
    if (iframe && iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  if (!isActive) {
    return (
      <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 opacity-60">
        <div className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center text-slate-600 dark:text-slate-400">
            <RadioIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">فعلاً غیرفعال است</p>
          </div>
        </div>
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Play className="w-6 h-6" />
            📺 پخش زنده
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <div className="text-slate-400 dark:text-slate-500">
              <Play className="w-16 h-16 mx-auto mb-2 opacity-30" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-slate-900 border-slate-700 shadow-xl">
      <CardHeader className="border-b border-slate-700 bg-slate-800/50">
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-6 h-6 text-red-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <span>📺 {title}</span>
          </div>
          <div className="flex items-center gap-2 mr-auto text-sm text-slate-300">
            <div className="flex items-center gap-1 text-red-400">
              <Users className="w-4 h-4" />
              {viewers} بیننده
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="aspect-video bg-black">
          {streamCode ? (
            <iframe
              className="live-stream-iframe w-full h-full"
              src={`https://www.aparat.com/video/video/embed/videohash/${streamCode}/vt/frame`}
              title="پخش زنده"
              allowFullScreen
              style={{ border: 'none', borderRadius: '0' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Radio className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                <p>در انتظار شروع پخش...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute top-3 left-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFullscreen}
            className="bg-black/70 hover:bg-black/90 text-white border-none backdrop-blur-sm"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            نمایش تمام صفحه
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamCard;

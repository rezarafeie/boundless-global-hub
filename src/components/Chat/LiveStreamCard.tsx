
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Maximize2, Eye, Wifi, WifiOff } from 'lucide-react';

interface LiveStreamCardProps {
  isActive: boolean;
  streamCode?: string;
  title?: string;
  viewers?: number;
}

const LiveStreamCard: React.FC<LiveStreamCardProps> = ({ 
  isActive, 
  streamCode, 
  title = "پخش زنده بدون مرز",
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
      <Card className="relative overflow-hidden bg-slate-900 border-slate-700 opacity-50">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center text-slate-400">
            <WifiOff className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">در حال حاضر غیرفعال است</p>
          </div>
        </div>
        <CardHeader className="border-b border-slate-700 bg-slate-800/50">
          <CardTitle className="flex items-center gap-3 text-slate-300">
            <Play className="w-6 h-6" />
            📺 پخش زنده
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-slate-800 flex items-center justify-center">
            <div className="text-slate-500">
              <Wifi className="w-16 h-16 mx-auto mb-2 opacity-30" />
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
              <Play className="w-6 h-6 text-red-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <span>📺 {title}</span>
          </div>
          <div className="flex items-center gap-2 mr-auto text-sm text-slate-300">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {viewers} بیننده
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              زنده
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="aspect-video bg-black">
          {streamCode ? (
            <div 
              className="live-stream-iframe w-full h-full"
              dangerouslySetInnerHTML={{ __html: streamCode }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-2" />
                <p>در انتظار پخش...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="absolute top-3 left-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFullscreen}
            className="bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-sm"
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


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Eye, WifiOff } from 'lucide-react';

interface EnhancedLiveStreamCardProps {
  isActive: boolean;
  streamCode?: string;
  title?: string;
  viewers?: number;
}

const EnhancedLiveStreamCard: React.FC<EnhancedLiveStreamCardProps> = ({ 
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
      <Card className="relative overflow-hidden border-2 border-gray-300 bg-gray-100 dark:bg-gray-800 opacity-60">
        <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <WifiOff className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-semibold">🔒 پخش زنده فعال نیست</p>
            <p className="text-sm mt-1">در حال حاضر پخش زنده‌ای در جریان نیست</p>
          </div>
        </div>
        <CardHeader className="border-b bg-gray-50 dark:bg-gray-900">
          <CardTitle className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <span className="text-2xl">📺</span>
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-gray-400">
              <div className="w-16 h-16 mx-auto mb-2 opacity-30 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                📺
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-2 border-green-500 shadow-2xl bg-white dark:bg-slate-900">
      <CardHeader className="border-b border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
        <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="text-2xl">📺</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-3 mr-auto text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">🟢 زنده</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Eye className="w-4 h-4" />
              <span>{viewers} بیننده</span>
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
                <span className="text-6xl mb-4 block">📺</span>
                <p className="text-lg">در انتظار پخش...</p>
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
            تمام صفحه
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLiveStreamCard;

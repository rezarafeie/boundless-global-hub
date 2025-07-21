import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Play, 
  Pause, 
  FileText, 
  File, 
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  ExternalLink
} from 'lucide-react';
import { 
  getFileTypeCategory, 
  formatFileSize, 
  isImageFile, 
  isVideoFile, 
  isAudioFile,
  isPDFFile 
} from '@/lib/fileUploadService';
import { cn } from '@/lib/utils';

interface MediaMessageProps {
  url: string;
  type: string;
  size?: number;
  name?: string;
  className?: string;
}

const MediaMessage: React.FC<MediaMessageProps> = ({
  url,
  type,
  size,
  name,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  const fileCategory = getFileTypeCategory(type);
  const fileName = name || url.split('/').pop() || 'فایل';
  const fileSize = size ? formatFileSize(size) : '';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = () => {
    switch (fileCategory) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <VideoIcon className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  if (isImageFile(type)) {
    return (
      <div className={cn("w-full overflow-hidden", className)} style={{ maxWidth: '100%' }}>
        <div className="max-w-[180px] sm:max-w-[200px] w-full">
          <img
            src={url}
            alt={fileName}
            className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-full h-auto object-cover max-h-32 sm:max-h-40"
            onClick={() => setShowFullImage(true)}
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          />
          <div className="flex justify-between items-center mt-1 gap-1 overflow-hidden">
            <span className="text-xs text-slate-500 truncate flex-1 min-w-0">{fileName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-5 w-5 p-0 flex-shrink-0"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Full image modal */}
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFullImage(false)}
          >
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  if (isVideoFile(type)) {
    return (
      <div className={cn("w-full overflow-hidden", className)} style={{ maxWidth: '100%' }}>
        <div className="max-w-[180px] sm:max-w-[200px] w-full">
          <video
            controls
            className="rounded-lg w-full h-auto object-cover max-h-32 sm:max-h-40"
            preload="metadata"
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          >
            <source src={url} type={type} />
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
          <div className="flex justify-between items-center mt-1 gap-1 overflow-hidden">
            <span className="text-xs text-slate-500 truncate flex-1 min-w-0">{fileName}</span>
            {fileSize && <span className="text-xs text-slate-400 flex-shrink-0">{fileSize}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (isAudioFile(type)) {
    // Check if it's a voice message (webm/ogg audio files)
    const isVoiceMessage = type.includes('webm') || type.includes('ogg') || fileName.includes('voice');
    
    if (isVoiceMessage) {
      // Import VoiceMessagePlayer dynamically
      const VoiceMessagePlayer = React.lazy(() => import('./VoiceMessagePlayer'));
      
      return (
        <React.Suspense fallback={
          <Card className={cn("p-2 min-w-[180px] max-w-[220px] w-full", className)}>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm truncate">در حال بارگذاری...</span>
            </div>
          </Card>
        }>
          <VoiceMessagePlayer
            url={url}
            fileName={fileName}
            className={cn("max-w-full w-full", className)}
          />
        </React.Suspense>
      );
    }
    
    return (
      <Card className={cn("p-2 w-full overflow-hidden", className)} style={{ maxWidth: '100%' }}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0">
            <Music className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {fileSize && <p className="text-xs text-slate-500 truncate">{fileSize}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
        
        <audio
          controls
          className="w-full mt-2 max-w-full"
          preload="metadata"
          style={{ maxWidth: '100%', width: '100%' }}
        >
          <source src={url} type={type} />
          مرورگر شما از پخش صدا پشتیبانی نمی‌کند.
        </audio>
      </Card>
    );
  }

  // For PDF and other files
  return (
    <Card className={cn("p-2 w-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors overflow-hidden", className)} style={{ maxWidth: '100%' }}>
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {fileSize && <p className="text-xs text-slate-500 truncate">{fileSize}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {isPDFFile(type) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url, '_blank')}
              className="h-6 w-6 p-0"
              title="مشاهده"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 w-6 p-0"
            title="دانلود"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MediaMessage;
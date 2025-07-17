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
      <div className={cn("max-w-xs", className)}>
        <img
          src={url}
          alt={fileName}
          className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-64 w-auto"
          onClick={() => setShowFullImage(true)}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-slate-500 truncate">{fileName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 w-6 p-0"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>

        {/* Full image modal */}
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
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
      <div className={cn("max-w-xs", className)}>
        <video
          controls
          className="rounded-lg max-h-64 w-full"
          preload="metadata"
        >
          <source src={url} type={type} />
          مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
        </video>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-slate-500 truncate">{fileName}</span>
          {fileSize && <span className="text-xs text-slate-400">{fileSize}</span>}
        </div>
      </div>
    );
  }

  if (isAudioFile(type)) {
    return (
      <Card className={cn("p-3 max-w-xs", className)}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Music className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
        
        <audio
          controls
          className="w-full mt-2"
          preload="metadata"
        >
          <source src={url} type={type} />
          مرورگر شما از پخش صدا پشتیبانی نمی‌کند.
        </audio>
      </Card>
    );
  }

  // For PDF and other files
  return (
    <Card className={cn("p-3 max-w-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", className)}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {isPDFFile(type) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url, '_blank')}
              className="h-8 w-8 p-0"
              title="مشاهده"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
            title="دانلود"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MediaMessage;
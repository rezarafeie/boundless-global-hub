
import React from 'react';

interface AnnouncementMediaProps {
  mediaType: string;
  mediaUrl: string | null;
  mediaContent: string | null;
  title: string;
}

const AnnouncementMedia: React.FC<AnnouncementMediaProps> = ({
  mediaType,
  mediaUrl,
  mediaContent,
  title
}) => {
  if (mediaType === 'none' || (!mediaUrl && !mediaContent)) {
    return null;
  }

  const renderMedia = () => {
    // Priority: use mediaUrl first, then fallback to mediaContent
    const source = mediaUrl || mediaContent;
    
    if (!source) return null;

    switch (mediaType) {
      case 'image':
        return (
          <div className="announcement-media mt-4">
            <img 
              src={source} 
              alt={`تصویر ${title}`}
              className="w-full rounded-lg shadow-lg max-h-64 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="announcement-media mt-4">
            <video 
              controls 
              className="w-full rounded-lg shadow-lg max-h-64"
              preload="metadata"
            >
              <source src={source} type="video/mp4" />
              <source src={source} type="video/webm" />
              مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="announcement-media mt-4">
            <audio 
              controls 
              className="w-full"
              preload="metadata"
            >
              <source src={source} type="audio/mpeg" />
              <source src={source} type="audio/wav" />
              مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
            </audio>
          </div>
        );

      case 'iframe':
        return (
          <div className="announcement-media mt-4">
            <div 
              className="iframe-container relative w-full h-64 bg-black rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: source }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return renderMedia();
};

export default AnnouncementMedia;

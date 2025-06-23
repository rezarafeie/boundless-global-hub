
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import AnnouncementMedia from './AnnouncementMedia';

interface Announcement {
  id: number;
  title: string;
  full_text: string;
  type: 'general' | 'urgent';
  is_pinned: boolean;
  created_at: string;
  media_type: 'none' | 'image' | 'video' | 'audio' | 'iframe';
  media_url?: string;
  media_content?: string;
  views?: number;
}

interface AnnouncementModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  isOpen,
  onClose,
}) => {
  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant={announcement.type === 'urgent' ? 'destructive' : 'secondary'} className="text-sm">
                {announcement.type === 'urgent' ? '🚨 فوری' : '📝 عمومی'}
              </Badge>
              {announcement.is_pinned && (
                <Badge variant="outline">📌 سنجاق شده</Badge>
              )}
            </div>
            <div className="text-sm text-slate-500">
              {new Date(announcement.created_at).toLocaleDateString('fa-IR')}
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            {announcement.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {announcement.full_text}
          </div>

          {announcement.media_type !== 'none' && announcement.media_url && (
            <div className="border-t pt-6">
              <AnnouncementMedia 
                title={announcement.title}
                mediaType={announcement.media_type} 
                mediaUrl={announcement.media_url} 
                mediaContent={announcement.media_content} 
              />
            </div>
          )}

          {announcement.views !== undefined && (
            <div className="text-xs text-slate-400 border-t pt-4">
              👁️ {announcement.views} بازدید
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementModal;

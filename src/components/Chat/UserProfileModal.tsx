
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Calendar, User } from 'lucide-react';
import type { MessengerUser } from '@/lib/messengerService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MessengerUser | null;
  onStartChat: (user: MessengerUser) => void;
  currentUserId: number;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onStartChat,
  currentUserId
}) => {
  if (!user) return null;

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStartChat = () => {
    onStartChat(user);
    onClose();
  };

  const isCurrentUser = user.id === currentUserId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(user.name) }}
              className="text-white font-bold text-2xl"
            >
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg">{user.name}</h3>
            {user.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
          </div>

          <div className="w-full space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>عضویت: {formatDate(user.created_at)}</span>
            </div>
            
            {user.bedoun_marz && (
              <div className="flex items-center gap-2 text-blue-600">
                <User className="w-4 h-4" />
                <span>دانشجوی بدون مرز</span>
              </div>
            )}

            {user.is_support_agent && (
              <div className="flex items-center gap-2 text-purple-600">
                <User className="w-4 h-4" />
                <span>نماینده پشتیبانی</span>
              </div>
            )}
          </div>

          {!isCurrentUser && (
            <Button 
              onClick={handleStartChat}
              className="w-full"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              شروع گفتگو
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Calendar, User, Crown, Shield } from 'lucide-react';
import type { MessengerUser } from '@/lib/messengerService';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: MessengerUser | null;
  onStartChat?: (user: MessengerUser) => void;
  currentUserId: number;
}

const UserProfile: React.FC<UserProfileProps> = ({
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
    if (onStartChat) {
      onStartChat(user);
    }
    onClose();
  };

  const isCurrentUser = user.id === currentUserId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">پروفایل کاربر</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Avatar */}
          <Avatar className="w-24 h-24">
            <AvatarImage src={user.avatar_url} alt={user.name} />
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(user.name) }}
              className="text-white font-bold text-3xl"
            >
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* User Info */}
          <div className="text-center space-y-2 w-full">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">{user.name}</h3>
            
            {user.username && (
              <p className="text-lg text-blue-600 dark:text-blue-400">@{user.username}</p>
            )}
            
            {user.bio && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {user.bio}
                </p>
              </div>
            )}
          </div>

          {/* User Stats/Info */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>عضویت: {formatDate(user.created_at)}</span>
            </div>
            
            {user.bedoun_marz_approved && (
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
                <Crown className="w-4 h-4" />
                <span>دانشجوی بدون مرز</span>
              </div>
            )}

            {user.is_messenger_admin && (
              <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>مدیر پیام‌رسان</span>
              </div>
            )}

            {user.is_support_agent && (
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 text-sm">
                <User className="w-4 h-4" />
                <span>نماینده پشتیبانی</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {!isCurrentUser && onStartChat && (
            <Button 
              onClick={handleStartChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              شروع گفتگو
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
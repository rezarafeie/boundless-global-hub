
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, MessageCircle, LogOut, User } from 'lucide-react';
import { MessengerUser } from '@/lib/messengerService';

interface MobileMessengerHeaderProps {
  onBack: () => void;
  onLogout: () => void;
  currentUser: MessengerUser;
  onProfileClick: () => void;
}

const MobileMessengerHeader: React.FC<MobileMessengerHeaderProps> = ({
  onBack,
  onLogout,
  currentUser,
  onProfileClick
}) => {
  // Safety check - don't render if currentUser is not available
  if (!currentUser) {
    return null;
  }

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 md:hidden">
      <div className="flex items-center justify-between">
        {/* User Profile Button (replaces back button) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onProfileClick}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Avatar className="w-6 h-6">
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(currentUser.name || 'U') }}
              className="text-white font-medium text-xs"
            >
              {currentUser.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate max-w-24">
            {currentUser.name || 'کاربر'}
          </span>
        </Button>
        
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-red-500 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MobileMessengerHeader;

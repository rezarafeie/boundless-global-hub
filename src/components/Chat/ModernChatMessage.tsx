import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/types/supabase';
import { useReply } from '@/contexts/ReplyContext';
import UserProfile from './UserProfile';

interface ModernChatMessageProps {
  message: ChatMessage;
  isOwnMessage?: boolean;
  senderAvatarUrl?: string;
  currentUserId?: number;
}

const ModernChatMessage: React.FC<ModernChatMessageProps> = ({ 
  message, 
  isOwnMessage = false,
  senderAvatarUrl,
  currentUserId
}) => {
  const { setReplyingTo } = useReply();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  const handleReply = () => {
    setReplyingTo({
      id: message.id,
      message: message.message,
      sender_name: message.sender_name || 'User'
    });
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'moderator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر';
      case 'moderator': return 'مدیر بحث';
      default: return 'عضو';
    }
  };

  // Generate consistent color for user avatar based on name
  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get first letter of name for avatar
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] sm:max-w-[65%] flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* User Avatar - only show for other users' messages */}
        {!isOwnMessage && (
          <Avatar 
            className="w-8 h-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setProfileUser({
                id: message.user_id || 0,
                name: message.sender_name || 'User',
                username: null,
                avatar_url: senderAvatarUrl,
                bio: null,
                created_at: new Date().toISOString(),
                is_messenger_admin: false,
                is_support_agent: false,
                bedoun_marz_approved: false
              });
              setShowUserProfile(true);
            }}
          >
            <AvatarImage src={senderAvatarUrl} alt={message.sender_name || 'User'} />
            <AvatarFallback 
              className="text-white font-bold text-xs"
              style={{ backgroundColor: getAvatarColor(message.sender_name || 'User') }}
            >
              {getInitial(message.sender_name || 'U')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col group">
          <div
            className={`rounded-2xl px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md relative ${
              isOwnMessage
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
            }`}
            onClick={!isOwnMessage ? handleReply : undefined}
            style={{ cursor: !isOwnMessage ? 'pointer' : 'default' }}
          >
            {/* Header - show sender name and role only for other users */}
            {!isOwnMessage && (
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileUser({
                      id: message.user_id || 0,
                      name: message.sender_name || 'User',
                      username: null,
                      avatar_url: senderAvatarUrl,
                      bio: null,
                      created_at: new Date().toISOString(),
                      is_messenger_admin: false,
                      is_support_agent: false,
                      bedoun_marz_approved: false
                    });
                    setShowUserProfile(true);
                  }}
                >
                  {message.sender_name}
                </span>
                {message.sender_role && message.sender_role !== 'member' && (
                  <Badge className={`${getRoleColor(message.sender_role)} text-xs px-1.5 py-0.5 border`}>
                    {getRoleText(message.sender_role)}
                  </Badge>
                )}
                {message.is_pinned && (
                  <Pin className="w-3 h-3 text-amber-500" />
                )}
              </div>
            )}
            
            {/* Message content */}
            <p className={`text-sm leading-relaxed ${
              isOwnMessage ? 'text-white' : 'text-slate-800 dark:text-slate-200'
            }`}>
              {message.message}
            </p>
            
            {/* Timestamp and Reply Button */}
            <div className={`flex items-center justify-between mt-1.5 text-xs ${
              isOwnMessage ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              <div className="flex items-center">
                {!isOwnMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReply();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center">
                {message.is_pinned && isOwnMessage && (
                  <Pin className="w-3 h-3 mr-1" />
                )}
                <span>
                  {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={profileUser}
        currentUserId={currentUserId || 0}
      />
    </div>
  );
};

export default ModernChatMessage;
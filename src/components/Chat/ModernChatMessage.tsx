import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin, Reply, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MessengerMessage } from '@/lib/messengerService';
import { useReply } from '@/contexts/ReplyContext';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { messengerService } from '@/lib/messengerService';
import UserProfile from './UserProfile';

interface ModernChatMessageProps {
  message: MessengerMessage;
  isOwnMessage?: boolean;
  senderAvatarUrl?: string;
  currentUserId?: number;
  sessionToken?: string;
}

const ModernChatMessage: React.FC<ModernChatMessageProps> = ({ 
  message, 
  isOwnMessage = false,
  senderAvatarUrl,
  currentUserId,
  sessionToken
}) => {
  const { setReplyingTo } = useReply();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  
  const handleReply = () => {
    setReplyingTo({
      id: message.id,
      message: message.message,
      sender_name: message.sender?.name || 'User'
    });
  };

  const handleTimestampClick = () => {
    setReplyingTo({
      id: message.id,
      message: message.message,
      sender_name: message.sender?.name || 'User'
    });
  };

  const handleDoubleTapLike = async () => {
    if (!currentUserId || !sessionToken) return;
    
    try {
      await messengerService.addMessageReaction(message.id, currentUserId, '❤️');
      
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      
      // Refresh reactions
      loadReactions();
    } catch (error) {
      console.error('Error adding like reaction:', error);
    }
  };

  const doubleTapHandler = useDoubleTap({
    onDoubleTap: handleDoubleTapLike,
    delay: 300
  });

  const loadReactions = async () => {
    try {
      const messageReactions = await messengerService.getMessageReactions(message.id);
      setReactions(messageReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  useEffect(() => {
    loadReactions();
  }, [message.id]);
  
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
                id: message.sender_id || 0,
                name: message.sender?.name || 'User',
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
            <AvatarImage src={senderAvatarUrl} alt={message.sender?.name || 'User'} />
            <AvatarFallback 
              className="text-white font-bold text-xs"
              style={{ backgroundColor: getAvatarColor(message.sender?.name || 'User') }}
            >
              {getInitial(message.sender?.name || 'U')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col group">
          <div
            className={`rounded-2xl px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md relative ${
              isOwnMessage
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            } ${!isOwnMessage ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOwnMessage) {
                handleReply();
              } else {
                doubleTapHandler();
              }
            }}
          >
            {/* Heart Animation */}
            {showHeartAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart 
                  className="w-8 h-8 text-red-500 fill-current animate-ping"
                  style={{
                    animation: 'heartPulse 1s ease-out'
                  }}
                />
              </div>
            )}
            {/* Header - show sender name and role only for other users */}
            {!isOwnMessage && (
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileUser({
                      id: message.sender_id || 0,
                      name: message.sender?.name || 'User',
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
                  {message.sender?.name}
                </span>
                <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-xs px-1.5 py-0.5 border">
                  عضو
                </Badge>
                {false && (
                  <Pin className="w-3 h-3 text-amber-500" />
                )}
              </div>
            )}
            
            {/* Replied Message Display */}
            {(message as any).reply_to_message_id && (
              <div className={`mb-2 p-2 rounded-md border-l-2 ${
                isOwnMessage 
                  ? 'bg-blue-600/20 border-blue-300' 
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
              }`}>
                <div className={`text-xs font-medium ${
                  isOwnMessage ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  پاسخ به {(message as any).replied_to?.sender_name || 'کاربر'}
                </div>
                <div className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-blue-100' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {(message as any).replied_to?.message || 'پیام'}
                </div>
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
                  <span className="text-xs opacity-70">
                    کلیک کنید برای پاسخ
                  </span>
                )}
              </div>
              <div className="flex items-center">
                {false && isOwnMessage && (
                  <Pin className="w-3 h-3 mr-1" />
                )}
                <span 
                  className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOwnMessage) {
                      handleReply();
                    }
                  }}
                >
                  {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Reactions Display */}
          {reactions.length > 0 && (
            <div className="flex items-center gap-1 mt-1 mr-2">
              {reactions.reduce((acc: any[], reaction) => {
                const existing = acc.find(r => r.reaction === reaction.reaction);
                if (existing) {
                  existing.count += 1;
                  existing.users.push(reaction.user_id);
                } else {
                  acc.push({
                    reaction: reaction.reaction,
                    count: 1,
                    users: [reaction.user_id]
                  });
                }
                return acc;
              }, []).map((reactionGroup) => (
                <div
                  key={reactionGroup.reaction}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                    reactionGroup.users.includes(currentUserId)
                      ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300'
                      : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span>{reactionGroup.reaction}</span>
                  <span className="font-medium">{reactionGroup.count}</span>
                </div>
              ))}
            </div>
          )}
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
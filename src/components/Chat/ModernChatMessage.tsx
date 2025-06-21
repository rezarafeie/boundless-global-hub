
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Pin } from 'lucide-react';
import UserAvatar from './UserAvatar';
import type { ChatMessage } from '@/types/supabase';

interface ModernChatMessageProps {
  message: ChatMessage;
  isOwnMessage?: boolean;
}

const ModernChatMessage: React.FC<ModernChatMessageProps> = ({ 
  message, 
  isOwnMessage = false 
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'moderator': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر';
      case 'moderator': return 'مدیر بحث';
      default: return 'عضو';
    }
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`} dir="rtl">
      {/* Avatar - only show for other users' messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 mt-1">
          <UserAvatar 
            name={message.sender_name || 'کاربر'} 
            userId={message.user_id?.toString()}
            size={36}
          />
        </div>
      )}
      
      <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Message header - sender info */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {message.sender_name}
            </span>
            <Badge className={`text-xs px-2 py-0.5 ${getRoleColor(message.sender_role)}`}>
              {getRoleText(message.sender_role)}
            </Badge>
            {message.is_pinned && (
              <Pin className="w-3 h-3 text-blue-500" />
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl max-w-full break-words ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
          }`}
        >
          {/* Pinned indicator for own messages */}
          {isOwnMessage && message.is_pinned && (
            <div className="flex items-center gap-1 mb-1">
              <Pin className="w-3 h-3 text-blue-200" />
              <span className="text-xs text-blue-200">پین شده</span>
            </div>
          )}
          
          {/* Message content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
          
          {/* Timestamp */}
          <div className={`flex items-center justify-end mt-1 text-xs ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
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
  );
};

export default ModernChatMessage;

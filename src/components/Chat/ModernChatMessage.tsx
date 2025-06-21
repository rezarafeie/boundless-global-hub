
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
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'moderator': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
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
    <div className={`flex mb-3 gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`} dir="rtl">
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
      
      <div className={`max-w-[75%] sm:max-w-[65%] ${isOwnMessage ? 'mr-12' : 'ml-12'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-bl-md'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-br-md border border-gray-200 dark:border-gray-700'
          }`}
        >
          {/* Header - only for other users */}
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-2" dir="rtl">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                {message.sender_name}
              </span>
              <Badge className={`${getRoleColor(message.sender_role)} text-xs px-2 py-0.5 border rounded-full`}>
                {getRoleText(message.sender_role)}
              </Badge>
              {message.is_pinned && (
                <Pin className="w-3 h-3 text-amber-500" />
              )}
            </div>
          )}
          
          {/* Message content */}
          <p className={`text-sm leading-relaxed break-words ${
            isOwnMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200'
          }`} dir="rtl">
            {message.message}
          </p>
          
          {/* Timestamp */}
          <div className={`flex items-center justify-end mt-2 text-xs ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`} dir="rtl">
            {message.is_pinned && isOwnMessage && (
              <Pin className="w-3 h-3 ml-1" />
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
  );
};

export default ModernChatMessage;

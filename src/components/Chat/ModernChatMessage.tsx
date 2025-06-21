
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

  return (
    <div className={`flex mb-4 gap-3 ${isOwnMessage ? 'justify-end flex-row-reverse' : 'justify-start'}`} dir="rtl">
      {/* Avatar - only show for other users' messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0">
          <UserAvatar 
            name={message.sender_name || 'کاربر'} 
            userId={message.user_id?.toString()}
            size={32}
          />
        </div>
      )}
      
      <div className={`max-w-[70%] sm:max-w-[60%]`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
            isOwnMessage
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-bl-md'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-br-md border border-slate-200 dark:border-slate-700'
          }`}
        >
          {/* Header */}
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-2" dir="rtl">
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                {message.sender_name}
              </span>
              <Badge className={`${getRoleColor(message.sender_role)} text-xs px-2 py-0.5 border`}>
                {getRoleText(message.sender_role)}
              </Badge>
              {message.is_pinned && (
                <Pin className="w-3 h-3 text-amber-500" />
              )}
            </div>
          )}
          
          {/* Message content */}
          <p className={`text-sm leading-relaxed ${
            isOwnMessage ? 'text-white' : 'text-slate-800 dark:text-slate-200'
          }`} dir="rtl">
            {message.message}
          </p>
          
          {/* Timestamp */}
          <div className={`flex items-center justify-start mt-2 text-xs ${
            isOwnMessage ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'
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

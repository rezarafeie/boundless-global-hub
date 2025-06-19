
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Pin } from 'lucide-react';
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
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
    <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] sm:max-w-[60%] ${isOwnMessage ? 'order-2' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isOwnMessage
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-md'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
          }`}
        >
          {/* Header with name and role */}
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                {message.sender_name}
              </span>
              <Badge className={`${getRoleColor(message.sender_role)} text-xs px-2 py-0.5`}>
                {getRoleText(message.sender_role)}
              </Badge>
              {message.is_pinned && (
                <Pin className="w-3 h-3 text-amber-500" />
              )}
            </div>
          )}
          
          {/* Message content */}
          <p className={`text-sm leading-relaxed ${isOwnMessage ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
            {message.message}
          </p>
          
          {/* Timestamp */}
          <div className={`flex items-center justify-end mt-2 text-xs ${
            isOwnMessage ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'
          }`}>
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
  );
};

export default ModernChatMessage;

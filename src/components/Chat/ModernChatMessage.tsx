
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Pin } from 'lucide-react';
import type { ChatMessage } from '@/types/supabase';

interface ModernChatMessageProps {
  message: ChatMessage;
  isOwn?: boolean;
}

const ModernChatMessage: React.FC<ModernChatMessageProps> = ({ message, isOwn = false }) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'moderator':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدیر';
      case 'moderator':
        return 'ناظر';
      default:
        return 'عضو';
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`} dir="rtl">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {message.sender_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-xl ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="font-medium text-slate-900 dark:text-white text-sm">
            {message.sender_name || 'کاربر ناشناس'}
          </span>
          <Badge 
            className={`text-xs px-2 py-0.5 text-white ${getRoleBadgeColor(message.sender_role)}`}
          >
            {getRoleText(message.sender_role)}
          </Badge>
          {message.is_pinned && (
            <Pin className="w-3 h-3 text-amber-500" />
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(message.created_at).toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Message Bubble */}
        <div 
          className={`px-4 py-2 rounded-2xl max-w-full break-words message-bubble ${
            isOwn
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
          }`}
          style={{ 
            textAlign: 'right',
            direction: 'rtl'
          }}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernChatMessage;

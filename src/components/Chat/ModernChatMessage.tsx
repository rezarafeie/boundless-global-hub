
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
    <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] sm:max-w-[60%] flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* User Avatar - only show for other users' messages */}
        {!isOwnMessage && (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ backgroundColor: getAvatarColor(message.sender_name || 'User') }}
          >
            {getInitial(message.sender_name || 'U')}
          </div>
        )}
        
        <div className="flex flex-col">
          <div
            className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
              isOwnMessage
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-md'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
            }`}
          >
            {/* Header - show sender name and role only for other users */}
            {!isOwnMessage && (
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {message.sender_name}
                </span>
                {message.sender_role && message.sender_role !== 'member' && (
                  <Badge className={`${getRoleColor(message.sender_role)} text-xs px-2 py-0.5 border`}>
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
    </div>
  );
};

export default ModernChatMessage;

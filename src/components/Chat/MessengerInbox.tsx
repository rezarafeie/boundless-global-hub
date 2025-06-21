
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, HeadphonesIcon, Star } from 'lucide-react';
import type { ChatTopic } from '@/types/supabase';

interface MessengerInboxProps {
  topics: ChatTopic[];
  currentUser: any;
  onConversationSelect: (conversation: any) => void;
  selectedConversation: any;
  loading: boolean;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  topics,
  currentUser,
  onConversationSelect,
  selectedConversation,
  loading
}) => {
  const conversations = [
    // Support chat for Bedoun Marz users
    ...(currentUser?.bedoun_marz_approved ? [{
      id: `support-${currentUser.id}`,
      type: 'support',
      title: 'پشتیبانی رفیعی',
      description: 'گفتگو با تیم پشتیبانی',
      lastMessage: 'سلام! چطور می‌تونم کمکتون کنم؟',
      lastTime: 'الان',
      unreadCount: 0,
      icon: HeadphonesIcon,
      color: 'from-green-500 to-emerald-600'
    }] : []),
    
    // Topics
    ...topics.map(topic => ({
      id: topic.id,
      type: 'topic',
      title: topic.title,
      description: topic.description,
      lastMessage: 'آخرین پیام...',
      lastTime: '5 دقیقه پیش',
      unreadCount: 0,
      icon: topic.is_bedoun_marz_only ? Star : Users,
      color: topic.is_bedoun_marz_only 
        ? 'from-amber-500 to-orange-600' 
        : 'from-blue-500 to-indigo-600'
    }))
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">گفتگوها</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {conversations.length} گفتگو
        </p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">هنوز گفتگویی نیست</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => {
              const IconComponent = conversation.icon;
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className={`w-full p-4 rounded-2xl text-right transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 bg-gradient-to-r ${conversation.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {conversation.lastTime}
                          </span>
                        </div>
                      </div>
                      
                      {conversation.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-1">
                          {conversation.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerInbox;

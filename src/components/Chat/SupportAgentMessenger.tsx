
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supportService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Users, User, HeadphonesIcon, ArrowRight } from 'lucide-react';
import type { SupportMessage } from '@/types/supabase';

interface SupportAgentMessengerProps {
  currentUserId: number;
  userName: string;
}

const SupportAgentMessenger: React.FC<SupportAgentMessengerProps> = ({ currentUserId, userName }) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Array<{
    user_id: number;
    user_name: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
  }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
      const interval = setInterval(() => loadMessages(selectedUserId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  const loadConversations = async () => {
    try {
      const convs = await supportService.getAllUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const supportMessages = await supportService.getSupportMessages(userId);
      setMessages(supportMessages);
      
      // Mark messages as read
      await supportService.markMessagesAsRead(userId, currentUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedUserId) return;

    setSending(true);
    try {
      await supportService.sendSupportMessage({
        user_id: selectedUserId,
        sender_id: currentUserId,
        message: newMessage.trim(),
        is_from_support: true
      });

      setNewMessage('');
      await loadMessages(selectedUserId);
      await loadConversations();
      
      toast({
        title: 'پیام ارسال شد',
        description: 'پاسخ شما به کاربر ارسال شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'پیام ارسال نشد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (userId: number) => {
    setSelectedUserId(userId);
    setShowMobileChat(true);
  };

  const handleBackToInbox = () => {
    setShowMobileChat(false);
    setSelectedUserId(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <HeadphonesIcon className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری پشتیبانی...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full">
      {/* Conversations Sidebar */}
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">پنل پشتیبان</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{userName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">هنوز گفتگویی نیست</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => handleConversationSelect(conv.user_id)}
                  className={`w-full p-3 rounded-lg text-right transition-colors ${
                    selectedUserId === conv.user_id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {conv.user_name}
                      </span>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {conv.last_message}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {new Date(conv.last_message_time).toLocaleDateString('fa-IR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedUserId ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              {showMobileChat && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToInbox}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl h-10 w-10 md:hidden"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {conversations.find(c => c.user_id === selectedUserId)?.user_name || 'کاربر'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">گفتگوی پشتیبانی</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_support ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      message.is_from_support
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {!message.is_from_support && (
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">کاربر</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.is_from_support 
                        ? 'text-green-100' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl px-4"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl h-12 w-12 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
                یک گفتگو انتخاب کنید
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                برای شروع پاسخگویی، یکی از گفتگوها را انتخاب کنید
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportAgentMessenger;

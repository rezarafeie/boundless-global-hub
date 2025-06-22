
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Tag, AlertCircle, CheckCircle, Clock, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService, type SupportConversation, type SupportMessage, type SupportTag } from '@/lib/supportService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import MessageAvatar from './MessageAvatar';

interface EnhancedConversation extends SupportConversation {
  user?: {
    id: number;
    name: string;
    phone: string;
  };
  thread_type?: {
    id: number;
    display_name: string;
  };
}

interface SupportChatViewProps {
  conversation: EnhancedConversation;
  currentUser: MessengerUser;
  onBack: () => void;
  onConversationUpdate?: (conversation: EnhancedConversation) => void;
}

const SupportChatView: React.FC<SupportChatViewProps> = ({
  conversation,
  currentUser,
  onBack,
  onConversationUpdate
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTags, setSelectedTags] = useState<SupportTag[]>(conversation.tag_list || []);
  const [selectedStatus, setSelectedStatus] = useState(conversation.status || 'open');
  const [selectedPriority, setSelectedPriority] = useState(conversation.priority || 'normal');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const availableTags: { value: SupportTag; label: string; color: string }[] = [
    { value: 'technical', label: 'فنی', color: 'bg-blue-100 text-blue-800' },
    { value: 'billing', label: 'مالی', color: 'bg-green-100 text-green-800' },
    { value: 'general', label: 'عمومی', color: 'bg-gray-100 text-gray-800' },
    { value: 'account', label: 'حساب کاربری', color: 'bg-purple-100 text-purple-800' },
    { value: 'bug_report', label: 'گزارش باگ', color: 'bg-red-100 text-red-800' },
    { value: 'feature_request', label: 'درخواست ویژگی', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'فوری', color: 'bg-red-100 text-red-800' },
    { value: 'follow_up', label: 'پیگیری', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await supportService.getConversationMessages(conversation.id);
      setMessages(messagesData);
      
      // Mark messages as read when viewing
      if (currentUser.is_support_agent) {
        await supportService.markMessagesAsRead(conversation.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channelName = `support_chat_${conversation.id}_${Date.now()}`;
    channelRef.current = supabase.channel(channelName);
    
    channelRef.current
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messenger_messages' },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          if (newMessage.conversation_id === conversation.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversation.id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const sentMessage = await supportService.sendSupportMessage(
        conversation.id,
        newMessage,
        currentUser.id
      );
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      toast({
        title: 'موفق',
        description: 'پیام ارسال شد',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await supportService.updateConversationStatus(conversation.id, status);
      setSelectedStatus(status);
      onConversationUpdate?.({ ...conversation, status });
      
      toast({
        title: 'موفق',
        description: 'وضعیت گفتگو به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت',
        variant: 'destructive',
      });
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await supportService.updateConversationPriority(conversation.id, priority);
      setSelectedPriority(priority);
      onConversationUpdate?.({ ...conversation, priority });
      
      toast({
        title: 'موفق',
        description: 'اولویت گفتگو به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی اولویت',
        variant: 'destructive',
      });
    }
  };

  const toggleTag = async (tag: SupportTag) => {
    const newTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    try {
      await supportService.updateConversationTags(conversation.id, newTags);
      setSelectedTags(newTags);
      onConversationUpdate?.({ ...conversation, tag_list: newTags });
      
      toast({
        title: 'موفق',
        description: 'برچسب‌های گفتگو به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی برچسب‌ها',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'assigned': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-600';
      case 'normal': return 'text-blue-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {conversation.user?.name || 'کاربر نامشخص'} - #{conversation.id}
              </h3>
              <p className="text-sm text-slate-500">
                {conversation.thread_type?.display_name || 'عمومی'} • {conversation.user?.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status */}
            <div className="flex items-center gap-1">
              {getStatusIcon(selectedStatus)}
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">باز</SelectItem>
                  <SelectItem value="assigned">اختصاص یافته</SelectItem>
                  <SelectItem value="resolved">حل شده</SelectItem>
                  <SelectItem value="closed">بسته</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <Select value={selectedPriority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">کم</SelectItem>
                <SelectItem value="normal">عادی</SelectItem>
                <SelectItem value="high">زیاد</SelectItem>
                <SelectItem value="urgent">فوری</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <Badge
              key={tag.value}
              variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
              className={`cursor-pointer text-xs ${selectedTags.includes(tag.value) ? tag.color : ''}`}
              onClick={() => toggleTag(tag.value)}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-lg font-medium mb-2">هنوز پیامی ارسال نشده</p>
              <p className="text-sm">اولین پیام را ارسال کنید!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.is_from_support ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.is_from_support ? 'order-2' : 'order-1'}`}>
                {/* Sender info for user messages */}
                {!message.is_from_support && (
                  <div className="flex items-center gap-2 mb-1">
                    <MessageAvatar 
                      name={message.sender_name || 'کاربر'} 
                      userId={message.sender_id} 
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {message.sender_name || 'کاربر'}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.is_from_support
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-600'
                }`}>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className={`text-xs mt-2 flex items-center justify-between ${
                    message.is_from_support 
                      ? 'text-blue-100' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    <span>
                      {new Date(message.created_at || '').toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.unread_by_support && !message.is_from_support && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        جدید
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SupportChatView;

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Clock, CheckCircle, Archive, AlertCircle, Tag, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService, type SupportConversation, type SupportMessage } from '@/lib/supportService';
import { type MessengerUser } from '@/lib/messengerService';

interface ConversationWithUser extends SupportConversation {
  user?: {
    id: number;
    name: string;
    phone: string;
  };
  thread_type?: {
    id: number;
    display_name: string;
  };
  unread_count?: number;
}

interface SupportChatViewProps {
  conversation: ConversationWithUser;
  currentUser: MessengerUser;
  onBack: () => void;
  onConversationUpdate: (updatedConversation: ConversationWithUser) => void;
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
  const [status, setStatus] = useState(conversation.status || 'open');
  const [priority, setPriority] = useState(conversation.priority || 'normal');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await supportService.getConversationMessages(conversation.id);
      setMessages(fetchedMessages);
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

    const channel = supabase
      .channel(`support_conversation_${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          if (newMessage.conversation_id === conversation.id) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const sentMessage = await supportService.addConversationMessage(conversation.id, newMessage);
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessage('');

      // Optimistically update unread count to 0 after sending a message
      onConversationUpdate({ ...conversation, unread_count: 0 });

      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما با موفقیت ارسال شد.',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا در ارسال پیام',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await supportService.updateConversationStatus(conversation.id, newStatus);
      setStatus(newStatus);
      onConversationUpdate({ ...conversation, status: newStatus });
      toast({
        title: 'وضعیت بروزرسانی شد',
        description: `وضعیت به ${newStatus} تغییر یافت.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'خطا در بروزرسانی وضعیت',
        description: 'خطا در بروزرسانی وضعیت',
        variant: 'destructive',
      });
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await supportService.updateConversationPriority(conversation.id, newPriority);
      setPriority(newPriority);
      onConversationUpdate({ ...conversation, priority: newPriority });
      toast({
        title: 'اولویت بروزرسانی شد',
        description: `اولویت به ${newPriority} تغییر یافت.`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'خطا در بروزرسانی اولویت',
        description: 'خطا در بروزرسانی اولویت',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: 'باز', variant: 'destructive' as const },
      assigned: { label: 'در حال بررسی', variant: 'default' as const },
      resolved: { label: 'حل شده', variant: 'secondary' as const },
      closed: { label: 'بسته', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: 'کم', color: 'bg-gray-100 text-gray-800' },
      normal: { label: 'عادی', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'بالا', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'فوری', color: 'bg-red-100 text-red-800' }
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
    return (
      <Badge variant="outline" className={`text-xs ${priorityInfo.color}`}>
        {priorityInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پیام‌ها...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Button>
            
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">
              {conversation.user?.name || 'کاربر نامشخص'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(status)}
            {getPriorityBadge(priority)}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium mb-2">هنوز پیامی ارسال نشده</p>
              <p className="text-sm">اولین پیام را ارسال کنید!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender_id === currentUser.id ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 ${message.sender_id === currentUser.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-600'}`}>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className={`text-xs mt-2 ${message.sender_id === currentUser.id 
                    ? 'text-blue-100' 
                    : 'text-slate-500 dark:text-slate-400'}`}>
                    {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <Textarea
            placeholder="پیام خود را وارد کنید..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={1}
            className="resize-none flex-1"
          />
          <Button onClick={handleSendMessage} disabled={sending}>
            <Send className="w-4 h-4" />
            ارسال
          </Button>
        </div>
      </div>

      {/* Status and Priority Selectors */}
      <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between gap-4">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">باز</SelectItem>
              <SelectItem value="assigned">در حال بررسی</SelectItem>
              <SelectItem value="resolved">حل شده</SelectItem>
              <SelectItem value="closed">بسته</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اولویت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">کم</SelectItem>
              <SelectItem value="normal">عادی</SelectItem>
              <SelectItem value="high">بالا</SelectItem>
              <SelectItem value="urgent">فوری</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SupportChatView;

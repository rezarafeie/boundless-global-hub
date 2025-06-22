
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Tag, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService, type SupportConversation, type SupportMessage } from '@/lib/supportService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

interface SupportChatViewProps {
  conversation: SupportConversation;
  currentUser: MessengerUser;
  onConversationUpdate: () => void;
}

const SupportChatView: React.FC<SupportChatViewProps> = ({
  conversation,
  currentUser,
  onConversationUpdate
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await supportService.getConversationMessages(conversation.id);
      setMessages(messagesData);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = await supportService.sendSupportMessage(
        conversation.id,
        newMessage,
        currentUser.id
      );
      
      setMessages([...messages, message]);
      setNewMessage('');
      onConversationUpdate();
      
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
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {(conversation as any).user?.name || 'کاربر ناشناس'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={conversation.status === 'open' ? 'default' : 'secondary'}>
              {conversation.status === 'open' ? 'باز' : 
               conversation.status === 'resolved' ? 'حل شده' : 'در حال بررسی'}
            </Badge>
            {conversation.priority && (
              <Badge variant="outline">
                {conversation.priority === 'urgent' ? 'فوری' : 
                 conversation.priority === 'high' ? 'بالا' : 'عادی'}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          شماره تلفن: {(conversation as any).user?.phone || 'نامشخص'}
        </div>
        
        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4" />
            <span className="text-sm">برچسب‌ها:</span>
            {tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="افزودن برچسب..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button onClick={handleAddTag} size="sm">افزودن</Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center">در حال بارگذاری...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500">هنوز پیامی وجود ندارد</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.is_from_support ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.is_from_support
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}
              >
                <div className="mb-1">
                  <span className="text-xs opacity-75">
                    {message.sender_name}
                  </span>
                </div>
                <div>{message.message}</div>
                <div className="text-xs opacity-75 mt-1">
                  {message.created_at ? 
                    new Date(message.created_at).toLocaleTimeString('fa-IR') : 
                    ''
                  }
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="پاسخ خود را بنویسید..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SupportChatView;

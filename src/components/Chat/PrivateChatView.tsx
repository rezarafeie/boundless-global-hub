// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, UserPlus, Search, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { privateMessageService, type PrivateMessage, type PrivateConversation } from '@/lib/privateMessageService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from '@/hooks/use-debounce';
import UserProfileModal from './UserProfileModal';
import ExactSearchModal from './ExactSearchModal';

interface PrivateChatViewProps {
  conversation: PrivateConversation;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack: () => void;
}

const PrivateChatView: React.FC<PrivateChatViewProps> = ({
  conversation,
  currentUser,
  sessionToken,
  onBack
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MessengerUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [isStartChatModalOpen, setIsStartChatModalOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(searchTerm, 500);

  useEffect(() => {
    setDebouncedSearchTerm(debouncedValue);
  }, [debouncedValue]);

  useEffect(() => {
    loadMessages();
  }, [conversation]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchUsers(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversation?.id) return;

    console.log('Setting up realtime subscription for conversation:', conversation.id);
    
    const channel = supabase
      .channel(`private_messages_conversation_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('New private message received via realtime:', payload);
          const newMessage = payload.new as PrivateMessage;
          
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.find(msg => msg.id === newMessage.id);
            if (exists) return prev;
            
            // Add new message and sort by creation time
            return [...prev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('Private message updated via realtime:', payload);
          const updatedMessage = payload.new as PrivateMessage;
          
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for conversation:', conversation.id);
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const loadedMessages = await privateMessageService.getMessages(conversation.id, sessionToken);
      setMessages(loadedMessages);
      await privateMessageService.markConversationAsRead(conversation.id, sessionToken);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
        const tempMessage: PrivateMessage = {
          id: Date.now(),
          sender_id: currentUser.id,
          message: newMessage,
          created_at: new Date().toISOString(),
          conversation_id: conversation.id,
          is_read: false,
          message_type: 'text',
          media_url: null,
          media_content: null,
          reply_to_message_id: null,
          forwarded_from_message_id: null
        };
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage('');

      await privateMessageService.sendMessage(conversation.id, currentUser.id, newMessage);
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const searchUsers = async (term: string) => {
    try {
      const results = await messengerService.searchUsersByUsername(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setIsUserProfileOpen(true);
  };

  const handleStartChat = (user: MessengerUser) => {
    console.log('Starting chat with user:', user);
    setSelectedUser(user);
    setIsUserProfileOpen(false);
  };

  const createFullUser = (partialUser: any): MessengerUser => {
    return {
      id: partialUser.id,
      name: partialUser.name,
      username: partialUser.username,
      avatar_url: partialUser.avatar_url,
      phone: partialUser.phone,
      is_approved: true,
      is_messenger_admin: false,
      is_support_agent: false,
      bedoun_marz: false,
      bedoun_marz_approved: false,
      bedoun_marz_request: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: 'user',
      email: null,
      user_id: null,
      first_name: null,
      last_name: null,
      full_name: null,
      country_code: null,
      signup_source: null,
      bio: null,
      notification_enabled: true,
      notification_token: null,
      password_hash: null
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="border-b dark:border-slate-700 p-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          بازگشت
        </Button>
        <Avatar className="w-8 h-8 mr-2">
          <AvatarImage src={conversation.other_user?.avatar_url} alt={conversation.other_user?.name} />
          <AvatarFallback style={{ backgroundColor: getAvatarColor(conversation.other_user?.name || 'U') }} className="text-white font-medium">
            {conversation.other_user?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-900 dark:text-white">{conversation.other_user?.name}</div>
          {conversation.other_user?.username && (
            <div className="text-xs text-slate-500 dark:text-slate-400">@{conversation.other_user?.username}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <UserPlus className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsStartChatModalOpen(true)}>
              شروع گفتگو
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUserSelect(conversation.other_user)}>
              مشاهده پروفایل
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500 dark:text-slate-400" />
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-2 w-full ${message.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2">
                {message.sender_id !== currentUser.id && (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={conversation.other_user?.avatar_url} alt={conversation.other_user?.name} />
                    <AvatarFallback style={{ backgroundColor: getAvatarColor(conversation.other_user?.name || 'U') }} className="text-white font-medium">
                      {conversation.other_user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-xl px-3 py-2 text-sm break-words ${message.sender_id === currentUser.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                  {message.message}
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {format(new Date(message.created_at), 'yyyy/MM/dd HH:mm', { locale: da })}
              </span>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t dark:border-slate-700">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 resize-none"
        />
        <Button onClick={sendMessage} className="mt-2 w-full">
          Send <Send className="mr-2 h-4 w-4" />
        </Button>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        user={conversation.other_user}
        onStartChat={handleStartChat}
        currentUserId={currentUser?.id}
      />

			{/* Start Chat Modal */}
      <ExactSearchModal
        isOpen={isStartChatModalOpen}
        onClose={() => setIsStartChatModalOpen(false)}
        onUserSelect={(user) => {
          const fullUser = createFullUser({
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            phone: user.phone
          });
          // onStartChat(fullUser);
        }}
        sessionToken={sessionToken}
        currentUser={currentUser}
      />
    </div>
  );
};

export default PrivateChatView;

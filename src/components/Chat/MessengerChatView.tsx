
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Users, HeadphonesIcon } from 'lucide-react';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
}

interface MessengerChatViewProps {
  room: ChatRoom;
  currentUser: MessengerUser;
  onBack: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  room,
  currentUser,
  onBack
}) => {
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const cleanupChannel = () => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        console.log('Channel cleaned up successfully');
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  useEffect(() => {
    const setupMessagesAndSubscription = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch initial messages
        await fetchMessages();

        // Clean up any existing channel
        cleanupChannel();

        // Create unique channel name
        const channelName = `messages_${room.type}_${room.id}_${currentUser.id}_${Date.now()}`;
        
        channelRef.current = supabase.channel(channelName);
        
        channelRef.current
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messenger_messages' },
            (payload) => {
              try {
                const newMessage = payload.new as MessengerMessage;
                if (room.type === 'support_chat') {
                  // For support chat, show messages where user is sender or recipient
                  if (newMessage.sender_id === currentUser.id || newMessage.recipient_id === currentUser.id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                  }
                } else {
                  // For room messages, show messages in this room
                  if (newMessage.room_id === room.id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                  }
                }
              } catch (error) {
                console.error('Error processing new message:', error);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              console.log('Successfully subscribed to channel:', channelName);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel subscription error');
              setError('Connection error. Please refresh the page.');
            }
          });

      } catch (error) {
        console.error('Error setting up messages and subscription:', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    setupMessagesAndSubscription();

    return cleanupChannel;
  }, [room.id, room.type, currentUser.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      let fetchedMessages: MessengerMessage[] = [];
      if (room.type === 'support_chat') {
        fetchedMessages = await messengerService.getPrivateMessages(currentUser.id);
      } else {
        fetchedMessages = await messengerService.getRoomMessages(room.id);
      }
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await messengerService.sendMessage({
        room_id: room.type === 'support_chat' ? null : room.id,
        sender_id: currentUser.id,
        recipient_id: room.type === 'support_chat' ? 1 : null, // Assuming support agent has ID 1
        message: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const getChatHeader = () => {
    if (room.type === 'support_chat') {
      return (
        <div className="flex items-center gap-2">
          <HeadphonesIcon className="w-4 h-4 text-green-500" />
          <span>پشتیبانی</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <span>{room.name}</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-semibold text-slate-900 dark:text-white">
            {getChatHeader()}
          </div>
          <div></div> {/* Placeholder for alignment */}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 flex flex-col ${message.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-2/3 rounded-xl px-4 py-2 ${message.sender_id === currentUser.id
              ? 'bg-blue-100 dark:bg-blue-900 text-slate-900 dark:text-slate-50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50'}`}>
              {message.message}
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-l-md"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} className="rounded-r-md bg-blue-500 hover:bg-blue-600 text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessengerChatView;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Copy, CopyCheck, ImagePlus, Mic, MoreHorizontal, Send, Smile } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/sonner"
import { useTheme } from 'next-themes'

import { messengerService, type MessengerMessage } from '@/lib/messengerService';
import { useChat } from '@/hooks/useChat';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

interface MessengerChatViewProps {
  currentUser: any;
  sessionToken: string;
  selectedRoom: any;
  conversationId?: number;
}

interface OptimisticMessage extends MessengerMessage {
  tempId: string;
  isOptimistic: boolean;
  status: 'sending' | 'sent' | 'error';
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({ 
  currentUser, 
  sessionToken, 
  selectedRoom, 
  conversationId 
}) => {
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaContent, setMediaContent] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme()
  const { toast } = useToast()
  const { uploadFile } = useFileUpload();
  const {
    isConnected,
    connect,
    disconnect,
    sendMessage: sendChatMessage,
    messages: chatMessages,
  } = useChat();

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
    } else if (conversationId) {
      loadSupportMessages(conversationId);
    }
  }, [selectedRoom, conversationId, loadMessages, loadSupportMessages]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadMessages = useCallback(async (roomId: number) => {
    try {
      const messages = await messengerService.getMessages(roomId);
      const messagesWithDefaults = messages.map(msg => ({
        ...msg,
        recipient_id: msg.recipient_id || null,
        topic_id: msg.topic_id || null,
        unread_by_support: msg.unread_by_support || false
      }));
      setMessages(messagesWithDefaults);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const loadSupportMessages = useCallback(async (convId: number) => {
    try {
      const messages = await messengerService.getSupportMessages(convId);
      const messagesWithDefaults = messages.map(msg => ({
        ...msg,
        recipient_id: msg.recipient_id || null,
        topic_id: msg.topic_id || null,
        unread_by_support: msg.unread_by_support || false
      }));
      setMessages(messagesWithDefaults);
    } catch (error) {
      console.error('Error loading support messages:', error);
    }
  }, []);

  const handleTopicSelect = (topic: any) => {
    setSelectedTopic(topic);
  };

  const startRecording = () => {
    setIsRecording(true);
    // Implement audio recording logic here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Implement stop recording and save logic here
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      if (result && result.url) {
        setMediaUrl(result.url);
        setMediaType(file.type);
        setMediaContent(result.base64);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to upload image.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyClick = (message: string) => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const sendMessage = useCallback(async (messageText: string, mediaUrl?: string, mediaType?: string, mediaContent?: string) => {
    if (!currentUser || !sessionToken) {
      console.error('User not authenticated');
      return;
    }

    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const optimisticMessage: OptimisticMessage = {
      id: Date.now(),
      tempId,
      message: messageText,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      room_id: selectedRoom?.id || null,
      recipient_id: null,
      conversation_id: conversationId || null,
      topic_id: selectedTopic?.id || null,
      media_url: mediaUrl || null,
      media_content: mediaContent || null,
      message_type: mediaType || 'text',
      is_read: false,
      unread_by_support: false,
      reply_to_message_id: null,
      forwarded_from_message_id: null,
      sender: {
        name: currentUser.name,
        phone: currentUser.phone
      },
      isOptimistic: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      let sentMessage;
      
      if (conversationId) {
        // Support message
        sentMessage = await messengerService.sendSupportMessage(
          currentUser.id,
          messageText,
          conversationId,
          mediaUrl,
          mediaType,
          mediaContent
        );
      } else {
        // Regular message
        sentMessage = await messengerService.sendMessage(
          currentUser.id,
          messageText,
          selectedRoom?.id,
          undefined,
          conversationId || undefined,
          selectedTopic?.id,
          mediaUrl,
          mediaType,
          mediaContent
        );
      }

      if (sentMessage) {
        setMessages(prev => 
          prev.map(msg => 
            'tempId' in msg && msg.tempId === tempId 
              ? { ...sentMessage, sender: { name: currentUser.name, phone: currentUser.phone } }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => 
        prev.map(msg => 
          'tempId' in msg && msg.tempId === tempId 
            ? { ...msg, status: 'error' } 
            : msg
        )
      );
    }
  }, [currentUser, sessionToken, selectedRoom, conversationId, selectedTopic]);

  const handleSendClick = () => {
    sendMessage(newMessage, mediaUrl || undefined, mediaType || undefined, mediaContent || undefined);
    setMediaUrl(null);
    setMediaType(null);
    setMediaContent(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col">
                  <div className={`rounded-xl px-4 py-2 max-w-2xl break-words ${msg.sender_id === currentUser?.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {msg.message && <p className="text-sm">{msg.message}</p>}
                    {msg.media_url && (
                      <img src={msg.media_url} alt="Uploaded Media" className="max-w-full h-auto rounded-md" />
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleCopyClick(msg.message)}>
                            {isCopied ? <CopyCheck className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            <span>{isCopied ? "Copied!" : "Copy"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mood</DropdownMenuLabel>
              <DropdownMenuItem>Happy</DropdownMenuItem>
              <DropdownMenuItem>Sad</DropdownMenuItem>
              <DropdownMenuItem>Excited</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Custom</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" asChild>
            <label htmlFor="image-upload">
              <ImagePlus className="h-5 w-5" />
              <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </Button>
          {isRecording ? (
            <Button variant="ghost" size="icon" onClick={stopRecording}>
              <Mic className="h-5 w-5 text-red-500" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={startRecording}>
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendClick();
              }
            }}
          />
          <Button variant="ghost" size="icon" onClick={handleSendClick} disabled={!newMessage.trim() && !mediaUrl}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessengerChatView;

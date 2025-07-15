
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pin } from 'lucide-react';
import { useChatMessages } from '@/hooks/useRealtime';
import { chatService, chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ChatAuth from './ChatAuth';
import ChatPreview from './ChatPreview';
import ModernChatHeader from './ModernChatHeader';
import ModernChatMessage from './ModernChatMessage';
import ModernChatInput from './ModernChatInput';

const ChatSection: React.FC = () => {
  const { toast } = useToast();
  const { messages, loading: messagesLoading } = useChatMessages();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [userAvatars, setUserAvatars] = useState<Record<number, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('chat_session_token');
    if (token) {
      validateSession(token);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user avatars for all message senders
  useEffect(() => {
    const fetchUserAvatars = async () => {
      const userIds = [...new Set(messages.map(msg => msg.user_id).filter(Boolean))];
      if (userIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('chat_users')
          .select('id, avatar_url')
          .in('id', userIds);

        if (error) throw error;

        const avatarMap: Record<number, string> = {};
        data?.forEach(user => {
          if (user.avatar_url) {
            avatarMap[user.id] = user.avatar_url;
          }
        });
        
        setUserAvatars(avatarMap);
      } catch (error) {
        console.error('Error fetching user avatars:', error);
      }
    };

    fetchUserAvatars();
  }, [messages]);

  const validateSession = async (token: string) => {
    try {
      const result = await chatUserService.validateSession(token);
      if (result) {
        setSessionToken(token);
        setUserName(result.user.name);
        setCurrentUserId(result.user.id);
        setIsAuthenticated(true);
        setShowAuthForm(false);
      } else {
        localStorage.removeItem('chat_session_token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      localStorage.removeItem('chat_session_token');
      setIsAuthenticated(false);
    }
  };

  const handleAuthenticated = (token: string, name: string) => {
    setSessionToken(token);
    setUserName(name);
    setIsAuthenticated(true);
    setShowAuthForm(false);
  };

  const handleRegisterClick = () => {
    setShowAuthForm(true);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !sessionToken) return;

    try {
      const result = await chatUserService.validateSession(sessionToken);
      if (!result) {
        toast({
          title: 'خطا',
          description: 'جلسه شما منقضی شده است. دوباره وارد شوید.',
          variant: 'destructive',
        });
        handleLogout();
        return;
      }

      await chatService.sendMessage({
        message: messageText,
        sender_name: result.user.name,
        sender_role: 'member',
        user_id: result.user.id
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      toast({
        title: 'خطا',
        description: 'پیام ارسال نشد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    if (sessionToken) {
      chatUserService.deactivateSession(sessionToken);
    }
    localStorage.removeItem('chat_session_token');
    setSessionToken(null);
    setUserName('');
    setCurrentUserId(null);
    setIsAuthenticated(false);
    setShowAuthForm(false);
  };

  const pinnedMessages = messages.filter(msg => msg.is_pinned);
  const recentMessages = messages.slice(-50);

  // Container with minimum height to ensure proper modal positioning
  const containerClass = "space-y-6 min-h-[80vh]";

  if (showAuthForm) {
    return (
      <div className={containerClass}>
        <ChatAuth onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={containerClass}>
        <ChatPreview messages={messages} onRegisterClick={handleRegisterClick} />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50">
          <div className="p-4 border-b border-amber-200 dark:border-amber-700">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Pin className="w-5 h-5" />
              <span className="font-semibold">پیام‌های مهم</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {pinnedMessages.map((message) => (
              <div key={message.id} 
                   className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-amber-800 dark:text-amber-300">
                    {message.sender_name}
                  </span>
                  <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 text-xs">
                    {message.sender_role === 'admin' ? 'مدیر' : message.sender_role === 'moderator' ? 'مدیر بحث' : 'عضو'}
                  </Badge>
                </div>
                <p className="text-sm text-amber-900 dark:text-amber-200">{message.message}</p>
                <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block">
                  {new Date(message.created_at).toLocaleString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="overflow-hidden shadow-2xl border-slate-700 bg-slate-900">
        <ModernChatHeader
          userName={userName}
          onlineCount={Math.max(5, Math.floor(Math.random() * 20) + 5)}
          onLogout={handleLogout}
        />
        
        {/* Messages Area */}
        <div 
          ref={chatBoxRef}
          className="h-[500px] overflow-y-auto bg-slate-800 p-4"
        >
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-slate-400">در حال بارگذاری...</p>
              </div>
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-slate-300 text-lg font-medium mb-2">
                  اولین نفری باشید که پیام می‌فرستد!
                </p>
                <p className="text-slate-500 text-sm">
                  گفتگو رو شروع کنید
                </p>
              </div>
            </div>
          ) : (
            recentMessages.map((message) => (
              <ModernChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === currentUserId}
                senderAvatarUrl={message.user_id ? userAvatars[message.user_id] : undefined}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ModernChatInput 
          onSendMessage={handleSendMessage}
          disabled={messagesLoading}
        />
      </Card>
    </div>
  );
};

export default ChatSection;

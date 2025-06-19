
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChatMessages } from '@/hooks/useRealtime';
import { chatService, chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ChatAuth from './ChatAuth';
import ChatPreview from './ChatPreview';
import ModernChatHeader from './ModernChatHeader';
import ModernChatMessage from './ModernChatMessage';
import ModernChatInput from './ModernChatInput';

const ChatSection: React.FC = () => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const { messages, loading: messagesLoading } = useChatMessages();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('chat_session_token');
    if (token) {
      validateSession(token);
    }
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // Get user info from session
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

      // Auto scroll after sending
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

  // Get pinned messages
  const pinnedMessages = messages.filter(msg => msg.is_pinned);
  const recentMessages = messages.slice(-50); // Show more messages for better experience

  // Show auth form if user clicked register
  if (showAuthForm) {
    return <ChatAuth onAuthenticated={handleAuthenticated} />;
  }

  // Show preview for unregistered users
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <ChatPreview messages={messages} onRegisterClick={handleRegisterClick} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-t-lg">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Pin className="w-5 h-5" />
              <span className="font-semibold">پیام‌های مهم</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {pinnedMessages.map((message) => (
              <div key={message.id} 
                   className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-amber-800 dark:text-amber-300">
                    {message.sender_name}
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
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

      {/* Modern Chat Interface */}
      <Card className="overflow-hidden shadow-lg border-slate-200 dark:border-slate-700">
        {/* Chat Header */}
        <ModernChatHeader
          userName={userName}
          onlineCount={Math.max(5, Math.floor(Math.random() * 20) + 5)} // Simulated online count
          onLogout={handleLogout}
        />
        
        {/* Messages Area */}
        <div 
          ref={chatBoxRef}
          className="h-[500px] overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 space-y-1"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-500 dark:text-slate-400">در حال بارگذاری پیام‌ها...</p>
              </div>
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">اولین نفری باشید که پیام می‌فرستد!</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">گفتگو رو شروع کنید</p>
              </div>
            </div>
          ) : (
            recentMessages.map((message) => (
              <ModernChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === currentUserId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <ModernChatInput 
          onSendMessage={handleSendMessage}
          disabled={messagesLoading}
        />
      </Card>
    </div>
  );
};

export default ChatSection;

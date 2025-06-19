
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Pin, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChatMessages } from '@/hooks/useRealtime';
import { chatService, chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ChatAuth from './ChatAuth';
import ChatPreview from './ChatPreview';

const ChatSection: React.FC = () => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const { messages, loading: messagesLoading } = useChatMessages();
  const [messageText, setMessageText] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async () => {
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

      setMessageText('');
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
    setIsAuthenticated(false);
    setShowAuthForm(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر';
      case 'moderator': return 'مدیر بحث';
      default: return 'عضو';
    }
  };

  // Get pinned messages
  const pinnedMessages = messages.filter(msg => msg.is_pinned);
  const recentMessages = messages.slice(-20);

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-yellow-600" />
              پیام‌های سنجاق شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pinnedMessages.map((message) => (
                <div key={message.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.sender_name}</span>
                    <Badge className={getRoleColor(message.sender_role)}>
                      {getRoleText(message.sender_role)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{message.message}</p>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {new Date(message.created_at).toLocaleString('fa-IR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chat */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              چت گروهی
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                آنلاین
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">{recentMessages.length} پیام</span>
              </div>
              <span className="text-sm text-slate-600">
                خوش آمدید، {userName}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messagesLoading ? (
            <p className="text-center text-slate-500">در حال بارگذاری پیام‌ها...</p>
          ) : recentMessages.length === 0 ? (
            <p className="text-center text-slate-500">هیچ پیامی وجود ندارد</p>
          ) : (
            recentMessages.map((message) => (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg rounded-bl-none px-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.sender_name}</span>
                      <Badge className={getRoleColor(message.sender_role)}>
                        {getRoleText(message.sender_role)}
                      </Badge>
                      {message.is_pinned && <Pin className="w-3 h-3" />}
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(message.created_at).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        {/* Message Input */}
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-800">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatSection;

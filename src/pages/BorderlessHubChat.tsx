
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Clock, Sun, Moon, Loader2, CheckCircle } from 'lucide-react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { useChatMessagesByTopic } from '@/hooks/useChatMessagesByTopic';
import { chatService, chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import ChatAuth from '@/components/Chat/ChatAuth';
import TopicSelector from '@/components/Chat/TopicSelector';
import ChatTopicMessages from '@/components/Chat/ChatTopicMessages';
import ModernChatInput from '@/components/Chat/ModernChatInput';
import type { ChatTopic } from '@/types/supabase';

const BorderlessHubChat: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const { topics, loading: topicsLoading } = useChatTopics();
  const [activeTopic, setActiveTopic] = useState<ChatTopic | null>(null);
  const { messages, loading: messagesLoading } = useChatMessagesByTopic(activeTopic?.id || null);
  
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  // Set first topic as active when topics load
  useEffect(() => {
    if (topics.length > 0 && !activeTopic) {
      setActiveTopic(topics[0]);
    }
  }, [topics, activeTopic]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('chat_session_token');
    if (token) {
      validateSession(token);
    } else {
      setShowAuthForm(true);
    }
  }, []);

  const validateSession = async (token: string) => {
    try {
      const result = await chatUserService.validateSession(token);
      if (result) {
        setSessionToken(token);
        setUserName(result.user.name);
        setCurrentUserId(result.user.id);
        setIsAuthenticated(true);
        setIsApproved(true);
        setShowAuthForm(false);
      } else {
        localStorage.removeItem('chat_session_token');
        setShowAuthForm(true);
      }
    } catch (error) {
      localStorage.removeItem('chat_session_token');
      setShowAuthForm(true);
    }
  };

  const handleAuthenticated = (token: string, name: string) => {
    setSessionToken(token);
    setUserName(name);
    setIsAuthenticated(true);
    setIsApproved(true);
    setShowAuthForm(false);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !sessionToken || !activeTopic) return;

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
        user_id: result.user.id,
        topic_id: activeTopic.id
      });

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
    setIsApproved(false);
    setShowAuthForm(true);
  };

  const checkApprovalStatus = async () => {
    if (!sessionToken) return;
    
    setCheckingApproval(true);
    try {
      const result = await chatUserService.validateSession(sessionToken);
      if (result) {
        setIsApproved(true);
        toast({
          title: 'خوش آمدید!',
          description: 'حساب شما تایید شد و وارد چت شدید.',
        });
      }
    } catch (error) {
      // Silent fail for auto-check
    } finally {
      setCheckingApproval(false);
    }
  };

  // Show auth form if not authenticated
  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-black dark:to-slate-800 flex items-center justify-center" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <ChatAuth onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    );
  }

  // Show waiting for approval if authenticated but not approved
  if (isAuthenticated && !isApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-black dark:to-slate-800 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                {checkingApproval && (
                  <div className="absolute -top-1 -right-1">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              در انتظار تایید مدیر
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              درخواست شما ارسال شد. منتظر تایید مدیر باشید تا بتوانید در گفتگوها شرکت کنید.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={checkApprovalStatus}
                disabled={checkingApproval}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-2xl"
              >
                {checkingApproval ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    بررسی وضعیت
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate('/hub')}
                className="w-full h-12 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl font-medium"
              >
                بازگشت به مرکز ارتباط
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/hub')}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl h-10 px-4"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            بازگشت
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">💬 گفت‌وگوهای بدون مرز</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl h-10 w-10"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl h-10 px-4"
          >
            خروج
          </Button>
        </div>
      </div>

      {/* Topic Selector */}
      {!topicsLoading && topics.length > 0 && (
        <TopicSelector
          topics={topics}
          activeTopic={activeTopic}
          onTopicChange={setActiveTopic}
          isMobile={window.innerWidth < 768}
        />
      )}
      
      {/* Messages Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTopic ? (
          <ChatTopicMessages
            messages={messages}
            loading={messagesLoading}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            <div className="text-center p-8">
              <MessageCircle className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 text-lg font-medium mb-2">
                {topicsLoading ? 'در حال بارگذاری موضوعات...' : 'موضوعی برای گفتگو یافت نشد'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Input - Fixed at bottom */}
      {activeTopic && (
        <ModernChatInput 
          onSendMessage={handleSendMessage}
          disabled={messagesLoading}
        />
      )}
    </div>
  );
};

export default BorderlessHubChat;

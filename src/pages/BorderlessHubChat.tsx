
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { useChatMessagesByTopic } from '@/hooks/useChatMessagesByTopic';
import { chatService, chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ChatAuth from '@/components/Chat/ChatAuth';
import TopicSelector from '@/components/Chat/TopicSelector';
import ChatTopicMessages from '@/components/Chat/ChatTopicMessages';
import ModernChatInput from '@/components/Chat/ModernChatInput';
import type { ChatTopic } from '@/types/supabase';

const BorderlessHubChat: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800" dir="rtl">
          <div className="container mx-auto px-4 py-8">
            <ChatAuth onAuthenticated={handleAuthenticated} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show waiting for approval if authenticated but not approved
  if (isAuthenticated && !isApproved) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center" dir="rtl">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Clock className="w-16 h-16 text-amber-400" />
                  {checkingApproval && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                در انتظار تایید مدیر
              </h2>
              <p className="text-slate-400 mb-6">
                درخواست شما ارسال شد. منتظر تایید مدیر باشید تا بتوانید در گفتگوها شرکت کنید.
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={checkApprovalStatus}
                  disabled={checkingApproval}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {checkingApproval ? 'در حال بررسی...' : 'بررسی وضعیت'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/hub')}
                  className="w-full text-slate-400 hover:text-white"
                >
                  بازگشت به مرکز ارتباط
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800" dir="rtl">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/hub')}
                className="text-slate-300 hover:text-white"
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                بازگشت به مرکز ارتباط
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-white text-lg font-bold">💬 گفت‌وگوهای بدون مرز</p>
                <p className="text-slate-400 text-sm">خوش آمدید، {userName}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-slate-300 hover:text-white"
              >
                خروج
              </Button>
            </div>
          </div>

          {/* Chat Interface */}
          <Card className="h-[calc(100vh-200px)] overflow-hidden shadow-2xl border-slate-700 bg-slate-900 flex flex-col">
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
            {activeTopic ? (
              <ChatTopicMessages
                messages={messages}
                loading={messagesLoading}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-800">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-300 text-lg font-medium mb-2">
                    {topicsLoading ? 'در حال بارگذاری موضوعات...' : 'موضوعی برای گفتگو یافت نشد'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Chat Input */}
            {activeTopic && (
              <ModernChatInput 
                onSendMessage={handleSendMessage}
                disabled={messagesLoading}
              />
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubChat;

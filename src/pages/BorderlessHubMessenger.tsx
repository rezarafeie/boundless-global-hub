
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, MessageCircle, Users, Star, HeadphonesIcon, Sun, Moon } from 'lucide-react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { useChatMessagesByTopic } from '@/hooks/useChatMessagesByTopic';
import { chatService, chatUserService, chatTopicsService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import MessengerAuth from '@/components/Chat/MessengerAuth';
import MessengerInbox from '@/components/Chat/MessengerInbox';
import MessengerChat from '@/components/Chat/MessengerChat';
import SupportAgentMessenger from '@/components/Chat/SupportAgentMessenger';
import type { ChatTopic } from '@/types/supabase';

const BorderlessHubMessenger: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Auth state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSupportAgent, setIsSupportAgent] = useState(false);
  
  // Chat state
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { messages, loading: messagesLoading } = useChatMessagesByTopic(
    selectedConversation?.type === 'topic' ? selectedConversation.id : null
  );

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('chat_session_token');
    if (token) {
      validateSession(token);
    } else {
      setShowAuthForm(true);
    }
  }, []);

  // Load topics for authenticated users
  useEffect(() => {
    const loadTopics = async () => {
      if (!currentUser) return;
      
      try {
        const userTopics = await chatTopicsService.getAllForUser(currentUser.bedoun_marz_approved);
        setTopics(userTopics);
      } catch (error) {
        console.error('Error loading topics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && !isSupportAgent) {
      loadTopics();
    } else {
      setLoading(false);
    }
  }, [currentUser, isSupportAgent]);

  const validateSession = async (token: string) => {
    try {
      const result = await chatUserService.validateSession(token);
      if (result) {
        setSessionToken(token);
        setUserName(result.user.name);
        setCurrentUserId(result.user.id);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        setIsSupportAgent(result.session.is_support_agent);
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
    setShowAuthForm(false);
    validateSession(token);
  };

  const handleLogout = () => {
    if (sessionToken) {
      chatUserService.deactivateSession(sessionToken);
    }
    localStorage.removeItem('chat_session_token');
    setSessionToken(null);
    setUserName('');
    setCurrentUserId(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsSupportAgent(false);
    setShowAuthForm(true);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !sessionToken || !selectedConversation) return;

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

      if (selectedConversation.type === 'topic') {
        await chatService.sendMessage({
          message: messageText,
          sender_name: result.user.name,
          sender_role: 'member',
          user_id: result.user.id,
          topic_id: selectedConversation.id
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'پیام ارسال نشد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToInbox = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-black dark:to-slate-800 flex items-center justify-center" dir="rtl">
        <MessengerAuth onAuthenticated={handleAuthenticated} />
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
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            {isSupportAgent ? '🎧 پنل پشتیبانی' : '📩 پیام‌رسان بدون مرز'}
          </h1>
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
            <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
              {isSupportAgent && <HeadphonesIcon className="w-4 h-4 text-green-500" />}
              {currentUser?.bedoun_marz_approved && <Star className="w-4 h-4 text-amber-500" />}
              {userName}
            </p>
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

      {/* Main Content - Telegram-like Layout */}
      <div className="flex-1 flex overflow-hidden">
        {isSupportAgent ? (
          <SupportAgentMessenger currentUserId={currentUserId!} userName={userName} />
        ) : (
          <>
            {/* Left Panel - Inbox (Desktop) / Mobile Toggle */}
            <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}>
              <MessengerInbox
                topics={topics}
                currentUser={currentUser}
                onConversationSelect={handleConversationSelect}
                selectedConversation={selectedConversation}
                loading={loading}
              />
            </div>

            {/* Right Panel - Chat View */}
            <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50 dark:bg-slate-800`}>
              {selectedConversation ? (
                <MessengerChat
                  conversation={selectedConversation}
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onBack={handleBackToInbox}
                  showBackButton={showMobileChat}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-8">
                    <MessageCircle className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
                      گفتگویی انتخاب کنید
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      برای شروع پیام‌رسانی، یکی از گفتگوها را انتخاب کنید
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BorderlessHubMessenger;

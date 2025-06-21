
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, ArrowLeft, Users, Clock, Smile } from 'lucide-react';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ChatAuth from '@/components/Chat/ChatAuth';
import ChatSection from '@/components/Chat/ChatSection';

const BorderlessHubChat = () => {
  const { translations, language } = useLanguage();
  const isRTL = language === 'fa';
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('chat_session_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const validation = await chatUserService.validateSession(token);
      if (validation) {
        setIsAuthenticated(true);
        setIsApproved(validation.user.is_approved);
        setUserName(validation.user.name);
        setSessionToken(token);
      } else {
        localStorage.removeItem('chat_session_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('chat_session_token');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, name: string) => {
    setSessionToken(token);
    setUserName(name);
    setIsAuthenticated(true);
    setIsApproved(true);
  };

  const handleLogout = async () => {
    if (sessionToken) {
      await chatUserService.deactivateSession(sessionToken);
      localStorage.removeItem('chat_session_token');
    }
    setIsAuthenticated(false);
    setIsApproved(false);
    setUserName('');
    setSessionToken(null);
    navigate('/hub');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-green-600 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'}`}>
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/hub')}
                  className="text-slate-600 hover:text-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                    چت گروهی بدون مرز
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <ChatAuth onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isApproved) {
    return (
      <MainLayout>
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'} flex items-center justify-center`}>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="relative mb-6">
                <Clock className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                در انتظار تایید
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                سلام {userName}، درخواست شما ارسال شده است. لطفاً منتظر تایید مدیر باشید.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/hub')}
                  variant="outline"
                  className="flex-1"
                >
                  بازگشت به مرکز
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="flex-1"
                >
                  خروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={`h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 ${isRTL ? 'rtl' : 'ltr'} flex flex-col`}>
        {/* Chat Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b flex-shrink-0">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/hub')}
                  className="text-slate-600 hover:text-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                      چت گروهی بدون مرز
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      خوش آمدید {userName}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Users className="w-3 h-3 mr-1" />
                  آنلاین
                </Badge>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-slate-600"
                >
                  خروج
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatSection />
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubChat;

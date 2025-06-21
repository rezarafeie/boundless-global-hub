
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { messengerService } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';

const MessengerPending: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Auto-check status every 5 seconds
    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 5000);

    // Initial check
    checkApprovalStatus();

    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    const token = localStorage.getItem('messenger_session_token');
    if (!token) {
      navigate('/hub/messenger');
      return;
    }

    try {
      const result = await messengerService.validateSession(token);
      if (result && result.user.is_approved) {
        toast({
          title: 'تایید شدید!',
          description: 'حساب شما تایید شد. در حال انتقال به پیام‌رسان...',
        });
        setTimeout(() => {
          navigate('/hub/messenger');
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  };

  const handleManualRefresh = async () => {
    setChecking(true);
    await checkApprovalStatus();
    setTimeout(() => setChecking(false), 1000);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('messenger_session_token');
    if (token) {
      messengerService.deactivateSession(token);
    }
    localStorage.removeItem('messenger_session_token');
    navigate('/hub/messenger');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          ⏳ منتظر تایید ادمین هستید...
        </h2>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          به محض تایید حساب شما توسط مدیریت، به صورت خودکار وارد پیام‌رسان خواهید شد.
        </p>

        {/* Status indicator */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">در حال بررسی خودکار...</span>
          </div>
        </div>

        {/* Manual refresh button */}
        <Button
          onClick={handleManualRefresh}
          disabled={checking}
          className="w-full mb-4 bg-blue-500 hover:bg-blue-600 text-white"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              در حال بررسی...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              🔁 بررسی مجدد وضعیت
            </>
          )}
        </Button>

        {/* Logout option */}
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          خروج از حساب
        </button>
      </Card>
    </div>
  );
};

export default MessengerPending;

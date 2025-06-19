
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ChatAuthProps {
  onAuthenticated: (sessionToken: string, userName: string) => void;
}

const ChatAuth: React.FC<ChatAuthProps> = ({ onAuthenticated }) => {
  const { translations } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  // Auto-check approval status every 30 seconds when registered
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRegistered) {
      interval = setInterval(checkApprovalStatus, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRegistered, phone]);

  const checkApprovalStatus = async () => {
    if (!phone) return;
    
    setCheckingApproval(true);
    try {
      const approvedUsers = await chatUserService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        // Create session for approved user
        const session = await chatUserService.createSession(existingUser.id);
        localStorage.setItem('chat_session_token', session.session_token);
        onAuthenticated(session.session_token, existingUser.name);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً نام و شماره تلفن خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists and is approved
      const approvedUsers = await chatUserService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        // Create session for approved user
        const session = await chatUserService.createSession(existingUser.id);
        localStorage.setItem('chat_session_token', session.session_token);
        onAuthenticated(session.session_token, existingUser.name);
        return;
      }

      // Register new user
      await chatUserService.register(name, phone);
      setIsRegistered(true);
      toast({
        title: 'ثبت‌نام موفق',
        description: 'درخواست شما ارسال شد. منتظر تایید مدیر باشید.',
      });
    } catch (error: any) {
      if (error.message.includes('duplicate key')) {
        toast({
          title: 'اطلاعات ثبت شده',
          description: 'این شماره تلفن قبلاً ثبت شده است. منتظر تایید مدیر باشید.',
        });
        setIsRegistered(true);
      } else {
        toast({
          title: 'خطا',
          description: 'مشکلی در ثبت‌نام پیش آمد. دوباره تلاش کنید.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="w-16 h-16 text-blue-600" />
              {checkingApproval && (
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin absolute -top-2 -right-2" />
              )}
            </div>
          </div>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            در انتظار تایید مدیر
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              درخواست شما با موفقیت ارسال شد
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              شماره تلفن: {phone}
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              درخواست شما در حال بررسی است. پس از تایید مدیر، خودکار وارد چت خواهید شد.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              onClick={checkApprovalStatus}
              disabled={checkingApproval}
              className="w-full"
            >
              {checkingApproval ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  بررسی وضعیت تایید
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setIsRegistered(false)}
              className="w-full"
            >
              ویرایش اطلاعات
            </Button>
          </div>

          <div className="text-xs text-slate-500 mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded">
            <p>💡 نکته: وضعیت تایید شما هر 30 ثانیه بررسی می‌شود</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ورود به چت گروهی</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">نام و نام خانوادگی</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام خود را وارد کنید"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">شماره تلفن</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'در حال ارسال...' : 'درخواست عضویت'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatAuth;

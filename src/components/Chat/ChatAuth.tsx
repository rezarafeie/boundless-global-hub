
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Clock, CheckCircle, User, Phone } from 'lucide-react';

interface ChatAuthProps {
  onAuthenticated: (sessionToken: string, userName: string) => void;
}

const ChatAuth: React.FC<ChatAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

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
      const approvedUsers = await chatUserService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        const session = await chatUserService.createSession(existingUser.id);
        localStorage.setItem('chat_session_token', session.session_token);
        onAuthenticated(session.session_token, existingUser.name);
        return;
      }

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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Clock className="w-12 h-12 text-amber-400" />
                {checkingApproval && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            <CardTitle className="text-white text-xl">
              در انتظار تایید
            </CardTitle>
            <p className="text-slate-400 text-sm">
              درخواست شما ارسال شد
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-slate-300 text-sm">
                شماره تلفن: {phone}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={checkApprovalStatus}
              disabled={checkingApproval}
              className="w-full bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
            >
              {checkingApproval ? 'در حال بررسی...' : 'بررسی وضعیت'}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setIsRegistered(false)}
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              ویرایش اطلاعات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <MessageCircle className="w-12 h-12 text-amber-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <CardTitle className="text-white text-xl">
            ورود به چت گروهی
          </CardTitle>
          <p className="text-slate-400 text-sm">
            برای شرکت در گفتگو، لطفاً اطلاعات خود را وارد کنید
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                نام و نام خانوادگی
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                شماره تلفن
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-400"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'در حال ارسال...' : 'درخواست عضویت'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatAuth;

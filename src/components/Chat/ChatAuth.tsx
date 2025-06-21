
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Clock, CheckCircle, User, Phone, Loader2, Star } from 'lucide-react';

interface ChatAuthProps {
  onAuthenticated: (sessionToken: string, userName: string) => void;
}

const ChatAuth: React.FC<ChatAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bedounMarzRequest, setBedounMarzRequest] = useState(false);
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

      await chatUserService.register(name, phone, bedounMarzRequest);
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
        <Card className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                {checkingApproval && (
                  <div className="absolute -top-1 -right-1">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <CardTitle className="text-slate-900 dark:text-white text-xl font-bold">
              در انتظار تایید
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              درخواست شما ارسال شد
              {bedounMarzRequest && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  ✨ با درخواست دسترسی بدون مرز
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm text-center font-medium">
                شماره تلفن: {phone}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={checkApprovalStatus}
              disabled={checkingApproval}
              className="w-full h-12 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-2xl font-medium"
            >
              {checkingApproval ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                'بررسی وضعیت'
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setIsRegistered(false)}
              className="w-full h-12 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl font-medium"
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
      <Card className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
            </div>
          </div>
          <CardTitle className="text-slate-900 dark:text-white text-xl font-bold">
            ورود به چت گروهی
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed">
            برای شرکت در گفتگو، لطفاً اطلاعات خود را وارد کنید
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                نام و نام خانوادگی
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="h-12 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl px-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                شماره تلفن
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                className="h-12 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl px-4"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
              <Checkbox
                id="bedoun-marz"
                checked={bedounMarzRequest}
                onCheckedChange={(checked) => setBedounMarzRequest(checked as boolean)}
                className="border-amber-500 data-[state=checked]:bg-amber-500"
              />
              <Label htmlFor="bedoun-marz" className="text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2 cursor-pointer">
                <Star className="w-4 h-4" />
                دانش‌پذیر بدون مرز هستم
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                'درخواست عضویت'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatAuth;

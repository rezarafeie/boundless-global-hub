
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Loader2, Star, CheckCircle } from 'lucide-react';

interface MessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string) => void;
}

const MessengerAuth: React.FC<MessengerAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [bedounMarzRequest, setBedounMarzRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNameField, setShowNameField] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        title: 'خطا',
        description: 'شماره تلفن خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user exists and is approved
      const approvedUsers = await chatUserService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        // User exists and is approved, log them in
        const session = await chatUserService.createSession(existingUser.id);
        localStorage.setItem('chat_session_token', session.session_token);
        onAuthenticated(session.session_token, existingUser.name);
        return;
      }

      // Check if user exists but not approved
      const allUsers = await chatUserService.getAllUsers();
      const pendingUser = allUsers.find(user => user.phone === phone && !user.is_approved);
      
      if (pendingUser) {
        setWaitingApproval(true);
        toast({
          title: 'منتظر تایید',
          description: 'حساب شما در انتظار تایید مدیر است.',
        });
        return;
      }

      // User doesn't exist, show registration form
      setShowNameField(true);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی پیش آمد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await chatUserService.register(name, phone, bedounMarzRequest);
      setWaitingApproval(true);
      toast({
        title: 'ثبت‌نام موفق',
        description: 'درخواست شما ارسال شد. منتظر تایید مدیر باشید.',
      });
    } catch (error: any) {
      if (error.message.includes('duplicate key')) {
        setWaitingApproval(true);
        toast({
          title: 'اطلاعات ثبت شده',
          description: 'این شماره تلفن قبلاً ثبت شده است. منتظر تایید مدیر باشید.',
        });
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

  const checkApprovalStatus = async () => {
    setLoading(true);
    try {
      const approvedUsers = await chatUserService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        const session = await chatUserService.createSession(existingUser.id);
        localStorage.setItem('chat_session_token', session.session_token);
        onAuthenticated(session.session_token, existingUser.name);
        toast({
          title: 'خوش آمدید!',
          description: 'حساب شما تایید شد.',
        });
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (waitingApproval) {
    return (
      <Card className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center py-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
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
          <Button 
            onClick={checkApprovalStatus}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-2xl"
          >
            {loading ? (
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
            onClick={() => {
              setWaitingApproval(false);
              setShowNameField(false);
              setPhone('');
              setName('');
            }}
            className="w-full h-12 text-gray-600 dark:text-gray-400"
          >
            ویرایش اطلاعات
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <CardTitle className="text-slate-900 dark:text-white text-xl font-bold">
          ورود به پیام‌رسان بدون مرز
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
          شماره تلفن خود را وارد کنید
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {!showNameField ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
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
                className="h-12 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-2xl px-4"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-2xl" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                'ادامه'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium">
                نام و نام خانوادگی
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="h-12 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-2xl px-4"
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
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-2xl" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال ثبت‌نام...
                </>
              ) : (
                'ثبت‌نام'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default MessengerAuth;

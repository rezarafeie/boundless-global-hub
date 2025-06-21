
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { messengerService } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, User, Lock, Loader2 } from 'lucide-react';

interface MessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: any) => void;
}

const MessengerAuth: React.FC<MessengerAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isBoundlessStudent, setIsBoundlessStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [step, setStep] = useState<'phone' | 'auth'>('phone');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً شماره تلفن خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user exists
      const approvedUsers = await messengerService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        setIsNewUser(false);
        setStep('auth');
      } else {
        setIsNewUser(true);
        setStep('auth');
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی در بررسی اطلاعات پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNewUser && !name.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً نام خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً رمز عبور را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (isNewUser) {
        // Register new user
        const userData = await messengerService.register(
          name.trim(),
          phone.trim(),
          isBoundlessStudent
        );
        
        // Create session
        const session = await messengerService.createSession(userData.id);
        onAuthenticated(session.session_token, userData.name, userData);
        
        toast({
          title: 'ثبت‌نام موفق',
          description: isBoundlessStudent 
            ? 'حساب شما ایجاد شد. منتظر تایید درخواست بدون مرز باشید.'
            : 'حساب شما ایجاد شد و وارد پیام‌رسان شدید.',
        });
      } else {
        // Login existing user
        const approvedUsers = await messengerService.getApprovedUsers();
        const user = approvedUsers.find(u => u.phone === phone);
        
        if (user) {
          // In a real app, you'd verify the password here
          const session = await messengerService.createSession(user.id);
          onAuthenticated(session.session_token, user.name, user);
        } else {
          throw new Error('کاربر یافت نشد');
        }
      }
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        toast({
          title: 'اطلاعات ثبت شده',
          description: 'این شماره تلفن قبلاً ثبت شده است.',
        });
      } else {
        toast({
          title: 'خطا',
          description: isNewUser ? 'مشکلی در ثبت‌نام پیش آمد.' : 'اطلاعات ورود نادرست است.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setPassword('');
    setName('');
    setIsBoundlessStudent(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            پیام‌رسان بدون مرز
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {step === 'phone' 
              ? 'برای ورود شماره تلفن خود را وارد کنید'
              : isNewUser 
                ? 'اطلاعات خود را برای ثبت‌نام وارد کنید'
                : 'رمز عبور خود را وارد کنید'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  شماره تلفن
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  className="h-12 text-center"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium" 
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
            <form onSubmit={handleAuth} className="space-y-6">
              {isNewUser && (
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
                    className="h-12"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  رمز عبور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isNewUser ? "رمز عبور را انتخاب کنید" : "رمز عبور خود را وارد کنید"}
                  className="h-12"
                  required
                />
              </div>

              {isNewUser && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="boundless"
                    checked={isBoundlessStudent}
                    onCheckedChange={(checked) => setIsBoundlessStudent(checked as boolean)}
                  />
                  <Label 
                    htmlFor="boundless" 
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    دانش‌پذیر بدون مرز هستم
                  </Label>
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isNewUser ? 'در حال ثبت‌نام...' : 'در حال ورود...'}
                    </>
                  ) : (
                    isNewUser ? 'ثبت‌نام' : 'ورود'
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full"
                >
                  بازگشت
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessengerAuth;

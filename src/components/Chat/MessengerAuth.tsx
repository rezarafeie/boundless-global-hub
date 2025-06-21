
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, User, Loader2 } from 'lucide-react';

interface MessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: any) => void;
}

const MessengerAuth: React.FC<MessengerAuthProps> = ({ onAuthenticated }) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isBoundlessStudent, setIsBoundlessStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);

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
      // Check if user exists and is approved
      const approvedUsers = await chatUserService.getApprovedUsers();
      const existingUser = approvedUsers.find(user => user.phone === phone);
      
      if (existingUser) {
        // User exists and is approved - login directly
        const session = await chatUserService.createSession(existingUser.id);
        onAuthenticated(session.session_token, existingUser.name, existingUser);
        return;
      }

      // Check if user exists but not approved
      // If not, show name form for registration
      setShowNameForm(true);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً نام خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: name.trim(),
        phone: phone.trim(),
        bedoun_marz_request: isBoundlessStudent
      };

      await chatUserService.register(userData.name, userData.phone);
      
      // Update boundless request if needed
      if (isBoundlessStudent) {
        // This would need to be implemented in the service
        // For now, we'll show success message
      }

      toast({
        title: 'ثبت‌نام موفق',
        description: 'درخواست شما ارسال شد. منتظر تایید مدیریت باشید.',
      });

      // Reset form
      setPhone('');
      setName('');
      setIsBoundlessStudent(false);
      setShowNameForm(false);
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        toast({
          title: 'اطلاعات ثبت شده',
          description: 'این شماره تلفن قبلاً ثبت شده است. منتظر تایید مدیریت باشید.',
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
            برای ورود شماره تلفن خود را وارد کنید
          </p>
        </CardHeader>
        
        <CardContent>
          {!showNameForm ? (
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
                  className="h-12"
                  required
                />
              </div>

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
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium" 
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
                
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNameForm(false)}
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

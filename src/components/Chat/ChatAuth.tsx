
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
          title: 'خطا',
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
      <Card>
        <CardHeader>
          <CardTitle>در انتظار تایید</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-600 dark:text-slate-300">
            درخواست شما ارسال شد. پس از تایید مدیر، می‌توانید در چت شرکت کنید.
          </p>
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={() => setIsRegistered(false)}
          >
            ویرایش اطلاعات
          </Button>
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

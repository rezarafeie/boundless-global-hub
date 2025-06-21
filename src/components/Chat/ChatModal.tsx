
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, User, Phone, X } from 'lucide-react';
import { chatUserService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ChatSection from './ChatSection';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

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
        setSessionToken(session.session_token);
        setUserName(existingUser.name);
        setIsAuthenticated(true);
        toast({
          title: 'خوش آمدید!',
          description: 'با موفقیت وارد چت شدید.',
        });
        return;
      }

      await chatUserService.register(name, phone);
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

  const handleClose = () => {
    if (isAuthenticated && sessionToken) {
      chatUserService.deactivateSession(sessionToken);
      localStorage.removeItem('chat_session_token');
    }
    setIsAuthenticated(false);
    setSessionToken(null);
    setUserName('');
    setName('');
    setPhone('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex items-center justify-between p-6 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <MessageCircle className="w-6 h-6 text-green-600" />
              چت گروهی بدون مرز
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="h-[70vh] overflow-auto">
          {!isAuthenticated ? (
            <div className="p-6">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      ورود به چت گروهی
                    </h3>
                    <p className="text-slate-600 text-sm">
                      برای شرکت در گفتگو، لطفاً اطلاعات خود را وارد کنید
                    </p>
                  </div>
                  
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        نام و نام خانوادگی
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="نام خود را وارد کنید"
                        className="border-slate-300 focus:border-green-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        شماره تلفن
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09xxxxxxxxx"
                        className="border-slate-300 focus:border-green-500"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? 'در حال ارسال...' : 'درخواست عضویت'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full">
              <ChatSection />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;

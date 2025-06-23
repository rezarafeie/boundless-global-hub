
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { User, Phone, AtSign, Lock, Loader2 } from 'lucide-react';

interface UserEditModalProps {
  user: MessengerUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    username: user?.username || '',
    password: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        username: user.username || '',
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const updates: any = {};
      
      if (formData.name !== user.name) updates.name = formData.name;
      if (formData.phone !== user.phone) updates.phone = formData.phone;
      if (formData.username !== (user.username || '')) updates.username = formData.username;
      if (formData.password.trim()) updates.password = formData.password;

      if (Object.keys(updates).length === 0) {
        toast({
          title: 'هیچ تغییری',
          description: 'هیچ تغییری در اطلاعات کاربر اعمال نشده است',
        });
        onClose();
        return;
      }

      await messengerService.updateUserDetails(user.id, updates);
      
      toast({
        title: 'موفق',
        description: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد',
      });
      
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در به‌روزرسانی اطلاعات کاربر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateUsername = (username: string) => {
    if (!username) return true;
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(username);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            ویرایش اطلاعات کاربر
          </DialogTitle>
        </DialogHeader>
        
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                نام و نام خانوادگی
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام کامل"
                required
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                شماره تلفن
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                required
                dir="ltr"
              />
              {formData.phone && !validatePhone(formData.phone) && (
                <p className="text-sm text-red-500">شماره تلفن باید با ۰۹ شروع شده و ۱۱ رقم باشد</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                نام کاربری
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                placeholder="username"
                dir="ltr"
              />
              {formData.username && !validateUsername(formData.username) && (
                <p className="text-sm text-red-500">نام کاربری باید بین ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی کوچک، اعداد و _ باشد</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                رمز عبور جدید (اختیاری)
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="رمز عبور جدید را وارد کنید"
              />
              <p className="text-xs text-gray-500">
                اگر می‌خواهید رمز عبور را تغییر دهید، رمز جدید را وارد کنید
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={loading || (formData.phone && !validatePhone(formData.phone)) || (formData.username && !validateUsername(formData.username))}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تغییرات'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                انصراف
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserEditModal;


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { User, Phone, AtSign, Lock, Loader2, Shield } from 'lucide-react';

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
    role: user?.role || 'user',
    is_support_agent: user?.is_support_agent || false,
    is_messenger_admin: user?.is_messenger_admin || false,
    bedoun_marz_approved: user?.bedoun_marz_approved || false,
    is_approved: user?.is_approved || false,
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        username: user.username || '',
        password: '',
        role: user.role || 'user',
        is_support_agent: user.is_support_agent || false,
        is_messenger_admin: user.is_messenger_admin || false,
        bedoun_marz_approved: user.bedoun_marz_approved || false,
        is_approved: user.is_approved || false,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const updates: any = {};
      
      // Basic info updates
      if (formData.name !== user.name) updates.name = formData.name;
      if (formData.phone !== user.phone) updates.phone = formData.phone;
      if (formData.username !== (user.username || '')) updates.username = formData.username;
      if (formData.password.trim()) updates.password = formData.password;
      
      // Role updates
      if (formData.role !== (user.role || 'user')) updates.role = formData.role;
      if (formData.is_support_agent !== (user.is_support_agent || false)) updates.is_support_agent = formData.is_support_agent;
      if (formData.is_messenger_admin !== (user.is_messenger_admin || false)) updates.is_messenger_admin = formData.is_messenger_admin;
      if (formData.bedoun_marz_approved !== (user.bedoun_marz_approved || false)) updates.bedoun_marz_approved = formData.bedoun_marz_approved;
      if (formData.is_approved !== (user.is_approved || false)) updates.is_approved = formData.is_approved;

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

  const validateUsername = (username: string) => {
    if (!username) return true;
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(username);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            ویرایش اطلاعات کاربر
          </DialogTitle>
        </DialogHeader>
        
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-medium text-sm text-slate-600">اطلاعات پایه</h3>
              
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
                  placeholder="شماره تلفن"
                  required
                  dir="ltr"
                />
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
            </div>

            {/* Role and Permissions */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                نقش‌ها و دسترسی‌ها
              </h3>

              <div className="space-y-2">
                <Label htmlFor="role">نقش اصلی</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">کاربر عادی</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                    <SelectItem value="support">پشتیبان</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_approved" className="text-sm">
                    تایید شده
                  </Label>
                  <Switch
                    id="is_approved"
                    checked={formData.is_approved}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_approved: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_support_agent" className="text-sm">
                    پشتیبان
                  </Label>
                  <Switch
                    id="is_support_agent"
                    checked={formData.is_support_agent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_support_agent: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_messenger_admin" className="text-sm">
                    مدیر پیام‌رسان
                  </Label>
                  <Switch
                    id="is_messenger_admin"
                    checked={formData.is_messenger_admin}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_messenger_admin: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bedoun_marz_approved" className="text-sm">
                    دسترسی بدون مرز
                  </Label>
                  <Switch
                    id="bedoun_marz_approved"
                    checked={formData.bedoun_marz_approved}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bedoun_marz_approved: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={loading || (formData.username && !validateUsername(formData.username))}
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

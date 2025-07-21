
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MessengerUser | null;
  onUserUpdate: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdate
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    username: user?.username || '',
    role: user?.role || 'user',
    is_approved: user?.is_approved || false,
    is_messenger_admin: user?.is_messenger_admin || false,
    is_support_agent: user?.is_support_agent || false,
    bedoun_marz_approved: user?.bedoun_marz_approved || false,
    password: '' // For password reset
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        username: user.username || '',
        role: user.role || 'user',
        is_approved: user.is_approved,
        is_messenger_admin: user.is_messenger_admin,
        is_support_agent: user.is_support_agent || false,
        bedoun_marz_approved: user.bedoun_marz_approved,
        password: ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Prepare update data
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        username: formData.username || null,
        role: formData.role,
        is_approved: formData.is_approved,
        is_messenger_admin: formData.is_messenger_admin,
        is_support_agent: formData.is_support_agent,
        bedoun_marz_approved: formData.bedoun_marz_approved
      };

      // Include password if provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await messengerService.updateUser(user.id, updateData);
      
      toast({
        title: 'موفق',
        description: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد',
      });
      
      onUserUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی اطلاعات کاربر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ویرایش کاربر</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام کامل</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="نام کامل کاربر"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">شماره تلفن</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="شماره تلفن"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="نام کاربری (اختیاری)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور جدید</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="رمز عبور جدید (در صورت تمایل به تغییر)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">نقش کاربر</Label>
              <Select value={formData.role} onValueChange={(value: 'user' | 'admin' | 'support') => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="نقش را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">کاربر عادی</SelectItem>
                  <SelectItem value="support">پشتیبانی</SelectItem>
                  <SelectItem value="admin">مدیر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">مجوزها و دسترسی‌ها</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="is_approved">تایید شده</Label>
              <Switch
                id="is_approved"
                checked={formData.is_approved}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_approved: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_support_agent">نماینده پشتیبانی</Label>
              <Switch
                id="is_support_agent"
                checked={formData.is_support_agent}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_support_agent: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_messenger_admin">مدیر پیام‌رسان</Label>
              <Switch
                id="is_messenger_admin"
                checked={formData.is_messenger_admin}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_messenger_admin: checked })
                }
              />
            </div>

            {user.bedoun_marz_request && (
              <div className="flex items-center justify-between">
                <Label htmlFor="bedoun_marz_approved">تایید بدون مرز</Label>
                <Switch
                  id="bedoun_marz_approved"
                  checked={formData.bedoun_marz_approved}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, bedoun_marz_approved: checked })
                  }
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.name.trim() || !formData.phone.trim()} 
              className="flex-1"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              لغو
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditModal;

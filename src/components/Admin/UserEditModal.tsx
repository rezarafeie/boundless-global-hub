
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
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    username: user?.username || '',
    bedoun_marz: user?.bedoun_marz || false,
    password: '' // For password reset
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        email: user.email || '',
        username: user.username || '',
        bedoun_marz: user.bedoun_marz || false,
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
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email || null,
        username: formData.username || null,
        bedoun_marz: formData.bedoun_marz
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">نام</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="نام"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">نام خانوادگی</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="نام خانوادگی"
                />
              </div>
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
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="آدرس ایمیل"
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

            <div className="flex items-center justify-between">
              <Label htmlFor="bedoun_marz">عضو بدون مرز</Label>
              <Switch
                id="bedoun_marz"
                checked={formData.bedoun_marz}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, bedoun_marz: checked })
                }
              />
            </div>
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

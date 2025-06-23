
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
    is_approved: user?.is_approved || false,
    is_messenger_admin: user?.is_messenger_admin || false,
    bedoun_marz_approved: user?.bedoun_marz_approved || false,
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        is_approved: user.is_approved,
        is_messenger_admin: user.is_messenger_admin,
        bedoun_marz_approved: user.bedoun_marz_approved,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await messengerService.updateUserRole(user.id, formData);
      
      toast({
        title: 'موفق',
        description: 'تنظیمات کاربر با موفقیت به‌روزرسانی شد',
      });
      
      onUserUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی تنظیمات کاربر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش کاربر</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">اطلاعات کاربر</Label>
            <div className="mt-2 space-y-1">
              <p><strong>نام:</strong> {user.name}</p>
              <p><strong>شماره تلفن:</strong> {user.phone}</p>
              {user.username && <p><strong>نام کاربری:</strong> @{user.username}</p>}
            </div>
          </div>

          <div className="space-y-4">
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
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'در حال ذخیره...' : 'ذخیره'}
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

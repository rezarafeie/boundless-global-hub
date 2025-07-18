// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Save, Bell, BellOff, Upload, LogOut } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { toast } from '@/components/ui/sonner';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: MessengerUser;
  sessionToken: string;
  onUserUpdate: (user: MessengerUser) => void;
  onLogout?: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sessionToken,
  onUserUpdate,
  onLogout
}) => {
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    username: currentUser.username || '',
    bio: currentUser.bio || '',
    notification_enabled: currentUser.notification_enabled ?? true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        notification_enabled: currentUser.notification_enabled ?? true
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [isOpen, currentUser]);

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('خطا', {
        description: 'نام الزامی است'
      });
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await messengerService.updateUser(
        currentUser.id,
        {
          name: formData.name.trim(),
          username: formData.username.trim() || null,
          bio: formData.bio.trim() || null,
          notification_enabled: formData.notification_enabled
        }
      );

      onUserUpdate(updatedUser);
      
      toast.success('موفقیت', {
        description: 'تنظیمات شما ذخیره شد'
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('خطا', {
        description: 'خطا در ذخیره تنظیمات'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem('messenger_session_token');
    localStorage.removeItem('messenger_user');
    localStorage.removeItem('cached_rooms');
    localStorage.removeItem('cached_conversations');
    
    toast.success('خروج موفق', {
      description: 'با موفقیت از حساب خود خارج شدید'
    });
    
    // Call the logout callback if provided
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: reload the page to reset the app state
      window.location.reload();
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword.trim()) {
      toast.error('خطا', {
        description: 'لطفاً رمز عبور فعلی را وارد کنید'
      });
      return;
    }

    if (!passwordData.newPassword.trim() || passwordData.newPassword.length < 6) {
      toast.error('خطا', {
        description: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('خطا', {
        description: 'رمز عبور جدید و تکرار آن باید یکسان باشند'
      });
      return;
    }

    setChangingPassword(true);
    try {
      // First verify the current password
      const loginResult = await messengerService.loginWithPassword(
        currentUser.phone,
        passwordData.currentPassword
      );

      if (loginResult.error) {
        toast.error('خطا', {
          description: 'رمز عبور فعلی اشتباه است'
        });
        return;
      }

      // Update the password
      const result = await messengerService.updateUserPassword(
        currentUser.id,
        passwordData.newPassword
      );

      if (result.error) {
        toast.error('خطا', {
          description: 'خطا در تغییر رمز عبور'
        });
        return;
      }

      toast.success('موفقیت', {
        description: 'رمز عبور با موفقیت تغییر کرد'
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('خطا', {
        description: 'خطا در تغییر رمز عبور'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            تنظیمات پروفایل
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback 
                style={{ backgroundColor: getAvatarColor(formData.name || 'U') }}
                className="text-white font-medium text-lg"
              >
                {formData.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                آواتار شما بر اساس حرف اول نام شما تولید می‌شود
              </p>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Implement avatar upload
                  console.log('Avatar upload clicked');
                }}
              >
                <Upload className="w-4 h-4" />
                آپلود تصویر
              </Button>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">نام نمایشی *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="نام شما"
              dir="rtl"
            />
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="username"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              نام کاربری اختیاری است و برای جستجو استفاده می‌شود
            </p>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio">درباره من</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="توضیح کوتاه درباره خودتان"
              dir="rtl"
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium flex items-center gap-2">
              {formData.notification_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              تنظیمات نوتیفیکیشن
            </h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">دریافت نوتیفیکیشن</p>
                <p className="text-xs text-muted-foreground">
                  هنگام دریافت پیام جدید نوتیفیکیشن نمایش داده شود
                </p>
              </div>
              <Switch
                checked={formData.notification_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, notification_enabled: checked }))
                }
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium">تغییر رمز عبور</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="رمز عبور فعلی خود را وارد کنید"
                  dir="ltr"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">رمز عبور جدید</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">تکرار رمز عبور جدید</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="رمز عبور جدید را دوباره وارد کنید"
                  dir="ltr"
                />
              </div>
              
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                variant="outline"
                className="w-full"
              >
                {changingPassword ? 'در حال تغییر...' : 'تغییر رمز عبور'}
              </Button>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              خروج از حساب
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              انصراف
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1"
            >
              {saving ? (
                "در حال ذخیره..."
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  ذخیره
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsModal;
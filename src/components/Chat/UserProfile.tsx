
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

interface UserProfileProps {
  user: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUserUpdate }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || ''
  });

  useEffect(() => {
    setFormData({
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || ''
    });
  }, [user]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === user.username) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await messengerService.checkUsernameAvailability(username, user.id);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value });
    
    // Debounce username check
    if (value !== user.username) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSave = async () => {
    if (formData.username && usernameAvailable === false) {
      toast({
        title: 'خطا',
        description: 'این نام کاربری قبلاً استفاده شده است',
        variant: 'destructive',
      });
      return;
    }

    if (formData.bio && formData.bio.length > 160) {
      toast({
        title: 'خطا',
        description: 'بیوگرافی نمی‌تواند بیش از ۱۶۰ کاراکتر باشد',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await messengerService.updateUserDetails(user.id, {
        name: formData.name,
        username: formData.username || undefined,
        bio: formData.bio
      });

      const updatedUser = {
        ...user,
        name: formData.name,
        username: formData.username || undefined,
        bio: formData.bio
      };

      onUserUpdate(updatedUser);
      setEditing(false);
      
      toast({
        title: 'موفق',
        description: 'اطلاعات شما با موفقیت به‌روزرسانی شد',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || ''
    });
    setEditing(false);
    setUsernameAvailable(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          اطلاعات کاربری
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <>
            <div>
              <Label className="text-sm font-medium text-slate-600">نام کامل</Label>
              <p className="text-lg">{user.name}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-600">شماره تلفن</Label>
              <p className="text-lg">{user.phone}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-600">نام کاربری</Label>
              <p className="text-lg">
                {user.username ? `@${user.username}` : 'تنظیم نشده'}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-600">بیوگرافی</Label>
              <p className="text-sm text-slate-700">
                {user.bio || 'بیوگرافی ندارید'}
              </p>
            </div>
            
            <Button onClick={() => setEditing(true)} className="w-full">
              ویرایش اطلاعات
            </Button>
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="name">نام کامل</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="نام کامل خود را وارد کنید"
              />
            </div>
            
            <div>
              <Label htmlFor="username">نام کاربری</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="username"
                  className={`pl-8 ${
                    formData.username && usernameAvailable === false ? 'border-red-500' : 
                    formData.username && usernameAvailable === true ? 'border-green-500' : ''
                  }`}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">@</span>
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {!checkingUsername && formData.username && usernameAvailable === true && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {!checkingUsername && formData.username && usernameAvailable === false && (
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                )}
              </div>
              {formData.username && usernameAvailable === false && (
                <p className="text-sm text-red-500 mt-1">این نام کاربری قبلاً استفاده شده است</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="bio">بیوگرافی</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="کمی درباره خود بنویسید..."
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.bio.length}/160 کاراکتر
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={loading || (formData.username && usernameAvailable === false)}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                لغو
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfile;

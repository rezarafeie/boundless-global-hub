import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, LogOut, User, Lock, Bell, BellOff, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from '@/components/ui/sonner';
import { messengerService, type MessengerUser } from '@/lib/messengerService';

const MessengerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<MessengerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    bio: '',
    notification_enabled: true
  });
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const sessionToken = localStorage.getItem('messengerSessionToken');
      if (!sessionToken) {
        navigate('/hub/messenger');
        return;
      }

      const user = await messengerService.validateSession(sessionToken);
      if (!user) {
        localStorage.removeItem('messengerSessionToken');
        navigate('/hub/messenger');
        return;
      }

      setCurrentUser(user);
      setFormData({
        name: user.name || '',
        username: user.username || '',
        phone: user.phone || '',
        bio: user.bio || '',
        notification_enabled: user.notification_enabled ?? true
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/hub/messenger');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name: string): string => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const hash = name.charCodeAt(0) % colors.length;
    return colors[hash];
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    // Validate username
    if (formData.username && formData.username !== currentUser.username) {
      if (formData.username.length < 3) {
        toast.error('نام کاربری باید حداقل ۳ کاراکتر باشد');
        return;
      }

      try {
        const isUnique = await messengerService.checkUsernameUniqueness(formData.username);
        if (!isUnique) {
          toast.error('این نام کاربری قبلاً انتخاب شده است');
          return;
        }
      } catch (error) {
        toast.error('خطا در بررسی نام کاربری');
        return;
      }
    }

    setSaving(true);
    try {
      const sessionToken = localStorage.getItem('messengerSessionToken');
      if (!sessionToken) return;

      const updatedUser = await messengerService.updateUserProfile(sessionToken, {
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        notification_enabled: formData.notification_enabled
      }, currentUser.id);

      setCurrentUser(updatedUser);
      toast.success('پروفایل با موفقیت به‌روزرسانی شد');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('خطا در به‌روزرسانی پروفایل');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('رمز عبور جدید و تأیید آن یکسان نیستند');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    try {
      const sessionToken = localStorage.getItem('messengerSessionToken');
      if (!sessionToken) return;

      await messengerService.changePassword(sessionToken, passwordData.currentPassword, passwordData.newPassword);
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsPasswordSectionOpen(false);
      toast.success('رمز عبور با موفقیت تغییر یافت');
    } catch (error: any) {
      console.error('Password change failed:', error);
      if (error.message === 'Current password is incorrect') {
        toast.error('رمز عبور فعلی صحیح نیست');
      } else {
        toast.error('خطا در تغییر رمز عبور');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('messengerSessionToken');
    toast.success('با موفقیت خارج شدید');
    navigate('/hub/messenger');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // TODO: Implement avatar upload functionality
    toast.info('قابلیت آپلود آواتار به زودی اضافه خواهد شد');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">تنظیمات</h1>
            <p className="text-sm text-muted-foreground">مدیریت پروفایل و تنظیمات حساب کاربری</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اطلاعات پروفایل
            </CardTitle>
            <CardDescription>مدیریت اطلاعات شخصی شما</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={currentUser.avatar_url} />
                  <AvatarFallback 
                    className="text-lg font-semibold text-white"
                    style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                  >
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="font-medium">{currentUser.name}</h3>
                <p className="text-sm text-muted-foreground">{currentUser.phone}</p>
                {currentUser.username && (
                  <p className="text-sm text-primary">@{currentUser.username}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام نمایشی</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="نام خود را وارد کنید"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">نام کاربری</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="نام کاربری خود را وارد کنید"
                />
                <p className="text-xs text-muted-foreground">
                  نام کاربری باید حداقل ۳ کاراکتر باشد و منحصر به فرد باشد
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">شماره تلفن</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  شماره تلفن قابل تغییر نیست
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">بیوگرافی</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="درباره خود بنویسید..."
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              اعلان‌ها
            </CardTitle>
            <CardDescription>مدیریت تنظیمات اعلان‌ها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.notification_enabled ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">اعلان‌های پوش</p>
                  <p className="text-sm text-muted-foreground">
                    دریافت اعلان برای پیام‌های جدید
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.notification_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, notification_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              امنیت
            </CardTitle>
            <CardDescription>مدیریت رمز عبور و تنظیمات امنیتی</CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible open={isPasswordSectionOpen} onOpenChange={setIsPasswordSectionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  تغییر رمز عبور
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isPasswordSectionOpen ? 'transform rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="رمز عبور فعلی را وارد کنید"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">رمز عبور جدید</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="رمز عبور جدید را وارد کنید"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأیید رمز عبور جدید</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="رمز عبور جدید را دوباره وارد کنید"
                  />
                </div>

                <Button onClick={handleChangePassword} className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  تغییر رمز عبور
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              خروج از حساب کاربری
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessengerProfile;
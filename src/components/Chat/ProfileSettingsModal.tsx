import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Camera, Upload, Trash2, User, Briefcase, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { MessengerUser } from '@/lib/messengerService';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    bio: currentUser.bio || '',
    gender: currentUser.gender || '',
    age: currentUser.age?.toString() || '',
    education: currentUser.education || '',
    job: currentUser.job || '',
    specialized_program: currentUser.specialized_program || '',
    country: currentUser.country || '',
    province: currentUser.province || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطا',
        description: 'لطفاً یک فایل تصویری انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (currentUser.avatar_url) {
        const oldFileName = currentUser.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([`${currentUser.id}/${oldFileName}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update user record
      const { error: updateError } = await supabase
        .from('chat_users')
        .update({ avatar_url: avatarUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      console.log('✅ Avatar uploaded successfully:', avatarUrl);

      // Update local user state
      onUserUpdate({ ...currentUser, avatar_url: avatarUrl });

      toast({
        title: 'موفق',
        description: 'تصویر پروفایل با موفقیت بروزرسانی شد',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری تصویر پروفایل',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser.avatar_url) return;

    try {
      // Remove from storage
      const fileName = currentUser.avatar_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('avatars')
          .remove([`${currentUser.id}/${fileName}`]);
      }

      // Update user record
      const { error } = await supabase
        .from('chat_users')
        .update({ avatar_url: null })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update local user state
      onUserUpdate({ ...currentUser, avatar_url: undefined });

      toast({
        title: 'موفق',
        description: 'تصویر پروفایل حذف شد',
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف تصویر پروفایل',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updateData: any = {
        name: formData.name.trim(),
        bio: formData.bio.trim() || null,
        age: formData.age ? parseInt(formData.age) : null,
        education: formData.education || null,
        job: formData.job.trim() || null,
        country: formData.country.trim() || null
      };

      if (formData.gender) updateData.gender = formData.gender;
      if (formData.specialized_program) updateData.specialized_program = formData.specialized_program;
      if (formData.province) updateData.province = formData.province;

      const { error } = await supabase
        .from('chat_users')
        .update(updateData)
        .eq('id', currentUser.id);

      if (error) throw error;

      onUserUpdate({ 
        ...currentUser, 
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        gender: (formData.gender as any) || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        education: formData.education || undefined,
        job: formData.job.trim() || undefined,
        specialized_program: (formData.specialized_program as any) || undefined,
        country: formData.country.trim() || undefined,
        province: (formData.province as any) || undefined
      });

      toast({
        title: 'موفق',
        description: 'اطلاعات پروفایل بروزرسانی شد',
      });

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بروزرسانی اطلاعات',
        variant: 'destructive',
      });
    }
  };

  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تنظیمات پروفایل</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage 
                  src={currentUser.avatar_url} 
                  alt={currentUser.name}
                />
                <AvatarFallback className="text-lg">
                  {getAvatarFallback(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              
              <div 
                className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                onClick={handleAvatarClick}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 space-x-reverse">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAvatarClick}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 ml-2" />
                تغییر تصویر
              </Button>
              
              {currentUser.avatar_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">نام</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="نام خود را وارد کنید"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">درباره من</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="درباره خودتان بنویسید..."
                />
              </div>
            </div>

            <Separator />
            
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                اطلاعات شخصی
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">جنسیت</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">مرد</SelectItem>
                      <SelectItem value="female">زن</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="age">سن</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="سن شما"
                    min="1"
                    max="120"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                اطلاعات شغلی و تحصیلی
              </h4>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="education">تحصیلات</Label>
                  <Select value={formData.education} onValueChange={(value) => setFormData({ ...formData, education: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="سطح تحصیلات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diploma">دیپلم</SelectItem>
                      <SelectItem value="associate">کاردانی</SelectItem>
                      <SelectItem value="bachelor">کارشناسی</SelectItem>
                      <SelectItem value="master">کارشناسی ارشد</SelectItem>
                      <SelectItem value="phd">دکتری</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="job">شغل</Label>
                  <Input
                    id="job"
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                    placeholder="شغل فعلی شما"
                  />
                </div>

                <div>
                  <Label htmlFor="specialized_program">برنامه تخصصی</Label>
                  <Select value={formData.specialized_program} onValueChange={(value) => setFormData({ ...formData, specialized_program: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="برنامه تخصصی مورد علاقه" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passive_income">درآمد غیرفعال</SelectItem>
                      <SelectItem value="american_business">کسب‌وکار آمریکایی</SelectItem>
                      <SelectItem value="boundless_taste">طعم بی‌کران</SelectItem>
                      <SelectItem value="instagram_marketing">بازاریابی اینستاگرام</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                اطلاعات مکانی
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">کشور</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="کشور محل سکونت"
                  />
                </div>

                <div>
                  <Label htmlFor="province">استان/منطقه</Label>
                  <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="استان خود را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tehran">تهران</SelectItem>
                      <SelectItem value="isfahan">اصفهان</SelectItem>
                      <SelectItem value="shiraz">شیراز</SelectItem>
                      <SelectItem value="mashhad">مشهد</SelectItem>
                      <SelectItem value="tabriz">تبریز</SelectItem>
                      <SelectItem value="ahvaz">اهواز</SelectItem>
                      <SelectItem value="qom">قم</SelectItem>
                      <SelectItem value="karaj">کرج</SelectItem>
                      <SelectItem value="urmia">ارومیه</SelectItem>
                      <SelectItem value="zahedan">زاهدان</SelectItem>
                      <SelectItem value="rasht">رشت</SelectItem>
                      <SelectItem value="kerman">کرمان</SelectItem>
                      <SelectItem value="hamadan">همدان</SelectItem>
                      <SelectItem value="yazd">یزد</SelectItem>
                      <SelectItem value="ardebil">اردبیل</SelectItem>
                      <SelectItem value="bandar_abbas">بندرعباس</SelectItem>
                      <SelectItem value="arak">اراک</SelectItem>
                      <SelectItem value="eslamshahr">اسلامشهر</SelectItem>
                      <SelectItem value="zanjan">زنجان</SelectItem>
                      <SelectItem value="qazvin">قزوین</SelectItem>
                      <SelectItem value="khorramabad">خرم‌آباد</SelectItem>
                      <SelectItem value="gorgan">گرگان</SelectItem>
                      <SelectItem value="sabzevar">سبزوار</SelectItem>
                      <SelectItem value="dezful">دزفول</SelectItem>
                      <SelectItem value="sari">ساری</SelectItem>
                      <SelectItem value="abadan">آبادان</SelectItem>
                      <SelectItem value="bushehr">بوشهر</SelectItem>
                      <SelectItem value="sanandaj">سنندج</SelectItem>
                      <SelectItem value="khorramshahr">خرمشهر</SelectItem>
                      <SelectItem value="shahrud">شاهرود</SelectItem>
                      <SelectItem value="varamin">ورامین</SelectItem>
                      <SelectItem value="yasuj">یاسوج</SelectItem>
                      <SelectItem value="international">خارج از کشور</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 space-x-reverse">
            <Button onClick={handleSaveProfile} className="flex-1">
              ذخیره تغییرات
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
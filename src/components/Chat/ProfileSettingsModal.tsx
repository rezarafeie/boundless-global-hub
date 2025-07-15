import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, Trash2 } from 'lucide-react';
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
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
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
      const { error } = await supabase
        .from('chat_users')
        .update({ 
          name: name.trim(),
          bio: bio.trim() || null 
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      onUserUpdate({ 
        ...currentUser, 
        name: name.trim(),
        bio: bio.trim() || undefined
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">نام</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
              />
            </div>
            
            <div>
              <Label htmlFor="bio">درباره من</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="درباره خودتان بنویسید..."
              />
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
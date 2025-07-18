
// @ts-nocheck

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Calendar, User, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService } from '@/lib/messengerService';
import type { MessengerUser } from '@/lib/messengerService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MessengerUser | null;
  onStartChat: (user: MessengerUser) => void;
  currentUserId: number;
  sessionToken?: string;
  onUserUpdate?: (user: MessengerUser) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onStartChat,
  currentUserId,
  sessionToken,
  onUserUpdate
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  if (!user) return null;

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStartChat = () => {
    onStartChat(user);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || ''
    });
  };

  const handleSave = async () => {
    if (!sessionToken) {
      toast({
        title: 'خطا',
        description: 'جلسه کاری شما پایان یافته است',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Validate username uniqueness if changed
      if (formData.username !== user.username && formData.username.trim()) {
        const existingUsers = await messengerService.searchUsersByUsername(formData.username.trim());
        if (existingUsers.length > 0) {
          toast({
            title: 'خطا',
            description: 'این نام کاربری قبلاً استفاده شده است',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      // Update user profile
      const updatedUser = await messengerService.updateUserProfile(user.id, {
        name: formData.name.trim(),
        username: formData.username.trim() || null,
        bio: formData.bio.trim() || null
      }, sessionToken);

      toast({
        title: 'موفق',
        description: 'پروفایل شما با موفقیت به‌روزرسانی شد',
      });

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی پروفایل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUser = user.id === currentUserId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>پروفایل کاربر</span>
            {isCurrentUser && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(formData.name || user.name) }}
              className="text-white font-bold text-2xl"
            >
              {(formData.name || user.name).charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {isEditing ? (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام</Label>
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
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  placeholder="نام کاربری (اختیاری)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">بیوگرافی</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="درباره خود بنویسید (اختیاری)"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={loading || !formData.name.trim()} 
                  className="flex-1"
                >
                  <Save className="w-4 h-4 ml-2" />
                  {loading ? 'در حال ذخیره...' : 'ذخیره'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel} 
                  disabled={loading}
                  className="flex-1"
                >
                  <X className="w-4 h-4 ml-2" />
                  لغو
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">{user.name}</h3>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
                {user.bio && (
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                )}
              </div>

              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>عضویت: {formatDate(user.created_at)}</span>
                </div>
                
                {user.bedoun_marz && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <User className="w-4 h-4" />
                    <span>دانشجوی بدون مرز</span>
                  </div>
                )}

                {user.is_support_agent && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <User className="w-4 h-4" />
                    <span>نماینده پشتیبانی</span>
                  </div>
                )}
              </div>

              {!isCurrentUser && (
                <Button 
                  onClick={handleStartChat}
                  className="w-full"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  شروع گفتگو
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;

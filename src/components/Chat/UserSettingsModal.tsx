// @ts-nocheck
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Save, Bell, BellOff } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: MessengerUser;
  sessionToken: string;
  onUserUpdate: (user: MessengerUser) => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sessionToken,
  onUserUpdate
}) => {
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    username: currentUser.username || '',
    bio: currentUser.bio || '',
    notification_enabled: currentUser.notification_enabled ?? true
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        notification_enabled: currentUser.notification_enabled ?? true
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
      toast({
        title: "خطا",
        description: "نام الزامی است",
        variant: "destructive"
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
      
      toast({
        title: "موفقیت",
        description: "تنظیمات شما ذخیره شد",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
              <p className="text-sm text-muted-foreground">
                آواتار شما بر اساس حرف اول نام شما تولید می‌شود
              </p>
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
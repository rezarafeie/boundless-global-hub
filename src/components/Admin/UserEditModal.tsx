
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
    password: '', // For password reset
    // New profile fields
    gender: user?.gender || '',
    age: user?.age || '',
    education: user?.education || '',
    job: user?.job || '',
    specialized_program: user?.specialized_program || '',
    country: user?.country || '',
    province: user?.province || ''
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
        password: '',
        // New profile fields
        gender: user.gender || '',
        age: user.age || '',
        education: user.education || '',
        job: user.job || '',
        specialized_program: user.specialized_program || '',
        country: user.country || '',
        province: user.province || ''
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
        bedoun_marz: formData.bedoun_marz,
        // New profile fields
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age.toString()) : null,
        education: formData.education || null,
        job: formData.job || null,
        specialized_program: formData.specialized_program || null,
        country: formData.country || null,
        province: formData.province || null
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto z-[999999]" style={{zIndex: 999999}}>
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

            {/* New Profile Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="gender">جنسیت</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب جنسیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">مرد</SelectItem>
                    <SelectItem value="female">زن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">سن</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="سن"
                  min="1"
                  max="150"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">تحصیلات</Label>
              <Input
                id="education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="سطح تحصیلات"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">شغل</Label>
              <Input
                id="job"
                value={formData.job}
                onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                placeholder="شغل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialized_program">برنامه تخصصی</Label>
              <Select value={formData.specialized_program} onValueChange={(value) => setFormData({ ...formData, specialized_program: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب برنامه تخصصی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drop_shipping">دراپ شیپینگ</SelectItem>
                  <SelectItem value="drop_servicing">دراپ سرویسینگ</SelectItem>
                  <SelectItem value="digital_goods">کالاهای دیجیتال</SelectItem>
                  <SelectItem value="ai">هوش مصنوعی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">کشور</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="کشور"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">استان</Label>
              <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب استان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="آذربایجان شرقی">آذربایجان شرقی</SelectItem>
                  <SelectItem value="آذربایجان غربی">آذربایجان غربی</SelectItem>
                  <SelectItem value="اردبیل">اردبیل</SelectItem>
                  <SelectItem value="اصفهان">اصفهان</SelectItem>
                  <SelectItem value="البرز">البرز</SelectItem>
                  <SelectItem value="ایلام">ایلام</SelectItem>
                  <SelectItem value="بوشهر">بوشهر</SelectItem>
                  <SelectItem value="تهران">تهران</SelectItem>
                  <SelectItem value="چهارمحال و بختیاری">چهارمحال و بختیاری</SelectItem>
                  <SelectItem value="خراسان جنوبی">خراسان جنوبی</SelectItem>
                  <SelectItem value="خراسان رضوی">خراسان رضوی</SelectItem>
                  <SelectItem value="خراسان شمالی">خراسان شمالی</SelectItem>
                  <SelectItem value="خوزستان">خوزستان</SelectItem>
                  <SelectItem value="زنجان">زنجان</SelectItem>
                  <SelectItem value="سمنان">سمنان</SelectItem>
                  <SelectItem value="سیستان و بلوچستان">سیستان و بلوچستان</SelectItem>
                  <SelectItem value="فارس">فارس</SelectItem>
                  <SelectItem value="قزوین">قزوین</SelectItem>
                  <SelectItem value="قم">قم</SelectItem>
                  <SelectItem value="کردستان">کردستان</SelectItem>
                  <SelectItem value="کرمان">کرمان</SelectItem>
                  <SelectItem value="کرمانشاه">کرمانشاه</SelectItem>
                  <SelectItem value="کهگیلویه و بویراحمد">کهگیلویه و بویراحمد</SelectItem>
                  <SelectItem value="گلستان">گلستان</SelectItem>
                  <SelectItem value="گیلان">گیلان</SelectItem>
                  <SelectItem value="لرستان">لرستان</SelectItem>
                  <SelectItem value="مازندران">مازندران</SelectItem>
                  <SelectItem value="مرکزی">مرکزی</SelectItem>
                  <SelectItem value="هرمزگان">هرمزگان</SelectItem>
                  <SelectItem value="همدان">همدان</SelectItem>
                  <SelectItem value="یزد">یزد</SelectItem>
                </SelectContent>
              </Select>
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

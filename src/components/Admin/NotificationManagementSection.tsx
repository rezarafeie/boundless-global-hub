
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Link,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/lib/notificationService';
import type { Notification, NotificationInsert } from '@/types/notifications';
import NotificationLogs from './NotificationLogs';
import NotificationDiagnostics from './NotificationDiagnostics';

const NotificationManagementSection: React.FC = () => {
  const { toast } = useToast();
  const { notifications, loading } = useNotifications();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formData, setFormData] = useState<NotificationInsert>({
    title: '',
    message: '',
    color: '#3B82F6',
    link: '',
    notification_type: 'banner',
    is_active: false,
    priority: 1
  });

  // Reset form when modals close
  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      color: '#3B82F6',
      link: '',
      notification_type: 'banner',
      is_active: false,
      priority: 1
    });
  };

  const handleCreateNotification = async () => {
    try {
      await notificationService.create(formData);
      toast({
        title: 'موفق',
        description: 'اعلان جدید ایجاد شد',
      });
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد اعلان',
        variant: 'destructive',
      });
    }
  };

  const handleEditNotification = async () => {
    if (!editingNotification) return;
    
    try {
      // Create the update object with proper field mapping
      const updateData: Partial<NotificationInsert> = {
        title: formData.title,
        message: formData.message,
        color: formData.color,
        link: formData.link || null,
        notification_type: formData.notification_type,
        is_active: formData.is_active,
        priority: formData.priority
      };

      await notificationService.update(editingNotification.id, updateData);
      toast({
        title: 'موفق',
        description: 'اعلان ویرایش شد',
      });
      setShowEditModal(false);
      setEditingNotification(null);
      resetForm();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ویرایش اعلان',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('آیا از حذف این اعلان اطمینان دارید؟')) return;
    
    try {
      await notificationService.delete(id);
      toast({
        title: 'موفق',
        description: 'اعلان حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف اعلان',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (notification: Notification) => {
    try {
      await notificationService.toggleActive(notification.id, notification.is_active);
      toast({
        title: 'موفق',
        description: `اعلان ${notification.is_active ? 'غیرفعال' : 'فعال'} شد`,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت اعلان',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      color: notification.color,
      link: notification.link || '',
      notification_type: notification.notification_type,
      is_active: notification.is_active,
      priority: notification.priority
    });
    setShowEditModal(true);
  };

  const getTypeLabel = (type: string) => {
    const types = {
      banner: 'نوار بالا',
      floating: 'شناور',
      popup: 'پاپ‌آپ'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      banner: 'bg-red-100 text-red-800',
      floating: 'bg-blue-100 text-blue-800',
      popup: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-slate-600">در حال بارگذاری اعلان‌ها...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diagnostics */}
      <NotificationDiagnostics />
      
      {/* Logs */}
      <NotificationLogs />
      
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              مدیریت اعلان‌ها ({notifications.length})
            </div>
            <Dialog open={showCreateModal} onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  اعلان جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>ایجاد اعلان جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="عنوان اعلان"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">پیام</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="متن اعلان"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">رنگ</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="link">لینک (اختیاری)</Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="/path/to/page"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">نوع اعلان</Label>
                    <Select value={formData.notification_type} onValueChange={(value) => setFormData(prev => ({ ...prev, notification_type: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">نوار بالا</SelectItem>
                        <SelectItem value="floating">شناور</SelectItem>
                        <SelectItem value="popup">پاپ‌آپ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">اولویت</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>فعال</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateNotification} className="flex-1">
                      ایجاد اعلان
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}>
                      انصراف
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-slate-500 truncate max-w-xs">
                          {notification.message}
                        </p>
                        {notification.link && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <Link className="w-3 h-3" />
                            {notification.link}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(notification.notification_type)}>
                        {getTypeLabel(notification.notification_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: notification.color }}
                        />
                        <Badge variant={notification.is_active ? 'default' : 'secondary'}>
                          {notification.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{notification.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(notification.created_at).toLocaleDateString('fa-IR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(notification)}
                          className="p-2"
                          title={notification.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                        >
                          {notification.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(notification)}
                          className="p-2"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) {
          setEditingNotification(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش اعلان</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">عنوان</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان اعلان"
              />
            </div>
            <div>
              <Label htmlFor="edit-message">پیام</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="متن اعلان"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">رنگ</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-link">لینک (اختیاری)</Label>
              <Input
                id="edit-link"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="/path/to/page"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">نوع اعلان</Label>
              <Select value={formData.notification_type} onValueChange={(value) => setFormData(prev => ({ ...prev, notification_type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">نوار بالا</SelectItem>
                  <SelectItem value="floating">شناور</SelectItem>
                  <SelectItem value="popup">پاپ‌آپ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-priority">اولویت</Label>
              <Input
                id="edit-priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>فعال</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEditNotification} className="flex-1">
                ذخیره تغییرات
              </Button>
              <Button variant="outline" onClick={() => {
                setShowEditModal(false);
                setEditingNotification(null);
                resetForm();
              }}>
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationManagementSection;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from "@/hooks/use-toast";
import { notificationService } from '@/lib/notificationService';
import { Notification } from '@/types/notifications';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface NotificationForm {
  title: string;
  message: string;
  color: string;
  link: string;
  notification_type: 'banner' | 'floating' | 'popup';
  is_active: boolean;
  priority: number;
  start_date: string;
  end_date: string;
}

const NotificationManagementSection = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<NotificationForm>({
    title: '',
    message: '',
    color: '#3B82F6',
    link: '',
    notification_type: 'banner',
    is_active: false,
    priority: 1,
    start_date: '',
    end_date: ''
  });
	const [date, setDate] = React.useState<DateRange | undefined>(undefined)

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت اعلان‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("آیا مطمئن هستید که می‌خواهید این اعلان را حذف کنید؟")) {
      try {
        await notificationService.delete(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast({
          title: "موفق",
          description: "اعلان با موفقیت حذف شد"
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast({
          title: "خطا",
          description: "خطا در حذف اعلان",
          variant: "destructive"
        });
      }
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      color: notification.color,
      link: notification.link || '',
      notification_type: notification.notification_type,
      is_active: notification.is_active,
      priority: notification.priority,
      start_date: notification.start_date || '',
      end_date: notification.end_date || ''
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "خطا",
        description: "عنوان و پیام اجباری هستند",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingNotification) {
        await notificationService.update(editingNotification.id, {
          ...formData,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined
        });
        toast({
          title: "موفق",
          description: "اعلان با موفقیت به‌روزرسانی شد"
        });
      } else {
        await notificationService.create({
          ...formData,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined
        });
        toast({
          title: "موفق",
          description: "اعلان جدید ایجاد شد"
        });
      }
      
      setShowCreateForm(false);
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        color: '#3B82F6',
        link: '',
        notification_type: 'banner',
        is_active: false,
        priority: 1,
        start_date: '',
        end_date: ''
      });
			setDate(undefined)
      fetchNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره اعلان",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await notificationService.toggleActive(id, isActive);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_active: !isActive } : n
      ));
      toast({
        title: "موفق",
        description: `اعلان ${isActive ? 'غیرفعال' : 'فعال'} شد`
      });
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast({
        title: "خطا",
        description: "خطا در تغییر وضعیت اعلان",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CardHeader>
          <CardTitle>مدیریت اعلان‌ها</CardTitle>
          <CardDescription>ایجاد، ویرایش و حذف اعلان‌های سیستم</CardDescription>
        </CardHeader>
        <Button onClick={() => setShowCreateForm(true)}>ایجاد اعلان جدید</Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingNotification ? 'ویرایش اعلان' : 'ایجاد اعلان جدید'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="message">پیام</Label>
                <Input
                  type="text"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="color">رنگ</Label>
                <Input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="link">لینک</Label>
                <Input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="notification_type">نوع اعلان</Label>
                <Select onValueChange={(value) => handleSelectChange(value, 'notification_type')} defaultValue={formData.notification_type}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع اعلان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">بنر</SelectItem>
                    <SelectItem value="floating">شناور</SelectItem>
                    <SelectItem value="popup">پاپ‌آپ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">اولویت</Label>
                <Input
                  type="number"
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="is_active">فعال؟</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
							<div className="grid gap-2">
								<Label>تاریخ شروع و پایان</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant={"outline"}
											className={cn(
												"w-[240px] justify-start text-left font-normal",
												!date && "text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{date?.from ? (
												date.to ? (
													`${format(date.from, "yyyy/MM/dd")} - ${format(date.to, "yyyy/MM/dd")}`
												) : (
													format(date.from, "yyyy/MM/dd")
												)
											) : (
												<span>انتخاب تاریخ</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="center" side="bottom">
										<Calendar
											mode="range"
											defaultMonth={date?.from}
											selected={date}
											onSelect={setDate}
											numberOfMonths={2}
											pagedNavigation
										/>
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													setFormData(prev => ({
														...prev,
														start_date: date?.from?.toISOString() || '',
														end_date: date?.to?.toISOString() || ''
													}));
												}}
											>
												اعمال
											</Button>
									</PopoverContent>
								</Popover>
							</div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingNotification(null);
                    setFormData({
                      title: '',
                      message: '',
                      color: '#3B82F6',
                      link: '',
                      notification_type: 'banner',
                      is_active: false,
                      priority: 1,
                      start_date: '',
                      end_date: ''
                    });
										setDate(undefined)
                  }}
                >
                  لغو
                </Button>
                <Button type="submit">
                  {editingNotification ? 'به‌روزرسانی' : 'ایجاد'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>لیست اعلان‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>در حال بارگیری...</p>
          ) : (
						<div className="w-full">
							<Table>
								<TableCaption>لیست اعلان‌ها</TableCaption>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[100px]">عنوان</TableHead>
										<TableHead>پیام</TableHead>
										<TableHead>نوع</TableHead>
										<TableHead>اولویت</TableHead>
										<TableHead>وضعیت</TableHead>
										<TableHead className="text-right">عملیات</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{notifications.map((notification) => (
										<TableRow key={notification.id}>
											<TableCell className="font-medium">{notification.title}</TableCell>
											<TableCell>{notification.message}</TableCell>
											<TableCell>{notification.notification_type}</TableCell>
											<TableCell>{notification.priority}</TableCell>
											<TableCell>
												<Switch
													id={`active-${notification.id}`}
													checked={notification.is_active}
													onCheckedChange={() => handleToggleActive(notification.id, notification.is_active)}
												/>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="secondary"
													size="sm"
													onClick={() => handleEdit(notification)}
												>
													ویرایش
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDelete(notification.id)}
												>
													حذف
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagementSection;

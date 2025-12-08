import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CRMStatus {
  id: string;
  label: string;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const COLOR_OPTIONS = [
  { value: 'default', label: 'پیش‌فرض', className: 'bg-secondary text-secondary-foreground' },
  { value: 'green', label: 'سبز', className: 'bg-green-500 text-white' },
  { value: 'red', label: 'قرمز', className: 'bg-red-500 text-white' },
  { value: 'yellow', label: 'زرد', className: 'bg-yellow-500 text-black' },
  { value: 'blue', label: 'آبی', className: 'bg-blue-500 text-white' },
  { value: 'orange', label: 'نارنجی', className: 'bg-orange-500 text-white' },
  { value: 'purple', label: 'بنفش', className: 'bg-purple-500 text-white' },
  { value: 'gray', label: 'خاکستری', className: 'bg-gray-500 text-white' },
];

export function CRMStatusSettings() {
  const [statuses, setStatuses] = useState<CRMStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CRMStatus | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    color: 'default',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_statuses')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching CRM statuses:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری وضعیت‌های CRM',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.label.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفا نام وضعیت را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingStatus) {
        const { error } = await supabase
          .from('crm_statuses')
          .update({
            label: formData.label.trim(),
            color: formData.color,
            is_active: formData.is_active
          })
          .eq('id', editingStatus.id);

        if (error) throw error;
        toast({
          title: 'موفق',
          description: 'وضعیت CRM به‌روزرسانی شد'
        });
      } else {
        const maxOrder = statuses.length > 0 
          ? Math.max(...statuses.map(s => s.order_index)) + 1 
          : 0;

        const { error } = await supabase
          .from('crm_statuses')
          .insert({
            label: formData.label.trim(),
            color: formData.color,
            is_active: formData.is_active,
            order_index: maxOrder
          });

        if (error) throw error;
        toast({
          title: 'موفق',
          description: 'وضعیت CRM جدید اضافه شد'
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStatuses();
    } catch (error) {
      console.error('Error saving CRM status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره وضعیت CRM',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این وضعیت مطمئن هستید؟')) return;

    try {
      const { error } = await supabase
        .from('crm_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'موفق',
        description: 'وضعیت CRM حذف شد'
      });
      fetchStatuses();
    } catch (error) {
      console.error('Error deleting CRM status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف وضعیت CRM',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('crm_statuses')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      fetchStatuses();
    } catch (error) {
      console.error('Error toggling CRM status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (status: CRMStatus) => {
    setEditingStatus(status);
    setFormData({
      label: status.label,
      color: status.color,
      is_active: status.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingStatus(null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      label: '',
      color: 'default',
      is_active: true
    });
    setEditingStatus(null);
  };

  const getColorClass = (color: string) => {
    return COLOR_OPTIONS.find(c => c.value === color)?.className || 'bg-secondary text-secondary-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            تنظیمات وضعیت‌های CRM
          </CardTitle>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4 ml-2" />
            افزودن وضعیت جدید
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">ترتیب</TableHead>
                <TableHead className="text-right">نام وضعیت</TableHead>
                <TableHead className="text-right">رنگ</TableHead>
                <TableHead className="text-right">فعال</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status, index) => (
                <TableRow key={status.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{status.label}</TableCell>
                  <TableCell>
                    <Badge className={getColorClass(status.color)}>
                      {COLOR_OPTIONS.find(c => c.value === status.color)?.label || 'پیش‌فرض'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={status.is_active}
                      onCheckedChange={() => handleToggleActive(status.id, status.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(status)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(status.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStatus ? 'ویرایش وضعیت CRM' : 'افزودن وضعیت CRM جدید'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>نام وضعیت</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="مثلا: پاسخ نداد"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>رنگ</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.className}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">فعال</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingStatus ? 'به‌روزرسانی' : 'افزودن'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Edit, Trash2, Tag, Percent, Calendar, Users } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  is_active: boolean;
  course_id?: string;
  max_uses?: number;
  current_uses: number;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  created_by?: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

const DiscountManagement: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    percentage: '',
    course_id: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [discountsResult, coursesResult] = await Promise.all([
        supabase
          .from('discount_codes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('courses')
          .select('id, title, slug')
          .eq('is_active', true)
          .order('title')
      ]);

      if (discountsResult.data) setDiscountCodes(discountsResult.data);
      if (coursesResult.data) setCourses(coursesResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در دریافت اطلاعات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      percentage: '',
      course_id: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      is_active: true
    });
    setEditingDiscount(null);
  };

  const openEditModal = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      percentage: discount.percentage.toString(),
      course_id: discount.course_id || 'all',
      max_uses: discount.max_uses?.toString() || '',
      valid_from: discount.valid_from ? discount.valid_from.split('T')[0] : '',
      valid_until: discount.valid_until ? discount.valid_until.split('T')[0] : '',
      is_active: discount.is_active
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.percentage) {
      toast({
        title: 'خطا',
        description: 'لطفا کد تخفیف و درصد تخفیف را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: 'خطا',
        description: 'درصد تخفیف باید بین 1 تا 100 باشد',
        variant: 'destructive'
      });
      return;
    }

    const discountData = {
      code: formData.code.trim().toUpperCase(),
      percentage,
      is_active: formData.is_active,
      course_id: formData.course_id === 'all' || !formData.course_id ? null : formData.course_id,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      created_by: 'admin'
    };

    try {
      if (editingDiscount) {
        // Update existing discount
        const { error } = await supabase
          .from('discount_codes')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (error) throw error;

        toast({
          title: 'موفق',
          description: 'کد تخفیف با موفقیت به‌روزرسانی شد'
        });
      } else {
        // Create new discount
        const { error } = await supabase
          .from('discount_codes')
          .insert(discountData);

        if (error) throw error;

        toast({
          title: 'موفق',
          description: 'کد تخفیف جدید با موفقیت ایجاد شد'
        });
      }

      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving discount code:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'خطا',
          description: 'این کد تخفیف قبلاً وجود دارد',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'خطا',
          description: 'خطا در ذخیره کد تخفیف',
          variant: 'destructive'
        });
      }
    }
  };

  const toggleDiscountStatus = async (discount: DiscountCode) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !discount.is_active })
        .eq('id', discount.id);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: `کد تخفیف ${!discount.is_active ? 'فعال' : 'غیرفعال'} شد`
      });

      fetchData();
    } catch (error) {
      console.error('Error updating discount status:', error);
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت کد تخفیف',
        variant: 'destructive'
      });
    }
  };

  const deleteDiscount = async (discountId: string) => {
    if (!confirm('آیا از حذف این کد تخفیف اطمینان دارید؟')) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'کد تخفیف با موفقیت حذف شد'
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف کد تخفیف',
        variant: 'destructive'
      });
    }
  };

  const getCourseTitle = (courseId?: string) => {
    if (!courseId) return 'همه دوره‌ها';
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'نامشخص';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="mr-2">در حال بارگذاری...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت کدهای تخفیف</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              کد تخفیف جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف جدید'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">کد تخفیف *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">درصد تخفیف (1-100) *</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value }))}
                  placeholder="25"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">دوره (اختیاری)</Label>
                <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه دوره‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دوره‌ها</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses">حداکثر تعداد استفاده (اختیاری)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                  placeholder="100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">تاریخ شروع</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">تاریخ پایان</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">فعال</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">
                  {editingDiscount ? 'به‌روزرسانی' : 'ایجاد'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {discountCodes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">هیچ کد تخفیفی یافت نشد</h3>
              <p className="text-muted-foreground">
                اولین کد تخفیف خود را ایجاد کنید
              </p>
            </CardContent>
          </Card>
        ) : (
          discountCodes.map((discount) => (
            <Card key={discount.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={discount.is_active ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {discount.code}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {discount.percentage}%
                      </Badge>
                      {!discount.is_active && (
                        <Badge variant="destructive">غیرفعال</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>دوره:</strong> {getCourseTitle(discount.course_id)}</p>
                      {discount.max_uses && (
                        <p className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          استفاده: {discount.current_uses} از {discount.max_uses}
                        </p>
                      )}
                      {(discount.valid_from || discount.valid_until) && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {discount.valid_from && new Date(discount.valid_from).toLocaleDateString('fa-IR')}
                          {discount.valid_from && discount.valid_until && ' تا '}
                          {discount.valid_until && new Date(discount.valid_until).toLocaleDateString('fa-IR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDiscountStatus(discount)}
                    >
                      {discount.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(discount)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDiscount(discount.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscountManagement;
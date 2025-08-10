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
  test_id?: string;
  discount_type: 'course' | 'test' | 'both';
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

interface Test {
  id: string;
  title: string;
  slug: string;
  price: number;
}

const DiscountManagement: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    percentage: '',
    discount_type: 'both' as 'course' | 'test' | 'both',
    course_id: '',
    test_id: '',
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
      const [discountsResult, coursesResult, testsResult] = await Promise.all([
        supabase
          .from('discount_codes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('courses')
          .select('id, title, slug')
          .eq('is_active', true)
          .order('title'),
        supabase
          .from('tests')
          .select('id, title, slug, price')
          .eq('is_active', true)
          .order('title')
      ]);

      if (discountsResult.data) setDiscountCodes(discountsResult.data as DiscountCode[]);
      if (coursesResult.data) setCourses(coursesResult.data);
      if (testsResult.data) setTests(testsResult.data);
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
      discount_type: 'both',
      course_id: 'all',
      test_id: 'all',
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
      discount_type: discount.discount_type || 'both',
      course_id: discount.course_id || 'all',
      test_id: discount.test_id || 'all',
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
      discount_type: formData.discount_type,
      course_id: (formData.discount_type === 'course' || formData.discount_type === 'both') && formData.course_id && formData.course_id !== 'all' ? formData.course_id : null,
      test_id: (formData.discount_type === 'test' || formData.discount_type === 'both') && formData.test_id && formData.test_id !== 'all' ? formData.test_id : null,
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
    if (!courseId) return null;
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'نامشخص';
  };

  const getTestTitle = (testId?: string) => {
    if (!testId) return null;
    const test = tests.find(t => t.id === testId);
    return test?.title || 'نامشخص';
  };

  const getApplicableText = (discount: DiscountCode) => {
    switch (discount.discount_type) {
      case 'course':
        return discount.course_id ? getCourseTitle(discount.course_id) : 'همه دوره‌ها';
      case 'test':
        return discount.test_id ? getTestTitle(discount.test_id) : 'همه تست‌ها';
      case 'both':
        const parts = [];
        if (discount.course_id) parts.push(`دوره: ${getCourseTitle(discount.course_id)}`);
        else if (discount.test_id) parts.push(`تست: ${getTestTitle(discount.test_id)}`);
        return parts.length > 0 ? parts.join(' و ') : 'همه دوره‌ها و تست‌ها';
      default:
        return 'همه';
    }
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
                <Label htmlFor="discount_type">نوع تخفیف *</Label>
                <Select value={formData.discount_type} onValueChange={(value: 'course' | 'test' | 'both') => setFormData(prev => ({ ...prev, discount_type: value, course_id: '', test_id: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع تخفیف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">دوره‌ها و تست‌ها</SelectItem>
                    <SelectItem value="course">فقط دوره‌ها</SelectItem>
                    <SelectItem value="test">فقط تست‌ها</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.discount_type === 'course' || formData.discount_type === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="course">دوره (اختیاری)</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value === 'all' ? '' : value }))}>
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
              )}

              {(formData.discount_type === 'test' || formData.discount_type === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="test">تست (اختیاری)</Label>
                  <Select value={formData.test_id} onValueChange={(value) => setFormData(prev => ({ ...prev, test_id: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="همه تست‌ها" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه تست‌ها</SelectItem>
                      {tests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title} {test.price > 0 && `(${test.price.toLocaleString('fa-IR')} تومان)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                      <p><strong>قابل اعمال روی:</strong> {getApplicableText(discount)}</p>
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
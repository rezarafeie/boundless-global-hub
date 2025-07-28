import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id?: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  is_active: boolean;
  use_enrollments_as_leads?: boolean;
  lead_start_date?: string | null;
}

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  onSuccess: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    price: '',
    is_active: true,
    use_enrollments_as_leads: false,
    lead_start_date: ''
  });

  useEffect(() => {
    if (course) {
      setFormData({
        slug: course.slug,
        title: course.title,
        description: course.description || '',
        price: course.price.toString(),
        is_active: course.is_active,
        use_enrollments_as_leads: course.use_enrollments_as_leads || false,
        lead_start_date: course.lead_start_date ? new Date(course.lead_start_date).toISOString().slice(0, 16) : ''
      });
    } else {
      setFormData({
        slug: '',
        title: '',
        description: '',
        price: '',
        is_active: true,
        use_enrollments_as_leads: false,
        lead_start_date: ''
      });
    }
  }, [course, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.slug.trim() || !formData.price) {
      toast({
        title: "خطا",
        description: "لطفا تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const courseData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        is_active: formData.is_active,
        use_enrollments_as_leads: formData.use_enrollments_as_leads,
        lead_start_date: formData.use_enrollments_as_leads && formData.lead_start_date ? 
          new Date(formData.lead_start_date).toISOString() : null
      };

      if (course?.id) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);
        
        if (error) throw error;
        
        toast({
          title: "موفق",
          description: "دوره با موفقیت به‌روزرسانی شد"
        });
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert(courseData);
        
        if (error) throw error;
        
        toast({
          title: "موفق",
          description: "دوره جدید با موفقیت ایجاد شد"
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره دوره",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {course ? 'ویرایش دوره' : 'ایجاد دوره جدید'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">عنوان دوره *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: دوره بدون مرز"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="slug">نامک (Slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="مثال: boundless"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="توضیحات دوره..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="price">قیمت (تومان) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="2500000"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">دوره فعال باشد</Label>
          </div>

          {/* Lead Generation Section */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              تولید لید از ثبت‌نام‌ها
            </h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="use_enrollments_as_leads"
                checked={formData.use_enrollments_as_leads}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_enrollments_as_leads: checked }))}
              />
              <Label htmlFor="use_enrollments_as_leads">استفاده از ثبت‌نام‌های این دوره به‌عنوان لید</Label>
            </div>

            {formData.use_enrollments_as_leads && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">نحوه عملکرد تولید لید</h4>
                  <p className="text-sm text-muted-foreground">
                    تمام ثبت‌نام‌هایی که پس از تاریخ انتخابی برای این دوره انجام شوند، به‌عنوان لید در سیستم مدیریت لید قابل دسترسی خواهند بود.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="lead_start_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاریخ شروع تولید لید *
                  </Label>
                  <Input
                    id="lead_start_date"
                    type="datetime-local"
                    value={formData.lead_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_start_date: e.target.value }))}
                    required={formData.use_enrollments_as_leads}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    ثبت‌نام‌های انجام شده پس از این تاریخ به‌عنوان لید محسوب می‌شوند
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : (course ? 'به‌روزرسانی' : 'ایجاد دوره')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseFormModal;
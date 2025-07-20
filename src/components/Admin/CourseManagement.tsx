import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ExternalLink, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  woocommerce_product_id: number | null;
  redirect_url: string | null;
  is_active: boolean;
  spotplayer_course_id?: string | null;
  is_spotplayer_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
}

const CourseManagement: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    price: '',
    woocommerce_product_id: '',
    redirect_url: '',
    is_active: true,
    spotplayer_course_id: '',
    is_spotplayer_enabled: false
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری دوره‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری ثبت‌نام‌ها",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      description: '',
      price: '',
      woocommerce_product_id: '',
      redirect_url: '',
      is_active: true,
      spotplayer_course_id: '',
      is_spotplayer_enabled: false
    });
    setSelectedCourse(null);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      slug: course.slug,
      title: course.title,
      description: course.description || '',
      price: course.price.toString(),
      woocommerce_product_id: course.woocommerce_product_id?.toString() || '',
      redirect_url: course.redirect_url || '',
      is_active: course.is_active,
      spotplayer_course_id: course.spotplayer_course_id || '',
      is_spotplayer_enabled: course.is_spotplayer_enabled || false
    });
    setShowCourseModal(true);
  };

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

    try {
      const courseData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        woocommerce_product_id: formData.woocommerce_product_id ? parseInt(formData.woocommerce_product_id) : null,
        redirect_url: formData.redirect_url.trim() || null,
        is_active: formData.is_active,
        spotplayer_course_id: formData.spotplayer_course_id.trim() || null,
        is_spotplayer_enabled: formData.is_spotplayer_enabled
      };

      if (selectedCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', selectedCourse.id);
        
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

      setShowCourseModal(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره دوره",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('آیا از حذف این دوره اطمینان دارید؟')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      
      toast({
        title: "موفق",
        description: "دوره با موفقیت حذف شد"
      });
      
      fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف دوره",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const handleViewEnrollments = (course: Course) => {
    setSelectedCourse(course);
    fetchEnrollments(course.id);
    setShowEnrollmentsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت دوره‌ها</h2>
          <p className="text-muted-foreground">مدیریت دوره‌ها و ثبت‌نام‌ها</p>
        </div>
        
        <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              دوره جدید
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCourse ? 'ویرایش دوره' : 'ایجاد دوره جدید'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                
                <div>
                  <Label htmlFor="woocommerce_product_id">ID محصول WooCommerce</Label>
                  <Input
                    id="woocommerce_product_id"
                    type="number"
                    value={formData.woocommerce_product_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, woocommerce_product_id: e.target.value }))}
                    placeholder="123"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="redirect_url">URL هدایت پس از خرید</Label>
                <Input
                  id="redirect_url"
                  type="url"
                  value={formData.redirect_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://academy.rafiei.co/course/boundless"
                />
              </div>

              {/* SpotPlayer Section */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">تنظیمات رفیعی پلیر (SpotPlayer)</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_spotplayer_enabled"
                    checked={formData.is_spotplayer_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_spotplayer_enabled: checked }))}
                  />
                  <Label htmlFor="is_spotplayer_enabled">فعال‌سازی رفیعی پلیر</Label>
                </div>

                {formData.is_spotplayer_enabled && (
                  <div>
                    <Label htmlFor="spotplayer_course_id">شناسه دوره در SpotPlayer *</Label>
                    <Input
                      id="spotplayer_course_id"
                      value={formData.spotplayer_course_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, spotplayer_course_id: e.target.value }))}
                      placeholder="مثال: course_123"
                      required={formData.is_spotplayer_enabled}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      شناسه دوره در پنل SpotPlayer که برای ایجاد لایسنس استفاده می‌شود
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">دوره فعال است</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCourseModal(false)}
                >
                  لغو
                </Button>
                <Button type="submit">
                  {selectedCourse ? 'به‌روزرسانی' : 'ایجاد'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            لیست دوره‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">هنوز دوره‌ای ایجاد نشده است</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>نامک</TableHead>
                    <TableHead>قیمت</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {course.slug}
                        </code>
                      </TableCell>
                      <TableCell>{formatPrice(course.price)}</TableCell>
                      <TableCell>
                        <Badge variant={course.is_active ? "default" : "secondary"}>
                          {course.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(course.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEnrollments(course)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `/enroll?course=${course.slug}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollments Modal */}
      <Dialog open={showEnrollmentsModal} onOpenChange={setShowEnrollmentsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ثبت‌نام‌های دوره: {selectedCourse?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">هنوز ثبت‌نامی برای این دوره وجود ندارد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>ایمیل</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>وضعیت پرداخت</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.full_name}</TableCell>
                        <TableCell>{enrollment.email}</TableCell>
                        <TableCell>{enrollment.phone}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              enrollment.payment_status === 'completed' ? "default" :
                              enrollment.payment_status === 'failed' ? "destructive" : "secondary"
                            }
                          >
                            {enrollment.payment_status === 'completed' ? 'تکمیل شده' :
                             enrollment.payment_status === 'failed' ? 'ناموفق' : 'در انتظار'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(enrollment.payment_amount)}</TableCell>
                        <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;
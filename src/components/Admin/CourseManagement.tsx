import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ExternalLink, Users, TrendingUp, DollarSign, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { TetherlandService } from '@/lib/tetherlandService';
import CourseFormModal from './CourseFormModal';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  use_dollar_price: boolean;
  usd_price: number | null;
  woocommerce_product_id: number | null;
  redirect_url: string | null;
  is_active: boolean;
  spotplayer_course_id?: string | null;
  is_spotplayer_enabled?: boolean;
  create_test_license?: boolean;
  woocommerce_create_access?: boolean;
  use_landing_page_merge?: boolean;
  use_enrollments_as_leads?: boolean;
  lead_start_date?: string | null;
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
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');
  const [enrollmentTotal, setEnrollmentTotal] = useState(0);
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  
  const debouncedEnrollmentSearch = useDebounce(enrollmentSearchTerm, 300);
  const enrollmentsPerPage = 50;

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
      // First get total count (with search if applied)
      let countQuery = supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);
      
      if (debouncedEnrollmentSearch) {
        const searchFilter = `full_name.ilike.%${debouncedEnrollmentSearch}%,email.ilike.%${debouncedEnrollmentSearch}%,phone.ilike.%${debouncedEnrollmentSearch}%`;
        countQuery = countQuery.or(searchFilter);
      }
      
      const { count } = await countQuery;
      
      // Then get data for display
      let dataQuery = supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      
      if (debouncedEnrollmentSearch) {
        const searchFilter = `full_name.ilike.%${debouncedEnrollmentSearch}%,email.ilike.%${debouncedEnrollmentSearch}%,phone.ilike.%${debouncedEnrollmentSearch}%`;
        dataQuery = dataQuery.or(searchFilter);
        // When searching, return all matching results (up to 500 for performance)
        dataQuery = dataQuery.limit(500);
      } else {
        // Default pagination: 100 records per page
        const offset = (enrollmentPage - 1) * enrollmentsPerPage;
        dataQuery = dataQuery.range(offset, offset + enrollmentsPerPage - 1);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;
      console.log(`Fetched ${data?.length || 0} enrollments out of ${count || 0} total for course ${courseId}`);
      setEnrollments(data || []);
      setEnrollmentTotal(count || 0);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری ثبت‌نام‌ها",
        variant: "destructive"
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowCourseModal(true);
  };

  const handleCourseModalClose = () => {
    setShowCourseModal(false);
    setEditingCourse(null);
  };

  const handleCourseSuccess = () => {
    fetchCourses();
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
    setEnrollmentSearchTerm('');
    setEnrollmentPage(1);
    fetchEnrollments(course.id);
    setShowEnrollmentsModal(true);
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse.id);
    }
  }, [debouncedEnrollmentSearch, enrollmentPage, selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      setEnrollmentPage(1);
    }
  }, [debouncedEnrollmentSearch]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت دوره‌ها</h2>
          <p className="text-muted-foreground">مدیریت دوره‌ها و ثبت‌نام‌ها</p>
        </div>
        
        <Button 
          onClick={handleCreateCourse} 
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          دوره جدید
        </Button>
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
                      <TableCell>
                        <div className="space-y-1">
                          <div>{formatPrice(course.price)}</div>
                          {course.use_dollar_price && course.usd_price && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {TetherlandService.formatUSDAmount(course.usd_price)}
                            </div>
                          )}
                        </div>
                      </TableCell>
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
            <DialogTitle className="flex items-center justify-between">
              <span>ثبت‌نام‌های دوره: {selectedCourse?.title}</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="جستجوی نام، ایمیل یا تلفن..."
                  value={enrollmentSearchTerm}
                  onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {enrollmentSearchTerm ? 'نتیجه‌ای یافت نشد' : 'هنوز ثبت‌نامی برای این دوره وجود ندارد'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  نمایش {enrollments.length} از {enrollmentTotal} ثبت‌نام
                </p>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead>نام</TableHead>
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
                         <TableCell>{enrollment.phone}</TableCell>
                         <TableCell>
                          <Badge 
                            variant={
                              enrollment.payment_status === 'completed' ? "default" :
                              (enrollment.payment_status === 'failed' || enrollment.payment_status === 'cancelled_payment') ? "destructive" : "secondary"
                            }
                          >
                            {enrollment.payment_status === 'completed' ? 'تکمیل شده' :
                             (enrollment.payment_status === 'failed' || enrollment.payment_status === 'cancelled_payment') ? 'ناموفق' : 'در انتظار'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(enrollment.payment_amount)}</TableCell>
                        <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                
                {Math.ceil(enrollmentTotal / enrollmentsPerPage) > 1 && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setEnrollmentPage(Math.max(1, enrollmentPage - 1))}
                      disabled={enrollmentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      قبلی
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      صفحه {enrollmentPage} از {Math.ceil(enrollmentTotal / enrollmentsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setEnrollmentPage(Math.min(Math.ceil(enrollmentTotal / enrollmentsPerPage), enrollmentPage + 1))}
                      disabled={enrollmentPage === Math.ceil(enrollmentTotal / enrollmentsPerPage)}
                    >
                      بعدی
                      <ChevronLeft className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Form Modal */}
      <CourseFormModal
        isOpen={showCourseModal}
        onClose={handleCourseModalClose}
        course={editingCourse}
        onSuccess={handleCourseSuccess}
      />
    </div>
  );
};

export default CourseManagement;
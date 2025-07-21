import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Clock, CreditCard, FileText, User, Mail, Phone, Calendar, Plus, Edit, BookOpen, DollarSign, Users, ExternalLink, BarChart3, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import DiscountManagement from '@/components/Admin/DiscountManagement';
import CourseManagement from '@/components/Admin/CourseManagement';

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  is_active: boolean;
  redirect_url: string | null;
  spotplayer_course_id: string | null;
  is_spotplayer_enabled: boolean;
  create_test_license: boolean;
  woocommerce_create_access: boolean;
  support_link: string | null;
  telegram_channel_link: string | null;
  gifts_link: string | null;
  enable_course_access: boolean;
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_amount: number;
  payment_status: string;
  payment_method: string;
  manual_payment_status: string | null;
  receipt_url: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  courses: {
    title: string;
    slug: string;
  };
}

const EnrollAdmin: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'enrollments' | 'discounts' | 'courses'>('dashboard');

  useEffect(() => {
    // Check for tab parameter and set active view
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'enrollments', 'discounts', 'courses'].includes(tab)) {
      setActiveView(tab as 'dashboard' | 'enrollments' | 'discounts' | 'courses');
    }
    
    Promise.all([fetchEnrollments(), fetchCourses()]);
    
    // Set up auto reload every 30 seconds
    const autoReloadInterval = setInterval(() => {
      Promise.all([fetchEnrollments(), fetchCourses()]);
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(autoReloadInterval);
  }, [searchParams]);

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
        description: "خطا در بارگذاری لیست دوره‌ها",
        variant: "destructive"
      });
    }
  };

  const fetchEnrollments = async () => {
    try {
      // Fetch enrollments and courses separately, then join in JavaScript
      const [enrollmentsResult, coursesResult] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('courses')
          .select('id, title, slug')
      ]);

      if (enrollmentsResult.error) throw enrollmentsResult.error;
      if (coursesResult.error) throw coursesResult.error;

      // Create a courses lookup map
      const coursesMap = new Map(
        (coursesResult.data || []).map(course => [course.id, course])
      );

      // Join the data in JavaScript
      const enrollmentsWithCourses = (enrollmentsResult.data || []).map(enrollment => ({
        ...enrollment,
        courses: coursesMap.get(enrollment.course_id) || { title: 'دوره نامشخص', slug: '' }
      }));

      setEnrollments(enrollmentsWithCourses);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری لیست ثبت‌نام‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getEnrolledUsersCount = (courseId: string) => {
    return enrollments.filter(e => e.course_id === courseId && e.payment_status === 'completed').length;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 ml-1" />در انتظار</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 ml-1" />تایید شده</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 ml-1" />رد شده</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const handleViewDetails = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setAdminNotes(enrollment.admin_notes || '');
    setShowEnrollmentModal(true);
  };

  const handleEditCourse = (course: Course) => {
    window.location.href = `/enroll/admin/course/${course.id}`;
  };

  const handleCreateCourse = () => {
    window.location.href = '/enroll/admin/course/new';
  };


  const handleApprove = async () => {
    if (!selectedEnrollment) return;

    setProcessing(true);
    try {
      // Update enrollment status
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'approved',
          payment_status: 'completed',
          admin_notes: adminNotes,
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedEnrollment.id);

      if (updateError) throw updateError;

      // Call WooCommerce API (similar to successful Zarinpal payment)
      try {
        const { error: wooError } = await supabase.functions.invoke('zarinpal-verify', {
          body: {
            authority: 'MANUAL_PAYMENT',
            enrollmentId: selectedEnrollment.id,
            manualApproval: true
          }
        });

        if (wooError) {
          console.warn('WooCommerce API call failed:', wooError);
        }
      } catch (wooError) {
        console.warn('WooCommerce API call failed:', wooError);
      }

      toast({
        title: "✅ تایید شد",
        description: "پرداخت تایید شد. کاربر به صفحه موفقیت منتقل می‌شود",
      });

      // Refresh the list
      fetchEnrollments();
      setShowEnrollmentModal(false);

    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "خطا",
        description: "خطا در تایید پرداخت",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEnrollment) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          manual_payment_status: 'rejected',
          admin_notes: adminNotes,
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedEnrollment.id);

      if (error) throw error;

      toast({
        title: "❌ رد شد",
        description: "پرداخت رد شد. کاربر به صفحه رد منتقل می‌شود",
      });

      fetchEnrollments();
      setShowEnrollmentModal(false);

    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "خطا",
        description: "خطا در رد کردن پرداخت",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: BarChart3,
    },
    {
      id: 'enrollments',
      label: 'مدیریت ثبت‌نام‌ها',
      icon: CreditCard,
    },
    {
      id: 'discounts',
      label: 'کدهای تخفیف',
      icon: DollarSign,
    },
    {
      id: 'courses',
      label: 'مدیریت دوره‌ها',
      icon: BookOpen,
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border flex-shrink-0 hidden md:block">
          <div className="p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    activeView === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <nav className="flex justify-around py-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                  activeView === item.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="container mx-auto px-4 md:px-6 py-8">
            
            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">داشبورد مدیریت</h1>
                  <p className="text-muted-foreground mt-2">مرور کلی از وضعیت سیستم</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">کل دوره‌ها</p>
                          <p className="text-2xl font-bold">{courses.length}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">کل ثبت‌نام‌ها</p>
                          <p className="text-2xl font-bold">{enrollments.length}</p>
                        </div>
                        <User className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">در انتظار تایید</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {enrollments.filter(e => e.manual_payment_status === 'pending').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">دوره‌های فعال</p>
                          <p className="text-2xl font-bold text-green-600">
                            {courses.filter(c => c.is_active).length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>آخرین ثبت‌نام‌ها</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {enrollments.slice(0, 5).length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">هیچ ثبت‌نامی یافت نشد</p>
                    ) : (
                      <div className="space-y-4">
                        {enrollments.slice(0, 5).map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{enrollment.full_name}</p>
                              <p className="text-sm text-muted-foreground">{enrollment.courses?.title || 'نامشخص'}</p>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{formatPrice(enrollment.payment_amount)}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(enrollment.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enrollments View */}
            {activeView === 'enrollments' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">مدیریت ثبت‌نام‌ها</h1>
                  <p className="text-muted-foreground mt-2">مدیریت و تایید پرداخت‌های دستی</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">کل ثبت‌نام‌ها</p>
                          <p className="text-2xl font-bold">{enrollments.length}</p>
                        </div>
                        <User className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">در انتظار تایید</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {enrollments.filter(e => e.manual_payment_status === 'pending').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">تایید شده</p>
                          <p className="text-2xl font-bold text-green-600">
                            {enrollments.filter(e => e.manual_payment_status === 'approved').length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">رد شده</p>
                          <p className="text-2xl font-bold text-red-600">
                            {enrollments.filter(e => e.manual_payment_status === 'rejected').length}
                          </p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enrollments Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-6 w-6" />
                      پرداخت‌های دستی
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {enrollments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">هیچ ثبت‌نامی یافت نشد</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>نام و نام خانوادگی</TableHead>
                              <TableHead>دوره</TableHead>
                              <TableHead>مبلغ</TableHead>
                              <TableHead>وضعیت</TableHead>
                              <TableHead>تاریخ ثبت‌نام</TableHead>
                              <TableHead>عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enrollments.map((enrollment) => (
                              <TableRow key={enrollment.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{enrollment.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{enrollment.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{enrollment.courses?.title || 'نامشخص'}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono">{formatPrice(enrollment.payment_amount)}</div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(enrollment.manual_payment_status)}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{formatDate(enrollment.created_at)}</div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(enrollment)}
                                  >
                                    <Eye className="h-4 w-4 ml-1" />
                                    مشاهده
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
            )}

            {/* Discount Management View */}
            {activeView === 'discounts' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">مدیریت کدهای تخفیف</h1>
                  <p className="text-muted-foreground mt-2">ایجاد و مدیریت کدهای تخفیف برای دوره‌ها</p>
                </div>
                <DiscountManagement />
              </div>
            )}

            {/* Courses View */}
            {activeView === 'courses' && (
              <div className="space-y-6">
                <CourseManagement />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Details Modal */}
      <Dialog open={showEnrollmentModal} onOpenChange={setShowEnrollmentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات ثبت‌نام</DialogTitle>
            <DialogDescription>
              بررسی و تایید پرداخت دستی
            </DialogDescription>
          </DialogHeader>
          
          {selectedEnrollment && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام و نام خانوادگی</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEnrollment.full_name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>ایمیل</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedEnrollment.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>شماره تلفن</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEnrollment.phone}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>تاریخ ثبت‌نام</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedEnrollment.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="space-y-2">
                <Label>دوره انتخابی</Label>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedEnrollment.courses?.title}</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(selectedEnrollment.payment_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {selectedEnrollment.receipt_url && (
                <div className="space-y-2">
                  <Label>رسید پرداخت</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={selectedEnrollment.receipt_url} 
                      alt="Receipt" 
                      className="w-full h-auto max-h-96 object-contain bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">یادداشت مدیر</Label>
                <Textarea
                  id="notes"
                  placeholder="یادداشت خود را اینجا بنویسید..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Current Status */}
              <div className="flex items-center gap-4">
                <Label>وضعیت فعلی:</Label>
                {getStatusBadge(selectedEnrollment.manual_payment_status)}
              </div>

              {/* Action Buttons */}
              {selectedEnrollment.manual_payment_status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تایید پرداخت
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    رد پرداخت
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

export default EnrollAdmin;

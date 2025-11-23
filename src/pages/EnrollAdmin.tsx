import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Download,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import UserCRM from '@/components/Admin/UserProfile/UserCRM';
import SalesDashboard from '@/components/Admin/SalesDashboard';
import TestManagement from '@/components/Admin/TestManagement';
import AnalyticsReports from '@/components/Admin/AnalyticsReports';
import WebinarManagement from '@/components/Admin/WebinarManagement';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';

interface Enrollment {
  id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
  courses: {
    title: string;
    slug: string;
  };
  chat_user_id: number | null;
}

interface FilterState {
  fullName: string;
  email: string;
  phone: string;
  paymentStatus: string;
  courseId: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

const EnrollAdmin: React.FC = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeView, setActiveView] = useState('enrollments');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    fullName: '',
    email: '',
    phone: '',
    paymentStatus: 'all',
    courseId: 'all',
    dateRange: {
      from: null,
      to: null,
    },
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'created_at' | 'payment_amount'>('created_at');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isUserCRMPopupOpen, setIsUserCRMPopupOpen] = useState(false);
  const { role: userRole, loading: roleLoading, isAdmin, canViewSales, canAccessCRM } = useUserRole();

  useEffect(() => {
    if (activeView === 'enrollments') {
      fetchEnrollments();
      fetchCourses();
    }
  }, [filter, sortOrder, sortBy, activeView]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          full_name,
          email,
          phone,
          payment_status,
          payment_amount,
          created_at,
          chat_user_id,
          courses (
            title,
            slug
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (filter.fullName) {
        query = query.ilike('full_name', `%${filter.fullName}%`);
      }
      if (filter.email) {
        query = query.ilike('email', `%${filter.email}%`);
      }
      if (filter.phone) {
        query = query.ilike('phone', `%${filter.phone}%`);
      }
      if (filter.paymentStatus !== 'all') {
        query = query.eq('payment_status', filter.paymentStatus);
      }
      if (filter.courseId !== 'all') {
        query = query.eq('course_id', filter.courseId);
      }

      if (filter.dateRange.from) {
        const fromDate = format(filter.dateRange.from, 'yyyy-MM-dd');
        query = query.gte('created_at', fromDate);
      }
      if (filter.dateRange.to) {
        const toDate = format(filter.dateRange.to, 'yyyy-MM-dd');
        query = query.lte('created_at', toDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات ثبت‌نام‌ها",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات دوره‌ها",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prevFilter => ({
      ...prevFilter,
      [name]: value
    }));
  };

  const handleDateRangeChange = (date: { from: Date | null; to: Date | null }) => {
    setFilter(prevFilter => ({
      ...prevFilter,
      dateRange: date
    }));
  };

  const handleSortChange = (newSortBy: 'created_at' | 'payment_amount') => {
    if (sortBy === newSortBy) {
      setSortOrder(prevSortOrder => (prevSortOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const handleOpenUserCRM = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsUserCRMPopupOpen(true);
  };

  const handleCloseUserCRM = () => {
    setIsUserCRMPopupOpen(false);
    setSelectedEnrollment(null);
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">دسترسی غیرمجاز</p>
        <p className="text-sm text-muted-foreground">شما به این بخش دسترسی ندارید.</p>
      </div>
    );
  }

  const renderContent = () => {
    console.log('renderContent called with activeView:', activeView);
    
    switch (activeView) {
      case 'webinars':
        console.log('Rendering WebinarManagement component');
        return <WebinarManagement />;
      case 'tests':
        console.log('Rendering TestManagement component');
        return <TestManagement />;
      case 'analytics':
        console.log('Rendering AnalyticsReports component');
        return <AnalyticsReports />;
      case 'sales':
        console.log('Rendering SalesDashboard component');
        return canViewSales ? <SalesDashboard /> : null;
      default:
        console.log('Rendering default enrollments view');
        return (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                مدیریت ثبت‌نام‌ها
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                  <Filter className="h-4 w-4 ml-2" />
                  فیلتر
                </Button>
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4 ml-2" />
                  خروجی اکسل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isFilterOpen && (
                <Card className="bg-gray-50 dark:bg-gray-900 mb-6">
                  <CardHeader>
                    <CardTitle>فیلترهای جستجو</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">نام و نام خانوادگی</label>
                      <Input
                        type="text"
                        name="fullName"
                        value={filter.fullName}
                        onChange={handleFilterChange}
                        placeholder="جستجو بر اساس نام"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ایمیل</label>
                      <Input
                        type="email"
                        name="email"
                        value={filter.email}
                        onChange={handleFilterChange}
                        placeholder="جستجو بر اساس ایمیل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">شماره تلفن</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={filter.phone}
                        onChange={handleFilterChange}
                        placeholder="جستجو بر اساس تلفن"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">وضعیت پرداخت</label>
                      <Select name="paymentStatus" value={filter.paymentStatus} onValueChange={(value) => setFilter({...filter, paymentStatus: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="همه" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه</SelectItem>
                          <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                          <SelectItem value="success">موفق</SelectItem>
                          <SelectItem value="failed">ناموفق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">دوره</label>
                      <Select name="courseId" value={filter.courseId} onValueChange={(value) => setFilter({...filter, courseId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="همه دوره‌ها" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه دوره‌ها</SelectItem>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">هیچ ثبت‌نامی یافت نشد.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            نام و نام خانوادگی
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            ایمیل
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            تلفن
                          </Button>
                        </TableHead>
                        <TableHead>
                          دوره
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            وضعیت پرداخت
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('payment_amount')}>
                            مبلغ پرداخت
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            تاریخ ثبت‌نام
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map(enrollment => (
                        <TableRow key={enrollment.id}>
                          <TableCell>{enrollment.full_name}</TableCell>
                          <TableCell>{enrollment.email}</TableCell>
                          <TableCell>{enrollment.phone}</TableCell>
                          <TableCell>{enrollment.courses?.title}</TableCell>
                          <TableCell>
                            {enrollment.payment_status === 'success' ? (
                              <Badge variant="outline">موفق</Badge>
                            ) : enrollment.payment_status === 'pending' ? (
                              <Badge variant="secondary">در انتظار پرداخت</Badge>
                            ) : (
                              <Badge variant="destructive">ناموفق</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(enrollment.payment_amount)}</TableCell>
                          <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                          <TableCell className="text-center">
                            {canAccessCRM && (
                              <Button size="sm" onClick={() => handleOpenUserCRM(enrollment)}>
                                <Eye className="h-4 w-4 ml-2" />
                                CRM
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole={userRole}
        isMessengerAdmin={false}
        isSalesAgent={false}
      />
      
      <div className="flex-1 p-8">
        {/* Debug indicator */}
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground p-2 rounded z-50 text-sm">
          View: {activeView}
        </div>
        
        {activeView === 'webinars' && <WebinarManagement />}
        {activeView === 'tests' && <TestManagement />}
        {activeView === 'analytics' && <AnalyticsReports />}
        {activeView === 'sales' && canViewSales && <SalesDashboard />}
        {(activeView === 'enrollments' || (!['webinars', 'tests', 'analytics', 'sales'].includes(activeView))) && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                مدیریت ثبت‌نام‌ها
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                  <Filter className="h-4 w-4 ml-2" />
                  فیلتر
                </Button>
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4 ml-2" />
                  خروجی اکسل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isFilterOpen && (
                <Card className="bg-muted mb-6">
                  <CardHeader>
                    <CardTitle>فیلترهای جستجو</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">نام و نام خانوادگی</label>
                      <Input
                        type="text"
                        name="fullName"
                        value={filter.fullName}
                        onChange={handleFilterChange}
                        placeholder="جستجو بر اساس نام"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ایمیل</label>
                      <Input
                        type="email"
                        name="email"
                        value={filter.email}
                        onChange={handleFilterChange}
                        placeholder="جستجو بر اساس ایمیل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">شماره تلفن</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={filter.phone}
                        onChange={handleFilterChange}
                        placeholder="جستجو بر اساس تلفن"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">وضعیت پرداخت</label>
                      <Select name="paymentStatus" value={filter.paymentStatus} onValueChange={(value) => setFilter({...filter, paymentStatus: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="همه" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه</SelectItem>
                          <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                          <SelectItem value="success">موفق</SelectItem>
                          <SelectItem value="failed">ناموفق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">دوره</label>
                      <Select name="courseId" value={filter.courseId} onValueChange={(value) => setFilter({...filter, courseId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="همه دوره‌ها" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه دوره‌ها</SelectItem>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">هیچ ثبت‌نامی یافت نشد.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            نام و نام خانوادگی
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            ایمیل
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            تلفن
                          </Button>
                        </TableHead>
                        <TableHead>
                          دوره
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            وضعیت پرداخت
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('payment_amount')}>
                            مبلغ پرداخت
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSortChange('created_at')}>
                            تاریخ ثبت‌نام
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map(enrollment => (
                        <TableRow key={enrollment.id}>
                          <TableCell>{enrollment.full_name}</TableCell>
                          <TableCell>{enrollment.email}</TableCell>
                          <TableCell>{enrollment.phone}</TableCell>
                          <TableCell>{enrollment.courses?.title}</TableCell>
                          <TableCell>
                            {enrollment.payment_status === 'success' ? (
                              <Badge variant="outline">موفق</Badge>
                            ) : enrollment.payment_status === 'pending' ? (
                              <Badge variant="secondary">در انتظار پرداخت</Badge>
                            ) : (
                              <Badge variant="destructive">ناموفق</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(enrollment.payment_amount)}</TableCell>
                          <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                          <TableCell className="text-center">
                            {canAccessCRM && (
                              <Button size="sm" onClick={() => handleOpenUserCRM(enrollment)}>
                                <Eye className="h-4 w-4 ml-2" />
                                CRM
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {selectedEnrollment && (
          <Dialog open={isUserCRMPopupOpen} onOpenChange={setIsUserCRMPopupOpen}>
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  CRM کاربر: {selectedEnrollment.full_name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                {selectedEnrollment.chat_user_id && (
                  <UserCRM 
                    userId={selectedEnrollment.chat_user_id}
                    userName={selectedEnrollment.full_name}
                    userPhone={selectedEnrollment.phone}
                    userEmail={selectedEnrollment.email}
                    preselectedCourseId={selectedEnrollment.course_id}
                    preselectedCourseTitle={selectedEnrollment.courses?.title}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default EnrollAdmin;
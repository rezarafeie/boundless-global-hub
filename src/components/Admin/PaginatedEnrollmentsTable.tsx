import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, FileText, DollarSign, ExternalLink, Eye, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  manual_payment_status: string | null;
  payment_amount: number;
  payment_method: string | null;
  created_at: string;
  course_id: string;
  receipt_url: string | null;
  admin_notes: string | null;
  chat_user_id: number | null;
  courses: {
    title: string;
    slug: string;
  };
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

const PaginatedEnrollmentsTable: React.FC = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  const enrollmentsPerPage = 50;
  const totalPages = Math.ceil(totalEnrollments / enrollmentsPerPage);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [currentPage, debouncedSearchTerm, statusFilter, courseFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, courseFilter]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      
      // Build base query
      let countQuery = supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });
        
      let dataQuery = supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false });
        
      // Apply search filter - now works from first character
      if (debouncedSearchTerm) {
        const searchFilter = `full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_manual') {
          countQuery = countQuery.eq('payment_method', 'manual').eq('payment_status', 'pending').is('manual_payment_status', null);
          dataQuery = dataQuery.eq('payment_method', 'manual').eq('payment_status', 'pending').is('manual_payment_status', null);
        } else {
          countQuery = countQuery.eq('payment_status', statusFilter);
          dataQuery = dataQuery.eq('payment_status', statusFilter);
        }
      }

      // Apply course filter
      if (courseFilter !== 'all') {
        countQuery = countQuery.eq('course_id', courseFilter);
        dataQuery = dataQuery.eq('course_id', courseFilter);
      }
      
      // Get total count
      const { count } = await countQuery;
      
      // Apply pagination to data query
      const offset = (currentPage - 1) * enrollmentsPerPage;
      dataQuery = dataQuery.range(offset, offset + enrollmentsPerPage - 1);

      const { data, error } = await dataQuery;

      if (error) throw error;
      
      setEnrollments(data || []);
      setTotalEnrollments(count || 0);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری ثبت‌نام‌ها",
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
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleViewEnrollmentDetails = (enrollmentId: string) => {
    window.open(`/enroll/details?id=${enrollmentId}`, '_blank');
  };

  const handleViewEnrollDetails = (enrollmentId: string) => {
    window.open(`/enroll/details?id=${enrollmentId}`, '_blank');
  };

  const handleViewUserDetails = (chatUserId: number | null) => {
    if (chatUserId) {
      window.open(`/enroll/admin/users/${chatUserId}`, '_blank');
    }
  };

  const handleViewAdminDetails = (enrollmentId: string) => {
    window.open(`/enroll/admin/enrollment/${enrollmentId}`, '_blank');
  };

  const getStatusBadge = (enrollment: Enrollment) => {
    // Check for manual payments pending approval
    if (enrollment.payment_method === 'manual' && enrollment.payment_status === 'pending' && !enrollment.manual_payment_status) {
      return <Badge className="bg-orange-100 text-orange-800">در انتظار تایید دستی</Badge>;
    }
    
    switch (enrollment.payment_status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-100 text-green-800">تکمیل شده</Badge>;
      case 'failed':
      case 'cancelled_payment':
        return <Badge variant="destructive">ناموفق</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>;
      default:
        return <Badge variant="secondary">{enrollment.payment_status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-muted-foreground">-</span>;
    
    switch (method) {
      case 'zarinpal':
        return <Badge variant="outline">زرین‌پال</Badge>;
      case 'manual':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">دستی</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (loading && currentPage === 1) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={isMobile ? "flex flex-col gap-3" : "flex items-center justify-between"}>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تمام ثبت‌نام‌ها
            <Badge variant="secondary">{totalEnrollments} ثبت‌نام</Badge>
          </div>
          {isMobile ? (
            <div className="space-y-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="pending_manual">در انتظار تایید</SelectItem>
                  <SelectItem value="failed">ناموفق</SelectItem>
                  <SelectItem value="cancelled_payment">لغو شده</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="جستجوی نام، ایمیل، تلفن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="pending_manual">در انتظار تایید</SelectItem>
                  <SelectItem value="failed">ناموفق</SelectItem>
                  <SelectItem value="cancelled_payment">لغو شده</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-48">
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
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="جستجوی نام، ایمیل، تلفن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 && !loading ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || courseFilter !== 'all' ? 'هیچ ثبت‌نامی یافت نشد' : 'هنوز ثبت‌نامی وجود ندارد'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enrollments Table/Cards */}
            {isMobile ? (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {enrollment.full_name}
                          </button>
                          {getStatusBadge(enrollment)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">دوره:</span> {enrollment.courses.title}
                            <div className="text-xs text-muted-foreground">{enrollment.courses.slug}</div>
                          </div>
                           <div><span className="font-medium">تلفن:</span> {enrollment.phone}</div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">مبلغ:</span>
                            <DollarSign className="h-3 w-3" />
                            {formatPrice(enrollment.payment_amount)}
                          </div>
                          <div><span className="font-medium">روش پرداخت:</span> {getPaymentMethodBadge(enrollment.payment_method)}</div>
                          <div><span className="font-medium">تاریخ:</span> {formatDate(enrollment.created_at)}</div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">زمان:</span>
                            <Clock className="h-3 w-3" />
                            {formatTime(enrollment.created_at)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {enrollment.receipt_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(enrollment.receipt_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              مشاهده رسید
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            مشاهده ثبت‌نام
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleViewAdminDetails(enrollment.id)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            مشاهده جزئیات ادمین
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead>نام</TableHead>
                       <TableHead>دوره</TableHead>
                       <TableHead>تلفن</TableHead>
                       <TableHead>مبلغ</TableHead>
                       <TableHead>روش پرداخت</TableHead>
                       <TableHead>وضعیت</TableHead>
                       <TableHead>تاریخ</TableHead>
                       <TableHead>زمان</TableHead>
                       <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <button
                            onClick={() => handleViewUserDetails(enrollment.chat_user_id)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-right"
                          >
                            {enrollment.full_name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.courses.title}</div>
                            <div className="text-sm text-muted-foreground">{enrollment.courses.slug}</div>
                          </div>
                        </TableCell>
                         <TableCell>{enrollment.phone}</TableCell>
                         <TableCell>
                           <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatPrice(enrollment.payment_amount)}
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentMethodBadge(enrollment.payment_method)}</TableCell>
                        <TableCell>{getStatusBadge(enrollment)}</TableCell>
                        <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(enrollment.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {enrollment.receipt_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(enrollment.receipt_url!, '_blank')}
                                title="مشاهده رسید"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEnrollmentDetails(enrollment.id)}
                              title="مشاهده ثبت‌نام"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewAdminDetails(enrollment.id)}
                              title="مشاهده جزئیات ادمین"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  نمایش {(currentPage - 1) * enrollmentsPerPage + 1} تا{' '}
                  {Math.min(currentPage * enrollmentsPerPage, totalEnrollments)} از {totalEnrollments} ثبت‌نام
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    قبلی
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    صفحه {currentPage} از {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    بعدی
                    <ChevronLeft className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginatedEnrollmentsTable;

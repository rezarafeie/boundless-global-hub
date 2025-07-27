
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnrollmentWithoutCRM {
  id: string;
  full_name: string;
  phone: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
  course_id: string;
  chat_user_id: number;
  courses: {
    title: string;
    slug: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface Props {
  courses: Course[];
  onCreateCRM: (enrollment: EnrollmentWithoutCRM) => void;
}

const PAYMENT_STATUSES = [
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'failed', label: 'ناموفق' },
  { value: 'cancelled', label: 'لغو شده' },
  { value: 'cancelled_payment', label: 'لغو پرداخت' }
];

const EnrollmentsWithoutCRM: React.FC<Props> = ({ courses, onCreateCRM }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [enrollments, setEnrollments] = useState<EnrollmentWithoutCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const enrollmentsPerPage = 20;
  const totalPages = Math.ceil(totalCount / enrollmentsPerPage);

  useEffect(() => {
    fetchEnrollments();
  }, [filterCourse, filterStatus, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCourse, filterStatus]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      // Build query for enrollments without CRM
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          full_name,
          phone,
          payment_status,
          payment_amount,
          created_at,
          course_id,
          chat_user_id,
          courses (
            title,
            slug
          )
        `)
        .not('chat_user_id', 'is', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterCourse !== 'all') {
        query = query.eq('course_id', filterCourse);
      }
      if (filterStatus !== 'all') {
        query = query.eq('payment_status', filterStatus);
      }

      const { data: allEnrollments, error } = await query;
      if (error) throw error;

      // Get user IDs that have CRM records
      const userIds = (allEnrollments || [])
        .map(e => e.chat_user_id)
        .filter(Boolean);

      if (userIds.length === 0) {
        setEnrollments([]);
        setTotalCount(0);
        return;
      }

      const { data: crmRecords } = await supabase
        .from('crm_notes')
        .select('user_id')
        .in('user_id', userIds);

      const userIdsWithCRM = new Set(crmRecords?.map(r => r.user_id) || []);
      
      // Filter enrollments without CRM
      const enrollmentsWithoutCRM = (allEnrollments || []).filter(
        enrollment => enrollment.chat_user_id && !userIdsWithCRM.has(enrollment.chat_user_id)
      );

      setTotalCount(enrollmentsWithoutCRM.length);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * enrollmentsPerPage;
      const paginatedEnrollments = enrollmentsWithoutCRM.slice(
        startIndex,
        startIndex + enrollmentsPerPage
      );

      setEnrollments(paginatedEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments without CRM:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری ثبت‌نام‌های بدون CRM.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'pending': 'secondary',
      'failed': 'destructive',
      'cancelled': 'destructive',
      'cancelled_payment': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'completed': 'تکمیل شده',
      'pending': 'در انتظار',
      'failed': 'ناموفق',
      'cancelled': 'لغو شده',
      'cancelled_payment': 'لغو پرداخت'
    };
    
    return <Badge variant={variants[status] || 'default'} className="text-xs">{labels[status] || status}</Badge>;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          ثبت‌نام‌های بدون CRM
          {totalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p className="text-green-700 font-medium">
                {filterCourse !== 'all' || filterStatus !== 'all'
                  ? 'هیچ ثبت‌نامی با فیلترهای انتخابی بدون CRM یافت نشد'
                  : 'همه ثبت‌نام‌ها دارای CRM هستند'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {isMobile ? (
                  enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{enrollment.full_name}</div>
                            <Badge className="bg-orange-100 text-orange-800">
                              نیاز به CRM
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">دوره:</span> {enrollment.courses.title}</div>
                            <div><span className="font-medium">تلفن:</span> {enrollment.phone}</div>
                            <div><span className="font-medium">وضعیت:</span> {getPaymentStatusBadge(enrollment.payment_status)}</div>
                            <div><span className="font-medium">مبلغ:</span> {formatPrice(enrollment.payment_amount)}</div>
                            <div><span className="font-medium">تاریخ:</span> {formatDate(enrollment.created_at)}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onCreateCRM(enrollment)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            ایجاد CRM
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="border border-orange-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-orange-50">
                        <TableRow>
                          <TableHead>نام</TableHead>
                          <TableHead>دوره</TableHead>
                          <TableHead>تلفن</TableHead>
                          <TableHead>وضعیت پرداخت</TableHead>
                          <TableHead>مبلغ</TableHead>
                          <TableHead>تاریخ ثبت‌نام</TableHead>
                          <TableHead>عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id} className="hover:bg-orange-50">
                            <TableCell className="font-medium">{enrollment.full_name}</TableCell>
                            <TableCell>{enrollment.courses.title}</TableCell>
                            <TableCell>{enrollment.phone}</TableCell>
                            <TableCell>{getPaymentStatusBadge(enrollment.payment_status)}</TableCell>
                            <TableCell>{formatPrice(enrollment.payment_amount)}</TableCell>
                            <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => onCreateCRM(enrollment)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                ایجاد CRM
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    نمایش {(currentPage - 1) * enrollmentsPerPage + 1} تا{' '}
                    {Math.min(currentPage * enrollmentsPerPage, totalCount)} از {totalCount} ثبت‌نام
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnrollmentsWithoutCRM;

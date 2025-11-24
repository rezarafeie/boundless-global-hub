import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SmartTestLeadsTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ['smart-test-submissions', searchQuery, statusFilter, courseFilter],
    queryFn: async () => {
      let query = supabase
        .from('smart_test_submissions')
        .select('*, assigned_to:chat_users!smart_test_submissions_assigned_to_fkey(name)')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (courseFilter !== 'all') {
        query = query.eq('recommended_course_slug', courseFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('slug, title')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const handleExportCSV = () => {
    if (!submissions || submissions.length === 0) {
      toast.error('داده‌ای برای خروجی وجود ندارد');
      return;
    }

    const csv = [
      ['نام', 'تلفن', 'دوره پیشنهادی', 'امتیاز', 'وضعیت', 'تاریخ'].join(','),
      ...submissions.map(sub =>
        [
          sub.full_name,
          sub.phone,
          sub.recommended_course_title,
          sub.score,
          sub.status,
          format(new Date(sub.created_at), 'yyyy/MM/dd')
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `smart-test-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success('فایل CSV با موفقیت دانلود شد');
  };

  const handleAssignAgent = async (submissionId: string) => {
    // This would open a modal to select an agent
    toast.info('قابلیت اختصاص به مشاور در نسخه بعدی اضافه می‌شود');
  };

  const handleViewDetails = (submission: any) => {
    // Navigate to detailed view
    window.open(`/smart-test/results?token=${submission.result_token}`, '_blank');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">عالی</Badge>;
    if (score >= 60) return <Badge className="bg-primary">خوب</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">متوسط</Badge>;
    return <Badge variant="destructive">ضعیف</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: 'در انتظار', variant: 'secondary' },
      contacted: { label: 'تماس گرفته شده', variant: 'default' },
      enrolled: { label: 'ثبت‌نام شده', variant: 'default' },
      rejected: { label: 'رد شده', variant: 'destructive' },
    };

    const { label, variant } = statusMap[status] || statusMap.pending;
    return <Badge variant={variant as any}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">لیدهای تست هوشمند</h2>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="ml-2 w-4 h-4" />
              خروجی CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو (نام یا تلفن)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="contacted">تماس گرفته شده</SelectItem>
                <SelectItem value="enrolled">ثبت‌نام شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="دوره" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دوره‌ها</SelectItem>
                {courses?.map(course => (
                  <SelectItem key={course.slug} value={course.slug}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="p-6 bg-card border-border">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">در حال بارگذاری...</div>
          </div>
        ) : submissions && submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>تلفن</TableHead>
                  <TableHead>دوره پیشنهادی</TableHead>
                  <TableHead className="text-center">امتیاز</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium text-foreground">
                      {submission.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">
                      {submission.phone}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {submission.recommended_course_title}
                    </TableCell>
                    <TableCell className="text-center">
                      {getScoreBadge(submission.score)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(submission.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(submission.created_at), 'yyyy/MM/dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignAgent(submission.id)}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            هیچ نتیجه‌ای یافت نشد
          </div>
        )}
      </Card>
    </div>
  );
};

export default SmartTestLeadsTab;
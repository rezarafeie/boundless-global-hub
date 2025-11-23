import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Calendar, Download, TrendingUp, Flame, Snowflake, ThermometerSun, Loader2, User, Phone, Mail, Trophy, Clock, Play, Pause, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Job {
  id: string;
  course_id: string;
  start_date: string;
  end_date: string;
  status: string;
  progress_current: number;
  progress_total: number;
  results: any;
  error_message: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

const AILeadScoringJob: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7');
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchActiveJob();

    // Subscribe to job updates
    const channel = supabase
      .channel('lead-analysis-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_analysis_jobs'
        },
        (payload) => {
          if (payload.new) {
            setCurrentJob(payload.new as Job);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('title');

    if (!error && data) {
      setCourses(data);
    }
  };

  const fetchActiveJob = async () => {
    const { data } = await supabase
      .from('lead_analysis_jobs')
      .select('*')
      .in('status', ['pending', 'running', 'paused', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentJob(data);
      if (data.course_id) {
        setSelectedCourse(data.course_id);
      }
    }
  };

  const startNewJob = async () => {
    if (!selectedCourse) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'لطفاً یک دوره انتخاب کنید'
      });
      return;
    }

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();

      // Create new job
      const { data: newJob, error } = await supabase
        .from('lead_analysis_jobs')
        .insert({
          course_id: selectedCourse,
          start_date: startDate,
          end_date: endDate,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentJob(newJob);

      // Start processing the job
      const { error: invokeError } = await supabase.functions.invoke('ai-lead-scoring-job', {
        body: { jobId: newJob.id }
      });

      if (invokeError) throw invokeError;

      toast({
        title: 'تحلیل شروع شد',
        description: 'تحلیل AI در پس‌زمینه در حال اجرا است'
      });
    } catch (error: any) {
      console.error('Error starting job:', error);
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: error.message || 'خطا در شروع تحلیل'
      });
    }
  };

  const handleJobAction = async (action: 'cancel' | 'pause' | 'resume' | 'retry') => {
    if (!currentJob) return;

    try {
      const { error } = await supabase.functions.invoke('ai-lead-scoring-job', {
        body: { jobId: currentJob.id, action }
      });

      if (error) throw error;

      const actionMessages = {
        cancel: 'لغو شد',
        pause: 'متوقف شد',
        resume: 'از سر گرفته شد',
        retry: 'مجدداً در حال اجرا'
      };

      toast({
        title: 'موفق',
        description: `تحلیل ${actionMessages[action]}`
      });
    } catch (error: any) {
      console.error(`Error ${action} job:`, error);
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: error.message || `خطا در ${action}`
      });
    }
  };

  const exportToCSV = () => {
    if (!currentJob?.results?.leads) return;

    const headers = [
      'نام و نام خانوادگی',
      'شماره تماس',
      'ایمیل',
      'دوره',
      'تاریخ ثبت‌نام',
      'امتیاز',
      'وضعیت',
      'درصد تکمیل',
      'زمان یادگیری (دقیقه)',
      'ساعت از آخرین فعالیت',
      'تعداد درس ثبت‌شده',
      'تعداد درس تکمیل شده',
      'گفتگوی پشتیبانی',
      'تعامل CRM',
      'دلیل امتیازدهی'
    ];

    const csvData = currentJob.results.leads.map((lead: any) => [
      lead.full_name,
      lead.phone,
      lead.email,
      lead.course_name,
      format(new Date(lead.enrollment_date), 'yyyy-MM-dd'),
      lead.score,
      lead.status,
      `${lead.metrics.completion_percentage}%`,
      lead.metrics.total_time_minutes,
      lead.metrics.hours_since_last_activity,
      lead.metrics.total_lessons_enrolled,
      lead.metrics.completed_lessons,
      lead.metrics.has_support_conversation ? 'بله' : 'خیر',
      lead.metrics.crm_interactions,
      lead.reasoning
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lead-scoring-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HOT':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'WARM':
        return <ThermometerSun className="w-4 h-4 text-orange-500" />;
      case 'COLD':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string): "destructive" | "default" | "secondary" => {
    switch (status) {
      case 'HOT':
        return 'destructive';
      case 'WARM':
        return 'default';
      case 'COLD':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const progressPercentage = currentJob && currentJob.progress_total > 0
    ? Math.round((currentJob.progress_current / currentJob.progress_total) * 100)
    : 0;

  const canStartNew = !currentJob || ['completed', 'failed', 'cancelled'].includes(currentJob.status);
  const isRunning = currentJob?.status === 'running';
  const isPaused = currentJob?.status === 'paused';
  const isFailed = currentJob?.status === 'failed';
  const isCompleted = currentJob?.status === 'completed';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">امتیازدهی هوشمند لیدها با AI (پس‌زمینه)</CardTitle>
              <CardDescription>
                تحلیل رفتار کاربران در پس‌زمینه - می‌توانید صفحه را ببندید و بعداً برگردید
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Job Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {canStartNew ? 'شروع تحلیل جدید' : 'کنترل تحلیل'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canStartNew ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">دوره</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دوره" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  بازه زمانی
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 روز گذشته</SelectItem>
                    <SelectItem value="14">14 روز گذشته</SelectItem>
                    <SelectItem value="30">30 روز گذشته</SelectItem>
                    <SelectItem value="60">60 روز گذشته</SelectItem>
                    <SelectItem value="90">90 روز گذشته</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={startNewJob} disabled={!selectedCourse} className="w-full">
                  <Play className="w-4 h-4 ml-2" />
                  شروع تحلیل
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {isRunning && 'در حال پردازش...'}
                    {isPaused && 'متوقف شده'}
                    {isFailed && 'خطا در پردازش'}
                    {isCompleted && 'تحلیل کامل شد'}
                  </span>
                  <span>
                    {currentJob.progress_current} از {currentJob.progress_total} ({progressPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isFailed ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {isFailed && currentJob.error_message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{currentJob.error_message}</AlertDescription>
                </Alert>
              )}

              {/* Control Buttons */}
              <div className="flex gap-2">
                {isRunning && (
                  <>
                    <Button onClick={() => handleJobAction('pause')} variant="outline">
                      <Pause className="w-4 h-4 ml-2" />
                      توقف
                    </Button>
                    <Button onClick={() => handleJobAction('cancel')} variant="destructive">
                      <X className="w-4 h-4 ml-2" />
                      لغو
                    </Button>
                  </>
                )}
                {isPaused && (
                  <>
                    <Button onClick={() => handleJobAction('resume')}>
                      <Play className="w-4 h-4 ml-2" />
                      ادامه
                    </Button>
                    <Button onClick={() => handleJobAction('cancel')} variant="destructive">
                      <X className="w-4 h-4 ml-2" />
                      لغو
                    </Button>
                  </>
                )}
                {isFailed && (
                  <Button onClick={() => handleJobAction('retry')}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تلاش مجدد
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isCompleted && currentJob?.results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{currentJob.results.total_analyzed}</p>
                  <p className="text-sm text-muted-foreground">کل لیدهای تحلیل شده</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Flame className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold text-red-500">{currentJob.results.hot_leads}</p>
                  <p className="text-sm text-muted-foreground">لیدهای داغ (75-100)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <ThermometerSun className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-500">{currentJob.results.warm_leads}</p>
                  <p className="text-sm text-muted-foreground">لیدهای گرم (50-74)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Snowflake className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">{currentJob.results.cold_leads}</p>
                  <p className="text-sm text-muted-foreground">لیدهای سرد (0-49)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>نتایج تحلیل</CardTitle>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                خروجی CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">امتیاز</TableHead>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">تماس</TableHead>
                      <TableHead className="text-right">درصد تکمیل</TableHead>
                      <TableHead className="text-right">زمان یادگیری</TableHead>
                      <TableHead className="text-right">آخرین فعالیت</TableHead>
                      <TableHead className="text-right">تعداد درس</TableHead>
                      <TableHead className="text-right">جزئیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentJob.results.leads.map((lead: any) => (
                      <React.Fragment key={lead.enrollment_id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)}
                        >
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(lead.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(lead.status)}
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-lg">{lead.score}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {lead.full_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {lead.phone}
                            </div>
                          </TableCell>
                          <TableCell>{lead.metrics.completion_percentage}%</TableCell>
                          <TableCell>{lead.metrics.total_time_minutes} دقیقه</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {lead.metrics.hours_since_last_activity}h
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.metrics.completed_lessons}/{lead.metrics.total_lessons_enrolled}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              {expandedRow === lead.enrollment_id ? '▲' : '▼'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRow === lead.enrollment_id && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                <div>
                                  <p className="font-semibold mb-1">ایمیل:</p>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    {lead.email}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-semibold mb-1">دلیل امتیازدهی AI:</p>
                                  <p className="text-sm text-muted-foreground">{lead.reasoning}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Badge variant="outline">
                                    {lead.metrics.has_support_conversation ? '✓' : '✗'} پشتیبانی
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.crm_interactions} تعامل CRM
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AILeadScoringJob;

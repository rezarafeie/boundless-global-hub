import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Calendar, Download, TrendingUp, Flame, Snowflake, ThermometerSun, Loader2, User, Phone, Mail, Trophy, Clock, Play, Pause, X, RefreshCw, AlertCircle, Check, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [salesAgents, setSalesAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  useEffect(() => {
    fetchCourses();
    fetchActiveJob();
    fetchSalesAgents();

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

  const fetchSalesAgents = async () => {
    const { data } = await supabase
      .from('sales_agents')
      .select(`
        id,
        user_id,
        is_active,
        chat_users!inner(id, name, phone)
      `)
      .eq('is_active', true);

    if (data) {
      setSalesAgents(data);
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

  const exportToCSV = (leadsToExport?: any[]) => {
    const leads = leadsToExport || (currentJob?.results?.leads || []);
    if (leads.length === 0) return;

    const csvContent = [
      ['نام', 'تلفن', 'ایمیل', 'وضعیت', 'امتیاز', 'درصد تکمیل', 'زمان یادگیری', 'آخرین فعالیت', 'تعداد درس کامل', 'کل دروس', 'فعال‌سازی پشتیبانی', 'فعال‌سازی تلگرام'].join(','),
      ...leads.map((lead: any) => 
        [
          lead.full_name,
          lead.phone,
          lead.email,
          lead.status,
          lead.score,
          `${lead.metrics.completion_percentage}%`,
          `${lead.metrics.total_time_minutes} دقیقه`,
          `${lead.metrics.hours_since_last_activity} ساعت`,
          lead.metrics.completed_lessons,
          lead.metrics.total_lessons_in_course || lead.metrics.total_lessons_enrolled,
          lead.metrics.has_support_activation ? 'بله' : 'خیر',
          lead.metrics.has_telegram_activation ? 'بله' : 'خیر'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lead-analysis-${filterStatus !== 'all' ? filterStatus + '-' : ''}${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const toggleLeadSelection = (enrollmentId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(enrollmentId)) {
      newSelection.delete(enrollmentId);
    } else {
      newSelection.add(enrollmentId);
    }
    setSelectedLeads(newSelection);
  };

  const toggleAllLeads = () => {
    if (!currentJob?.results?.leads) return;
    
    const filteredLeads = getFilteredLeads();
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l: any) => l.enrollment_id)));
    }
  };

  const getFilteredLeads = () => {
    if (!currentJob?.results?.leads) return [];
    
    if (filterStatus === 'all') return currentJob.results.leads;
    return currentJob.results.leads.filter((l: any) => l.status === filterStatus);
  };

  const assignLeadsToAgent = async () => {
    if (!selectedAgent || selectedLeads.size === 0) {
      toast({
        title: 'خطا',
        description: 'لطفا یک کارشناس فروش و حداقل یک لید انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      const agentData = salesAgents.find(a => a.id.toString() === selectedAgent);
      if (!agentData) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('کاربر وارد نشده است');

      // Get current user's chat_users record
      const { data: chatUser } = await supabase
        .from('chat_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!chatUser) throw new Error('کاربر یافت نشد');

      const enrollmentIds = Array.from(selectedLeads);
      
      // Insert assignments into lead_assignments table
      const assignments = enrollmentIds.map(enrollmentId => ({
        enrollment_id: enrollmentId,
        sales_agent_id: agentData.chat_users.id,
        assigned_by: chatUser.id,
        assignment_type: 'manual',
        status: 'assigned'
      }));

      const { error: insertError } = await supabase
        .from('lead_assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      toast({
        title: 'موفق',
        description: `${enrollmentIds.length} لید با موفقیت به ${agentData.chat_users.name} واگذار شد`,
      });

      setSelectedLeads(new Set());
      setSelectedAgent('');
    } catch (error: any) {
      console.error('Error assigning leads:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در واگذاری لیدها',
        variant: 'destructive',
      });
    }
  };

  const exportSelectedLeads = () => {
    if (selectedLeads.size === 0) {
      toast({
        title: 'خطا',
        description: 'لطفا حداقل یک لید انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    const leads = currentJob?.results?.leads.filter((l: any) => 
      selectedLeads.has(l.enrollment_id)
    );
    exportToCSV(leads);
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
      {currentJob?.results?.leads?.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{currentJob.results.total_analyzed}</p>
                  <p className="text-sm text-muted-foreground">
                    کل لیدهای تحلیل شده
                    {isRunning && <span className="block text-xs text-primary mt-1">در حال به‌روزرسانی...</span>}
                  </p>
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

          {/* Selection and Assignment Controls */}
          {currentJob?.results?.leads?.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="فیلتر وضعیت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه ({currentJob.results.total_analyzed})</SelectItem>
                        <SelectItem value="HOT">داغ ({currentJob.results.hot_leads})</SelectItem>
                        <SelectItem value="WARM">گرم ({currentJob.results.warm_leads})</SelectItem>
                        <SelectItem value="COLD">سرد ({currentJob.results.cold_leads})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="انتخاب کارشناس فروش" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.chat_users.name} ({agent.chat_users.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={assignLeadsToAgent} 
                      disabled={selectedLeads.size === 0 || !selectedAgent}
                      size="sm"
                    >
                      <UserPlus className="w-4 h-4 ml-2" />
                      واگذاری ({selectedLeads.size})
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <Button 
                      onClick={exportSelectedLeads} 
                      variant="outline" 
                      size="sm"
                      disabled={selectedLeads.size === 0}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      خروجی انتخاب شده ({selectedLeads.size})
                    </Button>
                    <Button onClick={() => exportToCSV()} variant="outline" size="sm">
                      <Download className="w-4 h-4 ml-2" />
                      خروجی فیلتر شده ({getFilteredLeads().length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>نتایج تحلیل</CardTitle>
                {isRunning && (
                  <Badge variant="outline" className="animate-pulse">
                    <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                    در حال به‌روزرسانی...
                  </Badge>
                )}
                {selectedLeads.size > 0 && (
                  <Badge variant="secondary">
                    {selectedLeads.size} انتخاب شده
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-12">
                        <Checkbox
                          checked={selectedLeads.size === getFilteredLeads().length && getFilteredLeads().length > 0}
                          onCheckedChange={toggleAllLeads}
                        />
                      </TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">امتیاز</TableHead>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">تماس</TableHead>
                      <TableHead className="text-right">درصد تکمیل</TableHead>
                      <TableHead className="text-right">زمان یادگیری</TableHead>
                      <TableHead className="text-right">آخرین فعالیت</TableHead>
                      <TableHead className="text-right">فعال‌سازی</TableHead>
                      <TableHead className="text-right">تعداد درس</TableHead>
                      <TableHead className="text-right">جزئیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredLeads().map((lead: any) => (
                      <React.Fragment key={lead.enrollment_id}>
                        <TableRow 
                          className="hover:bg-muted/50"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedLeads.has(lead.enrollment_id)}
                              onCheckedChange={() => toggleLeadSelection(lead.enrollment_id)}
                            />
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            <Badge variant={getStatusBadgeVariant(lead.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(lead.status)}
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            <div className="font-bold text-lg">{lead.score}</div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {lead.full_name}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {lead.phone}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">{lead.metrics.completion_percentage}%</TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">{lead.metrics.total_time_minutes} دقیقه</TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {lead.metrics.hours_since_last_activity}h
                            </div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            <div className="flex gap-1">
                              {lead.metrics.has_support_activation && (
                                <Badge variant="outline" className="text-xs">
                                  <Check className="w-3 h-3 ml-1" />
                                  پشتیبانی
                                </Badge>
                              )}
                              {lead.metrics.has_telegram_activation && (
                                <Badge variant="outline" className="text-xs">
                                  <Check className="w-3 h-3 ml-1" />
                                  تلگرام
                                </Badge>
                              )}
                              {!lead.metrics.has_support_activation && !lead.metrics.has_telegram_activation && (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)} className="cursor-pointer">
                            {lead.metrics.completed_lessons}/{lead.metrics.total_lessons_in_course}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setExpandedRow(expandedRow === lead.enrollment_id ? null : lead.enrollment_id)}
                            >
                              {expandedRow === lead.enrollment_id ? '▲' : '▼'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRow === lead.enrollment_id && (
                          <TableRow>
                            <TableCell colSpan={11} className="bg-muted/30">
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <Badge variant="outline">
                                    {lead.metrics.has_support_conversation ? '✓' : '✗'} گفتگوی پشتیبانی
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.has_support_activation ? '✓' : '✗'} فعال‌سازی پشتیبانی
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.has_telegram_activation ? '✓' : '✗'} عضویت تلگرام
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.crm_interactions} تعامل CRM
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.lessons_accessed} درس مشاهده شده
                                  </Badge>
                                  <Badge variant="outline">
                                    تاریخ ثبت‌نام: {format(new Date(lead.enrollment_date), 'yyyy/MM/dd')}
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

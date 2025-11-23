import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Calendar, Download, TrendingUp, Flame, Snowflake, ThermometerSun, Loader2, User, Phone, Mail, Trophy, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface LeadScore {
  enrollment_id: string;
  full_name: string;
  email: string;
  phone: string;
  enrollment_date: string;
  course_name: string;
  score: number;
  status: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  metrics: {
    total_lessons_enrolled: number;
    completed_lessons: number;
    completion_percentage: string;
    total_time_minutes: number;
    hours_since_last_activity: number;
    has_support_conversation: boolean;
    crm_interactions: number;
    test_taken: boolean;
    license_activated: boolean;
  };
}

interface AILeadScoringResult {
  leads: LeadScore[];
  total_analyzed: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
}

const AILeadScoring: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('7');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AILeadScoringResult | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error fetching courses:', error);
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'خطا در دریافت دوره‌ها'
      });
      return;
    }

    setCourses(data || []);
  };

  const handleAnalyze = async () => {
    if (!selectedCourse) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'لطفاً یک دوره انتخاب کنید'
      });
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setProgress({ current: 0, total: 0, percentage: 0 });

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();

      const batchSize = 20;
      let offset = 0;
      let hasMore = true;
      let allLeads: LeadScore[] = [];
      let totalCount = 0;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('ai-lead-scoring', {
          body: {
            courseId: selectedCourse,
            startDate,
            endDate,
            batchSize,
            offset
          }
        });

        if (error) throw error;

        if (data.error) {
          toast({
            variant: 'destructive',
            title: 'خطا',
            description: data.error
          });
          setIsAnalyzing(false);
          return;
        }

        allLeads = [...allLeads, ...(data.leads || [])];
        totalCount = data.totalCount || 0;
        hasMore = data.hasMore || false;
        offset = data.nextOffset || offset + batchSize;

        // Update progress
        const currentProgress = {
          current: allLeads.length,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((allLeads.length / totalCount) * 100) : 0
        };
        setProgress(currentProgress);

        // Show intermediate results
        const intermediateStats = {
          leads: allLeads,
          total_analyzed: allLeads.length,
          hot_leads: allLeads.filter(l => l.status === 'HOT').length,
          warm_leads: allLeads.filter(l => l.status === 'WARM').length,
          cold_leads: allLeads.filter(l => l.status === 'COLD').length,
        };
        setResults(intermediateStats);
      }

      toast({
        title: 'تحلیل کامل شد',
        description: `${allLeads.length} لید تحلیل شد`
      });
    } catch (error: any) {
      console.error('Error analyzing leads:', error);
      toast({
        variant: 'destructive',
        title: 'خطا در تحلیل',
        description: error.message || 'خطا در تحلیل لیدها. لطفاً دوباره تلاش کنید.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToCSV = () => {
    if (!results || results.leads.length === 0) return;

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
      'آزمون داده شده',
      'لایسنس فعال',
      'دلیل امتیازدهی'
    ];

    const csvData = results.leads.map(lead => [
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
      lead.metrics.test_taken ? 'بله' : 'خیر',
      lead.metrics.license_activated ? 'بله' : 'خیر',
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">امتیازدهی هوشمند لیدها با AI</CardTitle>
              <CardDescription>
                تحلیل رفتار کاربران و رتبه‌بندی لیدها بر اساس میزان تعامل، فعالیت اخیر و پیشرفت یادگیری
                <br />
                <span className="text-xs text-muted-foreground">تمامی لیدها در دسته‌های 20 تایی تحلیل می‌شوند</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            تنظیمات تحلیل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !selectedCourse}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال تحلیل با AI...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 ml-2" />
                    تحلیل با AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {isAnalyzing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>در حال پردازش...</span>
                <span>{progress.current} از {progress.total} ({progress.percentage}%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{results.total_analyzed}</p>
                  <p className="text-sm text-muted-foreground">کل لیدهای تحلیل شده</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Flame className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold text-red-500">{results.hot_leads}</p>
                  <p className="text-sm text-muted-foreground">لیدهای داغ (75-100)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <ThermometerSun className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-500">{results.warm_leads}</p>
                  <p className="text-sm text-muted-foreground">لیدهای گرم (50-74)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Snowflake className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">{results.cold_leads}</p>
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
                    {results.leads.map(lead => (
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <Badge variant="outline">
                                    {lead.metrics.has_support_conversation ? '✓' : '✗'} پشتیبانی
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.test_taken ? '✓' : '✗'} آزمون
                                  </Badge>
                                  <Badge variant="outline">
                                    {lead.metrics.license_activated ? '✓' : '✗'} لایسنس
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

export default AILeadScoring;

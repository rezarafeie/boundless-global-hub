import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns-jalali';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Star, RefreshCw, Zap, Target, Lightbulb } from 'lucide-react';

interface AIAnalysis {
  id: string;
  user_id: number | null;
  analysis_date: string;
  accuracy_score: number | null;
  highlights: string[] | null;
  anomalies: string[] | null;
  suggestions: string[] | null;
  motivation: string | null;
  raw_analysis: string | null;
  platform_metrics: any;
  created_at: string;
  user?: {
    name: string;
  };
}

const AIReportAnalysis = () => {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('report_ai_analysis')
        .select('*')
        .gte('analysis_date', sevenDaysAgo)
        .order('analysis_date', { ascending: false });

      if (error) throw error;

      // Fetch user info
      const userIds = [...new Set(data?.filter(a => a.user_id).map(a => a.user_id) || [])];
      const { data: users } = await supabase
        .from('chat_users')
        .select('id, name')
        .in('id', userIds as number[]);

      const analysesWithUsers = data?.map(analysis => ({
        ...analysis,
        user: users?.find(u => u.id === analysis.user_id)
      })) || [];

      setAnalyses(analysesWithUsers);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('خطا در دریافت تحلیل‌ها');
    } finally {
      setLoading(false);
    }
  };

  const runManualAnalysis = async () => {
    setRunningAnalysis(true);
    try {
      const response = await supabase.functions.invoke('analyze-daily-reports', {
        body: { date: new Date().toISOString().split('T')[0] }
      });

      if (response.error) throw response.error;
      
      toast.success('تحلیل با موفقیت انجام شد');
      fetchAnalyses();
    } catch (error: any) {
      console.error('Error running analysis:', error);
      toast.error(error.message || 'خطا در اجرای تحلیل');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const getAccuracyColor = (score: number | null) => {
    if (!score) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAccuracyLabel = (score: number | null) => {
    if (!score) return 'نامشخص';
    if (score >= 80) return 'عالی';
    if (score >= 60) return 'متوسط';
    return 'نیاز به بهبود';
  };

  // Group analyses by date
  const groupedAnalyses = analyses.reduce((acc, analysis) => {
    const date = analysis.analysis_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(analysis);
    return acc;
  }, {} as Record<string, AIAnalysis[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">تحلیل هوش مصنوعی</h3>
                <p className="text-sm text-muted-foreground">تحلیل خودکار گزارشات روزانه</p>
              </div>
            </div>
            <Button 
              onClick={runManualAnalysis} 
              disabled={runningAnalysis}
              className="gap-2"
            >
              {runningAnalysis ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              اجرای تحلیل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">میانگین دقت</p>
                  <p className="text-2xl font-bold">
                    {Math.round(analyses.reduce((sum, a) => sum + (a.accuracy_score || 0), 0) / analyses.filter(a => a.accuracy_score).length) || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">تحلیل‌های انجام شده</p>
                  <p className="text-2xl font-bold">{analyses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">بالاترین دقت</p>
                  <p className="text-2xl font-bold">
                    {Math.max(...analyses.map(a => a.accuracy_score || 0))}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analyses by Date */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            در حال بارگذاری...
          </CardContent>
        </Card>
      ) : Object.keys(groupedAnalyses).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>تحلیلی یافت نشد</p>
            <p className="text-sm mt-2">روی دکمه "اجرای تحلیل" کلیک کنید</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedAnalyses).map(([date, dateAnalyses]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{format(new Date(date), 'EEEE، yyyy/MM/dd')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dateAnalyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">
                        {analysis.user?.name || 'تحلیل کلی'}
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <div className={`w-2 h-2 rounded-full ${getAccuracyColor(analysis.accuracy_score)}`} />
                        {getAccuracyLabel(analysis.accuracy_score)}
                      </Badge>
                    </div>
                    {analysis.accuracy_score !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{analysis.accuracy_score}%</p>
                        <p className="text-xs text-muted-foreground">دقت گزارش</p>
                      </div>
                    )}
                  </div>

                  {analysis.accuracy_score !== null && (
                    <Progress value={analysis.accuracy_score} className="h-2" />
                  )}

                  {/* Highlights */}
                  {analysis.highlights && analysis.highlights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        نقاط قوت
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mr-6">
                        {analysis.highlights.map((h, i) => (
                          <li key={i}>• {h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Anomalies */}
                  {analysis.anomalies && analysis.anomalies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        موارد قابل توجه
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mr-6">
                        {analysis.anomalies.map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2 text-blue-600">
                        <Lightbulb className="w-4 h-4" />
                        پیشنهادات
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mr-6">
                        {analysis.suggestions.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Motivation */}
                  {analysis.motivation && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm">{analysis.motivation}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default AIReportAnalysis;

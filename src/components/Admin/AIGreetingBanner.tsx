import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AIAnalysis {
  greeting: string;
  summary: string;
  highlights: string[];
  warnings: string[];
  suggestions: string[];
  motivation: string;
}

interface AIGreetingBannerProps {
  onRefresh?: () => void;
  mode?: 'admin' | 'agent';
}

const CACHE_DURATION_HOURS = 6;

const AIGreetingBanner: React.FC<AIGreetingBannerProps> = ({ onRefresh, mode = 'admin' }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getAdminName = () => {
    if (user?.messengerData?.name) return user.messengerData.name;
    if (user?.academyData) {
      return `${user.academyData.first_name} ${user.academyData.last_name}`;
    }
    return 'مدیر';
  };

  const loadCachedAnalysis = useCallback(async () => {
    try {
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - CACHE_DURATION_HOURS);

      const { data, error } = await supabase
        .from('ai_admin_reports')
        .select('*')
        .eq('view_mode', viewMode)
        .gte('created_at', sixHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        analysis: {
          greeting: data.greeting || '',
          summary: data.summary || '',
          highlights: data.highlights || [],
          warnings: data.warnings || [],
          suggestions: data.suggestions || [],
          motivation: data.motivation || ''
        },
        createdAt: new Date(data.created_at)
      };
    } catch {
      return null;
    }
  }, [viewMode]);

  const runAnalysis = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = await loadCachedAnalysis();
        if (cached) {
          setAnalysis(cached.analysis);
          setLastUpdated(cached.createdAt);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-admin-greeting', {
        body: { 
          adminName: getAdminName(),
          viewMode,
          mode
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast({
        title: "خطا",
        description: "خطا در اجرای تحلیل هوشمند",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [viewMode, mode, toast, loadCachedAnalysis]);

  useEffect(() => {
    runAnalysis(false);
  }, []);

  useEffect(() => {
    runAnalysis(false);
  }, [viewMode]);

  const handleRefresh = () => {
    runAnalysis(true);
    onRefresh?.();
  };

  const handleExport = () => {
    if (!analysis) return;
    
    const content = `
گزارش هوشمند آکادمی
تاریخ: ${new Date().toLocaleDateString('fa-IR')}
بازه: ${viewMode === 'daily' ? 'روزانه' : viewMode === 'weekly' ? 'هفتگی' : 'ماهانه'}

${analysis.greeting}

خلاصه:
${analysis.summary}

نقاط قوت:
${analysis.highlights.map(h => `• ${h}`).join('\n')}

هشدارها:
${analysis.warnings.length > 0 ? analysis.warnings.map(w => `• ${w}`).join('\n') : 'بدون هشدار'}

پیشنهادها:
${analysis.suggestions.map(s => `• ${s}`).join('\n')}

${analysis.motivation}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `گزارش-هوشمند-${new Date().toLocaleDateString('fa-IR')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">تحلیل هوشمند</h3>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                ({formatTimeAgo(lastUpdated)})
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-md p-0.5 text-xs">
              {(['daily', 'weekly', 'monthly'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-2 py-1 rounded transition-colors ${
                    viewMode === m 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'daily' ? 'روزانه' : m === 'weekly' ? 'هفتگی' : 'ماهانه'}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExport}
                disabled={!analysis}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={loading}
                title="تحلیل مجدد"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 py-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">در حال تحلیل...</span>
          </div>
        )}

        {/* Content */}
        {!loading && analysis && (
          <div className="space-y-3">
            <p className="text-sm sm:text-base font-medium">{analysis.greeting}</p>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>

            {/* Expanded Content */}
            {expanded && (
              <div className="space-y-3 pt-3 border-t border-border/50">
                {/* Highlights */}
                {analysis.highlights.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3.5 w-3.5" />
                      نقاط قوت
                    </div>
                    <div className="space-y-1">
                      {analysis.highlights.map((highlight, index) => (
                        <p key={index} className="text-sm text-muted-foreground pr-4">• {highlight}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      هشدارها
                    </div>
                    <div className="space-y-1">
                      {analysis.warnings.map((warning, index) => (
                        <p key={index} className="text-sm text-muted-foreground pr-4">• {warning}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                      <Lightbulb className="h-3.5 w-3.5" />
                      پیشنهادها
                    </div>
                    <div className="space-y-1">
                      {analysis.suggestions.map((suggestion, index) => (
                        <p key={index} className="text-sm text-muted-foreground pr-4">• {suggestion}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Motivation */}
                {analysis.motivation && (
                  <p className="text-sm text-center text-muted-foreground pt-2 border-t border-border/50">
                    {analysis.motivation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !analysis && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>روی دکمه رفرش کلیک کنید</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIGreetingBanner;

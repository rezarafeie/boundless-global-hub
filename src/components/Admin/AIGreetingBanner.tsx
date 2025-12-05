import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Download,
  Clock
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
}

const AIGreetingBanner: React.FC<AIGreetingBannerProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getAdminName = () => {
    if (user?.messengerData?.name) return user.messengerData.name;
    if (user?.academyData) {
      return `${user.academyData.first_name} ${user.academyData.last_name}`;
    }
    return 'مدیر';
  };

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setIsTyping(false);
    setDisplayedText('');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-admin-greeting', {
        body: { 
          adminName: getAdminName(),
          viewMode 
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        setLastUpdated(new Date());
        // Start typing effect for greeting
        typeText(data.analysis.greeting);
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
  }, [viewMode, toast]);

  const typeText = (text: string) => {
    setIsTyping(true);
    setDisplayedText('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {
    if (viewMode) {
      runAnalysis();
    }
  }, [viewMode]);

  const handleExport = () => {
    if (!analysis) return;
    
    const content = `
گزارش هوشمند آکادمی
تاریخ: ${lastUpdated?.toLocaleDateString('fa-IR')}
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

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 animate-pulse pointer-events-none" />
      
      <CardContent className="p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">تحلیل هوشمند</h3>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === mode 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted-foreground/10'
                  }`}
                >
                  {mode === 'daily' ? 'روزانه' : mode === 'weekly' ? 'هفتگی' : 'ماهانه'}
                </button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!analysis}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                runAnalysis();
                onRefresh?.();
              }}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحلیل مجدد
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-muted-foreground">در حال تحلیل داده‌ها...</span>
          </div>
        )}

        {/* Greeting with typing effect */}
        {!loading && analysis && (
          <div className="space-y-4">
            <div className="text-xl font-medium text-foreground leading-relaxed">
              {displayedText}
              {isTyping && <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-1" />}
            </div>
            
            {!isTyping && (
              <p className="text-muted-foreground">{analysis.summary}</p>
            )}

            {/* Expanded Content */}
            {expanded && !isTyping && (
              <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Highlights */}
                {analysis.highlights.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <TrendingUp className="h-4 w-4" />
                      نقاط قوت
                    </div>
                    <div className="grid gap-2">
                      {analysis.highlights.map((highlight, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg text-sm"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <span className="text-green-600 dark:text-green-400">✓</span>
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      هشدارها
                    </div>
                    <div className="grid gap-2">
                      {analysis.warnings.map((warning, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-sm"
                        >
                          <span className="text-amber-600 dark:text-amber-400">⚠</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      <Lightbulb className="h-4 w-4" />
                      پیشنهادها
                    </div>
                    <div className="grid gap-2">
                      {analysis.suggestions.map((suggestion, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg text-sm"
                        >
                          <span className="text-blue-600 dark:text-blue-400">💡</span>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Motivation */}
                {analysis.motivation && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg text-center">
                    <p className="text-lg font-medium">{analysis.motivation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !analysis && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>روی "تحلیل مجدد" کلیک کنید</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIGreetingBanner;

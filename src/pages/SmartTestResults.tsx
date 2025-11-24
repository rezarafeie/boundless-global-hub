import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  full_name: string;
  recommended_course_title: string;
  recommended_course_slug: string;
  ai_analysis: {
    personality_analysis: string;
    course_justification: string;
    next_action: string;
    score: number;
  };
  education_budget: number;
}

const SmartTestResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = searchParams.get('token');

  useEffect(() => {
    const fetchResults = async () => {
      if (!token) {
        toast.error('لینک نتایج معتبر نیست. لطفا ابتدا تست را تکمیل کنید.');
        setTimeout(() => navigate('/smart-test'), 2000);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('smart_test_submissions')
          .select('*')
          .eq('result_token', token)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast.error('نتیجه‌ای با این لینک یافت نشد. لطفا دوباره تست را انجام دهید.');
          setTimeout(() => navigate('/smart-test'), 2000);
          return;
        }
        
        // Parse the ai_analysis if it's a string
        if (data && typeof data.ai_analysis === 'string') {
          data.ai_analysis = JSON.parse(data.ai_analysis);
        }
        
        setResult(data as any);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('خطا در دریافت نتایج. لطفا دوباره تلاش کنید.');
        setTimeout(() => navigate('/smart-test'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [token, navigate]);

  const handleEnroll = () => {
    if (result?.recommended_course_slug) {
      // Check budget and redirect accordingly
      if (result.education_budget && result.education_budget < 100000) {
        toast.info('با تیم ما تماس بگیرید برای شرایط ویژه');
      }
      navigate(`/courses/${result.recommended_course_slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">در حال تحلیل نتایج...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">تحلیل شخصی شما آماده شد!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            سلام {result.full_name}! 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            این مسیر پیشنهادی من برای شماست
          </p>
        </motion.div>

        {/* Score Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Card className="inline-flex items-center gap-3 px-8 py-6 bg-gradient-to-r from-primary to-primary/80 border-none">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-foreground">
                {result.ai_analysis.score}%
              </div>
              <div className="text-sm text-primary-foreground/80 mt-1">
                احتمال موفقیت شما
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Personality Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-8 bg-card border-border">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  🧠 شخصیت و مسیر شما
                </h2>
                <p className="text-muted-foreground">تحلیل عمیق از وضعیت و پتانسیل شما</p>
              </div>
            </div>
            <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {result.ai_analysis.personality_analysis}
            </div>
          </Card>
        </motion.div>

        {/* Recommended Course */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary rounded-full">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  📚 برنامه پیشنهادی
                </h2>
                <p className="text-xl font-semibold text-primary">
                  {result.recommended_course_title}
                </p>
              </div>
            </div>
            <div className="prose prose-lg max-w-none text-foreground leading-relaxed mb-6 whitespace-pre-wrap">
              {result.ai_analysis.course_justification}
            </div>
            <Button
              onClick={handleEnroll}
              size="lg"
              className="w-full text-lg py-6"
            >
              مشاهده و ثبت‌نام در دوره
              <ArrowRight className="mr-2" />
            </Button>
          </Card>
        </motion.div>

        {/* Next Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-8 bg-card border-border">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  ✅ قدم بعدی شما
                </h2>
                <p className="text-muted-foreground">از همین الان شروع کن</p>
              </div>
            </div>
            <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {result.ai_analysis.next_action}
            </div>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-4 pt-8"
        >
          <p className="text-lg text-muted-foreground">
            آماده‌ای برای شروع این مسیر؟
          </p>
          <Button
            onClick={handleEnroll}
            size="lg"
            className="text-lg px-12 py-6"
          >
            بریم شروع کنیم! 🚀
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SmartTestResults;
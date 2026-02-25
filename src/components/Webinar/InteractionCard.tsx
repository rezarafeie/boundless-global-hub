import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractionCardProps {
  interaction: any;
  participantId: string | undefined;
  responses: any[];
  isActive: boolean;
}

const InteractionCard: React.FC<InteractionCardProps> = ({
  interaction,
  participantId,
  responses,
  isActive,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [timerLeft, setTimerLeft] = useState<number | null>(null);

  const myResponse = responses.find(r => r.participant_id === participantId && r.interaction_id === interaction.id);
  const allResponses = responses.filter(r => r.interaction_id === interaction.id);
  const hasAnswered = !!myResponse;
  const isEnded = interaction.status === 'ended';
  const settings = interaction.settings || {};
  const options = interaction.options || [];

  // Timer for quizzes
  useEffect(() => {
    if (interaction.type === 'quiz' && isActive && settings.timer_duration && interaction.activated_at && !hasAnswered) {
      const endTime = new Date(interaction.activated_at).getTime() + (settings.timer_duration * 1000);
      const interval = setInterval(() => {
        const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setTimerLeft(left);
        if (left === 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [interaction, isActive, hasAnswered, settings.timer_duration]);

  const submitResponse = async (answer: any) => {
    if (!participantId || hasAnswered || submitting) return;
    if (isEnded && !settings.allow_late) return;

    setSubmitting(true);
    try {
      let isCorrect: boolean | null = null;
      let points = 0;

      if (interaction.type === 'quiz' && answer.option_id) {
        const correctOpt = options.find((o: any) => o.is_correct);
        isCorrect = correctOpt?.id === answer.option_id;
        if (isCorrect && settings.points_enabled) points = 10;
      }

      const { error } = await supabase.from('webinar_responses').insert({
        interaction_id: interaction.id,
        participant_id: participantId,
        answer,
        is_correct: isCorrect,
        points,
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'فقط یک بار می‌تونی رأی بدی', variant: 'default' });
        } else throw error;
      } else {
        toast({ title: 'رأی شما ثبت شد ✅' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'خطا در ثبت پاسخ', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionVoteCount = (optionId: string) => allResponses.filter(r => r.answer?.option_id === optionId).length;
  const totalVotes = allResponses.length;
  const showResults = hasAnswered || isEnded || settings.show_results_immediately;

  // Render based on type
  const renderContent = () => {
    switch (interaction.type) {
      case 'poll':
      case 'quiz':
        return (
          <div className="space-y-3">
            {interaction.question && (
              <p className="text-base font-medium text-foreground leading-relaxed">{interaction.question}</p>
            )}
            {interaction.type === 'quiz' && timerLeft !== null && !hasAnswered && isActive && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                <span>{timerLeft} ثانیه باقی‌مانده</span>
              </div>
            )}
            <div className="space-y-2">
              {options.map((opt: any) => {
                const count = getOptionVoteCount(opt.id);
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isSelected = myResponse?.answer?.option_id === opt.id;
                const isCorrectOpt = interaction.type === 'quiz' && opt.is_correct;

                if (hasAnswered || (isEnded && !settings.allow_late)) {
                  return (
                    <div key={opt.id} className="relative overflow-hidden rounded-lg border p-3">
                      {showResults && (
                        <div
                          className={`absolute inset-0 opacity-15 ${isCorrectOpt ? 'bg-green-500' : isSelected && !myResponse?.is_correct ? 'bg-red-400' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
                          {opt.text} {isSelected && '✓'}
                          {interaction.type === 'quiz' && isCorrectOpt && showResults && ' ✅'}
                        </span>
                        {showResults && <span className="text-xs text-muted-foreground">{pct}%</span>}
                      </div>
                    </div>
                  );
                }

                return (
                  <Button
                    key={opt.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-right"
                    disabled={submitting || timerLeft === 0}
                    onClick={() => submitResponse({ option_id: opt.id })}
                  >
                    {opt.text}
                  </Button>
                );
              })}
            </div>
            {interaction.type === 'quiz' && hasAnswered && (
              <div className={`p-3 rounded-lg text-sm ${myResponse?.is_correct ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                {myResponse?.is_correct ? 'آفرین! پاسخ شما صحیح بود ✅' : 'پاسخ اشتباه بود'}
                {settings.explanation && <p className="mt-1 opacity-80">{settings.explanation}</p>}
                {settings.points_enabled && <p className="mt-1">امتیاز شما: {myResponse?.points || 0}</p>}
              </div>
            )}
          </div>
        );

      case 'checkin':
        if (hasAnswered) {
          return <p className="text-center text-sm text-green-600">✅ حضور شما ثبت شد</p>;
        }
        if (settings.scale_max) {
          return (
            <div className="space-y-3">
              <p className="text-sm text-foreground">{interaction.question}</p>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: settings.scale_max }, (_, i) => i + 1).map(v => (
                  <Button key={v} variant="outline" size="sm" onClick={() => submitResponse({ scale_value: v })} disabled={submitting}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="text-center space-y-3">
            <p className="text-sm text-foreground">{interaction.question || 'هنوز همراهی؟'}</p>
            <Button onClick={() => submitResponse({ clicked: true })} disabled={submitting} className="px-8">
              بله، هستم! ✋
            </Button>
          </div>
        );

      case 'task':
        if (hasAnswered) {
          return <p className="text-center text-sm text-green-600">✅ ثبت شد</p>;
        }
        return (
          <div className="space-y-3">
            <p className="text-sm text-foreground">{interaction.question}</p>
            <Input
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              placeholder="پاسخ شما..."
              maxLength={settings.char_limit || 200}
              dir="rtl"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {textAnswer.length}/{settings.char_limit || 200}
              </span>
              <Button size="sm" onClick={() => submitResponse({ text: textAnswer })} disabled={submitting || !textAnswer.trim()}>
                ارسال
              </Button>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-3 text-center">
            {settings.cta_description && <p className="text-sm text-foreground">{settings.cta_description}</p>}
            <Button
              className="px-8"
              onClick={() => {
                if (settings.link_url) window.open(settings.link_url, '_blank');
                if (!hasAnswered) submitResponse({ clicked: true });
              }}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              {settings.button_label || 'مشاهده'}
            </Button>
            {hasAnswered && <p className="text-xs text-green-600">باز شد ✅</p>}
            {showResults && totalVotes > 0 && (
              <p className="text-xs text-muted-foreground">{totalVotes} نفر کلیک کردند</p>
            )}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">نوع تعامل پشتیبانی نمی‌شود</p>;
    }
  };

  const typeLabels: Record<string, string> = {
    poll: '📊 نظرسنجی',
    quiz: '🧠 کوییز',
    checkin: '✋ حضور',
    task: '📝 تکلیف',
    cta: '🔗 لینک',
    reaction: '⚡ واکنش',
    qa: '❓ پرسش و پاسخ',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border ${isActive ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border'}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                {typeLabels[interaction.type] || interaction.type}
              </Badge>
              {isActive && <Badge variant="outline" className="text-xs text-green-600 border-green-300">فعال</Badge>}
              {isEnded && <Badge variant="outline" className="text-xs">پایان‌یافته</Badge>}
            </div>
            <span className="text-xs text-muted-foreground">{interaction.title}</span>
          </div>
          {renderContent()}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InteractionCard;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Pin, Check, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QAPanelProps {
  webinarId: string;
  participantId: string | undefined;
  questions: any[];
  isHost?: boolean;
}

const QAPanel: React.FC<QAPanelProps> = ({ webinarId, participantId, questions, isHost }) => {
  const { toast } = useToast();
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === 'popular') return b.upvotes - a.upvotes;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const submitQuestion = async () => {
    if (!participantId || !newQuestion.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('webinar_questions').insert({
        webinar_id: webinarId,
        participant_id: participantId,
        question_text: newQuestion.trim(),
      });
      if (error) throw error;
      setNewQuestion('');
      toast({ title: 'سوال شما ارسال شد ✅' });
    } catch (e) {
      console.error(e);
      toast({ title: 'خطا در ارسال سوال', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const upvoteQuestion = async (questionId: string) => {
    if (!participantId || upvotedIds.has(questionId)) return;
    
    const { error } = await supabase.from('webinar_question_upvotes').insert({
      question_id: questionId,
      participant_id: participantId,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'قبلاً رأی داده‌اید' });
      }
      return;
    }

    // Update upvote count
    await supabase.from('webinar_questions').update({
      upvotes: questions.find(q => q.id === questionId)!.upvotes + 1,
    }).eq('id', questionId);

    setUpvotedIds(prev => new Set([...prev, questionId]));
  };

  const togglePin = async (questionId: string, isPinned: boolean) => {
    await supabase.from('webinar_questions').update({ is_pinned: !isPinned }).eq('id', questionId);
  };

  const markAnswered = async (questionId: string) => {
    await supabase.from('webinar_questions').update({ is_answered: true }).eq('id', questionId);
  };

  const hideQuestion = async (questionId: string) => {
    await supabase.from('webinar_questions').update({ is_hidden: true }).eq('id', questionId);
  };

  return (
    <div className="space-y-4">
      {/* Submit question */}
      <div className="flex gap-2">
        <Input
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          placeholder="سوالت رو بنویس… ❤️"
          dir="rtl"
          maxLength={500}
          onKeyDown={e => e.key === 'Enter' && submitQuestion()}
        />
        <Button size="icon" onClick={submitQuestion} disabled={submitting || !newQuestion.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        <Button variant={sortBy === 'popular' ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('popular')}>
          محبوب‌ترین
        </Button>
        <Button variant={sortBy === 'recent' ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('recent')}>
          جدیدترین
        </Button>
      </div>

      {/* Questions list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sortedQuestions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            هنوز سوالی ارسال نشده...
          </p>
        ) : (
          sortedQuestions.map(q => (
            <div
              key={q.id}
              className={`p-3 rounded-lg border ${q.is_pinned ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-900/10' : 'border-border'} ${q.is_answered ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {q.is_pinned && <Badge variant="outline" className="text-[10px]">📌 سنجاق‌شده</Badge>}
                    {q.is_answered && <Badge variant="outline" className="text-[10px] text-green-600">✅ پاسخ داده شده</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => upvoteQuestion(q.id)}
                    disabled={upvotedIds.has(q.id)}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${upvotedIds.has(q.id) ? 'text-primary fill-primary' : ''}`} />
                    <span className="text-xs mr-1">{q.upvotes}</span>
                  </Button>
                  {isHost && (
                    <>
                      <Button variant="ghost" size="sm" className="h-8 px-1.5" onClick={() => togglePin(q.id, q.is_pinned)}>
                        <Pin className={`h-3.5 w-3.5 ${q.is_pinned ? 'text-amber-500' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-1.5" onClick={() => markAnswered(q.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QAPanel;

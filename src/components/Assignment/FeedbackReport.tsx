import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import type { AIFeedback } from '@/types/assignment';

export const FeedbackReport: React.FC<{ feedback: AIFeedback; adminFeedback?: string | null }> = ({
  feedback,
  adminFeedback,
}) => {
  return (
    <div className="space-y-3">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">بازخورد هوشمند</span>
            </div>
            {typeof feedback.score === 'number' && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                امتیاز: {feedback.score}
              </Badge>
            )}
          </div>

          {feedback.summary && (
            <p className="text-sm leading-7 text-foreground">{feedback.summary}</p>
          )}

          {feedback.strengths && feedback.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" /> نقاط قوت
              </div>
              <ul className="space-y-1 pr-6 list-disc text-sm">
                {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" /> نقاط قابل بهبود
              </div>
              <ul className="space-y-1 pr-6 list-disc text-sm">
                {feedback.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {feedback.next_steps && feedback.next_steps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
                <ArrowLeft className="h-4 w-4" /> قدم بعدی
              </div>
              <ul className="space-y-1 pr-6 list-disc text-sm">
                {feedback.next_steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {adminFeedback && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">بازخورد کوچ</div>
            <p className="text-sm leading-7 whitespace-pre-wrap">{adminFeedback}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

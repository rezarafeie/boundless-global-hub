import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { MarkdownLite } from '@/lib/markdownLite';
import type { AIFeedback } from '@/types/assignment';

// Recover a proper AIFeedback object if the DB row stored a JSON string
// (or the summary contains an embedded JSON blob) instead of a real object.
function normalizeFeedback(raw: any): AIFeedback {
  if (!raw) return {};
  let fb: any = raw;
  if (typeof fb === 'string') {
    const cleaned = fb.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { fb = JSON.parse(cleaned); }
    catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) { try { fb = JSON.parse(m[0]); } catch { fb = { summary: cleaned }; } }
      else fb = { summary: cleaned };
    }
  }
  if (typeof fb.summary === 'string' && fb.summary.includes('"score"') && fb.summary.includes('{')) {
    const m = fb.summary.match(/\{[\s\S]*\}/);
    if (m) { try { fb = { ...fb, ...JSON.parse(m[0]) }; } catch { /* ignore */ } }
  }
  for (const k of ['strengths', 'weaknesses', 'next_steps'] as const) {
    if (fb[k] && !Array.isArray(fb[k])) fb[k] = [String(fb[k])];
  }
  return fb as AIFeedback;
}

export const FeedbackReport: React.FC<{ feedback: AIFeedback; adminFeedback?: string | null }> = ({
  feedback: rawFeedback,
  adminFeedback,
}) => {
  const feedback = normalizeFeedback(rawFeedback);
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
            <MarkdownLite text={feedback.summary} className="text-sm leading-7 text-foreground" />
          )}

          {feedback.strengths && feedback.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" /> نقاط قوت
              </div>
              <ul className="space-y-1 pr-6 list-disc text-sm">
                {feedback.strengths.map((s, i) => <li key={i}><MarkdownLite text={String(s)} /></li>)}
              </ul>
            </div>
          )}

          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" /> نقاط قابل بهبود
              </div>
              <ul className="space-y-1 pr-6 list-disc text-sm">
                {feedback.weaknesses.map((s, i) => <li key={i}><MarkdownLite text={String(s)} /></li>)}
              </ul>
            </div>
          )}

          {feedback.next_steps && feedback.next_steps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
                <ArrowLeft className="h-4 w-4" /> قدم بعدی
              </div>
              <ul className="space-y-1 pr-6 list-disc text-sm">
                {feedback.next_steps.map((s, i) => <li key={i}><MarkdownLite text={String(s)} /></li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {adminFeedback && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">بازخورد کوچ</div>
            <MarkdownLite text={adminFeedback} className="text-sm leading-7" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

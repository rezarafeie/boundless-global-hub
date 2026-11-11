import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Sparkles, ThumbsUp, AlertTriangle, Lightbulb, CalendarClock, Headset, User } from 'lucide-react';

export type Segment = { speaker: 'agent' | 'customer'; text: string };

/** Parses "فروشنده: …" / "مشتری: …" lines (used while text is still streaming). */
export function parseSpeakerLines(text: string): Segment[] {
  const out: Segment[] = [];
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^(فروشنده|مشتری)\s*[:：]\s*(.*)$/);
    if (m) out.push({ speaker: m[1] === 'فروشنده' ? 'agent' : 'customer', text: m[2] });
    else if (line.trim() && out.length) out[out.length - 1].text += ' ' + line.trim();
  }
  return out;
}

export const ConversationBubbles: React.FC<{ segments: Segment[] }> = ({ segments }) => (
  <div className="space-y-3">
    {segments.map((s, i) => {
      const agent = s.speaker === 'agent';
      return (
        <div key={i} className={`flex gap-2 ${agent ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${agent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {agent ? <Headset className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </div>
          <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${agent ? 'bg-primary/10 rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
            <div className="text-[11px] text-muted-foreground mb-0.5">{agent ? 'فروشنده' : 'مشتری'}</div>
            <p className="text-sm leading-7">{s.text}</p>
          </div>
        </div>
      );
    })}
  </div>
);

const List: React.FC<{ icon: React.ReactNode; title: string; items?: string[] }> = ({ icon, title, items }) =>
  items?.filter(Boolean).length ? (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-sm font-medium mb-2">{icon}{title}</div>
      <ul className="list-disc pr-5 text-sm space-y-1 leading-7">{items.filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  ) : null;

const SENTIMENT: Record<string, string> = { positive: 'مثبت', neutral: 'خنثی', negative: 'منفی', mixed: 'متفاوت' };
const SCORES: [string, string][] = [
  ['opening_score', 'شروع'], ['discovery_score', 'نیازسنجی'], ['explanation_score', 'توضیح'],
  ['objection_handling_score', 'پاسخ به اعتراض'], ['closing_score', 'جمع‌بندی'],
];

export const CallInsights: React.FC<{ ai: any }> = ({ ai }) => {
  const r = ai.raw_ai_response ?? {};
  const improvements: any[] = Array.isArray(r.improvements) ? r.improvements : [];
  const followups: any[] = Array.isArray(r.follow_up_suggestions) ? r.follow_up_suggestions : [];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> تحلیل هوشمند تماس</CardTitle>
        <CardDescription>تولیدشده توسط هوش مصنوعی بر اساس همین مکالمه؛ ممکن است دقیق نباشد.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ai.overall_sales_score != null && <Badge variant="secondary">امتیاز کلی فروشنده: {ai.overall_sales_score}</Badge>}
          {ai.purchase_intent_score != null && <Badge className="gap-1"><Flame className="h-3 w-3" /> قصد خرید: {ai.purchase_intent_score}</Badge>}
          {ai.sentiment && <Badge variant="outline">حس مشتری: {SENTIMENT[ai.sentiment] ?? ai.sentiment}</Badge>}
        </div>
        {ai.summary && <p className="text-sm leading-7">{ai.summary}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SCORES.filter(([k]) => ai[k] != null).map(([k, label]) => (
            <div key={k} className="rounded-lg border p-2 text-center">
              <div className="text-[11px] text-muted-foreground">{label}</div>
              <div className="text-lg font-semibold">{ai[k]}</div>
              <div className="h-1 rounded bg-muted mt-1 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${ai[k]}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <List icon={<ThumbsUp className="h-4 w-4 text-primary" />} title="نقاط قوت" items={r.strengths} />
          <List icon={<AlertTriangle className="h-4 w-4 text-destructive" />} title="نقاط ضعف" items={r.weaknesses} />
          <List icon={<User className="h-4 w-4" />} title="نیازهای مشتری" items={ai.customer_needs} />
          <List icon={<AlertTriangle className="h-4 w-4" />} title="اعتراض‌ها و موانع" items={ai.objections} />
        </div>

        {!!improvements.length && (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-medium"><Lightbulb className="h-4 w-4 text-primary" />پیشنهاد بهبود مکالمه</div>
            {improvements.map((it, i) => (
              <div key={i} className="space-y-1 text-sm">
                {it.quote && <p className="text-muted-foreground line-through decoration-destructive/50">«{it.quote}»</p>}
                {it.better && <p className="font-medium">«{it.better}»</p>}
                {it.why && <p className="text-xs text-muted-foreground leading-6">{it.why}</p>}
              </div>
            ))}
          </div>
        )}

        {(followups.length > 0 || ai.next_action) && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium"><CalendarClock className="h-4 w-4 text-primary" />پیشنهاد پیگیری</div>
            {ai.next_action && <p className="text-sm leading-7">{ai.next_action}</p>}
            {followups.map((f, i) => (
              <div key={i} className="text-sm bg-muted/50 rounded-md p-2 space-y-1">
                <div className="flex gap-2 flex-wrap">{f.when && <Badge variant="outline">{f.when}</Badge>}{f.channel && <Badge variant="secondary">{f.channel}</Badge>}</div>
                {f.message && <p className="leading-7">{f.message}</p>}
              </div>
            ))}
          </div>
        )}

        {ai.agent_feedback && (
          <div><div className="text-xs text-muted-foreground mb-1">بازخورد مربی‌گری</div>
            <p className="text-sm leading-7 whitespace-pre-wrap">{ai.agent_feedback}</p></div>
        )}
      </CardContent>
    </Card>
  );
};

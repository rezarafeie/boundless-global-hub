import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ClipboardList, Clock, Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { BlockRenderer } from './blocks';
import { FeedbackReport } from './FeedbackReport';
import { CTASection } from './CTASection';
import type { Assignment, AssignmentSubmission, SubmissionStatus } from '@/types/assignment';
import { STATUS_LABELS_FA } from '@/types/assignment';

interface Props {
  lessonId: string;
}

export const AssignmentSection: React.FC<Props> = ({ lessonId }) => {
  const { user, isAuthenticated } = useAuth();
  const studentId = user ? parseInt(user.id) : null;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: aData } = await supabase
      .from('assignments')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('status', 'published')
      .order('created_at');
    const list = (aData || []) as unknown as Assignment[];
    setAssignments(list);

    if (studentId && list.length > 0) {
      const ids = list.map((a) => a.id);
      const { data: sData } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId)
        .in('assignment_id', ids)
        .order('created_at', { ascending: false });
      const map: Record<string, AssignmentSubmission> = {};
      (sData || []).forEach((s) => {
        // keep the most recent per assignment (draft > latest)
        const sub = s as unknown as AssignmentSubmission;
        if (!map[sub.assignment_id] || sub.status === 'draft') {
          map[sub.assignment_id] = sub;
        }
      });
      setSubmissions(map);
    }
    setLoading(false);
  }, [lessonId, studentId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="px-4">
        <Card><CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری تمرین‌ها...
        </CardContent></Card>
      </div>
    );
  }

  if (assignments.length === 0) return null;

  if (!isAuthenticated) {
    return (
      <div className="px-4">
        <Card>
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            برای مشاهده و انجام تمرین این درس، وارد حساب کاربری شوید.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3">
      {assignments.map((a) => (
        <AssignmentCard
          key={a.id}
          assignment={a}
          submission={submissions[a.id]}
          studentId={studentId!}
          onSaved={load}
        />
      ))}
    </div>
  );
};

const AssignmentCard: React.FC<{
  assignment: Assignment;
  submission?: AssignmentSubmission;
  studentId: number;
  onSaved: () => void;
}> = ({ assignment, submission, studentId, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>(submission?.answers || {});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSubId, setCurrentSubId] = useState<string | undefined>(submission?.id);
  const status: SubmissionStatus | 'not_started' = submission?.status || 'not_started';
  const readonly = ['submitted', 'reviewed', 'completed'].includes(status);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAnswers(submission?.answers || {});
    setCurrentSubId(submission?.id);
  }, [submission?.id]);

  const upsertDraft = useCallback(async (nextAnswers: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (currentSubId) {
        await supabase.from('assignment_submissions').update({ answers: nextAnswers as any }).eq('id', currentSubId);
      } else {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({ assignment_id: assignment.id, student_id: studentId, answers: nextAnswers as any, status: "draft" } as any)
          .select()
          .single();
        if (!error && data) setCurrentSubId(data.id);
      }
    } finally {
      setSaving(false);
    }
  }, [currentSubId, assignment.id, studentId]);

  const handleChange = (blockId: string, value: unknown) => {
    const next = { ...answers, [blockId]: value };
    setAnswers(next);
    if (readonly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => upsertDraft(next), 800);
  };

  const handleSubmit = async () => {
    // required check
    for (const b of assignment.blocks) {
      if (b.required) {
        const v = answers[b.id];
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
          toast.error(`لطفاً «${b.label || 'همه‌ی فیلدها'}» را کامل کنید`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      let subId = currentSubId;
      if (!subId) {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({ assignment_id: assignment.id, student_id: studentId, answers: answers as any, status: 'submitted', submitted_at: new Date().toISOString() } as any)
          .select().single();
        if (error) throw error;
        subId = data.id;
      } else {
        const { error } = await supabase
          .from('assignment_submissions')
          .update({ answers: answers as any, status: 'submitted', submitted_at: new Date().toISOString() } as any)
          .eq('id', subId);
        if (error) throw error;
      }

      if (assignment.ai_feedback_enabled) {
        toast.info('در حال دریافت بازخورد هوشمند...');
        const { error: fbError } = await supabase.functions.invoke('ai-feedback-assignment', {
          body: { submission_id: subId },
        });
        if (fbError) console.error(fbError);
      }
      toast.success('تمرین با موفقیت ارسال شد');
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error('خطا در ارسال تمرین');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    not_started: 'bg-muted text-muted-foreground',
    draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    reviewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    needs_revision: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  };

  return (
    <Card className="border-primary/20 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-right p-4 hover:bg-muted/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{assignment.title}</span>
                </div>
                {assignment.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{assignment.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={statusColor[status]} variant="secondary">{STATUS_LABELS_FA[status]}</Badge>
                  {assignment.required && <Badge variant="outline" className="text-xs">اجباری</Badge>}
                  {assignment.estimated_minutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {assignment.estimated_minutes} دقیقه
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t">
            {assignment.blocks.map((b) => (
              <BlockRenderer
                key={b.id}
                block={b}
                value={answers[b.id]}
                onChange={(v) => handleChange(b.id, v)}
                disabled={readonly}
                studentId={studentId}
                submissionId={currentSubId}
              />
            ))}

            {submission?.ai_feedback && (
              <FeedbackReport feedback={submission.ai_feedback} adminFeedback={submission.admin_feedback} />
            )}

            <CTASection ctas={assignment.cta_config?.ctas} />

            {!readonly && (
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2 sticky bottom-0 bg-background pb-[env(safe-area-inset-bottom)]">
                <Button variant="outline" onClick={() => upsertDraft(answers)} disabled={saving}>
                  <Save className="h-4 w-4 ml-2" />
                  {saving ? 'در حال ذخیره...' : 'ذخیره پیش‌نویس'}
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
                  ارسال تمرین
                </Button>
              </div>
            )}

            {status === 'submitted' && !submission?.ai_feedback && (
              <div className="text-center text-sm text-muted-foreground py-2">
                تمرین ارسال شد. در انتظار بازخورد...
              </div>
            )}

            {(status === 'submitted' || status === 'reviewed' || status === 'completed') && assignment.allow_resubmit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const { data } = await supabase
                    .from('assignment_submissions')
                    .insert({ assignment_id: assignment.id, student_id: studentId, answers: answers as any, status: 'draft' } as any)
                    .select().single();
                  if (data) {
                    setCurrentSubId(data.id);
                    onSaved();
                    toast.success('می‌توانید مجدداً تمرین را ویرایش کنید');
                  }
                }}
              >
                ارسال مجدد
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2, ChevronLeft, Clock } from "lucide-react";
import type { Assignment, AssignmentSubmission, SubmissionStatus } from "@/types/assignment";
import { STATUS_LABELS_FA } from "@/types/assignment";

interface Lesson {
  id: string;
  title: string;
  lesson_number: number;
}
interface Section {
  id: string;
  lessons: Lesson[];
}

interface Props {
  courseId: string;
  courseSlug: string;
  sections: Section[];
}

const statusColor: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  reviewed: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  needs_revision: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export const CourseHomeworkTab: React.FC<Props> = ({ courseId, courseSlug, sections }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Record<string, AssignmentSubmission>>({});

  const lessonMap = React.useMemo(() => {
    const map: Record<string, Lesson> = {};
    sections.forEach((s) => s.lessons.forEach((l) => { map[l.id] = l; }));
    return map;
  }, [sections]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const lessonIds = Object.keys(lessonMap);
      const orParts: string[] = [`course_id.eq.${courseId}`];
      if (lessonIds.length) orParts.push(`lesson_id.in.(${lessonIds.join(",")})`);
      const { data } = await supabase
        .from("assignments")
        .select("*")
        .eq("status", "published")
        .or(orParts.join(","))
        .order("created_at");

      const list = (data || []) as unknown as Assignment[];
      if (cancelled) return;
      setAssignments(list);

      if (user && list.length) {
        const ids = list.map((a) => a.id);
        const { data: sData } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("student_id", parseInt(user.id))
          .in("assignment_id", ids)
          .order("created_at", { ascending: false });
        const map: Record<string, AssignmentSubmission> = {};
        (sData || []).forEach((s) => {
          const sub = s as unknown as AssignmentSubmission;
          if (!map[sub.assignment_id]) map[sub.assignment_id] = sub;
        });
        if (!cancelled) setSubs(map);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [courseId, user, lessonMap]);

  if (loading) {
    return (
      <Card><CardContent className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری تکالیف...
      </CardContent></Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">تکلیفی موجود نیست</h3>
          <p className="text-sm text-muted-foreground">هنوز تکلیفی برای این دوره ثبت نشده است</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => {
        const status: SubmissionStatus | "not_started" = subs[a.id]?.status || "not_started";
        const lesson = a.lesson_id ? lessonMap[a.lesson_id] : null;
        return (
          <Card key={a.id} className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm truncate">{a.title}</span>
                </div>
                <Badge className={statusColor[status]} variant="secondary">
                  {STATUS_LABELS_FA[status]}
                </Badge>
              </div>
              {a.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {a.required && <Badge variant="outline" className="text-xs">اجباری</Badge>}
                {a.estimated_minutes && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.estimated_minutes} دقیقه
                  </span>
                )}
                {lesson && (
                  <span className="text-xs text-muted-foreground">درس: {lesson.title}</span>
                )}
              </div>
              {lesson && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/app/course/${courseSlug}/lesson/${lesson.lesson_number}`)}
                >
                  رفتن به درس و انجام تکلیف
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseHomeworkTab;

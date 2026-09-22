import { supabase } from "@/integrations/supabase/client";

export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

export const emptyCourseProgress = (): CourseProgressSummary => ({
  totalLessons: 0,
  completedLessons: 0,
  progress: 0,
});

export async function fetchCourseProgressSummaries(
  userId: number,
  courseIds: string[],
): Promise<Record<string, CourseProgressSummary>> {
  const uniqueCourseIds = [...new Set(courseIds.filter(Boolean))];
  if (uniqueCourseIds.length === 0) return {};

  const [{ data: lessons, error: lessonsError }, { data: progressRows, error: progressError }] = await Promise.all([
    supabase
      .from("course_lessons")
      .select("id, course_id")
      .in("course_id", uniqueCourseIds),
    supabase
      .from("user_lesson_progress")
      .select("lesson_id, course_id, is_completed")
      .eq("user_id", userId)
      .in("course_id", uniqueCourseIds)
      .eq("is_completed", true),
  ]);

  if (lessonsError) console.error("Error fetching course lessons:", lessonsError);
  if (progressError) console.error("Error fetching lesson progress:", progressError);

  const lessonCourseMap = new Map<string, string>();
  const totals = new Map<string, number>();
  (lessons || []).forEach((lesson) => {
    lessonCourseMap.set(lesson.id, lesson.course_id);
    totals.set(lesson.course_id, (totals.get(lesson.course_id) || 0) + 1);
  });

  const completedByCourse = new Map<string, Set<string>>();
  (progressRows || []).forEach((row) => {
    const courseId = row.course_id || lessonCourseMap.get(row.lesson_id);
    if (!courseId || !lessonCourseMap.has(row.lesson_id)) return;
    const completed = completedByCourse.get(courseId) || new Set<string>();
    completed.add(row.lesson_id);
    completedByCourse.set(courseId, completed);
  });

  return Object.fromEntries(uniqueCourseIds.map((courseId) => {
    const totalLessons = totals.get(courseId) || 0;
    const completedLessons = completedByCourse.get(courseId)?.size || 0;
    return [courseId, {
      totalLessons,
      completedLessons,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    }];
  }));
}
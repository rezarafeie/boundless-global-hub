import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ClipboardCheck, PlayCircle } from 'lucide-react';
import { courseImage, courseImagePosition } from '@/lib/academyImagery';

export interface CourseProgressInfo {
  totalLessons: number;
  completedLessons: number;
  totalAssignments: number;
  submittedAssignments: number;
}

interface Props {
  title: string;
  slug?: string;
  enrollmentId: string;
  paid: boolean;
  statusLabel: React.ReactNode;
  progress?: CourseProgressInfo;
  compact?: boolean;
}

const EnrolledCourseCard: React.FC<Props> = ({ title, slug, enrollmentId, paid, statusLabel, progress, compact }) => {
  const to = paid && slug ? `/app/course/${slug}` : `/enroll/details?id=${enrollmentId}`;
  const pct = progress && progress.totalLessons > 0 ? Math.round((progress.completedLessons / progress.totalLessons) * 100) : 0;
  const started = !!progress && progress.completedLessons > 0;
  const cta = !paid ? 'تکمیل ثبت‌نام' : started ? 'ادامه یادگیری' : 'شروع دوره';

  return (
    <Link to={to} dir="rtl"
      className="group flex overflow-hidden rounded-3xl border border-border bg-card text-right transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float">
      <div className={`relative shrink-0 overflow-hidden bg-muted ${compact ? 'w-28' : 'w-36 md:w-44'}`}>
        <img src={courseImage(slug || '', title)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: courseImagePosition(slug || '', title) }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="line-clamp-2 font-bold leading-7 text-foreground">{title}</h4>
          <div className="shrink-0">{statusLabel}</div>
        </div>
        {paid && progress && progress.totalLessons > 0 && (
          <div className="space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{progress.completedLessons.toLocaleString('fa-IR')} از {progress.totalLessons.toLocaleString('fa-IR')} درس</span>
              {progress.totalAssignments > 0 && (
                <span className="inline-flex items-center gap-1"><ClipboardCheck className="h-3.5 w-3.5" />{progress.submittedAssignments.toLocaleString('fa-IR')} از {progress.totalAssignments.toLocaleString('fa-IR')} تکلیف</span>
              )}
              <span>{pct.toLocaleString('fa-IR')}٪</span>
            </div>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            {paid && <PlayCircle className="h-4 w-4" />}{cta}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:-translate-x-1">
            <ArrowLeft className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EnrolledCourseCard;

// Assignment system shared types

export type AssignmentBlockType =
  | 'title'
  | 'description'
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'single_choice'
  | 'multiple_choice'
  | 'rating'
  | 'checklist'
  | 'file_upload'
  | 'image_upload'
  | 'link'
  | 'hint';

export interface AssignmentBlock {
  id: string;
  type: AssignmentBlockType;
  label?: string;
  help?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface AssignmentCTA {
  type: 'telegram' | 'support' | 'smart_test' | 'consultation' | 'course' | 'link';
  label: string;
  url?: string;
  course_slug?: string;
}

export interface Assignment {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  blocks: AssignmentBlock[];
  required: boolean;
  ai_feedback_enabled: boolean;
  manual_review_enabled: boolean;
  ai_feedback_prompt: string | null;
  passing_score: number | null;
  estimated_minutes: number | null;
  cta_config: { ctas?: AssignmentCTA[] };
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  due_date: string | null;
  allow_resubmit: boolean;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'needs_revision'
  | 'completed';

export interface AIFeedback {
  score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  next_steps?: string[];
  cta?: { type: string; label: string; url?: string };
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: number;
  answers: Record<string, unknown>;
  files: Array<{ block_id: string; url: string; name: string; size: number }>;
  status: SubmissionStatus;
  ai_feedback: AIFeedback | null;
  admin_feedback: string | null;
  score: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS_FA: Record<SubmissionStatus | 'not_started', string> = {
  not_started: 'شروع نشده',
  draft: 'در حال انجام',
  submitted: 'ارسال شده',
  reviewed: 'بررسی شده',
  needs_revision: 'نیاز به بازنگری',
  completed: 'تکمیل شده',
};

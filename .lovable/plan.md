
# سیستم تمرین و ارزیابی درس‌ها (Assignment System)

هدف: افزودن یک سیستم کامل تمرین به هر درس، با پشتیبانی از انواع بلوک‌ها، بازخورد هوش مصنوعی، بازبینی ادمین، و CTAهای هدایت به پشتیبانی/تلگرام/تست هوشمند.

## بررسی وضعیت فعلی

- `course_lessons` موجود است؛ درس‌ها از طریق `AppLessonView.tsx` نمایش داده می‌شوند → محل قرارگیری کارت تمرین همان‌جا زیر محتوای درس.
- `chat_users.id` (integer) شناسه‌ی کاربر است؛ ثبت‌نام از طریق `enrollments.chat_user_id`. برای دسترسی دانشجو به تمرین همان الگو استفاده می‌شود.
- Supabase Storage موجود است (`messenger-files`) — یک باکت جدید `assignment-uploads` اضافه می‌شود.
- Lovable AI Gateway برای تولید تمرین و بازخورد استفاده می‌شود (بدون کلید کاربر).
- بات تلگرام از قبل به‌عنوان connector موجود است → صرفاً یک edge function برای forward کردن ارسال‌ها.

## معماری کلی

```text
Lesson Page ── AssignmentCard ── AssignmentRunner (blocks renderer)
                                    │
                                    ├── Draft autosave (submissions.status=draft)
                                    └── Submit → edge:submit-assignment
                                                    ├── ذخیره submission
                                                    ├── (اختیاری) edge:ai-feedback-assignment
                                                    └── (اختیاری) trigger telegram/support

Admin ── AssignmentsList ── AssignmentBuilder (blocks DnD)
                          ├── JSON Import/Export
                          ├── AI Create (edge:ai-generate-assignment)
                          ├── AI Edit  (edge:ai-edit-assignment)
                          └── SubmissionsReview
```

## فازها

### فاز ۱ — Schema و زیرساخت
جداول جدید در Supabase:

- `assignments` — عنوان، توضیح، `lesson_id`، `course_id`، `blocks` (jsonb)، `required`، `ai_feedback_enabled`، `manual_review_enabled`، `ai_feedback_prompt`، `passing_score`، `estimated_minutes`، `cta_config` (jsonb: telegram/support/smart_test/…)، `status` (draft/published/archived)، `tags` (text[])، `created_by`.
- `assignment_submissions` — `assignment_id`، `student_id` (chat_users.id)، `answers` (jsonb)، `files` (jsonb[])، `status` (draft/submitted/reviewed/needs_revision/completed)، `ai_feedback` (jsonb)، `admin_feedback` (text)، `score`، `submitted_at`، `reviewed_at`، `reviewed_by`.
- `assignment_ai_logs` — برای audit پرامپت‌ها و پاسخ‌های AI.
- `assignment_templates` — قالب‌های آماده (۱۰ قالب فارسی از لیست کاربر).

RLS و GRANTs:
- Students → فقط submissionهای خودشان (`student_id = current chat_users.id از session`).
- Admins/support → از طریق `user_roles` و helper موجود.
- `assignments` read: authenticated؛ write: admin only.

Storage bucket خصوصی: `assignment-uploads/{user_id}/{submission_id}/…` با policy مبتنی بر ownership.

### فاز ۲ — Block Schema (frontend types)
یک TypeScript union `AssignmentBlock` با انواع:
`title | description | short_text | long_text | number | single_choice | multiple_choice | button_choice | rating | checklist | image_upload | file_upload | link | media_link | scenario | ai_answer | hint | example`

هر بلوک: `{ id, type, label, required, options?, validation?, help?, meta? }`.
یک Zod schema برای validate کردن JSON import/export.

### فاز ۳ — Student UX (زیر هر درس)
فایل‌های جدید:
- `src/components/Assignment/AssignmentCard.tsx` — کارت جمع‌شونده با badgeهای status/required/زمان.
- `src/components/Assignment/AssignmentRunner.tsx` — رندر بلوک‌ها + autosave (debounced upsert روی submission draft).
- `src/components/Assignment/blocks/*` — یک کامپوننت به ازای هر type.
- `src/components/Assignment/FeedbackReport.tsx` — نمایش زیبای AI feedback (score, strengths, weaknesses, next steps, CTA button).
- `src/components/Assignment/CTASection.tsx` — دکمه‌های Telegram/Support/SmartTest بر اساس `cta_config`.
- ادغام در `AppLessonView.tsx`: زیر بخش محتوا، `<AssignmentSection lessonId={lesson.id} />`.

موبایل: submit button چسبان با `env(safe-area-inset-bottom)`.

### فاز ۴ — Admin Builder
- `src/pages/Admin/Assignments/AssignmentsList.tsx` — جدول با فیلتر course/lesson/status.
- `src/pages/Admin/Assignments/AssignmentBuilder.tsx` — چپ: پالت بلوک‌ها، وسط: preview قابل‌مرتب‌سازی (dnd-kit)، راست: تنظیمات بلوک/تمرین.
- `JsonImportExportDialog.tsx` — validate با Zod، preview قبل از save، دکمه copy schema.
- `AssignmentPreviewDialog.tsx` — رندر با همان AssignmentRunner در حالت readonly.

### فاز ۵ — AI (Edge Functions با Lovable AI Gateway)
- `supabase/functions/ai-generate-assignment` — ورودی: عنوان درس/خلاصه/هدف/سختی → خروجی JSON تمرین (structured output با Zod schema).
- `supabase/functions/ai-edit-assignment` — دستور طبیعی + draft فعلی → draft جدید (بدون overwrite تا تأیید ادمین).
- `supabase/functions/ai-feedback-assignment` — پاسخ‌های دانشجو + `ai_feedback_prompt` → JSON بازخورد (score/summary/strengths/weaknesses/next_steps/cta).
- مدل پیش‌فرض: `google/gemini-3-flash-preview`. لاگ در `assignment_ai_logs`.

### فاز ۶ — Admin Review Panel
- `src/pages/Admin/Assignments/SubmissionsReview.tsx` — فیلترها (course/lesson/assignment/student/status/score/date)، مشاهده‌ی جزئیات، افزودن feedback، تغییر status، اجرای مجدد AI، export CSV، assign به support agent.

### فاز ۷ — یکپارچگی‌ها
- **Telegram**: edge `assignment-to-telegram` که پیام خلاصه‌ی submission + لینک را از طریق connector تلگرام ارسال می‌کند.
- **Support Activation**: ایجاد ردیف در `support_conversations` با ref به submission.
- **Smart Test / Consultation / Course purchase**: صرفاً لینک داخلی از `cta_config`.

### فاز ۸ — Templates و داده‌ی نمونه
Seed کردن ۱۰ قالب فارسی درخواستی + یک تمرین نمونه‌ی فعال روی یک درس نمایشی.

## جزئیات فنی

- Autosave: `useDebouncedCallback` روی answers، upsert در `assignment_submissions` با status='draft' و unique `(assignment_id, student_id, status='draft')`.
- File upload: از `fileUploadService.ts` موجود با bucket جدید.
- Access: چک enrollment قبل از باز شدن تمرین (مثل الگوی `AppLessonView`).
- Validation: Zod در client و در edge function.
- Realtime (اختیاری فاز بعد): notify دانشجو وقتی admin_feedback ثبت شد.

## خارج از scope این پلن

- Grading خودکار پیچیده (rubric-based) → فاز آینده.
- Peer review → فاز آینده.
- Analytics عمیق روی نرخ تکمیل تمرین → فاز آینده.

## تحویل نهایی

- ۴ جدول + storage bucket + RLS + GRANTs
- ۳ edge function AI + ۱ edge function Telegram
- کامپوننت‌های Student (کارت، runner، بلوک‌ها، feedback، CTA) ادغام‌شده در `AppLessonView`
- صفحات Admin: List، Builder، JSON I/O، Review
- ۱۰ قالب seed شده

آیا این طرح را بسازم؟ اگر بخشی را می‌خواهی ابتدا (مثلاً فقط فاز ۱–۳ برای MVP دانشجو) بگو تا با همان شروع کنم.

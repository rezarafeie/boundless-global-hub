## Goal
Extend the Telegram coach from a single daily-hour broadcast into a **personalized, multi-trigger coaching system** that reacts to the learner's real behavior — celebrating progress, re-engaging silent users, and asking coaching questions to better support them.

## New trigger types

1. **Lesson Completed (event-driven)**
   - Fires within minutes after a user marks a lesson complete.
   - AI generates a personalized congratulation referencing the just-finished lesson, then teases the next one with a Mini App button.
   - De-duped: max 1 lesson-complete message per user/course per 6 hours (so bingeing doesn't spam).

2. **Course Completed (event-driven)**
   - Single celebration message when last lesson is completed; suggests review / next course / sharing.

3. **Inactivity Nudge (scheduled, tiered)**
   - 3-day silence: gentle "we missed you" + next lesson link.
   - 7-day silence: motivational re-engagement + reminder of progress %.
   - 14-day silence: final nudge with a coaching question ("what's blocking you?") — quick-reply buttons.
   - Stops once user returns (any lesson progress or bot interaction) or course is complete.

4. **Coaching Check-in (scheduled, periodic)**
   - Every ~5 lessons completed OR every 10 days of active learning, sends a short coaching question:
     - "بزرگ‌ترین چالش الان چیه؟" / "چه چیزی برات از همه مفیدتر بوده؟" / "چه موضوعی رو بیشتر بخوای؟"
   - Free-text answers are stored and surfaced in the CRM note for sales/support.

5. **Existing daily-hour reminder** — kept as-is, but suppressed for 24h after any other automatic message lands.

## Data model

New table `enrollment_followup_events` (audit + dedupe + coaching answer store):
```text
id uuid pk
enrollment_id uuid fk
event_type text  -- 'lesson_completed' | 'course_completed' | 'inactivity_3d' | 'inactivity_7d' | 'inactivity_14d' | 'coaching_checkin' | 'daily_hour'
payload jsonb    -- { lessonId, lessonTitle, progressPct, question, answer, ... }
message_text text
sent_at timestamptz default now()
user_replied_at timestamptz
```

New columns on `enrollments`:
- `last_lesson_completed_at timestamptz`
- `last_activity_at timestamptz` (updated on any lesson progress or bot message)
- `coaching_lessons_since_checkin int default 0`
- `inactivity_stage smallint default 0`  -- 0/3/7/14

DB trigger on `user_lesson_progress` (insert/update with `is_completed=true`):
- updates the matching `enrollments` row (by user phone + course): bumps counters, sets timestamps.
- inserts a `telegram_notification_queue` row of kind `lesson_completed` for the followup worker to pick up within ~1 minute (avoids running AI in a DB trigger).

## Workers

Extend `telegram-enrollment-followup` into a dispatcher that handles all event types, plus a fast queue consumer:

- **New edge function `telegram-followup-queue`** (cron: every 2 min)
  - Drains `telegram_notification_queue` rows with kind in (`lesson_completed`, `course_completed`).
  - Runs AI personalization, sends Telegram message, writes `enrollment_followup_events`.

- **Existing `telegram-enrollment-followup`** (cron: hourly, unchanged trigger schedule)
  - In addition to the current daily-hour reminder, on each run also:
    - finds enrollments past inactivity thresholds (3/7/14 days since `last_activity_at`) where `rafiei_bot_followup_enabled` is on, course not yet complete, and `inactivity_stage` < target — sends the next tier and bumps the stage.
    - finds enrollments due for a coaching check-in (counter >= 5 OR >= 10 days since last check-in event) and sends one.
  - Skips any enrollment that received another automatic message in the last 24h (uses `enrollment_followup_events`).

## Telegram reply handling

In `telegram-webhook`:
- When user replies to a coaching question (tracked by a `reply_to_message_id` we store, or quick-reply callback) → save into latest `enrollment_followup_events.payload.answer`, set `user_replied_at`, and post a CRM note on the user's profile so support sees it.
- Any inbound message updates `enrollments.last_activity_at` and resets `inactivity_stage` to 0.

## Admin UI

In `CourseCreate` / `CourseEdit`, under the existing follow-up switch, add per-trigger toggles (default all ON when parent is on):
- "پیام تبریک پس از اتمام هر درس"
- "پیام تبریک پایان دوره"
- "یادآوری در صورت غیبت (3/7/14 روز)"
- "سوالات کوچینگ دوره‌ای"

Stored as a single JSONB column `courses.rafiei_bot_followup_config` with shape:
```text
{ lesson_complete: bool, course_complete: bool, inactivity: bool, coaching: bool }
```

## Technical notes (for review)

- AI prompt is extended to accept `event_type` + structured context (last lesson title, progress %, inactivity days, prior coaching answers) so the same `composeAiMessage` helper is reused.
- All AI sends fall back to a static Persian template if the gateway errors.
- Reuses existing `generateSsoUrl`, `sendMessage`, `mdToTelegramHtml`.
- Cron jobs: add a 2-minute cron entry for `telegram-followup-queue`; the existing hourly cron for `telegram-enrollment-followup` is reused.

## Migration (will require approval before running)
1. Create `enrollment_followup_events` table + grants + RLS (admin read; service role full).
2. Add columns on `enrollments` (`last_lesson_completed_at`, `last_activity_at`, `coaching_lessons_since_checkin`, `inactivity_stage`).
3. Add JSONB column `courses.rafiei_bot_followup_config` (default all true).
4. Create trigger on `user_lesson_progress` to enqueue lesson-complete + bump counters.
5. Add 2-min pg_cron for `telegram-followup-queue`.

## Out of scope (ask before adding)
- Sending followups via email/SMS (Telegram only for now).
- Letting the user customize the coaching questions per course (uses a global pool).
- A/B testing different prompt variants.

Ready to execute this — confirm and I'll run the migration and ship the code.

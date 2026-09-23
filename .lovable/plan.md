# Boundless Challenge – thin adaptive layer (MVP)

Goal: Student Profile → matching Daily Mission variant → existing Assignment/Form → existing AI/Coach review → existing gamification/notifications → next mission.

## What gets reused (not rebuilt)
- **Submissions:** existing `assignments` + `assignment_submissions` (blocks, uploads, autosave, draft/submitted/needs_revision/completed, resubmit). A variant points to an `assignment_id` or a `telegram_form_id`.
- **AI review:** `ai-feedback-assignment-stream` (score, summary, strengths, weaknesses, next_steps). Pass/needs-revision derived from `passing_score`.
- **Coach review:** existing `AssignmentSubmissions` admin page (approve / revision / feedback / score).
- **Onboarding:** one `telegram_forms` form (web + Telegram + AI analysis) auto-created on JSON import; answers mapped to profile fields.
- **Gamification & delivery:** `_shared/gamification.ts` message templating (`{name}` = first name), `notifyStudent` channels (Telegram bot / Bale / Telegram Business / email), `GlobalAccessCountdownBanner` pattern, `RewardValue` component, hourly cron pattern.
- Challenge never touches `course_access_windows` — a missed mission cannot lock a course unless a penalty rule explicitly says `lock_course`.

## New data (minimum)
- `challenges` – title, slug, description, start_date, days_count, status (draft/active/finished), eligible_course_ids (or all Boundless Code 1–10), deadline_time, flags (gamification, streak, ai_review, coach_review, notifications), xp_rules, reward_rules, penalty_rules, messages (JSON), onboarding_form_id.
- `challenge_days` – day_number, title, short description, goal, est. minutes, deadline override, xp, required, review_mode (auto / ai / human / ai_human), notification_text, stage_update_prompt.
- `challenge_variants` – day_id, business_models[], stages[], budgets[] (empty = any), instructions, checklist, tips, example, resources, expected_result, assignment_id / form_id.
- `challenge_participants` – user, challenge, boundless_code, business_model, stage, budget, monthly_revenue, goal, website, socials, xp, streak, best_streak, first_sale_at, joined_at.
- `challenge_progress` – participant, day, variant, submission_id (existing), status (pending/submitted/pending_review/needs_revision/completed/missed), xp_awarded, completed_at.
- `challenge_daily_metrics` – participant, date, leads, conversations, sales, revenue.
- `challenge_events` – notification log (reuses the same dedupe/retry idea as gamification notifications).

Variant selection: filter matching variants, pick the one with the most non-empty criteria matched (most specific), fallback to an “any” variant.

## Admin – `/enroll/admin/challenges`
- List + create/edit (all fields above), days & variants editor, assignment picker with “duplicate & open in assignment editor”.
- **JSON import** with a downloadable full template + in-page guide: challenge settings, onboarding form fields, days, variants, mission content, embedded assignment blocks (created as real assignments), AI prompt per assignment, XP/reward/penalty rules, notification & follow-up texts. Validated before saving, with a preview of what will be created.
- Participant dashboard: name, code, model, stage, budget, day, progress, XP, streak, completed, missed, pending review, needs revision, sales, revenue; filters by code/model/stage/budget/progress/review status; manual stage change.

## Student – `/app/challenges` and `/app/challenges/:slug`
- Join → onboarding form → profile saved.
- Page: title, Day X/N, days remaining, today’s personalized mission, model/stage/budget, progress %, XP, streak, completed/missed, rewards, leaderboard position.
- CTA «شروع ماموریت امروز» opens the existing assignment card inline (same AI streaming, autosave, bloop, revision flow).
- After important days: “stage update” prompt (e.g. Building setup → Ready but no traffic).
- Simple daily metrics form (leads, conversations, sales, revenue) + personal totals.
- Leaderboards: XP, Streak, First Sale, Revenue Growth.

## Automation
- `challenge-progress` function: on submission / AI result / coach decision, decides completion per review_mode, awards XP & streak, unlocks rewards, sends events.
- `challenge-cron` (hourly): mission available, deadline approaching, mark missed, penalties, streak milestones — all through existing notifyStudent channels, respecting notifications flag and follow-up-free rules.
- Events: started, mission available, deadline approaching, completed, missed, streak, AI feedback ready, coach feedback ready, revision requested, first sale, reward unlocked.

## Technical details
- Link `assignment_submissions` → challenge via `challenge_progress.submission_id`; a small hook in `AssignmentSection` calls `challenge-progress` after submit/AI feedback when `?challenge=` context is present.
- Coach approve/revision in `AssignmentSubmissions.tsx` also calls `challenge-progress`.
- New functions get `verify_jwt = false` and resolve users via `resolveGamificationUserId`.
- RLS: participants read/write own rows; admins via existing admin checks; grants for authenticated/service_role.

## Out of scope for MVP
Full analytics, separate form builder, per-combination challenges, new review system.

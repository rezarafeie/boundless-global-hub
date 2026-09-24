# Challenge join: sign-in, Telegram activation, coach approval

## What students will experience
1. Opening a challenge requires signing in (login screen shown first, then back to the challenge).
2. Before onboarding, the student must have Telegram support/bot activated. If not, a clean box with the «فعال‌سازی پشتیبانی تلگرام» button is shown (same activation flow as /enroll/success). Once activated, onboarding opens.
3. After submitting onboarding, the page shows a «در انتظار تایید مربی» card (submitted answers summary, status, what happens next). Missions stay hidden.
4. Student receives a "your application is under review" message via email, Telegram bot and Telegram Business.
5. On approval: status becomes active, missions open, and an acceptance message with the challenge link is sent via bot, Telegram Business and email.
6. On rejection: page shows the rejection reason; the reason is sent via bot, Telegram Business and email. Student may edit and resubmit onboarding.

## What the coach experiences
- Coach (default rezarafeie13@gmail.com, editable per challenge) gets each new application by email and by Telegram bot, with full onboarding answers and «تایید» / «رد» buttons.
- «رد» in the bot asks for a reason (next message becomes the reason).
- In /enroll/admin/challenges → challenge → new «درخواست‌ها» tab: list of pending/approved/rejected applications with answers, approve button, and reject with reason field.

## Settings (per challenge, also in JSON template)
- `require_login` (on), `require_messenger_activation` (on), `require_coach_approval` (on), `coach_email`.
- New editable messages: `application_received`, `application_to_coach`, `application_approved`, `application_rejected` (placeholders {name}, {challenge}, {link}, {reason}).

## Technical details
- Migration: add columns to `challenges` (require_coach_approval, require_messenger_activation, coach_email) and to `challenge_participants` (approval_status pending/approved/rejected, rejection_reason, reviewed_at, reviewed_by). Existing participants set to approved.
- challenge-api: `join` checks auth + active support_activation (Telegram or Bale), creates participant with status pending_approval; new actions `approve` / `reject` (admin-only); state returns approval info and hides mission content until approved.
- Coach notification: resolve coach user by email → telegram_chat_id; send via bot with inline callback buttons `chal_ok:<id>` / `chal_no:<id>`; handle callbacks in shared bot-core (Telegram + Bale), verifying the pressing chat belongs to the coach.
- Student messages reuse existing challenge event delivery (bot/Business/email, messenger-exclusive).
- challenge-cron skips non-approved participants (no missed days/penalties while pending); approval date is the effective join date for missed-day logic.
- Frontend: ChallengePage gates (login → activation → onboarding → waiting/rejected → dashboard), ChallengeBuilder new Applications tab + settings switches, schema.ts template/guide updates.

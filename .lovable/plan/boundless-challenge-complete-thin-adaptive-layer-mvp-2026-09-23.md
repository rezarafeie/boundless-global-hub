# Boundless Challenge – Complete Thin Adaptive Layer (MVP)

Keep the current architecture and expand it. Do NOT redesign the system from scratch.

Goal:

**Student Profile → Matching Daily Mission Variant → Existing Assignment/Form → AI/Coach Review → Gamification → Rewards/Penalties → Multi-channel Follow-up → Next Mission**

The system must be simple enough that an admin can create or import a complete 14/21/30-day challenge without coding or manually creating hundreds of assignments.

---

# 1. What Gets Reused — Do Not Rebuild

## Assignments

Reuse existing:

- `assignments`
- `assignment_submissions`
- Assignment blocks
- Uploads
- Autosave
- Draft
- Submitted
- Needs revision
- Completed
- Resubmit
- Passing score
- Existing assignment UI

A Challenge Variant points to:

- existing `assignment_id`
- existing `telegram_form_id`
- or an assignment created automatically from Challenge JSON import.

Do NOT create another submission engine.

---

## Forms

Reuse:

- `telegram_forms`
- `telegram_form_fields`
- existing `/enroll/admin` Forms UI
- Web form renderer
- Telegram form renderer
- File/image/voice fields
- AI analysis
- Form submissions

Challenge onboarding and special missions may use existing Forms.

Do NOT build another Form Builder.

---

## AI Review

Reuse:

`ai-feedback-assignment-stream`

and existing AI feedback structure:

- score
- summary
- strengths
- weaknesses
- next_steps
- pass
- needs_revision

Each mission/assignment may define its own:

- AI enabled
- AI prompt
- passing score

---

## Human Coach Review

Reuse existing `AssignmentSubmissions`.

Coach can:

- Approve
- Request revision
- Add feedback
- Change score
- Mark completed

Challenge only needs to listen to these decisions.

---

## Existing Gamification

Reuse existing patterns/services for:

- deadlines
- countdowns
- streaks
- rewards
- penalties
- message templates
- notification deduplication
- scheduled reminders
- celebration UI

Challenge gamification must remain independent from Course Access Gamification.

Challenge NEVER modifies `course_access_windows` unless an admin explicitly creates a penalty with:

`lock_course`

Default missed missions must NOT lock purchased courses.

---

# 2. Challenge Data Model

Keep the new database small.

## `challenges`

Fields approximately:

- id
- title
- slug
- description
- cover_image
- start_date
- end_date
- days_count
- timezone
- status: draft / scheduled / active / paused / finished
- eligible_course_ids
- eligible_all_boundless
- onboarding_form_id
- default_deadline_time
- gamification_enabled
- streak_enabled
- notifications_enabled
- leaderboard_enabled
- ai_review_default
- coach_review_default
- xp_rules JSON
- reward_rules JSON
- penalty_rules JSON
- notification_settings JSON
- messages JSON
- created_at
- updated_at

`end_date` may be calculated automatically from `start_date + days_count`.

---

## `challenge_days`

- challenge_id
- day_number
- title
- short_description
- goal
- estimated_minutes
- available_at / unlock_time override
- deadline override
- xp
- required
- review_mode
- notification settings override
- stage_update_enabled
- stage_update_prompt
- sort_order

Review modes:

- auto
- ai
- human
- ai_human

---

## `challenge_variants`

Each day can have multiple variants.

Fields:

- day_id
- title
- business_models[]
- stages[]
- budgets[]
- boundless_codes[]
- instructions
- checklist
- tips
- example
- resources
- expected_result
- assignment_id
- form_id
- priority
- is_fallback

Empty criteria = Any.

Variant selection:

1. Find compatible variants.
2. Score specificity.
3. Prefer most specific matching variant.
4. Use priority as tie-breaker.
5. Fall back to `is_fallback = true`.

There must always be a clear fallback mechanism so a participant never reaches an empty day.

---

# 3. Participant Profile

## `challenge_participants`

Store:

- user_id
- challenge_id
- boundless_code
- business_model
- stage
- budget
- monthly_revenue
- goal
- website
- socials
- xp
- streak
- best_streak
- first_sale_at
- joined_at
- status
- current_day
- last_activity_at

Business Model:

- Dropshipping
- Drop Servicing
- Digital Product
- Iran Business
- AI Business

Stage:

- No niche/product/service yet
- Product/service selected
- Building setup/platform
- Ready but no traffic
- Traffic/leads but no sales
- Has sales but sales are low
- Selling and wants to scale

Budget:

- Zero
- Low
- Paid

Do NOT hardcode these labels deeply into components.

Keep profile option definitions configurable so future Challenges may introduce different segmentation.

---

# 4. Progress

## `challenge_progress`

One participant × one challenge day.

Store:

- participant_id
- challenge_id
- day_id
- variant_id
- assignment_id/form_id
- submission_id
- status
- available_at
- deadline_at
- started_at
- submitted_at
- completed_at
- missed_at
- xp_awarded
- reward_processed
- penalty_processed

Statuses:

- locked
- available
- started
- submitted
- pending_ai
- pending_review
- needs_revision
- completed
- missed
- skipped

Progress creation must be idempotent.

Never create duplicate progress rows when cron or hooks run multiple times.

---

# 5. Daily Metrics

## `challenge_daily_metrics`

Keep MVP simple:

- participant_id
- challenge_id
- date
- leads
- conversations
- sales
- revenue
- note

Show:

- today
- total
- change vs previous period where useful

When the participant reports their first sale:

set `first_sale_at`

and trigger the First Sale event automatically.

---

# 6. Challenge Events

Use:

`challenge_events`

as a small event + notification delivery log.

Events:

- challenge_joined
- challenge_started
- day_unlocked
- mission_available
- mission_started
- deadline_approaching
- mission_submitted
- ai_feedback_ready
- coach_feedback_ready
- revision_requested
- mission_completed
- mission_missed
- streak_achieved
- streak_broken
- first_sale
- reward_unlocked
- penalty_applied
- challenge_completed

Store enough information for:

- deduplication
- retry
- delivery status
- event metadata

Do not create separate event tables for each channel.

---

# 7. Multi-Channel Notifications

This is REQUIRED for MVP.

Reuse the Academy's existing notification/delivery infrastructure.

Challenge notifications must support available existing channels:

- Telegram Bot
- Telegram Business
- Bale
- Email
- In-app notification

If an SMS sender is already available and reusable, support SMS too.

Do NOT create separate Telegram integrations.

Use existing:

`notifyStudent`

and existing shared notification helpers.

---

# 8. Notification Configuration

Inside Challenge Admin add a simple:

### Notifications & Follow-up

Admin can globally enable/disable:

- Telegram Bot
- Telegram Business
- Bale
- Email
- In-App
- SMS if available

Each event can have:

- enabled
- channels
- timing
- title
- message

Support existing template variables such as:

`{name}`  
`{challenge_title}`  
`{day}`  
`{days_count}`  
`{mission_title}`  
`{deadline}`  
`{remaining_time}`  
`{xp}`  
`{streak}`  
`{reward}`  
`{progress}`  
`{feedback}`  
`{challenge_url}`  
`{mission_url}`

Use first name for `{name}` consistent with the existing Academy gamification behavior.

---

# 9. Follow-up Timeline

Do not limit notifications to one reminder.

Each Challenge or Day can define a small configurable follow-up sequence.

Example:

### Mission Available

Immediately:

"ماموریت روز ۷ آماده است 🔥"

### Reminder

6 hours before deadline.

### Urgent Reminder

2 hours before deadline.

### Final Reminder

30 minutes before deadline.

### Missed

After deadline.

### Inactive Participant

If no activity for configurable number of hours/days.

These timings must be configurable.

JSON import must also support them.

Use the existing hourly cron pattern.

Do not create separate cron jobs for every Challenge.

---

# 10. JSON Import — Required

JSON Import is one of the main features of this system.

Admin must be able to build a complete Challenge primarily through one JSON file.

Add:

**Import Challenge JSON**

to `/enroll/admin/challenges`.

The importer supports:

- Challenge settings
- Segmentation options
- Onboarding Form
- Days
- Variants
- Assignments
- Assignment blocks
- AI prompts
- Passing scores
- Review modes
- XP
- Rewards
- Penalties
- Notifications
- Follow-up sequences
- Stage updates
- Resources
- Leaderboard settings

---

# 11. JSON Import Modes

Support:

### Create New

Creates a completely new Challenge.

### Update Existing

Update a Challenge using slug/id while preserving participant progress.

Updating content must NEVER delete existing participant submissions/progress accidentally.

---

# 12. Embedded Assignment Creation

JSON may reference:

```json
{
  "assignment_id": "existing-id"
}

```

OR define:

```json
{
  "assignment": {
    "title": "...",
    "description": "...",
    "blocks": [],
    "ai_feedback_enabled": true,
    "ai_feedback_prompt": "...",
    "passing_score": 70,
    "manual_review_enabled": false
  }
}

```

When embedded:

Create a real assignment using the EXISTING Assignment system.

Then connect its ID to the Challenge Variant.

Do not store a second fake assignment format inside Challenge tables.

Same principle applies to Forms.

---

# 13. JSON Validation + Preview

Before importing:

### Step 1 — Upload/Paste JSON

Support:

- Upload `.json`
- Paste JSON

### Step 2 — Validate

Show:

- Challenge
- Number of days
- Number of variants
- Assignments to create
- Forms to create
- Rewards
- Penalties
- Notification events
- Errors
- Warnings

### Step 3 — Preview

Admin can inspect:

Day 1  
→ Variant A  
→ Variant B  
→ Assignment

Day 2  
→ ...

### Step 4 — Import

Only write to database after successful validation.

Use a transaction or safe rollback strategy where practical so partial imports do not leave broken Challenges.

---

# 14. JSON Export

Also add:

**Export JSON**

for existing Challenges.

This allows us to:

- backup a Challenge
- duplicate it
- edit externally
- reuse it for another course
- use AI to generate/update Challenge content

Export should contain enough information to recreate the Challenge, but not participant data/submissions.

---

# 15. Downloadable JSON Template

Inside Admin provide:

**Download JSON Template**

The template should contain examples of:

- Challenge
- Segments
- Onboarding
- Day
- Multiple Variants
- Assignment
- AI Prompt
- Review Mode
- Reward
- Penalty
- Notifications
- Follow-ups
- Stage Update

Also show a small in-page guide explaining the schema.

The goal is that later we can ask AI:

"Generate a complete 30-day Challenge using this schema"

and import it directly.

---

# 16. Admin Challenge UI

Route:

`/enroll/admin/challenges`

Main page should NOT look like a database management interface.

Use cards and a simple Challenge Builder.

Challenge card:

- Cover
- Title
- Status
- Start date
- Participants
- Current day
- Completion %
- Pending reviews

Actions:

- Manage
- Participants
- Import
- Export
- Duplicate
- Preview
- Pause
- Finish

---

# 17. Challenge Builder UI

Inside Challenge:

Use tabs:

### Overview

Basic settings.

### Days & Missions

Visual list:

Day 1  
Day 2  
Day 3  
...

Click a day to edit.

Inside each Day:

- Basic mission settings
- Variants
- Assignment/Form
- Review
- XP
- Deadline
- Follow-up

Allow:

- Duplicate Day
- Duplicate Variant
- Reorder
- Add Day

Do not expose raw database concepts to normal admins.

---

# 18. Variant Builder UI

Make segmentation visually simple.

Example:

**Show this mission when:**

Business Model  
☑ Dropshipping  
☐ Drop Servicing  
☐ Digital Product

Stage  
☑ Ready but no traffic  
☑ Traffic but no sales

Budget  
☑ Zero  
☐ Low  
☐ Paid

Then:

**Mission Content**

and:

**Submission**

Existing Assignment ▼

or:

Create / Duplicate Assignment

Also show:

"Fallback Variant"

toggle.

---

# 19. Admin Participant Dashboard

Inside each Challenge:

Show:

- Name
- Boundless Code
- Business Model
- Stage
- Budget
- Current Day
- Progress
- XP
- Streak
- Completed
- Missed
- Pending Review
- Needs Revision
- Sales
- Revenue
- Last Activity

Filters:

- Code
- Model
- Stage
- Budget
- Progress
- Review status
- Active/Inactive

Admin actions:

- Open participant
- Change stage
- Change budget/model
- Add/remove XP
- Mark mission complete
- Reopen mission
- Extend mission deadline
- Grant reward

Keep actions simple.

---

# 20. Student Challenges Home

Create:

`/challenges`

Show:

### Active Challenge

Large card:

- Challenge name
- Day X of N
- Progress
- Today's status
- Streak
- XP
- Days remaining

CTA:

**ادامه چالش**

Below it:

- Upcoming/Scheduled Challenges
- Completed Challenges

Use Persian RTL UI consistent with the existing Academy.

---

# 21. Main Student Challenge UI

Route:

`/challenges/:slug`

This is an important product UI, not just another Assignment page.

Top area:

**چالش فروش بدون مرز**

`روز ۷ از ۳۰`

Progress bar.

Then compact stats:

🔥 Streak  
⚡ XP  
✅ Completed  
⏰ Remaining

---

# 22. Today's Mission UI

Today's mission should be the visual focus.

Card:

### ماموریت امروز

Mission title

Goal

Estimated time

Deadline countdown

XP reward

Then personalized content:

- Instructions
- Checklist
- Tips
- Example
- Resources
- Expected result

CTA:

**شروع ماموریت امروز**

When started, show the existing Assignment/Form experience inline or in a clean mission view.

Do NOT visually send the user into an unrelated-looking admin/form page.

Reuse the functionality while wrapping it inside Challenge UI.

---

# 23. Mission States UI

Clearly show:

🔒 Locked  
🟢 Available  
🟡 In Progress  
📤 Submitted  
🤖 AI Reviewing  
👤 Coach Reviewing  
🔄 Needs Revision  
✅ Completed  
❌ Missed

Student must always understand what they should do next.

---

# 24. Challenge Timeline

Below Today's Mission show:

### مسیر ۳۰ روزه

Day 1 ✅  
Day 2 ✅  
Day 3 ✅  
Day 4 🔄  
Day 5 🔒  
...

Clicking completed days opens:

- Mission
- Submission
- AI feedback
- Coach feedback
- XP earned

Future days show only appropriate preview information.

---

# 25. AI Feedback UI

Do not just show raw AI text.

Reuse existing AI feedback but present it inside Challenge:

### نتیجه بررسی

Score

Strengths

What to improve

Next steps

Status:

**قبول شد**

or

**نیاز به اصلاح**

If revision required:

CTA:

**اصلاح و ارسال مجدد**

---

# 26. Human Coach UI

When human review is required show:

**در انتظار بررسی مربی**

After review:

- Coach feedback
- Score
- Approved / Revision
- Date

If `ai_human`:

AI result may appear first, while final mission completion waits for coach approval if configured that way.

---

# 27. Adaptive Stage Update

Selected important Days can ask:

### الان در چه مرحله‌ای هستی؟

Suggest the next stage based on progress.

Example:

Building setup

↓

Ready but no traffic

Student confirms or selects another stage.

Update `challenge_participants.stage`.

Future mission matching must immediately use the new stage.

Coach/Admin may override it.

---

# 28. Gamification UI

Reuse existing visual patterns where appropriate.

Challenge page should show:

### XP

Points earned.

### Streak

Consecutive completed missions.

### Rewards

Locked / Available / Earned.

### Milestones

Example:

7-day streak  
First Sale  
10 missions completed  
Challenge Finisher

Use celebration UI when a meaningful reward/milestone is unlocked.

---

# 29. Rewards

Reward rules should support simple triggers:

- Complete N missions
- Reach N XP
- Reach N-day streak
- Complete challenge
- Complete before Day X
- First sale
- Revenue target
- Custom/manual

Reward can contain:

- title
- description
- emoji/icon
- reward_type
- reward_value
- CTA/link

Reuse existing `RewardValue` patterns where useful.

---

# 30. Penalties

Keep penalties simple.

Possible triggers:

- Miss mission
- Break streak
- Miss X missions

Possible actions:

- lose XP
- reset streak
- warning
- custom action
- `lock_course` only when explicitly configured

Default penalty should NEVER remove purchased course access.

---

# 31. Daily Metrics UI

Keep this extremely quick.

Card:

### نتیجه امروز

Leads: [ ]

Conversations: [ ]

Sales: [ ]

Revenue: [ ]

CTA:

**ثبت نتیجه**

Should take seconds.

When Sales changes from 0 to >0 for the first time:

trigger:

🎉 **اولین فروش!**

and corresponding notification/reward/event.

---

# 32. Leaderboards

Simple tabs:

### اجرا

XP ranking.

### استمرار

Streak ranking.

### اولین فروش

Based on first sale event.

### رشد فروش

Based on challenge-period revenue improvement.

Leaderboard can be disabled per Challenge.

Do not build complex analytics.

---

# 33. In-App Notifications

Challenge events should also appear inside the Academy.

Examples:

"ماموریت امروزت باز شد."

"فقط ۲ ساعت تا پایان ماموریت باقی مانده."

"بازخورد AI آماده است."

"مربی تمرینت را بررسی کرد."

"🔥 استریک ۷ روزه!"

"🎁 جایزه جدید باز شد."

Click notification → correct Challenge/Mission.

---

# 34. Automation

## `challenge-progress`

Responsible for:

- assignment submitted
- form submitted
- AI result
- coach decision
- completion decision
- XP
- streak
- rewards
- penalties
- stage-update eligibility
- event creation
- notification triggering

Must be idempotent.

---

## `challenge-cron`

One hourly Challenge cron.

Handles:

- Challenge start
- Day unlock
- Mission available
- Deadline reminders
- Follow-ups
- Missed missions
- Inactivity reminders
- Streak events
- Challenge completion

Do not create one cron per Challenge.

---

# 35. Notification Delivery

Central flow:

Challenge Event

↓

Message template

↓

Existing `notifyStudent`

↓

available configured channels:

Telegram Bot  
Telegram Business  
Bale  
Email  
In-App  
SMS if available

↓

`challenge_events` delivery status

Failures on one channel must not prevent delivery on other channels.

Do not send the same event twice due to repeated cron execution.

---

# 36. Assignment Integration

`challenge_progress.submission_id`

links to the existing assignment submission.

When Assignment is opened from Challenge context, pass:

`challenge`  
`participant`  
`day`  
`variant`

context safely.

After submission:

Assignment system

→ existing AI

→ Challenge Progress

→ XP / Review / Event

Do not fork Assignment UI or submission logic.

---

# 37. Form Integration

If a Mission uses a Telegram Form:

Web submission OR Telegram Bot submission must update the same Challenge Progress.

Challenge progress must therefore not depend only on browser callbacks.

The backend submission flow should recognize Challenge context and call/update `challenge-progress`.

This is important because Challenge Forms may be completed entirely inside Telegram.

---

# 38. Telegram Bot Challenge Experience

Do not build a second Telegram bot.

Extend the existing bot.

At minimum support:

- Challenge invitation/start link
- Onboarding form
- Today's mission notification
- Open mission
- Existing Telegram form completion
- Deadline reminders
- AI feedback notification
- Coach feedback notification
- Revision notification
- Mission completion
- Streak
- Reward
- First sale
- Challenge completion

Where a full Assignment cannot be completed natively in Telegram, send a deep link to the exact Challenge Mission web page.

---

# 39. Telegram Business / Email

Telegram Business and Email must receive the same event system, with channel-appropriate rendering.

Email can include:

- Challenge title
- Mission title
- Deadline
- Short instructions
- CTA button to exact mission
- Feedback/reward when relevant

Telegram messages should remain compact and action-oriented.

Do not maintain completely separate business logic for each channel.

Templates may differ, events do not.

---

# 40. Deep Links

Every important event should have a useful destination.

Examples:

Challenge:

`/challenges/:slug`

Mission:

`/challenges/:slug?day=7`

Revision:

`/challenges/:slug?day=7&action=revision`

Feedback:

`/challenges/:slug?day=7&view=feedback`

Notifications should link directly to the relevant state.

---

# 41. Preview Mode

Admin needs:

**Preview as Student**

Select:

- Code
- Business Model
- Stage
- Budget
- Day

Then preview which Variant would be selected and exactly what the student sees.

This is important because hundreds of combinations may exist.

Admin should be able to verify routing without creating fake users.

---

# 42. Variant Coverage Checker

Inside Admin add a lightweight validation tool.

For each Day warn if combinations have no matching Variant.

Example:

⚠️ Day 12:

AI Business + Zero Budget + No Product

has no specific Variant and will use fallback.

This does NOT need to generate every possible combination visually.

Just detect uncovered cases and fallback usage.

---

# 43. Duplicate Challenge

Admin can duplicate an existing Challenge.

Options:

- Structure only
- Structure + Days/Variants
- Full template including Assignments/Forms

Never duplicate participant data.

---

# 44. Challenge Lifecycle

Support:

Draft

↓

Scheduled

↓

Active

↓

Paused

↓

Finished

Draft:  
students cannot join.

Scheduled:  
students can see upcoming challenge if configured.

Active:  
normal operation.

Paused:  
deadlines and automation should respect pause behavior.

Finished:  
read-only history remains available.

---

# 45. Safety / Backward Compatibility

This implementation must NOT break:

- Existing Courses
- Existing Assignments
- Existing Assignment Submissions
- Existing Forms
- Telegram Forms
- Existing AI feedback
- Existing Course Gamification
- Existing Telegram Bot
- Telegram Business
- Bale
- Email
- Existing enrollments

All Challenge behavior must be opt-in.

Existing courses without a Challenge behave exactly as before.

---

# 46. MVP Definition of Done

The MVP is complete when we can:

1. Create a Challenge manually.
2. Import a complete Challenge from JSON.
3. Export it back to JSON.
4. Configure 14/21/30 or any number of days.
5. Create multiple adaptive Variants per Day.
6. Match missions by Code + Business Model + Stage + Budget.
7. Use existing Assignments.
8. Create Assignments automatically from JSON.
9. Use existing Forms.
10. Complete Form missions from Web or Telegram.
11. Run existing AI review.
12. Run existing Human Coach review.
13. Handle revision/resubmit.
14. Award XP.
15. Calculate streaks.
16. Unlock rewards.
17. Apply configured penalties.
18. Collect daily leads/sales/revenue.
19. Detect First Sale.
20. Update participant Stage.
21. Show a polished Challenge UI.
22. Show the 30-day timeline.
23. Show feedback inside Challenge UI.
24. Show simple leaderboards.
25. Send notifications through Telegram Bot.
26. Send notifications through Telegram Business.
27. Send notifications through Bale.
28. Send notifications through Email.
29. Show In-App notifications.
30. Run configurable deadline/follow-up reminders.
31. Deep-link notifications to the correct Mission.
32. Preview Variant selection as Admin.
33. Validate Variant coverage.
34. Duplicate Challenges.
35. Preserve all existing Academy functionality.

Do not build unnecessary new infrastructure.

The key architecture remains:

**Challenge = orchestration layer**

not:

**Challenge = another LMS**

Build it by connecting and extending the systems already present in Rafiei Academy.
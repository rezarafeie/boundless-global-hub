# Gamified Course Access (7-Day Sprint)

Opt-in per course. Courses without the feature enabled keep today's behaviour exactly.
Target courses: طعم بی‌مرزی، مینی دوره ایران، کلاس رایگان هوش مصنوعی.

## 1. What the student experiences

**Access window**
- On enrollment, a 7-day access window starts at the exact enrollment time.
- A slim fixed bar at the top of the course/lesson pages shows "۶ روز و ۱۴ ساعت باقی‌مانده".
- Welcome message goes out on Telegram bot, email, SMS, and Telegram Business (once support is activated).
- When the window ends, lesson content is locked but all progress is kept, and a reactivation page appears offering a $10 payment for another 7 days. After payment the student resumes exactly where they stopped.

**Daily missions**
- Every lesson is a mission. When it unlocks, the student has 24 hours to finish it and keep their streak.
- Reminder message on all four channels; the course page shows the mission's remaining time.
- Completing a mission unlocks the next one and shows a short motivational note ("🔥 ماموریت انجام شد… هنوز واجد شرایط جایزه سریع هستی").
- A missed 24-hour deadline only breaks the streak — the lesson stays open until the 7-day window ends.

**Rewards**
- Finish in 7 days → نشان Boundless Finisher
- Finish in 5 days → Finisher + bonus
- Finish in 3 days → Fast Finisher + یک ماه اشتراک رایگان Rafiei Store
- Rewards are rows in a table, so admins can later add BNETS access, AI Coach credits, Rafiei Studio/Builder credits, or any other bonus without new code.

**Dashboard card (LMS app + course page)**
Streak, progress %, remaining access time, current mission and its deadline, earned rewards, and the still-locked reward with its condition — in the compact style of the example.

## 2. Admin controls

New "دسترسی گیمیفای" section on the course settings page:
- Enable/disable per course
- Free access duration (7 days), reactivation price ($10), reactivation duration (7 days)
- Mission deadline (24h), fast-finish deadline (3 days)
- Reward list: title, condition (finish within N days), reward type, value, active toggle

Per-student actions from the enrollment/user view: extend access, reactivate/unlock, grant a reward, remove a reward.

## 3. Technical notes

**Database**
- `course_gamification_settings` (course_id, enabled, free_days, reactivation_price_usd, reactivation_days, mission_hours, fast_finish_days)
- `course_gamification_rewards` (course_id, title, description, within_days, reward_type, reward_value, is_active)
- `course_access_windows` (user_id, course_id, enrollment_id, started_at, expires_at, status, source, completed_at)
- `course_missions` (user_id, course_id, lesson_id, unlocked_at, due_at, completed_at, streak_kept)
- `user_rewards` (user_id, course_id, reward_id, granted_at, granted_by, revoked_at)
- `course_gamification_notifications` (idempotency log per user/course/kind)
All with grants + RLS: students read their own rows, admins manage everything, service_role full.

**Backend**
- `course-access-status` — single read endpoint returning window, missions, streak, rewards; used by the header countdown and dashboard card.
- `course-mission-complete` — called from the existing lesson-completion path; closes the mission, opens the next, evaluates rewards, returns the motivational payload.
- `course-access-reminders` — cron (hourly): mission-deadline reminders, access-expiry warnings, expiry lock; sends via the existing Telegram bot / Telegram Business / email / SMS helpers in `_shared`.
- `course-reactivation-payment` + verify — reuses the existing Rafiei Pay / Zarinpal flow with the live USD→Toman rate helper (`buildFxFields`), then extends the window.

**Frontend**
- `useCourseAccess` hook wrapping the status endpoint.
- `CourseAccessBar` (fixed countdown), `MissionCard`, `RewardsCard`, `ReactivationPage`.
- Wired into `src/pages/CourseAccess.tsx`, `src/pages/App/AppCourseDetail.tsx`, `AppLessonView.tsx`, `AppDashboard.tsx` — all guarded so nothing renders when the course has the feature off.

**Assumptions**
- Reactivation is charged in Toman using the live USD rate at payment time.
- SMS uses the existing SMS sender; if no provider is wired for this flow, the other three channels still go out.

## 4. Build order
1. Database tables + admin settings/rewards UI
2. Status endpoint + access window creation on enrollment + header countdown
3. Missions + completion hook + motivational message
4. Rewards evaluation + dashboard card
5. Expiry lock + reactivation page + payment
6. Reminder cron across the four channels
7. Per-student admin actions

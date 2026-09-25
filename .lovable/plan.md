# Match coach and student challenge views

## Goal
Make the coach’s mission experience use the same page layout and day navigation as the student view, while keeping every challenge day available.

## Changes
- Extract the shared challenge mission presentation so both student and coach modes render the same header, mission card, details, and day timeline.
- In coach mode, create open display rows for every day and select each day directly from the timeline.
- Show mission content and linked assignment/form details without student-only actions, submissions, penalties, progress changes, daily reporting, rewards, or personal notifications.
- Keep the coach-only “درخواست‌های عضویت” tab and its approve/reject workflow alongside the matching mission view.

## Technical details
- Reuse the student mission UI in `ChallengePage.tsx` through a shared presentation component rather than maintaining a second visual implementation.
- Adapt the coach state’s day/variant data into the same display contract; all timeline days remain enabled.
- Preserve current student behavior unchanged.

## Verification
- Confirm the project builds successfully.
- Check coach view on desktop and mobile: identical mission structure, all days selectable, applications tab still works.

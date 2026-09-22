# Restore Gamification End to End

## Outcome
Gamification reliably starts for every eligible enrollment, appears throughout both academy layouts, and sends only verifiably successful messages through each configured channel.

## Changes
1. Put the global access countdown in the LMS/app layout as well as the public academy layout, while retaining course and lesson countdowns.
2. Harden student identity handling so status and mission requests use the numeric academy/chat user record and do not silently fail for alternate sign-in identities.
3. Start or recover missing access windows for completed enrollments, including existing-enrollment return paths.
4. Repair notification delivery tracking: validate Telegram API responses, record actual successes, retain failure details, and permit retries for channels that failed or became available later.
5. Ensure the hourly gamification job is configured and callable, with useful logs and error reporting.
6. Test status, enrollment recovery, mission completion, and all available delivery channels against real non-completed records without re-notifying completed students.

## Safety
- Keep the existing 100%-completion rule: completed students receive celebration/gifts, not countdowns or reminders.
- Keep all admin-edited gamification message text and per-course settings unchanged.
- Avoid duplicate messages by retrying only channels not already confirmed successful.

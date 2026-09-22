# Assignment visibility and feedback flow

## What will change
- Place a clearly labeled assignment section directly after each lesson video/content in both lesson experiences, with stronger visual separation so it cannot blend into surrounding content.
- Correct Persian single-choice rows to use right-to-left direction and right-aligned labels, matching multiple-choice blocks.
- Keep the submitted assignment expanded while AI feedback is generated.
- When AI feedback arrives, scroll it into view, briefly highlight it, and play a short unobtrusive notification sound.

## Technical details
- Preserve the current assignment data, submission, and AI-review flow.
- Add stable section and feedback references for scrolling without changing routes or backend behavior.
- Generate the notification tone with the browser audio API, so no external audio file is required.
- Verify both `/course-access` lessons and app lesson pages, including Persian choice alignment and the AI feedback state.

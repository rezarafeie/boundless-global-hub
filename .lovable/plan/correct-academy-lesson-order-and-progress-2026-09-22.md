# Correct academy lesson order and progress

## Changes
- Sort course sections and every lesson list deterministically by their configured order, then lesson number.
- Load each student’s saved completion state on both the course overview and lesson screen.
- Remove generated/random completion states from academy learning views.
- Make completed lesson titles and badges readable in dark mode using the academy’s semantic colors.

## Validation
- Check the affected academy course pages for ordering, saved completion status, and dark-mode styles.
- Run the project type check and verify the live page where authentication permits.

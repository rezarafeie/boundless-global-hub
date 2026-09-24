# Sync challenge onboarding with its selected form

## What will change
- Load the challenge’s linked onboarding form and its fields before showing onboarding.
- Use the linked form’s `stage` dropdown options as the source of the challenge stage labels, so edits in `/f/ch-form-mufur5e8gi5w` appear automatically.
- Map selected form labels back to the challenge’s stable stage values, preserving mission targeting and existing participant data.
- Render onboarding as the same one-question-at-a-time experience used by `/f/...`, including progress, large option buttons, back/next controls, and mobile-friendly sizing.
- Keep the challenge-required profile fields and include any additional fields from the linked form without creating a second standalone submission.

## Technical details
- Extend `challenge-api` state with the linked onboarding form metadata and ordered fields.
- On join, save canonical challenge fields in their existing columns and extra linked-form answers inside the participant profile JSON.
- Add safe matching for stage and budget options by order/stable key so changing visible Persian text does not break personalized mission selection.
- Update the challenge onboarding component only; the public form page remains unchanged.
- Deploy `challenge-api`, then verify the linked form’s four new stage titles appear on desktop and mobile and that joining still reaches the challenge.

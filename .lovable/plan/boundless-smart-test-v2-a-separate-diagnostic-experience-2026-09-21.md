# Boundless Smart Test V2 — a separate diagnostic experience

V1 stays exactly as it is: same address, same questions, same scoring, same results, same admin page, same stored answers. V2 is built beside it as a new, independent experience tagged `boundless_smart_test_v2`.

## What the visitor goes through

1. **Start page** (`/smart-test-v2`) — headline «کدوم مسیر بدون مرز واقعاً برای تو ساخته شده؟», the five paths (Dropshipping • Drop Service • Digital Product • AI Business • Vibe Coding), the «۴ تا ۷ دقیقه • تحلیل اختصاصی • پیشنهاد مسیر • نقشه شروع» line, and the button «تحلیل من رو شروع کن».
2. **Stage bar** instead of "question 7 of 15": شناخت تو → شرایط → مدل کاری → محدودیت‌ها → هدف → تحلیل.
3. **15 questions** exactly as specified — current stage, time, capital, interests (multi, max 3, with the "don't know" option clearing the rest), drag-to-rank of the chosen interests, skills (with the "no skills" option clearing the rest), the $500 scenario, risk, monetization speed, English, technical comfort, blockers (multi, max 3), 12-month goal, forced trade-off, and the final notification question.
4. **Rhythm breaks** between them, never more than 2–3 plain questions in a row: micro insights written from the person's own answer, Mini Result #1 (a first picture of their situation), Mini Result #2 (two unnamed paths pulling ahead, shown as anonymous bars), the academy trust block, a forming profile card (Commercial / Creative / Technical / Execution) and the final "your answers were consistent / interestingly contradictory" note.
5. **Objection branches** — at most two are shown live, chosen from what the person picked as their blocker: time, money, "not possible from my country", dream-selling/trust, skills, fear of failure, "I'll start later". Each follows the pattern objection → punch → reality → evidence → challenge, and each can carry a video, images, a gallery, proof, a testimonial, a CTA and a follow-up question — all set from the admin panel. Where the blocker contradicts an earlier answer (said 2–4 hours a day, then "no time"; said they could set aside $500–2,000, then "no money"), the text names the contradiction using their own words.
6. **Analysis screen** — no blank spinner: counts of answers, paths and factors being weighed, plus a relevant student story or clip if one has been added in admin.
7. **Result page** — recommended path with a Match number, second path, a "not right now" path, Readiness as a separate number, confidence, profile type, 3–5 reasons taken from the actual scoring evidence, one honest weakness, a direct reality check, a 30-day week-by-week roadmap for that path, matching social proof, the Boundless bridge and the next-step CTA.

## How the recommendation is calculated

Five running scores, one per path. Every question adds or subtracts points using the weights given in the brief (capital, interests, ranking with +8/+5/+2, skills, the $500 scenario, risk penalties, monetization speed, technical comfort, and the final notification as a light confirmation only). Interest alone can't win; it is roughly a fifth of the picture.

Every single adjustment is stored with its reason ("AI +6 → comfortable with AI", "Dropshipping −5 → limited test capital"), and the result page writes its explanation from those stored reasons, not from generic copy. Scores are normalised to 0–100. Readiness is a separate 0–100 number from time, intent, history, resources, trust and how completely they answered. Confidence comes from how consistently their signals point the same way. A tooltip states plainly that a Match number is fit with their answers, not a promise of income or success.

All the point values live in a configuration record, not buried in the screens, so they can be tuned from admin later.

## Saving and resuming

Progress is written as the person moves, keyed to the browser and to their account when signed in. Coming back shows «تحلیلت هنوز اینجاست.» and continues where they stopped; restarting is only by explicit choice. Unfinished tests are visible to the team for follow-up.

## Admin (separate from V1)

A new "Smart Test V2" area at `/enroll/admin/smart-test-v2` with:
- **Content** — questions, order, type, options, multi-select limits, ranking, insights, mini results, objection branches, trust block, roadmaps per path, result copy and CTAs; every block can carry uploaded video, a video link, image, gallery, testimonial, proof or rich text, replaceable without touching code. Anything left empty simply doesn't appear to visitors.
- **Scoring** — all path point values and the path definitions.
- **Submissions** — the full profile per person: recommended path and match, alternative, readiness, confidence, profile, capital, time, English, goal, primary and secondary blocker, Maza progress, CTA shown and clicked, start and finish times, duration, all answers, all scoring reasons and detected contradictions. Filterable by path, readiness, blocker, "Maza incomplete", "high match, no purchase", abandoned, and finished-but-no-click.
- **Analytics** — starts, completion rate, where people drop off, time taken, answer distribution, recommended paths, readiness spread, blockers, common contradictions, media engagement, CTA impressions and clicks, consultation requests and purchases, shown as a funnel.

## Next step after the result

The closing action changes per person rather than always selling the same thing: finish مزه بدون مرز if it's unfinished (their percentage is named), a lower-friction «شروع مسیر» when readiness is still building, a Boundless consultation request that carries the test result to the advisor automatically, or the full Boundless entry conditions for the strongest fits.

## Technical notes

- New route `/smart-test-v2` plus `/smart-test-v2/result/:id`; V1 routes untouched.
- New tables prefixed `smart_test_v2_` (config, blocks, submissions, events) with grants and row-level rules; anonymous visitors can create and update only their own submission, admins see everything. No V1 table is read or written.
- Scoring engine as a standalone module with unit-testable pure functions; V1's `smartTestEngine.ts` is not imported or changed.
- One new edge function for finalising a submission (scoring, evidence, readiness, confidence, contradictions, CRM record) and one for the narrative reality-check text via the existing AI gateway, always grounded in the stored evidence.
- Reads existing academy data (user, Maza course progress, purchases) read-only for personalisation.
- Mobile-first, RTL, large tap targets, existing Rafiei Academy design tokens, no hardcoded colors.

## Build order

1. Database tables and seed configuration (questions, scoring, default copy).
2. Scoring engine and evidence/readiness/confidence/contradiction logic.
3. The test flow: start page, stages, questions, insights, mini results, objection branches, analysis.
4. Result page with reasons, weakness, roadmap, proof and dynamic CTA.
5. Admin content, scoring, submissions and analytics screens.
6. Resume, tracking events and funnel analytics.

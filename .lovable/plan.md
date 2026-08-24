# Scaling the Webinar System to 500 Concurrent Viewers

## Short answer

Not safely as it stands. The video itself is fine (it is an external iframe/CDN), but the interactive layer — chat, polls, quizzes, reactions, Q&A — is built so that **every event is broadcast to every viewer, and each viewer then re-reads the whole dataset**. At 30–50 people that is invisible. At 500 it multiplies into hundreds of thousands of requests per minute and the page will lag, rate-limit, or drop realtime connections.

Below is exactly where it breaks and what to change. The fixes are contained and do not require re-architecting the webinar.

## Where it breaks at 500 users

**1. Poll/quiz answers are the worst offender (`useWebinarRealtime.ts`)**
The subscription to answers has no filter, so every viewer receives every answer from every webinar, and each received answer causes that viewer to re-download the full answer list. If 500 people answer one poll, that is roughly 250,000 broadcast messages and 250,000 full-table reads in a few seconds. This alone can stall the database and the realtime service.

**2. Chat polls the database every 3 seconds per viewer (`WebinarChat.tsx`)**
Each viewer re-downloads the last 200 messages every 3 seconds *in addition to* the realtime feed. 500 viewers = ~170 queries/second continuously, each returning 200 rows, for data they already have.

**3. Reactions run four counting queries per viewer per reaction**
One reaction click fires four `count` queries on every one of the 500 open pages — 2,000 queries from a single tap.

**4. Participant count re-counts on every join**
During the first minutes, as 500 people arrive, each arrival makes all already-connected viewers run a count query — a quadratic spike exactly when load is highest.

**5. Viewer count shown is not real**
The page multiplies the participant count by 8 for display. Worth deciding whether to keep that as a marketing number or show the true figure.

**6. Realtime connection ceiling**
500 viewers each open 2 channels = 1,000 concurrent realtime connections plus the message volume above. This needs to be checked against the Supabase plan's concurrent-connection and messages-per-second limits before the event, not during it.

## What to change

**Phase 1 — required before any 500-person webinar**

- Filter the answers subscription to the current webinar and stop re-downloading everything: keep a local tally and apply each incoming answer incrementally.
- For viewers, do not subscribe to individual answers at all. Viewers only need aggregate results; only the host panel needs the detail.
- Remove the 3-second chat polling loop and rely on realtime, with a single re-sync only when the connection reports an error or the tab regains focus.
- Replace per-reaction counting with a single aggregated count refreshed on a throttle (e.g. at most once every 3–5 seconds) instead of once per event.
- Debounce the participant-count refresh (e.g. at most once every 10 seconds) instead of on every join.

**Phase 2 — throughput and abuse protection**

- Rate-limit chat sending per participant (e.g. 1 message / 2 seconds) client-side and via a database rule, so 500 people cannot flood the table.
- Cap the chat history load to the most recent 50 messages instead of 200.
- Add database indexes on the webinar-id and created-at columns for messages, answers, reactions and participants if not already present.
- Show aggregate poll results to viewers from a single lightweight count instead of the full answer rows.

**Phase 3 — headroom beyond 500**

- Move live counters (viewers, reactions, poll tallies) to a broadcast channel where the host publishes one summary message on a timer, instead of every client computing them from database events. This makes cost flat regardless of audience size.
- Confirm the Supabase plan's realtime connection and message limits, and load-test with simulated clients before the real event.

## Technical notes

- Files involved: `src/hooks/useWebinarRealtime.ts`, `src/components/Webinar/WebinarChat.tsx`, `src/pages/WebinarWatch.tsx`, `src/pages/WebinarHostPanel.tsx`.
- Tables already in the realtime publication: `webinar_interactions`, `webinar_responses`, `webinar_questions`, `webinar_question_upvotes`, `webinar_reactions`, `webinar_participants`, `webinar_messages`.
- The host panel can keep the detailed, per-answer subscriptions — there is only one host, so the amplification problem does not apply there. The changes should apply to the viewer page only.
- Index additions and any rate-limit rule would go through a database migration.

## Verification

- Load test with simulated concurrent clients before the event and observe database and realtime metrics.
- Confirm chat latency stays under ~1 second and poll results settle within a few seconds at target load.

## Enrollment SMS
- [x] Send a real approved-template test to the consenting mobile; Kavenegar accepted activation message 1740703834 and its delivery record saved successfully
- [x] Enable all three messages for all 15 courses, only for new successful registrations; per-course controls retained; hourly reminders, activation 60 minutes and course start 720 minutes (12 hours)
- [x] Connect the three approved Kavenegar patterns with payment, activation and course-start guards; 14 tests pass including delivery dedupe, provider rejection and fresh activation stop
- [x] Implement 24-hour single-use short course login at l.rafiei.co/s/:code; browser verified saved test enrollment/session redirects to Boundless Taste and mobile replay is rejected; test records removed
- [ ] Verify signed-in course editor controls (external Supabase cannot mint the current user's admin session)
- [ ] Verify published l.rafiei.co short route after publishing the website changes (preview course login verified)

## Hub shared authentication
- [x] Repair verified Hub linking blocked by an unconfirmed phone-only duplicate; preserve both accounts' histories; seven rollback checks pass
- [ ] Confirm live account.link and me.enrollments for source user 3 after a fresh Hub login (previous five-minute link authorization expired)
- [x] Implement and verify read-only account.resolve, identity_sync capability, and idempotent verified account.link
- [x] Add server-only password/OTP authentication, atomic single-use exchange and proof-bound account linking at the unchanged Hub endpoint; no implicit account creation or merging
- [x] Verify hosted HTTP password/exchange/link, concurrent OTP/ticket consumption, replay/expiry, five attempts, hourly sends/resend gap, independent abuse limits and scoped nonempty saved ticket history; advertise only tested methods
- [x] Complete real email OTP round trip: Gmail sent, user provided fresh code securely, existing account exchanged successfully, OTP/ticket replays both rejected; email_otp true and temporary test code secret deleted
- [ ] Verify real SMS OTP delivery/receipt (requires a consenting Iranian mobile; keep sms_otp false)
- [ ] Verify actual user's full historical records after their real Hub identity is linked (requires successful email proof and real Hub identity; QA history verified, real account never linked to invented Hub ID)

## Kavehnegar login documentation
- [x] Write and validate a reusable Persian Kavehnegar OTP login guide for Rafiei Hub services, covering provider setup, shared API contracts, secure verification, account linking, sessions, errors and acceptance tests

## Rafiei Hub API
- [x] Confirm exact response shapes from Hub docs/hub-api/README.md; user supplied matching contract permitting edge-function transport
- [x] Securely request HUB_SHARED_SECRET
- [x] Implement authenticated user mapping, all 14 action adapters and existing activity/analytics logging
- [x] Deploy contract-approved hub-api edge-function transport; document optional academy-domain routing (static hosting cannot provide server routes)
- [x] Verify all 40 saved tests: shared-secret rejection, identity conflict rejection, free enrollment, complete/uncomplete progress, ticket delivery, payment-link creation and real Esanj scoring with saved result readback; current preview build is clean
- [ ] Enable Esanj tests whose provider JSON omits readable question/option text (requires provider content access; -2 currently returns blank titles/null labels)

## Rafiei Pay reconciliation
- [x] Diagnose approved gateway payments that remain pending in enrollments: confirmed real verified provider payments stored as failed and no Rafiei Pay monitor
- [x] Repair trusted verification, callback selection and recovery using the existing verification flow; pending/outage responses never mark enrollments failed, saved provider reference cannot be replaced by client input
- [x] 8 payment tests and 3 callback tests pass; 171 provider references checked, 14 confirmed enrollments recovered; real callback UI shows success, uses Rafiei Pay rather than direct Zibal, and has no runtime errors
- [ ] Reconcile 113 legacy pending/failed registrations lacking any stored provider payment ID (requires provider evidence/payment identifiers; none in request logs)
- [x] Confirm Rafiei Pay callback domain: user chose academy.rafiei.co; current callbacks stay unchanged

## Bot menu cleanup
- [x] Add default-off form visibility control and filter bot form menus; all 9 existing forms remain unselected
- [x] Share public inline menus and move privileged actions to persistent keyboards
- [x] 31 tests pass; both webhooks deployed; real Telegram start updates the 5-row privileged keyboard and admin button webhook accepts the request (Bale live UI and authenticated form editor not visually verified)

## Telegram enrollment reports
- [x] Default to numeric list with list/chart switcher and chronological line chart; 6 tests pass, real monthly list/line totals both 1223, component verified at desktop and 430px mobile (full authenticated admin page unavailable)
- [x] Add course enrollment bar chart using accurate counts; verify the component with real day/month data at desktop/mobile widths (full authenticated admin page unavailable)
- [x] Simplify Telegram/admin reports to nonzero courses plus a small zero summary; 24 tests pass and deployed Telegram delivery confirms 36 total, 2 listed courses and 13 zero courses
- [x] Verify report counts against dashboard enrollment records in fixed intervals: hour 1, week 350, day 36 (30 Boundless Taste + 6 Iran class); no mismatch reproduced
- [x] User confirmed the count discrepancy is resolved
- [x] Remove dashboard's 1000-row cap, prevent stale/partial counts, and verify 22 tests plus identical live monthly totals: dashboard loader 1223, exact count 1223, database per-course sum 1223, delivered Telegram report 1223
- [x] Add a persistent report button independent of account linking; 19 tests passed, deployed webhook accepted button/period selection, and buttons delivered to three authorized accounts
- [ ] Deliver the button to 1222139555 after that recipient starts the bot (Telegram currently returns chat not found; automatic button setup on start is implemented)
- [x] Add per-course registration reports for one hour, day, week, 30 days and custom Tehran date ranges
- [x] Grant report management to 100554898 and read-only access to 1222139555 plus existing admin and manager accounts linked to Telegram
- [x] Verify 16 tests, access grants, unsigned request rejection and real delivery of all 15 courses with totals matching the database

## Instagram direct enrollment
- [x] Add optional Instagram activation followups to the existing scheduler and course editor; eight fixture tests pass for ownership, activation stop and provider rejection; existing claims and delivery logs reused
- [ ] Verify real Instagram followup delivery and signed-in course editor (requires an authorized admin preview session and a consenting test Instagram conversation; sandbox admin page denies access)
- [x] Make email optional for trusted free-course direct enrollment, keep website validation unchanged, store missing email as null and skip recipient email delivery; 17 targeted tests pass
- [x] Connect form 10424 on Instagram account 210093 to the existing free Boundless Taste enrollment flow, preserving form 9808
- [x] Repair sparse form response enrichment: real response 4368140 verified under page 210093/form 10424 and conversation 6382167437 owner rez.raf
- [x] Real form created completed enrollment a0326dfe-6d7b-4715-83dd-63adfcd58a3f with null email; initial delivery failed, existing activation manually sent with documented JSON and read back as message 7393482235; event marked completed to stop duplicates
- [x] Repair shared reply transport to documented JSON and use the same activation's short bot deep link for long prefilled URLs; 17 tests pass (a second fresh automatic form completion has not been exercised)
- [x] Build authenticated NovinHub event receiver and durable processing with retries active only while pending
- [x] Add course/form/keyword rules and delivery history to Social CRM settings
- [x] Reuse course enrollment, access, email and bot activation flows for free courses; paid courses remain payment-gated
- [x] Verify six rule tests, authenticated event acceptance, duplicate handling, queue drain and editor rendering with sample data
- [x] Verify live NovinHub webhook reception; message events reach the existing queue

## Call center completion
- [x] Verify real incoming webhook delivery: 12 processed provider events across all five event types
- [ ] Verify provider API connection (real report and sync requests return provider HTTP 500)
- [x] Repair scheduler authentication and bounded background processing; observed completed recording/follow-up/attribution jobs and correctly recorded provider sync failure
- [x] Finish capture-only routing settings, safe simulator and captured-request viewer
- [x] Add call reporting with correct question date defaults, webhook-only live status and paginated customer history
- [x] Repair agent outcomes, Tehran follow-up dates, sync messages and banner recovery; remove unauthorized automatic UI sync
- [x] Run 12 security/routing/phone/time tests, check deployed functions and confirm clean preview compilation
- [ ] Verify signed-in admin routing/outcome/follow-up UI end-to-end (external authentication has no injectable session)
- [ ] Connect read-only MCP (requires provider connection URL and credential)
- [ ] Enable production Call Control only after provider response contract and staged verification

## Boundless Smart Test V2 conversational rebuild
- [x] Correct duplicate lead cleanup and test one record per user/course without deleting enrollment history (live admin check unavailable for external authentication)
- [x] Audit complete V1 journey, content, and reusable media
- [x] Audit V2 contracts, AI flow, persistence, result, and admin
- [x] Approve implementation plan for conversational journey
- [x] Implement dynamic scenes, reactions, education, objections, commitments, diagnosis, and offer
- [x] Verify five materially different personas on mobile and desktop

## Lesson assignments
- [x] Make lesson assignments prominent directly below video in both lesson experiences
- [x] Correct Persian single-choice direction and alignment
- [x] Keep AI-reviewed assignments open, scroll to feedback, and play a notification sound

## Academy lesson accuracy
- [x] Sort course sections and lessons by their configured order
- [x] Use saved lesson progress instead of generated completion states
- [x] Keep completed lesson titles readable in dark mode

## Gamification reliability
- [x] Show the global countdown throughout the academy and LMS layouts
- [x] Resolve both numeric and Google-authenticated student identities
- [x] Recover access windows for returning completed enrollments
- [x] Retry failed delivery channels without duplicating successful messages
- [x] Verify deployed status, reminder scheduler, identity mapping, and channel retry tracking

## Enrollment activation experience
- [x] Replace alarmist activation messaging with a calm, transparent confirmation flow
- [x] Show the enrolled course's real lesson list as locked until Telegram activation

## Course gamification settings save
- [x] Redesign course editing with seven persistent panels, compact followup/activation scheduling and fixed safe-area save access; verified real course at desktop/current/mobile widths, unsaved changes survive navigation and no runtime errors or horizontal overflow; no live course settings changed during verification
- [x] Save gamification settings with the main course update button
- [x] Restore Boundless Taste gamification to enabled

## Boundless Challenge MVP
- [x] Challenge tables, backend and hourly reminder job
- [x] Admin list, builder (days/variants/rules/notifications), participants, preview and coverage check
- [x] JSON import (create/update, validation, preview, rollback), export, template and guide
- [x] Student pages /challenges and /challenges/:slug with existing assignment card inline
- [ ] Build the first 30-day Boundless Sales Challenge JSON (waiting on content)
- [x] Sync challenge onboarding fields and labels with the selected form and match the public form experience
- [x] Redesign academy (home/courses, enrollment/payment, student panel) — black/white premium glass

- [x] Messenger redesign (Telegram-like) + RTL/dark/tap-menu/input fixes
- [x] Messenger <-> Telegram two-way sync (private, support, group mentions/replies)
- [ ] Live Telegram reply round-trip test (needs a real linked account)

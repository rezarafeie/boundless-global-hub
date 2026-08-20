# Iran Mode Standby — Disaster-Recovery Inventory (inspection only)

Read-only audit of the repo. No files, database, or deployments were changed.

## 1. Supabase client initialization / config locations

| Location | What it does |
|---|---|
| `src/integrations/supabase/client.ts` | Single browser client. **URL and anon key are hardcoded string literals** (lines 5-6), not read from env. |
| `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — present but only referenced in 2 places in `src`. |
| `supabase/config.toml` | `project_id`, api/db/storage/auth ports, and ~90 `[functions.*] verify_jwt = false` entries (236 lines). |
| `supabase/functions/_shared/supabase.ts` | Service-role client for edge functions from `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. |
| ~80 edge functions | Each calls `createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))` inline (83 / 80 occurrences). |

**Hardcoded `https://ihhetvwuhqohbfgkqoxw.supabase.co` in 10 frontend files** — these are the blockers for a second environment:
`src/lib/webhookService.ts` (2), `src/lib/analyticsTracker.ts`, `src/integrations/supabase/client.ts`, `src/pages/Dashboard.tsx`, `src/components/SmartTest/SmartTestRunner.tsx`, `src/components/Chat/TelegramAuthPanel.tsx`, `src/pages/InvoiceView.tsx`, `src/pages/InvoicePaymentCallback.tsx`, `src/pages/FormView.tsx`.
Also hardcoded in edge functions (6 occurrences) plus one foreign project `buicdtvcecydwzornodw.supabase.co`.

## 2. Direct frontend Supabase calls (approximate counts)

Totals across `src`: `.from` 138, `.functions` 92, `.rpc` 40, `.storage` 34, `.auth` 9, realtime `.channel` in 25 files.

Grouped by feature area:
- **Admin (CRM, accounting, call center, social, webinar admin)** — `src/components/Admin/*` + `src/pages/Admin/*`: ~110 `.from`, ~38 `.functions`, ~15 `.rpc`, ~14 `.storage`. Heaviest: `Accounting/AccountingInvoices.tsx`, `Accounting/AccountingCommissions.tsx`, `FormsManagement.tsx`, `Admin/Social/SocialPlanner.tsx`.
- **Messenger / chat** — `src/components/Chat/*`, `src/lib/privateMessageService.ts`, `src/lib/supportMessageService.ts`: 7 `.functions`, 4 `.storage`, 2 `.rpc`, 7 realtime cleanups.
- **Webinar** — `src/pages/WebinarHostPanel.tsx` (9 `.from`), `src/components/Webinar/*` (9 `.from`), `src/hooks/useWebinarRealtime.ts`.
- **Enrollment / payment** — `src/pages/Enroll.tsx`, `EnrollSuccess.tsx`, `EnrollmentDetails.tsx`, `AdminEnrollmentDetails.tsx`, `ManualPaymentSection.tsx`, `InvoiceView.tsx`, `InvoicePaymentCallback.tsx`: ~15 `.functions`, several `.storage`.
- **Auth / session** — `src/contexts/AuthContext.tsx` (3 `.auth`), `src/pages/Auth.tsx` (2), `src/lib/unifiedAuthService.ts`, `src/lib/rafieiAuth.ts` (4 `.functions` + 3 `.rpc`), `src/components/Auth/GoogleAuth.tsx`.
- **Tests / assessment** — `src/lib/esanjService.ts` (9 `.functions`), `src/pages/SmartTest.tsx`, `src/components/SmartTest/SmartTestRunner.tsx` (raw fetch to functions URL).
- **Notifications** — `src/hooks/useNotificationService.ts`, `useEnhancedNotificationService.ts`, `src/contexts/NotificationContext.tsx` (7 `.rpc` + realtime).
- **Public/landing** — `src/pages/JobApplication.tsx`, `Internship.tsx`, `LeadRequest.tsx`, `ConsultationBooking.tsx`, `Unsubscribe.tsx`, `FormView.tsx`.

## 3. Edge functions (104 directories, `supabase/functions/`)

By domain:
- **Payments (14)**: `zarinpal-request/verify`, `zibal-request/verify`, `rafieipay-request/verify`, `invoice-zarinpal-payment/verify`, `invoice-zibal-payment/verify`, `approve-manual-payment`, `fix-payment-status`, `payment-status-monitor`, `update-dollar-prices` (Tetherland FX).
- **Telegram (10)**: `telegram-webhook` (the giant bot: menus, posts, follow-ups, reports, webinar registration), `telegram-notify`, `telegram-set-webhook`, `telegram-login-start/status`, `telegram-otp-verify`, `telegram-finalize-registration`, `telegram-form-analyze`, `telegram-enrollment-followup`.
- **AI (13)**: `ai-admin-greeting`, `ai-lead-scoring`, `ai-lead-scoring-job`, `ai-weekly-analysis`, `ai-form-generator`, `ai-form-analyze-stream`, `ai-generate-assignment`, `ai-feedback-assignment`, `analyze-smart-test`, `analyze-boundless-test`, `analyze-daily-reports`, `analyze-call`, `lead-request-ai`.
- **Call center / DaftareShoma (10)**: `daftareshoma-outgoing-call`, `daftareshoma-webhook`, `daftareshoma-test-connection`, `sync-daftareshoma-calls`, `call-center-data`, `call-attribution`, `process-call-recording`, `process-call-automations`, `reprocess-call`, `transcribe-call` (OpenAI Whisper).
- **Social / NovinHub (13)**: `social-novinhub-connect`, `social-inbox-sync`, `social-comments-sync`, `social-posts-sync`, `social-fetch-messages`, `social-fetch-comments`, `social-send-message`, `social-comment-reply`, `social-ai-reply`, `social-auto-reply-cron`, `social-publish-cron`, `social-analytics-aggregate`, `social-lead-from-conversation`.
- **Email (8)**: `send-transactional-email`, `preview-transactional-email`, `send-enrollment-email`, `send-test-email`, `test-enrollment-email`, `handle-email-suppression`, `handle-email-unsubscribe`, `gmail-oauth` / `test-gmail-auth`.
- **Auth / OTP / SSO (6)**: `send-otp`, `verify-otp`, `generate-sso-tokens`, `admin-enrollment-access`, `esanj-auth`, `check-esanj-employee`.
- **Esanj psychometrics (8)**: `esanj-employee`, `esanj-questionnaire`, `esanj-html-questionnaire`, `esanj-result`, `esanj-submit-test`, `esanj-test-bank`, `esanj-test-status`, `test-esanj-api`.
- **Enrollment / webhooks / licensing (9)**: `create-enrollment`, `send-enrollment-webhook`, `send-user-webhook`, `send-lead-request-webhook`, `submit-web-form`, `create-spotplayer-license`, `generate-boundless-discount`, `consultation-webhook`, `consultation-action`, `consultation-telegram-notify`.
- **Follow-up crons (5)**: `support-activation-followup-cron` / `-test`, `support-activation-create`, `webinar-followup-cron` / `-test`.
- **Notifications / analytics (5)**: `send-push-notification`, `send-onesignal-notification`, `track-analytics`, `save-analytics-report`, `delete-message-public`.

13 migrations schedule work through `pg_cron` + `pg_net` calling these functions over HTTPS.

## 4. Storage buckets referenced in code

`social-media` (8 refs, social post media), `messenger-files` (chat attachments), `form-uploads`, `call-recordings`, `assignment-uploads`, `avatars`. Plus `/lovable-uploads/*` static assets served from the app host.

## 5. Auth flows / providers / OTP / session assumptions

- **Primary auth is custom, not Supabase Auth.** `chat_users` + `user_sessions` with tokens created in `src/lib/supabase.ts` (`chatUserService.createSession/validateSession`) and `src/lib/rafieiAuth.ts`; role checks via `user_roles` and RPCs.
- **Supabase Auth is used only for Google OAuth** (`signInWithOAuth` in `src/components/Auth/GoogleAuth.tsx` and `UnifiedMessengerAuth.tsx`), plus `getSession`/`onAuthStateChange`/`signOut` in `src/contexts/AuthContext.tsx` and `src/pages/Auth.tsx`, and one `signInWithPassword` in `src/lib/unifiedAuthService.ts`. Toggleable via `google_auth_settings` / `useGoogleAuthSettings`.
- **OTP**: SMS OTP through `send-otp` / `verify-otp` using Kavenegar (`api.kavenegar.com` — Iran-hosted, survives an outage), stored in `otp_verifications`.
- **Telegram login**: `telegram-login-start/status`, `telegram-otp-verify`, `sso_tokens` (multi-use, 1-year) and `webinar_login_tokens`.
- **Session assumptions**: session token in localStorage, validated server-side via RPC; edge functions mostly run with `verify_jwt = false` and validate manually. This is good news — very little depends on GoTrue.

## 6. Realtime subscriptions (25 files)

Chat/messenger: `src/components/Chat/{MessengerChatView,PrivateChatView,SupportChatView,SuperGroupTopics,SuperGroupSidebar,SuperGroupTopicSelection}.tsx`, `src/hooks/{useRealtimeChatUpdates,useChatMessagesByTopic,useChatTopics,useRealtime}.ts`.
Notifications: `src/hooks/{useNotificationService,useEnhancedNotificationService}.ts`, `src/contexts/NotificationContext.tsx`.
Webinar: `src/hooks/useWebinarRealtime.ts`, `src/components/Webinar/WebinarChat.tsx`, `src/hooks/useRafieiMeet.ts`.
Admin/dash: `src/components/Admin/{AdminDashboard,PopularCoursesCard,AILeadScoringJob}.tsx`, `src/components/Dashboard/AdminDashboard.tsx`, `src/pages/{EnrollmentAdmin,EnrollPending}.tsx`, `src/pages/Admin/Social/SocialNotifications.tsx`, `src/components/Course/CourseNotifications.tsx`, `src/components/TelegramEnrollmentActivation.tsx`.

## 7. External services that break without international internet

**Hard breaks (fully outside Iran):**
- Supabase itself (`*.supabase.co`) — DB, storage, functions, realtime.
- Lovable AI Gateway `ai.gateway.lovable.dev` (21 refs) — all 13 AI functions.
- OpenAI `api.openai.com` — `transcribe-call` (Whisper), `analyze-call`.
- Telegram `api.telegram.org` + `t.me` (45 links in `src`) — bot, business follow-ups, SSO deep links, webinar registration.
- Google: `oauth2.googleapis.com`, `gmail.googleapis.com`, `accounts.google.com`, `www.googleapis.com` — Google login and Gmail sending; `meet.google.com` consultation links.
- OneSignal (`api.onesignal.com` + `cdn.onesignal.com` script in `index.html`) — push.
- NovinHub `api.novinhub.com` — the entire Social CRM (though NovinHub is Iranian, verify reachability).
- `deno.land` (49 imports) and `cdn.jsdelivr.net` (Vazir font in `index.html`), `unpkg.com`, `images.unsplash.com` — build/runtime CDN dependencies.
- `hook.us1.make.com` (6 refs) — recruitment/CRM webhooks.
- `meet.jit.si`, `www.aparat.com` embeds, `ipapi.co` / `get.geojs.io` (IP geolocation for `useIsIranianIP`).

**Survives (Iran-hosted):** Zarinpal, Zibal, RafieiPay, `api.kavenegar.com` (SMS), `coreapi.daftareshoma.com` (telephony), `panel.spotplayer.ir`, `esanj.org`, `rafiei.arvanvod.ir` + `player.arvancloud.ir` (video), `trustseal.enamad.ir`.

## 8. Changes needed to support PRIMARY vs IRAN_STANDBY

Minimal-code approach — one runtime config module, everything else reads from it:

1. **De-hardcode the client.** `src/integrations/supabase/client.ts` reads `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` with the current values only as fallback. Note this file carries a "do not edit, auto-generated" header — introduce `src/integrations/supabase/runtimeConfig.ts` and have the client import from it instead of editing generated content by hand.
2. **Replace the 9 other hardcoded URLs** (section 1 list) with a shared `EDGE_BASE_URL` / `SUPABASE_URL` export from that config module.
3. **Add `VITE_RUNTIME_ENV` = `PRIMARY` | `IRAN_STANDBY`** and a `features` map (ai, telegram, google_auth, onesignal, gmail, novinhub, make_webhooks) so blocked integrations degrade gracefully instead of hanging. There is already a precedent: `useGoogleAuthSettings` and `useIsIranianIP`.
4. **Self-host the CDN assets** currently pulled from jsdelivr/unpkg/OneSignal/Unsplash; bundle the Vazir font locally.
5. **Edge functions**: they already read `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` from env, so they port cleanly. Fix the 6 hardcoded project URLs and the stray `buicdtvcecydwzornodw.supabase.co` reference. Add a shared `env.ts` in `_shared/` exposing `RUNTIME_ENV` plus per-provider base URLs (AI gateway, Telegram, OpenAI) so an Iran run can swap to a domestic AI provider or a proxy.
6. **Deployment**: two Vite builds from the same source with different `.env` files — one to the current host, one to Arvan Cloud static/object storage; the Iran build points at the self-hosted Supabase stack on Arvan.
7. **Data direction**: one-way replication PRIMARY → IRAN_STANDBY (logical replication or scheduled `pg_dump`), plus storage bucket mirroring for the 6 buckets. Standby stays read-mostly until failover to avoid split-brain.

## 9. What makes self-hosted Supabase hard here

- **`pg_cron` + `pg_net` + `http` extension** are used by 13 migrations and drive the follow-up/sync crons — must be installed and the function URLs rewritten per environment.
- **Hardcoded project URLs inside SQL cron jobs** (the `net.http_post` calls store the full URL and anon key in the job body) — these are per-environment and are not in migrations by design.
- **~90 `verify_jwt = false` entries** in `config.toml` must be reproduced exactly; self-hosted defaults differ.
- **Storage**: 6 buckets plus their `storage.objects` RLS policies and public/private flags; image transformation is enabled in `config.toml` (self-hosted needs the imgproxy service).
- **Google OAuth provider config** lives in the Supabase dashboard, not in the repo — and would not work in Iran anyway.
- **Volume**: ~155 tables, 100+ database functions, 104 edge functions. Deno edge runtime must be self-hosted; `deno.land` imports (49) need vendoring or a mirror.
- **Secrets**: 22 distinct secret names must be re-provisioned on the standby.
- **Realtime** must be enabled per-table in the standby publication to match the 25 subscribing files.
- Some tables have **RLS disabled** (`admin_settings`, `announcements`, `chat_messages`, `notifications`, `user_roles`, several support tables) — an internet-exposed standby with the same anon key is a bigger risk surface than the current setup.

## 10. Lowest-risk staged plan

**Stage 0 — Freeze the inventory (no code changes).** Snapshot the secret list, cron job definitions, bucket policies, and the `verify_jwt` matrix into a runbook document.

**Stage 1 — Config extraction only (safe, no behavior change).** Add `src/integrations/supabase/runtimeConfig.ts`; replace the 10 hardcoded frontend URLs; verify PRIMARY behaves identically. Zero risk if the fallback equals the current constant.

**Stage 2 — Feature flags.** Introduce `VITE_RUNTIME_ENV` and the feature map; wrap AI, Telegram, Google-auth, OneSignal, Gmail and Make.com call sites in guards that fail fast with a Persian user message instead of hanging. On PRIMARY all flags stay on.

**Stage 3 — Local asset independence.** Self-host Vazir font, OneSignal SDK gating, remove Unsplash/unpkg from runtime paths.

**Stage 4 — Stand up self-hosted Supabase on Arvan (no traffic).** Schema + extensions + buckets + `verify_jwt` matrix. Restore a `pg_dump` snapshot. Do not point any users at it.

**Stage 5 — Edge function portability.** Vendor `deno.land` imports, add `_shared/env.ts`, deploy the Iran-safe subset only: payments (Zarinpal/Zibal/RafieiPay), OTP via Kavenegar, DaftareShoma call center, Esanj, SpotPlayer, enrollment/invoice/core CRUD. Leave AI/Telegram/Google/OneSignal/NovinHub functions deployed but flag-disabled.

**Stage 6 — Replication + storage mirror.** One-way PRIMARY → standby, scheduled, with a measured lag report. Rehearse a restore.

**Stage 7 — Dark launch on Arvan.** Publish the IRAN_STANDBY build to an internal-only hostname; run a scripted smoke test (login by OTP, enrollment, payment callback, invoice view, call center).

**Stage 8 — Failover runbook + drill.** DNS/CNAME switch procedure, cron re-pointing, secret rotation checklist, and a documented back-sync path for data written on the standby during an outage.

Recommended order of value: Stages 1-3 are pure repo hygiene and useful regardless; Stage 4 onward is infrastructure work that can proceed in parallel without touching production.

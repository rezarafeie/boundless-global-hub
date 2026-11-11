# Call Center audit, repair and DaftareShoma upgrade

## What the audit found

Already built: call history import, ringing alerts, click-to-call, customer matching, recordings, Persian transcription, AI sales analysis, follow-ups, phone-assisted sales attribution.

Serious problems:
- **Security hole:** six background jobs (sync, recording, transcription, AI analysis, automations, attribution) can be triggered by anyone without signing in. That includes paid AI usage.
- Sales agents can open recordings, transcripts, follow-ups and call links that belong to other agents.
- The webhook accepts unsigned requests when no secret is set. Failed events are never retried, and late events can overwrite a call that already finished.
- The connection test checks a different credential from the one that sync uses, so "connected" does not mean sync works.
- Follow-up due dates from the call detail page are lost (`dueAt` vs `due_at`).
- Live banner: calls that are in progress or transferred drop off the banner, and polling stops for good after 5 errors.
- Customer matching uses only the last 9 digits, with no ordering. That can link a call to the wrong person and can overwrite manual links. Persian numerals are dropped.
- Sync records success even when later pages fail. Large imports skip CRM matching and missed-call follow-ups.
- AI analysis can get stuck on "analyzing". The pending queue can starve older calls, and dispatch is fire-and-forget.
- No scheduled jobs are registered, so automatic sync and processing never run.
- Attribution uses the enrollment's last-edit time instead of payment time, and can count unpaid enrollments.
- Non-admins trigger admin-only syncs from the calls list.

## What DaftareShoma officially supports (verified)

- REST API, Bearer token, only 3 operations: call report search, outgoing call, recording URL.
- Notification webhook: 5 events (incoming started/ended, transfer started/completed, outgoing ended).
- **Call Control:** panel setup and a PSK are documented. The **request format, how the PSK is verified, and the allowed response actions are not published.**
- **Live monitoring:** visible only in their dashboard; **there is no API for it.**
- **MCP:** read-only call reports. The server URL and tool names are visible only in your panel.
- **n8n:** a hosted n8n instance on the corporate plan or higher. It uses the same 5 webhook events and offers nothing new.

## Plan

**Step 1 – Security and repair (no new features)**
- Internal jobs accept only a server-to-server secret or a verified admin session. Body flags like `internal`/`cron` are no longer trusted.
- Enforce agent ownership on every call action. Transcripts and reprocessing require their own permissions.
- The webhook is required to have a secret. Add event ordering, a retry queue for failed events, and atomic follow-up deduplication.
- Repair: connection test, sync error handling, the dueAt bug, the live banner states, and the stuck "analyzing" status. Attribution moves to payment time and paid enrollments only. Rewrite the pending queues.
- Matching: full normalized phone comparison, Persian digits, deterministic ordering, an "ambiguous" status instead of a silent link, and manual links are never overwritten.
- Register cron jobs for sync, recordings and overdue follow-ups, respecting the on/off settings.

**Step 2 – Routing (safe staged rollout)**
- A Call Routing section in Call Center settings covering all the rules you listed: student, assigned salesperson, consultant, webinar lead, unknown caller, business hours, fallback, priority. It reuses existing agents and extensions.
- A routing **simulator**: enter a phone number and see the decision, with no real call.
- A Call Control endpoint in **capture-only mode**. It saves exactly what DaftareShoma sends so we learn the real format. It sends routing answers only after we confirm the response format with DaftareShoma (from support or the captured samples), and you turn it on per line.

**Step 3 – Dashboard and agent workflow**
- Dashboard: live activity (labeled "from webhook events", never fake), today's stats, sales (by agent, follow-ups, high intent, phone-assisted revenue), and AI insights (objections, coaching, calls needing attention). All filters use real data.
- Lead view: call, then pick the outcome, add a note and schedule a follow-up in one panel. Full call history in the customer profile.

**Step 4 – AI questions about calls**
- The admin AI answers questions like "calls today", "top agents" and "unanswered yesterday" from synced data. That is fast and costs nothing extra.
- DaftareShoma MCP is optional, added later once you share the server URL. n8n is skipped because the same events are already handled here.

**Step 5 – Tests and report**
- Tests for phone normalization, matching, deduplication, routing decisions and fallback, permissions, and the webhook secret. Then a final report.

## What I need from you
- Confirm that `DAFTARESHOMA_PORTAL_TOKEN`/`API_TOKEN` are current. I'll check them with the fixed connection test.
- Later: the Call Control PSK, and the response format from DaftareShoma support.

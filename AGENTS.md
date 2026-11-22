# Project architecture rules

- Lead deduplication is non-destructive: mark repeated enrollments for lead-list exclusion and retain enrollment dependencies, because payments, access and CRM history must survive cleanup.
- Lead views share `uniqueCourseLeads` for person/course identity matching after access-scoped loading, because duplicate enrollment records must not inflate lead lists or expose other agents' data.
- Instagram enrollment automation uses server-only rule and event tables, verified admin sessions, and an authenticated durable webhook queue; enrollment and activation delegate to existing functions so access and notifications follow the website lifecycle.
- Call center operations reuse the existing gateway and processing functions with server-validated roles and ownership; provider routing stays capture-only until its contract and staged rollout are verified.
- Call-center scheduled HTTP work requires a server-only credential, never a public API key or client body flag, because it can import private recordings and incur AI costs.
- Call transcripts keep the raw speech-to-text in raw_transcript; the saved transcript and speaker segments come from a length-guarded audio-aware AI correction, because corrections must never rewrite what was said.
- Telegram enrollment reports use a server-only numeric-chat ACL, private verified webhook updates and a service-only aggregate RPC; delegated readers cannot manage access or read student identities, report counts use enrollment creation time without the API row cap, and the persistent report button works without website-account linking while preserving the ordinary start flow.
- Dashboard course enrollment counts load every bounded, deterministically ordered page and use the same registration-record and half-open time-range definition as Telegram; only the latest successful request may display totals, so row caps, failed pages and stale period responses cannot masquerade as complete current counts.

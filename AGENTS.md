# Project architecture rules

- Lead deduplication is non-destructive: mark repeated enrollments for lead-list exclusion and retain enrollment dependencies, because payments, access and CRM history must survive cleanup.
- Lead views share `uniqueCourseLeads` for person/course identity matching after access-scoped loading, because duplicate enrollment records must not inflate lead lists or expose other agents' data.
- Instagram enrollment automation uses server-only rule and event tables, verified admin sessions, and an authenticated durable webhook queue; enrollment and activation delegate to existing functions so access and notifications follow the website lifecycle.
- Call center operations reuse the existing gateway and processing functions with server-validated roles and ownership; provider routing stays capture-only until its contract and staged rollout are verified.
- Call-center scheduled HTTP work requires a server-only credential, never a public API key or client body flag, because it can import private recordings and incur AI costs.
- The call-center scheduler accepts only wakeups for bounded, service-only jobs pre-enqueued by the database timer; internal processing still requires a server secret, avoiding credentials in cron SQL.- Call transcripts keep the raw speech-to-text in raw_transcript and store only a length-guarded AI spelling correction in transcript, because corrections must never rewrite what was said.

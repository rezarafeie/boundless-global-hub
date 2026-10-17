# Project architecture rules

- Lead deduplication is non-destructive: mark repeated enrollments for lead-list exclusion and retain enrollment dependencies, because payments, access and CRM history must survive cleanup.
- Lead views share `uniqueCourseLeads` for person/course identity matching after access-scoped loading, because duplicate enrollment records must not inflate lead lists or expose other agents' data.
- Instagram enrollment automation uses server-only rule and event tables, verified admin sessions, and an authenticated durable webhook queue; enrollment and activation delegate to existing functions so access and notifications follow the website lifecycle.
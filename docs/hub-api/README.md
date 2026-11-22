# Rafiei Academy Hub API

The shared secret is stored as `HUB_SHARED_SECRET` in both projects. Only the Hub server calls this API; never put this secret in a browser or mobile app.

## Production transport

This academy is a React/Vite application with static Lovable hosting, not a TanStack server application. It implements the **edge-function transport explicitly allowed by the Hub contract**:

```
GET  https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api/health
POST https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api/{action}
```

If the Hub builds URLs by appending `/api/public/hub/{action}`, set its academy base to:

```
https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/hub-api
```

The resulting `/hub-api/api/public/hub/{action}` path is also accepted. No Hub changes are made from this project. `/api/public/hub/*` on `academy.rafiei.co` is **not** a production server route on this static host; that exact origin would require an external reverse proxy or a separately approved server-framework migration. Do not use Vite proxies or `_redirects` as a production solution.

## Headers

- `Authorization: Bearer <HUB_SHARED_SECRET>` — required for health and every action; mismatches return 401 using a fixed-length digest comparison.
- `X-Hub-User: <encodeURIComponent(JSON.stringify({hub_user_id,email,name}))>` — required for user actions; optional on catalog actions. Email must be verified by the Hub.
- `X-Hub-Source: rafiei-hub` — enforced when provided; the server always logs this source.
- `Content-Type: application/json`

Responses are `{"data": ...}` or `{"error":"Persian message"}`. Invalid input: 400; access denied: 403; identity conflict: 409; missing test payment: 402; provider temporarily unavailable: 502. Successful health returns `{"data":{"ok":true}}`.

## Actions

| Action | Payload | Data |
|---|---|---|
| courses.list | `{}` | `[{slug,title,summary,image_url,category,badge,is_free,is_coming_soon,price_toman}]` |
| course.get | `{slug}` | course plus `lessons:[{id,title,body,video_url,file_url,duration_min,is_preview,section}]` |
| me.enrollments | `{}` | `[{slug,title,image_url}]` |
| course.enroll | `{slug}` | `{enrolled:true}` or `{payment_url}` |
| me.progress | `{slug}` | `['lessonId', ...]` |
| lesson.complete / lesson.uncomplete | `{lesson_id}` | `{ok:true}` |
| tests.list | `{}` | `[{id,slug,title,description,duration_min,question_count}]` |
| test.get | `{slug}` | `{slug,title,description,duration_min,questions:[{id,text,options:[{value,label}]}]}` |
| test.submit | `{slug,answers:{[id]:value},birth_year,sex}` | `{attempt_id,result_html}` |
| me.tests | `{}` | `[{attempt_id,slug,title,created_at}]` |
| test.result | `{attempt_id}` | `{result_html}` |
| support.create | `{subject,message}` | `{id}` |
| me.tickets | `{}` | `[{id,subject,message,status,created_at}]` |

## Academy behavior

- Server-only `hub_resolve_user` serializes identity linking and rejects conflicting links. It searches `chat_users` and `academy_users` by normalized email, preserving existing account records. New chat accounts use `signup_source='rafiei-hub'`. Hub identity cannot be changed through ordinary client writes.
- The Hub contract contains no phone field. Missing phone is stored as null, never invented. Website enrollment still requires a phone; only an authenticated, mapped Hub free-course enrollment can omit it.
- Free enrollment delegates to `create-enrollment`; paid enrollment delegates to `rafieipay-request` at the server's real effective price. No payment is marked completed before existing provider verification. Already-completed registrations are reused.
- Content is only returned to the mapped user with a completed registration and valid course access window. No lesson preview flag exists in the academy schema; lessons are not guessed to be previews. Locked lessons return empty body and null video/file URLs.
- Completion uses the existing progress table and mission/reward lifecycle. Uncompletion clears the saved completion flag; it does not revoke earned rewards or restart old follow-ups.
- Question rows and answer values use the existing Esanj JSON format. Birth year is Gregorian; sex is `male` or `female`. Answers are checked against all real questions before submission. Paid tests require an unused completed test purchase. Esanj UUIDs and attempts are stored before provider work; successful result HTML is saved before returning success, and `test.result` can recover a delayed result without a new submission.
- Ticket conversations and messages use the existing support system and active default support room; no separate ticket application is created.
- Activity logs include action, mapped academy user, outcome and source, but no credentials, raw test answers or result HTML. Requests without a user are recorded in analytics using a random session identifier.
- Catalog fields not present in the academy data (`category`, `badge`, test duration and test question count) are null rather than fabricated.

## Verification

Run `deno test supabase/functions/hub-api/hub-policy_test.ts` for contract validation. Hosted integration checks must supply the secret from the environment without printing it. A paid checkout URL test does not prove a payment succeeded; an Esanj questionnaire check does not prove employee creation or scoring succeeded.
# Boundless Smart Test — Phase 1: Exact Port

Re-implement the existing WordPress/Gravity Forms test (`تست هوشمند بدون مرز`) inside the Academy as a modern, RTL, mobile-first multi-step quiz. Phase 1 = faithful port of the same questions, branching, copy and outcomes. Phase 2 (later) will layer AI personalization on top.

## What the test does (recap from the JSON export)

Main form `تست جامع بدون مرز` collects: name, family, phone, email, employment status, business stance, interest area, mindset, income, age, notes. Branching uses two key answers:

- **Field 19 — interest area** (4 options):
  - فروشگاه اینترنتی → **dropshipping** track
  - آژانس / خدمات → **freelancing** track
  - بازار مالی → **NFT/trading** track
  - آکادمی آنلاین → **academy** track
- **Field 25 — mindset** (2 options): pessimistic (`نگرش ۱`) vs optimistic (`نگرش ۲`).

→ 4 × 2 = **8 result tracks**, each a sub-form (دراپ شیپینگ ۱/۲، فریلنسری ۱/۲، ان‌اف‌تی ۱/۲، آکادمی ۱/۲). Every sub-form follows the same skeleton: prefilled context → ~5 commitment questions (time, expertise, familiarity with the business, willingness to change mindset, willingness to pay the price, ready to see result, perceived value in $, ready to start now) with branching encouragement/objection-handling HTML blocks, an Aparat video, then either:
- **Congrats screen** → CTA to buy the Boundless course (with price), or
- **Rejected screen** → retry button.

## Deliverable in Phase 1

A new route `/assessment/boundless-smart-test` (and a card in the existing Assessment Center) that runs the full flow end-to-end with the exact copy, choices, branching rules, Aparat video embeds, congrats/rejected outcomes, and a payment CTA pointing to the existing Boundless course checkout. Submissions stored in Supabase for follow-up.

## Architecture

```text
src/
  pages/Assessment/BoundlessSmartTest.tsx        // route + shell
  components/SmartTest/
    SmartTestRunner.tsx                          // step engine (page-by-page, conditional visibility)
    SmartTestField.tsx                           // renders text/radio/email/number/html
    SmartTestProgress.tsx                        // progress bar + back/next
    ResultCongrats.tsx                           // pass screen + CTA
    ResultRejected.tsx                           // fail screen + retry
  data/boundlessSmartTest/
    mainForm.ts                                  // ported field list + conditions for form 2
    tracks/
      dropshipping1.ts  dropshipping2.ts
      freelancing1.ts   freelancing2.ts
      nft1.ts           nft2.ts
      academy1.ts       academy2.ts
    index.ts                                     // routing: (interest, mindset) → track
    types.ts                                     // Field, Choice, Condition, Page, Track
  lib/smartTestEngine.ts                         // evaluate conditional logic, compute pass/fail
```

Data model (TypeScript only — no SQL changes for the form definition):

```ts
type Condition = { all?: Rule[]; any?: Rule[] };
type Rule = { field: string; op: 'is'|'isNot'|'contains'; value: string };
type Field =
  | { kind:'text'|'email'|'number'|'tel'; id:string; label:string; required?:boolean; placeholder?:string; showIf?:Condition }
  | { kind:'radio'; id:string; label:string; choices:{label:string;value:string}[]; required?:boolean; showIf?:Condition }
  | { kind:'html'; id:string; html:string; showIf?:Condition }
  | { kind:'video'; id:string; aparatId:string; showIf?:Condition };
type Page = { id:string; fields:Field[] };
type Track = { id:string; title:string; pages:Page[]; passWhen:Condition; rejectWhen:Condition };
```

The engine walks pages sequentially, hides fields whose `showIf` doesn't match current answers, validates required fields, and finally evaluates `passWhen` / `rejectWhen` to decide which result screen to render.

## Persistence (Supabase)

Reuse existing patterns; add ONE new table for submissions (kept simple — no per-answer rows in Phase 1):

- `boundless_smart_test_submissions`
  - domain fields: `track_id`, `full_name`, `phone`, `email`, `interest`, `mindset`, `outcome` (`passed`|`rejected`|`abandoned`), `answers` (jsonb), `chat_user_id` (nullable FK to `chat_users.id` for logged-in users)
  - Access rules (plain English):
    - Anyone (including not-logged-in visitors) can create a submission.
    - Logged-in chat users can read their own submissions.
    - Admins can read all submissions.
  - Plus standard `id` / `created_at` / `updated_at`.

(Schema is added via a Supabase migration; correct GRANTs + RLS will be included.)

## Outcome → payment CTA

Congrats screen reads the Boundless course price/slug from the existing `courses` table (slug used today on the Boundless landing page) and links to its existing checkout. No new payment logic.

## Out of scope for Phase 1 (saved for Phase 2)

- AI personalization of responses / copy.
- Admin dashboard for submissions (data is in Supabase; admins can query).
- A/B testing or variant editing UI.
- Importing legacy submissions from WordPress.

## Open questions before I build

1. Course slug to link to from the congrats CTA — is it the existing `boundless-taste` course, or a different "Boundless" paid course in the academy?
2. For the 8 Aparat videos referenced in the sub-forms, should I keep the **exact same Aparat IDs** from the JSON export, or do you want to swap them for new ones?
3. Login requirement: allow anonymous test-takers (recommended, matches current WP behavior) or require Academy login before starting?

## Support Activation Followup System

Add tiered followups to nudge buyers who stall at any step of the support-activation funnel. Channels per stage, all delays configurable per course in admin.

### Stages & default rules

| # | Trigger (from `support_activations`) | Delay (default) | Channels |
|---|---|---|---|
| 1 | Purchase created, `status = not_started` (never opened bot) | 1h | Email (Lovable Emails) + SMS (Kavenegar) |
| 2 | `status = opened_bot` (in bot, no support click) | 1h | Telegram bot message (to user in bot) |
| 3 | `status = clicked_support_button` / `pending_manual_confirmation` (clicked, not activated) | 3h | Telegram business chat message (bot posts as business account in @rafieiacademy DM) |

Each stage sends **once**; a second reminder per stage after the same delay again (max 2 per stage, then stop). Delays and per-stage enable flags are editable per course.

### DB migration

New columns on `courses`:
- `support_followup_enabled` bool default true
- `support_followup_stage1_delay_minutes` int default 60
- `support_followup_stage2_delay_minutes` int default 60
- `support_followup_stage3_delay_minutes` int default 180
- `support_followup_stage1_email_subject`, `support_followup_stage1_email_body`, `support_followup_stage1_sms_text`
- `support_followup_stage2_bot_text`
- `support_followup_stage3_business_text`
- `support_followup_max_repeats` int default 2

New columns on `support_activations`:
- `followup_stage1_sent_count`, `stage2_sent_count`, `stage3_sent_count` int default 0
- `last_followup_stage`, `last_followup_at` (last_followup_at already exists)

New table `support_activation_followup_log` (audit) with grants + RLS (admin read).

### Edge functions

1. **`support-activation-followup-cron`** — runs every 5 min via `pg_cron`. Scans `support_activations` joined with `courses` and enrollment, evaluates each stage's delay against `created_at` / `opened_bot_at` / `clicked_support_button_at`, sends any due message via the right channel, increments counters, writes an audit row.
2. **Reuse** `send-enrollment-email` pattern for email; add a small `send-kavenegar-sms` edge function (uses `KAVENEGAR_API_KEY`, `send` endpoint with edit-if-exists pattern per user note).
3. **Telegram business chat**: send via existing bot using `sendMessage` with the user's stored `telegram_id` (regular DM through the bot). Note: true Telegram Business API messaging as the @rafieiacademy account requires a Business Connection; if only bot-DM is available, we use that and label it clearly. I'll implement bot-DM now and leave a hook to swap in `business_connection_id` when set.

### pg_cron schedule
```sql
select cron.schedule('support-followup', '*/5 * * * *',
  $$ select net.http_post(url:='.../functions/v1/support-activation-followup-cron', headers:=..., body:='{}') $$);
```

### Admin UI

- `CourseEdit.tsx` → new "پیگیری پشتیبانی" section with the 3 stage cards (enable toggle, delay input, message editor, subject/SMS fields where relevant).
- `SupportActivations.tsx` → add a "پیگیری‌ها" column showing counts + last stage/time.

### Persian message drafts (editable per course)

**Stage 1 — Email** (subject) «قدم آخر برای فعال‌سازی دوره {{course_title}}»  
Body: خوش‌آمد + یادآوری کلیک روی دکمه فعال‌سازی پشتیبانی در داشبورد + لینک SSO به دوره.

**Stage 1 — SMS**: «{{name}} عزیز، برای فعال‌سازی پشتیبانی دوره {{course_title}} به داشبورد آکادمی رفیعی مراجعه کنید: academy.rafiei.co»

**Stage 2 — Bot**: «سلام {{name}} 👋 وارد ربات شدی ولی هنوز روی دکمه «فعال‌سازی پشتیبانی» نزدی. یه کلیک کافیه تا تیم پشتیبانی دوره {{course_title}} رو برات فعال کنه.» + inline button `فعال‌سازی پشتیبانی`.

**Stage 3 — Business/DM**: «{{name}} جان، پیامت رو دیدیم ولی هنوز فعال‌سازی نهایی نشده. اگر سوالی هست همینجا بنویس تا سریع رسیدگی کنیم 🙏 (دوره: {{course_title}})»

### Secrets needed

- `KAVENEGAR_API_KEY` — user must add.
- Email uses existing Lovable Emails / `send-enrollment-email` domain.

### Rollout

1. Migration (columns + audit table + grants + RLS).
2. `send-kavenegar-sms` function + secret request.
3. `support-activation-followup-cron` function + pg_cron schedule.
4. Admin course-edit UI section.
5. Admin dashboard column.

Confirm and I'll start with step 1.
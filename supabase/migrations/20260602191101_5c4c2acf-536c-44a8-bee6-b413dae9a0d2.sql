
-- Add slug to forms
ALTER TABLE public.telegram_forms
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Backfill slugs for existing forms
UPDATE public.telegram_forms
SET slug = COALESCE(
  slug,
  regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g') || '-' || substring(id::text, 1, 6)
)
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_telegram_forms_slug ON public.telegram_forms(slug);

-- Extend submissions for web + lead/crm linking
ALTER TABLE public.telegram_form_submissions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'telegram',
  ADD COLUMN IF NOT EXISTS chat_user_id INTEGER,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS crm_note_id UUID,
  ADD COLUMN IF NOT EXISTS lead_request_id UUID;

-- chat_id was NOT NULL because telegram-only; relax for web submissions
ALTER TABLE public.telegram_form_submissions
  ALTER COLUMN chat_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tfs_chat_user ON public.telegram_form_submissions(chat_user_id);
CREATE INDEX IF NOT EXISTS idx_tfs_phone ON public.telegram_form_submissions(phone);

-- Permit anon SELECT on submissions/answers (for thank-you page lookup by id)
GRANT SELECT ON public.telegram_form_submissions TO anon;
GRANT SELECT ON public.telegram_form_answers TO anon;

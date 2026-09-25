ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS hide_leaderboard boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_daily_checkin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_rewards boolean NOT NULL DEFAULT false;
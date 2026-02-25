
-- =====================================================
-- WEBINAR LIVE INTERACTION SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1) Add live session fields to webinar_entries
ALTER TABLE public.webinar_entries 
ADD COLUMN IF NOT EXISTS iframe_embed_code TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS host_name TEXT,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS allow_late_responses BOOLEAN NOT NULL DEFAULT false;

-- 2) Webinar Participants (links registered users to live sessions)
CREATE TABLE public.webinar_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  interactions_completed INTEGER NOT NULL DEFAULT 0,
  is_active_badge BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(webinar_id, phone)
);

CREATE INDEX idx_webinar_participants_webinar ON public.webinar_participants(webinar_id);
CREATE INDEX idx_webinar_participants_phone ON public.webinar_participants(phone);

ALTER TABLE public.webinar_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON public.webinar_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participants" ON public.webinar_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.webinar_participants FOR UPDATE USING (true);

-- 3) Webinar Interactions (polls, quizzes, reactions, Q&A, tasks, CTAs, check-ins)
CREATE TABLE public.webinar_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('poll', 'quiz', 'reaction', 'qa', 'task', 'cta', 'checkin')),
  title TEXT NOT NULL,
  question TEXT,
  options JSONB, -- array of {id, text, is_correct (for quiz)}
  settings JSONB NOT NULL DEFAULT '{}', -- {allow_late, show_results_immediately, timer_duration, points_enabled, anonymous, char_limit, button_label, link_url, cta_description, scale_max}
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'archived')),
  order_index INTEGER NOT NULL DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinar_interactions_webinar ON public.webinar_interactions(webinar_id);
CREATE INDEX idx_webinar_interactions_status ON public.webinar_interactions(status);

ALTER TABLE public.webinar_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view interactions" ON public.webinar_interactions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage interactions" ON public.webinar_interactions FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_webinar_interactions_updated_at
  BEFORE UPDATE ON public.webinar_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Interaction Responses (votes, quiz answers, task submissions, CTA clicks, check-in confirmations)
CREATE TABLE public.webinar_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.webinar_interactions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.webinar_participants(id) ON DELETE CASCADE,
  answer JSONB NOT NULL, -- {option_id, text, scale_value, clicked}
  is_correct BOOLEAN,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(interaction_id, participant_id)
);

CREATE INDEX idx_webinar_responses_interaction ON public.webinar_responses(interaction_id);
CREATE INDEX idx_webinar_responses_participant ON public.webinar_responses(participant_id);

ALTER TABLE public.webinar_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view responses" ON public.webinar_responses FOR SELECT USING (true);
CREATE POLICY "Anyone can submit responses" ON public.webinar_responses FOR INSERT WITH CHECK (true);

-- 5) Q&A Questions
CREATE TABLE public.webinar_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.webinar_participants(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinar_questions_webinar ON public.webinar_questions(webinar_id);

ALTER TABLE public.webinar_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view questions" ON public.webinar_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can submit questions" ON public.webinar_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update questions" ON public.webinar_questions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete own questions" ON public.webinar_questions FOR DELETE USING (true);

CREATE TRIGGER update_webinar_questions_updated_at
  BEFORE UPDATE ON public.webinar_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Q&A Upvotes (prevent duplicate upvotes)
CREATE TABLE public.webinar_question_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.webinar_questions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.webinar_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, participant_id)
);

ALTER TABLE public.webinar_question_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view upvotes" ON public.webinar_question_upvotes FOR SELECT USING (true);
CREATE POLICY "Anyone can upvote" ON public.webinar_question_upvotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove upvote" ON public.webinar_question_upvotes FOR DELETE USING (true);

-- 7) Quick Reactions (aggregate counts, not per-user tracking to allow multiple taps)
CREATE TABLE public.webinar_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.webinar_participants(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('understood', 'repeat', 'excellent', 'important')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinar_reactions_webinar ON public.webinar_reactions(webinar_id);

ALTER TABLE public.webinar_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON public.webinar_reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can react" ON public.webinar_reactions FOR INSERT WITH CHECK (true);

-- 8) Enable Supabase Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_question_upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_participants;

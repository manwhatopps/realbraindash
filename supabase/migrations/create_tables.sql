-- ============================================================
-- BrainDash Match Questions System — Full Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. questions (static bank)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category        text NOT NULL,
  difficulty      text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  difficulty_num  smallint NOT NULL CHECK (difficulty_num IN (1, 2, 3)),
  q_type          text NOT NULL DEFAULT 'mcq',
  prompt          text NOT NULL,
  choices         jsonb NOT NULL,        -- [{"id":"A","text":"..."},...]
  correct_index   integer NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  origin          text NOT NULL DEFAULT 'bank' CHECK (origin IN ('bank', 'ai')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'blocked')),
  quality_score   numeric(4,3) DEFAULT 0.750,
  explanation     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for question selection (category + difficulty + status)
CREATE INDEX IF NOT EXISTS idx_questions_selection
  ON public.questions(category, difficulty_num, status, quality_score, created_at)
  WHERE status = 'active';

-- ============================================================
-- 2. match_questions (frozen question sets per match)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid NOT NULL,
  round_no    int NOT NULL CHECK (round_no BETWEEN 1 AND 10),
  question_id uuid NOT NULL REFERENCES public.questions(id),
  payload     jsonb NOT NULL,   -- frozen snapshot at match creation
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, round_no)
);

CREATE INDEX IF NOT EXISTS idx_match_questions_lookup
  ON public.match_questions(match_id, round_no);

-- ============================================================
-- 3. question_usage (freshness tracking per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.question_usage (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  question_id uuid NOT NULL REFERENCES public.questions(id),
  match_id    uuid,
  seen_at     timestamptz NOT NULL DEFAULT now(),
  is_correct  boolean,
  response_ms integer,
  UNIQUE(user_id, question_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_question_usage_user_seen
  ON public.question_usage(user_id, seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_usage_question_seen
  ON public.question_usage(question_id, seen_at DESC);

-- ============================================================
-- 4. match_answers (scoring & audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_answers (
  id          bigserial PRIMARY KEY,
  match_id    uuid NOT NULL,
  round_no    int NOT NULL CHECK (round_no BETWEEN 1 AND 10),
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  question_id uuid NOT NULL REFERENCES public.questions(id),
  answer      jsonb NOT NULL,        -- {"choice_id": "B"}
  is_correct  boolean NOT NULL,
  points      int NOT NULL,
  response_ms int,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, round_no, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_answers_match_user
  ON public.match_answers(match_id, user_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_answers ENABLE ROW LEVEL SECURITY;

-- Anyone can read active questions
CREATE POLICY "questions_public_read" ON public.questions
  FOR SELECT USING (status = 'active');

-- Match questions readable by authenticated users
CREATE POLICY "match_questions_read" ON public.match_questions
  FOR SELECT TO authenticated USING (true);

-- Users can only see their own usage
CREATE POLICY "question_usage_own" ON public.question_usage
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Users can only see their own answers
CREATE POLICY "match_answers_own" ON public.match_answers
  FOR ALL TO authenticated USING (auth.uid() = user_id);

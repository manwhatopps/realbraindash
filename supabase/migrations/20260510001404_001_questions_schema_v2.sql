/*
  # Questions Schema - BOLT PROMPT 1 of 4 (safe version)

  Ensures all required tables and columns exist for the v2 question system.
  Uses IF NOT EXISTS and column existence checks throughout.

  Tables covered:
  - questions: add source_confidence if missing
  - match_questions: add question_order alias column if missing
  - question_usage: create if not exists
  - match_answers: create if not exists
  - question_generation_log: create if not exists

  All tables get RLS enabled and appropriate policies.
*/

-- 1. questions: ensure source_confidence exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'source_confidence'
  ) THEN
    ALTER TABLE questions ADD COLUMN source_confidence float DEFAULT 1.0;
  END IF;
END $$;

-- 2. match_questions: add question_order if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_questions' AND column_name = 'question_order'
  ) THEN
    ALTER TABLE match_questions ADD COLUMN question_order integer DEFAULT 0;
  END IF;
END $$;

-- 3. question_usage table
CREATE TABLE IF NOT EXISTS question_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id text,
  mode text DEFAULT 'free',
  seen_at timestamptz DEFAULT now()
);

-- 4. match_answers table
CREATE TABLE IF NOT EXISTS match_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index integer,
  is_correct boolean DEFAULT false,
  time_taken_ms integer,
  answered_at timestamptz DEFAULT now()
);

-- 5. question_generation_log table
CREATE TABLE IF NOT EXISTS question_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL,
  count_requested integer NOT NULL,
  count_inserted integer DEFAULT 0,
  model text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_selection
  ON questions(category, difficulty, times_used);

CREATE INDEX IF NOT EXISTS idx_match_questions_lookup
  ON match_questions(match_id, question_order);

CREATE INDEX IF NOT EXISTS idx_question_usage_user
  ON question_usage(user_id, seen_at);

CREATE INDEX IF NOT EXISTS idx_question_usage_question
  ON question_usage(question_id);

CREATE INDEX IF NOT EXISTS idx_match_answers_match_user
  ON match_answers(match_id, user_id);

-- Enable RLS on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_generation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- questions: public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'questions_public_read'
  ) THEN
    CREATE POLICY "questions_public_read"
      ON questions FOR SELECT
      USING (true);
  END IF;
END $$;

-- match_questions: authenticated read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'match_questions' AND policyname = 'match_questions_auth_read'
  ) THEN
    CREATE POLICY "match_questions_auth_read"
      ON match_questions FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- question_usage: own rows only (select)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'question_usage' AND policyname = 'question_usage_own_select'
  ) THEN
    CREATE POLICY "question_usage_own_select"
      ON question_usage FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- question_usage: own rows only (insert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'question_usage' AND policyname = 'question_usage_own_insert'
  ) THEN
    CREATE POLICY "question_usage_own_insert"
      ON question_usage FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- match_answers: own rows only (select)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'match_answers' AND policyname = 'match_answers_own_select'
  ) THEN
    CREATE POLICY "match_answers_own_select"
      ON match_answers FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- match_answers: own rows only (insert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'match_answers' AND policyname = 'match_answers_own_insert'
  ) THEN
    CREATE POLICY "match_answers_own_insert"
      ON match_answers FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- question_generation_log: authenticated read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'question_generation_log' AND policyname = 'question_generation_log_auth_read'
  ) THEN
    CREATE POLICY "question_generation_log_auth_read"
      ON question_generation_log FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

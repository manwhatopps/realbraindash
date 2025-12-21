/*
  # OpenAI Question Generation Infrastructure

  Complete implementation for AI-powered trivia question generation with deduplication and caching.

  ## 1. Questions Table
  - Store generated questions with full metadata
  - Track usage and quality

  ## 2. Question Fingerprints
  - SHA256 hashing for duplicate detection
  - Per-category tracking

  ## 3. Match Questions Mapping
  - Ensure all players see identical questions
  - Track which questions used in which matches

  ## 4. Question Generation Log
  - Track OpenAI API calls for cost monitoring
  - Track generation success/failure rates

  ## Security
  - RLS enabled on all tables
  - Admin-only question generation
  - Content safety flagging
*/

-- =====================================================
-- 1. QUESTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text text NOT NULL,
  choices jsonb NOT NULL,
  correct_index int NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation text,
  source text NOT NULL DEFAULT 'openai',
  source_confidence text CHECK (source_confidence IN ('low', 'medium', 'high')),
  fingerprint text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  times_used int NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  content_flags jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Admin can manage questions
CREATE POLICY "Admin manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Service role can read/write (for match creation)
CREATE POLICY "Service role manage questions"
  ON questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. QUESTION FINGERPRINTS
-- =====================================================

CREATE TABLE IF NOT EXISTS question_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  fingerprint text NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, fingerprint)
);

ALTER TABLE question_fingerprints ENABLE ROW LEVEL SECURITY;

-- Admin read only
CREATE POLICY "Admin read fingerprints"
  ON question_fingerprints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Service role full access
CREATE POLICY "Service role manage fingerprints"
  ON question_fingerprints FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. MATCH QUESTIONS MAPPING
-- =====================================================

CREATE TABLE IF NOT EXISTS match_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  lobby_id uuid,
  question_id uuid NOT NULL REFERENCES questions(id),
  question_number int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, question_number)
);

ALTER TABLE match_questions ENABLE ROW LEVEL SECURITY;

-- Players can read questions for their matches
CREATE POLICY "Players read match questions"
  ON match_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = match_questions.match_id
        AND mp.user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role manage match questions"
  ON match_questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. QUESTION GENERATION LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS question_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  total_cost_cents int,
  success boolean NOT NULL,
  error_message text,
  questions_generated int DEFAULT 0,
  duplicates_rejected int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE question_generation_log ENABLE ROW LEVEL SECURITY;

-- Admin read only
CREATE POLICY "Admin read generation log"
  ON question_generation_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Generate question fingerprint (SHA256 of normalized text)
CREATE OR REPLACE FUNCTION generate_question_fingerprint(p_question_text text)
RETURNS text AS $$
DECLARE
  v_normalized text;
BEGIN
  -- Normalize: lowercase, remove extra spaces, remove punctuation
  v_normalized := lower(regexp_replace(p_question_text, '[^a-zA-Z0-9\s]', '', 'g'));
  v_normalized := regexp_replace(v_normalized, '\s+', ' ', 'g');
  v_normalized := trim(v_normalized);

  -- Return SHA256 hash
  RETURN encode(digest(v_normalized, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if question fingerprint exists
CREATE OR REPLACE FUNCTION is_duplicate_question(
  p_category text,
  p_fingerprint text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM question_fingerprints
    WHERE category = p_category
      AND fingerprint = p_fingerprint
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent fingerprints for a category (for prompt context)
CREATE OR REPLACE FUNCTION get_recent_fingerprints(
  p_category text,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  fingerprint text,
  question_text text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qf.fingerprint,
    q.question_text
  FROM question_fingerprints qf
  JOIN questions q ON q.id = qf.question_id
  WHERE qf.category = p_category
  ORDER BY qf.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cached questions for match (prefer unseen)
CREATE OR REPLACE FUNCTION get_cached_questions_for_match(
  p_category text,
  p_difficulty text,
  p_count int,
  p_exclude_recent_days int DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  question_text text,
  choices jsonb,
  correct_index int,
  explanation text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.choices,
    q.correct_index,
    q.explanation
  FROM questions q
  WHERE q.category = p_category
    AND q.difficulty = p_difficulty
    AND q.is_active = true
    AND (q.last_used_at IS NULL OR q.last_used_at < now() - (p_exclude_recent_days || ' days')::interval)
  ORDER BY
    q.times_used ASC,
    q.last_used_at ASC NULLS FIRST,
    random()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark questions as used
CREATE OR REPLACE FUNCTION mark_questions_used(p_question_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE questions
  SET
    times_used = times_used + 1,
    last_used_at = now()
  WHERE id = ANY(p_question_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert generated question with fingerprint
CREATE OR REPLACE FUNCTION insert_generated_question(
  p_category text,
  p_difficulty text,
  p_question_text text,
  p_choices jsonb,
  p_correct_index int,
  p_explanation text,
  p_source_confidence text,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  question_id uuid,
  fingerprint text,
  is_duplicate boolean
) AS $$
DECLARE
  v_fingerprint text;
  v_is_duplicate boolean;
  v_question_id uuid;
BEGIN
  -- Generate fingerprint
  v_fingerprint := generate_question_fingerprint(p_question_text);

  -- Check if duplicate
  v_is_duplicate := is_duplicate_question(p_category, v_fingerprint);

  IF v_is_duplicate THEN
    RETURN QUERY SELECT false, NULL::uuid, v_fingerprint, true;
    RETURN;
  END IF;

  -- Insert question
  INSERT INTO questions (
    category,
    difficulty,
    question_text,
    choices,
    correct_index,
    explanation,
    source,
    source_confidence,
    fingerprint,
    created_by
  ) VALUES (
    p_category,
    p_difficulty,
    p_question_text,
    p_choices,
    p_correct_index,
    p_explanation,
    'openai',
    p_source_confidence,
    v_fingerprint,
    p_created_by
  ) RETURNING id INTO v_question_id;

  -- Insert fingerprint
  INSERT INTO question_fingerprints (category, fingerprint, question_id)
  VALUES (p_category, v_fingerprint, v_question_id);

  RETURN QUERY SELECT true, v_question_id, v_fingerprint, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get question generation stats
CREATE OR REPLACE FUNCTION get_question_stats()
RETURNS TABLE (
  category text,
  total_questions bigint,
  easy_count bigint,
  medium_count bigint,
  hard_count bigint,
  avg_times_used numeric,
  last_generated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.category,
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE q.difficulty = 'easy') as easy_count,
    COUNT(*) FILTER (WHERE q.difficulty = 'medium') as medium_count,
    COUNT(*) FILTER (WHERE q.difficulty = 'hard') as hard_count,
    AVG(q.times_used) as avg_times_used,
    MAX(q.created_at) as last_generated
  FROM questions q
  WHERE q.is_active = true
  GROUP BY q.category
  ORDER BY q.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty
  ON questions(category, difficulty, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_questions_last_used
  ON questions(last_used_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_questions_fingerprint
  ON questions(fingerprint);

CREATE INDEX IF NOT EXISTS idx_question_fingerprints_category
  ON question_fingerprints(category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_questions_match
  ON match_questions(match_id, question_number);

CREATE INDEX IF NOT EXISTS idx_generation_log_category
  ON question_generation_log(category, created_at DESC);
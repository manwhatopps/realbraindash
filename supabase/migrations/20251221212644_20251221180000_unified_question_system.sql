/*
  # Unified Question System Enhancement

  Adds user seen tracking, normalized fingerprinting, and improved question fetching.

  1. New Tables
    - `user_seen_questions` - Track which questions users have seen to prevent repeats

  2. Schema Changes
    - Add `normalized_fingerprint` to questions table for better dedupe
    - Add `delivered_choice_order` to track shuffled choices

  3. New Functions
    - `generate_normalized_fingerprint` - Better semantic dedupe
    - `get_questions_for_session` - Unified question fetching with seen tracking
    - `insert_seen_question` - Mark question as seen by user/session
    - `shuffle_question_choices` - Server-side choice shuffling
*/

-- =====================================================
-- 1. USER SEEN QUESTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_seen_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  mode text,
  CONSTRAINT user_or_session_required CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_seen_questions_unique
  ON user_seen_questions(user_id, question_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_seen_questions_session
  ON user_seen_questions(session_id, question_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_seen_questions_seen_at
  ON user_seen_questions(seen_at);

ALTER TABLE user_seen_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own seen questions"
  ON user_seen_questions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manage seen questions"
  ON user_seen_questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon manage by session"
  ON user_seen_questions FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- =====================================================
-- 2. SCHEMA ENHANCEMENTS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'normalized_fingerprint'
  ) THEN
    ALTER TABLE questions ADD COLUMN normalized_fingerprint text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'original_correct_index'
  ) THEN
    ALTER TABLE questions ADD COLUMN original_correct_index int;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_normalized_fingerprint
  ON questions(category, difficulty, normalized_fingerprint) WHERE normalized_fingerprint IS NOT NULL;

-- =====================================================
-- 3. ENHANCED FINGERPRINTING
-- =====================================================

CREATE OR REPLACE FUNCTION generate_normalized_fingerprint(p_question_text text)
RETURNS text AS $$
DECLARE
  v_normalized text;
  v_stopwords text[] := ARRAY['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                               'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                               'would', 'should', 'could', 'may', 'might', 'must', 'can',
                               'which', 'what', 'who', 'where', 'when', 'why', 'how'];
  v_word text;
BEGIN
  v_normalized := lower(regexp_replace(p_question_text, '[^a-zA-Z0-9\s]', '', 'g'));
  v_normalized := regexp_replace(v_normalized, '\d+', '<num>', 'g');
  v_normalized := regexp_replace(v_normalized, '\s+', ' ', 'g');
  v_normalized := trim(v_normalized);

  FOREACH v_word IN ARRAY v_stopwords LOOP
    v_normalized := regexp_replace(v_normalized, '\m' || v_word || '\M', '', 'g');
  END LOOP;

  v_normalized := regexp_replace(v_normalized, '\s+', ' ', 'g');
  v_normalized := trim(v_normalized);

  RETURN encode(digest(v_normalized, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
DECLARE
  v_question RECORD;
BEGIN
  FOR v_question IN
    SELECT id, question_text
    FROM questions
    WHERE normalized_fingerprint IS NULL
    LIMIT 1000
  LOOP
    UPDATE questions
    SET normalized_fingerprint = generate_normalized_fingerprint(v_question.question_text)
    WHERE id = v_question.id;
  END LOOP;
END $$;

-- =====================================================
-- 4. QUESTION FETCHING WITH SEEN TRACKING
-- =====================================================

CREATE OR REPLACE FUNCTION get_questions_for_session(
  p_category text,
  p_difficulty text,
  p_count int,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_match_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_text text,
  choices jsonb,
  correct_index int,
  difficulty text,
  category text,
  explanation text,
  source_confidence text,
  times_used int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.choices,
    q.correct_index,
    q.difficulty,
    q.category,
    q.explanation,
    q.source_confidence,
    q.times_used
  FROM questions q
  WHERE q.category = p_category
    AND q.difficulty = p_difficulty
    AND q.is_active = true
    AND (p_match_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM match_questions mq
      WHERE mq.match_id = p_match_id
        AND mq.question_id = q.id
    ))
  ORDER BY
    CASE WHEN EXISTS (
      SELECT 1 FROM user_seen_questions usq
      WHERE usq.question_id = q.id
        AND (
          (p_user_id IS NOT NULL AND usq.user_id = p_user_id)
          OR (p_session_id IS NOT NULL AND usq.session_id = p_session_id)
        )
    ) THEN 1 ELSE 0 END,
    q.times_used ASC,
    q.last_used_at ASC NULLS FIRST,
    random()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. SEEN TRACKING FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION insert_seen_question(
  p_question_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_mode text DEFAULT 'free'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_seen_questions (question_id, user_id, session_id, mode)
  VALUES (p_question_id, p_user_id, p_session_id, p_mode)
  ON CONFLICT (user_id, question_id) WHERE user_id IS NOT NULL
  DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION insert_seen_questions_bulk(
  p_question_ids uuid[],
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_mode text DEFAULT 'free'
)
RETURNS void AS $$
DECLARE
  v_question_id uuid;
BEGIN
  FOREACH v_question_id IN ARRAY p_question_ids LOOP
    PERFORM insert_seen_question(v_question_id, p_user_id, p_session_id, p_mode);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_seen_questions(p_days int DEFAULT 30)
RETURNS int AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM user_seen_questions
  WHERE seen_at < now() - (p_days || ' days')::interval;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CHOICE SHUFFLING
-- =====================================================

CREATE OR REPLACE FUNCTION shuffle_question_choices(
  p_question_id uuid
)
RETURNS TABLE (
  id uuid,
  question_text text,
  choices jsonb,
  correct_index int,
  original_correct_index int
) AS $$
DECLARE
  v_question RECORD;
  v_choices_array text[];
  v_correct_answer text;
  v_new_correct_index int;
  v_shuffled jsonb;
  v_i int;
  v_j int;
  v_temp text;
BEGIN
  SELECT * INTO v_question FROM questions q WHERE q.id = p_question_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT array_agg(value::text ORDER BY ordinality)
  INTO v_choices_array
  FROM jsonb_array_elements_text(v_question.choices) WITH ORDINALITY;

  v_correct_answer := v_choices_array[v_question.correct_index + 1];

  FOR v_i IN REVERSE array_length(v_choices_array, 1)..2 LOOP
    v_j := 1 + floor(random() * v_i)::int;
    v_temp := v_choices_array[v_i];
    v_choices_array[v_i] := v_choices_array[v_j];
    v_choices_array[v_j] := v_temp;
  END LOOP;

  FOR v_i IN 1..array_length(v_choices_array, 1) LOOP
    IF v_choices_array[v_i] = v_correct_answer THEN
      v_new_correct_index := v_i - 1;
      EXIT;
    END IF;
  END LOOP;

  v_shuffled := to_jsonb(v_choices_array);

  RETURN QUERY SELECT v_question.id, v_question.question_text, v_shuffled, v_new_correct_index, v_question.correct_index;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- =====================================================
-- 7. ENHANCED INSERT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION insert_generated_question_enhanced(
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
  normalized_fingerprint text,
  is_duplicate boolean,
  rejection_reason text
) AS $$
DECLARE
  v_fingerprint text;
  v_normalized_fingerprint text;
  v_is_duplicate boolean;
  v_question_id uuid;
  v_choice_count int;
  v_distinct_choices int;
BEGIN
  IF length(p_question_text) < 10 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, false, 'Question text too short';
    RETURN;
  END IF;

  IF length(p_question_text) > 500 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, false, 'Question text too long';
    RETURN;
  END IF;

  IF p_question_text !~ '\?' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, false, 'Question must end with ?';
    RETURN;
  END IF;

  v_choice_count := jsonb_array_length(p_choices);
  IF v_choice_count != 4 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, false, 'Must have exactly 4 choices';
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT value) INTO v_distinct_choices FROM jsonb_array_elements_text(p_choices);
  IF v_distinct_choices != 4 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, false, 'Choices must be distinct';
    RETURN;
  END IF;

  IF p_correct_index < 0 OR p_correct_index > 3 THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, false, 'Invalid correct_index';
    RETURN;
  END IF;

  v_fingerprint := generate_question_fingerprint(p_question_text);
  v_normalized_fingerprint := generate_normalized_fingerprint(p_question_text);

  v_is_duplicate := EXISTS (
    SELECT 1 FROM question_fingerprints WHERE category = p_category AND fingerprint = v_fingerprint
  ) OR EXISTS (
    SELECT 1 FROM questions WHERE category = p_category AND normalized_fingerprint = v_normalized_fingerprint
  );

  IF v_is_duplicate THEN
    RETURN QUERY SELECT false, NULL::uuid, v_fingerprint, v_normalized_fingerprint, true, 'Duplicate question';
    RETURN;
  END IF;

  INSERT INTO questions (
    category, difficulty, question_text, choices, correct_index, original_correct_index,
    explanation, source, source_confidence, fingerprint, normalized_fingerprint, created_by
  ) VALUES (
    p_category, p_difficulty, p_question_text, p_choices, p_correct_index, p_correct_index,
    p_explanation, 'openai', p_source_confidence, v_fingerprint, v_normalized_fingerprint, p_created_by
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_fingerprints (category, fingerprint, question_id)
  VALUES (p_category, v_fingerprint, v_question_id);

  RETURN QUERY SELECT true, v_question_id, v_fingerprint, v_normalized_fingerprint, false, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_questions_for_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_seen_question TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_seen_questions_bulk TO anon, authenticated;
GRANT EXECUTE ON FUNCTION shuffle_question_choices TO service_role;

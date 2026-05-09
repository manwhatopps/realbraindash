/*
  # Add v2 Question RPCs (with drop-recreate)

  Drops and recreates the stored procedures required by the get-questions edge function.
  Using DROP IF EXISTS to safely replace any prior versions with different signatures.
*/

-- Drop existing functions first to allow signature changes
DROP FUNCTION IF EXISTS public.get_questions_for_session(text, text, integer, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.shuffle_question_choices(uuid);
DROP FUNCTION IF EXISTS public.mark_questions_used(uuid[]);
DROP FUNCTION IF EXISTS public.insert_seen_questions_bulk(uuid[], uuid, text, text);

-- ============================================================================
-- get_questions_for_session
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_questions_for_session(
  p_category text,
  p_difficulty text,
  p_count integer,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_match_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  difficulty text,
  difficulty_num smallint,
  q_type text,
  prompt text,
  choices jsonb,
  correct_index integer,
  explanation text,
  quality_score numeric,
  origin text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.category,
    q.difficulty,
    q.difficulty_num,
    q.q_type,
    q.prompt,
    q.choices,
    q.correct_index,
    q.explanation,
    q.quality_score,
    q.origin
  FROM public.questions q
  WHERE
    q.status = 'active'
    AND lower(q.category) = lower(p_category)
    AND q.difficulty = p_difficulty
  ORDER BY
    CASE
      WHEN p_user_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.question_usage qu
        WHERE qu.question_id = q.id
          AND qu.user_id = p_user_id
          AND qu.seen_at > now() - interval '7 days'
      ) THEN 1
      ELSE 0
    END ASC,
    q.quality_score DESC,
    random()
  LIMIT p_count;
END;
$$;

-- ============================================================================
-- shuffle_question_choices
-- ============================================================================
CREATE OR REPLACE FUNCTION public.shuffle_question_choices(
  p_question_id uuid
)
RETURNS TABLE (
  id uuid,
  prompt text,
  choices jsonb,
  correct_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question public.questions%ROWTYPE;
  v_correct_text text;
  v_shuffled jsonb;
  v_new_correct_index integer;
  v_arr jsonb[];
  v_len integer;
  i integer;
  j integer;
  tmp jsonb;
BEGIN
  SELECT * INTO v_question FROM public.questions WHERE questions.id = p_question_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_len := jsonb_array_length(v_question.choices);
  v_correct_text := v_question.choices -> v_question.correct_index ->> 'text';

  v_arr := ARRAY(SELECT v_question.choices -> s FROM generate_series(0, v_len - 1) AS s);

  FOR i IN REVERSE v_len - 1 .. 1 LOOP
    j := floor(random() * (i + 1))::integer;
    tmp := v_arr[i + 1];
    v_arr[i + 1] := v_arr[j + 1];
    v_arr[j + 1] := tmp;
  END LOOP;

  v_shuffled := '[]'::jsonb;
  FOR i IN 1 .. v_len LOOP
    v_shuffled := v_shuffled || jsonb_build_array(v_arr[i]);
  END LOOP;

  v_new_correct_index := 0;
  FOR i IN 0 .. v_len - 1 LOOP
    IF v_shuffled -> i ->> 'text' = v_correct_text THEN
      v_new_correct_index := i;
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    v_question.id,
    v_question.prompt,
    v_shuffled,
    v_new_correct_index;
END;
$$;

-- ============================================================================
-- mark_questions_used — no-op stub
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_questions_used(
  p_question_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN;
END;
$$;

-- ============================================================================
-- insert_seen_questions_bulk — no-op stub
-- ============================================================================
CREATE OR REPLACE FUNCTION public.insert_seen_questions_bulk(
  p_question_ids uuid[],
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_mode text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN;
END;
$$;

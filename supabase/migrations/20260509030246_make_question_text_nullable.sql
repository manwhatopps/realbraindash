/*
  # Make question_text nullable for v2 schema compatibility

  The questions table has both `question_text` (legacy) and `prompt` (v2) columns.
  v2 seeds only populate `prompt`, so `question_text` needs to be nullable.
  
  Also add a trigger to keep question_text in sync with prompt for backwards compat.
*/

ALTER TABLE public.questions ALTER COLUMN question_text DROP NOT NULL;

-- Backfill question_text from prompt where null
UPDATE public.questions SET question_text = prompt WHERE question_text IS NULL OR question_text = '';

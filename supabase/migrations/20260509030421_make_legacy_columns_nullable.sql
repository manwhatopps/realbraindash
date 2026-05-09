/*
  # Make legacy columns nullable for v2 seed compatibility

  The questions table has legacy NOT NULL columns (fingerprint, source) that
  were added in earlier migrations but are not part of the v2 schema.
  Making them nullable allows v2-format inserts that only supply the new columns.
*/

ALTER TABLE public.questions 
  ALTER COLUMN fingerprint DROP NOT NULL,
  ALTER COLUMN source DROP NOT NULL;

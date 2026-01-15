-- ============================================================
-- BrainDash Hybrid Question System – Baseline Schema
-- Created: 2026-01-15
-- Purpose: Static question bank + shared match questions
-- ============================================================

-- Required for UUID generation
create extension if not exists pgcrypto;

-- ============================================================
-- 1) QUESTIONS (Static Question Bank)
-- ============================================================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  difficulty smallint not null check (difficulty in (1,2,3)),
  q_type text not null default 'mcq',
  prompt text not null,
  explanation text,
  choices jsonb not null,
  correct jsonb not null,
  origin text not null default 'bank' check (origin in ('bank','ai')),
  status text not null default 'active' check (status in ('active','review','blocked')),
  quality_score numeric(4,3) not null default 0.750 check (quality_score between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Selection index
create index if not exists idx_questions_cat_diff_status_quality_created
  on public.questions (
    category,
    difficulty,
    status,
    quality_score desc,
    created_at desc
  );

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_questions_updated_at on public.questions;
create trigger trg_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

-- ============================================================
-- 2) QUESTION USAGE (Tracks What Users Have Seen)
-- ============================================================
create table if not exists public.question_usage (
  id bigserial primary key,
  user_id uuid not null,
  question_id uuid not null references public.questions(id) on delete cascade,
  match_id uuid,
  seen_at timestamptz not null default now(),
  is_correct boolean,
  response_ms integer
);

create index if not exists idx_question_usage_user_seen
  on public.question_usage (user_id, seen_at desc);

create index if not exists idx_question_usage_question_seen
  on public.question_usage (question_id, seen_at desc);

-- ============================================================
-- 3) MATCH QUESTIONS (Frozen Shared Set per Match)
-- ============================================================
create table if not exists public.match_questions (
  id bigserial primary key,
  match_id uuid not null,
  round_no int not null check (round_no between 1 and 10),
  question_id uuid not null references public.questions(id),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (match_id, round_no)
);

create index if not exists idx_match_questions_match_round
  on public.match_questions (match_id, round_no);

-- ============================================================
-- 4) MATCH ANSWERS (Scoring + Audit)
-- ============================================================
create table if not exists public.match_answers (
  id bigserial primary key,
  match_id uuid not null,
  round_no int not null,
  user_id uuid not null,
  question_id uuid not null,
  answer jsonb not null,
  is_correct boolean not null,
  points int not null,
  response_ms int,
  created_at timestamptz not null default now(),
  unique (match_id, round_no, user_id)
);

-- ============================================================
-- 5) RPC: aggregate_seen_counts (STRICT, SAFE)
-- ============================================================
create or replace function public.aggregate_seen_counts(
  candidate_ids uuid[],
  player_ids uuid[],
  cutoff_ts timestamptz
)
returns table(question_id uuid, seen_count int)
language sql
stable
as $$
  select
    qu.question_id::uuid as question_id,
    count(distinct qu.user_id)::int as seen_count
  from public.question_usage qu
  where
    (candidate_ids is not null and array_length(candidate_ids, 1) > 0)
    and (player_ids is not null and array_length(player_ids, 1) > 0)
    and qu.question_id = any(candidate_ids)
    and qu.user_id = any(player_ids)
    and (cutoff_ts is null or qu.seen_at >= cutoff_ts)
  group by qu.question_id;
$$;


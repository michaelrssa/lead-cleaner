-- 001_initial_schema.sql
-- Lead Cleaner: initial database schema

-- ============================================================
-- 1. cleaning_jobs
-- ============================================================
create table cleaning_jobs (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  status          text        not null    default 'pending'
    check (status in ('pending', 'processing', 'paused', 'complete', 'cancelled', 'failed')),
  total_rows      int,
  processed_rows  int         not null    default 0,
  estimated_cost_usd numeric(10,6),
  actual_cost_usd    numeric(10,6) not null default 0,
  budget_cap_usd     numeric(10,4),
  anthropic_batch_id text,
  model_strategy     text      not null    default 'haiku_primary',
  column_mapping     jsonb,
  original_filename  text
);

create index idx_cleaning_jobs_status on cleaning_jobs (status);

alter table cleaning_jobs enable row level security;

-- Allow service-role full access (anon/authenticated blocked by default)
create policy "Service role full access on cleaning_jobs"
  on cleaning_jobs
  for all
  using (true)
  with check (true);

-- ============================================================
-- 2. api_usage_log
-- ============================================================
create table api_usage_log (
  id            uuid        primary key default gen_random_uuid(),
  job_id        uuid        not null references cleaning_jobs (id) on delete cascade,
  created_at    timestamptz not null    default now(),
  model         text        not null,
  input_tokens  int         not null,
  output_tokens int         not null,
  cost_usd      numeric(10,6) not null,
  batch_index   int
);

create index idx_api_usage_log_job_id on api_usage_log (job_id);

alter table api_usage_log enable row level security;

create policy "Service role full access on api_usage_log"
  on api_usage_log
  for all
  using (true)
  with check (true);

-- ============================================================
-- 3. monthly_spend
-- ============================================================
create table monthly_spend (
  month          text        primary key, -- format: YYYY-MM
  total_cost_usd numeric(10,4) not null default 0,
  monthly_cap_usd numeric(10,4) not null default 20.00
);

alter table monthly_spend enable row level security;

create policy "Service role full access on monthly_spend"
  on monthly_spend
  for all
  using (true)
  with check (true);

-- ============================================================
-- 4. Enable Realtime on cleaning_jobs
-- ============================================================
alter publication supabase_realtime add table cleaning_jobs;

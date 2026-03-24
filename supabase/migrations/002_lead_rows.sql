-- 002_lead_rows.sql
-- Store raw + cleaned data per row for each cleaning job

create table lead_rows (
  id          uuid        primary key default gen_random_uuid(),
  job_id      uuid        not null references cleaning_jobs (id) on delete cascade,
  row_index   int         not null,
  raw_data    jsonb       not null,
  cleaned_data jsonb,
  status      text        not null default 'pending'
    check (status in ('pending', 'cleaning', 'done', 'error')),
  error_msg   text,
  created_at  timestamptz not null default now()
);

create index idx_lead_rows_job_id on lead_rows (job_id);
create index idx_lead_rows_status on lead_rows (status);

alter table lead_rows enable row level security;

create policy "Service role full access on lead_rows"
  on lead_rows
  for all
  using (true)
  with check (true);

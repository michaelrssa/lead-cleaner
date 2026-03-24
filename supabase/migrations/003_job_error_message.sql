-- 003_job_error_message.sql
-- Add error_message column to cleaning_jobs for debugging failures

alter table cleaning_jobs add column error_message text;

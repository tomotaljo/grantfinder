-- Add important_notes column for short contextual warnings or clarifications
alter table programs add column if not exists important_notes text default null;

-- Run this if the results page shows no programs after adding the RPC.
-- Safe to run multiple times.

-- 1. Ensure the states column exists (added in migration_002)
alter table programs add column if not exists states text[] default null;

-- 2. Ensure the benefit_value column exists (added in migration_003)
alter table programs add column if not exists benefit_value integer not null default 0;

-- 3. Re-populate benefit_value in case migration_003 seed didn't run
update programs set benefit_value = 15000 where name like '%Medicaid%' and benefit_value = 0;
update programs set benefit_value = 11676 where name like '%SNAP%'     and benefit_value = 0;
update programs set benefit_value = 750   where name like '%LIHEAP%'   and benefit_value = 0;

-- 4. Grant execute to anon and authenticated roles
--    Supabase does NOT do this automatically — this is the most common cause
--    of an RPC returning nothing for unauthenticated users.
grant execute on function get_eligible_programs(text, integer, integer, text[]) to anon;
grant execute on function get_eligible_programs(text, integer, integer, text[]) to authenticated;

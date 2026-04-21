-- 1. Add states column (null = available in all states)
alter table programs add column if not exists states text[] default null;

-- 2. Populate structured eligibility_rules for each program.
--    Schema: {
--      "max_monthly_income": int,   -- upper monthly income limit in dollars (null = no limit)
--      "min_age": int | null,       -- minimum age (null = no minimum)
--      "max_age": int | null,       -- maximum age (null = no maximum)
--      "required_situations": []    -- user must match ≥1 tag, or [] = no requirement
--    }

update programs set eligibility_rules = '{
  "max_monthly_income": 3200,
  "min_age": null,
  "max_age": null,
  "required_situations": []
}'::jsonb
where name like '%SNAP%';

update programs set eligibility_rules = '{
  "max_monthly_income": 4500,
  "min_age": null,
  "max_age": null,
  "required_situations": []
}'::jsonb
where name like '%LIHEAP%';

update programs set eligibility_rules = '{
  "max_monthly_income": 3600,
  "min_age": null,
  "max_age": null,
  "required_situations": []
}'::jsonb
where name like '%Medicaid%';

-- 3. Postgres function — all filtering happens here, nothing returned to client
--    until the row passes every condition.
create or replace function get_eligible_programs(
  p_state         text    default null,
  p_monthly_income int    default 999999,
  p_age           int    default 30,
  p_situation     text[] default '{}'
)
returns setof programs
language sql
stable
security definer
as $$
  select * from programs
  where is_active = true

    -- State: null states = federal/available everywhere; otherwise user's state must be in the array
    and (
      states is null
      or (p_state is not null and p_state = any(states))
    )

    -- Income: skip if no limit stored; otherwise user income must be at or below the threshold
    and (
      (eligibility_rules->>'max_monthly_income') is null
      or p_monthly_income <= (eligibility_rules->>'max_monthly_income')::int
    )

    -- Age: min_age and max_age are optional bounds
    and (
      (eligibility_rules->>'min_age') is null
      or p_age >= (eligibility_rules->>'min_age')::int
    )
    and (
      (eligibility_rules->>'max_age') is null
      or p_age <= (eligibility_rules->>'max_age')::int
    )

    -- Situation: empty required_situations = any user qualifies;
    --            otherwise user must match at least one tag
    and (
      (eligibility_rules->'required_situations' = '[]'::jsonb)
      or (eligibility_rules->>'required_situations') is null
      or exists (
        select 1
        from jsonb_array_elements_text(eligibility_rules->'required_situations') as tag
        where tag = any(p_situation)
      )
    )

  order by created_at;
$$;

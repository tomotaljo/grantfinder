-- 1. Add benefit_value column — annual dollar equivalent used for sorting
alter table programs add column if not exists benefit_value integer not null default 0;

-- 2. Populate values for the three seed programs
--    Medicaid:  ~$15,000/yr (full health coverage, est. $1,250/mo premium equivalent)
--    SNAP:      $11,676/yr  ($973/mo × 12, family of 4 maximum)
--    LIHEAP:    $750/yr     (midpoint of $500–$1,000 annual range)
update programs set benefit_value = 15000 where name like '%Medicaid%';
update programs set benefit_value = 11676 where name like '%SNAP%';
update programs set benefit_value = 750   where name like '%LIHEAP%';

-- 3. Replace the RPC to order by benefit_value DESC so the client
--    receives programs pre-sorted from highest to lowest value.
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
    and (
      states is null
      or (p_state is not null and p_state = any(states))
    )
    and (
      (eligibility_rules->>'max_monthly_income') is null
      or p_monthly_income <= (eligibility_rules->>'max_monthly_income')::int
    )
    and (
      (eligibility_rules->>'min_age') is null
      or p_age >= (eligibility_rules->>'min_age')::int
    )
    and (
      (eligibility_rules->>'max_age') is null
      or p_age <= (eligibility_rules->>'max_age')::int
    )
    and (
      (eligibility_rules->'required_situations' = '[]'::jsonb)
      or (eligibility_rules->>'required_situations') is null
      or exists (
        select 1
        from jsonb_array_elements_text(eligibility_rules->'required_situations') as tag
        where tag = any(p_situation)
      )
    )
  order by benefit_value desc;
$$;

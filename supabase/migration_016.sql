-- migration_016: Fix get_eligible_programs to actually apply income, age,
-- and required_situations filters. The deployed function only filtered by
-- state, ignoring the JSONB eligibility_rules entirely.
--
-- Uses DROP + CREATE (not CREATE OR REPLACE) to guarantee the new body
-- replaces whatever's currently deployed, even if a prior attempt errored.

drop function if exists get_eligible_programs(text, int, int, text[]);

create function get_eligible_programs(
  p_state          text    default null,
  p_monthly_income int     default 999999,
  p_age            int     default 30,
  p_situation      text[]  default '{}'
)
returns setof programs
language sql
stable
security definer
as $$
  select * from programs
  where is_active = true

    -- State: federal-scope rows match every user. State/county/city rows
    -- match only when the user picked a state and it matches the row's
    -- `state` column (singular; the legacy `states` text[] is unused).
    and (
      scope = 'federal'
      or (p_state is not null and state = p_state)
    )

    -- Income cap: missing key / JSON null = no cap (-> matches anyone);
    -- otherwise the user's monthly income must be at or below the cap.
    and (
      (eligibility_rules->>'max_monthly_income') is null
      or p_monthly_income <= (eligibility_rules->>'max_monthly_income')::int
    )

    -- Age bounds (inclusive on both sides; each side optional).
    and (
      (eligibility_rules->>'min_age') is null
      or p_age >= (eligibility_rules->>'min_age')::int
    )
    and (
      (eligibility_rules->>'max_age') is null
      or p_age <= (eligibility_rules->>'max_age')::int
    )

    -- Required situations: anyone qualifies when required_situations is
    -- missing, JSON null, or an empty array. `jsonb_typeof` handles SQL
    -- NULL and any non-array shape before jsonb_array_length is called.
    -- Otherwise the user must have at least one matching tag.
    and (
      jsonb_typeof(eligibility_rules->'required_situations') is distinct from 'array'
      or jsonb_array_length(eligibility_rules->'required_situations') = 0
      or exists (
        select 1
        from jsonb_array_elements_text(eligibility_rules->'required_situations') as tag
        where tag = any(p_situation)
      )
    )

  order by benefit_value desc;
$$;

grant execute on function get_eligible_programs(text, int, int, text[]) to anon, authenticated;

-- migration_019: Plumb household_size param through to get_eligible_programs.
--
-- The new p_household_size parameter is ACCEPTED but NOT YET USED in the
-- WHERE clause. FPL-aware income comparison (the actual reason we want HH
-- size) is a separate change — needs a data migration back to
-- max_income_percent_fpl on the rows plus an FPL lookup table or function.
--
-- Adding the param now establishes end-to-end plumbing: quiz → QuizAnswers
-- type → fetchEligiblePrograms → RPC. Once the FPL-aware filter lands,
-- only the function body needs to change; callers are already passing
-- the data.
--
-- DROP + CREATE used because the function signature changes (4 params → 5).
-- CREATE OR REPLACE only matches on identical signatures.

drop function if exists get_eligible_programs(text, int, int, text[]);
drop function if exists get_eligible_programs(text, int, int, text[], int);

create function get_eligible_programs(
  p_state          text    default null,
  p_monthly_income int     default 999999,
  p_age            int     default 30,
  p_situation      text[]  default '{}',
  p_household_size int     default 1
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
    -- `state` column.
    and (
      scope = 'federal'
      or (p_state is not null and state = p_state)
    )

    -- Income cap: missing key / JSON null = no cap (matches anyone);
    -- otherwise the user's monthly income must be at or below the cap.
    --
    -- TODO: replace flat-dollar comparison with FPL-percent comparison
    -- using p_household_size + an FPL lookup. See TODO.md.
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
    -- missing, JSON null, or an empty array. Otherwise the user must have
    -- at least one matching tag.
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

grant execute on function get_eligible_programs(text, int, int, text[], int) to anon, authenticated;

-- migration_021: Update current_fpl_monthly() to 2026 guidelines.
--
-- The function deployed in migration_020 used 2024 federal poverty
-- guidelines, which were already two annual updates stale by the time
-- the FPL-aware filter went live in May 2026. The 2026 guidelines have
-- been in effect since January 13, 2026 (HHS Federal Register notice
-- 2026-00755), reflecting the 2.63% CPI-U increase between 2024 and 2025.
--
-- The shape of the function is unchanged; only the literal values move.
-- Eligibility caps shift up ~6% across the board, which closes the band
-- of false negatives that were just under each %FPL threshold.

create or replace function current_fpl_monthly(p_household_size int)
returns numeric
language sql
immutable
as $$
  -- 2026 federal poverty guidelines (48 contiguous states + DC), monthly.
  -- Source: HHS ASPE — https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
  -- Federal Register notice 2026-00755, published January 13, 2026.
  -- AK and HI use higher guidelines; add a state arg when expanding the
  -- catalog there.
  --
  -- Maintenance: refresh in January 2027 when the 2027 guidelines drop.
  select case
    when p_household_size <= 1 then 1330.00
    when p_household_size = 2 then 1803.00
    when p_household_size = 3 then 2277.00
    when p_household_size = 4 then 2750.00
    when p_household_size = 5 then 3223.00
    when p_household_size = 6 then 3697.00
    when p_household_size = 7 then 4170.00
    when p_household_size = 8 then 4643.00
    -- Beyond 8: +$473/mo per additional person ($5,680/yr ÷ 12, 2026 marginal)
    else 4643.00 + ((p_household_size - 8) * 473.00)
  end;
$$;

grant execute on function current_fpl_monthly(int) to anon, authenticated;

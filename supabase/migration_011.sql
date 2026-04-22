-- Remove the closed CA Rent Relief program
delete from programs where name ilike '%rent relief%' or name ilike '%housing is key%';

-- Add replacement: California Rental Assistance via 211
-- TODO: Review quarterly — county/city rental assistance programs change frequently.
--       Check 211ca.org and update description or important_notes if new statewide
--       programs launch. Last reviewed: 2026-04.
insert into programs (
  name,
  category,
  description,
  potential_benefit,
  who_qualifies,
  phone_number,
  apply_url,
  benefit_value,
  state,
  slug,
  is_active,
  important_notes,
  eligibility_rules
) values (
  'California Rental Assistance',
  'Housing Assistance',
  'California''s statewide rent relief program ended in 2023, but rental assistance is still available through some county and city programs, nonprofits, and emergency funds. Because these programs change frequently, the best first step is to call 211 or visit 211ca.org — they maintain a current database of local rental assistance programs in every California county.',
  'Varies by county and program',
  'Low-income renters at risk of eviction or housing instability in California',
  '1-800-339-9597',
  'https://www.211ca.org',
  2400,
  'CA',
  'california-rental-assistance',
  true,
  'Available programs vary by county and change frequently. Call 211 or visit 211ca.org for the most current local options near you.',
  '{}'
);

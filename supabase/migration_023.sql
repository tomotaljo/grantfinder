-- migration_023: Add Hawaii programs.
--
-- Nine programs (Medicaid, SNAP, TANF, housing, LIHEAP, unemployment,
-- veterans, aging, 211) following the migration_018/022 conventions.
-- Hawaii is an expansion state; Med-QUEST is gated at 138% FPL with
-- no required_situations.
--
-- Hawaii FPL is ~15% higher than the 48 contiguous states. The three
-- HI rows that use max_income_percent_fpl (Med-QUEST, SNAP, LIHEAP)
-- will be evaluated against contiguous-states FPL by current_fpl_monthly(),
-- under-estimating real HI caps. Important_notes warns the user.
-- State-aware FPL function tracked in TODO.md.

insert into programs (
  name, category, description, potential_benefit, who_qualifies,
  phone_number, apply_url, benefit_value, scope, state, jurisdiction_name,
  slug, is_active, important_notes, eligibility_rules
) values
(
  'Hawaii Med-QUEST',
  'Health Insurance',
  'Hawaii Med-QUEST is the state Medicaid program, providing health coverage including doctor visits, hospital care, prescriptions, mental health, and preventive services. Hawaii expanded Medicaid for adults under the ACA.',
  'Full health coverage at little to no cost',
  'Hawaii adults at or below 138% of the federal poverty level, plus children, pregnant women, seniors, and people with disabilities at higher limits',
  '1-800-316-8005',
  'https://medquest.hawaii.gov',
  15000, 'state', 'HI', null, 'hawaii-med-quest', true,
  'Hawaii''s federal poverty guidelines are higher than the 48 contiguous states. Eligibility limits in your state may be more generous than what is shown here.',
  '{"max_income_percent_fpl": 138, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Hawaii SNAP',
  'Food Assistance',
  'Hawaii''s Supplemental Nutrition Assistance Program provides monthly food benefits on an EBT card. Administered by the Department of Human Services.',
  'Up to ~$1,759/month for a family of four (Hawaii benefit levels are higher than contiguous states)',
  'Hawaii households with gross monthly income at or below 130% of the Hawaii federal poverty level',
  '1-855-643-1643',
  'https://humanservices.hawaii.gov/bessd/snap/',
  11676, 'state', 'HI', null, 'hawaii-snap', true,
  'Hawaii SNAP eligibility uses Hawaii FPL, which is higher than the 48-state guidelines. The cap shown here may under-estimate your actual eligibility.',
  '{"max_income_percent_fpl": 130, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Hawaii First-To-Work (TANF)',
  'Cash Assistance',
  'Monthly cash assistance for low-income Hawaii families with minor children, plus access to employment and training services. Administered by the Department of Human Services.',
  'Up to ~$610/month for a family of three',
  'Hawaii families with minor children and limited income/resources',
  '1-855-643-1643',
  'https://humanservices.hawaii.gov/bessd/temporary-assistance-for-needy-families-tanf/',
  3500, 'state', 'HI', null, 'hawaii-first-to-work', true, null,
  '{"max_monthly_income": 1500, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Hawaii Housing Finance and Development Corporation (HHFDC)',
  'Housing Assistance',
  'HHFDC administers the state''s affordable rental and homebuyer programs, including Hula Mae mortgages and the Mortgage Credit Certificate program for first-time buyers, with income limits that vary by county.',
  'Down-payment assistance plus below-market mortgage rates',
  'Hawaii homebuyers meeting HHFDC program income and home-price limits',
  '808-587-0567',
  'https://dbedt.hawaii.gov/hhfdc/',
  10000, 'state', 'HI', null, 'hawaii-hhfdc', true, null,
  '{"max_monthly_income": 9000, "min_age": 18, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Hawaii LIHEAP',
  'Utility Assistance',
  'Hawaii''s federally-funded Low-Income Home Energy Assistance Program helps qualifying households pay electric bills and crisis energy needs. Administered by the Department of Human Services through community partners.',
  '$200–$1,500 per year toward energy bills',
  'Hawaii households with income at or below 150% of the Hawaii federal poverty level',
  '1-855-643-1643',
  'https://humanservices.hawaii.gov/bessd/liheap/',
  1300, 'state', 'HI', null, 'hawaii-liheap', true,
  'Hawaii LIHEAP uses Hawaii FPL, which is higher than the 48-state guidelines. The cap shown here may under-estimate your actual eligibility.',
  '{"max_income_percent_fpl": 150, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Hawaii Unemployment Insurance',
  'Income Assistance',
  'Weekly cash benefits for Hawaiians who lost their job through no fault of their own. Administered by the Department of Labor and Industrial Relations. Most claimants receive benefits for up to 26 weeks.',
  'Up to $796/week (~$41,400/year max)',
  'Workers laid off through no fault of their own with sufficient base-period earnings',
  '808-586-8970',
  'https://labor.hawaii.gov/ui/',
  13000, 'state', 'HI', null, 'hawaii-unemployment', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb
),
(
  'Hawaii Office of Veterans Services',
  'Veteran Services',
  'The state office that helps Hawaii veterans access VA benefits, education aid, employment, healthcare, and emergency assistance, with field offices on each major island.',
  'Free benefits counseling plus access to state veterans homes and emergency funds',
  'Hawaii veterans, active-duty service members, and their dependents',
  '808-433-0420',
  'https://dod.hawaii.gov/ovs/',
  5000, 'state', 'HI', null, 'hawaii-veterans-services', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb
),
(
  'Hawaii Executive Office on Aging',
  'Senior Services',
  'Hawaii EOA administers the statewide Aging and Disability Resource Center network, connecting seniors and family caregivers to local services — meals, transportation, in-home care, caregiver support, and benefits counseling.',
  '~$2,000/year in services (meals, transport, care coordination)',
  'Hawaiians 60 and older and their family caregivers',
  '808-586-0100',
  'https://health.hawaii.gov/eoa/',
  2000, 'state', 'HI', null, 'hawaii-executive-office-on-aging', true, null,
  '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb
),
(
  'Hawaii 211 (Aloha United Way)',
  'Information & Referral',
  'Hawaii 211 is the statewide health and human services helpline operated by Aloha United Way. Call 2-1-1 or visit auw211.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, kūpuna care, and crisis support. Free, confidential, available 24/7.',
  'Free referral to local assistance programs',
  'Anyone in Hawaii needing help finding local services',
  '211',
  'https://auw211.org',
  0, 'state', 'HI', null, 'hawaii-211', true, null,
  '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
);

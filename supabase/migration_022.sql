-- migration_022: Add Nevada, Alabama, Alaska, and Arizona programs.
--
-- Nine programs per state (Medicaid, SNAP, TANF, housing, LIHEAP,
-- unemployment, veterans, aging, 211) following the migration_018
-- conventions and using migration_020's max_income_percent_fpl schema
-- where applicable.
--
-- Alabama Medicaid is gated by required_situations the same way Florida
-- is — both states did not expand Medicaid, so most adults outside
-- single_parent / pregnant / disability categories don't qualify
-- regardless of income.
--
-- Alaska note: the four AK rows that use max_income_percent_fpl
-- (alaska-medicaid, alaska-snap, alaska-heating-assistance) will be
-- evaluated against contiguous-states FPL by current_fpl_monthly(),
-- under-estimating real Alaska caps by ~25%. This is a known
-- approximation pending the state-aware FPL function (see TODO.md).

insert into programs (
  name, category, description, potential_benefit, who_qualifies,
  phone_number, apply_url, benefit_value, scope, state, jurisdiction_name,
  slug, is_active, important_notes, eligibility_rules
) values

-- ============================================================
-- NEVADA (9)
-- ============================================================
(
  'Nevada Medicaid',
  'Health Insurance',
  'Nevada Medicaid provides health coverage including doctor visits, hospital care, prescriptions, mental health, and preventive services. Nevada expanded Medicaid for adults under the ACA. Apply through Access Nevada.',
  'Full health coverage at little to no cost',
  'Nevada adults at or below 138% of the federal poverty level, plus children, pregnant women, seniors, and people with disabilities at higher limits',
  '1-877-543-7669',
  'https://accessnevada.nv.gov/',
  15000, 'state', 'NV', null, 'nevada-medicaid', true, null,
  '{"max_income_percent_fpl": 138, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Nevada SNAP',
  'Food Assistance',
  'Nevada''s Supplemental Nutrition Assistance Program provides monthly food benefits on an EBT card that works at most grocery stores. Apply through Access Nevada.',
  'Up to ~$975/month for a family of four',
  'Nevada households with gross monthly income at or below 130% of the federal poverty level',
  '1-800-992-0900',
  'https://accessnevada.nv.gov/',
  11676, 'state', 'NV', null, 'nevada-snap', true, null,
  '{"max_income_percent_fpl": 130, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Nevada TANF',
  'Cash Assistance',
  'Monthly cash assistance for low-income Nevada families with minor children, plus access to employment and child-care help. Administered by the Division of Welfare and Supportive Services.',
  'Up to ~$386/month for a family of three',
  'Nevada families with minor children and very low income',
  '1-800-992-0900',
  'https://accessnevada.nv.gov/',
  3500, 'state', 'NV', null, 'nevada-tanf', true, null,
  '{"max_monthly_income": 1200, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Home Is Possible (Nevada Housing Division)',
  'Housing Assistance',
  'Nevada Housing Division''s flagship homebuyer program offers down-payment and closing-cost assistance plus below-market mortgage rates for first-time and qualifying repeat buyers, with income and home-price limits that vary by county.',
  'Up to 5% in down-payment and closing-cost assistance',
  'Nevada homebuyers meeting program income and home-price limits',
  '1-866-733-7779',
  'https://housing.nv.gov',
  10000, 'state', 'NV', null, 'nevada-home-is-possible', true, null,
  '{"max_monthly_income": 8000, "min_age": 18, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Nevada Energy Assistance Program (EAP)',
  'Utility Assistance',
  'Nevada''s federally-funded Low-Income Home Energy Assistance Program helps qualifying households pay heating, cooling, and crisis energy bills. Administered by the Division of Welfare and Supportive Services.',
  '$300–$1,500 per year toward energy bills',
  'Nevada households with income at or below 150% of the federal poverty level',
  '1-800-992-0900',
  'https://dwss.nv.gov/Energy/Energy_Assistance_Program/',
  1300, 'state', 'NV', null, 'nevada-eap', true, null,
  '{"max_income_percent_fpl": 150, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Nevada Unemployment Insurance',
  'Income Assistance',
  'Weekly cash benefits for Nevadans who lost their job through no fault of their own. Administered by the Department of Employment, Training and Rehabilitation (DETR). Most claimants receive benefits for up to 26 weeks.',
  'Up to $599/week (~$31,100/year max)',
  'Workers laid off through no fault of their own with sufficient base-period earnings',
  '1-775-684-0350',
  'https://ui.nv.gov',
  13000, 'state', 'NV', null, 'nevada-unemployment', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb
),
(
  'Nevada Department of Veterans Services',
  'Veteran Services',
  'The state agency that helps Nevada veterans access VA benefits, education aid, employment services, healthcare, and emergency assistance through veterans service officers in offices across the state.',
  'Free benefits counseling plus access to state veterans homes and emergency funds',
  'Nevada veterans, active-duty service members, and their dependents',
  '1-866-630-1283',
  'https://veterans.nv.gov',
  5000, 'state', 'NV', null, 'nevada-veterans-services', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb
),
(
  'Nevada Aging and Disability Services Division',
  'Senior Services',
  'Nevada''s ADSD operates the statewide ADRC line, connecting seniors and people with disabilities to local services — meals, transportation, in-home care, caregiver support, benefits counseling, and elder abuse prevention.',
  '~$2,000/year in services (meals, transport, care coordination)',
  'Nevadans 60 and older and their family caregivers',
  '1-800-307-4444',
  'https://adsd.nv.gov',
  2000, 'state', 'NV', null, 'nevada-adsd', true, null,
  '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb
),
(
  'Nevada 211',
  'Information & Referral',
  'Nevada 211 is the statewide health and human services helpline. Call 2-1-1 or visit nevada211.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, and crisis support. Free, confidential, available 24/7.',
  'Free referral to local assistance programs',
  'Anyone in Nevada needing help finding local services',
  '211',
  'https://www.nevada211.org',
  0, 'state', 'NV', null, 'nevada-211', true, null,
  '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),

-- ============================================================
-- ALABAMA (9)
-- ============================================================
(
  'Alabama Medicaid',
  'Health Insurance',
  'Alabama Medicaid provides health coverage including doctor visits, hospital care, prescriptions, and preventive services. Alabama did not expand Medicaid for non-disabled adults, so most adult coverage is limited to parents of minor children, pregnant women, and people with disabilities.',
  'Full health coverage at little to no cost',
  'Low-income parents of minor children, pregnant women, people with disabilities, seniors, and children',
  '1-800-362-1504',
  'https://medicaid.alabama.gov',
  15000, 'state', 'AL', null, 'alabama-medicaid', true,
  'Alabama did not expand Medicaid. Most adults without children, disability, or pregnancy do not qualify regardless of income.',
  '{"max_income_percent_fpl": 138, "min_age": null, "max_age": null, "required_situations": ["single_parent", "pregnant", "disability"]}'::jsonb
),
(
  'Alabama SNAP (Food Assistance)',
  'Food Assistance',
  'Alabama''s Supplemental Nutrition Assistance Program provides monthly food benefits on an EBT card. Administered by the Department of Human Resources.',
  'Up to ~$975/month for a family of four',
  'Alabama households with gross monthly income at or below 130% of the federal poverty level',
  '1-866-465-2285',
  'https://dhr.alabama.gov/services/food_assistance/',
  11676, 'state', 'AL', null, 'alabama-snap', true, null,
  '{"max_income_percent_fpl": 130, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alabama Family Assistance (TANF)',
  'Cash Assistance',
  'Monthly cash assistance for very low-income Alabama families with minor children, plus job placement services. Alabama TANF benefits are among the lowest in the nation.',
  'Up to ~$215/month for a family of three',
  'Alabama families with minor children and very low income',
  '1-866-465-2285',
  'https://dhr.alabama.gov/services/family_assistance/',
  3500, 'state', 'AL', null, 'alabama-family-assistance', true, null,
  '{"max_monthly_income": 700, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Alabama Housing Finance Authority Step Up',
  'Housing Assistance',
  'Alabama Housing Finance Authority''s Step Up program offers 30-year fixed-rate mortgages plus down-payment assistance for first-time and qualifying repeat buyers, with income limits by household size and county.',
  'Down-payment assistance plus below-market mortgage rates',
  'First-time homebuyers in Alabama meeting income and home-price limits',
  '1-800-325-2432',
  'https://www.ahfa.com',
  10000, 'state', 'AL', null, 'alabama-step-up', true, null,
  '{"max_monthly_income": 8000, "min_age": 18, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alabama LIHEAP',
  'Utility Assistance',
  'Alabama''s federally-funded Low-Income Home Energy Assistance Program helps qualifying households pay heating, cooling, and crisis energy bills. Administered by the Alabama Department of Economic and Community Affairs (ADECA) through local Community Action Agencies.',
  '$300–$1,500 per year toward energy bills',
  'Alabama households with income at or below 150% of the federal poverty level',
  '1-800-392-8098',
  'https://adeca.alabama.gov/community-services/community-services-block-grant/',
  1300, 'state', 'AL', null, 'alabama-liheap', true,
  'LIHEAP funds are distributed through local Community Action Agencies — call 211 to find your local provider.',
  '{"max_income_percent_fpl": 150, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alabama Unemployment Compensation',
  'Income Assistance',
  'Weekly cash benefits for Alabamians who lost their job through no fault of their own. Administered by the Alabama Department of Labor.',
  'Up to $275/week ($14,300/year max)',
  'Workers laid off through no fault of their own with sufficient base-period earnings',
  '1-866-234-5382',
  'https://labor.alabama.gov',
  13000, 'state', 'AL', null, 'alabama-unemployment', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb
),
(
  'Alabama Department of Veterans Affairs',
  'Veteran Services',
  'The state agency that helps Alabama veterans access VA benefits, education aid, employment, healthcare, and emergency assistance through county Veteran Service Offices.',
  'Free benefits counseling plus access to state veterans homes',
  'Alabama veterans, active-duty service members, and their dependents',
  '334-242-5077',
  'https://va.alabama.gov',
  5000, 'state', 'AL', null, 'alabama-veterans-affairs', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb
),
(
  'Alabama Department of Senior Services',
  'Senior Services',
  'Alabama''s ADSS Aging Helpline (1-877-425-2243, also known as 1-800-AGELINE) is the statewide entry point to the network of 13 Area Agencies on Aging that provide seniors with help locating services — meals, transportation, in-home care, caregiver support, and benefits counseling.',
  '~$2,000/year in services (meals, transport, care coordination)',
  'Alabamians 60 and older and their family caregivers',
  '1-877-425-2243',
  'https://alabamaageline.gov',
  2000, 'state', 'AL', null, 'alabama-senior-services', true, null,
  '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb
),
(
  'Alabama 211',
  'Information & Referral',
  'Alabama 211 (211 Connects Alabama) is the statewide health and human services helpline. Call 2-1-1 or visit 211connectsalabama.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, and crisis support. Free, confidential, available 24/7.',
  'Free referral to local assistance programs',
  'Anyone in Alabama needing help finding local services',
  '211',
  'https://www.211connectsalabama.org',
  0, 'state', 'AL', null, 'alabama-211', true, null,
  '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),

-- ============================================================
-- ALASKA (9)
-- ============================================================
-- Note: AK rows that use max_income_percent_fpl will be evaluated by
-- current_fpl_monthly() against contiguous-states FPL, under-estimating
-- AK caps by ~25%. State-aware FPL function tracked in TODO.md.
(
  'Alaska Medicaid',
  'Health Insurance',
  'Alaska Medicaid provides health coverage including doctor visits, hospital care, prescriptions, mental health, and preventive services. Alaska expanded Medicaid for adults under the ACA. Apply through the Division of Public Assistance.',
  'Full health coverage at little to no cost',
  'Alaska adults at or below 138% of the federal poverty level, plus children, pregnant women, seniors, and people with disabilities at higher limits',
  '1-800-478-7778',
  'https://health.alaska.gov/dpa/Pages/medicaid/',
  15000, 'state', 'AK', null, 'alaska-medicaid', true,
  'Alaska''s federal poverty guidelines are higher than the 48 contiguous states. Eligibility limits in your state may be more generous than what is shown here.',
  '{"max_income_percent_fpl": 138, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alaska SNAP (Food Stamp Program)',
  'Food Assistance',
  'Alaska''s Food Stamp Program provides monthly food benefits on a Quest EBT card. Administered by the Division of Public Assistance.',
  'Up to ~$1,490/month for a family of four (Alaska benefit levels are higher than contiguous states)',
  'Alaska households with gross monthly income at or below 130% of the Alaska federal poverty level',
  '1-800-770-5650',
  'https://health.alaska.gov/dpa/Pages/fstamps/default.aspx',
  11676, 'state', 'AK', null, 'alaska-snap', true,
  'Alaska SNAP eligibility uses Alaska FPL, which is higher than the 48-state guidelines. The cap shown here may under-estimate your actual eligibility.',
  '{"max_income_percent_fpl": 130, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alaska Temporary Assistance Program (ATAP)',
  'Cash Assistance',
  'Monthly cash assistance for low-income Alaska families with minor children, plus access to employment services. Administered by the Division of Public Assistance.',
  'Up to ~$923/month for a family of three',
  'Alaska families with minor children and limited income/resources',
  '1-800-770-5650',
  'https://health.alaska.gov/dpa/Pages/atap/default.aspx',
  3500, 'state', 'AK', null, 'alaska-atap', true, null,
  '{"max_monthly_income": 1700, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Alaska Housing Finance Corporation (AHFC)',
  'Housing Assistance',
  'AHFC offers low-interest mortgages, down-payment assistance, energy efficiency loans, and first-time homebuyer programs for Alaskans, with income and home-price limits that vary by region.',
  'Down-payment assistance plus below-market mortgage rates',
  'Alaska homebuyers meeting AHFC program income and home-price limits',
  '1-800-478-2432',
  'https://www.ahfc.us',
  10000, 'state', 'AK', null, 'alaska-ahfc', true, null,
  '{"max_monthly_income": 9000, "min_age": 18, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alaska Heating Assistance Program (AHAP)',
  'Utility Assistance',
  'Alaska''s federally-funded LIHEAP equivalent helps qualifying households pay heating bills and crisis energy needs. Administered by the Division of Public Assistance.',
  '$200–$2,000 per year toward heating bills',
  'Alaska households with income at or below 150% of the Alaska federal poverty level',
  '1-800-470-3058',
  'https://health.alaska.gov/dpa/Pages/hap/',
  1300, 'state', 'AK', null, 'alaska-heating-assistance', true,
  'Alaska AHAP uses Alaska FPL, which is higher than the 48-state guidelines. The cap shown here may under-estimate your actual eligibility.',
  '{"max_income_percent_fpl": 150, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Alaska Unemployment Insurance',
  'Income Assistance',
  'Weekly cash benefits for Alaskans who lost their job through no fault of their own. Administered by the Department of Labor and Workforce Development. Most claimants receive benefits for up to 26 weeks.',
  'Up to $370/week ($19,240/year max)',
  'Workers laid off through no fault of their own with sufficient base-period earnings',
  '1-907-269-4700',
  'https://labor.alaska.gov/unemployment/',
  13000, 'state', 'AK', null, 'alaska-unemployment', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb
),
(
  'Alaska Office of Veterans Affairs',
  'Veteran Services',
  'The state agency that helps Alaska veterans access VA benefits, education aid, employment, healthcare, and emergency assistance through veteran service officers.',
  'Free benefits counseling plus access to state veterans cemeteries and emergency funds',
  'Alaska veterans, active-duty service members, and their dependents',
  '1-800-478-2367',
  'https://veterans.alaska.gov',
  5000, 'state', 'AK', null, 'alaska-veterans-affairs', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb
),
(
  'Alaska Senior and Disabilities Services',
  'Senior Services',
  'Alaska SDS administers home and community-based services for seniors and people with disabilities, plus the statewide Aging and Disability Resource Center network.',
  '~$2,000/year in services (meals, transport, care coordination)',
  'Alaskans 60 and older and their family caregivers',
  '1-907-269-3666',
  'https://health.alaska.gov/dsds/',
  2000, 'state', 'AK', null, 'alaska-senior-services', true, null,
  '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb
),
(
  'Alaska 211',
  'Information & Referral',
  'Alaska 211 is the statewide health and human services helpline. Call 2-1-1 or visit alaska211.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, and crisis support. Free, confidential, available 24/7.',
  'Free referral to local assistance programs',
  'Anyone in Alaska needing help finding local services',
  '211',
  'https://alaska211.org',
  0, 'state', 'AK', null, 'alaska-211', true, null,
  '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),

-- ============================================================
-- ARIZONA (9)
-- ============================================================
(
  'Arizona AHCCCS (Arizona Medicaid)',
  'Health Insurance',
  'AHCCCS — Arizona Health Care Cost Containment System — provides health coverage including doctor visits, hospital care, prescriptions, mental health, and preventive services. Arizona expanded Medicaid for adults under the ACA. Apply through Health-e-Arizona Plus.',
  'Full health coverage at little to no cost',
  'Arizona adults at or below 138% of the federal poverty level, plus children, pregnant women, seniors, and people with disabilities at higher limits',
  '1-855-432-7587',
  'https://www.healthearizonaplus.gov',
  15000, 'state', 'AZ', null, 'arizona-ahcccs', true, null,
  '{"max_income_percent_fpl": 138, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Arizona Nutrition Assistance (SNAP)',
  'Food Assistance',
  'Arizona''s Nutrition Assistance Program provides monthly food benefits on an EBT card. Administered by the Department of Economic Security through Health-e-Arizona Plus.',
  'Up to ~$975/month for a family of four',
  'Arizona households with gross monthly income at or below 130% of the federal poverty level',
  '1-855-432-7587',
  'https://www.healthearizonaplus.gov',
  11676, 'state', 'AZ', null, 'arizona-nutrition-assistance', true, null,
  '{"max_income_percent_fpl": 130, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Arizona Cash Assistance (TANF)',
  'Cash Assistance',
  'Monthly cash assistance for low-income Arizona families with minor children, plus access to employment services. Administered by the Department of Economic Security through Health-e-Arizona Plus.',
  'Up to ~$278/month for a family of three',
  'Arizona families with minor children and limited income/resources',
  '1-855-432-7587',
  'https://www.healthearizonaplus.gov',
  3500, 'state', 'AZ', null, 'arizona-cash-assistance', true, null,
  '{"max_monthly_income": 1100, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Arizona Department of Housing',
  'Housing Assistance',
  'Arizona Department of Housing administers Home Plus, the statewide first-time homebuyer program providing down-payment assistance and below-market mortgage rates, plus rental assistance and HOPE for the development of affordable housing.',
  'Down-payment assistance plus below-market mortgage rates',
  'Arizona homebuyers meeting program income and home-price limits',
  '602-771-1000',
  'https://housing.az.gov',
  10000, 'state', 'AZ', null, 'arizona-housing', true, null,
  '{"max_monthly_income": 8000, "min_age": 18, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Arizona Utility Assistance (LIHEAP)',
  'Utility Assistance',
  'Arizona''s federally-funded LIHEAP helps qualifying households pay heating, cooling, and crisis energy bills. Administered by the Department of Economic Security through local Community Action Agencies.',
  '$300–$1,500 per year toward energy bills',
  'Arizona households with income at or below 150% of the federal poverty level',
  '1-833-318-3933',
  'https://des.az.gov/services/basic-needs/utility-assistance',
  1300, 'state', 'AZ', null, 'arizona-utility-assistance', true,
  'LIHEAP funds are distributed through local Community Action Agencies — call 211 to find your local provider.',
  '{"max_income_percent_fpl": 150, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Arizona Unemployment Insurance',
  'Income Assistance',
  'Weekly cash benefits for Arizonans who lost their job through no fault of their own. Administered by the Department of Economic Security. Most claimants receive benefits for up to 24 weeks.',
  'Up to $320/week ($16,600/year max)',
  'Workers laid off through no fault of their own with sufficient base-period earnings',
  '1-877-600-2722',
  'https://des.az.gov/services/employment/unemployment-individual',
  13000, 'state', 'AZ', null, 'arizona-unemployment', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb
),
(
  'Arizona Department of Veterans'' Services',
  'Veteran Services',
  'The state agency that helps Arizona veterans access VA benefits, education aid, employment, healthcare, and emergency assistance through veterans service officers and three state veterans homes.',
  'Free benefits counseling plus access to state veterans homes and emergency funds',
  'Arizona veterans, active-duty service members, and their dependents',
  '1-602-255-3373',
  'https://dvs.az.gov',
  5000, 'state', 'AZ', null, 'arizona-veterans-services', true, null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb
),
(
  'Arizona Aging and Adult Services',
  'Senior Services',
  'Arizona''s Adult Information Line connects callers to Area Agencies on Aging across the state, which provide seniors with meals, transportation, in-home care, caregiver support, and benefits counseling.',
  '~$2,000/year in services (meals, transport, care coordination)',
  'Arizonans 60 and older and their family caregivers',
  '1-844-755-5021',
  'https://des.az.gov/services/aging-and-adult',
  2000, 'state', 'AZ', null, 'arizona-aging-adult-services', true, null,
  '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb
),
(
  'Arizona 211',
  'Information & Referral',
  'Arizona 211 is the statewide health and human services helpline. Call 2-1-1 or visit 211arizona.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, and crisis support. Free, confidential, available 24/7.',
  'Free referral to local assistance programs',
  'Anyone in Arizona needing help finding local services',
  '211',
  'https://211arizona.org',
  0, 'state', 'AZ', null, 'arizona-211', true, null,
  '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
);

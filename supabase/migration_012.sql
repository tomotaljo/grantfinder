-- Texas benefit and assistance programs
-- TODO: Review semi-annually — Texas program contacts/URLs change. Last reviewed: 2026-05.

insert into programs (
  name, category, description, potential_benefit, who_qualifies,
  phone_number, apply_url, benefit_value, state, slug,
  is_active, important_notes, eligibility_rules
) values

-- ============================================================
-- STATE MEDICAID / CHIP
-- ============================================================
(
  'Texas Medicaid (STAR)',
  'Health Insurance',
  'Texas Medicaid (STAR is the managed-care program covering most enrollees) provides free health coverage including doctor visits, hospital care, prescriptions, mental health, and preventive care. Apply on YourTexasBenefits.com or call 2-1-1.',
  'Full health coverage at little to no cost',
  'Low-income children, pregnant women, parents, seniors, and people with disabilities living in Texas',
  '1-877-541-7905',
  'https://www.yourtexasbenefits.com',
  15000,
  'TX',
  'texas-medicaid-star',
  true,
  null,
  '{"max_monthly_income": 3200, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Texas CHIP (Children''s Health Insurance Program)',
  'Health Insurance',
  'CHIP provides low-cost health coverage for children whose families earn too much for Medicaid but cannot afford private insurance. Includes doctor visits, immunizations, prescriptions, dental, and vision care. Most families pay $35 or less per year.',
  'Full child health coverage for $50/year or less per family',
  'Children under 19 in families with income up to ~200% of the federal poverty level',
  '1-800-647-6558',
  'https://www.yourtexasbenefits.com',
  4000,
  'TX',
  'texas-chip',
  true,
  null,
  '{"max_monthly_income": 5300, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Healthy Texas Women',
  'Health Insurance',
  'A state-funded program providing women''s health and family-planning services at no cost — including well-woman exams, contraception, screenings for diabetes, breast and cervical cancer, and treatment for postpartum depression.',
  'Free women''s health and family planning services',
  'Texas women ages 18–44 with household income at or below 200% of the federal poverty level who are not pregnant and not enrolled in Medicaid/CHIP',
  '1-866-993-9972',
  'https://www.healthytexaswomen.org',
  2400,
  'TX',
  'healthy-texas-women',
  true,
  null,
  '{"max_monthly_income": 2500, "min_age": 18, "max_age": 44, "required_situations": []}'::jsonb
),
(
  'Texas STAR+PLUS (Medicaid for Seniors and People with Disabilities)',
  'Health Insurance',
  'A Medicaid managed-care program that combines acute medical care with long-term services and supports — including in-home attendant care, adult day care, and nursing-facility coverage — for adults who are 65+ or have a disability.',
  'Full health coverage plus long-term care services',
  'Texas adults 21+ who qualify for Medicaid based on age (65+), blindness, or disability',
  '1-800-964-2777',
  'https://www.yourtexasbenefits.com',
  18000,
  'TX',
  'texas-star-plus',
  true,
  null,
  '{"max_monthly_income": 2900, "min_age": 21, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
),
(
  'Texas Medicare Savings Program',
  'Health Insurance',
  'Helps low-income Medicare beneficiaries pay Medicare Part A and B premiums, deductibles, and copays. The QMB tier covers premiums and cost-sharing; SLMB and QI tiers cover the Part B premium.',
  'Up to ~$2,100/year in Medicare premium and cost-sharing savings',
  'Texans on Medicare with monthly income at or below ~$1,700 (single) or ~$2,300 (couple)',
  '1-800-252-9240',
  'https://www.hhs.texas.gov/services/health/medicaid-chip/programs/medicare-savings-programs',
  2100,
  'TX',
  'texas-medicare-savings',
  true,
  null,
  '{"max_monthly_income": 2300, "min_age": 65, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
),

-- ============================================================
-- STATE FOOD ASSISTANCE
-- ============================================================
(
  'Texas SNAP (Lone Star Card)',
  'Food Assistance',
  'Texas SNAP provides monthly food benefits on a Lone Star Card that works like a debit card at most grocery stores and farmers markets. Apply through YourTexasBenefits.com.',
  'Up to ~$975/month for a family of four',
  'Texas households with gross monthly income at or below 165% of the federal poverty level (most households)',
  '1-877-541-7905',
  'https://www.yourtexasbenefits.com',
  11676,
  'TX',
  'texas-snap',
  true,
  null,
  '{"max_monthly_income": 3200, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Texas WIC (Women, Infants, and Children)',
  'Food Assistance',
  'Texas WIC provides nutritious foods, breastfeeding support, nutrition education, and health-care referrals for pregnant and postpartum women, infants, and children up to age 5.',
  '~$50–$100/month in food benefits per participant, plus free formula and nutrition counseling',
  'Pregnant, postpartum, or breastfeeding women, and children under 5, in Texas households at or below 185% of the federal poverty level',
  '1-800-942-3678',
  'https://www.texaswic.org',
  1500,
  'TX',
  'texas-wic',
  true,
  null,
  '{"max_monthly_income": 4280, "min_age": null, "max_age": null, "required_situations": ["pregnant", "single_parent"]}'::jsonb
),
(
  'Texas Summer EBT (SUN Bucks)',
  'Food Assistance',
  'Provides $120 per eligible child for the summer to help families buy groceries when free/reduced-price school meals are not available. Most eligible kids are enrolled automatically.',
  '$120 per child per summer',
  'School-age children in Texas families enrolled in SNAP, TANF, Medicaid, or who attend a school participating in the National School Lunch Program and qualify by income',
  '1-877-541-7905',
  'https://www.hhs.texas.gov/services/financial/summer-ebt',
  360,
  'TX',
  'texas-summer-ebt',
  true,
  null,
  '{"max_monthly_income": 4280, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Texas Emergency Food Assistance (TEFAP)',
  'Food Assistance',
  'TEFAP provides free USDA-supplied food through Texas food banks and pantries. Distribution is run through the Feeding Texas network — call the Hunger Hotline or visit feedingtexas.org to find your local food bank.',
  'Free groceries — varies by household size',
  'Texas residents whose household income is at or below 185% of the federal poverty level',
  '1-877-839-6325',
  'https://www.feedingtexas.org/get-help',
  1200,
  'TX',
  'texas-tefap',
  true,
  null,
  '{"max_monthly_income": 4280, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),

-- ============================================================
-- STATE ENERGY ASSISTANCE
-- ============================================================
(
  'Texas Comprehensive Energy Assistance Program (CEAP)',
  'Utility Assistance',
  'Texas''s LIHEAP-funded program helps low-income households pay heating and cooling bills, weather-related crises, and energy-related home repairs. Administered by TDHCA through local community-action agencies. Call 2-1-1 to find your local provider.',
  '$300–$1,800 per year toward energy bills',
  'Texas households with income at or below 150% of the federal poverty level',
  '1-877-399-8939',
  'https://www.tdhca.texas.gov/community-affairs/ceap',
  1300,
  'TX',
  'texas-ceap',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Texas Weatherization Assistance Program (WAP)',
  'Utility Assistance',
  'Free energy-efficiency upgrades — insulation, weather-stripping, duct sealing, heating/cooling repairs — for low-income Texas households. Reduces energy bills permanently. Administered by TDHCA through local providers.',
  '~$6,000 average value in home energy upgrades',
  'Texas homeowners and renters at or below 200% of the federal poverty level; priority for seniors, people with disabilities, and families with young children',
  '1-877-399-8939',
  'https://www.tdhca.texas.gov/community-affairs/wap',
  6500,
  'TX',
  'texas-wap',
  true,
  null,
  '{"max_monthly_income": 5000, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),

-- ============================================================
-- STATE HOUSING ASSISTANCE
-- ============================================================
(
  'My First Texas Home (TDHCA)',
  'Housing Assistance',
  'TDHCA''s flagship homebuyer program provides 30-year fixed-rate mortgages plus down-payment and closing-cost assistance (typically 5% of the loan) for first-time and qualifying repeat buyers in Texas.',
  'Up to ~$15,000 in down-payment and closing-cost assistance',
  'First-time homebuyers (or buyers in targeted areas), with income within county limits and a credit score of 620+',
  '1-800-792-1119',
  'https://www.tdhca.texas.gov/homeownership/fthb',
  10000,
  'TX',
  'my-first-texas-home',
  true,
  'Income limits and home-price caps vary by county. Check the TDHCA site for your county''s current limits.',
  '{"max_monthly_income": 8000, "min_age": 18, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Texas Rental Assistance via 211',
  'Housing Assistance',
  'The statewide Texas Rent Relief program ended in 2023, but local rental assistance is still available through county and city programs, nonprofits, and emergency funds. Call 2-1-1 or visit 211texas.org to find current rental-assistance options in your area.',
  'Varies by county and program',
  'Low-income renters at risk of eviction or housing instability anywhere in Texas',
  '2-1-1',
  'https://www.211texas.org',
  2400,
  'TX',
  'texas-rental-assistance',
  true,
  'Available programs vary by county and change frequently. Call 2-1-1 for the most current local options.',
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["homeless", "low_income"]}'::jsonb
),
(
  'Texas Section 8 Housing Choice Voucher',
  'Housing Assistance',
  'Federal rental-assistance vouchers administered by local Texas housing authorities. Pays the difference between 30% of the family''s income and the rent on a private-market unit. Most agencies have long waitlists; some are closed.',
  'Pays rent above 30% of household income, often $800–$1,500/month',
  'Very-low-income Texas households (typically below 50% of area median income); priority for elderly, disabled, and families with children',
  '1-800-955-2232',
  'https://www.hud.gov/states/texas/renting',
  12000,
  'TX',
  'texas-section-8',
  true,
  'Most Texas housing authorities have multi-year waitlists. Apply at any agency where the waitlist is open.',
  '{"max_monthly_income": 3500, "min_age": null, "max_age": null, "required_situations": ["low_income", "homeless"]}'::jsonb
),

-- ============================================================
-- STATE SENIOR PROGRAMS
-- ============================================================
(
  'Texas Property Tax Homestead Exemption (Over 65)',
  'Tax Relief',
  'Texas homeowners 65 and older receive an additional $10,000 school-district homestead exemption (on top of the standard $100,000) and a permanent ceiling on school-district property taxes. Many cities and counties add their own age-65 exemptions.',
  '$1,000–$2,500/year in property tax savings',
  'Texas homeowners 65 or older living in their home as a primary residence',
  '1-800-252-9121',
  'https://comptroller.texas.gov/taxes/property-tax/exemptions/age65older-disabled-faq.php',
  1500,
  'TX',
  'texas-homestead-65',
  true,
  'File the application with your county appraisal district, not the state. Once approved, the exemption renews automatically.',
  '{"max_monthly_income": null, "min_age": 65, "max_age": null, "required_situations": ["senior"]}'::jsonb
),
(
  'Texas Area Agencies on Aging',
  'Senior Services',
  'Statewide network of 28 Area Agencies on Aging providing seniors with help locating services — meals, transportation, in-home care, benefits counseling, legal aid, and caregiver support — through the Aging and Disability Resource Center (ADRC).',
  '~$2,000/year in services (meals, transport, care coordination)',
  'Texans 60 and older and their family caregivers',
  '1-855-937-2372',
  'https://www.hhs.texas.gov/services/aging/long-term-care/aging-disability-resource-center',
  2000,
  'TX',
  'texas-area-agencies-on-aging',
  true,
  null,
  '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb
),
(
  'Texas Community Care for Aged and Disabled (CCAD)',
  'Senior Services',
  'Provides in-home and community-based services — personal-attendant care, adult foster care, day activity, and home-delivered meals — that help older adults and people with disabilities remain in their homes instead of moving to a nursing facility.',
  '~$10,000/year in in-home care services',
  'Texans 65+ or with a disability who need help with daily activities and meet Medicaid financial criteria',
  '1-855-937-2372',
  'https://www.hhs.texas.gov/services/aging/long-term-care/community-care-services-eligibility',
  10000,
  'TX',
  'texas-ccad',
  true,
  null,
  '{"max_monthly_income": 2900, "min_age": 65, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
),

-- ============================================================
-- MAJOR UTILITY COMPANY ASSISTANCE
-- ============================================================
(
  'Oncor Energy Assistance',
  'Utility Assistance',
  'Oncor partners with local community-action agencies and the Salvation Army to help customers in its delivery area pay overdue electric bills. Funds are limited and distributed first-come, first-served. Call 2-1-1 to be referred to a local provider.',
  '~$300–$500 toward an overdue electric bill',
  'Oncor delivery-area customers (most of North/East/West Texas) facing utility hardship',
  '1-888-313-4747',
  'https://www.oncor.com/en/customer-care/customer-care/help-paying-your-bill',
  400,
  'TX',
  'oncor-energy-assistance',
  true,
  'Oncor is a delivery company — sign up by calling your retail electric provider, then ask about Oncor-funded assistance.',
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "unemployed"]}'::jsonb
),
(
  'CenterPoint Energy Bill Payment Assistance',
  'Utility Assistance',
  'CenterPoint partners with the Salvation Army through programs like "Energy Aid" to help low-income customers pay overdue gas and electric bills. Available to customers in CenterPoint''s Houston-area electric delivery zone and natural-gas service areas.',
  '~$300–$400 toward an overdue energy bill',
  'CenterPoint Energy customers experiencing financial hardship',
  '1-800-752-8036',
  'https://www.centerpointenergy.com/en-us/residential/customer-service/save-money/payment-assistance',
  400,
  'TX',
  'centerpoint-energy-assistance',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "unemployed"]}'::jsonb
),
(
  'AEP Texas Neighbor to Neighbor',
  'Utility Assistance',
  'AEP Texas''s emergency bill-pay program for customers in its Central and North Texas delivery areas. Funded by AEP shareholders and customer donations and distributed through community-action partners.',
  '~$300–$500 toward an overdue electric bill',
  'AEP Texas delivery-area customers (Corpus Christi, Abilene, San Angelo, Laredo regions) with documented hardship',
  '1-877-373-4858',
  'https://www.aeptexas.com/account/bills/assistance',
  400,
  'TX',
  'aep-texas-neighbor-to-neighbor',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "unemployed"]}'::jsonb
),
(
  'TXU Energy Aid',
  'Utility Assistance',
  'A long-running bill-payment assistance program funded by TXU Energy and administered by the Salvation Army. Helps qualifying TXU Energy customers pay past-due electric bills and avoid disconnection.',
  'Up to $600 per year toward an overdue electric bill',
  'TXU Energy customers experiencing financial hardship — seniors, veterans, disabled, families with children, and low-income households are prioritized',
  '1-800-818-6132',
  'https://www.txu.com/residential/customer-service/payment-options/energy-aid.aspx',
  600,
  'TX',
  'txu-energy-aid',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "senior", "veteran", "disability"]}'::jsonb
),

-- ============================================================
-- STATE-SPECIFIC FINANCIAL ASSISTANCE
-- ============================================================
(
  'Texas TANF (Temporary Assistance for Needy Families)',
  'Cash Assistance',
  'Provides monthly cash assistance for very low-income families with children, plus access to job training and child-care help. Texas TANF benefits are among the lowest in the nation — typical maximum is ~$300/month for a family of three.',
  'Up to $303/month for a family of three',
  'Texas families with children under 18 and very low income (below ~17% of the federal poverty level)',
  '1-877-541-7905',
  'https://www.yourtexasbenefits.com',
  3600,
  'TX',
  'texas-tanf',
  true,
  null,
  '{"max_monthly_income": 800, "min_age": null, "max_age": null, "required_situations": ["single_parent", "low_income"]}'::jsonb
),
(
  'Texas Unemployment Insurance',
  'Income Assistance',
  'Weekly cash benefits for Texans who lost their job through no fault of their own. Apply online with the Texas Workforce Commission. Most claimants receive benefits for up to 26 weeks; you must be actively searching for work.',
  '$73–$591/week (up to ~$30,700/year max)',
  'Workers laid off or who lost a job through no fault of their own, with sufficient earnings during the base period',
  '1-800-939-6631',
  'https://www.twc.texas.gov/programs/unemployment-benefits',
  13000,
  'TX',
  'texas-unemployment-insurance',
  true,
  null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb
),
(
  'Texas Lifeline Program',
  'Phone & Internet',
  'A monthly discount on phone or internet service for low-income Texans. Federal Lifeline gives a $9.25/month discount; the Texas Low-Income Discount Program adds a state-funded discount on top through participating providers.',
  '~$13.75/month off phone or internet (~$165/year)',
  'Texans on SNAP, Medicaid, SSI, public housing, or veterans pension; or with household income at or below 135% of federal poverty level',
  '1-866-454-8387',
  'https://www.lifeline.texas.gov',
  165,
  'TX',
  'texas-lifeline',
  true,
  null,
  '{"max_monthly_income": 2500, "min_age": null, "max_age": null, "required_situations": ["low_income", "senior", "disability", "veteran"]}'::jsonb
),
(
  'Texas Workforce Solutions Child Care Services',
  'Childcare Assistance',
  'Subsidies that pay most or all of the cost of licensed child care for working or training low-income Texas parents. Administered by 28 local Workforce Development Boards.',
  '~$8,000–$12,000/year per child in subsidized care',
  'Texas parents who are working, in school, or in workforce training, with household income at or below 85% of state median income',
  '1-800-628-5115',
  'https://www.twc.texas.gov/programs/child-care',
  9000,
  'TX',
  'texas-child-care-services',
  true,
  null,
  '{"max_monthly_income": 5500, "min_age": 18, "max_age": null, "required_situations": ["single_parent", "low_income", "student"]}'::jsonb
),
(
  'Texas Veterans Commission',
  'Veteran Services',
  'The state agency that helps Texas veterans access VA benefits, education aid (Hazlewood Act for tuition), employment services, mental-health resources, and emergency assistance through the Fund for Veterans'' Assistance.',
  'Free benefits counseling plus emergency grants up to $5,000',
  'Texas veterans, active military, and their dependents',
  '1-800-252-8387',
  'https://www.tvc.texas.gov',
  5000,
  'TX',
  'texas-veterans-commission',
  true,
  null,
  '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb
),

-- ============================================================
-- LARGEST-COUNTY PROGRAMS
-- ============================================================
-- HARRIS COUNTY (Houston)
(
  'Harris Health Financial Assistance (Gold Card)',
  'Healthcare',
  'Sliding-scale healthcare for uninsured Harris County residents through the public hospital district. The "Gold Card" gets you primary care, specialty care, hospital services, and prescriptions at one of 30+ Harris Health locations for $3–$8 per visit at the lowest tier.',
  '$8,000+ per year in subsidized medical care',
  'Harris County residents, U.S. citizens or qualified non-citizens, with household income at or below 200% of the federal poverty level and limited assets',
  '713-566-6509',
  'https://www.harrishealth.org/eligibility-financial-assistance',
  8000,
  'TX',
  'harris-health-gold-card',
  true,
  'Must be a Harris County resident. Bring ID, proof of residence, income, and citizenship to your eligibility appointment.',
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
),
(
  'Harris County Community Services - Emergency Assistance',
  'County Services',
  'Harris County''s Community Services Department offers emergency rental, utility, and basic-needs assistance to county residents through community partners. Programs and funding vary; call to check current availability.',
  '~$1,500–$3,000 in one-time emergency aid',
  'Harris County residents with documented financial hardship and income within program limits',
  '832-927-4955',
  'https://csd.harriscountytx.gov',
  2000,
  'TX',
  'harris-county-community-services',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "unemployed", "homeless"]}'::jsonb
),

-- DALLAS COUNTY
(
  'Dallas County Health and Human Services',
  'County Services',
  'Dallas County''s HHS department coordinates emergency assistance, ryan white HIV services, child welfare, environmental health, and senior nutrition programs for county residents.',
  'Varies by program — emergency aid plus ongoing service connections',
  'Dallas County residents; specific programs have their own income and category limits',
  '214-819-1900',
  'https://www.dallascounty.org/department/hhs',
  2000,
  'TX',
  'dallas-county-hhs',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
),
(
  'Parkland Health Financial Assistance',
  'Healthcare',
  'Sliding-scale healthcare for uninsured Dallas County residents through Parkland — the public hospital district. Covers primary care, specialty care, hospital services, and prescriptions at Parkland and its 12+ community clinics.',
  '$8,000+ per year in subsidized medical care',
  'Dallas County residents with household income at or below 200% of the federal poverty level',
  '214-590-5630',
  'https://www.parklandhealth.org/financial-assistance',
  8000,
  'TX',
  'parkland-financial-assistance',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
),

-- TARRANT COUNTY (Fort Worth)
(
  'Tarrant County Community Development Emergency Assistance',
  'County Services',
  'Tarrant County''s Community Development Division administers federal CDBG/HOME-funded rental, utility, and home-repair assistance for county residents, plus connects callers to partner agencies.',
  '~$1,500–$3,000 in one-time emergency aid',
  'Tarrant County residents (outside Fort Worth and Arlington city limits) with low income',
  '817-850-7940',
  'https://access.tarrantcounty.com/en/community-development.html',
  2000,
  'TX',
  'tarrant-county-community-development',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "unemployed", "homeless"]}'::jsonb
),
(
  'JPS Health Network Connection (Tarrant County)',
  'Healthcare',
  'Sliding-scale healthcare for uninsured Tarrant County residents through John Peter Smith — the public hospital district. The JPS Connection card gets you primary care, specialty care, hospital, and pharmacy services at JPS and its community health centers.',
  '$8,000+ per year in subsidized medical care',
  'Tarrant County residents with household income at or below 200% of the federal poverty level',
  '817-702-1001',
  'https://www.jpshealthnet.org/services/connection-program',
  8000,
  'TX',
  'jps-connection-program',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
),

-- BEXAR COUNTY (San Antonio)
(
  'Bexar County Community Resources',
  'County Services',
  'Bexar County''s Community Resources Department runs emergency rental, utility, and home-repair assistance, plus the Senior Nutrition Program and the Bexar AgriLife Extension Office''s family-and-consumer-sciences services.',
  '~$1,500–$3,000 in one-time emergency aid',
  'Bexar County residents (outside the City of San Antonio) with low income',
  '210-335-6770',
  'https://www.bexar.org/2814/Community-Resources',
  2000,
  'TX',
  'bexar-county-community-resources',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income", "unemployed", "homeless"]}'::jsonb
),
(
  'Opportunity Home San Antonio (Public Housing & Section 8)',
  'Housing Assistance',
  'San Antonio''s public-housing authority (formerly SAHA) — the largest in Texas — operating public housing, Section 8 Housing Choice Vouchers, and mixed-income developments across Bexar County.',
  '$10,000+ per year in rental assistance',
  'Very-low-income Bexar County households (typically below 50% of area median income); priority for elderly, disabled, and families with children',
  '210-477-6262',
  'https://opportunityhomesa.org',
  12000,
  'TX',
  'opportunity-home-san-antonio',
  true,
  'Section 8 waitlist has historically been closed. Public-housing waitlists open periodically — check the website.',
  '{"max_monthly_income": 3500, "min_age": null, "max_age": null, "required_situations": ["low_income", "homeless"]}'::jsonb
),
(
  'University Health Carelink (Bexar County)',
  'Healthcare',
  'Sliding-scale healthcare program for uninsured Bexar County residents through University Health — the public hospital district. CareLink members get primary care, specialty care, hospital, and pharmacy at University Hospital and its 30+ community clinics.',
  '$8,000+ per year in subsidized medical care',
  'Bexar County residents with household income at or below 200% of the federal poverty level',
  '210-358-3350',
  'https://www.universityhealth.com/locations/carelink-services',
  8000,
  'TX',
  'university-health-carelink',
  true,
  null,
  '{"max_monthly_income": 4500, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
);

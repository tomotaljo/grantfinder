-- Fix Medi-Cal apply URL to use the direct BenefitsCal application portal
update programs
set apply_url = 'https://benefitscal.com'
where name ilike '%medi-cal%';

-- Update Covered California description to include enrollment window info
update programs
set description = 'California state health insurance marketplace. Many low-income residents qualify for free or very low cost coverage through Medi-Cal or subsidized plans. Open enrollment runs November–January. Outside that window, you can still apply if you''ve had a major life change (lost job, moved, had a baby, got married, etc.) or if you qualify for Medi-Cal, which is always open.'
where name ilike '%covered california%';

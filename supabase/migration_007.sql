-- Add slugs to the original seed programs that were inserted before the slug column existed
update programs set slug = 'snap-supplemental-nutrition-assistance-program'
  where name like '%SNAP%' and slug is null;

update programs set slug = 'liheap-low-income-home-energy-assistance'
  where name like '%LIHEAP%' and slug is null;

update programs set slug = 'medicaid-health-coverage'
  where name like '%Medicaid%' and slug is null;

-- Fix broken Covered California URL (was pointing to a non-existent .gov domain)
update programs
set apply_url = 'https://www.coveredca.com'
where name ilike '%covered california%'
  and apply_url != 'https://www.coveredca.com';

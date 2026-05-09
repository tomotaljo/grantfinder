-- migration_028: Deactivate 23 homebuyer / wealth-building housing rows.
--
-- These were state housing finance authorities that primarily administer
-- first-time homebuyer programs (down-payment assistance, low-interest
-- mortgages, MCC). They don't fit MyPublicAid's consumption-support focus;
-- they'll be migrated to a separate consumer grants/loans engine later.
--
-- Rows are marked inactive (not deleted). They stay in the table for the
-- future engine to pull from.
--
-- Kept active: rental assistance, public housing, Section 8 voucher rows,
-- 211 referral lines. (See california-rental-assistance,
-- texas-rental-assistance, texas-section-8, opportunity-home-san-antonio.)

update programs set is_active = false where slug in (
  'alaska-ahfc',
  'alabama-step-up',
  'arkansas-adfa',
  'arizona-housing',
  'colorado-chfa',
  'connecticut-chfa',
  'delaware-dsha',
  'florida-hometown-heroes',
  'georgia-dream',
  'hawaii-hhfdc',
  'iowa-finance-authority',
  'idaho-housing-finance',
  'illinois-ihda',
  'indiana-ihcda',
  'kansas-housing-resources',
  'kentucky-housing-corporation',
  'louisiana-housing-corporation',
  'michigan-mshda',
  'mississippi-home-corporation',
  'nevada-home-is-possible',
  'new-york-sonyma',
  'my-first-texas-home',
  'washington-housing-finance'
);

do $$
declare
  inactive_count int;
begin
  select count(*) into inactive_count
    from programs
    where slug in (
      'alaska-ahfc', 'alabama-step-up', 'arkansas-adfa', 'arizona-housing',
      'colorado-chfa', 'connecticut-chfa', 'delaware-dsha', 'florida-hometown-heroes',
      'georgia-dream', 'hawaii-hhfdc', 'iowa-finance-authority', 'idaho-housing-finance',
      'illinois-ihda', 'indiana-ihcda', 'kansas-housing-resources', 'kentucky-housing-corporation',
      'louisiana-housing-corporation', 'michigan-mshda', 'mississippi-home-corporation',
      'nevada-home-is-possible', 'new-york-sonyma', 'my-first-texas-home',
      'washington-housing-finance'
    ) and is_active = false;
  if inactive_count <> 23 then
    raise exception 'Expected 23 rows marked inactive, got %', inactive_count;
  end if;
end $$;

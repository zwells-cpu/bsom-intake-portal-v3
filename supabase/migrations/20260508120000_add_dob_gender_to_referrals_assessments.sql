alter table if exists public.referrals
  add column if not exists dob date,
  add column if not exists gender text;

alter table if exists public.assessments
  add column if not exists dob date,
  add column if not exists gender text;

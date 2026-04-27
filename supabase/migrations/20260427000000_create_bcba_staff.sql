create extension if not exists pgcrypto;

create table if not exists public.bcba_staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text null,
  office text null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_bcba_staff_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bcba_staff_updated_at on public.bcba_staff;
create trigger set_bcba_staff_updated_at
before update on public.bcba_staff
for each row
execute function public.set_bcba_staff_updated_at();

create unique index if not exists bcba_staff_active_normalized_name_idx
on public.bcba_staff (
  lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g'))
)
where is_active = true;

-- EnergyIQ database schema
-- Run this in your Supabase SQL Editor (supabase.com/dashboard → SQL Editor)

create table entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_type text not null,
  zip_code text not null,
  square_footage integer not null,
  monthly_bill numeric(10, 2) not null,
  operating_hours integer not null,

  -- EPA eGRID derived fields (populated by the server on create)
  egrid_subregion text,
  emission_factor numeric(10, 6),
  estimated_kwh numeric(10, 2),
  estimated_co2_lbs numeric(10, 2),

  -- Action plan state — array of action objects with an "adopted" boolean
  actions jsonb default '[]'::jsonb,

  -- Computed score
  energy_score integer,
  energy_grade text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security: users can only touch their own rows
alter table entries enable row level security;

create policy "Users can view own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid() = user_id);

-- Auto-update the updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  nickname text,
  avatar text,
  role text check (role in ('owner', 'sitter')) default 'owner',
  balance decimal(10, 2) default 0.00,
  labor_balance decimal(10, 2) default 0.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Sitter Profiles (For Sitter Specific Info)
create table public.sitter_profiles (
  user_id uuid references public.profiles(id) primary key,
  real_name text,
  id_card text,
  id_card_front text,
  id_card_back text,
  level text default 'BRONZE',
  rating decimal(3, 1) default 5.0,
  experience_years int default 0,
  bio text,
  tags text[], -- Array of strings
  is_certified boolean default false,
  certification_status text default 'none',
  certification_reject_reason text,
  certification_submitted_at timestamptz,
  certification_reviewed_at timestamptz,
  availability jsonb, -- { time: string, services: string[] }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Pets Table
create table public.pets (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  avatar text,
  type text check (type in ('cat', 'dog')),
  breed text,
  gender text check (gender in ('male', 'female')),
  size text, -- 'MINI', 'SMALL', 'MEDIUM', 'LARGE'
  weight decimal(5, 2),
  age int,
  sterilized boolean default false,
  vaccine boolean default false,
  description text,
  care_profile jsonb, -- { medications: [], allergies: [], habits: [] }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Addresses Table
create table public.addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text, -- 'Home', 'Office'
  detail text not null,
  contact_name text,
  contact_phone text,
  is_default boolean default false,
  latitude float,
  longitude float,
  created_at timestamptz default now()
);

-- 5. Coupons Table
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('FIXED', 'DISCOUNT')),
  value decimal(10, 2),
  threshold decimal(10, 2) default 0,
  name text,
  expires_at timestamptz,
  status text default 'UNUSED', -- 'UNUSED', 'USED', 'EXPIRED'
  created_at timestamptz default now()
);

-- 6. Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) not null,
  sitter_id uuid references public.profiles(id),
  
  -- Service Details
  service_type text, -- 'feeding', 'walking'
  pet_size text,
  duration int, -- minutes
  total_price decimal(10, 2),
  
  -- Contact & Location
  contact_name text,
  contact_phone text,
  address text,
  distance decimal(10, 2),
  
  -- Timing
  scheduled_time timestamptz, -- ISO string or timestamp
  actual_start_time timestamptz,
  
  -- Status
  status text default 'UNPAID', 
  -- 'UNPAID', 'PENDING', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_SERVICE', 'COMPLETED', 'REVIEWED', 'CANCELLED'
  
  is_paid boolean default false,
  remark text,
  
  -- JSON Fields for complex data
  add_ons jsonb, -- { play: bool, deepClean: bool, medicine: bool }
  service_evidence jsonb, -- { photos: [], items: [], confirmedAt: ts }
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Reviews Table (Consolidated)
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  reviewer_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id), -- Optional: who is being reviewed
  
  rating int check (rating >= 1 and rating <= 5),
  content text,
  tags text[],
  
  role text, -- 'owner' (reviewing sitter) or 'sitter' (reviewing pet/owner)
  created_at timestamptz default now()
);

-- RLS Policies (Row Level Security) - Basic Setup
alter table public.profiles enable row level security;
alter table public.sitter_profiles enable row level security;
alter table public.pets enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

-- Simple Policies (Adjust as needed)
-- Profiles: Public read, Owner write
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Sitter Profiles: Public read, Owner write
create policy "Sitter profiles are viewable by everyone" on public.sitter_profiles for select using (true);
create policy "Sitters can update own profile" on public.sitter_profiles for update using (auth.uid() = user_id);
create policy "Sitters can insert own profile" on public.sitter_profiles for insert with check (auth.uid() = user_id);

-- Pets: Owner read/write, Sitter read (if related to order - simplified to public read for MVP or authenticated)
create policy "Users can view own pets" on public.pets for select using (auth.uid() = owner_id);
create policy "Users can insert own pets" on public.pets for insert with check (auth.uid() = owner_id);
create policy "Users can update own pets" on public.pets for update using (auth.uid() = owner_id);
create policy "Users can delete own pets" on public.pets for delete using (auth.uid() = owner_id);

-- Orders: Creator and Sitter can view/update
create policy "Users can view own orders" on public.orders for select using (auth.uid() = creator_id or auth.uid() = sitter_id);
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = creator_id);
create policy "Users can update own orders" on public.orders for update using (auth.uid() = creator_id or auth.uid() = sitter_id);

-- Storage Buckets (for Avatars / Evidence)
-- Note: You need to create buckets 'avatars' and 'evidence' in Supabase Storage dashboard

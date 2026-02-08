-- 1. Service Types Management
create table if not exists public.service_types (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null, -- 'FEEDING', 'WALKING'
  name text not null,
  description text,
  cover_image text,
  base_price decimal(10, 2) default 0,
  duration_minutes int default 30,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Pricing Configuration (Global Rules)
create table if not exists public.pricing_configs (
  id uuid default uuid_generate_v4() primary key,
  category text not null, -- 'PET_SIZE', 'HOLIDAY', 'RUSH', 'ADD_ON'
  key text not null, -- 'LARGE', 'WEEKEND', 'RUSH_HOUR'
  value decimal(10, 2) not null, -- Multiplier or Fixed Amount
  type text check (type in ('MULTIPLIER', 'FIXED_ADDITION')) default 'MULTIPLIER',
  description text,
  updated_at timestamptz default now(),
  unique(category, key)
);

-- 3. Coupon Templates (Marketing Campaigns)
create table if not exists public.coupon_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type text check (type in ('FIXED', 'DISCOUNT')) not null,
  value decimal(10, 2) not null, -- Amount or Percentage (0-1)
  min_spend decimal(10, 2) default 0,
  total_quantity int, -- NULL for unlimited
  issued_quantity int default 0,
  start_time timestamptz,
  end_time timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. Admin Users (Simple role-based or just reuse profiles with 'admin' role)
-- For now, let's assume we update the existing profiles table to allow 'admin' role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner', 'sitter', 'admin'));

-- Initial Data Seeding (Optional, but good for testing)
insert into public.service_types (code, name, description, base_price, duration_minutes)
values 
('FEEDING', '上门喂养', '专业喂食 · 铲屎 · 陪玩', 50.00, 30),
('WALKING', '上门遛宠', '专业遛狗 · 运动 · 捡屎', 60.00, 30)
on conflict (code) do nothing;

insert into public.pricing_configs (category, key, value, type, description)
values
('PET_SIZE', 'SMALL', 1.0, 'MULTIPLIER', '小型宠系数'),
('PET_SIZE', 'MEDIUM', 1.2, 'MULTIPLIER', '中型宠系数'),
('PET_SIZE', 'LARGE', 1.5, 'MULTIPLIER', '大型宠系数'),
('HOLIDAY', 'DEFAULT', 1.5, 'MULTIPLIER', '节假日系数'),
('RUSH', 'DEFAULT', 1.5, 'MULTIPLIER', '急单系数')
on conflict (category, key) do nothing;

-- Admin RLS policies for core tables
-- Execute in Supabase SQL Editor

-- 1) profiles: admin full access
create policy "admin select profiles"
on public.profiles for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin update profiles"
on public.profiles for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin delete profiles"
on public.profiles for delete
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 2) banners: admin full access (list/toggle/save/delete)
create policy "admin select banners"
on public.banners for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin insert banners"
on public.banners for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin update banners"
on public.banners for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin delete banners"
on public.banners for delete
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 3) orders: admin read
create policy "admin select orders"
on public.orders for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 4) announcements: admin full access (create/edit/delete)
create policy "admin select announcements"
on public.announcements for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin insert announcements"
on public.announcements for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin update announcements"
on public.announcements for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "admin delete announcements"
on public.announcements for delete
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 4) coupon_templates: app read (active templates)
create policy "app select coupon_templates"
on public.coupon_templates for select
to authenticated
using (true);

-- 5) coupons: user manages own coupons
create policy "user insert own coupons"
on public.coupons for insert
to authenticated
with check (user_id = auth.uid());

create policy "user select own coupons"
on public.coupons for select
to authenticated
using (user_id = auth.uid());

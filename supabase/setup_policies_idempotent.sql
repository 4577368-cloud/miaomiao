-- Idempotent RLS policies setup for admin and app features
-- Safe to run multiple times

-- PROFILES
drop policy if exists "admin select profiles" on public.profiles;
drop policy if exists "admin update profiles" on public.profiles;
drop policy if exists "admin delete profiles" on public.profiles;
create policy "admin select profiles"
on public.profiles for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin update profiles"
on public.profiles for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin delete profiles"
on public.profiles for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- BANNERS
drop policy if exists "admin select banners" on public.banners;
drop policy if exists "admin insert banners" on public.banners;
drop policy if exists "admin update banners" on public.banners;
drop policy if exists "admin delete banners" on public.banners;
create policy "admin select banners"
on public.banners for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin insert banners"
on public.banners for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin update banners"
on public.banners for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin delete banners"
on public.banners for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ORDERS
drop policy if exists "admin select orders" on public.orders;
create policy "admin select orders"
on public.orders for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ANNOUNCEMENTS
drop policy if exists "admin select announcements" on public.announcements;
drop policy if exists "admin insert announcements" on public.announcements;
drop policy if exists "admin update announcements" on public.announcements;
drop policy if exists "admin delete announcements" on public.announcements;
create policy "admin select announcements"
on public.announcements for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin insert announcements"
on public.announcements for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin update announcements"
on public.announcements for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "admin delete announcements"
on public.announcements for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- COUPON_TEMPLATES (readable to authenticated)
drop policy if exists "app select coupon_templates" on public.coupon_templates;
create policy "app select coupon_templates"
on public.coupon_templates for select to authenticated
using (true);

-- COUPONS (user manages own coupons)
drop policy if exists "user insert own coupons" on public.coupons;
drop policy if exists "user select own coupons" on public.coupons;
create policy "user insert own coupons"
on public.coupons for insert to authenticated
with check (user_id = auth.uid());
create policy "user select own coupons"
on public.coupons for select to authenticated
using (user_id = auth.uid());

-- STORAGE OBJECTS (bucket public1: admin writes)
drop policy if exists "public1 upload by admin" on storage.objects;
drop policy if exists "public1 update by admin" on storage.objects;
drop policy if exists "public1 delete by admin" on storage.objects;
create policy "public1 upload by admin"
on storage.objects for insert to authenticated
with check (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "public1 update by admin"
on storage.objects for update to authenticated
using (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "public1 delete by admin"
on storage.objects for delete to authenticated
using (
  bucket_id = (select id from storage.buckets where name = 'public1')
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Idempotent RLS policies setup for admin and app features
-- Safe to run multiple times
-- FIXES: 500 Internal Server Error due to infinite recursion in admin policies

-- 1. Create a secure function to check admin status (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PROFILES
-- Drop potentially conflicting or recursive policies
drop policy if exists "admin select profiles" on public.profiles;
drop policy if exists "admin update profiles" on public.profiles;
drop policy if exists "admin delete profiles" on public.profiles;
drop policy if exists "user select own profiles" on public.profiles;
drop policy if exists "user insert own profiles" on public.profiles;
drop policy if exists "user update own profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create clean policies
-- Allow admins to view all profiles (using secure function)
create policy "admin select profiles"
on public.profiles for select to authenticated
using (check_is_admin());

-- Allow admins to update all profiles
create policy "admin update profiles"
on public.profiles for update to authenticated
using (check_is_admin())
with check (check_is_admin());

-- Allow admins to delete profiles
create policy "admin delete profiles"
on public.profiles for delete to authenticated
using (check_is_admin());

-- Allow users to view their own profile (and everyone to view public profiles if needed, but for now let's stick to specific rules)
-- Actually, usually profiles are public. Let's restore the "Public view" but maybe limit columns?
-- For MVP, "Public profiles are viewable by everyone" is safest for avoiding 500s on frontend "get user" calls if they aren't logged in yet or just browsing.
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

-- Allow users to update their own profile
create policy "user update own profiles"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Allow users to insert their own profile (for registration)
create policy "user insert own profiles"
on public.profiles for insert to authenticated
with check (id = auth.uid());


-- 3. BANNERS
drop policy if exists "admin select banners" on public.banners;
drop policy if exists "admin insert banners" on public.banners;
drop policy if exists "admin update banners" on public.banners;
drop policy if exists "admin delete banners" on public.banners;
drop policy if exists "everyone select banners" on public.banners;

create policy "admin select banners" on public.banners for select to authenticated using (check_is_admin());
create policy "admin insert banners" on public.banners for insert to authenticated with check (check_is_admin());
create policy "admin update banners" on public.banners for update to authenticated using (check_is_admin()) with check (check_is_admin());
create policy "admin delete banners" on public.banners for delete to authenticated using (check_is_admin());
-- Public can view banners
create policy "everyone select banners" on public.banners for select using (true);


-- 4. ANNOUNCEMENTS
drop policy if exists "admin select announcements" on public.announcements;
drop policy if exists "admin insert announcements" on public.announcements;
drop policy if exists "admin update announcements" on public.announcements;
drop policy if exists "admin delete announcements" on public.announcements;
drop policy if exists "everyone select announcements" on public.announcements;

create policy "admin select announcements" on public.announcements for select to authenticated using (check_is_admin());
create policy "admin insert announcements" on public.announcements for insert to authenticated with check (check_is_admin());
create policy "admin update announcements" on public.announcements for update to authenticated using (check_is_admin()) with check (check_is_admin());
create policy "admin delete announcements" on public.announcements for delete to authenticated using (check_is_admin());
-- Public can view announcements
create policy "everyone select announcements" on public.announcements for select using (true);


-- 5. ORDERS (Optional, keeping it simple for now)
drop policy if exists "admin select orders" on public.orders;
create policy "admin select orders" on public.orders for select to authenticated using (check_is_admin());


-- 6. COUPON TEMPLATES
drop policy if exists "admin all coupon_templates" on public.coupon_templates;
-- Ensure simple policy for app
drop policy if exists "app select coupon_templates" on public.coupon_templates;
create policy "app select coupon_templates" on public.coupon_templates for select to authenticated using (true);

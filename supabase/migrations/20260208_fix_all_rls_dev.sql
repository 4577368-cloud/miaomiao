-- ============================================================
-- 解决 Supabase 匿名操作权限被拒问题
-- 场景：Admin后台使用免登录(匿名)模式，需要直接操作数据库
-- ============================================================

-- 1. 解除 Profiles 表的限制
DROP POLICY IF EXISTS "Enable update for all users (Dev)" ON public.profiles;
CREATE POLICY "Enable update for all users (Dev)"
ON public.profiles FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for all users (Dev)" ON public.profiles;
CREATE POLICY "Enable insert for all users (Dev)"
ON public.profiles FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for all users (Dev)" ON public.profiles;
CREATE POLICY "Enable delete for all users (Dev)"
ON public.profiles FOR DELETE
USING (true);

DROP POLICY IF EXISTS "Enable select for all users (Dev)" ON public.profiles;
CREATE POLICY "Enable select for all users (Dev)"
ON public.profiles FOR SELECT
USING (true);

-- 2. 解除 Coupons 表的限制 (发券功能)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for coupons (Dev)" ON public.coupons;
CREATE POLICY "Enable all for coupons (Dev)"
ON public.coupons FOR ALL
USING (true)
WITH CHECK (true);

-- 3. 解除 Coupon Templates 表的限制 (营销活动)
ALTER TABLE public.coupon_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for coupon_templates (Dev)" ON public.coupon_templates;
CREATE POLICY "Enable all for coupon_templates (Dev)"
ON public.coupon_templates FOR ALL
USING (true)
WITH CHECK (true);

-- 4. 解除 Sitter Profiles 表的限制 (宠托师审核)
DROP POLICY IF EXISTS "Enable update for all users (Dev)" ON public.sitter_profiles;
CREATE POLICY "Enable update for all users (Dev)"
ON public.sitter_profiles FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. 解除 Notifications 表的限制 (发送通知)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for notifications (Dev)" ON public.notifications;
CREATE POLICY "Enable all for notifications (Dev)"
ON public.notifications FOR ALL
USING (true)
WITH CHECK (true);

-- 6. 解除 Orders 表的限制 (订单管理)
DROP POLICY IF EXISTS "Enable all for orders (Dev)" ON public.orders;
CREATE POLICY "Enable all for orders (Dev)"
ON public.orders FOR ALL
USING (true)
WITH CHECK (true);

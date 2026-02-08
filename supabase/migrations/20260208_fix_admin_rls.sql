-- 1. 允许匿名/所有用户更新 profiles 表 (解决 "new row violates..." 问题)
-- 注意：这是为了配合您当前 Admin 后台“免登录”模式的临时策略。
-- 正式上线时应该限制为仅 Admin 角色可操作。

-- 先删除旧的 restrictive 策略 (如果存在)
DROP POLICY IF EXISTS "Enable update for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for all users (Dev)" ON public.profiles;

-- 创建新的 permissive 策略
CREATE POLICY "Enable update for all users (Dev)"
ON public.profiles FOR UPDATE
USING (true)
WITH CHECK (true);

-- 2. 确保 Delete 也被允许
DROP POLICY IF EXISTS "Enable delete for all users" ON public.profiles;
CREATE POLICY "Enable delete for all users (Dev)"
ON public.profiles FOR DELETE
USING (true);

-- 3. 确保 Insert 也被允许 (虽然通常通过 Auth 注册，但 Admin 可能手动加)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profiles;
CREATE POLICY "Enable insert for all users (Dev)"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- 4. 确保 Select 也被允许
DROP POLICY IF EXISTS "Enable select for all users" ON public.profiles;
CREATE POLICY "Enable select for all users (Dev)"
ON public.profiles FOR SELECT
USING (true);

-- 5. 如果 profiles 表开启了 RLS 但没有策略，默认是禁止所有操作的。
-- 上面的策略会覆盖默认行为。
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

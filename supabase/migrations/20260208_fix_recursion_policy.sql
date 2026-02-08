-- 修复 RLS 无限递归问题

-- 1. 创建一个安全函数来检查管理员权限
-- SECURITY DEFINER 表示该函数以创建者（通常是 postgres 超级用户）的权限运行，从而绕过 RLS
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

-- 2. 授予函数执行权限
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO service_role;

-- 3. 重建 profiles 表的 RLS 策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles; 

-- 重新创建策略：
-- 允许用户查看自己的档案，或者管理员查看所有档案
CREATE POLICY "Admins and owners can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  check_is_admin()
);

-- 允许用户更新自己的档案
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 允许新用户插入自己的档案
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

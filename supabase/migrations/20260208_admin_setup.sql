-- 1. 确保 profiles 表启用了 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. 允许 admin 角色查看所有用户档案
-- 先删除旧策略（如果存在），避免冲突
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR 
  auth.uid() = id -- 用户自己也能看自己
);

-- 3. 允许 admin 角色修改所有用户档案
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
TO authenticated 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR 
  auth.uid() = id -- 用户自己也能改自己
);

-- 4. 允许 admin 角色删除用户档案
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" 
ON profiles FOR DELETE 
TO authenticated 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. 示例：如何将用户提升为管理员
-- 这里的操作是：找到邮箱为 'admin@miaomiao.com' 的用户，将其 role 设为 'admin'
-- 请在 Supabase 的 SQL 编辑器中运行以下命令（确保该用户已注册）：
/*
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@miaomiao.com'
);
*/

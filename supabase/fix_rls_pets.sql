-- 修复 Pets 表的 RLS 策略，确保用户可以管理自己的宠物信息
-- 运行方法：Supabase Dashboard -> SQL Editor -> New Query -> Run

-- 1. 允许用户查看自己的宠物
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
CREATE POLICY "Users can view own pets" 
ON public.pets 
FOR SELECT 
USING (auth.uid() = owner_id);

-- 2. 允许用户添加宠物
DROP POLICY IF EXISTS "Users can insert own pets" ON public.pets;
CREATE POLICY "Users can insert own pets" 
ON public.pets 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- 3. 允许用户更新自己的宠物信息
DROP POLICY IF EXISTS "Users can update own pets" ON public.pets;
CREATE POLICY "Users can update own pets" 
ON public.pets 
FOR UPDATE 
USING (auth.uid() = owner_id);

-- 4. 允许用户删除自己的宠物
DROP POLICY IF EXISTS "Users can delete own pets" ON public.pets;
CREATE POLICY "Users can delete own pets" 
ON public.pets 
FOR DELETE 
USING (auth.uid() = owner_id);

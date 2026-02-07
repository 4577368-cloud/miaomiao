-- 1. 添加 bio 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text DEFAULT '';
    END IF;
END $$;

-- 2. 确保存在 UPDATE 策略
-- 先删除可能存在的旧策略以防冲突（可选，或者使用 DO block 检查）
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 重新创建策略
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 3. 确保存在 SELECT 策略 (以便 update 后返回数据或前端刷新)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 4. 确保 INSERT 策略存在 (之前 fix_rls.sql 加过，这里再加一次保底)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

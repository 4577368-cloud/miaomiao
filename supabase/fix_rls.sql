-- 修复 Profiles 表的 RLS 策略，允许新注册用户插入自己的档案
-- 运行方法：复制以下内容到 Supabase Dashboard -> SQL Editor -> New Query -> Run

-- 1. 允许用户插入自己的 Profile (修复注册报错的核心)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. 允许用户查看自己的 Coupons (之前可能漏了)
CREATE POLICY "Users can view own coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coupons" 
ON public.coupons 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. 允许用户管理自己的 Addresses (之前可能漏了)
CREATE POLICY "Users can view own addresses" 
ON public.addresses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" 
ON public.addresses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" 
ON public.addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" 
ON public.addresses 
FOR DELETE 
USING (auth.uid() = user_id);

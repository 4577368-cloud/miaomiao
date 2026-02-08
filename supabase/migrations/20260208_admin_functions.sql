-- 1. 添加必要的列到 profiles 表 (如果不存在)
-- 为了在用户管理列表中展示手机号和邮箱，建议将 auth.users 的数据同步到 profiles，或者在此处存储副本
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. 创建充值函数 (RPC)
-- 前端 Admin 调用此函数给用户充值
CREATE OR REPLACE FUNCTION public.admin_recharge_balance(
  target_user_id uuid,
  amount numeric,
  remark text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- 使用超级用户权限运行，绕过 RLS
AS $$
DECLARE
  current_balance numeric;
BEGIN
  -- 检查金额是否有效
  IF amount <= 0 THEN
    RAISE EXCEPTION '充值金额必须大于0';
  END IF;

  -- 更新余额
  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + amount
  WHERE id = target_user_id
  RETURNING balance INTO current_balance;

  -- 这里可以插入一条交易记录到 transactions 表 (如果有的话)
  -- INSERT INTO public.transactions (user_id, type, amount, status, description)
  -- VALUES (target_user_id, 'RECHARGE', amount, 'COMPLETED', remark);

  RETURN true;
END;
$$;

-- 3. 确保外键关系存在 (用于前端 UserList 的关联查询)
-- 确保 pets 表有 owner_id 指向 profiles.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pets_owner_id_fkey') THEN
    ALTER TABLE public.pets ADD CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 确保 orders 表有 creator_id 指向 profiles.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_creator_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. 确保 RLS 策略允许用户读取自己的 sitter_profile (修复同步问题)
-- 只有认证通过的才能被公开读取，但用户自己必须能看到自己的申请状态
DROP POLICY IF EXISTS "Users can view own sitter profile" ON public.sitter_profiles;
CREATE POLICY "Users can view own sitter profile"
ON public.sitter_profiles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view certified sitters" ON public.sitter_profiles;
CREATE POLICY "Public can view certified sitters"
ON public.sitter_profiles FOR SELECT
USING (is_certified = true);

-- 5. (可选) 创建触发器自动同步 Auth 邮箱到 Profiles
-- 这样新注册用户的邮箱会自动出现在 profiles 表中
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, nickname, role)
  VALUES (
    new.id,
    new.email,
    new.phone,
    COALESCE(new.raw_user_meta_data->>'nickname', '新用户'),
    'owner'
  );
  RETURN new;
END;
$$;

-- 注意：如果已经有 handle_new_user 触发器，请修改它包含 email 和 phone 字段

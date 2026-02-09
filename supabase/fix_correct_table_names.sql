-- 修复SQL错误：使用正确的表名
-- 这个脚本修正了之前使用"users"表的错误，改为使用"profiles"表

-- 1. 为profiles表添加状态字段（如果不存在）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive'));

-- 2. 为orders表添加管理员相关字段（如果不存在）  
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- 3. 添加字段注释
COMMENT ON COLUMN public.profiles.status IS '用户状态：active(正常), banned(封禁), inactive(未激活)';
COMMENT ON COLUMN public.orders.admin_notes IS '管理员备注和操作记录';
COMMENT ON COLUMN public.orders.last_modified_by IS '最后修改的管理员ID';

-- 4. 验证修改结果
SELECT 
  'profiles表状态字段' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'status') 
    THEN '已添加' 
    ELSE '未添加' 
  END as status;

SELECT 
  'orders表管理员备注字段' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'admin_notes') 
    THEN '已添加' 
    ELSE '未添加' 
  END as status;

SELECT 
  'orders表最后修改人字段' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'last_modified_by') 
    THEN '已添加' 
    ELSE '未添加' 
  END as status;
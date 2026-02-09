-- 1. 修正 permissions 字段类型为 JSONB
-- 问题原因：permissions 字段之前可能被创建为数组类型 (text[]/varchar[])，导致无法插入 JSON 字符串
DO $$ 
BEGIN 
    -- 检查 permissions 字段是否存在且类型不正确
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_users' 
        AND column_name = 'permissions' 
        AND data_type NOT IN ('jsonb', 'json')
    ) THEN
        -- 强制更改类型为 JSONB
        -- 使用 to_jsonb 将现有的数组数据转换为 JSONB 格式
        ALTER TABLE admin_users 
        ALTER COLUMN permissions TYPE JSONB 
        USING to_jsonb(permissions);
    END IF;
END $$;

-- 2. 确保字段存在（如果之前因故未创建）
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';

-- 3. 插入或更新默认管理员账号
-- 显式转换 JSON 字符串为 jsonb 类型，确保类型匹配
INSERT INTO admin_users (username, email, password_hash, role, permissions) 
VALUES (
  'admin', 
  'admin@miaomiao.com',
  crypt('admin123', gen_salt('bf')),
  'super_admin',
  '["users.manage", "orders.manage", "announcements.manage", "stats.view", "system.manage"]'::jsonb
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

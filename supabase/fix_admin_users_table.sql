-- 1. 启用必要的加密扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. 修复 admin_users 表结构
DO $$ 
BEGIN 
    -- 检查是否存在旧的 'password' 字段，如果有则重命名为 'password_hash'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'password') THEN
        ALTER TABLE admin_users RENAME COLUMN "password" TO password_hash;
    END IF;

    -- 检查并添加 password_hash 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'password_hash') THEN
        ALTER TABLE admin_users ADD COLUMN password_hash VARCHAR(255);
    END IF;

    -- 检查并添加 email 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'email') THEN
        ALTER TABLE admin_users ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    
    -- 检查并添加 role 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'role') THEN
        ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) DEFAULT 'admin';
    END IF;

    -- 检查并添加 permissions 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'permissions') THEN
        ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '[]';
    END IF;

    -- 检查并添加 is_active 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2.1 确保 admin_login_logs 表存在
CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  login_ip INET,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_success BOOLEAN DEFAULT true,
  user_agent TEXT
);

-- 3. 重建 admin_login 函数 (确保引用正确的 password_hash 字段)
CREATE OR REPLACE FUNCTION admin_login(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  email VARCHAR,
  role VARCHAR,
  permissions JSONB
) AS $$
BEGIN
  -- 验证管理员账号
  RETURN QUERY
  SELECT 
    au.id,
    au.username,
    au.email,
    au.role,
    au.permissions
  FROM admin_users au
  WHERE au.username = p_username 
    AND au.password_hash = crypt(p_password, au.password_hash)
    AND au.is_active = true;
  
  -- 更新最后登录时间
  IF FOUND THEN
    UPDATE admin_users 
    SET last_login = NOW() 
    WHERE username = p_username;
    
    -- 记录登录日志 (使用 CASE 处理可能的 IP 获取失败)
    INSERT INTO admin_login_logs (admin_id, login_ip, login_success)
    SELECT id, NULL, true -- 暂时传 NULL 避免 inet 类型转换错误
    FROM admin_users
    WHERE username = p_username;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 插入或更新默认管理员账号
INSERT INTO admin_users (username, email, password_hash, role, permissions) 
VALUES (
  'admin', 
  'admin@miaomiao.com',
  crypt('admin123', gen_salt('bf')),
  'super_admin',
  '["users.manage", "orders.manage", "announcements.manage", "stats.view", "system.manage"]'
) ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

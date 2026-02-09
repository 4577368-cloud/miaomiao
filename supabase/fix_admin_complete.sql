-- 全量修复脚本：一次性解决表结构、字段类型、函数定义和数据插入问题

-- 1. 启用必要的加密扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. 先删除函数，避免因依赖关系导致修改表结构失败
DROP FUNCTION IF EXISTS admin_login(VARCHAR, VARCHAR);

-- 3. 修复 admin_users 表结构（全量检查）
DO $$ 
BEGIN 
    -- 3.1 处理 password 字段重命名
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'password') THEN
        ALTER TABLE admin_users RENAME COLUMN "password" TO password_hash;
    END IF;

    -- 3.2 确保 password_hash 存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'password_hash') THEN
        ALTER TABLE admin_users ADD COLUMN password_hash VARCHAR(255);
    END IF;

    -- 3.3 确保 email 存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'email') THEN
        ALTER TABLE admin_users ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    
    -- 3.4 确保 role 存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'role') THEN
        ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) DEFAULT 'admin';
    END IF;

    -- 3.5 确保 is_active 存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- 3.6 修复 permissions 字段类型为 JSONB
    -- 如果字段存在但不是 jsonb，尝试转换；如果转换失败则重建
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_users' 
        AND column_name = 'permissions' 
    ) THEN
        BEGIN
            -- 尝试直接转换类型
            ALTER TABLE admin_users 
            ALTER COLUMN permissions TYPE JSONB 
            USING permissions::jsonb;
        EXCEPTION WHEN OTHERS THEN
            -- 如果转换失败（例如旧数据格式完全不兼容），则删除重建
            ALTER TABLE admin_users DROP COLUMN permissions;
            ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '[]';
        END;
    ELSE
        -- 字段不存在，直接创建
        ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '[]';
    END IF;

END $$;

-- 4. 确保日志表存在
CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  login_ip INET,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_success BOOLEAN DEFAULT true,
  user_agent TEXT
);

-- 5. 重建 admin_login 函数
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
    
    -- 记录登录日志 (使用 NULL 避免 inet 类型转换错误)
    INSERT INTO admin_login_logs (admin_id, login_ip, login_success)
    SELECT id, NULL, true 
    FROM admin_users
    WHERE username = p_username;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 插入默认管理员账号（此时表结构已完全正确）
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

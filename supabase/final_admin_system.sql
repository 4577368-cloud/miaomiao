-- 最终管理员系统SQL脚本
-- 这个脚本整合了所有管理员相关的数据库对象和权限设置

-- 1. 创建管理员用户表（如果不存在）
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建管理员登录日志表
CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  login_ip INET,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_success BOOLEAN DEFAULT true,
  user_agent TEXT
);

-- 3. 创建管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 为用户表添加状态字段（如果不存在）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive')),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 5. 为订单表添加管理员相关字段
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES admin_users(id);

-- 6. 创建管理员登录函数
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
    
    -- 记录登录日志
    INSERT INTO admin_login_logs (admin_id, login_ip, login_success)
    SELECT id, inet_client_addr(), true
    FROM admin_users
    WHERE username = p_username;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建获取用户列表函数
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id UUID,
  nickname VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  role VARCHAR,
  status VARCHAR,
  balance DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nickname,
    COALESCE(p.phone, ''),
    COALESCE(p.email, ''),
    p.role::TEXT,
    COALESCE(p.status::TEXT, 'active'),
    COALESCE(p.balance, 0),
    p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建切换用户状态函数
CREATE OR REPLACE FUNCTION admin_toggle_user_status(p_user_id UUID, p_ban BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  current_status VARCHAR;
  new_status VARCHAR;
  admin_id UUID;
BEGIN
  -- 获取当前管理员ID（从会话或参数）
  admin_id := current_setting('app.current_admin_id', true)::UUID;
  
  -- 获取当前状态
  SELECT COALESCE(status::TEXT, 'active') INTO current_status
  FROM profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户不存在';
  END IF;
  
  -- 确定新状态
  new_status := CASE 
    WHEN p_ban THEN 'banned'
    ELSE 'active'
  END;
  
  -- 更新用户状态
  UPDATE profiles 
  SET status = new_status, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 记录操作日志
  INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    admin_id, 
    CASE WHEN p_ban THEN 'ban_user' ELSE 'unban_user' END,
    'user',
    p_user_id,
    jsonb_build_object('old_status', current_status, 'new_status', new_status)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建获取订单列表函数
CREATE OR REPLACE FUNCTION get_admin_orders()
RETURNS TABLE (
  id UUID,
  order_number VARCHAR,
  service_type VARCHAR,
  amount DECIMAL(10,2),
  status VARCHAR,
  owner_name VARCHAR,
  owner_phone VARCHAR,
  sitter_name VARCHAR,
  sitter_phone VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.service_type::TEXT,
    o.amount,
    o.status::TEXT,
    op.nickname as owner_name,
    COALESCE(op.phone, '') as owner_phone,
    sp.nickname as sitter_name,
    COALESCE(sp.phone, '') as sitter_phone,
    o.created_at
  FROM orders o
  LEFT JOIN profiles op ON o.creator_id = op.id
  LEFT JOIN profiles sp ON o.sitter_id = sp.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建获取公告列表函数
CREATE OR REPLACE FUNCTION get_admin_announcements()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  content TEXT,
  created_by VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.content,
    COALESCE(a.created_by, '系统'),
    a.created_at
  FROM announcements a
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 创建发布公告函数
CREATE OR REPLACE FUNCTION admin_create_announcement(p_title VARCHAR, p_content TEXT, p_created_by VARCHAR)
RETURNS UUID AS $$
DECLARE
  announcement_id UUID;
  admin_id UUID;
BEGIN
  -- 获取当前管理员ID
  admin_id := current_setting('app.current_admin_id', true)::UUID;
  
  -- 创建公告
  INSERT INTO announcements (title, content, created_by)
  VALUES (p_title, p_content, p_created_by)
  RETURNING id INTO announcement_id;
  
  -- 记录操作日志
  INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    admin_id, 
    'create_announcement',
    'announcement',
    announcement_id,
    jsonb_build_object('title', p_title, 'content_length', LENGTH(p_content))
  );
  
  RETURN announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 创建更新公告函数
CREATE OR REPLACE FUNCTION admin_update_announcement(p_id UUID, p_content TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- 获取当前管理员ID
  admin_id := current_setting('app.current_admin_id', true)::UUID;
  
  -- 更新公告
  UPDATE announcements 
  SET content = p_content, updated_at = NOW()
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '公告不存在';
  END IF;
  
  -- 记录操作日志
  INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    admin_id, 
    'update_announcement',
    'announcement',
    p_id,
    jsonb_build_object('content_length', LENGTH(p_content))
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 创建删除公告函数
CREATE OR REPLACE FUNCTION admin_delete_announcement(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- 获取当前管理员ID
  admin_id := current_setting('app.current_admin_id', true)::UUID;
  
  -- 删除公告
  DELETE FROM announcements 
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '公告不存在';
  END IF;
  
  -- 记录操作日志
  INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details)
  VALUES (
    admin_id, 
    'delete_announcement',
    'announcement',
    p_id,
    jsonb_build_object('deleted_at', NOW())
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 创建获取统计数据函数
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_orders BIGINT,
  total_revenue DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles WHERE role != 'admin'),
    (SELECT COUNT(*) FROM orders),
    (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. 创建管理员权限检查函数
CREATE OR REPLACE FUNCTION has_admin_permission(p_admin_id UUID, p_permission VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = p_admin_id 
      AND is_active = true 
      AND (role = 'super_admin' OR permissions ? p_permission)
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. 创建默认超级管理员账号（密码：admin123）
INSERT INTO admin_users (username, email, password_hash, role, permissions) 
VALUES (
  'admin', 
  'admin@miaomiao.com',
  crypt('admin123', gen_salt('bf')),
  'super_admin',
  '["users.manage", "orders.manage", "announcements.manage", "stats.view", "system.manage"]'
) ON CONFLICT (username) DO NOTHING;

-- 17. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_admin_id ON admin_login_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_login_time ON admin_login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_sitter_id ON orders(sitter_id);

-- 18. 创建触发器，自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 19. 创建数据完整性约束
ALTER TABLE admin_users 
ADD CONSTRAINT chk_admin_username_length 
CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50);

ALTER TABLE admin_users 
ADD CONSTRAINT chk_admin_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 20. 设置函数权限
ALTER FUNCTION admin_login(VARCHAR, VARCHAR) OWNER TO supabase_admin;
ALTER FUNCTION get_admin_users() OWNER TO supabase_admin;
ALTER FUNCTION admin_toggle_user_status(UUID, BOOLEAN) OWNER TO supabase_admin;
ALTER FUNCTION get_admin_orders() OWNER TO supabase_admin;
ALTER FUNCTION get_admin_announcements() OWNER TO supabase_admin;
ALTER FUNCTION admin_create_announcement(VARCHAR, TEXT, VARCHAR) OWNER TO supabase_admin;
ALTER FUNCTION admin_update_announcement(UUID, TEXT) OWNER TO supabase_admin;
ALTER FUNCTION admin_delete_announcement(UUID) OWNER TO supabase_admin;
ALTER FUNCTION get_admin_stats() OWNER TO supabase_admin;
ALTER FUNCTION has_admin_permission(UUID, VARCHAR) OWNER TO supabase_admin;

-- 21. 创建数据清理函数（可选）
CREATE OR REPLACE FUNCTION cleanup_old_admin_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_login_logs 
  WHERE login_time < NOW() - INTERVAL '30 days';
  
  DELETE FROM admin_action_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 22. 创建管理员操作权限检查触发器
CREATE OR REPLACE FUNCTION check_admin_action_permission()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查管理员是否有执行该操作的权限
  IF NOT has_admin_permission(NEW.admin_id, NEW.action) THEN
    RAISE EXCEPTION '管理员没有执行此操作的权限';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器检查管理员权限
DROP TRIGGER IF EXISTS check_admin_permission_before_action ON admin_action_logs;
CREATE TRIGGER check_admin_permission_before_action
    BEFORE INSERT ON admin_action_logs
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_action_permission();

-- 23. 创建测试管理员账号（可选）
INSERT INTO admin_users (username, email, password_hash, role, permissions) 
VALUES (
  'test_admin', 
  'test@miaomiao.com',
  crypt('test123', gen_salt('bf')),
  'admin',
  '["users.view", "orders.view", "announcements.manage", "stats.view"]'
) ON CONFLICT (username) DO NOTHING;

-- 24. 创建用户状态枚举（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'banned', 'inactive');
  END IF;
END $$;

-- 25. 更新profiles表使用枚举类型
ALTER TABLE profiles 
ALTER COLUMN status TYPE user_status USING status::user_status;
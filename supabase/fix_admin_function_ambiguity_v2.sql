-- 修复 RPC 函数字段引用歧义
-- 必须删除旧函数并重建，使用明确的表别名引用

-- 1. 删除旧函数
DROP FUNCTION IF EXISTS admin_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_login(VARCHAR, VARCHAR);

-- 2. 重建函数 (修复 42702 Ambiguous column reference)
CREATE OR REPLACE FUNCTION admin_login(p_username TEXT, p_password TEXT)
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
  WHERE au.username = admin_login.p_username  -- 使用函数名限定参数，或者确保参数名不与列名冲突
    AND au.password_hash = crypt(admin_login.p_password, au.password_hash)
    AND au.is_active = true;
  
  -- 更新最后登录时间
  IF FOUND THEN
    UPDATE admin_users 
    SET last_login = NOW() 
    WHERE admin_users.username = admin_login.p_username; -- 明确指定表名和参数源
    
    -- 记录登录日志
    INSERT INTO admin_login_logs (admin_id, login_ip, login_success)
    SELECT au.id, NULL, true 
    FROM admin_users au
    WHERE au.username = admin_login.p_username;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

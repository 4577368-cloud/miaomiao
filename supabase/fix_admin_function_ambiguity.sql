-- 修复 RPC 函数歧义问题
-- 必须删除所有签名的 admin_login 函数，以避免 PostgREST 无法选择的问题

-- 1. 删除所有可能的函数签名
DROP FUNCTION IF EXISTS admin_login(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS admin_login(TEXT, TEXT);
-- 如果有其他变体，也可以尝试删除
DROP FUNCTION IF EXISTS admin_login(VARCHAR, TEXT);
DROP FUNCTION IF EXISTS admin_login(TEXT, VARCHAR);

-- 2. 重建唯一的 admin_login 函数
-- 统一使用 TEXT 类型，兼容性更好
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
    SELECT id, NULL, true 
    FROM admin_users
    WHERE username = p_username;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

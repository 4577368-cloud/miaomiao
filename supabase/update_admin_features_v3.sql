-- 补充 Admin 功能所需的 RPC 函数 (v3) - 完整版
-- 请在 Supabase SQL Editor 中运行此脚本

-- 1. 获取用户列表 (带搜索和分页支持的简化版)
DROP FUNCTION IF EXISTS get_admin_users();
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id UUID,
  phone VARCHAR,
  nickname VARCHAR,
  role VARCHAR,
  balance DECIMAL,
  points INT,
  created_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR -- active, banned
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.phone,
    p.nickname,
    p.role,
    p.balance,
    p.points,
    p.created_at,
    COALESCE(p.status, 'active') as status
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 获取订单列表
DROP FUNCTION IF EXISTS get_admin_orders();
CREATE OR REPLACE FUNCTION get_admin_orders()
RETURNS TABLE (
  id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR,
  total_price DECIMAL,
  service_type VARCHAR,
  creator_name VARCHAR,
  creator_phone VARCHAR,
  sitter_name VARCHAR,
  sitter_phone VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.status,
    o.total_price,
    o.service_type,
    c.nickname as creator_name,
    c.phone as creator_phone,
    s.nickname as sitter_name,
    s.phone as sitter_phone
  FROM orders o
  LEFT JOIN profiles c ON o.creator_id = c.id
  LEFT JOIN profiles s ON o.sitter_id = s.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 获取系统公告列表
DROP FUNCTION IF EXISTS get_admin_announcements();
CREATE OR REPLACE FUNCTION get_admin_announcements()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR -- Admin name
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.content,
    a.created_at,
    COALESCE(p.nickname, '系统管理员') as created_by
  FROM announcements a
  LEFT JOIN profiles p ON a.created_by = p.id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 切换用户状态 (封禁/解封)
DROP FUNCTION IF EXISTS admin_toggle_user_status(UUID, BOOLEAN);
CREATE OR REPLACE FUNCTION admin_toggle_user_status(p_user_id UUID, p_ban BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET status = CASE WHEN p_ban THEN 'banned' ELSE 'active' END
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 辅助函数：将指定用户设置为管理员 (方便测试)
DROP FUNCTION IF EXISTS set_user_as_admin(VARCHAR);
CREATE OR REPLACE FUNCTION set_user_as_admin(p_phone VARCHAR)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE phone = p_phone;
  
  IF v_user_id IS NULL THEN
    RETURN '用户不存在';
  END IF;
  
  UPDATE profiles SET role = 'admin' WHERE id = v_user_id;
  
  RETURN '设置成功，用户 ' || p_phone || ' 现在是管理员';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 获取宠托师认证列表 (包含经验和等级)
DROP FUNCTION IF EXISTS admin_get_sitter_certifications(VARCHAR);
CREATE OR REPLACE FUNCTION admin_get_sitter_certifications(p_status VARCHAR)
RETURNS TABLE (
  id UUID, -- sitter_id
  nickname VARCHAR,
  phone VARCHAR,
  real_name VARCHAR,
  id_card VARCHAR,
  status VARCHAR,
  submitted_at TIMESTAMP WITH TIME ZONE,
  experience_years INT,
  level VARCHAR,
  photos JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.user_id,
    p.nickname,
    p.phone,
    sp.real_name,
    sp.id_card,
    sp.certification_status,
    sp.certification_submitted_at,
    sp.experience_years,
    sp.level,
    jsonb_build_object(
      'front', sp.id_card_front,
      'back', sp.id_card_back
    )
  FROM sitter_profiles sp
  JOIN profiles p ON sp.user_id = p.id
  WHERE 
    CASE 
      WHEN p_status = 'all' THEN true
      WHEN p_status = 'pending' THEN sp.certification_status = 'pending'
      ELSE sp.certification_status = p_status
    END
  ORDER BY sp.certification_submitted_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建系统公告
DROP FUNCTION IF EXISTS admin_create_announcement(VARCHAR, TEXT, VARCHAR);
CREATE OR REPLACE FUNCTION admin_create_announcement(p_title VARCHAR, p_content TEXT, p_created_by VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_admin_id UUID;
BEGIN
  -- 尝试查找管理员ID，如果 p_created_by 是 UUID
  BEGIN
    v_admin_id := p_created_by::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_admin_id := auth.uid(); -- 默认使用当前用户ID
  END;

  INSERT INTO announcements (title, content, created_by)
  VALUES (p_title, p_content, v_admin_id)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 更新系统公告
DROP FUNCTION IF EXISTS admin_update_announcement(UUID, TEXT);
CREATE OR REPLACE FUNCTION admin_update_announcement(p_id UUID, p_content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE announcements 
  SET content = p_content, updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 获取统计数据 (简单版)
DROP FUNCTION IF EXISTS get_admin_stats();
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users INT,
  total_orders INT,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM profiles),
    (SELECT COUNT(*)::INT FROM orders),
    (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'COMPLETED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 更新用户资产 (余额/积分)
DROP FUNCTION IF EXISTS admin_update_user_assets(UUID, DECIMAL, INT);
CREATE OR REPLACE FUNCTION admin_update_user_assets(p_user_id UUID, p_balance DECIMAL, p_points INT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE profiles
  SET 
    balance = COALESCE(p_balance, balance),
    points = COALESCE(p_points, points)
  WHERE id = p_user_id
  RETURNING jsonb_build_object('id', id, 'balance', balance, 'points', points) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 审核宠托师
DROP FUNCTION IF EXISTS admin_verify_sitter(UUID, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION admin_verify_sitter(p_sitter_id UUID, p_status VARCHAR, p_reject_reason VARCHAR DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sitter_profiles
  SET 
    certification_status = p_status,
    is_certified = (p_status = 'approved'),
    certification_reject_reason = p_reject_reason,
    certification_reviewed_at = NOW()
  WHERE user_id = p_sitter_id;
  
  -- 如果通过认证，同时更新 role 为 sitter (如果尚未是)
  IF p_status = 'approved' THEN
     UPDATE profiles SET role = 'sitter' WHERE id = p_sitter_id AND role = 'owner';
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 获取服务列表
DROP FUNCTION IF EXISTS admin_get_services();
CREATE OR REPLACE FUNCTION admin_get_services()
RETURNS TABLE (
  id VARCHAR,
  name VARCHAR,
  base_price DECIMAL,
  discount_percent INT,
  service_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id::VARCHAR, -- 假设 services.id 是 UUID 或 VARCHAR
    s.name,
    s.base_price,
    s.discount_percent,
    s.type as service_type
  FROM services s
  ORDER BY s.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 更新服务价格
DROP FUNCTION IF EXISTS admin_update_service_price(VARCHAR, DECIMAL, INT);
CREATE OR REPLACE FUNCTION admin_update_service_price(p_service_id VARCHAR, p_price DECIMAL, p_discount INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE services
  SET 
    base_price = p_price,
    discount_percent = p_discount,
    updated_at = NOW()
  WHERE id = p_service_id::UUID; -- 假设 ID 是 UUID
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 删除系统公告
DROP FUNCTION IF EXISTS admin_delete_announcement(UUID);
CREATE OR REPLACE FUNCTION admin_delete_announcement(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM announcements WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. 管理员登录 (模拟)
DROP FUNCTION IF EXISTS admin_login(VARCHAR, VARCHAR);
-- 注意：生产环境应使用 Supabase Auth。这里为了兼容现有代码逻辑，提供一个简单的校验
CREATE OR REPLACE FUNCTION admin_login(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  role VARCHAR,
  permissions TEXT[]
) AS $$
BEGIN
  -- 这里硬编码一个管理员账号 admin / admin123
  IF p_username = 'admin' AND p_password = 'admin123' THEN
    RETURN QUERY SELECT 
      '00000000-0000-0000-0000-000000000000'::UUID as id,
      'admin'::VARCHAR as username,
      'super_admin'::VARCHAR as role,
      ARRAY['admin', 'all']::TEXT[] as permissions;
  ELSE
    -- 返回空结果
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

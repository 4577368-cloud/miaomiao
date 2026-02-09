-- Consolidated Admin System Fixes
-- Run this script to fix all admin backend issues

-- 1. Ensure Service Types Table and Data
CREATE TABLE IF NOT EXISTS service_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 100,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO service_types (code, name, description, base_price, discount_percent)
VALUES 
  ('FEEDING', '上门喂养', '喂食 · 换水 · 铲屎', 50.00, 100),
  ('WALKING', '上门遛宠', '遛狗 · 陪玩 · 清洁', 60.00, 100),
  ('FOSTER', '家庭寄养', '寄养 · 照看 · 陪伴', 80.00, 100)
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Admin Users Table and Default Admin
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL, -- In production, use hash
  role VARCHAR DEFAULT 'admin',
  permissions TEXT[] DEFAULT ARRAY['all'],
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Admin (admin / admin123)
INSERT INTO admin_users (username, password, role)
VALUES ('admin', 'admin123', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- 3. Fix RPC Functions to match AdminAPI.ts

-- 3.1 Get Admin Users
DROP FUNCTION IF EXISTS get_admin_users();
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id UUID,
  nickname VARCHAR,
  avatar VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  balance DECIMAL,
  points INTEGER,
  status VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nickname,
    p.avatar,
    p.phone,
    p.role::VARCHAR,
    p.balance,
    p.points,
    COALESCE(p.status, 'active') as status,
    p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Update User Assets
DROP FUNCTION IF EXISTS admin_update_user_assets(UUID, DECIMAL, INTEGER);
CREATE OR REPLACE FUNCTION admin_update_user_assets(
  p_user_id UUID,
  p_balance DECIMAL DEFAULT NULL,
  p_points INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE profiles
  SET 
    balance = COALESCE(p_balance, balance),
    points = COALESCE(p_points, points),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  SELECT jsonb_build_object(
    'id', id,
    'balance', balance,
    'points', points
  ) INTO v_result
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Get Sitter Certifications
DROP FUNCTION IF EXISTS admin_get_sitter_certifications(VARCHAR);
CREATE OR REPLACE FUNCTION admin_get_sitter_certifications(p_status VARCHAR DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  real_name VARCHAR,
  id_card VARCHAR,
  level VARCHAR,
  status VARCHAR,
  submitted_at TIMESTAMPTZ,
  photos JSONB,
  experience_years INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.user_id,
    sp.real_name,
    sp.id_card,
    sp.level,
    sp.certification_status as status,
    sp.certification_submitted_at as submitted_at,
    jsonb_build_object(
      'front', sp.id_card_front,
      'back', sp.id_card_back
    ) as photos,
    sp.experience_years
  FROM sitter_profiles sp
  WHERE (p_status IS NULL OR sp.certification_status = p_status)
  ORDER BY sp.certification_submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Verify Sitter (Match AdminAPI params: p_sitter_id, p_status, p_reject_reason)
DROP FUNCTION IF EXISTS admin_verify_sitter(UUID, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION admin_verify_sitter(
  p_sitter_id UUID,
  p_status VARCHAR,
  p_reject_reason VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sitter_profiles
  SET 
    certification_status = p_status,
    certification_reject_reason = p_reject_reason,
    certification_reviewed_at = NOW(),
    is_certified = (p_status = 'approved') -- Assuming 'approved' is the success status
  WHERE user_id = p_sitter_id;
  
  -- If verified, ensure role is sitter in profiles
  IF p_status = 'approved' THEN
    UPDATE profiles SET role = 'sitter' WHERE id = p_sitter_id AND role = 'owner';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.5 Get Services
DROP FUNCTION IF EXISTS admin_get_services();
CREATE OR REPLACE FUNCTION admin_get_services()
RETURNS SETOF service_types AS $$
BEGIN
  RETURN QUERY SELECT * FROM service_types ORDER BY base_price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6 Update Service Price (Match AdminAPI: p_service_id, p_price, p_discount)
DROP FUNCTION IF EXISTS admin_update_service_price(VARCHAR, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS admin_update_service_price(UUID, DECIMAL, INTEGER);

CREATE OR REPLACE FUNCTION admin_update_service_price(
  p_service_id UUID, -- Changed from code to UUID to match AdminAPI calling logic (if it passes ID)
  p_price DECIMAL,
  p_discount INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE service_types
  SET 
    base_price = p_price,
    discount_percent = p_discount,
    updated_at = NOW()
  WHERE id = p_service_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also provide overload for code if needed, but ID is safer if frontend has ID
CREATE OR REPLACE FUNCTION admin_update_service_price(
  p_code VARCHAR,
  p_price DECIMAL,
  p_discount INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE service_types
  SET 
    base_price = p_price,
    discount_percent = p_discount,
    updated_at = NOW()
  WHERE code = p_code;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3.7 Create Announcement
DROP FUNCTION IF EXISTS admin_create_announcement(VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION admin_create_announcement(
  p_title VARCHAR,
  p_content VARCHAR,
  p_created_by VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO announcements (title, content, created_by, created_at)
  VALUES (p_title, p_content, p_created_by, NOW())
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.8 Get Announcements
DROP FUNCTION IF EXISTS get_admin_announcements();
CREATE OR REPLACE FUNCTION get_admin_announcements()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  content TEXT,
  created_by VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.content,
    a.created_by,
    a.created_at
  FROM announcements a
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.9 Admin Login (Fix ambiguity)
DROP FUNCTION IF EXISTS admin_login(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  role VARCHAR,
  permissions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.username,
    au.role,
    au.permissions
  FROM admin_users au
  WHERE au.username = p_username 
  AND au.password = p_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.10 Get Admin Stats
DROP FUNCTION IF EXISTS get_admin_stats();
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_orders BIGINT,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'COMPLETED') as total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.11 Toggle User Status (Ban/Unban)
DROP FUNCTION IF EXISTS admin_toggle_user_status(UUID, BOOLEAN);
CREATE OR REPLACE FUNCTION admin_toggle_user_status(
  p_user_id UUID,
  p_ban BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET status = CASE WHEN p_ban THEN 'banned' ELSE 'active' END
  WHERE id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.12 Get Admin Orders
DROP FUNCTION IF EXISTS get_admin_orders();
CREATE OR REPLACE FUNCTION get_admin_orders()
RETURNS TABLE (
  id UUID,
  order_number VARCHAR,
  service_type VARCHAR,
  amount DECIMAL,
  status VARCHAR,
  created_at TIMESTAMPTZ,
  sitter_name VARCHAR,
  owner_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.id::VARCHAR as order_number, -- Simplified, normally use serial or specific column
    o.service_type,
    o.total_price as amount,
    o.status,
    o.created_at,
    s.nickname as sitter_name,
    p.nickname as owner_name
  FROM orders o
  LEFT JOIN profiles p ON o.creator_id = p.id
  LEFT JOIN profiles s ON o.sitter_id = s.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure service_types table exists
CREATE TABLE IF NOT EXISTS service_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 100, -- 100 means no discount (100% of price)
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default services if not exist
INSERT INTO service_types (code, name, description, base_price, discount_percent)
VALUES 
  ('FEEDING', '上门喂养', '喂食 · 换水 · 铲屎', 50.00, 100),
  ('WALKING', '上门遛宠', '遛狗 · 陪玩 · 清洁', 60.00, 100)
ON CONFLICT (code) DO NOTHING;

-- Ensure pricing_configs table exists
CREATE TABLE IF NOT EXISTS pricing_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category VARCHAR NOT NULL,
  key VARCHAR NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

-- Ensure announcements table has title field
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'title') THEN
    ALTER TABLE announcements ADD COLUMN title VARCHAR DEFAULT '系统公告';
  END IF;
END $$;

-- 1. Get Admin Users (Enhanced with Balance/Points)
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

-- 2. Update User Balance/Points
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

-- 3. Get Sitter Certifications (Pending)
CREATE OR REPLACE FUNCTION admin_get_sitter_certifications(p_status VARCHAR DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  real_name VARCHAR,
  id_card VARCHAR,
  level VARCHAR,
  status VARCHAR,
  submitted_at TIMESTAMPTZ,
  photos JSONB
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
    ) as photos
  FROM sitter_profiles sp
  WHERE (p_status IS NULL OR sp.certification_status = p_status)
  ORDER BY sp.certification_submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Approve/Reject Sitter
CREATE OR REPLACE FUNCTION admin_verify_sitter(
  p_user_id UUID,
  p_status VARCHAR, -- 'verified' or 'rejected'
  p_reason VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sitter_profiles
  SET 
    certification_status = p_status,
    certification_reject_reason = p_reason,
    certification_reviewed_at = NOW(),
    is_certified = (p_status = 'verified')
  WHERE user_id = p_user_id;
  
  -- If verified, ensure role is sitter in profiles (optional, but good for consistency)
  IF p_status = 'verified' THEN
    UPDATE profiles SET role = 'sitter' WHERE id = p_user_id AND role = 'owner';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Services
CREATE OR REPLACE FUNCTION admin_get_services()
RETURNS SETOF service_types AS $$
BEGIN
  RETURN QUERY SELECT * FROM service_types ORDER BY base_price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update Service Price/Discount
CREATE OR REPLACE FUNCTION admin_update_service_price(
  p_code VARCHAR,
  p_base_price DECIMAL,
  p_discount_percent INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE service_types
  SET 
    base_price = p_base_price,
    discount_percent = p_discount_percent,
    updated_at = NOW()
  WHERE code = p_code;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update Announcement (Enhance with Title)
-- Drop existing if signature mismatch
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

-- 8. Get Announcements (Include Title)
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


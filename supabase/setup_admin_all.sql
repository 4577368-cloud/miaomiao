-- Consolidated setup for admin features: functions + RLS policies
-- Run in Supabase SQL Editor

-- FUNCTIONS: Users
DROP FUNCTION IF EXISTS public.get_admin_users();
CREATE OR REPLACE FUNCTION public.get_admin_users()
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
    p.id::UUID,
    p.nickname::VARCHAR,
    p.avatar::VARCHAR,
    p.phone::VARCHAR,
    p.role::TEXT,
    p.balance::DECIMAL,
    p.points::INTEGER,
    COALESCE(p.status::TEXT, 'active')::VARCHAR,
    p.created_at::TIMESTAMPTZ
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTIONS: Orders
DROP FUNCTION IF EXISTS public.get_admin_orders();
CREATE OR REPLACE FUNCTION public.get_admin_orders()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
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
    o.id::UUID,
    o.created_at::TIMESTAMPTZ,
    o.status::TEXT,
    o.total_price::DECIMAL,
    o.service_type::TEXT,
    c.nickname::VARCHAR AS creator_name,
    c.phone::VARCHAR AS creator_phone,
    s.nickname::VARCHAR AS sitter_name,
    s.phone::VARCHAR AS sitter_phone
  FROM public.orders o
  LEFT JOIN public.profiles c ON o.creator_id = c.id
  LEFT JOIN public.profiles s ON o.sitter_id = s.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTIONS: Stats
DROP FUNCTION IF EXISTS public.get_admin_stats();
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users INT,
  total_orders INT,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM public.profiles),
    (SELECT COUNT(*)::INT FROM public.orders),
    (SELECT COALESCE(SUM(total_price), 0)::DECIMAL FROM public.orders WHERE status = 'COMPLETED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BANNERS TABLE + FUNCTIONS
DROP TABLE IF EXISTS public.banners;
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR,
  image_url TEXT NOT NULL,
  action_type VARCHAR NOT NULL,
  action_payload JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP FUNCTION IF EXISTS public.admin_get_banners();
CREATE OR REPLACE FUNCTION public.admin_get_banners()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  image_url TEXT,
  action_type VARCHAR,
  action_payload JSONB,
  is_active BOOLEAN,
  sort_order INT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.image_url,
    b.action_type,
    b.action_payload,
    b.is_active,
    b.sort_order,
    b.start_time,
    b.end_time,
    b.created_at
  FROM public.banners b
  ORDER BY b.sort_order ASC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.admin_upsert_banner(UUID, VARCHAR, TEXT, VARCHAR, JSONB, BOOLEAN, INT, TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION public.admin_upsert_banner(
  p_id UUID,
  p_title VARCHAR,
  p_image_url TEXT,
  p_action_type VARCHAR,
  p_action_payload JSONB,
  p_is_active BOOLEAN,
  p_sort_order INT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.banners (title, image_url, action_type, action_payload, is_active, sort_order, start_time, end_time)
    VALUES (p_title, p_image_url, p_action_type, p_action_payload, COALESCE(p_is_active, TRUE), COALESCE(p_sort_order, 0), p_start_time, p_end_time)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.banners
    SET
      title = p_title,
      image_url = p_image_url,
      action_type = p_action_type,
      action_payload = p_action_payload,
      is_active = p_is_active,
      sort_order = p_sort_order,
      start_time = p_start_time,
      end_time = p_end_time,
      updated_at = NOW()
    WHERE id = p_id
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.admin_delete_banner(UUID);
CREATE OR REPLACE FUNCTION public.admin_delete_banner(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.banners WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_active_banners();
CREATE OR REPLACE FUNCTION public.get_active_banners()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  image_url TEXT,
  action_type VARCHAR,
  action_payload JSONB,
  sort_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.image_url,
    b.action_type,
    b.action_payload,
    b.sort_order
  FROM public.banners b
  WHERE b.is_active = TRUE
    AND (b.start_time IS NULL OR b.start_time <= NOW())
    AND (b.end_time IS NULL OR b.end_time >= NOW())
  ORDER BY b.sort_order ASC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: Admin and App
-- Include from separate files for clarity (copy content if needed)
-- 1) Admin access on profiles, banners, orders, coupon_templates, coupons
-- See: policies_admin_access.sql
-- 2) Storage policies for public1 bucket
-- See: policies_storage_public1.sql

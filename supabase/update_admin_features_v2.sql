-- 更新 Admin 功能所需的数据库结构和函数
-- 请在 Supabase SQL Editor 中运行此脚本

-- 1. 确保 profiles 表有 points 字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;

-- 2. 创建服务价格表 (如果不存在)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL UNIQUE, -- FEEDING, WALKING, FOSTER
  name VARCHAR(50) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_percent INT DEFAULT 100, -- 100 means no discount
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取服务价格
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);

-- 仅允许管理员修改
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL
  USING (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  WITH CHECK (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 插入默认服务数据 (如果不存在)
INSERT INTO public.services (type, name, base_price, description)
VALUES 
  ('FEEDING', '上门喂养', 50.00, '喂食、换水、铲屎、陪玩'),
  ('WALKING', '上门遛宠', 60.00, '遛狗、清洁、陪玩'),
  ('FOSTER', '家庭寄养', 80.00, '全天候家庭式寄养')
ON CONFLICT (type) DO NOTHING;

-- 3. 创建/更新 RPC 函数

-- 3.1 更新用户资产 (余额和积分)
CREATE OR REPLACE FUNCTION admin_update_user_assets(p_user_id UUID, p_balance DECIMAL, p_points INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    balance = p_balance,
    points = p_points,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 获取宠托师认证列表
CREATE OR REPLACE FUNCTION admin_get_sitter_certifications(p_status VARCHAR)
RETURNS TABLE (
  id UUID, -- sitter_id (user_id)
  nickname VARCHAR,
  phone VARCHAR,
  real_name VARCHAR,
  id_card VARCHAR,
  status VARCHAR, -- certification_status
  submitted_at TIMESTAMP WITH TIME ZONE,
  photos JSONB -- id_card_front, id_card_back
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

-- 3.3 审核宠托师
CREATE OR REPLACE FUNCTION admin_verify_sitter(p_sitter_id UUID, p_status VARCHAR, p_reject_reason VARCHAR DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sitter_profiles 
  SET 
    certification_status = p_status,
    is_certified = (p_status = 'approved'),
    certification_reject_reason = p_reject_reason,
    certification_reviewed_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_sitter_id;
  
  -- 如果通过认证，确保角色为 sitter
  IF p_status = 'approved' THEN
    UPDATE profiles
    SET role = 'sitter'
    WHERE id = p_sitter_id AND role != 'admin'; -- 防止覆盖 admin 角色
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 获取服务列表
CREATE OR REPLACE FUNCTION admin_get_services()
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  name VARCHAR,
  base_price DECIMAL,
  discount_percent INT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.type,
    s.name,
    s.base_price,
    s.discount_percent,
    s.updated_at
  FROM services s
  ORDER BY s.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.5 更新服务价格
CREATE OR REPLACE FUNCTION admin_update_service_price(p_service_id UUID, p_price DECIMAL, p_discount INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE services 
  SET 
    base_price = p_price,
    discount_percent = p_discount,
    updated_at = NOW()
  WHERE id = p_service_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6 删除系统公告
CREATE OR REPLACE FUNCTION admin_delete_announcement(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM announcements WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 修复：为用户表（profiles）添加状态字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 修复：为订单表添加管理员操作记录字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- 添加注释说明
COMMENT ON COLUMN profiles.status IS '用户状态：active(正常), banned(封禁), inactive(未激活)';
COMMENT ON COLUMN orders.admin_notes IS '管理员备注和操作记录';
COMMENT ON COLUMN orders.last_modified_by IS '最后修改的管理员ID';
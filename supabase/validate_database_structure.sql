-- 数据库表结构验证脚本
-- 用于验证管理员系统相关的表结构是否正确

-- 1. 验证profiles表结构
SELECT 
  'profiles表验证' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN '✅ 表存在'
    ELSE '❌ 表不存在'
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'status') 
    THEN '✅ status字段存在'
    ELSE '❌ status字段不存在'
  END as status_field;

-- 2. 验证orders表结构
SELECT 
  'orders表验证' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
    THEN '✅ 表存在'
    ELSE '❌ 表不存在'
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'admin_notes') 
    THEN '✅ admin_notes字段存在'
    ELSE '❌ admin_notes字段不存在'
  END as admin_notes_field,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'last_modified_by') 
    THEN '✅ last_modified_by字段存在'
    ELSE '❌ last_modified_by字段不存在'
  END as last_modified_by_field;

-- 3. 验证admin_users表结构
SELECT 
  'admin_users表验证' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users')
    THEN '✅ 表存在'
    ELSE '❌ 表不存在'
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'admin_users' AND column_name = 'username') 
    THEN '✅ username字段存在'
    ELSE '❌ username字段不存在'
  END as username_field,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'admin_users' AND column_name = 'password_hash') 
    THEN '✅ password_hash字段存在'
    ELSE '❌ password_hash字段不存在'
  END as password_field;

-- 4. 验证管理员相关函数
SELECT 
  'admin_login函数' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_login')
    THEN '✅ 函数存在'
    ELSE '❌ 函数不存在'
  END as status
UNION ALL
SELECT 
  'get_admin_users函数' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_admin_users')
    THEN '✅ 函数存在'
    ELSE '❌ 函数不存在'
  END as status
UNION ALL
SELECT 
  'get_admin_orders函数' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_admin_orders')
    THEN '✅ 函数存在'
    ELSE '❌ 函数不存在'
  END as status
UNION ALL
SELECT 
  'get_admin_stats函数' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_admin_stats')
    THEN '✅ 函数存在'
    ELSE '❌ 函数不存在'
  END as status;

-- 5. 验证默认管理员账号
SELECT 
  '默认管理员账号' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin')
    THEN '✅ 管理员账号存在'
    ELSE '❌ 管理员账号不存在'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin' AND is_active = true)
    THEN '✅ 管理员账号激活'
    ELSE '❌ 管理员账号未激活'
  END as active_status;

-- 6. 显示当前数据库中的所有表
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'orders', 'admin_users', 'admin_login_logs', 'admin_action_logs')
ORDER BY table_name;

-- 7. 显示关键字段详情
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'orders', 'admin_users')
  AND column_name IN ('status', 'admin_notes', 'last_modified_by', 'username', 'password_hash', 'role')
ORDER BY table_name, column_name;
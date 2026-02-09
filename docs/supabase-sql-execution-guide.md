# Supabase SQL脚本执行指南

## 🚫 错误说明

您遇到的错误：
```
zsh: permission denied: /Users/yangguifeng/Documents/miaomiao/supabase/validate_database_structure.sql
```

这是因为SQL脚本不能直接通过命令行执行，需要在Supabase的SQL编辑器中运行。

## ✅ 正确的执行方式

### 方法1：Supabase控制台（推荐）

1. **登录Supabase控制台**
   - 访问：https://app.supabase.com
   - 选择您的项目

2. **打开SQL编辑器**
   - 点击左侧菜单的"SQL Editor"
   - 或访问：https://app.supabase.com/project/[项目ID]/sql

3. **执行修复脚本**
   复制以下内容到SQL编辑器：

```sql
-- 修复：为用户表（profiles）添加状态字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive'));

-- 修复：为订单表添加管理员操作记录字段
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- 添加字段注释
COMMENT ON COLUMN public.profiles.status IS '用户状态：active(正常), banned(封禁), inactive(未激活)';
COMMENT ON COLUMN public.orders.admin_notes IS '管理员备注和操作记录';
COMMENT ON COLUMN public.orders.last_modified_by IS '最后修改的管理员ID';
```

4. **点击"Run"按钮执行**

### 方法2：使用Supabase CLI

如果您已安装Supabase CLI：

```bash
# 登录Supabase
supabase login

# 执行SQL文件
supabase db sql --file /Users/yangguifeng/Documents/miaomiao/supabase/fix_correct_table_names.sql
```

### 方法3：使用curl（高级）

```bash
# 设置环境变量
export SUPABASE_URL="您的Supabase项目URL"
export SUPABASE_SERVICE_KEY="您的service_role密钥"

# 执行SQL
curl -X POST "$SUPABASE_URL/rest/v1/sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'active\'; ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes TEXT, ADD COLUMN IF NOT EXISTS last_modified_by UUID;"
  }'
```

## 🔍 验证执行结果

执行修复脚本后，在Supabase SQL编辑器中运行：

```sql
-- 验证profiles表
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'status';

-- 验证orders表
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('admin_notes', 'last_modified_by');

-- 显示成功消息
SELECT '✅ 数据库表结构修复完成！' as message;
```

## 📋 完整修复步骤

### 步骤1：执行主要修复
```sql
-- 复制到Supabase SQL编辑器执行
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive'));

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by UUID;
```

### 步骤2：验证修复结果
```sql
-- 验证所有字段都已正确添加
SELECT 
  'profiles.status字段' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'status') 
    THEN '✅ 已添加' 
    ELSE '❌ 未添加' 
  END as status
UNION ALL
SELECT 
  'orders.admin_notes字段' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'admin_notes') 
    THEN '✅ 已添加' 
    ELSE '❌ 未添加' 
  END as status
UNION ALL
SELECT 
  'orders.last_modified_by字段' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'last_modified_by') 
    THEN '✅ 已添加' 
    ELSE '❌ 未添加' 
  END as status;
```

### 步骤3：测试管理员功能

1. 访问管理员后台：`https://miaomiao-blue.vercel.app/#/admin`
2. 使用默认账号登录：admin / admin123
3. 测试用户状态管理功能
4. 测试订单备注功能

## ⚠️ 注意事项

1. **权限要求**：确保使用service_role密钥，不是anon密钥
2. **备份建议**：执行前建议备份数据库
3. **错误处理**：如果执行失败，检查错误消息并相应调整
4. **生产环境**：在生产环境执行前，请在测试环境验证

## 🆘 常见问题

### Q: 执行后没有反应？
A: 检查是否使用了正确的密钥和URL，确保网络连接正常

### Q: 字段已存在怎么办？
A: 使用`IF NOT EXISTS`语法，不会重复添加

### Q: 权限不足错误？
A: 确保使用service_role密钥，不是anon密钥

### Q: 如何回滚操作？
A: 如果需要回滚，可以手动删除添加的字段：
```sql
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;
ALTER TABLE public.orders DROP COLUMN IF EXISTS admin_notes;
ALTER TABLE public.orders DROP COLUMN IF EXISTS last_modified_by;
```

## ✅ 成功指标

修复成功后，您应该能够：
- ✅ 在管理员后台查看和修改用户状态
- ✅ 在订单管理中添加管理员备注
- ✅ 系统正确识别最后修改订单的管理员
- ✅ 所有管理员功能正常工作

执行完成后，您的管理员系统就可以正常使用用户状态管理和订单备注功能了！
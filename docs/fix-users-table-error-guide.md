# 数据库表名错误修复指南

## 问题描述

您在执行SQL脚本时遇到错误：
```
ERROR: 42P01: relation "users" does not exist
```

## 问题原因

系统中不存在名为"users"的表，而是使用"profiles"表来存储用户信息。这是Supabase的标准做法，"profiles"表扩展了auth.users表。

## 解决方案

### 1. 使用正确的修复脚本

执行这个修正后的SQL脚本：

```sql
-- 文件：/Users/yangguifeng/Documents/miaomiao/supabase/fix_correct_table_names.sql

-- 为profiles表添加状态字段（如果不存在）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive'));

-- 为orders表添加管理员相关字段（如果不存在）  
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- 添加字段注释
COMMENT ON COLUMN public.profiles.status IS '用户状态：active(正常), banned(封禁), inactive(未激活)';
COMMENT ON COLUMN public.orders.admin_notes IS '管理员备注和操作记录';
COMMENT ON COLUMN public.orders.last_modified_by IS '最后修改的管理员ID';
```

### 2. 数据库结构说明

#### 现有表结构

1. **profiles表** - 用户档案信息
   ```sql
   CREATE TABLE public.profiles (
     id UUID PRIMARY KEY REFERENCES auth.users,
     nickname TEXT,
     avatar TEXT,
     role TEXT CHECK (role IN ('owner', 'sitter', 'admin')),
     -- 其他字段...
   );
   ```

2. **orders表** - 订单信息
   ```sql
   CREATE TABLE public.orders (
     id UUID PRIMARY KEY,
     creator_id UUID REFERENCES public.profiles,
     sitter_id UUID REFERENCES public.profiles,
     -- 其他字段...
   );
   ```

#### 管理员相关表

3. **admin_users表** - 管理员账号
   ```sql
   CREATE TABLE admin_users (
     id UUID PRIMARY KEY,
     username VARCHAR(50) UNIQUE,
     password_hash VARCHAR(255),
     role VARCHAR(20),
     -- 其他字段...
   );
   ```

### 3. 验证修复结果

执行脚本后，可以通过以下查询验证：

```sql
-- 检查profiles表是否添加了status字段
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'status';

-- 检查orders表是否添加了管理员字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('admin_notes', 'last_modified_by');

-- 查看表结构
\d profiles
\d orders
```

### 4. 前端代码适配

确保前端代码使用正确的表名：

#### 用户相关操作
```typescript
// 正确：使用profiles表
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

// 错误：使用users表（不存在）
const { data, error } = await supabase
  .from('users')  // ❌ 错误
  .select('*')
  .eq('id', userId);
```

#### 管理员相关操作
```typescript
// 正确：使用RPC函数或admin_users表
const result = await AdminAPI.getUsers(); // 使用RPC函数
const { data } = await supabase
  .from('admin_users')  // ✅ 管理员表存在
  .select('*');
```

### 5. 常见错误对照表

| 错误SQL | 正确SQL | 说明 |
|---------|---------|------|
| `ALTER TABLE users...` | `ALTER TABLE profiles...` | users表不存在 |
| `SELECT * FROM users` | `SELECT * FROM profiles` | 使用profiles表 |
| `UPDATE users SET...` | `UPDATE profiles SET...` | 更新用户档案 |
| `DELETE FROM users` | `DELETE FROM profiles` | 删除用户档案 |

### 6. 完整的数据库关系图

```
auth.users (Supabase内置)
    ↓ (id)
public.profiles (用户档案)
    ↓ (id)
public.orders (订单)
    ↓ (creator_id, sitter_id)
public.admin_users (管理员账号)
    ↓ (id)
admin_login_logs (登录日志)
admin_action_logs (操作日志)
```

## 一键修复

如果您需要快速修复，请执行：

```bash
# 在Supabase SQL编辑器中执行
/Users/yangguifeng/Documents/miaomiao/supabase/fix_correct_table_names.sql
```

## 验证修复

修复完成后，系统会自动验证：
- ✅ profiles表添加了status字段
- ✅ orders表添加了admin_notes字段  
- ✅ orders表添加了last_modified_by字段
- ✅ 所有字段注释已添加

## 后续建议

1. **代码审查**：检查所有SQL语句，确保使用正确的表名
2. **测试验证**：在测试环境验证所有功能
3. **文档更新**：更新相关文档，说明表结构
4. **团队培训**：确保开发团队了解正确的表结构

这样修复后，您的管理员系统将能够正常使用用户状态管理和订单备注功能。
# 管理员系统部署指南

## 概述

本指南说明如何在Supabase中部署管理员系统，包括数据库表、函数和权限设置。

## 部署步骤

### 1. 数据库表结构

首先，确保您的Supabase项目已经运行了基础的数据库迁移文件：

- `schema.sql` - 基础表结构
- `migrations/20260208_admin_setup.sql` - 管理员权限设置
- `migrations/20260208_admin_functions.sql` - 管理员功能函数
- `migrations/20260208_fix_admin_rls.sql` - 权限修复

### 2. 部署最终管理员系统

运行以下SQL脚本完成管理员系统部署：

```bash
# 在Supabase SQL编辑器中执行
supabase/final_admin_system.sql
```

### 3. 创建管理员账号

部署完成后，系统会自动创建默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@miaomiao.com`
- **角色**: `super_admin`

### 4. 验证部署

#### 4.1 测试管理员登录

在Supabase SQL编辑器中执行：

```sql
-- 测试管理员登录
SELECT * FROM admin_login('admin', 'admin123');
```

应该返回管理员信息。

#### 4.2 测试获取用户列表

```sql
-- 测试获取用户列表
SELECT * FROM get_admin_users();
```

#### 4.3 测试获取订单列表

```sql
-- 测试获取订单列表
SELECT * FROM get_admin_orders();
```

## 数据库结构说明

### 管理员相关表

#### admin_users
存储管理员账号信息：
- `id`: 管理员ID
- `username`: 用户名（唯一）
- `email`: 邮箱（唯一）
- `password_hash`: 加密密码
- `role`: 角色（super_admin, admin, moderator）
- `permissions`: 权限列表（JSONB）
- `is_active`: 是否激活
- `last_login`: 最后登录时间

#### admin_login_logs
管理员登录日志：
- `admin_id`: 管理员ID
- `login_ip`: 登录IP
- `login_time`: 登录时间
- `login_success`: 登录是否成功
- `user_agent`: 用户代理

#### admin_action_logs
管理员操作日志：
- `admin_id`: 管理员ID
- `action`: 操作类型
- `target_type`: 目标类型
- `target_id`: 目标ID
- `details`: 详细信息
- `ip_address`: IP地址
- `created_at`: 创建时间

### 主要函数

#### admin_login(username, password)
管理员登录验证。

#### get_admin_users()
获取所有用户列表（包含基本信息）。

#### admin_toggle_user_status(user_id, ban)
切换用户状态（封禁/解封）。

#### get_admin_orders()
获取所有订单列表。

#### get_admin_announcements()
获取所有公告列表。

#### admin_create_announcement(title, content, created_by)
创建新公告。

#### admin_update_announcement(id, content)
更新公告内容。

#### admin_delete_announcement(id)
删除公告。

#### get_admin_stats()
获取统计数据（用户总数、订单总数、总收入）。

## 前端集成

### API端点

前端通过以下方式调用管理员API：

```typescript
import { AdminAPI } from '@/utils/admin-api';

// 管理员登录
const result = await AdminAPI.validateAdmin('admin', 'admin123');

// 获取用户列表
const users = await AdminAPI.getUsers();

// 获取订单列表
const orders = await AdminAPI.getOrders();

// 获取统计数据
const stats = await AdminAPI.getStats();
```

### 身份验证

管理员登录后，系统会自动在请求头中添加管理员身份信息：

- `X-Admin-ID`: 管理员ID
- `X-Admin-Username`: 管理员用户名

这些信息用于后端识别管理员身份。

## 安全考虑

### 1. 密码安全
- 使用bcrypt加密存储密码
- 定期更新管理员密码
- 使用强密码策略

### 2. 权限控制
- 基于角色的权限管理（RBAC）
- 操作日志记录
- IP地址记录

### 3. 数据保护
- 使用RLS（行级安全）策略
- 敏感数据加密
- 定期备份

## 故障排除

### 常见问题

#### 1. "relation 'users' does not exist"
**原因**: 系统中没有users表，使用的是profiles表
**解决**: 确保使用正确的表名，所有函数都已更新

#### 2. 管理员登录失败
**原因**: 密码错误或管理员账号不存在
**解决**: 检查admin_users表中的数据，确认密码正确

#### 3. 权限不足
**原因**: RLS策略限制
**解决**: 确保管理员有适当的RLS策略

### 调试命令

```sql
-- 检查管理员表
SELECT * FROM admin_users;

-- 检查最近登录日志
SELECT * FROM admin_login_logs ORDER BY login_time DESC LIMIT 10;

-- 检查最近操作日志
SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 10;

-- 检查profiles表结构
\d profiles

-- 检查函数是否存在
SELECT proname FROM pg_proc WHERE proname LIKE 'admin_%';
```

## 后续优化

### 计划中的功能

1. **批量操作**: 支持批量用户管理
2. **数据导出**: 支持数据导出功能
3. **实时监控**: 实时查看系统状态
4. **高级搜索**: 高级用户和订单搜索
5. **权限管理**: 更细粒度的权限控制

### 性能优化

1. **索引优化**: 根据查询模式优化索引
2. **缓存策略**: 实施适当的缓存策略
3. **分页支持**: 大数据集的分页支持
4. **连接池**: 优化数据库连接池

## 联系支持

如果遇到问题，请检查：

1. Supabase控制台中的错误日志
2. 前端浏览器的开发者工具控制台
3. 网络请求的响应状态

提供以下信息有助于快速解决问题：
- 错误消息的完整文本
- 相关的SQL查询
- 前端请求的详细信息
- Supabase项目配置
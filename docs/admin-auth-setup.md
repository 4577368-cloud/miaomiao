# 管理员账户与后台登录配置

## 1. 环境变量
- 在 `admin/.env` 设置：
  - `VITE_SUPABASE_URL`：你的 Supabase 项目 URL
  - `VITE_SUPABASE_ANON_KEY`：Anon Key
  - `VITE_STORAGE_BUCKET=public1`：存储桶名

## 2. 启用邮箱登录
- Supabase 控制台 → Authentication → Providers → Email 打开
- 测试阶段可关闭 Email confirmation，或先完成验证

## 3. 创建管理员账号
- 控制台 → Authentication → Users → Add user，填邮箱与密码
- 在 SQL Editor 设为 admin：
```sql
insert into public.profiles (id, nickname, role, status, created_at)
select u.id, coalesce(u.raw_user_meta_data->>'nickname','管理员'), 'admin', 'active', now()
from auth.users u
where u.email = 'admin@yourdomain.com'
and not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles p
set role = 'admin'
where p.id = (select id from auth.users where email = 'admin@yourdomain.com');
```

## 4. Storage 写入策略（仅管理员）
- 使用 `supabase/policies_storage_public1.sql`，在 SQL Editor 执行
- 桶 `public1` 设置为 Public（公开读取）

## 5. 登录后台
- 访问 `/login`，用管理员邮箱与密码登录
- 登录后可上传轮播图片、管理内容

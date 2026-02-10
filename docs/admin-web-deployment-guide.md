# Admin 网页端部署指南

## 项目结构
- 管理后台前端位于 `admin/` 子项目，使用 Vue3 + Element Plus + Supabase
- 构建输出目录：`dist`

## 本地开发
- 环境变量文件：`admin/.env`
  - `VITE_SUPABASE_URL=https://<your-project>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
- 启动开发服务器：`npm run dev`（端口 3001）
- 访问：`http://localhost:3001/`，订单管理在 `/dashboard/orders`

## Vercel 部署
- 新建 Vercel 项目，Root Directory 选择 `admin`
- Build Command：`npm run build`
- Output Directory：`dist`
- 复制环境变量到 Vercel 项目：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- 该子项目包含 `admin/vercel.json`，已配置 SPA 路由回退

## Supabase 准备
- 在 Supabase SQL Editor 执行 `supabase/update_admin_features_v3.sql`
  - 修复 RPC 类型：`get_admin_users`、`get_admin_orders`
  - 统计函数：`get_admin_stats`
- 若仍报权限或类型错误，检查：
  - 枚举返回是否显式 `::TEXT`
  - `id` 类型一致（UUID vs VARCHAR）
  - RLS 策略允许管理员读取

## 常见问题
- 浏览器提示 `net::ERR_ABORTED`：
  - 多为网络或函数未部署，先用本地“订单管理”的示例数据开关验证页面，再修复 RPC
- 开发机无法在同网段访问：
  - 将 `admin/vite.config.ts` 的 `server.host` 设为 `true`，在同局域网用 IP 访问

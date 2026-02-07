import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 自定义 Storage Adapter 以支持 Uni-app (非H5环境)
const UniStorageAdapter = {
  getItem: (key: string) => {
    return uni.getStorageSync(key);
  },
  setItem: (key: string, value: string) => {
    uni.setStorageSync(key, value);
  },
  removeItem: (key: string) => {
    uni.removeStorageSync(key);
  },
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未配置！请检查 .env 文件');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: UniStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // 小程序/App不支持URL Session检测
  },
});

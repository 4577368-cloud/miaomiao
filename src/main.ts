import { createSSRApp } from "vue";
import { createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import App from "./App.vue";

// #ifdef H5
// @ts-ignore
window._AMapSecurityConfig = {
  securityJsCode: 'c33f0278b2ea9468634718e96a945ab9',
}
// #endif

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);

  // 注册Service Worker (PWA支持)
  // #ifdef H5
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/src/sw.js')
        .then(registration => {
          console.log('ServiceWorker 注册成功: ', registration);
        })
        .catch(err => {
          console.log('ServiceWorker 注册失败: ', err);
        });
    });
  }
  // #endif

  // Global Route Guard
  const routeGuard = (args: any) => {
    try {
      const userStore = useUserStore();
      const role = userStore.userInfo?.role || 'owner';
      const url = args.url || '';

      // Rules configuration
      // 1. Sitter cannot access Publish page (Owner feature)
      if (role === 'sitter' && url.includes('/pages/publish/index')) {
        uni.showToast({
          title: '宠托师请前往"大厅"接单',
          icon: 'none'
        });
        return false;
      }

      // 2. Owner cannot access Sitter specific pages (if any specific ones exist)
      // Currently Sitter features are integrated into Home/Orders with v-if
      
      return true;
    } catch (e) {
      // Pinia might not be ready during very early initialization, but navigation usually happens after
      console.error('Route guard check failed:', e);
      return true;
    }
  };

  uni.addInterceptor('navigateTo', { invoke: routeGuard });
  uni.addInterceptor('switchTab', { invoke: routeGuard });
  uni.addInterceptor('redirectTo', { invoke: routeGuard });
  uni.addInterceptor('reLaunch', { invoke: routeGuard });

  return {
    app,
    pinia
  };
}

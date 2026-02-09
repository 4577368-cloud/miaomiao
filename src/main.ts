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
          
          // 监听PWA安装提示
          let deferredPrompt: any;
          
          window.addEventListener('beforeinstallprompt', (e) => {
            // 阻止默认的安装提示
            e.preventDefault();
            deferredPrompt = e;
            
            // 显示自定义安装按钮
            const installButton = document.createElement('div');
            installButton.innerHTML = `
              <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #FF8E3C; color: white; padding: 12px 24px; border-radius: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; z-index: 9999; font-size: 14px; font-weight: 500;">
                📱 添加到主屏幕
              </div>
            `;
            installButton.onclick = async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`用户${outcome === 'accepted' ? '接受' : '拒绝'}了安装提示`);
                deferredPrompt = null;
                installButton.remove();
              }
            };
            document.body.appendChild(installButton);
            
            // 5秒后自动隐藏安装提示
            setTimeout(() => {
              if (installButton.parentNode) {
                installButton.remove();
              }
            }, 5000);
          });
          
          // 监听应用安装成功
          window.addEventListener('appinstalled', () => {
            console.log('PWA已安装');
            uni.showToast({
              title: '安装成功！现在可以从主屏幕直接访问',
              icon: 'success'
            });
          });
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

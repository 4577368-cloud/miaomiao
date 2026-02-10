<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/stores/user';
import { useConfigStore } from '@/stores/config';

onLaunch(() => {
  console.log("App Launch");
  const userStore = useUserStore();
  const configStore = useConfigStore();
  userStore.initUser();
  configStore.initConfig();
  // 隐藏原生tabbar，使用自定义tabbar
  uni.hideTabBar({
    fail: () => {}
  });
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e: any) => {
    const msg = e?.message || 'Error';
    const src = e?.filename || e?.target?.src || '';
    const stack = e?.error?.stack || '';
    console.error('[GlobalError]', msg, src, stack);
  });
  window.addEventListener('unhandledrejection', (e: any) => {
    const reason = e?.reason;
    console.error('[UnhandledRejection]', reason?.message || String(reason), reason?.stack || '');
  });
}
</script>
<style lang="scss">
@import "@/styles/vars.scss";

page {
  background-color: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
  color: $text-primary;
}

view, text, button, input, textarea {
  box-sizing: border-box;
}
</style>

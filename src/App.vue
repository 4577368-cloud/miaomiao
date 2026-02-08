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

<template>
  <view class="tab-bar">
    <view 
      v-for="(item, index) in tabList" 
      :key="index" 
      class="tab-item" 
      @click="switchTab(item)"
    >
      <image 
        class="tab-icon" 
        :src="currentPath === item.pagePath ? item.selectedIconPath : item.iconPath" 
      />
      <text 
        class="tab-text" 
        :class="{ active: currentPath === item.pagePath }"
      >
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';

const props = defineProps<{
  currentPath: string
}>();

const userStore = useUserStore();

const ownerTabs = [
  {
    pagePath: 'pages/home/index',
    text: '首页',
    iconPath: '/static/tab-home.svg',
    selectedIconPath: '/static/tab-home-active.svg'
  },
  {
    pagePath: 'pages/orders/index',
    text: '订单',
    iconPath: '/static/tab-order.svg',
    selectedIconPath: '/static/tab-order-active.svg'
  },
  {
    pagePath: 'pages/profile/index',
    text: '我的',
    iconPath: '/static/tab-profile.svg',
    selectedIconPath: '/static/tab-profile-active.svg'
  }
];

const sitterTabs = [
  {
    pagePath: 'pages/home/index',
    text: '任务大厅',
    iconPath: '/static/tab-home.svg',
    selectedIconPath: '/static/tab-home-active.svg'
  },
  {
    pagePath: 'pages/orders/index',
    text: '日程',
    iconPath: '/static/tab-order.svg',
    selectedIconPath: '/static/tab-order-active.svg'
  },
  {
    pagePath: 'pages/wallet/index',
    text: '收益',
    iconPath: '/static/tab-profile.svg', // Reusing profile icon for wallet as a fallback
    selectedIconPath: '/static/tab-profile-active.svg'
  },
  {
    pagePath: 'pages/profile/index',
    text: '我的',
    iconPath: '/static/tab-profile.svg',
    selectedIconPath: '/static/tab-profile-active.svg'
  }
];

const tabList = computed(() => {
  const role = userStore.userInfo?.role || 'owner';
  return role === 'owner' ? ownerTabs : sitterTabs;
});

const switchTab = (item: any) => {
  if (props.currentPath === item.pagePath) return;
  
  const tabPages = [
    'pages/home/index',
    'pages/orders/index',
    'pages/message/index',
    'pages/wallet/index',
    'pages/profile/index'
  ];

  if (tabPages.includes(item.pagePath)) {
    uni.switchTab({
      url: '/' + item.pagePath
    });
  } else {
    uni.navigateTo({
      url: '/' + item.pagePath
    });
  }
};
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #FFFFFF;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50px;
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.tab-text {
  font-size: 10px;
  color: #BDB7B2;
  transition: color 0.3s;
  
  &.active {
    color: #FF8E3C;
    font-weight: 500;
  }
}
</style>

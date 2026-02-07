<template>
  <view class="container">
    <view class="menu-list">
      <view class="menu-item" @click="handleSwitchRole">
        <view class="item-left">
          <text class="label">切换身份</text>
        </view>
        <view class="item-right">
          <text class="value">{{ currentRole === 'owner' ? '当前：铲屎官' : '当前：宠托师' }}</text>
          <text class="arrow">></text>
        </view>
      </view>
      
      <view class="menu-item">
        <view class="item-left">
          <text class="label">账号安全</text>
        </view>
        <text class="arrow">></text>
      </view>
      
      <view class="menu-item">
        <view class="item-left">
          <text class="label">隐私设置</text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <view class="logout-btn" @click="handleLogout">退出登录</view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useOrderStore } from '@/stores/order';

const userStore = useUserStore();
const orderStore = useOrderStore();

const currentRole = computed(() => userStore.userInfo?.role || 'owner');

const handleSwitchRole = () => {
  const targetRole = currentRole.value === 'owner' ? 'sitter' : 'owner';
  
  // 1. Check Certification for Sitter
  if (targetRole === 'sitter') {
    if (!userStore.userInfo?.sitterProfile?.isCertified) {
      uni.showModal({
        title: '需要认证',
        content: '切换为宠托师模式需要先完成实名认证',
        confirmText: '去认证',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/profile/certification' });
          }
        }
      });
      return;
    }
  }

  // 2. Check Active Orders (Guard)
  const userId = userStore.userInfo?.id;
  if (!userId) return;

  // If switching FROM Sitter TO Owner (checking if Sitter has unfinished work)
  if (currentRole.value === 'sitter') {
    const hasActiveJobs = orderStore.orders.some(o => 
      o.sitterId === userId && 
      ['ACCEPTED', 'IN_SERVICE'].includes(o.status)
    );
    
    if (hasActiveJobs) {
      uni.showModal({
        title: '无法切换',
        content: '您还有未完成的接单任务，请先完成服务后再切换身份。',
        showCancel: false
      });
      return;
    }
  }
  
  // If switching FROM Owner TO Sitter (checking if Owner has active service requiring attention? - Optional based on requirements)
  // User Requirement: "If there are unfinished sitter tasks, forbid switching back to owner mode." - Handled above.
  
  // Perform Switch
  uni.showLoading({ title: '切换中...' });
  setTimeout(() => {
    userStore.switchRole(targetRole);
    uni.hideLoading();
    uni.navigateBack();
    uni.showToast({ title: `已切换为${targetRole === 'owner' ? '铲屎官' : '宠托师'}`, icon: 'success' });
  }, 500);
};

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 20rpx;
}

.menu-list {
  background: #fff;
  border-radius: $radius-lg;
  padding: 0 30rpx;
  margin-bottom: 40rpx;
  
  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx 0;
    border-bottom: 1rpx solid rgba(0,0,0,0.05);
    
    &:last-child { border-bottom: none; }
    
    .label {
      font-size: 30rpx;
      color: $color-text-main;
    }
    
    .item-right {
      display: flex;
      align-items: center;
      
      .value {
        font-size: 28rpx;
        color: $color-text-secondary;
        margin-right: 12rpx;
      }
      
      .arrow {
        color: #ccc;
        font-size: 24rpx;
      }
    }
  }
}

.logout-btn {
  background: #fff;
  color: $color-error;
  text-align: center;
  padding: 30rpx;
  border-radius: $radius-lg;
  font-size: 30rpx;
  font-weight: 500;
  
  &:active {
    background: #f9f9f9;
  }
}
</style>
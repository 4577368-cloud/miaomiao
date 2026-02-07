<template>
  <view class="container">
    <view class="address-list" v-if="userStore.userInfo?.addresses?.length">
      <view 
        class="address-card" 
        v-for="addr in userStore.userInfo.addresses" 
        :key="addr.id"
        @click="handleSelect(addr)"
      >
        <view class="info">
          <view class="header">
            <text class="tag" v-if="addr.name">{{ addr.name }}</text>
            <text class="detail">{{ addr.detail }}</text>
          </view>
          <view class="contact">
            <text class="name">{{ addr.contactName }}</text>
            <text class="phone">{{ addr.contactPhone }}</text>
            <text class="default-badge" v-if="addr.isDefault">默认</text>
          </view>
        </view>
        <view class="edit-btn" @click.stop="editAddress(addr)">
          <text class="icon">✏️</text>
        </view>
      </view>
    </view>
    
    <view class="empty-state" v-else>
      <text class="icon">📍</text>
      <text class="text">暂无地址，去添加一个吧</text>
    </view>
    
    <view class="footer-btn">
      <button class="btn-add" @click="editAddress()">+ 新增地址</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore, type Address } from '@/stores/user';

const userStore = useUserStore();
const isSelectionMode = ref(false);

onLoad((options: any) => {
  if (options.action === 'select') {
    isSelectionMode.value = true;
    uni.setNavigationBarTitle({ title: '选择地址' });
  }
});

const handleSelect = (addr: Address) => {
  if (isSelectionMode.value) {
    uni.$emit('addressSelected', addr);
    uni.navigateBack();
  }
};

const editAddress = (addr?: Address) => {
  const url = addr ? `/pages/address/edit?id=${addr.id}` : '/pages/address/edit';
  uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.address-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: $shadow-sm;
  
  .info {
    flex: 1;
    margin-right: 20rpx;
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;
      
      .tag {
        background: #E6F7FF;
        color: $color-blue;
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        margin-right: 12rpx;
      }
      
      .detail {
        font-size: 30rpx;
        font-weight: bold;
        color: $color-text-main;
      }
    }
    
    .contact {
      font-size: 26rpx;
      color: $color-text-secondary;
      display: flex;
      align-items: center;
      gap: 16rpx;
      
      .default-badge {
        background: #FFF0E5;
        color: #FF8E3C;
        font-size: 20rpx;
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
      }
    }
  }
  
  .edit-btn {
    padding: 10rpx;
    opacity: 0.6;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  
  .icon { font-size: 80rpx; margin-bottom: 20rpx; opacity: 0.5; }
  .text { color: $color-text-secondary; font-size: 28rpx; }
}

.footer-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  
  .btn-add {
    background: $color-primary;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    height: 88rpx;
    line-height: 88rpx;
    
    &:active { opacity: 0.9; }
  }
}
</style>

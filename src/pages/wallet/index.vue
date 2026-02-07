<template>
  <view class="container">
    <!-- Balance Card -->
    <view class="balance-card">
      <view class="balance-info" @click="handleWithdraw">
        <text class="label">账户余额 (元)</text>
        <text class="amount">{{ userStore.userInfo?.balance?.toFixed(2) || '0.00' }}</text>
        <text class="withdraw-hint" v-if="(userStore.userInfo?.balance || 0) > 0">点击提现</text>
      </view>
      <button class="btn-recharge" @click="handleRecharge">充值</button>
    </view>
    
    <!-- Coupons Section -->
    <view class="coupons-section">
      <view class="tabs">
        <text 
          class="tab" 
          :class="{ active: currentTab === 0 }" 
          @click="currentTab = 0"
        >未使用 ({{ unusedCoupons.length }})</text>
        <text 
          class="tab" 
          :class="{ active: currentTab === 1 }" 
          @click="currentTab = 1"
        >失效/已用</text>
      </view>
      
      <scroll-view scroll-y class="coupon-list">
        <view 
          class="coupon-card" 
          v-for="coupon in displayCoupons" 
          :key="coupon.id"
          :class="{ disabled: currentTab === 1 }"
        >
          <view class="left-part">
            <text class="symbol">¥</text>
            <text class="value">{{ coupon.value }}</text>
          </view>
          <view class="middle-part">
            <text class="name">{{ coupon.name }}</text>
            <text class="condition">{{ coupon.threshold > 0 ? `满${coupon.threshold}元可用` : '无门槛' }}</text>
            <text class="date">{{ formatDate(coupon.expiresAt) }} 到期</text>
          </view>
          <view class="right-part">
            <button 
              class="btn-use" 
              v-if="currentTab === 0"
              @click="handleUse(coupon)"
            >去使用</button>
            <text class="status-text" v-else>{{ coupon.status === 'USED' ? '已使用' : '已过期' }}</text>
          </view>
        </view>
        
        <view class="empty-state" v-if="displayCoupons.length === 0">
          <text class="text">暂无优惠券</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore, type Coupon } from '@/stores/user';

const userStore = useUserStore();
const currentTab = ref(0);

const unusedCoupons = computed(() => {
  return userStore.userInfo?.coupons?.filter(c => c.status === 'UNUSED' && c.expiresAt > Date.now()) || [];
});

const unavailableCoupons = computed(() => {
  return userStore.userInfo?.coupons?.filter(c => c.status !== 'UNUSED' || c.expiresAt <= Date.now()) || [];
});

const displayCoupons = computed(() => {
  return currentTab.value === 0 ? unusedCoupons.value : unavailableCoupons.value;
});

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
};

const handleRecharge = () => {
  uni.showActionSheet({
    itemList: ['50元', '100元', '200元', '500元', '1000元'],
    success: (res) => {
      const amounts = [50, 100, 200, 500, 1000];
      const amount = amounts[res.tapIndex];
      userStore.recharge(amount);
      uni.showToast({ title: `充值 ¥${amount} 成功`, icon: 'success' });
    },
    fail: (res) => {
      console.log(res.errMsg);
    }
  });
};

const handleWithdraw = () => {
  const balance = userStore.userInfo?.balance || 0;
  if (balance <= 0) {
    uni.showToast({ title: '余额不足', icon: 'none' });
    return;
  }
  
  uni.showModal({
    title: '申请提现',
    content: `当前可提现金额 ¥${balance.toFixed(2)}，确认全部提现？`,
    success: (res) => {
      if (res.confirm) {
        if (userStore.deductBalance(balance)) {
          uni.showToast({ title: '提现申请已提交', icon: 'success' });
        } else {
          uni.showToast({ title: '提现失败', icon: 'none' });
        }
      }
    }
  });
};

const handleUse = (coupon: Coupon) => {
  // Navigate to Publish with couponId
  uni.navigateTo({
    url: `/pages/publish/index?couponId=${coupon.id}`
  });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 20rpx;
}

.balance-card {
  background: linear-gradient(135deg, #FF8E3C 0%, #FF6B6B 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 20rpx rgba(255, 142, 60, 0.3);
  
  .balance-info {
    display: flex;
    flex-direction: column;
    
    .label {
      color: rgba(255,255,255,0.8);
      font-size: 26rpx;
      margin-bottom: 8rpx;
    }
    
    .amount {
      color: #fff;
      font-size: 60rpx;
      font-weight: bold;
    }
    
    .withdraw-hint {
      color: rgba(255,255,255,0.6);
      font-size: 22rpx;
      margin-top: 4rpx;
    }
  }
  
  .btn-recharge {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    color: #fff;
    font-size: 28rpx;
    border-radius: 30rpx;
    padding: 0 40rpx;
    height: 60rpx;
    line-height: 60rpx;
  }
}

.coupons-section {
  .tabs {
    display: flex;
    margin-bottom: 20rpx;
    
    .tab {
      margin-right: 40rpx;
      font-size: 30rpx;
      color: $color-text-secondary;
      padding-bottom: 8rpx;
      
      &.active {
        color: $color-text-main;
        font-weight: bold;
        border-bottom: 4rpx solid $color-primary;
      }
    }
  }
}

.coupon-list {
  height: calc(100vh - 400rpx);
  
  .coupon-card {
    background: #fff;
    border-radius: 16rpx;
    display: flex;
    margin-bottom: 20rpx;
    overflow: hidden;
    position: relative;
    
    &::before, &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 20rpx;
      height: 20rpx;
      background: $color-bg-page;
      border-radius: 50%;
      transform: translateY(-50%);
    }
    &::before { left: -10rpx; }
    &::after { right: -10rpx; }
    
    .left-part {
      width: 180rpx;
      background: linear-gradient(135deg, #FFF0E5 0%, #FFF 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: #FF8E3C;
      border-right: 1px dashed #eee;
      
      .symbol { font-size: 32rpx; margin-top: 10rpx; }
      .value { font-size: 64rpx; font-weight: bold; }
    }
    
    .middle-part {
      flex: 1;
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      .name { font-size: 30rpx; font-weight: bold; color: $color-text-main; margin-bottom: 8rpx; }
      .condition { font-size: 24rpx; color: #666; margin-bottom: 4rpx; }
      .date { font-size: 22rpx; color: #999; }
    }
    
    .right-part {
      width: 140rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      padding-right: 20rpx;
      
      .btn-use {
        background: $color-primary;
        color: #fff;
        font-size: 24rpx;
        padding: 0 20rpx;
        height: 50rpx;
        line-height: 50rpx;
        border-radius: 25rpx;
      }
      
      .status-text {
        font-size: 24rpx;
        color: #ccc;
      }
    }
    
    &.disabled {
      .left-part { color: #ccc; background: #f5f5f5; }
      .middle-part .name { color: #999; }
    }
  }
}

.empty-state {
  text-align: center;
  padding-top: 100rpx;
  color: #999;
}
</style>

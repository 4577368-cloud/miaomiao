<template>
  <view class="container">
    <!-- Header Card -->
    <view class="wallet-card" :class="{ 'sitter-card': !isOwner }">
      <view class="balance-info">
        <view class="balance-label">{{ isOwner ? '我的余额' : '可提现收益' }}</view>
        <view class="balance-amount">
            <text class="currency">¥</text>
            <text class="num">{{ balance.toFixed(2) }}</text>
        </view>
      </view>
      <view class="card-actions" v-if="!isOwner">
        <button class="btn-withdraw" @click="handleWithdraw">提现</button>
      </view>
      <view class="card-decoration" v-if="isOwner">
          <text class="points">积分: {{ userStore.userInfo?.points || 0 }}</text>
      </view>
    </view>

    <!-- Owner: Coupons -->
    <view class="section" v-if="isOwner">
      <view class="section-header">
        <text class="title">我的优惠券</text>
        <text class="more" @click="showToast('查看全部')">{{ coupons.length }} 张可用 ></text>
      </view>
      <scroll-view scroll-x class="coupon-scroll" show-scrollbar="false">
        <view class="coupon-list">
            <view class="coupon-item" v-for="coupon in coupons" :key="coupon.id">
            <view class="coupon-left">
                <text class="currency">¥</text>
                <text class="value">{{ coupon.value }}</text>
            </view>
            <view class="coupon-right">
                <text class="name">{{ coupon.name }}</text>
                <text class="desc">满{{ coupon.threshold }}可用</text>
            </view>
            </view>
        </view>
      </scroll-view>
    </view>

    <!-- Transaction List -->
    <view class="section list-section">
      <view class="section-header">
        <text class="title">{{ isOwner ? '消费记录' : '收益明细' }}</text>
      </view>
      <view class="transaction-list">
        <view class="trans-item" v-for="item in history" :key="item.id" @click="showTransactionDetail(item)">
          <view class="trans-icon">{{ isOwner ? '🛍️' : '💰' }}</view>
          <view class="trans-info">
            <text class="trans-title">{{ item.title }}</text>
            <text class="trans-date">{{ formatTime(item.time) }}</text>
          </view>
          <view class="trans-amount" :class="{ income: !isOwner }">
            {{ isOwner ? '-' : '+' }} {{ item.amount.toFixed(2) }}
          </view>
        </view>
        <view class="empty-list" v-if="history.length === 0">
            <image src="/static/empty-state.png" mode="aspectFit" class="empty-img" v-if="false"/>
            <text>暂无记录</text>
        </view>
      </view>
    </view>
    
    <view style="height: 100px;"></view>
    <CustomTabBar current-path="pages/wallet/index" />
  </view>
</template>

<script setup lang="ts">
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useOrderStore } from '@/stores/order';

const userStore = useUserStore();
const orderStore = useOrderStore();

const isOwner = computed(() => userStore.userInfo?.role === 'owner');
const balance = computed(() => isOwner.value ? (userStore.userInfo?.balance || 0) : (userStore.userInfo?.laborBalance || 0));
const coupons = computed(() => userStore.userInfo?.coupons?.filter(c => c.status === 'UNUSED') || []);

const history = computed(() => {
    const userId = userStore.userInfo?.id;
    if (!userId) return [];
    
    if (isOwner.value) {
        // Owner consumption: Paid orders
        return orderStore.orders
            .filter(o => o.creatorId === userId && (o.status !== 'UNPAID' && o.status !== 'CANCELLED'))
            .map(o => ({
                id: o.id,
                title: o.serviceType === 'FEEDING' ? '上门喂养服务' : '上门遛狗服务',
                time: o.createdAt,
                amount: o.totalPrice
            }));
    } else {
        // Sitter income: Completed orders
        return orderStore.orders
            .filter(o => o.sitterId === userId && o.status === 'COMPLETED')
            .map(o => ({
                id: o.id,
                title: '服务佣金收益',
                time: o.actualStartTime || o.createdAt, // approximation
                amount: o.totalPrice // Simplified: no commission deduction yet
            }));
    }
});

const formatTime = (time: number | string) => {
  const date = new Date(time);
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const handleWithdraw = () => {
    if (balance.value <= 0) {
        uni.showToast({ title: '暂无收益可提现', icon: 'none' });
        return;
    }
    uni.showModal({
        title: '申请提现',
        content: `确认提现 ¥${balance.value.toFixed(2)} 到绑定账户？`,
        success: (res) => {
            if (res.confirm) {
                // Sitter Withdraw
                if (userStore.withdrawLaborIncome(balance.value)) {
                    uni.showToast({ title: '提现申请已提交' });
                } else {
                    uni.showToast({ title: '提现失败', icon: 'none' });
                }
            }
        }
    });
};

const showTransactionDetail = (item: any) => {
    // 显示交易详情
    uni.showModal({
        title: '收益详情',
        content: `服务类型：${item.title}\n金额：¥${item.amount.toFixed(2)}\n时间：${formatTime(item.time)}`,
        showCancel: false,
        confirmText: '知道了'
    });
};

const showToast = (msg: string) => {
    uni.showToast({ title: msg, icon: 'none' });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 30rpx;
}

.wallet-card {
  background: linear-gradient(135deg, $color-primary, #ffb380);
  border-radius: $radius-lg;
  padding: 40rpx;
  color: #fff;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 20rpx rgba($color-primary, 0.2);
  position: relative;
  overflow: hidden;
  
  &.sitter-card {
      background: linear-gradient(135deg, $color-blue, #64b5f6);
      box-shadow: 0 10rpx 20rpx rgba($color-blue, 0.2);
  }

  .balance-label {
    font-size: 28rpx;
    opacity: 0.9;
    margin-bottom: 16rpx;
  }
  
  .balance-amount {
    display: flex;
    align-items: baseline;
    
    .currency {
      font-size: 32rpx;
      margin-right: 8rpx;
    }
    
    .num {
      font-size: 64rpx;
      font-weight: bold;
    }
  }
  
  .card-actions {
      position: absolute;
      right: 40rpx;
      top: 50%;
      transform: translateY(-50%);
      
      .btn-withdraw {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.4);
          color: #fff;
          font-size: 26rpx;
          border-radius: 30rpx;
          padding: 0 30rpx;
          height: 60rpx;
          line-height: 60rpx;
      }
  }
  
  .card-decoration {
      margin-top: 20rpx;
      padding-top: 20rpx;
      border-top: 1rpx solid rgba(255,255,255,0.2);
      font-size: 24rpx;
      opacity: 0.8;
  }
}

.section {
  margin-bottom: 40rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: 600;
      color: $color-text-main;
    }
    
    .more {
      font-size: 24rpx;
      color: $color-text-secondary;
    }
  }
}

.coupon-scroll {
  white-space: nowrap;
  width: 100%;
}

.coupon-list {
    display: flex;
    padding-bottom: 10rpx; /* scrollbar space */
}

.coupon-item {
  display: inline-flex;
  background: #fff;
  border-radius: 12rpx;
  width: 320rpx;
  height: 140rpx;
  margin-right: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 8rpx;
      background: $color-secondary;
  }
  
  .coupon-left {
    width: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-secondary;
    font-weight: bold;
    border-right: 1rpx dashed #eee;
    
    .currency { font-size: 24rpx; margin-top: 8rpx; }
    .value { font-size: 48rpx; }
  }
  
  .coupon-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 20rpx;
    
    .name {
      font-size: 28rpx;
      font-weight: 600;
      color: $color-text-main;
      margin-bottom: 8rpx;
    }
    
    .desc {
      font-size: 22rpx;
      color: $color-text-secondary;
    }
  }
}

.transaction-list {
  background: #fff;
  border-radius: $radius-md;
  padding: 0 20rpx;
  
  .trans-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child { border-bottom: none; }
    
    .trans-icon {
        width: 80rpx;
        height: 80rpx;
        background: #f9f9f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36rpx;
        margin-right: 20rpx;
    }
    
    .trans-info {
      flex: 1;
      
      .trans-title {
        display: block;
        font-size: 30rpx;
        color: $color-text-main;
        margin-bottom: 8rpx;
      }
      
      .trans-date {
        font-size: 24rpx;
        color: $color-text-secondary;
      }
    }
    
    .trans-amount {
      font-size: 32rpx;
      font-weight: 600;
      color: $color-text-main;
      
      &.income {
          color: $color-success; // Need to ensure variable exists or use hex
          color: #52c41a; 
      }
    }
  }
  
  .empty-list {
      padding: 60rpx 0;
      text-align: center;
      color: $color-text-secondary;
      font-size: 28rpx;
  }
}
</style>
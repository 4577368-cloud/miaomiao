<template>
  <view class="container">
    <view v-if="notifications.length === 0" class="empty">
      <text class="icon">📭</text>
      <text>暂无待处理消息</text>
    </view>
    <view class="msg-list" v-else>
       <view class="msg-card" v-for="msg in notifications" :key="msg.id">
          <view class="msg-header">
             <text class="title">{{ msg.title }}</text>
             <text class="time">刚刚</text>
          </view>
          <text class="content">{{ msg.content }}</text>
          <button class="btn primary small" v-if="msg.action" @click="msg.action">去处理</button>
       </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useOrderStore } from '@/stores/order';
import { useUserStore } from '@/stores/user';

const orderStore = useOrderStore();
const userStore = useUserStore();

const notifications = computed(() => {
    const msgs = [];
    const userId = userStore.userInfo?.id;
    
    if (!userId) return [];

    // Check pending reviews (Owner)
    if (userStore.userInfo?.role === 'owner') {
        const pendingReviews = orderStore.orders.filter(o => 
            o.creatorId === userId && o.status === 'COMPLETED'
        );
        
        pendingReviews.forEach(o => {
            msgs.push({
                id: 'review_' + o.id,
                title: '订单待评价',
                content: `您的订单 ${o.serviceType === 'FEEDING' ? '上门喂养' : '上门遛狗'} 已完成，请对宠托师进行评价`,
                action: () => uni.switchTab({ url: '/pages/orders/index' })
            });
        });
    }
    
    // Check new orders (Sitter - Mock)
    if (userStore.userInfo?.role === 'sitter') {
        const acceptedOrders = orderStore.orders.filter(o =>
            o.sitterId === userId && o.status === 'ACCEPTED'
        );
        acceptedOrders.forEach(o => {
             msgs.push({
                id: 'start_' + o.id,
                title: '即将开始服务',
                content: `您有一个预约 ${o.time} 的订单需要服务`,
                action: () => uni.switchTab({ url: '/pages/orders/index' })
             });
        });
    }
    
    return msgs;
});
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  min-height: 100vh;
  background-color: #FFFBF5;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  color: #999;
  .icon { font-size: 80rpx; margin-bottom: 20rpx; }
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.msg-card {
  background: #FFF;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  
  .msg-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
    .title { font-weight: bold; font-size: 30rpx; color: #333; }
    .time { font-size: 24rpx; color: #999; }
  }
  
  .content {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .btn {
    background: #FF8E3C;
    color: #FFF;
    font-size: 26rpx;
    border-radius: 30rpx;
    width: 160rpx;
    &.small { padding: 0 20rpx; height: 60rpx; line-height: 60rpx; }
  }
}
</style>
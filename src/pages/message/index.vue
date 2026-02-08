<template>
  <view class="container">
    <!-- Top Tabs -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'all' }"
        @click="currentTab = 'all'"
      >
        全部
        <view class="indicator" v-if="currentTab === 'all'"></view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'order' }"
        @click="currentTab = 'order'"
      >
        订单通知
        <view class="indicator" v-if="currentTab === 'order'"></view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'system' }"
        @click="currentTab = 'system'"
      >
        系统消息
        <view class="indicator" v-if="currentTab === 'system'"></view>
      </view>
    </view>

    <!-- Message List -->
    <scroll-view scroll-y class="msg-list" v-if="filteredNotifications.length > 0">
       <view 
         class="msg-card" 
         v-for="msg in filteredNotifications" 
         :key="msg.id"
         @click="handleMessageClick(msg)"
       >
          <view class="icon-box" :class="msg.type">
            <text class="icon" v-if="msg.type === 'order'">📦</text>
            <text class="icon" v-else-if="msg.type === 'system'">🔔</text>
            <text class="icon" v-else>💬</text>
          </view>
          
          <view class="content-box">
             <view class="header-row">
                <text class="title">{{ msg.title }}</text>
                <text class="time">{{ msg.time }}</text>
             </view>
             <text class="desc">{{ msg.content }}</text>
          </view>
       </view>
       <view class="footer-tip">没有更多消息了</view>
    </scroll-view>

    <!-- Empty State -->
    <view v-else class="empty-state">
      <image src="/static/empty-message.png" mode="aspectFit" class="empty-img" v-if="false" /> 
      <!-- Fallback icon if image doesn't exist -->
      <view class="empty-icon-box">
        <text class="icon">📭</text>
      </view>
      <text class="empty-text">暂无相关消息</text>
    </view>
    <view style="height: 50px;"></view>
    <CustomTabBar current-path="pages/message/index" />
  </view>
</template>

<script setup lang="ts">
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useOrderStore } from '@/stores/order';
import { useUserStore } from '@/stores/user';

const orderStore = useOrderStore();
const userStore = useUserStore();
const currentTab = ref('all');
const storedNotifications = ref<Notification[]>([]);

interface Notification {
  id: string;
  type: 'order' | 'system' | 'other';
  title: string;
  content: string;
  time: string;
  action?: () => void;
}

const notifications = computed<Notification[]>(() => {
    const msgs: Notification[] = [];
    const userId = userStore.userInfo?.id;
    
    // 1. Mock System Notifications (Always present for demo)
    msgs.push({
      id: 'sys_1',
      type: 'system',
      title: '新用户优惠券到账',
      content: '恭喜您获得“新用户首单立减”优惠券，快去使用吧！',
      time: '1小时前',
      action: () => uni.showToast({ title: '优惠券已在卡包中', icon: 'none' })
    });

    msgs.push({
      id: 'sys_2',
      type: 'system',
      title: '系统维护通知',
      content: '我们将于今晚 02:00 进行系统升级，预计耗时 30 分钟。',
      time: '昨天',
      action: () => {}
    });

    if (userStore.userInfo?.role === 'sitter' && userStore.userInfo?.sitterProfile) {
      const status = userStore.userInfo.sitterProfile.certificationStatus;
      if (status === 'pending') {
        msgs.unshift({
          id: 'cert_pending',
          type: 'system',
          title: '认证已提交，审核中',
          content: '工作人员会在1个工作日内完成审核',
          time: '刚刚'
        });
      }
    }
    if (!userId) return msgs;
    
    if (storedNotifications.value.length > 0) {
      msgs.unshift(...storedNotifications.value);
    }

    // 2. Order Notifications (Owner)
    if (userStore.userInfo?.role === 'owner') {
        // Pending Reviews
        const pendingReviews = orderStore.orders.filter(o => 
            o.creatorId === userId && o.status === 'COMPLETED'
        );
        pendingReviews.forEach(o => {
            msgs.unshift({ // Add to top
                id: 'review_' + o.id,
                type: 'order',
                title: '订单待评价',
                content: `您的订单 ${o.serviceType === 'FEEDING' ? '上门喂养' : '上门遛狗'} 已完成，请对宠托师进行评价`,
                time: '刚刚',
                action: () => uni.switchTab({ url: '/pages/orders/index' })
            });
        });
        
        // Accepted Orders
        const acceptedOrders = orderStore.orders.filter(o => 
            o.creatorId === userId && o.status === 'ACCEPTED'
        );
        acceptedOrders.forEach(o => {
            msgs.unshift({
                id: 'accepted_' + o.id,
                type: 'order',
                title: '宠托师已接单',
                content: `您的订单已被接单，宠托师将准时为您服务。`,
                time: '刚刚',
                action: () => uni.switchTab({ url: '/pages/orders/index' })
            });
        });
    }
    
    // 3. Order Notifications (Sitter)
    if (userStore.userInfo?.role === 'sitter') {
        const acceptedOrders = orderStore.orders.filter(o =>
            o.sitterId === userId && o.status === 'ACCEPTED'
        );
        acceptedOrders.forEach(o => {
             msgs.unshift({
                id: 'start_' + o.id,
                type: 'order',
                title: '即将开始服务',
                content: `您有一个预约 ${o.time} 的订单需要服务，请准时到达。`,
                time: '10分钟前',
                action: () => uni.switchTab({ url: '/pages/orders/index' })
             });
        });
    }
    
    return msgs;
});

onShow(async () => {
  const userId = userStore.userInfo?.id;
  if (!userId) {
    storedNotifications.value = [];
    return;
  }
  await userStore.fetchProfile(userId, userStore.userInfo?.email);
  const list = (uni.getStorageSync(`miaomiao_notifications_${userId}`) || []) as Notification[];
  storedNotifications.value = list;
});

const filteredNotifications = computed(() => {
  if (currentTab.value === 'all') return notifications.value;
  return notifications.value.filter(msg => msg.type === currentTab.value);
});

const handleMessageClick = (msg: Notification) => {
  if (msg.action) {
    msg.action();
  } else {
    // Default action (expand or show detail)
    // For now, just show toast if no specific action
  }
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 30rpx;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 30rpx 0;
    font-size: 28rpx;
    color: $color-text-secondary;
    position: relative;
    transition: all 0.3s;
    
    &.active {
      color: $color-text-main;
      font-weight: bold;
      font-size: 30rpx;
    }
    
    .indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      background: $color-primary;
      border-radius: 3rpx;
    }
  }
}

.msg-list {
  flex: 1;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.msg-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: flex-start;
  box-shadow: $shadow-sm;
  
  &:active {
    background: #f9f9f9;
  }
  
  .icon-box {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    flex-shrink: 0;
    
    .icon { font-size: 40rpx; }
    
    &.order { background: rgba($color-primary, 0.1); }
    &.system { background: rgba($color-secondary, 0.2); }
    &.other { background: #f5f5f5; }
  }
  
  .content-box {
    flex: 1;
    
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;
      
      .title {
        font-size: 30rpx;
        font-weight: bold;
        color: $color-text-main;
      }
      
      .time {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .desc {
      font-size: 26rpx;
      color: $color-text-secondary;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
  }
}

.footer-tip {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  padding: 30rpx 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 200rpx;
  
  .empty-icon-box {
    width: 160rpx;
    height: 160rpx;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    box-shadow: $shadow-sm;
    
    .icon { font-size: 80rpx; }
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $color-text-secondary;
  }
}
</style>

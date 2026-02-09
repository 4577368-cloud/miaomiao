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
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'announcement' }"
        @click="currentTab = 'announcement'"
      >
        系统公告
        <view class="indicator" v-if="currentTab === 'announcement'"></view>
      </view>
    </view>
    <view class="actions">
      <button class="action-btn" @click="markAllRead" v-if="notifications.some(n => !n.read)">全部已读</button>
      <button class="action-btn danger" @click="clearAll" v-if="notifications.length > 0">清空</button>
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
            <image class="icon" v-else-if="msg.type === 'announcement'" src="/static/logo.png" mode="aspectFit" />
            <image class="icon" v-else src="/static/logo.png" mode="aspectFit" />
            <view class="unread-dot" v-if="!msg.read"></view>
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
import { onShow, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/utils/supabase';

const userStore = useUserStore();
const currentTab = ref('all');
const storedNotifications = ref<any[]>([]);
let realtimeChannel: any = null;
let notificationChannel: any = null;
let announcementChannel: any = null;

const notifications = computed<any[]>(() => {
    const userId = userStore.userInfo?.id;
    if (!userId) return [];
    return storedNotifications.value || [];
});

onShow(async () => {
  const userId = userStore.userInfo?.id;
  if (!userId) {
    storedNotifications.value = [];
    return;
  }
  await userStore.fetchProfile(userId, userStore.userInfo?.email);
  await userStore.syncNotifications();
  await userStore.syncAnnouncements();
  storedNotifications.value = userStore.getNotifications(userId);
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel);
    notificationChannel = null;
  }
  if (announcementChannel) {
    supabase.removeChannel(announcementChannel);
    announcementChannel = null;
  }
  const role = userStore.userInfo?.role;
  if (role === 'sitter') {
    realtimeChannel = supabase.channel(`sitter_profiles_${userId}`).on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sitter_profiles', filter: `user_id=eq.${userId}` },
      (payload: any) => {
        const next = payload?.new || {};
        const status = next.certification_status as string | undefined;
        const validStatuses = ['none', 'pending', 'verified', 'rejected'] as const;
        if (!status || !validStatuses.includes(status as any)) return;
        const statusKey = `miaomiao_cert_status_${userId}`;
        const prevStatus = uni.getStorageSync(statusKey);
        if (status === prevStatus) return;
        if (status === 'verified' || status === 'rejected') {
          const title = status === 'verified' ? '宠托师认证通过' : '宠托师认证未通过';
          const content = status === 'verified'
            ? '您的实名认证已通过审核，可以开始接单了'
            : `很遗憾，您的认证未通过${next.certification_reject_reason ? '，原因：' + next.certification_reject_reason : ''}`;
          userStore.addNotification({
            id: `cert_${status}_${Date.now()}`,
            type: 'system',
            title,
            content,
            time: new Date().toLocaleString(),
            link: '/pages/profile/certification'
          });
          storedNotifications.value = userStore.getNotifications(userId);
        }
        if (userStore.userInfo?.sitterProfile) {
          userStore.userInfo.sitterProfile.certificationStatus = status as typeof validStatuses[number];
          userStore.userInfo.sitterProfile.isCertified = status === 'verified';
          userStore.userInfo.sitterProfile.certificationRejectReason = next.certification_reject_reason || '';
          userStore.userInfo.sitterProfile.certificationReviewedAt = next.certification_reviewed_at ? new Date(next.certification_reviewed_at).getTime() : undefined;
          uni.setStorageSync('miaomiao_user', JSON.stringify(userStore.userInfo));
        }
        uni.setStorageSync(statusKey, status);
      }
    ).subscribe();
  }

  notificationChannel = supabase.channel(`notifications_${userId}`).on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    (payload: any) => {
      const eventType = payload?.eventType;
      if (eventType === 'DELETE') {
        const oldRow = payload?.old || {};
        if (oldRow?.id) {
          userStore.removeNotificationById(oldRow.id);
        }
      } else {
        const row = payload?.new || {};
        userStore.upsertNotificationFromDb(row);
      }
      storedNotifications.value = userStore.getNotifications(userId);
    }
  ).subscribe();

  announcementChannel = supabase.channel('announcements').on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'announcements' },
    async () => {
      await userStore.syncAnnouncements();
      storedNotifications.value = userStore.getNotifications(userId);
    }
  ).subscribe();
});

onUnload(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel);
    notificationChannel = null;
  }
  if (announcementChannel) {
    supabase.removeChannel(announcementChannel);
    announcementChannel = null;
  }
});

const filteredNotifications = computed(() => {
  if (currentTab.value === 'all') return notifications.value;
  return notifications.value.filter(msg => msg.type === currentTab.value);
});

const openLink = (link?: string) => {
  if (!link) return;
  const tabPages = ['/pages/home/index', '/pages/orders/index', '/pages/profile/index', '/pages/message/index', '/pages/wallet/index'];
  if (tabPages.includes(link)) {
    uni.switchTab({ url: link });
  } else {
    uni.navigateTo({ url: link });
  }
};

const handleMessageClick = (msg: any) => {
  if (msg?.id) {
    userStore.markNotificationRead(msg.id);
    const userId = userStore.userInfo?.id;
    if (userId) storedNotifications.value = userStore.getNotifications(userId);
  }
  if (msg?.link) openLink(msg.link);
};

const markAllRead = () => {
  const ids = notifications.value.filter(n => !n.read).map(n => n.id);
  userStore.markNotificationsRead(ids);
  const userId = userStore.userInfo?.id;
  if (userId) storedNotifications.value = userStore.getNotifications(userId);
};

const clearAll = () => {
  userStore.clearNotifications();
  const userId = userStore.userInfo?.id;
  if (userId) storedNotifications.value = userStore.getNotifications(userId);
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

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  background: #fff;
  padding: 10rpx 30rpx 20rpx;
}
.action-btn {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #fff;
  background: $color-primary;
}
.action-btn.danger {
  background: #ff4d4f;
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
    
    .icon { 
      width: 40rpx; 
      height: 40rpx; 
      font-size: 40rpx; 
    }
    position: relative;
    .unread-dot {
      position: absolute;
      right: 6rpx;
      top: 6rpx;
      width: 14rpx;
      height: 14rpx;
      border-radius: 50%;
      background: #ff4d4f;
      box-shadow: 0 0 0 2rpx rgba(255, 77, 79, 0.2);
    }
    
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
      line-clamp: 2;
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

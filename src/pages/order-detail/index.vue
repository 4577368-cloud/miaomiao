<template>
  <view class="container" v-if="order">
    <!-- 状态栏 -->
    <view class="status-header">
      <view class="status-left">
        <text class="status-text">{{ formatStatus(order.status) }}</text>
        <text class="status-desc" v-if="order.status === 'IN_SERVICE'">正在用心服务中</text>
        <text class="status-desc" v-if="order.status === 'PENDING'">等待接单中</text>
        <text class="status-desc" v-if="order.status === 'COMPLETED'">服务已完成</text>
      </view>
      <view class="status-right" v-if="countdown">
        <text class="countdown">{{ countdown }}</text>
        <text class="countdown-label">剩余服务时间</text>
      </view>
    </view>

    <!-- 联系人卡片 -->
    <view class="card contact-card">
      <view class="card-header">
        <text class="title">{{ isOwner ? '接单宠托师' : '发布人信息' }}</text>
      </view>
      <view class="contact-content" v-if="targetUser">
        <view class="avatar">{{ targetUser.nickname[0] }}</view>
        <view class="info">
          <text class="name">{{ targetUser.nickname }}</text>
          <text class="role-tag">{{ isOwner ? '宠托师' : '铲屎官' }}</text>
        </view>
        <view class="actions">
          <view class="action-btn call" @click="makeCall">
            <text class="icon">📞</text>
            <text>拨打电话</text>
          </view>
        </view>
      </view>
      <view class="empty-contact" v-else>
        <text>{{ isOwner ? '暂无宠托师接单' : '用户信息加载中...' }}</text>
      </view>
    </view>

    <!-- 宠物信息 -->
    <view class="card pet-card">
      <view class="card-header">
        <text class="title">爱宠档案</text>
      </view>
      <view class="pet-content">
        <image 
          v-if="order.petSnapshot?.image" 
          :src="order.petSnapshot.image" 
          mode="aspectFill" 
          class="pet-image"
        />
        <view class="pet-avatar-placeholder" v-else>
          {{ order.petName?.[0] || '宠' }}
        </view>
        
        <view class="pet-details">
          <view class="pet-main">
            <text class="pet-name">{{ order.petName }}</text>
            <text class="pet-gender">{{ order.petGender === 'male' ? '弟弟' : '妹妹' }}</text>
          </view>
          <view class="pet-tags">
            <text class="tag">{{ order.petBreed }}</text>
            <text class="tag">{{ order.petAge }}岁</text>
            <text class="tag">{{ formatPetSize(order.petSize) }}</text>
            <text class="tag highlight" v-if="order.petSnapshot?.isSterilized">已绝育</text>
            <text class="tag highlight" v-if="order.petSnapshot?.isVaccinated">已疫苗</text>
          </view>
          <view class="pet-remark" v-if="order.petSnapshot?.temperament">
            <text class="label">性格特点：</text>
            <text class="text">{{ order.petSnapshot.temperament }}</text>
          </view>
           <view class="pet-remark" v-if="order.remark">
            <text class="label">订单备注：</text>
            <text class="text">{{ order.remark }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 服务内容 -->
    <view class="card service-card">
      <view class="card-header">
        <text class="title">服务内容</text>
      </view>
      <view class="service-list">
        <view class="service-item main">
          <text class="icon">🏷️</text>
          <text class="name">{{ formatServiceType(order.serviceType) }}</text>
          <text class="desc">基础服务 ({{ order.duration }}分钟)</text>
        </view>
        <view class="service-item" v-if="order.addOns?.play">
          <text class="icon">🎾</text>
          <text class="name">陪玩</text>
        </view>
        <view class="service-item" v-if="order.addOns?.deepClean">
          <text class="icon">🧹</text>
          <text class="name">深度清洁</text>
        </view>
        <view class="service-item" v-if="order.addOns?.medicine">
          <text class="icon">💊</text>
          <text class="name">喂药</text>
        </view>
        <view class="service-item">
          <text class="icon">📸</text>
          <text class="name">拍照反馈</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card info-card">
      <view class="info-row">
        <text class="label">订单编号</text>
        <text class="value">{{ order.id }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务时间</text>
        <text class="value">{{ formatTime(order.time) }}</text>
      </view>
      <view class="info-row">
        <text class="label">服务地址</text>
        <text class="value">{{ order.address }}</text>
      </view>
      <view class="info-row price-row">
        <text class="label">订单金额</text>
        <text class="price">¥{{ order.totalPrice.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 底部操作栏 (Placeholder for consistency) -->
    <!-- 实际操作逻辑较复杂，暂时只展示核心信息，或者复用列表页的操作逻辑 -->
  </view>
  <view v-else class="loading">
    <text>加载中...</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useOrderStore, type Order } from '@/stores/order';
import { useUserStore } from '@/stores/user';
import { ServiceType, PetSize } from '@/constants/pet';

const orderStore = useOrderStore();
const userStore = useUserStore();
const order = ref<Order | null>(null);
const timer = ref<number | null>(null);
const countdown = ref('');

const isOwner = computed(() => userStore.userInfo?.role === 'owner');

const targetUser = computed(() => {
  if (!order.value) return null;
  if (isOwner.value) {
    return order.value.sitterSnapshot || (order.value.sitterId ? { nickname: '接单宠托师', id: order.value.sitterId } : null);
  } else {
    // Sitter view: target is owner (creator)
    // In a real app, we would fetch creator info. 
    // Here we might fallback to contact info in order.
    return {
      nickname: order.value.contactName,
      phone: order.value.contactPhone,
      id: order.value.creatorId
    };
  }
});

onLoad((options) => {
  if (options && options.id) {
    const found = orderStore.orders.find(o => o.id === options.id);
    if (found) {
      order.value = found;
      startTimer();
    } else {
      uni.showToast({ title: '订单不存在', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 1500);
    }
  }
});

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
});

const startTimer = () => {
  if (order.value?.status === 'IN_SERVICE' && order.value.actualStartTime) {
    timer.value = setInterval(() => {
        if (!order.value || !order.value.actualStartTime) return;
        const now = Date.now();
        const elapsed = now - order.value.actualStartTime;
        const totalDuration = order.value.duration * 60 * 1000;
        const remaining = totalDuration - elapsed;
        
        if (remaining > 0) {
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            countdown.value = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
            countdown.value = '00:00';
        }
    }, 1000);
  }
};

const makeCall = () => {
  const phone = isOwner.value 
    ? order.value?.sitterSnapshot?.phone 
    : order.value?.contactPhone;
    
  if (phone) {
    uni.makePhoneCall({ phoneNumber: phone });
  } else {
    uni.showToast({ title: '暂无联系方式', icon: 'none' });
  }
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': '待接单',
    'PENDING_ACCEPTANCE': '待确认',
    'ACCEPTED': '待服务',
    'IN_SERVICE': '服务中',
    'COMPLETED': '待评价',
    'REVIEWED': '已完成',
    'CANCELLED': '已取消'
  };
  return map[status] || status;
};

const formatServiceType = (type: ServiceType) => {
  return type === ServiceType.FEEDING ? '上门喂养' : '上门遛狗';
};

const formatPetSize = (size: PetSize) => {
  const map: Record<string, string> = {
    [PetSize.SMALL]: '小型',
    [PetSize.MEDIUM]: '中型',
    [PetSize.LARGE]: '大型',
    [PetSize.GIANT]: '巨型',
    [PetSize.CAT]: '猫咪'
  };
  return map[size] || size;
};

const formatTime = (time: number | string) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
};

</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 30rpx;
  padding-bottom: 120rpx;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  
  .status-left {
    .status-text {
      font-size: 40rpx;
      font-weight: bold;
      color: $color-text-main;
      display: block;
    }
    .status-desc {
      font-size: 24rpx;
      color: $color-text-secondary;
      margin-top: 8rpx;
    }
  }
  
  .status-right {
    text-align: right;
    .countdown {
      font-size: 40rpx;
      font-weight: bold;
      color: $color-primary;
      display: block;
      font-family: monospace;
    }
    .countdown-label {
      font-size: 22rpx;
      color: $color-text-secondary;
    }
  }
}

.card {
  background: #fff;
  border-radius: $radius-md;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-sm;
  
  .card-header {
    margin-bottom: 24rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    .title {
      font-size: 30rpx;
      font-weight: 600;
      color: $color-text-main;
    }
  }
}

.contact-content {
  display: flex;
  align-items: center;
  
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: $color-secondary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    margin-right: 24rpx;
  }
  
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .name {
      font-size: 32rpx;
      font-weight: 600;
      color: $color-text-main;
      margin-bottom: 8rpx;
    }
    
    .role-tag {
      font-size: 22rpx;
      color: $color-primary;
      background: $color-primary-light;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      align-self: flex-start;
    }
  }
  
  .actions {
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #f0f9ff;
      padding: 16rpx 24rpx;
      border-radius: 16rpx;
      color: $color-blue;
      
      .icon { font-size: 32rpx; margin-bottom: 4rpx; }
      text { font-size: 20rpx; font-weight: 500; }
      
      &:active { opacity: 0.8; }
    }
  }
}

.pet-content {
  display: flex;
  
  .pet-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 16rpx;
    margin-right: 24rpx;
    background: #f5f5f5;
  }
  
  .pet-avatar-placeholder {
    width: 160rpx;
    height: 160rpx;
    border-radius: 16rpx;
    margin-right: 24rpx;
    background: $color-secondary;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60rpx;
  }
  
  .pet-details {
    flex: 1;
    
    .pet-main {
      margin-bottom: 12rpx;
      .pet-name { font-size: 32rpx; font-weight: 600; color: $color-text-main; margin-right: 12rpx; }
      .pet-gender { font-size: 24rpx; color: $color-text-secondary; }
    }
    
    .pet-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 16rpx;
      
      .tag {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        background: #f5f5f5;
        color: $color-text-secondary;
        border-radius: 8rpx;
        
        &.highlight {
          background: #fff7e6;
          color: #fa8c16;
        }
      }
    }
    
    .pet-remark {
      display: flex;
      font-size: 24rpx;
      line-height: 1.4;
      margin-top: 8rpx;
      
      .label { color: $color-text-secondary; flex-shrink: 0; }
      .text { color: $color-text-main; }
    }
  }
}

.service-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .service-item {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    
    .icon { margin-right: 12rpx; font-size: 32rpx; }
    .name { font-size: 26rpx; color: $color-text-main; }
    .desc { font-size: 22rpx; color: $color-text-secondary; margin-left: 8rpx; }
    
    &.main {
      background: $color-primary-light;
      .name { color: $color-primary; font-weight: 500; }
    }
  }
}

.info-card {
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 16rpx 0;
    font-size: 26rpx;
    
    .label { color: $color-text-secondary; }
    .value { color: $color-text-main; text-align: right; max-width: 70%; }
    
    &.price-row {
      border-top: 1rpx dashed #eee;
      margin-top: 16rpx;
      padding-top: 24rpx;
      
      .label { font-size: 28rpx; font-weight: 500; }
      .price { font-size: 36rpx; color: $color-price; font-weight: bold; }
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
  padding-top: 100rpx;
  color: $color-text-secondary;
}
</style>
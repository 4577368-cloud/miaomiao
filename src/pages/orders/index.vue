<template>
  <view class="container">
    <!-- 顶部固定 Tabs -->
    <view class="tabs-wrapper">
      <view class="tabs">
        <view 
          v-for="(tab, index) in currentTabs" 
          :key="index"
          class="tab-item"
          :class="{ active: currentTab === index }"
          @click="currentTab = index"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view class="tab-line" v-if="currentTab === index"></view>
        </view>
      </view>
    </view>
    
    <!-- 订单列表 -->
    <view class="order-list">
      <view v-if="filteredOrders.length > 0" class="list-content">
        <view class="order-card" v-for="order in filteredOrders" :key="order.id" @click="goToDetail(order.id)">
          <!-- 卡片头部：状态与服务类型 -->
          <view class="card-header">
            <view class="service-info">
              <view class="service-badge" :class="order.serviceType">
                {{ formatServiceType(order.serviceType) }}
              </view>
              <text class="order-id">#{{ order.id.slice(-6) }}</text>
            </view>
            <view class="status-badge" :class="order.status.toLowerCase()">
              {{ formatStatus(order.status) }}
            </view>
          </view>
          
          <!-- 接单人信息 (仅当有人接单时显示) -->
          <view class="sitter-info-bar" v-if="order.sitterId && order.status !== 'PENDING'" @click.stop="showSitterProfile(order)">
            <view class="sitter-left">
              <view class="avatar-placeholder">{{ getSitterName(order)[0] }}</view>
              <view class="sitter-details">
                <view class="name-row">
                  <text class="name">{{ getSitterName(order) }}</text>
                  <view class="level-badge" :class="getSitterLevelClass(order)">{{ getSitterLevelText(order) }}</view>
                </view>
                <text class="sub-text">点击查看详情</text>
              </view>
            </view>
            <text class="arrow">></text>
          </view>

          <!-- 卡片内容：核心信息 -->
          <view class="card-body">
            <!-- 1. 宠物信息 -->
            <view class="info-section pet-section" v-if="order.petName">
              <view class="pet-header-row">
                 <text class="pet-name">{{ order.petName }}</text>
                 <text class="pet-breed">{{ order.petBreed }}</text>
                 <view class="pet-tags" v-if="order.petSnapshot">
                    <text class="tag" v-if="order.petSnapshot.sterilized">已绝育</text>
                    <text class="tag" v-if="order.petSnapshot.vaccine">已免疫</text>
                 </view>
              </view>
              <view class="pet-details-row">
                 <text>{{ order.petGender === 'male' ? '弟弟' : '妹妹' }}</text>
                 <text class="divider">|</text>
                 <text>{{ order.petAge }}岁</text>
                 <text class="divider">|</text>
                 <text>{{ order.petWeight }}kg</text>
              </view>
              <view class="pet-pref-row" v-if="order.petSnapshot?.description">
                 <text class="label">偏好：</text>
                 <text class="val">{{ order.petSnapshot.description }}</text>
              </view>
            </view>
            
            <!-- 2. 服务信息 -->
            <view class="info-section service-section">
               <!-- 基础服务内容 -->
               <view class="info-row content-row">
                  <text class="icon">📋</text>
                  <view class="content-list">
                     <text class="content-label">包含服务：</text>
                     <view class="content-tags">
                        <text class="content-tag" v-for="item in getServiceItems(order.serviceType)" :key="item">{{ item }}</text>
                     </view>
                  </view>
               </view>

               <view class="info-row">
                  <text class="icon">🕒</text>
                  <text class="text highlight">{{ order.time }}</text>
                  <text class="sub-text">({{ order.duration }}分钟)</text>
               </view>
               <view class="info-row">
                  <text class="icon">📍</text>
                  <text class="text address">{{ order.address }}</text>
               </view>
               <!-- Add-ons -->
               <view class="info-row" v-if="hasAddOns(order.addOns)">
                  <text class="icon">✨</text>
                  <view class="addons-list">
                     <text class="content-label">附加服务：</text>
                     <view class="addons-tags">
                        <text class="addon-tag" v-if="order.addOns.play">陪玩</text>
                        <text class="addon-tag" v-if="order.addOns.deepClean">深度清洁</text>
                        <text class="addon-tag" v-if="order.addOns.medicine">喂药</text>
                     </view>
                  </view>
               </view>
            </view>

            <!-- 3. 联系人信息 (仅接单后可见) -->
            <view class="info-section contact-section" v-if="!isOwner && ['ACCEPTED', 'IN_SERVICE'].includes(order.status) && order.contactPhone">
                <view class="contact-box">
                    <view class="contact-left">
                        <text class="label">联系人</text>
                        <view class="person">
                            <text class="name">{{ order.contactName }}</text>
                            <text class="phone-link" @click.stop="makeCall(order.contactPhone)">{{ order.contactPhone }}</text>
                        </view>
                    </view>
                    <view class="call-btn" @click.stop="makeCall(order.contactPhone)">
                        <text class="icon">📞</text>
                        <text>拨打</text>
                    </view>
                </view>
            </view>
            
            <view class="info-section evidence-section" v-if="order.serviceEvidence">
               <text class="section-label">服务实拍</text>
               <view class="evidence-photos">
                  <image v-for="(photo, idx) in order.serviceEvidence.photos" :key="idx" :src="photo" class="evidence-img" mode="aspectFill" @click.stop="previewImage(order.serviceEvidence.photos, idx)"></image>
               </view>
            </view>
          </view>
          
          <!-- 分割线 -->
          <view class="card-divider"></view>
          
          <!-- 卡片底部：价格与操作 -->
          <view class="card-footer">
            <view class="price-box">
              <text class="label">实付</text>
              <text class="symbol">¥</text>
              <text class="amount">{{ order.totalPrice }}</text>
            </view>
            <view class="action-box">
              <!-- 铲屎官视角 -->
              <template v-if="isOwner">
                <button class="btn ghost" v-if="order.status === 'PENDING'" @click.stop="handleCancel(order)">取消</button>
                <button class="btn primary" v-if="order.status === 'UNPAID'" @click.stop="handlePay(order)">去支付</button>
                <button class="btn primary" v-if="order.status === 'ACCEPTED'" @click.stop="handleConfirmStart(order)">确认开始</button>
                <button class="btn primary" v-if="order.status === 'IN_SERVICE'" @click.stop="handleConfirmComplete(order)">确认完成</button>
                <button class="btn primary" v-if="order.status === 'COMPLETED'" @click.stop="handleReview(order)">评价</button>
                <button class="btn ghost" v-if="['COMPLETED', 'REVIEWED'].includes(order.status)" @click.stop="handleReorder(order)">再来一单</button>
              </template>
              
              <!-- 宠托师视角 -->
              <template v-else>
                <button class="btn primary" v-if="order.status === 'ACCEPTED'" @click.stop="handleStartService(order)">开始服务</button>
                <button class="btn primary" v-if="order.status === 'IN_SERVICE'" @click.stop="handleCompleteService(order)">完成服务</button>
                <button class="btn ghost" v-if="order.status === 'COMPLETED'" @click.stop="handleInviteReview(order)">邀请评价</button>
              </template>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <view class="empty-icon">📦</view>
        <text class="empty-text">暂无相关订单</text>
        <button class="btn-publish" @click="goToPublish" v-if="isOwner">去发布任务</button>
        <button class="btn-publish" @click="goToHall" v-else>去接单</button>
      </view>
    </view>

    <!-- 宠托师详情弹窗 -->
    <view class="modal-overlay" v-if="showModal" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="title">宠托师档案</text>
          <text class="close" @click="closeModal">×</text>
        </view>
        <view class="sitter-profile" v-if="currentSitter">
          <view class="profile-header">
            <view class="avatar-lg">{{ currentSitter.nickname[0] }}</view>
            <view class="profile-main">
              <text class="name">{{ currentSitter.nickname }}</text>
              <view class="badges">
                <view class="level-badge" :class="getModalLevelClass()">{{ getModalLevelText() }}</view>
                <view class="verify-badge">实名认证</view>
              </view>
            </view>
          </view>
          
          <view class="stats-row">
            <view class="stat-item">
              <text class="num">{{ currentSitter.sitterProfile?.completedOrders || 0 }}</text>
              <text class="label">已完成</text>
            </view>
            <view class="stat-item">
              <text class="num">{{ currentSitter.sitterProfile?.rating || 5.0 }}</text>
              <text class="label">评分</text>
            </view>
            <view class="stat-item">
              <text class="num">{{ currentSitter.sitterProfile?.experienceYears || 1 }}年</text>
              <text class="label">经验</text>
            </view>
          </view>

          <view class="section">
            <text class="section-title">个人简介</text>
            <text class="bio">{{ currentSitter.sitterProfile?.bio || '这位宠托师很懒，还没写简介~' }}</text>
          </view>

          <view class="section">
            <text class="section-title">专业技能</text>
            <view class="tags">
              <text class="tag" v-for="tag in (currentSitter.sitterProfile?.tags || ['擅长撸猫', '狗狗陪玩'])" :key="tag">{{ tag }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 完成服务弹窗 -->
    <view class="modal-overlay" v-if="showCompleteModal" @click="closeCompleteModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="title">完成服务确认</text>
          <text class="close" @click="closeCompleteModal">×</text>
        </view>
        <view class="complete-form">
           <view class="form-item">
             <text class="label">服务内容确认</text>
             <checkbox-group @change="handleTaskChange">
                <label class="checkbox-item"><checkbox value="feed" checked /> 喂食/换水</label>
                <label class="checkbox-item"><checkbox value="clean" checked /> 清理排泄物</label>
                <label class="checkbox-item" v-if="processingOrder?.addOns?.play"><checkbox value="play" checked /> 陪玩</label>
             </checkbox-group>
           </view>
           <view class="form-item">
             <text class="label">上传现场照片</text>
             <view class="photo-uploader">
               <view class="photo-item" v-for="(p, i) in tempPhotos" :key="i">
                 <image :src="p" mode="aspectFill" />
               </view>
               <view class="add-btn" @click="choosePhoto">+</view>
             </view>
           </view>
           <button class="btn primary block" @click="submitComplete">确认提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useOrderStore, type Order } from '@/stores/order';
import { useUserStore, type UserInfo } from '@/stores/user';
import { ServiceType, PetSize } from '@/constants/pet';

const orderStore = useOrderStore();
const userStore = useUserStore();
const currentTab = ref(0);
const showModal = ref(false);
const showCompleteModal = ref(false);
const currentSitter = ref<UserInfo | null>(null);
const processingOrder = ref<Order | null>(null);
const tempPhotos = ref<string[]>([]);
const tempTasks = ref<string[]>(['feed', 'clean']);

const isOwner = computed(() => userStore.userInfo?.role === 'owner');

const currentTabs = computed(() => {
  if (isOwner.value) {
    return [
      { label: '全部', value: 'ALL' },
      { label: '待接单', value: 'PENDING' },
      { label: '待服务', value: 'ACCEPTED' },
      { label: '服务中', value: 'IN_SERVICE' },
      { label: '待评价', value: 'COMPLETED' }
    ];
  } else {
    return [
      { label: '全部', value: 'ALL' },
      { label: '待服务', value: 'ACCEPTED' },
      { label: '服务中', value: 'IN_SERVICE' },
      { label: '已完成', value: 'COMPLETED' }
    ];
  }
});

onShow(() => {
  orderStore.loadOrders();
});

const filteredOrders = computed(() => {
  let all = orderStore.orders;
  
  // 1. 身份过滤
  if (isOwner.value) {
    all = all.filter(o => o.creatorId === userStore.userInfo?.id);
  } else if (userStore.userInfo?.role === 'sitter') {
    all = all.filter(o => o.sitterId === userStore.userInfo?.id);
  } else {
    return [];
  }

  // 2. 状态过滤
  const tab = currentTabs.value[currentTab.value];
  if (tab.value === 'ALL') return all;
  
  // 特殊处理：待服务包含了 ACCEPTED
  // 特殊处理：已完成包含了 COMPLETED 和 REVIEWED
  if (tab.value === 'COMPLETED') {
    return all.filter(o => ['COMPLETED', 'REVIEWED'].includes(o.status));
  }
  
  return all.filter(o => o.status === tab.value);
});

const formatServiceType = (type: ServiceType) => {
  return type === ServiceType.FEEDING ? '上门喂养' : '上门遛狗';
};

const getServiceItems = (type: ServiceType) => {
  if (type === ServiceType.FEEDING) {
    return ['喂食', '换水', '铲屎', '拍摄反馈'];
  }
  return ['遛狗', '陪玩', '清洁', '拍摄反馈'];
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

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': '待接单',
    'ACCEPTED': '待服务',
    'IN_SERVICE': '服务中',
    'COMPLETED': '待评价',
    'REVIEWED': '已完成',
    'CANCELLED': '已取消'
  };
  return map[status] || status;
};

const hasAddOns = (addOns: Order['addOns']) => {
  return addOns && (addOns.play || addOns.deepClean || addOns.medicine);
};

// --- Actions ---

const goToPublish = () => {
  uni.switchTab({ url: '/pages/home/index' });
};

const goToHall = () => {
  uni.switchTab({ url: '/pages/home/index' });
};

const goToDetail = (id: string) => {
  // uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` });
  console.log('Go to detail', id);
};

// --- Sitter Data & Logic ---

const getSitterName = (order: Order) => {
  return order.sitterSnapshot?.nickname || '爱宠小助手';
};

const getSitterLevelClass = (order: Order) => {
  const level = order.sitterSnapshot?.sitterProfile?.level;
  if (level === 'GOLD') return 'gold';
  if (level === 'SILVER') return 'silver';
  if (level === 'BRONZE') return 'bronze';
  return 'bronze';
};

const getSitterLevelText = (order: Order) => {
  const level = order.sitterSnapshot?.sitterProfile?.level;
  if (level === 'GOLD') return '金牌宠托师';
  if (level === 'SILVER') return '银牌宠托师';
  if (level === 'BRONZE') return '铜牌宠托师';
  return '认证宠托师';
};

const showSitterProfile = (order: Order) => {
  if (order.sitterSnapshot) {
    currentSitter.value = order.sitterSnapshot;
  } else {
    // Fallback if no snapshot (e.g. old orders)
    currentSitter.value = {
      id: order.sitterId || '',
      nickname: '爱宠小助手',
      avatar: '',
      role: 'sitter',
      sitterProfile: {
        level: 'BRONZE',
        completedOrders: 10,
        rating: 4.8,
        experienceYears: 1,
        tags: ['认真负责'],
        bio: '这位宠托师很神秘，还没有填写简介~',
        isCertified: true
      }
    };
  }
  showModal.value = true;
};

const getModalLevelClass = () => {
  const level = currentSitter.value?.sitterProfile?.level;
  if (level === 'GOLD') return 'gold';
  if (level === 'SILVER') return 'silver';
  if (level === 'BRONZE') return 'bronze';
  return 'bronze';
};

const getModalLevelText = () => {
  const level = currentSitter.value?.sitterProfile?.level;
  if (level === 'GOLD') return '金牌宠托师';
  if (level === 'SILVER') return '银牌宠托师';
  if (level === 'BRONZE') return '铜牌宠托师';
  return '认证宠托师';
};

const closeModal = () => {
  showModal.value = false;
};

// --- Order State Transitions ---

const switchToTab = (statusValue: string) => {
  const idx = currentTabs.value.findIndex(t => t.value === statusValue);
  if (idx > -1) {
    currentTab.value = idx;
  }
};

const handleCancel = (order: Order) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消订单吗？',
    success: (res) => {
      if (res.confirm) {
        orderStore.updateOrderStatus(order.id, 'CANCELLED');
        // Cancelled orders are usually not in a specific tab other than ALL or Cancelled history (if exists)
        // Here we just stay or go to ALL? User didn't specify for Cancel.
      }
    }
  });
};

const handlePay = (order: Order) => {
  uni.showLoading({ title: '支付中...' });
  setTimeout(() => {
    uni.hideLoading();
    orderStore.updateOrderStatus(order.id, 'PENDING');
    uni.showToast({ title: '支付成功', icon: 'success' });
    switchToTab('PENDING');
  }, 1000);
};

const handleConfirmStart = (order: Order) => {
    // 铲屎官确认开始
    orderStore.updateOrderStatus(order.id, 'IN_SERVICE');
    uni.showToast({ title: '已确认开始服务', icon: 'success' });
    switchToTab('IN_SERVICE');
};

const handleStartService = (order: Order) => {
    uni.showModal({
        title: '开始服务',
        content: '确认到达现场并开始服务？',
        success: (res) => {
            if (res.confirm) {
                orderStore.updateOrderStatus(order.id, 'IN_SERVICE');
                switchToTab('IN_SERVICE');
            }
        }
    });
};

const handleCompleteService = (order: Order) => {
    processingOrder.value = order;
    tempPhotos.value = [];
    showCompleteModal.value = true;
};

const closeCompleteModal = () => {
    showCompleteModal.value = false;
    processingOrder.value = null;
};

const handleTaskChange = (e: any) => {
    tempTasks.value = e.detail.value;
};

const choosePhoto = () => {
    uni.chooseImage({
        count: 3,
        success: (res) => {
            tempPhotos.value = [...tempPhotos.value, ...res.tempFilePaths];
        },
        fail: () => {
             // Mock for web testing
             tempPhotos.value.push('https://placehold.co/200x200?text=Photo');
        }
    });
};

const submitComplete = () => {
    if (processingOrder.value) {
        orderStore.completeOrder(processingOrder.value.id, {
            photos: tempPhotos.value,
            items: tempTasks.value,
            confirmedAt: Date.now()
        });
        uni.showToast({ title: '服务已完成' });
        // Sitter completed: Switch to COMPLETED
        switchToTab('COMPLETED');
    }
    closeCompleteModal();
};

const previewImage = (urls: string[], current: number) => {
    uni.previewImage({
        urls,
        current
    });
};

const handleConfirmComplete = (order: Order) => {
    // 铲屎官确认完成
    uni.showModal({
        title: '确认完成',
        content: '确认宠托师已完成服务？',
        success: (res) => {
            if (res.confirm) {
                // If Sitter hasn't uploaded evidence yet, we might just set status to COMPLETED (Wait for Review)
                // Or maybe we require Sitter to do it first.
                // Assuming Owner can force complete.
                if (order.status === 'IN_SERVICE') {
                   orderStore.updateOrderStatus(order.id, 'COMPLETED');
                   uni.showToast({ title: '订单已完成' });
                   switchToTab('COMPLETED');
                }
            }
        }
    });
};

const handleInviteReview = (order: Order) => {
    uni.showToast({ title: '已发送评价邀请', icon: 'success' });
};

const handleReview = (order: Order) => {
    uni.showActionSheet({
        itemList: ['非常满意', '满意', '一般'],
        success: (res) => {
            orderStore.updateOrderStatus(order.id, 'REVIEWED');
            uni.showToast({ title: '评价成功' });
        }
    });
};

const handleReorder = (order: Order) => {
    goToPublish();
};

const makeCall = (phone: string) => {
    uni.showModal({
        title: '拨打电话',
        content: `确认拨打 ${phone} 吗？`,
        confirmText: '拨打',
        success: (res) => {
            if (res.confirm) {
                uni.makePhoneCall({
                    phoneNumber: phone
                });
            }
        }
    });
};

</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding-bottom: 40rpx;
}

.tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: $shadow-sm;
}

.tabs {
  display: flex;
  padding: 0 $spacing-lg;
  height: 88rpx;
  align-items: center;
  
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
    
    .tab-text {
      font-size: 28rpx;
      color: $color-text-secondary;
      font-weight: 500;
      transition: all 0.3s;
    }
    
    &.active {
      .tab-text {
        color: $color-text-main;
        font-weight: 600;
        font-size: 30rpx;
      }
    }
    
    .tab-line {
      position: absolute;
      bottom: 10rpx;
      width: 32rpx;
      height: 6rpx;
      background: linear-gradient(90deg, #FF8E3C 0%, #FF6B6B 100%);
      border-radius: $radius-full;
    }
  }
}

.order-list {
    padding: $spacing-md $spacing-lg;
  }
  
  .evidence-photos {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    margin-top: 10rpx;
    
    .evidence-img {
      width: 140rpx;
      height: 140rpx;
      border-radius: 8rpx;
      background: #f5f5f5;
    }
  }

  .complete-form {
    padding: 20rpx;
    
    .form-item {
      margin-bottom: 30rpx;
      
      .label {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        margin-bottom: 20rpx;
        color: $color-text-main;
      }
      
      .checkbox-item {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;
        font-size: 26rpx;
        color: $color-text-regular;
        
        checkbox {
          transform: scale(0.8);
        }
      }
      
      .photo-uploader {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
        
        .photo-item, .add-btn {
          width: 160rpx;
          height: 160rpx;
          border-radius: 12rpx;
          overflow: hidden;
        }
        
        .photo-item image {
          width: 100%;
          height: 100%;
        }
        
        .add-btn {
          background: #F5F5F5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60rpx;
          color: #999;
          border: 2rpx dashed #DDD;
        }
      }
    }
  }

.order-card {
  background: #FFFFFF;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-card;
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.99);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    
    .service-info {
      display: flex;
      align-items: center;
      
      .service-badge {
        padding: 6rpx 16rpx;
        border-radius: $radius-sm;
        font-size: 22rpx;
        font-weight: 600;
        margin-right: 12rpx;
        
        &.FEEDING {
          background: #FFF0E5;
          color: #FF8E3C;
        }
        &.WALKING {
          background: #E6F7FF;
          color: #1890FF;
        }
      }
      
      .order-id {
        font-size: 24rpx;
        color: $color-text-placeholder;
      }
    }
    
    .status-badge {
      font-size: 26rpx;
      font-weight: 600;
      
      &.pending { color: $color-warning; }
      &.accepted { color: $color-blue; }
      &.in_service { color: $color-primary; }
      &.completed { color: $color-success; }
      &.reviewed { color: $color-text-secondary; }
      &.cancelled { color: $color-text-placeholder; }
    }
  }
  
  .sitter-info-bar {
    background: #F9FAFB;
    border-radius: $radius-md;
    padding: $spacing-sm $spacing-md;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    
    .sitter-left {
      display: flex;
      align-items: center;
      
      .avatar-placeholder {
        width: 64rpx;
        height: 64rpx;
        background: #FFD1DC;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFF;
        font-weight: 600;
        margin-right: 16rpx;
      }
      
      .sitter-details {
        .name-row {
          display: flex;
          align-items: center;
          margin-bottom: 4rpx;
          
          .name {
            font-size: 26rpx;
            font-weight: 600;
            margin-right: 12rpx;
          }
          
          .level-badge {
            font-size: 18rpx;
            padding: 2rpx 8rpx;
            border-radius: 4rpx;
            &.gold {
              background: linear-gradient(90deg, #FFD700, #FFA500);
              color: #FFF;
            }
            &.silver {
              background: linear-gradient(90deg, #C0C0C0, #A9A9A9);
              color: #FFF;
            }
            &.bronze {
              background: linear-gradient(90deg, #CD7F32, #8B4513);
              color: #FFF;
            }
          }
        }
        
        .sub-text {
          font-size: 22rpx;
          color: $color-text-secondary;
        }
      }
    }
    
    .arrow {
      color: $color-text-placeholder;
      font-size: 24rpx;
    }
  }
  
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    
    .info-section {
      background: #F9FAFB;
      border-radius: 12rpx;
      padding: 20rpx;
      
      &.pet-section {
        background: #FFF5EB; // Light orange bg
        
        .pet-header-row {
          display: flex;
          align-items: center;
          margin-bottom: 12rpx;
          
          .pet-name { font-size: 30rpx; font-weight: 700; color: #333; margin-right: 12rpx; }
          .pet-breed { font-size: 24rpx; color: #666; margin-right: 12rpx; }
          .pet-tags { 
            display: flex; gap: 8rpx;
            .tag { font-size: 20rpx; color: #FF8E3C; border: 1px solid #FF8E3C; padding: 0 8rpx; border-radius: 4rpx; }
          }
        }
        
        .pet-details-row {
          font-size: 24rpx;
          color: #666;
          margin-bottom: 12rpx;
          display: flex;
          align-items: center;
          .divider { color: #DDD; margin: 0 12rpx; }
        }
        
        .pet-pref-row {
           font-size: 24rpx;
           color: #666;
           background: rgba(255,255,255,0.8);
           padding: 12rpx;
           border-radius: 8rpx;
           .label { color: #999; }
           .val { color: #333; }
        }
      }
      
      &.service-section {
         .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 16rpx;
            &:last-child { margin-bottom: 0; }
            
            &.content-row {
               align-items: flex-start;
               .icon { margin-top: 4rpx; }
            }
            
            .icon { font-size: 30rpx; margin-right: 16rpx; }
            .text { font-size: 28rpx; color: #333; }
            .sub-text { font-size: 24rpx; color: #999; margin-left: 8rpx; }
            .address { 
              flex: 1; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              white-space: nowrap; 
              color: #333;
            }
            .highlight { font-weight: 500; }
            
            .content-list, .addons-list {
               flex: 1;
               
               .content-label {
                  font-size: 24rpx;
                  color: #999;
                  margin-bottom: 8rpx;
                  display: block;
               }
               
               .content-tags, .addons-tags {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 12rpx;
               }
               
               .content-tag {
                  font-size: 22rpx;
                  color: #666;
                  background: #F0F0F0;
                  padding: 4rpx 12rpx;
                  border-radius: 6rpx;
               }
               
               .addon-tag {
                  font-size: 22rpx; 
                  background: #E6F7FF; 
                  color: #1890FF; 
                  padding: 4rpx 12rpx; 
                  border-radius: 6rpx; 
               }
            }
         }
      }
      
      &.contact-section {
         background: #F0F9FF;
         border: 1px solid #E6F7FF;
         
         .contact-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .contact-left {
               display: flex;
               flex-direction: column;
               
               .label { font-size: 20rpx; color: #1890FF; opacity: 0.8; margin-bottom: 6rpx; }
               .person {
                  display: flex;
                  align-items: center;
                  gap: 16rpx;
                  
                  .name { font-size: 28rpx; font-weight: 600; color: #333; }
                  .phone-link { 
                    font-size: 28rpx; 
                    color: #1890FF; 
                    text-decoration: underline; 
                    font-weight: 500;
                  }
               }
            }
            
            .call-btn {
               display: flex;
               align-items: center;
               gap: 8rpx;
               background: #1890FF;
               color: #FFF;
               padding: 12rpx 28rpx;
               border-radius: 100rpx;
               font-size: 24rpx;
               font-weight: 500;
               box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
               
               .icon { font-size: 24rpx; }
               
               &:active { opacity: 0.9; transform: scale(0.98); }
            }
         }
      }
      
      &.evidence-section {
         .section-label { font-size: 24rpx; color: #999; margin-bottom: 12rpx; display: block; }
      }
    }
  }
  
  .card-divider {
    height: 1px;
    background: #F5F6F8;
    margin: $spacing-md 0;
  }
  
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .price-box {
      display: flex;
      align-items: baseline;
      
      .label {
        font-size: 24rpx;
        color: $color-text-secondary;
        margin-right: 8rpx;
      }
      
      .symbol {
        font-size: 24rpx;
        color: $color-text-main;
        font-weight: 600;
      }
      
      .amount {
        font-size: 36rpx;
        color: $color-text-main;
        font-weight: 800;
      }
    }
    
    .action-box {
      display: flex;
      gap: 16rpx;
      
      .btn {
        margin: 0;
        padding: 0 24rpx;
        height: 56rpx;
        line-height: 56rpx;
        border-radius: $radius-full;
        font-size: 24rpx;
        
        &.ghost {
          background: #F5F6F8;
          color: $color-text-regular;
          &::after { border: none; }
        }
        
        &.primary {
          background: $color-primary-gradient;
          color: #FFFFFF;
          box-shadow: $shadow-primary;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  
  .empty-icon {
    font-size: 80rpx;
    margin-bottom: $spacing-md;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $color-text-secondary;
    margin-bottom: $spacing-xl;
  }
  
  .btn-publish {
    width: 240rpx;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: $radius-full;
    background: $color-primary-gradient;
    color: #FFFFFF;
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: $shadow-primary;
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 600rpx;
  background: #FFF;
  border-radius: 24rpx;
  padding: 32rpx;
  animation: popIn 0.3s ease;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: 600;
    }
    
    .close {
      font-size: 40rpx;
      color: $color-text-secondary;
      line-height: 1;
      padding: 10rpx;
    }
  }
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.sitter-profile {
  .profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
    
    .avatar-lg {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      background: #FFD1DC;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      color: #FFF;
      font-weight: 600;
      margin-right: 24rpx;
    }
    
    .profile-main {
      .name {
        font-size: 32rpx;
        font-weight: 600;
        margin-bottom: 8rpx;
        display: block;
      }
      
      .badges {
        display: flex;
        gap: 12rpx;
        
        .level-badge {
          font-size: 20rpx;
          padding: 4rpx 12rpx;
          border-radius: 6rpx;
          &.gold {
            background: linear-gradient(90deg, #FFD700, #FFA500);
            color: #FFF;
          }
          &.silver {
            background: linear-gradient(90deg, #C0C0C0, #A9A9A9);
            color: #FFF;
          }
          &.bronze {
            background: linear-gradient(90deg, #CD7F32, #8B4513);
            color: #FFF;
          }
        }
        
        .verify-badge {
          font-size: 20rpx;
          padding: 4rpx 12rpx;
          border-radius: 6rpx;
          background: #E6F7FF;
          color: #1890FF;
        }
      }
    }
  }
  
  .stats-row {
    display: flex;
    justify-content: space-between;
    background: #F9FAFB;
    padding: 24rpx;
    border-radius: 16rpx;
    margin-bottom: 32rpx;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .num {
        font-size: 32rpx;
        font-weight: 700;
        color: $color-text-main;
        margin-bottom: 4rpx;
      }
      
      .label {
        font-size: 22rpx;
        color: $color-text-secondary;
      }
    }
  }
  
  .section {
    margin-bottom: 32rpx;
    
    .section-title {
      font-size: 28rpx;
      font-weight: 600;
      margin-bottom: 16rpx;
      display: block;
    }
    
    .bio {
      font-size: 26rpx;
      color: $color-text-regular;
      line-height: 1.5;
    }
    
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
      
      .tag {
        background: #F0F2F5;
        color: $color-text-secondary;
        font-size: 24rpx;
        padding: 8rpx 20rpx;
        border-radius: 100rpx;
      }
    }
  }
}
</style>

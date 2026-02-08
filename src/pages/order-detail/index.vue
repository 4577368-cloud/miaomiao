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

    <!-- 服务工具包 (仅服务中可见) -->
    <view class="card toolkit-card" v-if="!isOwner && order.status === 'IN_SERVICE'">
      <view class="card-header">
        <text class="title">服务工具包</text>
      </view>
      <view class="toolkit-grid">
        <view class="toolkit-item" @click="makeCall">
          <view class="icon-circle call">
            <text class="icon">📞</text>
          </view>
          <text class="label">一键通话</text>
        </view>
        <view class="toolkit-item" @click="handleUploadEvidence">
          <view class="icon-circle camera">
            <text class="icon">📸</text>
          </view>
          <text class="label">拍照留证</text>
        </view>
      </view>
    </view>

    <!-- 宠物信息 -->
    <view class="card pet-card">
      <view class="card-header">
        <text class="title">爱宠档案</text>
      </view>
      <view class="pet-list">
        <view 
          class="pet-content" 
          v-for="(pet, index) in displayPets" 
          :key="index"
          :class="{ 'border-top': index > 0 }"
        >
          <image 
            v-if="pet.image || pet.avatar" 
            :src="pet.image || pet.avatar" 
            mode="aspectFill" 
            class="pet-image"
          />
          <view class="pet-avatar-placeholder" v-else>
            {{ pet.name?.[0] || '宠' }}
          </view>
          
          <view class="pet-details">
            <view class="pet-main">
              <text class="pet-name">{{ pet.name }}</text>
              <text class="pet-gender">
                <text v-if="pet.gender === 'male'">弟弟 ♂</text>
                <text v-else-if="pet.gender === 'female'">妹妹 ♀</text>
                <text v-else>未知</text>
              </text>
            </view>
            <view class="pet-tags">
              <text class="tag">{{ pet.breed || '未知品种' }}</text>
              <text class="tag">{{ pet.age }}岁</text>
              <text class="tag">{{ formatPetSize(pet.size) }}</text>
              <text class="tag highlight" v-if="pet.isSterilized || pet.sterilized">已绝育</text>
              <text class="tag highlight" v-if="pet.isVaccinated || pet.vaccine">已疫苗</text>
            </view>
            <view class="pet-remark" v-if="pet.temperament || pet.description">
              <text class="label">性格/描述：</text>
              <text class="text">{{ pet.temperament || pet.description }}</text>
            </view>
          </view>
        </view>
        
        <view class="pet-remark global-remark" v-if="order.remark">
          <text class="label">订单备注：</text>
          <text class="text">{{ order.remark }}</text>
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

    <!-- 服务凭证 (拍照打卡) -->
    <view class="card evidence-card" v-if="shouldShowEvidence">
      <view class="card-header">
        <text class="title">服务凭证 (拍照打卡)</text>
      </view>
      <view class="evidence-grid">
        <view 
          class="evidence-item" 
          v-for="(photo, index) in (order.serviceEvidence?.photos || [])" 
          :key="index"
          @click="previewImage(index)"
        >
          <image :src="photo" mode="aspectFill" class="evidence-img" />
        </view>
        <view 
          class="evidence-add" 
          v-if="!isOwner && order.status === 'IN_SERVICE'"
          @click="handleUploadEvidence"
        >
          <text class="add-icon">+</text>
          <text class="add-text">拍照</text>
        </view>
      </view>
      <view class="empty-evidence" v-if="!order.serviceEvidence?.photos?.length && isOwner">
        <text>暂无服务照片，请联系宠托师上传</text>
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

    <!-- 底部操作栏 -->
    <view class="footer-bar-placeholder"></view>
    <view class="footer-bar" v-if="order.status !== 'CANCELLED'">
      <!-- Owner Actions -->
      <block v-if="isOwner">
        <button 
          v-if="order.status === 'PENDING' || order.status === 'PENDING_ACCEPTANCE'" 
          class="btn btn-outline" 
          @click="handleCancel"
        >取消订单</button>
        <button 
          v-if="order.status === 'COMPLETED'" 
          class="btn btn-primary" 
          @click="openOwnerReview"
        >评价服务</button>
        <button 
          v-if="order.status === 'REVIEWED'" 
          class="btn btn-outline" 
          disabled
        >已评价</button>
         <button 
            v-if="order.status === 'ACCEPTED' || order.status === 'IN_SERVICE'" 
            class="btn btn-primary" 
            @click="makeCall"
        >联系宠托师</button>
      </block>
      
      <!-- Sitter Actions -->
      <block v-else>
         <button 
            v-if="order.status === 'PENDING'" 
            class="btn btn-primary full-width" 
            @click="handleAccept"
        >立即抢单</button>
        <button 
            v-if="order.status === 'ACCEPTED'" 
            class="btn btn-primary full-width" 
            @click="handleStartService"
        >开始服务</button>
        <button 
            v-if="order.status === 'IN_SERVICE'" 
            class="btn btn-success full-width" 
            @click="handleCompleteService"
        >完成服务</button>
        <view v-if="order.status === 'COMPLETED' || order.status === 'REVIEWED'" class="completed-actions">
            <text class="completed-text">收益已到账</text>
            <button 
                class="btn btn-outline small" 
                v-if="!order.sitterReview"
                @click="openSitterReview"
            >评价宠物</button>
             <button 
                class="btn btn-outline small disabled" 
                v-else
            >已评价</button>
        </view>
      </block>
    </view>
    
    <!-- 宠托师评价弹窗 -->
    <view class="modal-overlay" v-if="showSitterReviewModal" @click="closeSitterReviewModal">
       <view class="modal-content review-modal" @click.stop>
          <view class="review-header">
             <text class="title">评价宠物</text>
             <text class="sub">宠物乖不乖？写下你的感受</text>
          </view>
          
          <view class="rating-stars">
             <view 
               class="star-item" 
               v-for="i in 5" 
               :key="i"
               @click="sitterReviewRating = i"
             >
                <text class="star-icon" :class="{ active: i <= sitterReviewRating }">★</text>
             </view>
          </view>
          
          <view class="tags-section">
             <view 
                class="tag-item" 
                :class="{ active: sitterReviewTags.includes(tag) }"
                v-for="tag in availableTags" 
                :key="tag"
                @click="toggleTag(tag)"
             >
                {{ tag }}
             </view>
          </view>
          
          <view class="input-wrapper">
             <textarea 
               class="review-textarea" 
               placeholder="宠物有什么特点？比如：粘人、护食、胆小..." 
               placeholder-class="placeholder"
               v-model="sitterReviewContent"
             />
          </view>
          
          <view class="modal-actions">
             <button class="btn-cancel" @click="closeSitterReviewModal">取消</button>
             <button class="btn-submit" @click="submitSitterReview">提交评价</button>
          </view>
       </view>
    </view>

    <!-- 主人评价弹窗 (评价宠托师) -->
    <view class="modal-overlay" v-if="showOwnerReviewModal" @click="closeOwnerReviewModal">
       <view class="modal-content review-modal" @click.stop>
          <view class="review-header">
             <text class="title">评价服务</text>
             <text class="sub">服务还满意吗？给宠托师打个分吧</text>
          </view>
          
          <view class="rating-stars">
             <view 
               class="star-item" 
               v-for="i in 5" 
               :key="i"
               @click="ownerReviewRating = i"
             >
                <text class="star-icon" :class="{ active: i <= ownerReviewRating }">★</text>
             </view>
          </view>
          
          <view class="input-wrapper">
             <textarea 
               class="review-textarea" 
               placeholder="写下您的评价，帮助更多铲屎官..." 
               placeholder-class="placeholder"
               v-model="ownerReviewContent"
             />
          </view>
          
          <view class="modal-actions">
             <button class="btn-cancel" @click="closeOwnerReviewModal">取消</button>
             <button class="btn-submit" @click="submitOwnerReview">提交评价</button>
          </view>
       </view>
    </view>

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
const orderId = ref('');
const order = computed(() => orderStore.orders.find(o => o.id === orderId.value) || null);
const timer = ref<number | null>(null);
const countdown = ref('');

// Watch for status changes to handle timer
import { watch } from 'vue';
watch(() => order.value?.status, (newStatus) => {
    if (newStatus === 'IN_SERVICE') {
        startTimer();
    } else if (newStatus === 'COMPLETED') {
        if (timer.value) {
            clearInterval(timer.value);
            timer.value = null;
        }
        countdown.value = '00:00';
    }
});

// Sitter Review State
const showSitterReviewModal = ref(false);
const sitterReviewRating = ref(5);
const sitterReviewContent = ref('');
const sitterReviewTags = ref<string[]>([]);
const availableTags = ['乖巧', '粘人', '胆小', '护食', '精力旺盛', '听话', '拆家', '环境整洁', '主人友好', '沟通顺畅'];

// Owner Review State
const showOwnerReviewModal = ref(false);
const ownerReviewRating = ref(5);
const ownerReviewContent = ref('');

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

const displayPets = computed(() => {
  if (!order.value) return [];
  if (order.value.petSnapshots && order.value.petSnapshots.length > 0) {
    return order.value.petSnapshots;
  }
  if (order.value.petSnapshot) {
    return [order.value.petSnapshot];
  }
  // Fallback legacy fields
  if (order.value.petName) {
    return [{
      name: order.value.petName,
      breed: order.value.petBreed,
      gender: order.value.petGender,
      age: order.value.petAge,
      size: order.value.petSize,
      isSterilized: false, // Unknown
      isVaccinated: false  // Unknown
    }];
  }
  return [];
});

const shouldShowEvidence = computed(() => {
  if (!order.value) return false;
  // Sitter: Show if IN_SERVICE or COMPLETED
  if (!isOwner.value) {
    return ['IN_SERVICE', 'COMPLETED', 'REVIEWED'].includes(order.value.status);
  }
  // Owner: Show if IN_SERVICE (real-time) or COMPLETED
  return ['IN_SERVICE', 'COMPLETED', 'REVIEWED'].includes(order.value.status);
});

const makeCall = () => {
  const phone = targetUser.value?.phone || (isOwner.value ? null : order.value?.contactPhone);
  if (phone) {
    uni.makePhoneCall({ phoneNumber: phone });
  } else {
    uni.showToast({ title: '暂无联系电话', icon: 'none' });
  }
};

const handleUploadEvidence = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: (res) => {
      const tempFilePaths = res.tempFilePaths;
      // In real app, upload to server here.
      // Mock: just use temp path
      if (order.value) {
        const currentPhotos = order.value.serviceEvidence?.photos || [];
        orderStore.updateOrderEvidence(order.value.id, {
            photos: [...currentPhotos, tempFilePaths[0]],
            confirmedAt: Date.now() // Mock
        });
        
      }
    }
  });
};

const handleAccept = () => {
    if (!order.value || !userStore.userInfo) return;
    uni.showModal({
        title: '确认抢单',
        content: '确定要接下这个订单吗？',
        success: (res) => {
            if (res.confirm) {
                if (orderStore.acceptOrder(order.value!.id, userStore.userInfo!)) {
                    uni.showToast({ title: '抢单成功' });
                    
                } else {
                    uni.showToast({ title: '抢单失败', icon: 'none' });
                }
            }
        }
    });
};

const handleStartService = () => {
    if (!order.value) return;
    uni.showLoading({ title: '定位打卡中...' });
    // Mock Location Check
    setTimeout(() => {
        uni.hideLoading();
        // Simulate checking if location matches (mock success)
        if (orderStore.startService(order.value!.id)) {
             uni.showToast({ title: '已开启服务' });
             
        } else {
             uni.showToast({ title: '开启失败', icon: 'none' });
        }
    }, 1000);
};

const handleCompleteService = () => {
    if (!order.value) return;
    // Check if photos uploaded
    if (!order.value.serviceEvidence?.photos?.length) {
        uni.showToast({ title: '请先上传服务照片', icon: 'none' });
        return;
    }
    
    uni.showModal({
        title: '确认完成',
        content: '确认服务已完成并通知主人？',
        success: (res) => {
            if (res.confirm) {
                if (orderStore.completeService(order.value!.id)) {
                    uni.showToast({ title: '订单完成，收益已到账' });
                    
                }
            }
        }
    });
};

const handleCancel = () => {
    if (!order.value) return;
    uni.showModal({
        title: '取消订单',
        content: '确定要取消吗？',
        success: (res) => {
            if (res.confirm) {
                const role = isOwner.value ? 'owner' : 'sitter';
                if (orderStore.cancelOrder(order.value!.id, role)) {
                    uni.showToast({ title: '已取消' });
                    uni.navigateBack();
                } else {
                    uni.showToast({ title: '取消失败，当前状态不可取消', icon: 'none' });
                }
            }
        }
    });
};

// Sitter Review Logic
const openSitterReview = () => {
    showSitterReviewModal.value = true;
};

const closeSitterReviewModal = () => {
    showSitterReviewModal.value = false;
    sitterReviewRating.value = 5;
    sitterReviewContent.value = '';
    sitterReviewTags.value = [];
};

const toggleTag = (tag: string) => {
    if (sitterReviewTags.value.includes(tag)) {
        sitterReviewTags.value = sitterReviewTags.value.filter(t => t !== tag);
    } else {
        if (sitterReviewTags.value.length >= 3) {
            uni.showToast({ title: '最多选择3个标签', icon: 'none' });
            return;
        }
        sitterReviewTags.value.push(tag);
    }
};

const submitSitterReview = () => {
    if (!order.value) return;
    orderStore.submitSitterReview(
        order.value.id, 
        sitterReviewRating.value, 
        sitterReviewContent.value,
        sitterReviewTags.value
    );
    uni.showToast({ title: '评价成功' });
    closeSitterReviewModal();
    
};

// Owner Review Logic
const openOwnerReview = () => {
    showOwnerReviewModal.value = true;
};

const closeOwnerReviewModal = () => {
    showOwnerReviewModal.value = false;
    ownerReviewRating.value = 5;
    ownerReviewContent.value = '';
};

const submitOwnerReview = () => {
    if (!order.value) return;
    orderStore.submitOwnerReview(
        order.value.id, 
        ownerReviewRating.value, 
        ownerReviewContent.value
    );
    uni.showToast({ title: '评价成功' });
    closeOwnerReviewModal();
    
};

const previewImage = (index: number) => {
  const photos = order.value?.serviceEvidence?.photos || [];
  if (photos.length) {
    uni.previewImage({
      urls: photos,
      current: index
    });
  }
};

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

onLoad(async (options) => {
  if (options && options.id) {
    orderId.value = options.id;
    
    // Ensure orders are loaded
    if (orderStore.orders.length === 0) {
        await orderStore.loadOrders();
    }
    
    if (!order.value) {
      uni.showToast({ title: '订单不存在', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 1500);
    } else {
      startTimer();
    }
  }
});

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
});

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

.toolkit-card {
  .toolkit-grid {
    display: flex;
    justify-content: space-around;
    padding: 20rpx 0;
    
    .toolkit-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;
      
      .icon-circle {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.call {
          background-color: rgba(255, 142, 60, 0.1);
          color: #FF8E3C;
        }
        &.camera {
          background-color: rgba(64, 158, 255, 0.1);
          color: #409EFF;
        }
        
        .icon {
          font-size: 48rpx;
        }
      }
      
      .label {
        font-size: 26rpx;
        color: #333;
      }
      
      &:active {
        opacity: 0.8;
      }
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

.evidence-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .evidence-item {
    width: 200rpx;
    height: 200rpx;
    border-radius: 16rpx;
    overflow: hidden;
    background: #f8f8f8;
    
    .evidence-img {
      width: 100%;
      height: 100%;
    }
  }
  
  .evidence-add {
    width: 200rpx;
    height: 200rpx;
    border-radius: 16rpx;
    background: #f8f8f8;
    border: 2rpx dashed #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    
    .add-icon { font-size: 60rpx; font-weight: 300; margin-bottom: 8rpx; }
    .add-text { font-size: 24rpx; }
    
    &:active { background: #eee; }
  }
}

.empty-evidence {
  text-align: center;
  color: $color-text-secondary;
  padding: 40rpx 0;
  font-size: 26rpx;
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

.pet-list {
  .pet-content {
    padding-bottom: 24rpx;
    
    &.border-top {
      border-top: 1rpx dashed #eee;
      padding-top: 24rpx;
    }
  }
}

.global-remark {
  border-top: 1rpx dashed #eee;
  padding-top: 20rpx;
  margin-top: 8rpx;
}

.footer-bar-placeholder {
  height: 120rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20rpx;
  z-index: 100;
  
  .btn {
    font-size: 28rpx;
    font-weight: 600;
    padding: 0 40rpx;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    border: none;
    margin: 0;
    
    &.btn-primary {
      background: $color-primary;
      color: #fff;
      &:active { opacity: 0.9; }
    }
    
    &.btn-outline {
      background: #fff;
      color: $color-text-main;
      border: 1rpx solid #ddd;
      &:active { background: #f5f5f5; }
    }

    &.btn-secondary {
       background: $color-secondary-light;
       color: $color-primary;
       &:active { opacity: 0.9; }
    }
    
    &.btn-success {
      background: $color-success;
      color: #fff;
      &:active { opacity: 0.9; }
    }
    
    &.full-width {
      flex: 1;
    }
  }
  
  .completed-text {
      flex: 1;
      text-align: center;
      color: $color-success;
      font-size: 28rpx;
      font-weight: 500;
  }
}
</style>
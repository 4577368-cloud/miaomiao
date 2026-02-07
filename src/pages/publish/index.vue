<template>
  <view class="container">
    <!-- 顶部导航栏占位 -->
    <view class="nav-placeholder"></view>

    <view class="page-header">
      <text class="title">发布需求</text>
      <text class="subtitle">定制您的专属服务</text>
    </view>

    <!-- 1. 服务类型 (Enhanced UI) -->
    <view class="service-type-switch">
      <view 
        class="switch-item feeding"
        :class="{ active: form.serviceType === ServiceType.FEEDING }"
        @click="form.serviceType = ServiceType.FEEDING"
      >
        <text class="icon">🥣</text>
        <view class="info">
          <text class="label">上门喂养</text>
          <text class="desc">喂食 · 换水 · 铲屎</text>
        </view>
        <view class="check-mark" v-if="form.serviceType === ServiceType.FEEDING">✓</view>
      </view>
      
      <view 
        class="switch-item walking"
        :class="{ active: form.serviceType === ServiceType.WALKING }"
        @click="form.serviceType = ServiceType.WALKING"
      >
        <text class="icon">🦮</text>
        <view class="info">
          <text class="label">上门遛宠</text>
          <text class="desc">遛狗 · 陪玩 · 清洁</text>
        </view>
        <view class="check-mark" v-if="form.serviceType === ServiceType.WALKING">✓</view>
      </view>
    </view>

    <!-- 2. 地址与时间 (Refactored) -->
    <view class="section card-section address-time-card">
      <view class="form-row" @click="handleAddressSelect">
        <view class="icon-box location">📍</view>
        <view class="row-content">
          <text class="row-label">服务地址</text>
          <text class="row-value" :class="{ placeholder: !form.address }">
            {{ form.address || '点击选择服务地址' }}
          </text>
        </view>
        <text class="arrow">></text>
      </view>
      
      <view class="divider"></view>
      
      <!-- Date Range & Time Selection -->
      <view class="time-selection-area">
         <view class="time-header">
            <text class="row-label">服务时间</text>
            <view class="mode-switch">
               <text 
                  :class="{active: !isMultiDay}" 
                  @click="isMultiDay = false"
               >单次</text>
               <text class="sep">|</text>
               <text 
                  :class="{active: isMultiDay}" 
                  @click="isMultiDay = true"
               >连续多天</text>
            </view>
         </view>
         
         <!-- Single Date Picker -->
         <picker 
            v-if="!isMultiDay" 
            mode="date" 
            :start="startDate" 
            :end="endDate" 
            @change="handleDateChange"
         >
            <view class="date-display">
               <text class="date-val">{{ form.date || '选择日期' }}</text>
               <text class="icon">📅</text>
            </view>
         </picker>
         
         <!-- Multi Date Picker (Mock with Start/End) -->
         <view v-else class="multi-date-row">
            <picker mode="date" :start="startDate" :end="endDate" @change="e => handleRangeChange('start', e)">
               <view class="date-box">
                  <text class="lbl">开始</text>
                  <text class="val">{{ dateRange.start || '请选择' }}</text>
               </view>
            </picker>
            <text class="arrow">→</text>
            <picker mode="date" :start="dateRange.start || startDate" :end="endDate" @change="e => handleRangeChange('end', e)">
               <view class="date-box">
                  <text class="lbl">结束</text>
                  <text class="val">{{ dateRange.end || '请选择' }}</text>
               </view>
            </picker>
         </view>
         
         <!-- Time Slots -->
         <view class="slots-container">
            <scroll-view scroll-x class="slots-scroll">
               <view class="slots-row">
                  <view 
                     v-for="t in timeSlots" 
                     :key="t" 
                     class="time-slot"
                     :class="{active: form.time === t}"
                     @click="form.time = t"
                  >
                     {{ t }}
                  </view>
               </view>
            </scroll-view>
         </view>
      </view>
    </view>

    <!-- 3. 宠物类型 -->
    <view class="section card-section">
      <view class="section-header">
        <text class="section-title">宠物类型</text>
        <text class="section-sub">选择体型以匹配合适的服务人员</text>
      </view>
      
      <!-- My Pets Selection -->
      <view class="my-pets" v-if="userStore.userInfo?.pets?.length">
         <text class="sub-label">从我的爱宠中选择：</text>
         <scroll-view scroll-x class="pets-scroll">
            <view class="pets-row">
               <view 
                  class="my-pet-item" 
                  v-for="pet in userStore.userInfo.pets" 
                  :key="pet.id"
                  :class="{ active: selectedPetId === pet.id }"
                  @click="selectMyPet(pet)"
               >
                  <image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="pet-avatar" />
                  <text class="pet-name">{{ pet.name }}</text>
               </view>
            </view>
         </scroll-view>
      </view>

      <view class="pet-grid">
        <view 
          v-for="size in petSizes" 
          :key="size.value"
          :class="['pet-card', { active: form.petSize === size.value }]"
          @click="form.petSize = size.value"
        >
          <text class="pet-icon">{{ size.value === PetSize.CAT ? '🐱' : '🐕' }}</text>
          <text class="pet-name">{{ size.label }}</text>
          <text class="pet-desc">{{ size.desc }}</text>
          <view class="pet-badge" v-if="size.coeff > 1">+{{ Math.round((size.coeff - 1) * 100) }}%</view>
        </view>
      </view>
    </view>

    <!-- 4. 服务时长 (Refactored) -->
    <view class="section card-section">
      <view class="section-header">
        <text class="section-title">服务时长</text>
        <text class="section-sub">时长越长，陪伴越久</text>
      </view>
      <view class="duration-selector">
        <view 
          v-for="d in durations" 
          :key="d.value"
          class="duration-item"
          :class="{ active: form.duration === d.value }"
          @click="form.duration = d.value"
        >
          <view class="d-val">
            <text class="num">{{ d.value }}</text>
            <text class="unit">分钟</text>
          </view>
          <view class="d-price-tag" :class="{ 'has-markup': d.markup > 0 }">
            {{ d.markup > 0 ? `+${Math.round(d.markup * 100)}%` : '标准价' }}
          </view>
          <view class="check-icon" v-if="form.duration === d.value">✓</view>
        </view>
      </view>
    </view>

    <!-- 5. 附加服务 -->
    <view class="section card-section">
      <view class="section-header">
        <text class="section-title">附加服务</text>
      </view>
      <view class="addon-list">
        <view 
          class="addon-item" 
          :class="{ active: form.addOns.play }"
          @click="form.addOns.play = !form.addOns.play"
        >
          <view class="addon-info">
            <text class="addon-name">陪玩15分钟</text>
            <text class="addon-price">+¥{{ ADD_ON_PRICES.PLAY_15_MIN }}</text>
          </view>
          <view class="checkbox" :class="{ checked: form.addOns.play }"></view>
        </view>
        <view 
          class="addon-item" 
          :class="{ active: form.addOns.deepClean }"
          @click="form.addOns.deepClean = !form.addOns.deepClean"
        >
          <view class="addon-info">
            <text class="addon-name">深度清洁</text>
            <text class="addon-price">+¥{{ ADD_ON_PRICES.DEEP_CLEAN }}</text>
          </view>
          <view class="checkbox" :class="{ checked: form.addOns.deepClean }"></view>
        </view>
        <view 
          class="addon-item" 
          :class="{ active: form.addOns.medicine }"
          @click="form.addOns.medicine = !form.addOns.medicine"
        >
          <view class="addon-info">
            <text class="addon-name">喂药服务</text>
            <text class="addon-price">+¥{{ ADD_ON_PRICES.MEDICINE }}</text>
          </view>
          <view class="checkbox" :class="{ checked: form.addOns.medicine }"></view>
        </view>
      </view>
    </view>
    
    <!-- 6. 优惠券 -->
    <view class="section card-section" @click="openCouponSelector">
      <view class="form-row">
        <view class="icon-box coupon-icon">🎟️</view>
        <view class="row-content">
          <text class="row-label">优惠券</text>
          <text class="row-value highlight" v-if="selectedCoupon">
            -¥{{ selectedCoupon.value }}
          </text>
          <text class="row-value placeholder" v-else>
            {{ availableCouponsCount > 0 ? `${availableCouponsCount}张可用` : '无可用优惠券' }}
          </text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- 7. 备注 -->
    <view class="section card-section">
      <view class="section-header">
        <text class="section-title">订单备注</text>
      </view>
      <view class="remark-box">
        <textarea 
          v-model="form.remark" 
          placeholder="请填写宠物的特殊习惯、性格或注意事项..." 
          class="remark-input" 
          placeholder-style="color: #BFBFBF"
          auto-height
        />
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="notice-section">
      <view class="notice-item">🛡️ 宠托师已通过实名认证与专业培训</view>
      <view class="notice-item">🏥 平台赠送全程意外保险</view>
      <view class="notice-item">⏰ 服务前2小时可免费取消</view>
    </view>

    <!-- 底部价格栏 -->
    <view class="footer-bar-placeholder"></view>
    <view class="footer-bar">
      <view class="price-container">
        <text class="price-label">预估总价</text>
        <view class="price-col">
          <view class="price-val">
            <text class="symbol">¥</text>
            <text class="amount">{{ finalPrice }}</text>
          </view>
          <text class="original-price" v-if="finalPrice < rawTotalPrice">¥{{ rawTotalPrice }}</text>
        </view>
      </view>
      <button class="btn-submit" @click="handleSubmit">立即发布</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { PetSize, ServiceType, ADD_ON_PRICES, PET_SIZE_COEFFICIENTS } from '@/constants/pet';
import { calculateTotalPrice } from '@/utils/pricing';
import { useOrderStore } from '@/stores/order';
import { useUserStore, type PetInfo, type Address } from '@/stores/user';

const orderStore = useOrderStore();
const userStore = useUserStore();
const BASE_PRICE = 50; 

const selectedPetId = ref<string>('');

const selectMyPet = (pet: PetInfo) => {
  if (selectedPetId.value === pet.id) {
    // Deselect
    selectedPetId.value = '';
    form.remark = '';
    return;
  }
  
  selectedPetId.value = pet.id;
  form.petSize = pet.size;
  
  // Auto-fill remark with pet info if available
  if (pet.description) {
    form.remark = `[${pet.name}] ${pet.description}`;
  }
}; 

const form = reactive({
  address: '',
  date: '',
  time: '',
  serviceType: ServiceType.FEEDING,
  petSize: PetSize.CAT,
  duration: 30,
  durationMarkup: 0,
  remark: '',
  couponId: '',
  addOns: {
    play: false,
    deepClean: false,
    medicine: false,
  }
});

// 日期范围: 今天 ~ 30天后
const today = new Date();
const startDate = today.toISOString().split('T')[0];
const maxDate = new Date();
maxDate.setDate(today.getDate() + 30);
const endDate = maxDate.toISOString().split('T')[0];

const serviceTypes = [
  { label: '上门喂养', value: ServiceType.FEEDING },
  { label: '上门遛宠', value: ServiceType.WALKING },
];

const petSizes = [
  { label: '猫咪', value: PetSize.CAT, desc: '1-15kg', coeff: PET_SIZE_COEFFICIENTS[PetSize.CAT] },
  { label: '小型犬', value: PetSize.SMALL, desc: '1-10kg', coeff: PET_SIZE_COEFFICIENTS[PetSize.SMALL] },
  { label: '中型犬', value: PetSize.MEDIUM, desc: '10-25kg', coeff: PET_SIZE_COEFFICIENTS[PetSize.MEDIUM] },
  { label: '大型犬', value: PetSize.LARGE, desc: '25-40kg', coeff: PET_SIZE_COEFFICIENTS[PetSize.LARGE] },
  { label: '巨型犬', value: PetSize.GIANT, desc: '40kg+', coeff: PET_SIZE_COEFFICIENTS[PetSize.GIANT] },
];

const durations = [
  { label: '30分钟', value: 30, markup: 0 },
  { label: '45分钟', value: 45, markup: 0.15 },
  { label: '60分钟', value: 60, markup: 0.30 },
  { label: '90分钟', value: 90, markup: 0.50 },
];

const rawTotalPrice = computed(() => {
  return calculateTotalPrice({
    basePrice: BASE_PRICE,
    petSize: form.petSize,
    durationMarkup: durations.find(d => d.value === form.duration)?.markup || 0,
    addOns: form.addOns
  });
});

const selectedCoupon = computed(() => {
  if (!form.couponId) return null;
  return userStore.userInfo?.coupons?.find(c => c.id === form.couponId) || null;
});

const availableCouponsCount = computed(() => {
  return userStore.userInfo?.coupons?.filter(c => 
    c.status === 'UNUSED' && 
    c.expiresAt > Date.now() && 
    (c.threshold === 0 || c.threshold <= rawTotalPrice.value)
  ).length || 0;
});

const finalPrice = computed(() => {
  let price = rawTotalPrice.value;
  if (selectedCoupon.value) {
    if (selectedCoupon.value.threshold > 0 && price < selectedCoupon.value.threshold) {
      // Coupon no longer valid due to price change
      return price;
    }
    price = Math.max(0, price - selectedCoupon.value.value);
  }
  return price;
});

// Alias for template compatibility
const totalPrice = finalPrice;

onLoad((options: any) => {
  if (options.serviceType) {
    // Ensure the service type is valid before setting
    const type = options.serviceType as ServiceType;
    if (Object.values(ServiceType).includes(type)) {
      form.serviceType = type;
    }
  }
  if (options.couponId) {
    form.couponId = options.couponId;
  }
  
  // Listen for address selection
  uni.$on('addressSelected', (addr: Address) => {
    form.address = `${addr.name ? addr.name + ' ' : ''}${addr.detail} (${addr.contactName} ${addr.contactPhone})`;
  });
});

onUnmounted(() => {
  uni.$off('addressSelected');
});

const isMultiDay = ref(false);
const dateRange = reactive({ start: '', end: '' });
const timeSlots = computed(() => {
  const slots = [];
  for (let h = 8; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
});

const handleRangeChange = (type: 'start' | 'end', e: any) => {
  const val = e.detail.value;
  if (type === 'start') {
    dateRange.start = val;
    if (dateRange.end && val > dateRange.end) dateRange.end = '';
  } else {
    dateRange.end = val;
  }
  if (dateRange.start && dateRange.end) {
    form.date = `${dateRange.start} 至 ${dateRange.end}`;
  } else if (dateRange.start) {
    form.date = dateRange.start;
  }
};

const handleAddressSelect = () => {
  uni.navigateTo({
    url: '/pages/address/index?action=select'
  });
};

const openCouponSelector = () => {
  const available = userStore.userInfo?.coupons?.filter(c => 
    c.status === 'UNUSED' && 
    c.expiresAt > Date.now() && 
    (c.threshold === 0 || c.threshold <= rawTotalPrice.value)
  ) || [];
  
  if (available.length === 0) {
    uni.showToast({ title: '暂无可用优惠券', icon: 'none' });
    return;
  }
  
  const itemList = available.map(c => `¥${c.value} ${c.name} (${c.threshold > 0 ? `满${c.threshold}可用` : '无门槛'})`);
  itemList.push('不使用优惠券');
  
  uni.showActionSheet({
    itemList,
    success: (res) => {
      if (res.tapIndex === itemList.length - 1) {
        form.couponId = '';
      } else {
        form.couponId = available[res.tapIndex].id;
      }
    }
  });
};

const handleDateChange = (e: any) => {
  form.date = e.detail.value;
};

const handleTimeChange = (e: any) => {
  form.time = e.detail.value;
};

const handleSubmit = () => {
  if (!form.address) return uni.showToast({ title: '请选择地址', icon: 'none' });
  if (!form.date || !form.time) return uni.showToast({ title: '请选择时间', icon: 'none' });

  uni.showLoading({ title: '创建订单中...' });

  setTimeout(() => {
    uni.hideLoading();
    
    // Check balance
    const currentBalance = userStore.userInfo?.balance || 0;
    const price = finalPrice.value;
    
    if (currentBalance < price) {
        uni.showModal({
            title: '余额不足',
            content: `当前余额 ¥${currentBalance.toFixed(2)}，需支付 ¥${price}。\n请先充值。`,
            confirmText: '去充值',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/wallet/index' });
                }
            }
        });
        return;
    }

    uni.showModal({
      title: '确认支付',
      content: `需支付 ¥${finalPrice.value} 元\n(当前余额 ¥${currentBalance.toFixed(2)})`,
      confirmText: '立即支付',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          if (userStore.deductBalance(price)) {
              uni.showToast({ title: '支付成功', icon: 'success' });
              
              orderStore.addOrder({
                id: Date.now().toString(),
                creatorId: userStore.userInfo?.id || 'anonymous',
                serviceType: form.serviceType,
                petSize: form.petSize,
                duration: form.duration,
                totalPrice: finalPrice.value,
                address: form.address,
                time: `${form.date} ${form.time}`,
                status: 'PENDING',
                isPaid: true,
                createdAt: Date.now(),
                remark: form.remark,
                addOns: form.addOns
              });
              
              // Use coupon if selected
              if (form.couponId) {
                userStore.useCoupon(form.couponId);
              }
              
              setTimeout(() => {
                uni.switchTab({ url: '/pages/orders/index' });
              }, 1500);
          } else {
             uni.showToast({ title: '扣款失败', icon: 'none' });
          }
        }
      }
    });
  }, 1000);
};
</script>

<style lang="scss" scoped>
.my-pets {
  margin-bottom: 20px;
  
  .sub-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
    display: block;
  }
  
  .pets-scroll {
    width: 100%;
    white-space: nowrap;
  }
  
  .pets-row {
    display: flex;
    padding-bottom: 4px;
  }
  
  .my-pet-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin-right: 16px;
    opacity: 0.6;
    transition: all 0.3s;
    
    &.active {
      opacity: 1;
      transform: scale(1.05);
      
      .pet-avatar {
        border: 2px solid #FF8E3C;
      }
      
      .pet-name {
        color: #FF8E3C;
        font-weight: bold;
      }
    }
    
    .pet-avatar {
      width: 50px;
      height: 50px;
      border-radius: 25px;
      margin-bottom: 6px;
      border: 2px solid transparent;
      background-color: #f0f0f0;
    }
    
    .pet-name {
      font-size: 12px;
      color: #333;
    }
  }
}

.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 0 $spacing-lg 200rpx; // Bottom padding for footer
}

.nav-placeholder {
  height: var(--status-bar-height);
  width: 100%;
}

.page-header {
  margin: $spacing-md 0 $spacing-lg;
  
  .title {
    font-size: 48rpx;
    font-weight: 800;
    color: $color-text-main;
    display: block;
    margin-bottom: 8rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: $color-text-secondary;
  }
}

  /* Service Type Switch */
  .service-type-switch {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    
    .switch-item {
      flex: 1;
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      position: relative;
      border: 2px solid transparent;
      transition: all 0.3s;
      
      .icon {
        font-size: 28px;
        margin-right: 12px;
      }
      
      .info {
        flex: 1;
        .label {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          display: block;
        }
        .desc {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }
      }
      
      .check-mark {
        position: absolute;
        top: 8px;
        right: 8px;
        color: #FF8E3C;
        font-weight: bold;
      }
      
      &.feeding.active {
        border-color: #FF8E3C;
        background: #FFF0E5;
        .label { color: #FF8E3C; }
      }
      
      &.walking.active {
        border-color: #4CAF50; // Use Green for Walking to distinguish
        background: #E8F5E9;
        .check-mark { color: #4CAF50; }
        .label { color: #4CAF50; }
      }
    }
  }

  .card-section {
    background: #FFF;
    border-radius: $radius-xl;
    padding: 32rpx;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-card;
  
    .section-header {
      margin-bottom: 24rpx;
      
      .section-title {
        font-size: 32rpx;
        font-weight: 700;
        color: $color-text-main;
        margin-right: 16rpx;
      }
      
      .section-sub {
        font-size: 24rpx;
        color: $color-text-secondary;
      }
    }
  }

  .address-time-card {
    padding: 0; // Reset padding for this card
    
    .form-row {
      display: flex;
      align-items: center;
      padding: 32rpx;
      
      &:active {
        background: $color-bg-page;
      }
  
      &.compact {
        padding: 24rpx;
      }
      
      .icon-box {
        width: 72rpx;
        height: 72rpx;
        background: $color-bg;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 24rpx;
        font-size: 36rpx;
        
        &.location { background: rgba(255, 142, 60, 0.1); color: $color-primary; }
        &.time { background: rgba(24, 144, 255, 0.1); color: $color-blue; }
      }
      
      .row-content {
        flex: 1;
        
        .row-label {
          font-size: 24rpx;
          color: $color-text-secondary;
          margin-bottom: 8rpx;
        }
        
        .row-value {
          font-size: 32rpx;
          font-weight: 600;
          color: $color-text-main;
          
          &.placeholder {
            color: $color-text-placeholder;
            font-weight: 400;
          }
        }
      }
      
      .arrow {
        color: $color-text-placeholder;
        font-size: 32rpx;
      }
    }
    
    .divider {
      height: 1rpx;
      background: #F5F6F8;
      margin: 0 32rpx;
    }
    
    .time-selection-area {
       padding: 0 32rpx 32rpx;
       
       .time-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24rpx;
          
          .mode-switch {
             background: #f5f5f5;
             border-radius: 12rpx;
             padding: 8rpx 16rpx;
             font-size: 24rpx;
             color: #999;
             display: flex;
             align-items: center;
             
             text {
                padding: 4rpx 16rpx;
                border-radius: 8rpx;
                &.active {
                   background: #fff;
                   color: #333;
                   font-weight: bold;
                   box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
                }
             }
             .sep { padding: 0 8rpx; color: #ddd; }
          }
       }
       
       .date-display {
          background: #f9f9f9;
          padding: 24rpx;
          border-radius: 16rpx;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32rpx;
          
          .date-val { font-size: 32rpx; font-weight: 500; color: #333; }
          .icon { font-size: 36rpx; }
       }
       
       .multi-date-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32rpx;
          
          .date-box {
             background: #f9f9f9;
             padding: 16rpx 24rpx;
             border-radius: 16rpx;
             min-width: 200rpx;
             
             .lbl { font-size: 20rpx; color: #999; display: block; margin-bottom: 4rpx; }
             .val { font-size: 28rpx; font-weight: 500; color: #333; }
          }
          
          .arrow { color: #ccc; margin: 0 16rpx; }
       }
       
       .slots-container {
          .slots-scroll {
             width: 100%;
             white-space: nowrap;
          }
          .slots-row {
             display: flex;
             padding-bottom: 8rpx;
          }
          .time-slot {
             display: inline-block;
             padding: 12rpx 24rpx;
             background: #f5f5f5;
             border-radius: 12rpx;
             margin-right: 16rpx;
             font-size: 28rpx;
             color: #666;
             
             &.active {
                background: #333;
                color: #fff;
             }
          }
       }
    }
  }

  /* Duration Selector (Enhanced) */
  .duration-selector {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
    
    .duration-item {
      position: relative;
      background: #FAFAFA;
      border: 2rpx solid transparent;
      border-radius: 20rpx;
      padding: 30rpx 24rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s;
      
      &.active {
        border-color: #FF8E3C;
        background: #FFF0E5;
        box-shadow: 0 4rpx 12rpx rgba(255, 142, 60, 0.15);
        
        .num { color: #FF8E3C; }
        .unit { color: #FF8E3C; }
      }
      
      .d-val {
        display: flex;
        align-items: baseline;
        
        .num { font-size: 40rpx; font-weight: 800; color: #333; margin-right: 6rpx; letter-spacing: -1rpx; }
        .unit { font-size: 24rpx; color: #999; font-weight: 500; }
      }
      
      .d-price-tag {
        font-size: 22rpx;
        color: #999;
        background: #F0F0F0;
        padding: 6rpx 16rpx;
        border-radius: 100rpx;
        font-weight: 500;
        
        &.has-markup {
          color: #FF8E3C;
          background: rgba(255, 142, 60, 0.1);
        }
      }
      
      .check-icon {
        position: absolute;
        top: -12rpx;
        right: -12rpx;
        width: 36rpx;
        height: 36rpx;
        background: #FF8E3C;
        color: #fff;
        border-radius: 50%;
        font-size: 22rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 4rpx solid #fff;
        box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
      }
    }
  }
  
  .pet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  
  .pet-card {
    border: 2rpx solid transparent;
    background: #FAFAFA;
    border-radius: $radius-lg;
    padding: 24rpx 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &.active {
      border-color: $color-primary;
      background: rgba(255, 142, 60, 0.05);
      box-shadow: $shadow-sm;
      transform: translateY(-2rpx);
      
      .pet-name { color: $color-primary; font-weight: 700; }
    }
    
    .pet-icon {
      font-size: 56rpx;
      margin-bottom: 12rpx;
    }
    
    .pet-name {
      font-size: 26rpx;
      color: $color-text-main;
      margin-bottom: 4rpx;
      transition: color 0.3s;
    }
    
    .pet-desc {
      font-size: 20rpx;
      color: $color-text-secondary;
    }
    
    .pet-badge {
      position: absolute;
      top: -12rpx;
      right: -12rpx;
      background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
      color: #FFF;
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: $radius-full;
      box-shadow: 0 4rpx 8rpx rgba(255, 77, 79, 0.3);
      z-index: 1;
    }
  }
}



.addon-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  
  .addon-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-radius: $radius-lg;
    background: #FAFAFA;
    border: 2rpx solid transparent;
    transition: all 0.3s;
    
    &.active {
      border-color: $color-primary;
      background: rgba(255, 142, 60, 0.05);
      box-shadow: $shadow-sm;
      
      .checkbox {
        background: $color-primary;
        border-color: $color-primary;
        
        &::after {
          content: '✓';
          color: #FFF;
          font-size: 24rpx;
        }
      }
    }
    
    .addon-info {
      display: flex;
      flex-direction: column;
      
      .addon-name {
        font-size: 30rpx;
        color: $color-text-main;
        margin-bottom: 8rpx;
        font-weight: 500;
      }
      
      .addon-price {
        font-size: 26rpx;
        color: $color-primary;
        font-weight: 700;
      }
    }
    
    .checkbox {
      width: 44rpx;
      height: 44rpx;
      border: 2rpx solid #D9D9D9;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.2s;
    }
  }
}

.remark-box {
  .remark-input {
    width: 100%;
    min-height: 200rpx;
    background: #FAFAFA;
    border-radius: $radius-md;
    padding: 32rpx;
    font-size: 28rpx;
    color: $color-text-main;
    box-sizing: border-box;
    line-height: 1.6;
  }
}

.notice-section {
  padding: 0 $spacing-lg;
  margin-bottom: 60rpx;
  
  .notice-item {
    font-size: 24rpx;
    color: $color-text-secondary;
    margin-bottom: 16rpx;
    display: flex;
    align-items: center;
    opacity: 0.8;
  }
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -8rpx 32rpx rgba(0,0,0,0.05);
  z-index: 100;
  border-top: 1px solid rgba(0,0,0,0.03);

  .price-container {
    display: flex;
    flex-direction: column;

    .price-label {
      font-size: 24rpx;
      color: $color-text-secondary;
      margin-bottom: 4rpx;
    }

    .price-val {
      color: $color-primary;
      font-weight: 800;
      display: flex;
      align-items: baseline;
      
      .symbol { font-size: 32rpx; margin-right: 4rpx; }
      .amount { font-size: 56rpx; line-height: 1; }
    }
  }

  .btn-submit {
    margin: 0;
    width: 320rpx;
    height: 96rpx;
    line-height: 96rpx;
    background: linear-gradient(135deg, #FF8E3C 0%, #FF6B6B 100%);
    color: #FFF;
    border-radius: $radius-full;
    font-size: 34rpx;
    font-weight: 700;
    box-shadow: $shadow-float;
    
    &:active {
      transform: scale(0.98);
      opacity: 0.95;
    }
  }
}
</style>
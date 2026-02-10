<template>
  <view class="container">
    <view class="nav-placeholder"></view>
    
    <!-- Header -->
    <view class="page-header">
      <view class="header-top">
        <view class="back-btn" @click="goBack">
          <text class="back-arrow">←</text>
        </view>
        <text class="title">优惠中心</text>
      </view>
      <text class="subtitle">领取优惠券，享受更多折扣</text>
    </view>

    <!-- Tabs -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 0 }"
        @click="currentTab = 0"
      >
        我的优惠券
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 1 }"
        @click="currentTab = 1"
      >
        领券中心
      </view>
    </view>

    <!-- My Coupons -->
    <scroll-view scroll-y class="coupon-scroll" v-if="currentTab === 0">
      <view class="coupon-list">
        <view class="coupon-item" v-for="coupon in myCoupons" :key="coupon.id" :class="{ used: coupon.status !== 'UNUSED' }">
          <view class="coupon-left">
            <view class="amount-box">
              <text class="currency">¥</text>
              <text class="value">{{ coupon.value }}</text>
            </view>
            <text class="threshold">{{ coupon.threshold > 0 ? `满${coupon.threshold}可用` : '无门槛' }}</text>
          </view>
          <view class="coupon-right">
            <view class="info">
              <text class="name">{{ coupon.name }}</text>
              <text class="date">有效期至 {{ formatDate(coupon.expiresAt) }}</text>
            </view>
            <view class="status-badge" v-if="coupon.status !== 'UNUSED'">
              {{ coupon.status === 'USED' ? '已使用' : '已过期' }}
            </view>
            <button class="btn-use" v-else @click="goUse">去使用</button>
          </view>
          <view class="sawtooth-left"></view>
          <view class="sawtooth-right"></view>
        </view>
        
        <view class="empty-state" v-if="myCoupons.length === 0">
          <text>暂无优惠券</text>
        </view>
      </view>
    </scroll-view>

    <!-- Coupon Market (Templates) -->
    <scroll-view scroll-y class="coupon-scroll" v-else>
      <view class="coupon-list">
        <view class="coupon-item market" v-for="tpl in marketCoupons" :key="tpl.id">
          <view class="coupon-left">
            <view class="amount-box">
              <text class="currency" v-if="tpl.type === 'FIXED'">¥</text>
              <text class="value">{{ tpl.type === 'FIXED' ? tpl.value : tpl.value * 10 }}</text>
              <text class="currency" v-if="tpl.type === 'DISCOUNT'">折</text>
            </view>
            <text class="threshold">{{ tpl.min_spend > 0 ? `满${tpl.min_spend}可用` : '无门槛' }}</text>
          </view>
          <view class="coupon-right">
            <view class="info">
              <text class="name">{{ tpl.name }}</text>
              <text class="desc">{{ tpl.description || '全场通用' }}</text>
              <view class="progress-bar">
                <view class="progress" :style="{ width: getProgress(tpl) + '%' }"></view>
              </view>
              <text class="progress-text">已抢{{ getProgress(tpl) }}%</text>
            </view>
            <button class="btn-claim" :class="{ disabled: hasClaimed(tpl.id) }" @click="claimCoupon(tpl)">
              {{ hasClaimed(tpl.id) ? '已领取' : '立即领取' }}
            </button>
          </view>
          <view class="sawtooth-left"></view>
          <view class="sawtooth-right"></view>
        </view>

        <view class="empty-state" v-if="marketCoupons.length === 0">
          <text>暂无待领取优惠券</text>
        </view>
      </view>
    </scroll-view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/utils/supabase';

const userStore = useUserStore();
const currentTab = ref(0);
const marketCoupons = ref<any[]>([]);

const myCoupons = computed(() => {
  return userStore.userInfo?.coupons || [];
});

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString();
};

const goBack = () => {
  uni.navigateBack();
};

const goUse = () => {
  uni.switchTab({ url: '/pages/home/index' });
};

const fetchMarketCoupons = async () => {
  const { data, error } = await supabase
    .from('coupon_templates')
    .select('*')
    .eq('is_active', true)
    .gt('end_time', new Date().toISOString());
    
  if (data) {
    marketCoupons.value = data;
  }
};

const getProgress = (tpl: any) => {
  if (!tpl.total_quantity || tpl.total_quantity <= 0) return 50; // Unlimited
  return Math.min(100, Math.floor((tpl.issued_quantity / tpl.total_quantity) * 100));
};

const hasClaimed = (tplId: string) => {
  // Simple check: do I have a coupon with this name? 
  // Ideally, coupon table should link to template_id. 
  // Assuming 'name' is unique enough for MVP or checking simple logic.
  // Actually, standard schema should store template_id in coupons.
  // Checking current schema: public.coupons does NOT have template_id.
  // So we check by name match for now.
  return myCoupons.value.some(c => c.name === userStore.userInfo?.coupons?.find(u => u.name === marketCoupons.value.find(m => m.id === tplId)?.name)?.name);
};

const claimCoupon = async (tpl: any) => {
  if (hasClaimed(tpl.id)) return;
  if (!userStore.userInfo?.id) return uni.navigateTo({ url: '/pages/login/index' });

  uni.showLoading({ title: '领取中...' });
  
  // Create coupon record
  const newCoupon = {
    user_id: userStore.userInfo.id,
    type: tpl.type,
    value: tpl.value,
    threshold: tpl.min_spend,
    name: tpl.name,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    status: 'UNUSED'
  };

  const { data, error } = await supabase.from('coupons').insert(newCoupon).select().single();
  
  if (error) {
    uni.hideLoading();
    uni.showToast({ title: '领取失败', icon: 'none' });
  } else {
    // Optimistic update template count (not real transactional but ok for MVP)
    // Real app should use RPC `claim_coupon` to handle inventory and concurrency.
    // Here we just insert.
    
    // Refresh user info to get new coupon
    await userStore.refreshUserInfo();
    
    uni.hideLoading();
    uni.showToast({ title: '领取成功', icon: 'success' });
  }
};

onMounted(() => {
  fetchMarketCoupons();
});
</script>

<style lang="scss" scoped>
@import '@/styles/vars.scss';

.container {
  min-height: 100vh;
  background-color: #F8F9FA;
  padding-bottom: 40rpx;
}

.nav-placeholder {
  height: var(--status-bar-height);
}

.page-header {
  padding: 20rpx 40rpx 30rpx;
  background: #fff;
  
  .header-top {
    display: flex;
    align-items: center;
    margin-bottom: 10rpx;
    position: relative;
    
    .back-btn {
      padding: 10rpx 20rpx 10rpx 0;
      margin-right: 10rpx;
      
      .back-arrow {
        font-size: 40rpx;
        color: #333;
        font-weight: 300;
      }
    }
    
    .title {
      font-size: 40rpx;
      font-weight: bold;
      margin-bottom: 0;
    }
  }

  .subtitle {
    font-size: 26rpx;
    color: #999;
    padding-left: 60rpx; /* Align with title roughly */
  }
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #eee;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 30rpx 0;
    font-size: 30rpx;
    color: #666;
    position: relative;
    
    &.active {
      color: $color-primary;
      font-weight: 600;
      
      &:after {
        content: '';
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
}

.coupon-scroll {
  height: calc(100vh - 250rpx);
  padding: 30rpx;
  box-sizing: border-box;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.coupon-item {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
  
  &.market {
    .coupon-left {
      background: linear-gradient(135deg, #FF9966, #FF5E62);
    }
  }
  
  &.used {
    filter: grayscale(1);
    opacity: 0.6;
  }
  
  .coupon-left {
    width: 200rpx;
    background: linear-gradient(135deg, $color-primary, #FFA500);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    padding: 30rpx 0;
    
    .amount-box {
      display: flex;
      align-items: baseline;
      
      .currency { font-size: 28rpx; }
      .value { font-size: 56rpx; font-weight: bold; }
    }
    
    .threshold {
      font-size: 22rpx;
      opacity: 0.9;
      margin-top: 8rpx;
    }
  }
  
  .coupon-right {
    flex: 1;
    padding: 24rpx 30rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    .name {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }
    
    .date, .desc {
      font-size: 22rpx;
      color: #999;
      margin-top: 8rpx;
    }
    
    .btn-use {
      align-self: flex-end;
      font-size: 24rpx;
      color: $color-primary;
      background: rgba($color-primary, 0.1);
      border-radius: 24rpx;
      padding: 8rpx 24rpx;
      line-height: 1.5;
      margin: 0;
      
      &:after { border: none; }
    }
    
    .btn-claim {
      align-self: flex-end;
      font-size: 24rpx;
      color: #fff;
      background: $color-primary;
      border-radius: 24rpx;
      padding: 10rpx 30rpx;
      line-height: 1.5;
      margin: 0;
      
      &.disabled {
        background: #ccc;
      }
      
      &:after { border: none; }
    }
    
    .progress-bar {
      height: 8rpx;
      background: #f0f0f0;
      border-radius: 4rpx;
      margin-top: 16rpx;
      overflow: hidden;
      width: 80%;
      
      .progress {
        height: 100%;
        background: #FF5E62;
        border-radius: 4rpx;
      }
    }
    
    .progress-text {
      font-size: 20rpx;
      color: #999;
      margin-top: 4rpx;
    }
    
    .status-badge {
      align-self: flex-end;
      font-size: 24rpx;
      color: #999;
      border: 1rpx solid #ddd;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
    }
  }
  
  .sawtooth-left, .sawtooth-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 20rpx;
    height: 20rpx;
    background: #F8F9FA; // Match page bg
    border-radius: 50%;
    z-index: 2;
  }
  .sawtooth-left { left: -10rpx; }
  .sawtooth-right { right: -10rpx; }
}

.empty-state {
  padding: 60rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
</style>
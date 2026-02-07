<template>
  <view :class="['container', isOwner ? 'theme-owner' : 'theme-sitter']">
    <!-- 顶部导航栏占位 (沉浸式) -->
    <view class="nav-placeholder"></view>

    <!-- 头部区域 -->
    <view class="header-section">
      <view class="header-row">
        <view class="user-welcome">
          <text class="username">{{ userStore.userInfo?.nickname || '铲屎官' }}</text>
        </view>
        <view class="location-badge" @click="handleLocationClick">
          <text class="icon">📍</text>
          <text>{{ locationName }}</text>
        </view>
      </view>
    </view>

    <!-- 铲屎官视图 -->
    <view v-if="isOwner">
      <!-- 顶部 Banner -->
      <view class="banner-swiper">
        <swiper class="swiper" autoplay circular interval="5000" duration="500">
          <swiper-item>
            <view class="banner-item banner-1" @click="handleClaimCoupon">
              <view class="banner-content">
                <text class="banner-tag">新人专享</text>
                <text class="banner-title">首单立减 ¥30</text>
                <text class="banner-sub">专业宠托，安心无忧</text>
                <button class="banner-btn">立即领取</button>
              </view>
              <view class="banner-img">🎁</view>
            </view>
          </swiper-item>
          <swiper-item>
            <view class="banner-item banner-2">
              <view class="banner-content">
                <text class="banner-tag">假期预售</text>
                <text class="banner-title">春节上门喂养</text>
                <text class="banner-sub">提前预约，不再拥挤</text>
                <button class="banner-btn">去看看</button>
              </view>
              <view class="banner-img">🧧</view>
            </view>
          </swiper-item>
        </swiper>
      </view>
      
      <!-- 核心服务 -->
      <view class="section-container">
        <view class="section-header">
          <text class="title">选择服务</text>
          <text class="more">全部服务 ></text>
        </view>
        
        <view class="service-grid">
          <!-- 上门喂养 -->
          <view class="service-card feed" @click="selectService('FEEDING')">
            <view class="card-bg-decoration"></view>
            <view class="card-info">
              <view class="card-header">
                <text class="card-name">上门喂养</text>
                <view class="hot-badge">HOT</view>
              </view>
              <text class="card-desc">专业喂食 · 铲屎 · 陪玩</text>
              <view class="card-tags">
                <text>猫咪</text>
                <text>小宠</text>
              </view>
            </view>
            <view class="card-icon">
              <!-- 使用混合模式消除背景色，同时使用圆角 -->
              <image 
                src="https://imgus.tangbuy.com/static/images/2026-02-07/1f7527725fb54136931c6bf2919e7e0e-177045402956211314871683841080806.jpeg" 
                mode="aspectFill" 
                class="icon-img mix-blend" 
              />
            </view>
          </view>

          <!-- 上门遛宠 -->
          <view class="service-card walk" @click="selectService('WALKING')">
            <view class="card-bg-decoration"></view>
            <view class="card-info">
              <view class="card-header">
                <text class="card-name">上门遛宠</text>
              </view>
              <text class="card-desc">专业遛狗 · 运动 · 捡屎</text>
              <view class="card-tags">
                <text>狗狗</text>
              </view>
            </view>
            <view class="card-icon">
              <image 
                src="https://imgus.tangbuy.com/static/images/2026-02-07/6dd4699cc43b4845906dc5911a6f6b11-177045526494810424765923383103569.jpeg" 
                mode="aspectFill" 
                class="icon-img" 
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 平台保障 -->
      <view class="section-container">
        <view class="section-header">
          <text class="title">平台保障</text>
        </view>
        <view class="guarantee-scroll">
          <view class="guarantee-card">
            <view class="icon-box">🛡️</view>
            <text class="g-title">实名认证</text>
            <text class="g-desc">宠托师身份核验</text>
          </view>
          <view class="guarantee-card">
            <view class="icon-box">🏥</view>
            <text class="g-title">专业保险</text>
            <text class="g-desc">全程意外保障</text>
          </view>

          <view class="guarantee-card">
            <view class="icon-box">🎓</view>
            <text class="g-title">专业培训</text>
            <text class="g-desc">持证上岗服务</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 宠托师视图 (接单大厅) -->
    <view v-else class="sitter-view">
      <!-- Sitter Action Banner -->
      <view class="sitter-action-card" @click="handlePublishAvailability">
        <view class="action-info">
          <text class="action-title">发布接单意向</text>
          <text class="action-desc">展示擅长宠物、空闲时间与服务区域</text>
        </view>
        <view class="action-btn">去发布</view>
      </view>

      <view class="section-container">
        <view class="hall-header">
           <text class="title">任务大厅</text>
           <text class="subtitle">附近 {{ processedOrders.length }} 个任务</text>
        </view>
        
        <!-- Filter/Sort Bar -->
        <view class="filter-bar">
           <view class="sort-options">
              <view 
                class="sort-item" 
                :class="{ active: currentSort === 'distance' }"
                @click="setSort('distance')"
              >距离优先</view>
              <view 
                class="sort-item" 
                :class="{ active: currentSort === 'amount' }"
                @click="setSort('amount')"
              >金额最高</view>
              <view 
                class="sort-item" 
                :class="{ active: currentSort === 'date' }"
                @click="setSort('date')"
              >最新发布</view>
           </view>
           <view class="filter-options">
               <!-- Simple toggle for Service Type -->
               <view class="filter-btn" @click="toggleFilter">
                  <text>{{ currentFilter === 'all' ? '全部服务' : currentFilter === ServiceType.FEEDING ? '只看喂养' : '只看遛宠' }}</text>
                  <text class="icon">▼</text>
               </view>
           </view>
        </view>

        <view v-if="processedOrders.length === 0" class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂时没有新任务</text>
          <text class="empty-sub">休息一下，稍后再来刷刷看~</text>
        </view>

        <view v-else class="task-list">
          <view 
            class="task-card" 
            v-for="order in processedOrders" 
            :key="order.id"
          >
            <view class="task-header">
              <view class="task-type">
                <text class="type-tag">{{ order.serviceType === ServiceType.FEEDING ? '上门喂养' : '上门遛宠' }}</text>
                <text class="distance-tag">📍 {{ getDistance(order.id) }}km</text>
              </view>
              <text class="price">¥{{ order.totalPrice }}</text>
            </view>
            
            <view class="task-body">
              <view class="info-row">
                <text class="label">时间：</text>
                <text class="value highlight">{{ order.time }}</text>
              </view>
              <view class="info-row">
                <text class="label">宠物：</text>
                <text class="value">{{ order.petSize === 'SMALL' ? '小型' : order.petSize === 'MEDIUM' ? '中型' : '大型' }}宠物</text>
              </view>
              <view class="info-row">
                <text class="label">地址：</text>
                <text class="value">{{ order.address }}</text>
              </view>
              <view class="info-row" v-if="order.remark">
                <text class="label">备注：</text>
                <text class="value">{{ order.remark }}</text>
              </view>
            </view>
            
            <button class="btn-accept" @click="handleAcceptOrder(order.id)">抢单</button>
          </view>
        </view>
      </view>
    </view>

  </view>
  <view style="height: 50px;"></view>
  <CustomTabBar current-path="pages/home/index" />
</template>

<script setup lang="ts">
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { ref, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { ServiceType } from '@/constants/pet';
import { getCurrentLocation } from '@/utils/location';
import { useUserStore } from '@/stores/user';
import { useOrderStore } from '@/stores/order';

const userStore = useUserStore();
const orderStore = useOrderStore();

const locationName = ref('点击定位');
const isMounted = ref(false);

type SortType = 'distance' | 'amount' | 'date';
const currentSort = ref<SortType>('distance');
const currentFilter = ref<ServiceType | 'all'>('all');
const orderDistances = ref<Record<string, number>>({});

const isOwner = computed(() => userStore.userInfo?.role === 'owner');

const getDistance = (orderId: string) => {
  if (!orderDistances.value[orderId]) {
    // Generate deterministic "random" distance based on orderId hash
    // This ensures the distance remains the same for the same orderId across re-renders
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) {
      hash = ((hash << 5) - hash) + orderId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const absHash = Math.abs(hash);
    // Map to range 0.1 - 5.0 km
    const distance = (absHash % 50) / 10 + 0.1;
    orderDistances.value[orderId] = parseFloat(distance.toFixed(1));
  }
  return orderDistances.value[orderId];
}

const processedOrders = computed(() => {
  let orders = [...orderStore.orders.filter(order => order.status === 'PENDING')];

  // Filter
  if (currentFilter.value !== 'all') {
    orders = orders.filter(o => o.serviceType === currentFilter.value);
  }

  // Sort
  return orders.sort((a, b) => {
    if (currentSort.value === 'distance') {
       return getDistance(a.id) - getDistance(b.id);
    } else if (currentSort.value === 'amount') {
       return b.totalPrice - a.totalPrice; // Higher first
    } else if (currentSort.value === 'date') {
       return new Date(b.time).getTime() - new Date(a.time).getTime(); // Newest first
    }
    return 0;
  });
});

const setSort = (type: SortType) => {
    currentSort.value = type;
}

const toggleFilter = () => {
    if (currentFilter.value === 'all') currentFilter.value = ServiceType.FEEDING;
    else if (currentFilter.value === ServiceType.FEEDING) currentFilter.value = ServiceType.WALKING;
    else currentFilter.value = 'all';
}

const handleClaimCoupon = () => {
  uni.showModal({
    title: '领取成功',
    content: '已放到我的优惠',
    cancelText: '稍后使用',
    confirmText: '发布任务',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: '/pages/publish/index'
        });
      }
    }
  });
};

// 页面显示时加载数据
onShow(() => {
  isMounted.value = true;
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }

  // 刷新订单数据
  orderStore.loadOrders();

  // 尝试自动定位
  if (locationName.value === '点击定位') {
    getCurrentLocation()
      .then(res => {
        if (!isMounted.value) return; // Prevent updating if unmounted
        if (res.name) {
          locationName.value = res.name;
        }
      })
      .catch(() => {
        if (!isMounted.value) return;
        // 定位失败保持默认文案
        console.log('自动定位失败，等待用户手动点击');
      });
  }
});

onUnload(() => {
  isMounted.value = false;
});

const handleLocationClick = () => {
    uni.chooseLocation({
      success: (res) => {
        console.log('Location chosen:', res);
        locationName.value = res.name || res.address;
      },
      fail: (err) => {
        console.error('Choose location failed:', err.errMsg || err);
        // #ifdef H5
        // H5平台特殊处理
        if (err.errMsg && (err.errMsg.includes('auth denied') || err.errMsg.includes('denied'))) {
            uni.showModal({
                title: '定位权限受限',
                content: '请在浏览器地址栏左侧点击锁图标，允许获取位置信息，或者检查系统定位开关。',
                showCancel: false
            });
        } else if (err.errMsg && err.errMsg.includes('cancel')) {
            // 用户取消，不做处理
        } else {
            // 其他错误（如Key配置问题）
            uni.showToast({
                title: '打开地图失败，请检查网络或配置',
                icon: 'none'
            });
        }
        // #endif

        // #ifndef H5
        uni.getSetting({
          success: (settingRes) => {
             if (settingRes.authSetting['scope.userLocation'] === false) {
               uni.showModal({
                 title: '提示',
                 content: '需要获取您的位置信息，请在设置中打开',
                 success: (modalRes) => {
                   if (modalRes.confirm) uni.openSetting();
                 }
               });
             }
          }
        });
        // #endif
      }
    });
  };

const handlePublishAvailability = () => {
  if (!userStore.userInfo?.sitterProfile?.isCertified) {
    uni.showModal({
      title: '未认证',
      content: '发布接单意向需要先完成宠托师认证',
      confirmText: '去认证',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/profile/certification' });
        }
      }
    });
    return;
  }
  
  uni.navigateTo({
    url: '/pages/publish/sitter'
  });
};

const selectService = (type: ServiceType | string) => {
  uni.navigateTo({
    url: `/pages/publish/index?serviceType=${type}`
  });
};

const handleAcceptOrder = async (orderId: string) => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  
  if (!userStore.userInfo) return;

  if (await orderStore.acceptOrder(orderId, userStore.userInfo)) {
    uni.showToast({
      title: '抢单成功！',
      icon: 'success'
    });
    // 抢单成功后，可以跳转到订单详情或列表
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 1500);
  } else {
    uni.showToast({
      title: '抢单失败，可能已被抢走',
      icon: 'none'
    });
  }
};
</script>

<style lang="scss" scoped>
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(15deg); }
  50% { transform: translateY(-12rpx) rotate(15deg); }
}

.container {
  min-height: 100vh;
  padding-bottom: 40rpx;
  transition: background-color 0.3s;
  
  &.theme-owner {
    background-color: $color-bg-page;
  }
  
  &.theme-sitter {
    background-color: #F5F7FA; // 冷色调背景
    
    // 覆盖 header 区域样式适应深色主题
    :deep(.header-section) {
      .user-welcome .username {
        color: #2C3E50;
      }
    }
  }
}

.nav-placeholder {
  height: var(--status-bar-height);
  width: 100%;
}

.header-section {
  padding: 20rpx 30rpx 0;
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
  }

  .user-welcome {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    margin-right: $spacing-md;
    
    .username {
      font-size: 44rpx;
      font-weight: 800;
      color: $color-text-main;
      @include text-ellipsis;
      display: block;
    }
  }

  .location-badge {
    background: rgba(255, 255, 255, 0.8);
    padding: 12rpx 24rpx;
    border-radius: $radius-full;
    font-size: 24rpx;
    color: $color-text-main;
    font-weight: 600;
    display: flex;
    align-items: center;
    box-shadow: $shadow-sm;
    backdrop-filter: blur(10px);
    max-width: 40%;

    .icon {
      margin-right: 8rpx;
      flex-shrink: 0;
    }

    & > text:last-child {
      flex: 1;
      min-width: 0;
      @include text-ellipsis;
    }
  }
}

.banner-swiper {
  padding: 0 $spacing-lg;
  height: 380rpx;
  margin-bottom: $spacing-xl;
  
  .swiper {
    height: 100%;
    border-radius: $radius-xl;
    overflow: hidden;
    transform: translateY(0); // Fix iOS radius clipping
    box-shadow: $shadow-lg;
  }
  
  .banner-item {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 56rpx;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    &.banner-1 {
      background: linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%);
      
      .banner-tag { background: rgba(255,255,255,0.2); color: #FFF; backdrop-filter: blur(10px); }
      .banner-title { color: #FFF; }
      .banner-sub { color: rgba(255,255,255,0.8); }
      .banner-btn { background: #FFF; color: #2C3E50; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15); }
    }
    
    &.banner-2 {
      background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
      
      .banner-tag { background: rgba(255, 77, 79, 0.1); color: #FF4D4F; }
      .banner-title { color: #5D3A3A; }
      .banner-sub { color: rgba(93, 58, 58, 0.7); }
      .banner-btn { background: #5D3A3A; color: #FFF; box-shadow: 0 8rpx 24rpx rgba(93, 58, 58, 0.2); }
    }

    .banner-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      z-index: 2;

      .banner-tag {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        margin-bottom: 16rpx;
        font-weight: 600;
      }

      .banner-title {
        font-size: 40rpx;
        font-weight: 800;
        margin-bottom: 8rpx;
        line-height: 1.2;
      }

      .banner-sub {
        font-size: 24rpx;
        margin-bottom: 32rpx;
      }

      .banner-btn {
        margin: 0;
        font-size: 24rpx;
        padding: 0 32rpx;
        height: 60rpx;
        line-height: 60rpx;
        border-radius: $radius-full;
        font-weight: 600;
      }
    }

    .banner-img {
      font-size: 140rpx;
      transform: rotate(15deg);
      filter: drop-shadow(0 20rpx 30rpx rgba(0,0,0,0.15));
      animation: float 4s ease-in-out infinite;
    }
  }
}

.sitter-action-card {
  margin: 0 $spacing-lg $spacing-lg;
  background: linear-gradient(135deg, #FFF0E5 0%, #FFFFFF 100%);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: $shadow-sm;
  border: 1px solid rgba(255, 142, 60, 0.1);

  .action-info {
    flex: 1;
    margin-right: $spacing-md;
    
    .action-title {
      font-size: 32rpx;
      font-weight: bold;
      color: $color-text-main;
      margin-bottom: 8rpx;
      display: block;
    }
    
    .action-desc {
      font-size: 24rpx;
      color: $color-text-secondary;
    }
  }

  .action-btn {
    background: $color-primary;
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    padding: 12rpx 32rpx;
    border-radius: $radius-full;
    box-shadow: 0 4rpx 12rpx rgba(255, 142, 60, 0.3);
  }
}

.section-container {
  padding: 0 $spacing-lg;
  margin-bottom: $spacing-xl;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;

  .title {
    font-size: 36rpx;
    font-weight: 800;
    color: $color-text-main;
  }

  .more {
    font-size: 26rpx;
    color: $color-text-secondary;
  }
}

.service-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.service-card {
  height: 220rpx;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: $radius-lg;
  position: relative;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 0 48rpx;
  transition: transform 0.2s, box-shadow 0.2s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }

  .card-bg-decoration {
    position: absolute;
    top: -40%;
    right: -15%;
    width: 320rpx;
    height: 320rpx;
    border-radius: 50%;
    opacity: 0.12;
    z-index: 0;
    filter: blur(40rpx);
  }

  &.feed {
    .card-bg-decoration { background: $color-primary; }
    .card-icon { background: $color-primary-light; }
  }

  &.walk {
    .card-bg-decoration { background: $color-blue; }
    .card-icon { background: #E6F7FF; }
  }

  .card-info {
    flex: 1;
    z-index: 1;
    display: flex;
    flex-direction: column;

    .card-header {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      .card-name {
        font-size: 36rpx;
        font-weight: 800;
        color: $color-text-main;
        margin-right: 16rpx;
      }

      .hot-badge {
        background: linear-gradient(90deg, #FF6B6B 0%, #FF8E3C 100%);
        color: #FFF;
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: $radius-full;
        font-weight: 800;
        transform: skewX(-10deg);
      }
    }

    .card-desc {
      font-size: 26rpx;
      color: $color-text-secondary;
      margin-bottom: 24rpx;
    }

    .card-tags {
      display: flex;
      gap: 12rpx;
      
      text {
        font-size: 22rpx;
        color: $color-text-regular;
        background: $color-bg;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
      }
    }
  }

  .card-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 60rpx;
    margin-left: 24rpx;
    z-index: 1;
    overflow: hidden;
    
    .icon-img {
      width: 100%;
      height: 100%;
      
      &.mix-blend {
        mix-blend-mode: multiply;
        border-radius: 50%;
      }
    }
  }
}

.guarantee-scroll {
  display: flex;
  overflow-x: auto;
  gap: $spacing-md;
  padding-bottom: 20rpx; // Space for shadow
  margin: 0 -20rpx; // Negative margin for edge-to-edge scroll
  padding: 0 20rpx 20rpx;

  .guarantee-card {
    flex-shrink: 0;
    width: 200rpx;
    height: 240rpx;
    background: #FFF;
    border-radius: $radius-md;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-sm;

    .icon-box {
      width: 80rpx;
      height: 80rpx;
      background: $color-bg;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 40rpx;
      margin-bottom: 24rpx;
    }

    .g-title {
      font-size: 26rpx;
      font-weight: 700;
      color: $color-text-main;
      margin-bottom: 8rpx;
    }

    .g-desc {
      font-size: 20rpx;
      color: $color-text-secondary;
    }
  }
}

// 宠托师视图样式
.sitter-view {
  .hall-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: $spacing-md;
    
    .title {
      font-size: 36rpx;
      font-weight: 800;
      color: $color-text-main;
    }
    
    .subtitle {
      font-size: 24rpx;
      color: $color-text-secondary;
    }
  }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    background: #FFF;
    padding: 16rpx 20rpx;
    border-radius: $radius-md;
    box-shadow: $shadow-sm;
    
    .sort-options {
      display: flex;
      gap: 24rpx;
      
      .sort-item {
        font-size: 26rpx;
        color: $color-text-secondary;
        position: relative;
        padding-bottom: 4rpx;
        
        &.active {
          color: $color-primary;
          font-weight: 600;
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 20rpx;
            height: 4rpx;
            background: $color-primary;
            border-radius: 2rpx;
          }
        }
      }
    }
    
    .filter-options {
      .filter-btn {
        display: flex;
        align-items: center;
        gap: 4rpx;
        font-size: 26rpx;
        color: $color-text-main;
        background: $color-bg;
        padding: 8rpx 16rpx;
        border-radius: $radius-sm;
        
        .icon {
          font-size: 20rpx;
          color: $color-text-secondary;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
    
    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 24rpx;
    }
    
    .empty-text {
      font-size: 32rpx;
      font-weight: 600;
      color: $color-text-main;
      margin-bottom: 12rpx;
    }
    
    .empty-sub {
      font-size: 26rpx;
      color: $color-text-secondary;
    }
  }
  
  .task-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    
    .task-card {
      background: #FFF;
      border-radius: 24rpx;
      padding: 30rpx;
      box-shadow: $shadow-card;
      
      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24rpx;
        padding-bottom: 24rpx;
        border-bottom: 1px solid rgba(0,0,0,0.03);
        
        .task-type {
          display: flex;
          align-items: center;
          gap: 16rpx;
          
          .type-tag {
            font-size: 28rpx;
            font-weight: 700;
            color: $color-text-main;
          }
          
          .distance-tag {
            font-size: 22rpx;
            color: $color-text-secondary;
            background: $color-bg;
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
          }
        }
        
        .price {
          font-size: 44rpx;
          font-weight: 900;
          color: #FF6B6B;
          text-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.15);
        }
      }
      
      .task-body {
        margin-bottom: 30rpx;
        
        .info-row {
          display: flex;
          margin-bottom: 12rpx;
          font-size: 26rpx;
          
          .label {
            color: $color-text-secondary;
            width: 90rpx;
            flex-shrink: 0;
          }
          
          .value {
            color: $color-text-main;
            flex: 1;
            @include text-ellipsis;

            &.highlight {
              color: $color-primary;
              font-weight: 600;
              background: rgba(255, 142, 60, 0.1);
              padding: 0 8rpx;
              border-radius: 4rpx;
            }
          }
        }
      }
      
      .btn-accept {
        width: 100%;
        height: 80rpx;
        line-height: 80rpx;
        background: linear-gradient(135deg, #4CA1AF 0%, #2C3E50 100%);
        color: #FFF;
        font-size: 28rpx;
        font-weight: 600;
        border-radius: 40rpx;
        border: none;
        
        &:active {
          opacity: 0.9;
        }
      }
    }
  }
}
</style>

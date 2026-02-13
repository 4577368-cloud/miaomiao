<template>
  <view :class="['container', isOwner ? 'theme-owner' : 'theme-sitter']">
    <!-- 顶部导航栏占位 (沉浸式) -->
    <view class="nav-placeholder"></view>

    <!-- 头部区域 -->
    <view class="header-section">
      <view class="header-row">
        <view class="user-welcome">
          <text class="username">{{ userStore.userInfo?.nickname || '铲屎官' }}</text>
          <view class="role-switch-badge" v-if="!isOwner" @click="handleQuickSwitch">
            <text class="icon">🔄</text>
            <text>切换雇主</text>
          </view>
        </view>
        <view class="location-badge" @click="handleLocationClick">
          <text class="icon">📍</text>
          <text>{{ locationName }}</text>
        </view>
      </view>
    </view>

    <view class="notice-banner" v-if="bannerMessages.length > 0" @click="handleBannerClick">
      <view class="banner-left">
        <text class="icon">🔔</text>
      </view>
      <view class="banner-content-wrapper">
        <swiper class="banner-swiper-vertical" vertical autoplay circular interval="4000" duration="500" @click.stop="handleBannerClick">
          <swiper-item v-for="msg in bannerMessages" :key="msg.id" @click.stop="showAnnouncementDetail(msg)">
            <view class="notice-banner-item">
              <text class="notice-banner-title" :class="getTitleScrollClass(msg.title)">{{ msg.title }}</text>
            </view>
          </swiper-item>
        </swiper>
      </view>
      <view class="banner-right">
        <text class="banner-arrow">›</text>
      </view>
    </view>
    <!-- 铲屎官视图 -->
    <view v-if="isOwner">
      <!-- 顶部 Banner -->
      <view class="banner-swiper">
        <swiper class="swiper" autoplay circular interval="5000" duration="500">
          <swiper-item v-for="b in homeBanners" :key="b.id">
            <view class="banner-item" @click="handleBannerAction(b)">
              <image :src="b.image_url" mode="aspectFill" style="position:absolute;left:0;top:0;width:100%;height:100%;" />
              <view style="position:absolute;left:24rpx;bottom:24rpx;background:rgba(0,0,0,0.35);padding:8rpx 12rpx;border-radius:12rpx;">
                <text style="color:#fff;font-size:28rpx;">{{ b.title }}</text>
              </view>
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
                src="/static/logo.png" 
                mode="aspectFill" 
                class="icon-img mix-blend" 
                @error="handleImageError($event, 'https://via.placeholder.com/120x120/FF8E3C/FFFFFF?text=🐱')"
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
                src="/static/logo.png" 
                mode="aspectFill" 
                class="icon-img" 
                @error="handleImageError($event, 'https://via.placeholder.com/120x120/4CAF50/FFFFFF?text=🐶')"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 优惠专区 -->
      <view class="section-container">
        <view class="section-header">
          <text class="title">优惠专区</text>
          <text class="more" @click="goToCouponCenter">更多好券 ></text>
        </view>
        <view class="coupon-grid">
          <view class="coupon-card" v-for="tpl in couponTemplates" :key="tpl.id">
            <!-- 左侧金额区域 -->
            <view class="coupon-left">
              <view class="amount">
                <text class="symbol" v-if="tpl.type === 'FIXED'">¥</text>
                <text>{{ tpl.type === 'FIXED' ? tpl.value : tpl.value * 10 }}</text>
                <text class="symbol" v-if="tpl.type === 'DISCOUNT'">折</text>
              </view>
              <text class="condition">满{{ tpl.min_spend || 0 }}可用</text>
            </view>
            
            <!-- 右侧信息区域 -->
            <view class="coupon-right">
              <view class="info">
                <text class="name">{{ tpl.name }}</text>
                <text class="desc">领取后30天内有效</text>
              </view>
              <button class="btn-claim" @click="claimCouponTemplate(tpl)">立即领取</button>
            </view>
          </view>
          
          <view v-if="couponTemplates.length === 0" class="empty-coupon">
            <text>暂无活动优惠</text>
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
  <view style="height: 100px;"></view>
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
import { supabase } from '@/utils/supabase';

const userStore = useUserStore();
const orderStore = useOrderStore();

// 图片错误处理函数
const handleImageError = (event: any, fallbackUrl: string) => {
  if (event && event.target) {
    event.target.src = fallbackUrl;
  }
};

const locationName = ref('点击定位');
const isMounted = ref(false);
const bannerMessages = ref<any[]>([]);
const homeBanners = ref<any[]>([]);
const couponTemplates = ref<any[]>([]);

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
  // Filter for PENDING orders that haven't been assigned a sitter yet
  let orders = [...orderStore.orders.filter(order => 
    order.status === 'PENDING' && !order.sitterId
  )];

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

const handleQuickSwitch = async () => {
  uni.showLoading({ title: '切换中...' });
  try {
    await userStore.switchRole('owner');
    uni.showToast({ title: '已切换为铲屎官', icon: 'success' });
  } catch (e) {
    // switchRole handles errors internally usually
  } finally {
    uni.hideLoading();
  }
};

const setSort = (type: SortType) => {
    currentSort.value = type;
}

const toggleFilter = () => {
    if (currentFilter.value === 'all') currentFilter.value = ServiceType.FEEDING;
    else if (currentFilter.value === ServiceType.FEEDING) currentFilter.value = ServiceType.WALKING;
    else currentFilter.value = 'all';
}

const handleClaimCoupon = async () => {
  if (!userStore.isLoggedIn) {
     uni.navigateTo({ url: '/pages/login/index' });
     return;
  }

  uni.showLoading({ title: '领取中...' });
  const success = await userStore.claimNewcomerCoupon();
  uni.hideLoading();

  if (success) {
    uni.showModal({
      title: '领取成功',
      content: '新人专享红包（¥30）已放入您的账户',
      cancelText: '稍后使用',
      confirmText: '去发布',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/publish/index'
          });
        }
      }
    });
  } else {
    uni.showToast({ title: '领取失败，请稍后重试', icon: 'none' });
  }
};

// 检查公告标题是否需要滚动
const isTitleOverflow = (title: string) => {
  // 估算中文字符宽度，大约每个字符28rpx，加上一些边距
  const charWidth = 28;
  const maxWidth = 400; // banner-content-wrapper的最大宽度
  return title.length * charWidth > maxWidth;
};

// 获取公告标题的滚动动画类名
const getTitleScrollClass = (title: string) => {
  return isTitleOverflow(title) ? 'scroll-title' : '';
};

const refreshBanner = () => {
  bannerMessages.value = userStore.getUnreadNotifications();
};

// 显示所有公告
const showAllAnnouncements = () => {
  uni.switchTab({ url: '/pages/message/index' });
};

// 显示公告详情
const showAnnouncementDetail = (announcement: any) => {
  if (!announcement?.id) return;

  // 1. 认证通知：直接跳转认证页
  if (String(announcement.id).startsWith('cert_')) {
    userStore.markNotificationRead(announcement.id);
    refreshBanner();
    uni.navigateTo({ url: '/pages/profile/certification' });
    return;
  }

  // 2. 订单通知：直接跳转订单详情
  if (announcement.type === 'order' && announcement.orderId) {
    userStore.markNotificationRead(announcement.id);
    refreshBanner();
    uni.navigateTo({ url: `/pages/order-detail/index?id=${announcement.orderId}` });
    return;
  }

  // 3. 系统公告：弹窗显示，点击确认后标记已读（当天不再显示）
  uni.showModal({
    title: announcement.title,
    content: announcement.content,
    showCancel: false,
    confirmText: '知道了',
    success: () => {
      userStore.markNotificationRead(announcement.id);
      refreshBanner();
      if (announcement.link) {
        openLink(announcement.link);
      }
    }
  });
};

const openLink = (link?: string) => {
  if (!link) return;
  const tabPages = ['/pages/home/index', '/pages/orders/index', '/pages/profile/index', '/pages/message/index', '/pages/wallet/index'];
  if (tabPages.includes(link)) {
    uni.switchTab({ url: link });
  } else {
    uni.navigateTo({ url: link });
  }
};

const goToCouponCenter = () => {
  uni.navigateTo({ url: '/pages/coupon/index' });
};

const handleBannerAction = async (b: any) => {
  if (!b || !b.action_type) return;
  if (b.action_type === 'link') {
    const link = b.action_payload?.link || '';
    if (link) openLink(link);
  } else if (b.action_type === 'announcement') {
    uni.switchTab({ url: '/pages/message/index' });
  } else if (b.action_type === 'coupon') {
    if (!userStore.userInfo?.id) {
      uni.navigateTo({ url: '/pages/login/index' });
      return;
    }
    const tplId = b.action_payload?.coupon_template_id;
    if (!tplId) return;
    const { data: tpl } = await supabase.from('coupon_templates').select('*').eq('id', tplId).single();
    if (!tpl) return;
    const { error } = await supabase.from('coupons').insert({
      user_id: userStore.userInfo.id,
      name: tpl.name,
      type: tpl.type,
      value: tpl.value,
      threshold: tpl.min_spend || 0,
      start_time: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'UNUSED'
    });
    if (!error) uni.showToast({ title: '已领取', icon: 'success' });
  }
};

const loadHomeBanners = async () => {
  const { data } = await supabase.rpc('get_active_banners');
  homeBanners.value = data || [];
};

const loadCouponTemplates = async () => {
  const { data } = await supabase.from('coupon_templates').select('*').eq('is_active', true);
  couponTemplates.value = data || [];
};

const claimCouponTemplate = async (tpl: any) => {
  if (!userStore.userInfo?.id) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  const { error } = await supabase.from('coupons').insert({
    user_id: userStore.userInfo.id,
    name: tpl.name,
    type: tpl.type,
    value: tpl.value,
    threshold: tpl.min_spend || 0,
    start_time: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'UNUSED'
  });
  if (error) {
    uni.showToast({ title: '领取失败', icon: 'none' });
  } else {
    uni.showToast({ title: '已领取', icon: 'success' });
  }
};

const handleBannerClick = (msg: any) => {
  if (msg?.id) {
    userStore.markNotificationRead(msg.id);
    refreshBanner();
  }
  if (msg?.link) openLink(msg.link);
};

// 页面显示时加载数据
onShow(async () => {
  isMounted.value = true;
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }

  // 刷新订单数据
  orderStore.loadOrders();
  await userStore.syncNotifications();
  await userStore.syncAnnouncements();
  refreshBanner();
  await loadCouponTemplates();
  await loadHomeBanners();

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
  uni.showActionSheet({
    itemList: ['重新定位', '地图选点'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 重新定位
        uni.showLoading({ title: '定位中...' });
        getCurrentLocation()
          .then(loc => {
            uni.hideLoading();
            if (loc.name) {
              locationName.value = loc.name;
              uni.showToast({ title: '定位成功', icon: 'success' });
            }
          })
          .catch(err => {
            uni.hideLoading();
            console.error('Manual location failed:', err);
            // getCurrentLocation internally handles some errors and might return mock, 
            // but if it rejects:
            uni.showToast({ title: '定位失败，请检查权限', icon: 'none' });
          });
      } else {
        // 地图选点
        openMapSelection();
      }
    }
  });
};

const openMapSelection = () => {
    uni.chooseLocation({
      success: (res) => {
        console.log('Location chosen:', res);
        locationName.value = res.name || res.address;
      },
      fail: (err) => {
        console.error('Choose location failed:', err.errMsg || err);
        // #ifdef H5
        if (err.errMsg && (err.errMsg.includes('cancel'))) return;
        
        uni.showModal({
            title: '无法打开地图',
            content: '请确保已授予定位权限。若多次失败，可能是地图服务配置问题。',
            showCancel: false
        });
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
  if (!userStore.userInfo.sitterProfile?.isCertified) {
    uni.showModal({
      title: '未认证',
      content: '完成宠托师认证后才能接单',
      confirmText: '去认证',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/profile/certification' });
        }
      }
    });
    return;
  }

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

    .role-switch-badge {
      display: inline-flex;
      align-items: center;
      margin-top: 12rpx;
      background: rgba(255, 255, 255, 0.6);
      padding: 8rpx 20rpx;
      border-radius: 30rpx;
      align-self: flex-start;
      border: 1rpx solid rgba(0,0,0,0.05);
      
      .icon {
        font-size: 24rpx;
        margin-right: 8rpx;
      }
      
      text {
        font-size: 24rpx;
        color: #666;
        font-weight: 500;
      }
      
      &:active {
        opacity: 0.7;
        background: rgba(0, 0, 0, 0.1);
      }
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

.notice-banner {
  margin: 24rpx $spacing-lg;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
  
  &:active {
    transform: scale(0.99);
    background: #fafafa;
  }
  
  .banner-left {
    width: 72rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #FFF6E5 0%, #FFF0D6 100%);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    .icon {
      font-size: 36rpx;
    }
  }

  .banner-content-wrapper {
    flex: 1;
    overflow: hidden;
    height: 72rpx;
    display: flex;
    align-items: center;
  }
  
  .banner-swiper-vertical {
    width: 100%;
    height: 40rpx;
  }
  
  .notice-banner-item {
    height: 40rpx;
    display: flex;
    align-items: center;
  }
  
  .notice-banner-title {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
  
  .banner-right {
    width: 32rpx;
    display: flex;
    justify-content: flex-end;
    
    .banner-arrow {
      color: #ccc;
      font-size: 32rpx;
      font-weight: 300;
    }
  }
}

@keyframes scrollText {
  0% { transform: translateX(100%); }
  10% { transform: translateX(0); }
  90% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

.notice-banner-content {
  font-size: 24rpx;
  color: #8d6b00;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-right {
  color: #ff9f0a;
  font-size: 32rpx;
  font-weight: bold;
  padding: 0 8rpx;
}

.banner-arrow {
  display: block;
  transform: scaleX(0.6);
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
.coupon-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
  box-sizing: border-box;

  .coupon-card {
    position: relative;
    display: flex;
    align-items: stretch;
    background: #FFFFFF;
    border-radius: 16rpx;
    overflow: hidden;
    height: 180rpx;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;

    &:active {
      transform: scale(0.99);
    }

    // 锯齿效果装饰
    &::before, &::after {
      content: '';
      position: absolute;
      width: 32rpx;
      height: 32rpx;
      background-color: #F5F7FA; // 与页面背景色一致
      border-radius: 50%;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
    }
    
    &::before { left: -16rpx; }
    &::after { right: -16rpx; }

    .coupon-left {
      width: 220rpx;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
      color: #FFF;
      position: relative;
      
      .amount {
        display: flex;
        align-items: baseline;
        justify-content: center;
        font-size: 56rpx;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 8rpx;
        text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
        
        .symbol { 
          font-size: 28rpx; 
          margin: 0 4rpx; 
          font-weight: 600;
        }
      }
      
      .condition {
        font-size: 22rpx;
        opacity: 0.9;
        background: rgba(255,255,255,0.2);
        padding: 4rpx 12rpx;
        border-radius: 20rpx;
      }
      
      // 虚线分割
      &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 16rpx;
        bottom: 16rpx;
        border-right: 2rpx dashed rgba(255,255,255,0.4);
      }
    }

    .coupon-right {
      flex: 1;
      padding: 24rpx 32rpx 24rpx 48rpx; // 左侧留出空间给锯齿
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FFF;
      
      .info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1;
        margin-right: 20rpx;
        
        .name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 12rpx;
          @include text-ellipsis;
        }
        
        .desc {
          font-size: 22rpx;
          color: #999;
          background: #F8F8F8;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          align-self: flex-start;
        }
      }
      
      .btn-claim {
        min-width: 140rpx;
        height: 64rpx;
        line-height: 64rpx;
        text-align: center;
        background: linear-gradient(90deg, #FF6B6B 0%, #FF8E3C 100%);
        color: #FFF;
        border-radius: 32rpx;
        font-size: 26rpx;
        font-weight: 600;
        padding: 0;
        margin: 0;
        box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
        border: none;
        
        &::after { border: none; } // 去除uniapp button默认边框

        &:active {
          opacity: 0.9;
          transform: translateY(2rpx);
        }
      }
    }
  }

  .empty-coupon {
    padding: 40rpx;
    text-align: center;
    color: #999;
    font-size: 28rpx;
    background: #FFF;
    border-radius: 16rpx;
    border: 2rpx dashed #EEE;
  }
}
</style>

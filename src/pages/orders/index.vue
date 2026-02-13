<template>
  <view class="container">
    <view class="notice-banner" v-if="bannerMessages.length > 0">
      <view class="banner-left">
        <text class="icon">🔔</text>
      </view>
      <swiper class="banner-swiper-vertical" vertical autoplay circular interval="3000" duration="500">
        <swiper-item v-for="msg in bannerMessages" :key="msg.id">
          <view class="notice-banner-item" @click="handleBannerClick(msg)">
            <text class="notice-banner-title">{{ msg.title }}</text>
            <text class="notice-banner-content">{{ msg.content }}</text>
          </view>
        </swiper-item>
      </swiper>
      <view class="banner-right">
        <text class="banner-count">{{ bannerMessages.length }}</text>
      </view>
    </view>
    <view class="view-switch">
      <view class="switch-item" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">列表</view>
      <view class="switch-item" :class="{ active: viewMode === 'calendar' }" @click="viewMode = 'calendar'">日历</view>
    </view>
    
    <view v-if="viewMode === 'calendar'" class="calendar-wrapper">
      <view class="calendar-panel">
        <view class="calendar-header">
          <text class="calendar-nav" @click="changeCalendarMonth(-1)">‹</text>
          <text class="calendar-title">{{ calendarTitle }}</text>
          <text class="calendar-nav" @click="changeCalendarMonth(1)">›</text>
        </view>
        <view class="calendar-week">
          <text v-for="d in calendarWeekDays" :key="d" class="week-item">{{ d }}</text>
        </view>
        <view class="calendar-grid">
          <view 
            v-for="day in calendarDays" 
            :key="day.key"
            class="calendar-day"
            :class="{
              out: !day.inMonth,
              selected: day.key === selectedDateKey,
              has: day.orders.length > 0
            }"
            @click="selectCalendarDay(day)"
          >
            <text class="day-num">{{ day.date.getDate() }}</text>
            <view class="day-orders" v-if="day.orders.length > 0">
              <view 
                v-for="(order, idx) in day.orders" 
                :key="order.id"
                class="day-order"
                :class="getOrderStatusClass(order)"
                @click.stop="showCalendarOrderPopup(order)"
              >
                <text class="line-text">{{ getOrderLine(order) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view class="calendar-detail">
        <view class="detail-header">
          <text class="detail-date">{{ selectedDateKey || '请选择日期' }}</text>
          <text class="detail-count">{{ selectedDayOrders.length }}单</text>
        </view>
        <view v-if="selectedDayOrders.length > 0" class="detail-list">
          <view class="detail-card" v-for="order in selectedDayOrders" :key="order.id">
            <view class="detail-main" @click="focusOrderFromCalendar(order.id)">
              <view class="detail-title">
                <view class="service-tag" :class="order.serviceType">{{ formatServiceType(order.serviceType) }}</view>
                <text class="status-text" :class="order.status.toLowerCase()">{{ formatStatus(order.status) }}</text>
              </view>
              <text class="detail-time">{{ formatTime(order.time) }}</text>
              <text class="detail-pets">{{ formatPetsMain(order) }}</text>
              <text class="detail-address">{{ order.address }}</text>
            </view>
            <view class="detail-evidence" v-if="order.serviceEvidence?.photos?.length || order.serviceEvidence?.items?.length">
              <text class="detail-sub">服务完成内容</text>
              <view class="evidence-items" v-if="order.serviceEvidence?.items?.length">
                <text class="evidence-tag" v-for="item in order.serviceEvidence.items" :key="item">{{ item }}</text>
              </view>
              <view class="evidence-photos" v-if="order.serviceEvidence?.photos?.length">
                <image 
                  v-for="(p, i) in order.serviceEvidence.photos.slice(0, 4)" 
                  :key="p + i"
                  :src="p"
                  class="evidence-photo"
                  mode="aspectFill"
                  @click.stop="previewEvidence(order, i)"
                />
              </view>
            </view>
            <view class="detail-pending" v-else>
              <text class="pending-text">待服务</text>
            </view>
          </view>
        </view>
        <view v-else class="calendar-empty">该日期暂无订单</view>
      </view>
    </view>
    
    <view v-else>
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
          <view 
            class="order-card" 
            v-for="order in filteredOrders" 
            :key="order.id" 
            :id="`order-${order.id}`"
            :class="{ highlight: highlightOrderId === order.id }"
            @click="goToDetail(order.id)"
          >
            <!-- 卡片头部：状态与服务类型 -->
            <view class="card-header">
              <view class="header-left">
                <view class="service-tag" :class="order.serviceType">
                  {{ formatServiceType(order.serviceType) }}
                </view>
                <text class="order-time">{{ formatTime(order.time) }}</text>
              </view>
              <view class="header-right">
                <text class="status-text" :class="order.status.toLowerCase()">
                  {{ formatStatus(order.status) }}
                </text>
              </view>
            </view>
            
            <!-- 分割线 -->
            <view class="divider"></view>

            <!-- 卡片内容 -->
            <view class="card-body">
              <!-- 宠物信息 -->
              <view class="info-row">
                <view class="label-box">
                  <text class="icon">🐾</text>
                  <text class="label">宠物</text>
                </view>
                <view class="content-box">
                  <text class="main-text">{{ formatPetsMain(order) }}</text>
                  <text class="sub-text">{{ formatPetsSub(order) }}</text>
                </view>
              </view>

              <!-- 服务内容 (新增) -->
              <view class="info-row">
                <view class="label-box">
                  <text class="icon">🏷️</text>
                  <text class="label">服务</text>
                </view>
                <view class="content-box">
                  <text class="main-text">{{ getServiceSummary(order) }}</text>
                </view>
              </view>

              <!-- 地址信息 -->
              <view class="info-row">
                <view class="label-box">
                  <text class="icon">📍</text>
                  <text class="label">地址</text>
                </view>
                <view class="content-box">
                  <text class="main-text address">
                    {{ order.address }}
                  </text>
                  <text class="distance-tag" v-if="!isOwner && order.distance">{{ formatDistance(order.distance) }}</text>
                </view>
              </view>

              <!-- 服务人员 (仅显示) -->
              <view class="info-row" v-if="isOwner && order.sitterId && order.status !== 'PENDING'">
                <view class="label-box">
                  <text class="icon">👤</text>
                  <text class="label">宠托师</text>
                </view>
                <view class="content-box sitter-row" @click.stop="showSitterProfile(order)">
                  <text class="main-text">{{ getSitterName(order) }}</text>
                  <view class="level-tag" :class="getSitterLevelClass(order)">{{ getSitterLevelText(order) }}</view>
                  <text class="arrow">></text>
                </view>
              </view>
            </view>
            
            <!-- 卡片底部：价格与操作 -->
            <view class="card-footer">
              <view class="price-section">
                <text class="currency">¥</text>
                <text class="amount">{{ formatPrice(order.totalPrice) }}</text>
              </view>
              <view class="action-group">
                <!-- 铲屎官视角 -->
                <template v-if="isOwner">
                  <button class="action-btn outline" v-if="order.status === 'PENDING'" @click.stop="handleCancel(order)">取消订单</button>
                  <button class="action-btn primary" v-if="order.status === 'UNPAID'" @click.stop="handlePay(order)">去支付</button>
                  <button class="action-btn primary" v-if="order.status === 'ACCEPTED'" @click.stop="handleConfirmStart(order)">确认开始</button>
                  <button class="action-btn primary" v-if="order.status === 'IN_SERVICE'" @click.stop="handleConfirmComplete(order)">确认完成</button>
                  <button class="action-btn outline" v-if="order.status === 'COMPLETED'" @click.stop="openReviewModal(order)">去评价</button>
                  <button class="action-btn outline" v-if="['COMPLETED', 'REVIEWED'].includes(order.status)" @click.stop="handleReorder(order)">再来一单</button>
                </template>
                
                <!-- 宠托师视角 -->
                <template v-else>
                  <button class="action-btn primary" v-if="order.status === 'PENDING_ACCEPTANCE'" @click.stop="handleSitterAccept(order)">确认接单</button>
                  <button class="action-btn outline" v-if="order.status === 'PENDING_ACCEPTANCE'" @click.stop="handleSitterReject(order)">婉拒</button>
                  <button class="action-btn primary" v-if="order.status === 'ACCEPTED'" @click.stop="handleStartService(order)">开始服务</button>
                  <button class="action-btn primary" v-if="order.status === 'IN_SERVICE'" @click.stop="handleCompleteService(order)">完成服务</button>
                  <button class="action-btn outline" v-if="order.status === 'COMPLETED'" @click.stop="handleInviteReview(order)">邀请评价</button>
                </template>
              </view>
            </view>
          </view>
        </view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <image src="https://imgus.tangbuy.com/static/images/2026-02-07/94f7112020e543b5a7538a79851752b9-17704586455008540825701783472049.jpeg" class="empty-img" mode="widthFix" />
        <text class="empty-text">暂无相关订单</text>
        <button class="btn-publish" @click="goToPublish" v-if="isOwner">去发布任务</button>
        <button class="btn-publish" @click="goToHall" v-else>去接单</button>
      </view>
    </view>
    </view>

    <view class="modal-overlay" v-if="showReminderModal" @click="closeReminderModal">
      <view class="modal-content reminder-modal" @click.stop>
        <view class="modal-header">
          <text class="title">服务提醒</text>
          <text class="close-btn" @click="closeReminderModal">×</text>
        </view>
        <view class="reminder-body">
          <text class="reminder-text">距离服务时间还有30分钟</text>
          <text class="reminder-sub" v-if="reminderOrder">{{ formatTime(reminderOrder.time) }}</text>
        </view>
        <view class="reminder-actions">
          <button class="action-btn outline" @click="setReminderResponse('ack')">已知晓</button>
          <button class="action-btn primary" @click="setReminderResponse('ontime')">准时服务</button>
        </view>
        <view class="reminder-delay">
          <input class="delay-input" type="number" v-model="delayMinutes" placeholder="预计延期分钟数" />
          <button class="action-btn outline" @click="submitDelay">预计延期</button>
        </view>
      </view>
    </view>

    <!-- 宠托师详情弹窗 -->
    <view class="modal-overlay" v-if="showModal" @click="closeModal">
      <view class="modal-content profile-modal" @click.stop>
        <view class="modal-header">
          <text class="title">宠托师档案</text>
          <text class="close-btn" @click="closeModal">×</text>
        </view>
        <view class="sitter-profile" v-if="currentSitter">
          <view class="profile-header-card">
             <view class="avatar-box">{{ currentSitter.nickname[0] }}</view>
             <text class="name">{{ currentSitter.nickname }}</text>
             <view class="tags-row">
                <view class="tag level">{{ getModalLevelText() }}</view>
                <view class="tag verify">实名认证</view>
             </view>
          </view>
          
          <view class="stats-grid">
            <view class="stat-box">
              <text class="num">{{ currentSitter.sitterProfile?.completedOrders || 0 }}</text>
              <text class="label">已完成</text>
            </view>
            <view class="stat-box">
              <text class="num">{{ currentSitter.sitterProfile?.rating || 5.0 }}</text>
              <text class="label">评分</text>
            </view>
            <view class="stat-box">
              <text class="num">{{ currentSitter.sitterProfile?.experienceYears || 1 }}年</text>
              <text class="label">经验</text>
            </view>
          </view>

          <view class="info-block">
            <text class="block-title">个人简介</text>
            <text class="block-content">{{ currentSitter.sitterProfile?.bio || '这位宠托师很懒，还没写简介~' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 评价弹窗 (全新设计) -->
    <view class="modal-overlay" v-if="showReviewModal" @click="closeReviewModal">
       <view class="modal-content review-modal" @click.stop>
          <view class="review-header">
             <text class="title">服务评价</text>
             <text class="sub">请对本次服务进行打分</text>
          </view>
          
          <view class="rating-stars">
             <view 
               class="star-item" 
               v-for="i in 5" 
               :key="i"
               @click="setRating(i)"
             >
                <text class="star-icon" :class="{ active: i <= reviewRating }">★</text>
             </view>
          </view>
          <text class="rating-desc">{{ getRatingText(reviewRating) }}</text>
          
          <view class="input-wrapper">
             <textarea 
               class="review-textarea" 
               placeholder="服务周到吗？宠物开心吗？写点什么吧..." 
               placeholder-class="placeholder"
               v-model="reviewContent"
             />
          </view>
          
          <view class="modal-actions">
             <button class="btn-cancel" @click="closeReviewModal">暂不评价</button>
             <button class="btn-submit" @click="submitReview">提交评价</button>
          </view>
       </view>
    </view>

    <!-- 完成服务弹窗 -->
    <view class="modal-overlay" v-if="showCompleteModal" @click="closeCompleteModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="title">完成服务确认</text>
          <text class="close-btn" @click="closeCompleteModal">×</text>
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
           <button class="btn-primary block" @click="submitComplete">确认提交</button>
        </view>
      </view>
    </view>
    <!-- Calendar Order Popup -->
    <view class="modal-overlay" v-if="showCalendarPopup" @click="closeCalendarOrderPopup">
       <view class="modal-content calendar-popup" @click.stop>
          <view class="modal-header">
             <text class="title">订单详情</text>
             <text class="close-btn" @click="closeCalendarOrderPopup">×</text>
          </view>
          <view class="popup-body" v-if="selectedCalendarOrder">
             <view class="info-row">
                <text class="label">服务类型：</text>
                <view class="service-tag" :class="selectedCalendarOrder.serviceType">{{ formatServiceType(selectedCalendarOrder.serviceType) }}</view>
             </view>
             <view class="info-row">
                <text class="label">当前状态：</text>
                <text class="status-text" :class="selectedCalendarOrder.status.toLowerCase()">{{ formatStatus(selectedCalendarOrder.status) }}</text>
             </view>
             <view class="info-row">
                <text class="label">服务时间：</text>
                <text class="val">{{ formatTime(selectedCalendarOrder.time) }}</text>
             </view>
             <view class="info-row">
                <text class="label">服务对象：</text>
                <text class="val">{{ formatPetsMain(selectedCalendarOrder) }}</text>
             </view>
             <view class="info-row">
                <text class="label">服务地址：</text>
                <text class="val">{{ selectedCalendarOrder.address }}</text>
             </view>
             <button class="btn-primary block" @click="jumpToOrderHighlight(selectedCalendarOrder.id)">查看完整详情</button>
          </view>
       </view>
    </view>
    <view style="height: 50px;"></view>
    <CustomTabBar current-path="pages/orders/index" />
  </view>
</template>

<script setup lang="ts">
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
// Force rebuild
import { ref, computed, nextTick } from 'vue';
import { onShow, onHide, onUnload } from '@dcloudio/uni-app';
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
const foldedOrders = ref<Record<string, boolean>>({});
const countdowns = ref<Record<string, string>>({});
let timer: ReturnType<typeof setInterval> | null = null;
let reminderTimer: ReturnType<typeof setInterval> | null = null;
const bannerMessages = ref<any[]>([]);
const viewMode = ref<'list' | 'calendar'>('list');
const calendarMonth = ref(new Date());
const selectedDateKey = ref('');
const showReminderModal = ref(false);
const reminderOrder = ref<Order | null>(null);
const delayMinutes = ref('');
const highlightOrderId = ref('');
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

const showCalendarPopup = ref(false);
const selectedCalendarOrder = ref<Order | null>(null);

const showCalendarOrderPopup = (order: Order) => {
  selectedCalendarOrder.value = order;
  showCalendarPopup.value = true;
};

const closeCalendarOrderPopup = () => {
  showCalendarPopup.value = false;
  selectedCalendarOrder.value = null;
};

const jumpToOrderHighlight = async (id: string) => {
  closeCalendarOrderPopup();
  await focusOrderFromCalendar(id);
};

const isOwner = computed(() => userStore.userInfo?.role === 'owner');

const isFolded = (id: string) => {
  return foldedOrders.value[id] !== false; // Default to true (folded)
};

const toggleFold = (id: string) => {
  foldedOrders.value[id] = !isFolded(id);
};

const updateCountdowns = () => {
  const now = Date.now();
  orderStore.orders.forEach(order => {
    if (order.status === 'IN_SERVICE' && order.actualStartTime) {
      const elapsed = now - order.actualStartTime;
      const totalDuration = order.duration * 60 * 1000;
      const remaining = totalDuration - elapsed;
      
      if (remaining > 0) {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        countdowns.value[order.id] = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else {
        countdowns.value[order.id] = '服务时间已到';
      }
    }
  });
};

const currentTabs = computed(() => {
  if (isOwner.value) {
    return [
      { label: '全部', value: 'ALL' },
      { label: '待接单', value: 'PENDING' },
      { label: '待服务', value: 'ACCEPTED' },
      { label: '服务中', value: 'IN_SERVICE' },
      { label: '待评价', value: 'COMPLETED' },
      { label: '已评价', value: 'REVIEWED' }
    ];
  } else {
    return [
      { label: '全部', value: 'ALL' },
      { label: '待确认', value: 'PENDING_ACCEPTANCE' },
      { label: '待服务', value: 'ACCEPTED' },
      { label: '服务中', value: 'IN_SERVICE' },
      { label: '已完成', value: 'COMPLETED_ALL' }
    ];
  }
});

onShow(async () => {
  await orderStore.loadOrders(); // Await loadOrders to ensure data is ready
  await userStore.syncNotifications();
  await userStore.syncAnnouncements();
  refreshBanner();
  
  // Check for newly created order to highlight
  if (orderStore.newlyCreatedOrderId) {
    viewMode.value = 'list';
    currentTab.value = 0; // Ensure "ALL" tab or appropriate tab is selected
    // If it's unpaid, maybe switch to PENDING? But user might want to see it in ALL.
    // Actually, createOrder makes it UNPAID. If owner, UNPAID is in "ALL" or we don't have UNPAID tab?
    // Current tabs: ALL, PENDING(待接单), ACCEPTED(待服务), IN_SERVICE(服务中), COMPLETED(待评价), REVIEWED(已评价)
    // Wait, UNPAID is not in the tabs explicitly for Owner?
    // Let's check filteredOrders logic.
    // If tab is ALL, it returns all.
    // UNPAID orders should be visible in ALL.
    
    highlightOrderId.value = orderStore.newlyCreatedOrderId;
    const highlightId = highlightOrderId.value; // capture value
    
    // Clear the store value immediately
    orderStore.newlyCreatedOrderId = '';
    
    await nextTick();
    // Use a small delay to ensure rendering
    setTimeout(() => {
        uni.pageScrollTo({ selector: `#order-${highlightId}`, duration: 300 });
    }, 100);

    if (highlightTimer) clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => {
      highlightOrderId.value = '';
    }, 2000);
  }

  // Start countdown timer
  if (timer) clearInterval(timer);
  timer = setInterval(updateCountdowns, 1000);
  updateCountdowns();
  checkServiceReminders();
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = setInterval(checkServiceReminders, 60000);
  if (!selectedDateKey.value) {
    selectedDateKey.value = formatDateKey(new Date());
  }
});

onHide(() => {
  if (timer) clearInterval(timer);
  if (reminderTimer) clearInterval(reminderTimer);
});

onUnload(() => {
  if (timer) clearInterval(timer);
  if (reminderTimer) clearInterval(reminderTimer);
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
  
  if (tab.value === 'PENDING') {
    // Owner sees both PENDING and PENDING_ACCEPTANCE under "待接单"
    return all.filter(o => o.status === 'PENDING' || o.status === 'PENDING_ACCEPTANCE');
  }

  // Sitter's "Completed" includes both COMPLETED and REVIEWED
  if (tab.value === 'COMPLETED_ALL') {
    return all.filter(o => ['COMPLETED', 'REVIEWED'].includes(o.status));
  }
  
  return all.filter(o => o.status === tab.value);
});

const refreshBanner = () => {
  bannerMessages.value = userStore.getUnreadNotifications();
};

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseOrderDate = (value: string | number) => {
  if (typeof value === 'number') return new Date(value);
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  return new Date(value.replace(/-/g, '/'));
};

const calendarWeekDays = ['日', '一', '二', '三', '四', '五', '六'];

const calendarTitle = computed(() => {
  const y = calendarMonth.value.getFullYear();
  const m = (calendarMonth.value.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
});

const calendarOrders = computed(() => {
  let all = orderStore.orders;
  if (isOwner.value) {
    all = all.filter(o => o.creatorId === userStore.userInfo?.id);
  } else if (userStore.userInfo?.role === 'sitter') {
    all = all.filter(o => o.sitterId === userStore.userInfo?.id);
  } else {
    return [];
  }
  return all.filter(o => o.status !== 'CANCELLED').slice().sort((a, b) => parseOrderDate(a.time).getTime() - parseOrderDate(b.time).getTime());
});

const calendarOrderMap = computed(() => {
  const map = new Map<string, Order[]>();
  calendarOrders.value.forEach(order => {
    const key = formatDateKey(parseOrderDate(order.time));
    const list = map.get(key) || [];
    list.push(order);
    map.set(key, list);
  });
  return map;
});

const isCompletedOrder = (order: Order) => ['COMPLETED', 'REVIEWED'].includes(order.status);

const calendarDays = computed(() => {
  const startOfMonth = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth(), 1);
  const startWeekday = startOfMonth.getDay();
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - startWeekday);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = formatDateKey(date);
    const orders = calendarOrderMap.value.get(key) || [];
    const counts = orders.reduce(
      (acc, o) => {
        if (isCompletedOrder(o)) acc.completed += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, completed: 0 }
    );
    days.push({
      key,
      date,
      inMonth: date.getMonth() === calendarMonth.value.getMonth(),
      orders,
      counts
    });
  }
  return days;
});

const selectedDayOrders = computed(() => {
  if (!selectedDateKey.value) return [];
  return calendarOrderMap.value.get(selectedDateKey.value) || [];
});

const changeCalendarMonth = (offset: number) => {
  const date = new Date(calendarMonth.value);
  date.setMonth(date.getMonth() + offset);
  calendarMonth.value = date;
};

const selectCalendarDay = (day: { key: string }) => {
  selectedDateKey.value = day.key;
};

const focusOrderFromCalendar = async (id: string) => {
  viewMode.value = 'list';
  highlightOrderId.value = id;
  await nextTick();
  uni.pageScrollTo({ selector: `#order-${id}`, duration: 300 });
  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    highlightOrderId.value = '';
  }, 2000);
};

const getOrderStatusClass = (order: Order) => {
  if (order.status === 'IN_SERVICE') return 'in-service';
  if (isCompletedOrder(order)) return 'completed';
  return 'pending';
};

const getOrderLine = (order: Order) => {
  const timeText = formatTime(order.time).split(' ')[1] || '';
  const names = (order.petSnapshots || []).map(p => p.name).filter((name): name is string => !!name);
  const mainName = names[0] || order.petName || '宠物';
  const count = names.length || (order.petName ? 1 : 0);
  const petText = count > 1 ? `${mainName}等${count}只` : mainName;
  return `${timeText} ${petText}`;
};

const previewEvidence = (order: Order, startIndex: number) => {
  const urls = order.serviceEvidence?.photos || [];
  if (!urls.length) return;
  previewImage(urls, startIndex);
};

const reminderStorageKey = (orderId: string) => `miaomiao_service_reminder_${orderId}`;

const checkServiceReminders = () => {
  const now = Date.now();
  calendarOrders.value.forEach(order => {
    if (!['ACCEPTED', 'IN_SERVICE'].includes(order.status)) return;
    const scheduled = parseOrderDate(order.time).getTime();
    const diffMinutes = Math.floor((scheduled - now) / 60000);
    if (diffMinutes > 30 || diffMinutes < 0) return;
    const key = reminderStorageKey(order.id);
    if (uni.getStorageSync(key)) return;
    uni.setStorageSync(key, true);
    const orderNoText = order.orderNo ? `订单${order.orderNo}` : '订单';
    const link = `/pages/order-detail/index?id=${order.id}`;
    userStore.addNotification({
      id: `reminder_${order.id}_${scheduled}`,
      type: 'order',
      title: '服务即将开始',
      content: `${orderNoText}距离服务时间还有30分钟`,
      time: new Date().toLocaleString(),
      link,
      orderId: order.id
    });
    refreshBanner();
    reminderOrder.value = order;
    showReminderModal.value = true;
  });
};

const closeReminderModal = () => {
  showReminderModal.value = false;
  reminderOrder.value = null;
  delayMinutes.value = '';
};

const setReminderResponse = (type: 'ack' | 'ontime') => {
  if (!reminderOrder.value) return;
  const statusText = type === 'ack' ? '已知晓' : '准时服务';
  userStore.addNotification({
    id: `reminder_response_${reminderOrder.value.id}_${type}`,
    type: 'order',
    title: '服务提醒反馈',
    content: `已反馈：${statusText}`,
    time: new Date().toLocaleString(),
    link: `/pages/order-detail/index?id=${reminderOrder.value.id}`,
    orderId: reminderOrder.value.id
  });
  refreshBanner();
  closeReminderModal();
};

const submitDelay = () => {
  if (!reminderOrder.value) return;
  const minutes = Number(delayMinutes.value);
  if (!minutes || minutes <= 0) {
    uni.showToast({ title: '请输入延期分钟数', icon: 'none' });
    return;
  }
  userStore.addNotification({
    id: `reminder_delay_${reminderOrder.value.id}_${minutes}`,
    type: 'order',
    title: '服务预计延期',
    content: `预计延期${minutes}分钟`,
    time: new Date().toLocaleString(),
    link: `/pages/order-detail/index?id=${reminderOrder.value.id}`,
    orderId: reminderOrder.value.id
  });
  refreshBanner();
  closeReminderModal();
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

const handleBannerClick = (msg: any) => {
  if (msg?.id) {
    userStore.markNotificationRead(msg.id);
    refreshBanner();
  }
  if (msg?.link) openLink(msg.link);
};

const formatServiceType = (type: ServiceType) => {
  return type === ServiceType.FEEDING ? '上门喂养' : '上门遛狗';
};

const formatPetsMain = (order: Order) => {
  const names = (order.petSnapshots || []).map(p => p.name).filter((name): name is string => !!name);
  if (names.length === 0 && order.petName) {
    return order.petName;
  }
  if (names.length === 0) return '未填写';
  const listText = names.slice(0, 3).join('·');
  const more = names.length > 3 ? `等${names.length}只` : '';
  return `共${names.length}只宠物（${listText}${more ? '·' + more : ''}）`;
};

const formatPetsSub = (order: Order) => {
  const pets = order.petSnapshots || [];
  if (pets.length === 0) {
    const breed = order.petBreed || '';
    const age = order.petAge != null ? `${order.petAge}岁` : '';
    const gender = order.petGender ? (order.petGender === 'male' ? '弟弟' : '妹妹') : '';
    return [breed, age, gender].filter(Boolean).join(' · ');
  }
  // 最大年龄
  const ages = pets.map(p => p.age).filter((age): age is number => typeof age === 'number');
  const maxAge = ages.length ? Math.max(...ages) : undefined;
  const breeds = Array.from(new Set(pets.map(p => p.breed).filter((breed): breed is string => !!breed))).slice(0, 2);
  const parts = [];
  if (breeds.length) parts.push(breeds.join(' / '));
  if (maxAge != null) parts.push(`${pets.length === 1 ? '' : '最大'}年龄${maxAge}岁`);
  return parts.join(' · ');
};
const getServiceItems = (type: ServiceType) => {
  if (type === ServiceType.FEEDING) {
    return ['喂食', '换水', '铲屎', '拍摄反馈'];
  }
  return ['遛狗', '陪玩', '清洁', '拍摄反馈'];
};

const formatDistance = (m?: number) => {
  if (!m) return '';
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
};

const getServiceSummary = (order: Order) => {
  const parts = [];
  const typeName = order.serviceType === ServiceType.FEEDING ? '上门喂养' : '上门遛狗';
  parts.push(`${typeName} (${order.duration}分钟)`);
  
  if (order.addOns?.play) parts.push('陪玩');
  if (order.addOns?.deepClean) parts.push('深度清洁');
  if (order.addOns?.medicine) parts.push('喂药');
  return parts.join(' · ');
};

const formatPetSize = (size: PetSize) => {
  const map: Record<string, string> = {
    [PetSize.SMALL]: '小型',
    [PetSize.MEDIUM]: '中型',
    [PetSize.LARGE]: '大型',
    [PetSize.GIANT]: '超大型',
    [PetSize.CAT]: '猫咪'
  };
  return map[size] || size;
};

const formatTime = (time: number | string) => {
  if (!time) return '';
  const date = new Date(time);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

const formatPrice = (price: number) => {
  return price.toFixed(2);
}

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
  uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` });
};

// --- Sitter Data & Logic ---

const getSitterName = (order: Order) => {
  return order.sitterSnapshot?.nickname || '爱宠小助手';
};

const getSitterPhone = (order: Order) => {
  return order.sitterSnapshot?.phone || '13900000000';
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
      joinDate: Date.now(),
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
    success: async (res) => {
      if (res.confirm) {
        if (await orderStore.cancelOrder(order.id, 'owner')) {
             uni.showToast({ title: '已取消' });
             // No need to switch tab if viewing ALL, but if viewing specific status, list will update
        } else {
             uni.showToast({ title: '取消失败', icon: 'none' });
        }
      }
    }
  });
};

const handlePay = (order: Order) => {
  uni.showActionSheet({
    itemList: ['余额支付', '支付宝支付'],
    success: async (res) => {
      const method = res.tapIndex === 0 ? 'BALANCE' : 'ALIPAY';
      
      uni.showLoading({ title: '支付中...' });
      
      try {
        const success = await orderStore.payOrder(order.id, method);
        uni.hideLoading();
        
        if (success) {
            uni.showToast({ title: '支付成功', icon: 'success' });
            switchToTab('PENDING');
        } else {
            // Error toast is handled in store for Balance, but generic fail here
            if (method === 'ALIPAY') uni.showToast({ title: '支付失败', icon: 'none' });
        }
      } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '支付出错', icon: 'none' });
      }
    }
  });
};

const handleConfirmStart = async (order: Order) => {
    // 铲屎官确认开始
    if (await orderStore.startService(order.id)) {
        uni.showToast({ title: '已确认开始服务', icon: 'success' });
        switchToTab('IN_SERVICE');
    }
};

const handleSitterAccept = async (order: Order) => {
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
  const success = await orderStore.acceptOrder(order.id, userStore.userInfo);
  if (success) {
    uni.showToast({ title: '接单成功', icon: 'success' });
  } else {
    uni.showToast({ title: '接单失败', icon: 'none' });
  }
};

const handleSitterReject = (order: Order) => {
  uni.showModal({
    title: '提示',
    content: '确定要婉拒这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        const updated = await orderStore.updateOrderStatus(order.id, 'CANCELLED');
        if (updated) {
          uni.showToast({ title: '已婉拒', icon: 'none' });
        } else {
          uni.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    }
  });
};

const handleStartService = (order: Order) => {
    uni.showModal({
        title: '开始服务',
        content: '确认到达现场并开始服务？',
    success: async (res) => {
            if (res.confirm) {
                const updated = await orderStore.updateOrderStatus(order.id, 'IN_SERVICE');
                if (updated) {
                  switchToTab('IN_SERVICE');
                } else {
                  uni.showToast({ title: '操作失败', icon: 'none' });
                }
            }
        }
    });
};

const handleCompleteService = (order: Order) => {
    // Check duration
    if (order.actualStartTime) {
        const elapsed = Date.now() - order.actualStartTime;
        const minDuration = order.duration * 60 * 1000;
        if (elapsed < minDuration) {
            uni.showModal({
                title: '服务未达标',
                content: `服务时长未满${order.duration}分钟，确定要提前结束吗？`,
                confirmText: '确认结束',
                cancelText: '继续服务',
                success: (res) => {
                    if (res.confirm) {
                        showCompleteServiceModal(order);
                    }
                }
            });
            return;
        }
    }
    showCompleteServiceModal(order);
};

const showCompleteServiceModal = (order: Order) => {
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

const submitComplete = async () => {
    if (processingOrder.value) {
        const success = await orderStore.completeOrder(processingOrder.value.id, {
            photos: tempPhotos.value,
            items: tempTasks.value,
            confirmedAt: Date.now()
        });
        if (success) {
          uni.showToast({ title: '服务已完成' });
          switchToTab('COMPLETED');
        } else {
          uni.showToast({ title: '提交失败', icon: 'none' });
        }
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
    success: async (res) => {
            if (res.confirm) {
                // If Sitter hasn't uploaded evidence yet, we might just set status to COMPLETED (Wait for Review)
                // Or maybe we require Sitter to do it first.
                // Assuming Owner can force complete.
                if (order.status === 'IN_SERVICE') {
                   const updated = await orderStore.updateOrderStatus(order.id, 'COMPLETED');
                   if (updated) {
                     uni.showToast({ title: '订单已完成' });
                     switchToTab('COMPLETED');
                   } else {
                     uni.showToast({ title: '操作失败', icon: 'none' });
                   }
                }
            }
        }
    });
};

const handleInviteReview = (order: Order) => {
    uni.showToast({ title: '已发送评价邀请', icon: 'success' });
};

// Review Logic
const showReviewModal = ref(false);
const reviewRating = ref(5);
const reviewContent = ref('');
const reviewingOrder = ref<Order | null>(null);

const openReviewModal = (order: Order) => {
    reviewingOrder.value = order;
    reviewRating.value = 5;
    reviewContent.value = '';
    showReviewModal.value = true;
};

const closeReviewModal = () => {
    showReviewModal.value = false;
    reviewingOrder.value = null;
};

const setRating = (rating: number) => {
    reviewRating.value = rating;
};

const getRatingText = (rating: number) => {
    const map = ['差评', '较差', '一般', '满意', '非常满意'];
    return map[rating - 1] || '满意';
};

const submitReview = async () => {
    if (!reviewingOrder.value) return;
    uni.showLoading({ title: '提交中...' });
    try {
        await orderStore.submitOwnerReview(
            reviewingOrder.value.id,
            reviewRating.value,
            reviewContent.value
        );
        uni.hideLoading();
        uni.showToast({ title: '评价成功' });
        closeReviewModal();
    } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '评价失败，请稍后重试', icon: 'none' });
    }
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

.notice-banner {
  margin: 20rpx $spacing-lg 10rpx;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.view-switch {
  display: flex;
  gap: 16rpx;
  padding: 0 $spacing-lg 10rpx;
  
  .switch-item {
    flex: 1;
    height: 64rpx;
    border-radius: 32rpx;
    background: #f5f5f5;
    color: $color-text-secondary;
    font-size: 26rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    &.active {
      background: $color-primary;
      color: #fff;
      font-weight: 600;
    }
  }
}

.calendar-wrapper {
  padding: 0 $spacing-lg 20rpx;
}

.calendar-panel {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: $shadow-card;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10rpx 10rpx;
}

.calendar-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $color-text-main;
}

.calendar-nav {
  font-size: 40rpx;
  color: $color-text-secondary;
  padding: 0 10rpx;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 10rpx 0;
}

.week-item {
  text-align: center;
  font-size: 22rpx;
  color: $color-text-secondary;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(130rpx, auto);
  gap: 8rpx;
}

.calendar-day {
  border-radius: 16rpx;
  background: #fff;
  padding: 8rpx;
  border: 1px solid #f5f5f5;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  
  &.out {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    opacity: 0.3;
  }
  &.selected {
    border: 2rpx solid $color-primary;
    background: #FFFBF6;
    box-shadow: 0 0 0 4rpx rgba(255, 142, 60, 0.1);
  }
  &.has {
    // background: #fff; // Keep white background for cleanliness
  }
}

.day-num {
  font-size: 24rpx;
  font-weight: 600;
  color: $color-text-main;
  margin-bottom: 4rpx;
  line-height: 1;
}

.day-badges {
  display: flex;
  gap: 4rpx;
  margin-bottom: 6rpx;
}

.badge {
  font-size: 16rpx;
  height: 24rpx;
  line-height: 24rpx;
  padding: 0 6rpx;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  
  &.pending { 
    background: #FFF0E6; 
    color: #FF8E3C; 
    border: 1rpx solid rgba(255, 142, 60, 0.2);
  }
  &.completed { 
    background: #E6FFFB; 
    color: #00B578; 
    border: 1rpx solid rgba(0, 181, 120, 0.2);
  }
}

.day-orders {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
}

.day-order {
  height: 30rpx;
  border-radius: 6rpx;
  padding: 0 6rpx;
  display: flex;
  align-items: center;
  font-size: 18rpx;
  
  &.pending { 
    background: #FFF7E6; 
    color: #FA8C16; 
    border-left: 4rpx solid #FA8C16;
  }
  &.completed { 
    background: #F6FFED; 
    color: #52C41A; 
    border-left: 4rpx solid #52C41A;
  }
  &.in-service { 
    background: #E6F7FF; 
    color: #1890FF; 
    border-left: 4rpx solid #1890FF;
  }
}

.line-text {
  font-size: 18rpx;
  line-height: 30rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-text {
  font-size: 18rpx;
  color: $color-text-secondary;
}

.calendar-detail {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: $shadow-card;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.detail-date {
  font-size: 28rpx;
  font-weight: 600;
}

.detail-count {
  font-size: 22rpx;
  color: $color-text-secondary;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-card {
  border-radius: 16rpx;
  padding: 16rpx;
  background: #f9fafb;
}

.detail-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.detail-time {
  font-size: 24rpx;
  color: $color-text-main;
  margin-bottom: 4rpx;
}

.detail-pets,
.detail-address {
  font-size: 22rpx;
  color: $color-text-secondary;
  margin-bottom: 4rpx;
}

.detail-evidence {
  margin-top: 12rpx;
}

.detail-sub {
  font-size: 22rpx;
  color: $color-text-main;
  margin-bottom: 8rpx;
  display: block;
}

.evidence-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.evidence-tag {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  background: #fff0e5;
  color: #ff8e3c;
  border-radius: 10rpx;
}

.evidence-photos {
  display: flex;
  gap: 8rpx;
}

.evidence-photo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  background: #eee;
}

.detail-pending {
  margin-top: 10rpx;
}

.pending-text {
  font-size: 22rpx;
  color: #ff8e3c;
}

.calendar-empty {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: $color-text-secondary;
}

.reminder-modal {
  width: 80%;
}

.reminder-body {
  padding: 20rpx 0;
  text-align: center;
}

.reminder-text {
  font-size: 30rpx;
  font-weight: 600;
  color: $color-text-main;
  display: block;
}

.reminder-sub {
  font-size: 24rpx;
  color: $color-text-secondary;
  margin-top: 8rpx;
  display: block;
}

.reminder-actions {
  display: flex;
  gap: 16rpx;
  padding: 10rpx 0 20rpx;
}

.reminder-delay {
  display: flex;
  gap: 12rpx;
  align-items: center;
  padding-bottom: 10rpx;
}

.delay-input {
  flex: 1;
  height: 64rpx;
  border-radius: 32rpx;
  background: #f5f5f5;
  padding: 0 20rpx;
  font-size: 24rpx;
}

.banner-left {
  width: 40rpx;
}

.banner-swiper-vertical {
  flex: 1;
  height: 56rpx;
}

.notice-banner-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.notice-banner-title {
  font-size: 28rpx;
  color: #8d6b00;
  font-weight: 600;
}

.notice-banner-content {
  font-size: 24rpx;
  color: #8d6b00;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-right {
  background: #ff9f0a;
  color: #fff;
  border-radius: 20rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
}

/* Tabs */
.tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: $shadow-sm;
  
  .tabs {
    display: flex;
    height: 88rpx;
    align-items: center;
    justify-content: space-around;
    
    .tab-item {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      
      .tab-text {
        font-size: 28rpx;
        color: $color-text-regular;
        transition: all 0.3s;
      }
      
      &.active {
        .tab-text {
          color: $color-text-main;
          font-weight: 600;
          font-size: 30rpx;
          transform: scale(1.05);
        }
        
        .tab-line {
          position: absolute;
          bottom: 12rpx;
          width: 32rpx;
          height: 6rpx;
          background: $color-primary-gradient;
          border-radius: 4rpx;
          box-shadow: 0 2rpx 6rpx rgba(255, 142, 60, 0.4);
        }
      }
    }
  }
}

.order-list {
  padding: $spacing-md;
}

/* Order Card */
.order-card {
  background: $color-bg-card;
  border-radius: $radius-md;
  padding: 30rpx;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-card;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.995);
  }
  
  &.highlight {
    border: 2rpx solid $color-primary;
    box-shadow: 0 10rpx 30rpx rgba(255, 142, 60, 0.3);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .order-no {
        background: #F0F2F5;
        border-radius: 4rpx;
        padding: 2rpx 8rpx;
        margin-right: 12rpx;
        
        .no-text {
          font-size: 22rpx;
          color: $color-text-secondary;
          font-family: monospace;
        }
      }

      .service-tag {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        margin-right: 16rpx;
        font-weight: 500;
        
        &.FEEDING { background: $color-primary-light; color: $color-primary; }
        &.WALKING { background: #E6F7FF; color: $color-blue; }
      }
      
      .order-time {
        font-size: 24rpx;
        color: $color-text-secondary;
      }
    }
    
    .status-text {
      font-size: 26rpx;
      font-weight: 600;
      
      &.pending { color: $color-primary; }
      &.accepted { color: $color-blue; }
      &.in_service { color: $color-success; }
      &.completed { color: $color-text-main; }
      &.reviewed { color: $color-text-secondary; }
      &.cancelled { color: $color-text-secondary; }
    }
  }
  
  .divider {
    height: 1rpx;
    background: #F5F5F5;
    margin: 0 -30rpx $spacing-md;
  }
  
  .card-body {
    .info-row {
      display: flex;
      margin-bottom: 20rpx;
      
      &:last-child { margin-bottom: 0; }
      
      .label-box {
        display: flex;
        align-items: flex-start;
        width: 120rpx;
        margin-right: 16rpx;
        
        .icon { font-size: 28rpx; margin-right: 8rpx; }
        .label { font-size: 26rpx; color: $color-text-secondary; }
      }
      
      .content-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        // Allow horizontal layout for address row
        &:has(.address) {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .main-text {
          font-size: 28rpx;
          color: $color-text-main;
          font-weight: 500;
          line-height: 1.4;
          
          &.address {
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            flex: 1;
            padding-right: 12rpx;
          }
        }
        
        .distance-tag {
           font-size: 24rpx;
           color: $color-primary;
           font-weight: bold;
           flex-shrink: 0;
           margin-top: 4rpx;
        }
        
        .sub-text {
          font-size: 24rpx;
          color: $color-text-secondary;
          margin-top: 4rpx;
        }
        
        &.sitter-row {
            flex-direction: row;
            align-items: center;
            
            .level-tag {
                font-size: 20rpx;
                padding: 2rpx 8rpx;
                border-radius: 4rpx;
                margin-left: 12rpx;
                
                &.gold { background: #FFF7E6; color: #FA8C16; border: 1px solid #FFD591; }
                &.silver { background: #F5F5F5; color: #666; border: 1px solid #D9D9D9; }
                &.bronze { background: #FFF1F0; color: #CF1322; border: 1px solid #FFA39E; }
            }
            
            .arrow {
                margin-left: auto;
                color: #CCC;
                font-size: 24rpx;
            }
        }
      }
    }
  }
  
  .card-footer {
    margin-top: 30rpx;
    padding-top: $spacing-md;
    border-top: 1rpx dashed #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .price-section {
      .currency { font-size: 24rpx; color: $color-price; font-weight: 600; }
      .amount { font-size: 36rpx; color: $color-price; font-weight: bold; }
    }
    
    .action-group {
      display: flex;
      gap: 16rpx;
      
      .action-btn {
        margin: 0;
        padding: 0 24rpx;
        height: 60rpx;
        line-height: 58rpx;
        font-size: 24rpx;
        border-radius: 30rpx;
        
        &.outline {
          background: #fff;
          border: 1rpx solid #ddd;
          color: $color-text-regular;
        }
        
        &.primary {
          background: $color-primary;
          border: 1rpx solid $color-primary;
          color: #fff;
          box-shadow: 0 4rpx 10rpx rgba(255, 142, 60, 0.2);
        }
        
        &::after { border: none; }
      }
    }
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  
  .empty-img {
    width: 320rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $color-text-secondary;
    margin-bottom: 40rpx;
  }
  
  .btn-publish {
    width: 240rpx;
    height: 80rpx;
    line-height: 80rpx;
    background: $color-primary-gradient;
    color: #fff;
    font-size: 28rpx;
    border-radius: 40rpx;
    box-shadow: $shadow-primary;
    &::after { border: none; }
  }
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: fadeIn 0.2s forwards;
  
  .modal-content {
    width: 600rpx;
    background: #fff;
    border-radius: $radius-lg;
    overflow: hidden;
    transform: scale(0.9);
    animation: scaleIn 0.2s forwards;
    box-shadow: $shadow-lg;
    
    &.review-modal {
       padding: 40rpx 30rpx;
       display: flex;
       flex-direction: column;
       align-items: center;
       
       .review-header {
           text-align: center;
           margin-bottom: 40rpx;
           .title { display: block; font-size: 34rpx; font-weight: bold; color: $color-text-main; margin-bottom: 12rpx; }
           .sub { font-size: 24rpx; color: $color-text-secondary; }
       }
       
       .rating-stars {
           display: flex;
           gap: 20rpx;
           margin-bottom: 20rpx;
           
           .star-item {
               padding: 10rpx;
               .star-icon {
                   font-size: 64rpx;
                   color: #E0E0E0;
                   transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                   &.active { 
                       color: #FFC107; 
                       transform: scale(1.15); 
                       text-shadow: 0 4rpx 10rpx rgba(255, 193, 7, 0.4);
                   }
               }
           }
       }
       
       .rating-desc {
           font-size: 30rpx;
           color: $color-primary;
           font-weight: 600;
           margin-bottom: 40rpx;
           height: 40rpx;
           opacity: 0.9;
       }
       
       .input-wrapper {
           width: 100%;
           background: #F8F9FA;
           border-radius: $radius-md;
           padding: 24rpx;
           margin-bottom: 40rpx;
           border: 1px solid transparent;
           transition: all 0.3s;
           
           &:focus-within {
             background: #fff;
             border-color: $color-primary;
             box-shadow: 0 0 0 4rpx rgba(255, 142, 60, 0.1);
           }
           
           .review-textarea {
               width: 100%;
               height: 160rpx;
               font-size: 28rpx;
               color: $color-text-main;
               line-height: 1.5;
           }
           
           .placeholder { color: $color-text-placeholder; }
       }
       
       .modal-actions {
           width: 100%;
           display: flex;
           gap: 24rpx;
           
           button {
               flex: 1;
               height: 80rpx;
               line-height: 80rpx;
               border-radius: 40rpx;
               font-size: 28rpx;
               font-weight: 500;
               &::after { border: none; }
           }
           
           .btn-cancel { background: #F5F5F5; color: $color-text-regular; }
           .btn-submit { 
             background: $color-primary-gradient; 
             color: #fff; 
             box-shadow: $shadow-primary; 
             
             &:active { opacity: 0.9; transform: scale(0.98); }
           }
       }
    }
    
    &.profile-modal {
       padding: 0;
       background: #F8F9FA;
       
       .modal-header {
           padding: 24rpx 30rpx;
           background: #fff;
           display: flex;
           justify-content: space-between;
           align-items: center;
           border-bottom: 1rpx solid #eee;
           
           .title { font-size: 32rpx; font-weight: 600; color: $color-text-main; }
           .close-btn { font-size: 40rpx; color: $color-text-secondary; line-height: 1; padding: 10rpx; }
       }
       
       .sitter-profile {
           padding: 30rpx;
           
           .profile-header-card {
               background: #fff;
               border-radius: $radius-md;
               padding: 40rpx 30rpx;
               display: flex;
               flex-direction: column;
               align-items: center;
               margin-bottom: 24rpx;
               box-shadow: $shadow-sm;
               
               .avatar-box {
                   width: 140rpx;
                   height: 140rpx;
                   background: $color-secondary;
                   border-radius: 50%;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   font-size: 60rpx;
                   color: #fff;
                   font-weight: 600;
                   margin-bottom: 24rpx;
                   box-shadow: 0 8rpx 20rpx rgba(255, 209, 220, 0.6);
                   border: 4rpx solid #fff;
               }
               
               .name { font-size: 36rpx; font-weight: bold; color: $color-text-main; margin-bottom: 16rpx; }
               
               .tags-row {
                   display: flex;
                   gap: 16rpx;
                   
                   .tag {
                       font-size: 22rpx;
                       padding: 6rpx 20rpx;
                       border-radius: 100rpx;
                       font-weight: 500;
                       
                       &.level { background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff; box-shadow: 0 4rpx 10rpx rgba(255, 165, 0, 0.3); }
                       &.verify { background: #E6F7FF; color: $color-blue; }
                   }
               }
           }
           
           .stats-grid {
               display: flex;
               justify-content: space-between;
               background: #fff;
               border-radius: $radius-md;
               padding: 30rpx;
               margin-bottom: 24rpx;
               box-shadow: $shadow-sm;
               
               .stat-box {
                   flex: 1;
                   display: flex;
                   flex-direction: column;
                   align-items: center;
                   position: relative;
                   
                   &:not(:last-child)::after {
                       content: '';
                       position: absolute;
                       right: 0;
                       top: 15%;
                       height: 70%;
                       width: 1rpx;
                       background: #eee;
                   }
                   
                   .num { font-size: 32rpx; font-weight: bold; color: $color-text-main; margin-bottom: 8rpx; }
                   .label { font-size: 24rpx; color: $color-text-secondary; }
               }
           }
           
           .info-block {
               background: #fff;
               border-radius: $radius-md;
               padding: 30rpx;
               box-shadow: $shadow-sm;
               
               .block-title { font-size: 28rpx; font-weight: 600; color: $color-text-main; margin-bottom: 16rpx; display: block; }
               .block-content { font-size: 26rpx; color: $color-text-regular; line-height: 1.6; text-align: justify; }
           }
       }
    }
    
    .modal-header {
      padding: 30rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1rpx solid #f5f5f5;
      
      .title { font-size: 32rpx; font-weight: 600; color: $color-text-main; }
      .close-btn { font-size: 44rpx; color: $color-text-secondary; line-height: 1; padding: 10rpx; }
    }
    
    .complete-form {
        padding: 0 30rpx 40rpx;
        
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
              border-radius: $radius-sm;
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
              color: $color-text-placeholder;
              border: 2rpx dashed #DDD;
              transition: all 0.3s;
              
              &:active { background: #eee; }
            }
          }
        }
    }
  }
}

.btn-primary {
  background: $color-primary-gradient;
  color: #fff;
  border-radius: 40rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: $shadow-primary;
  &.block { width: 100%; display: block; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.calendar-popup {
  padding: 0;
  
  .modal-header {
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid #eee;
    .title { font-size: 30rpx; font-weight: 600; }
  }
  
  .popup-body {
    padding: 30rpx;
    
    .info-row {
      display: flex;
      margin-bottom: 20rpx;
      font-size: 26rpx;
      align-items: center;
      
      .label {
        color: $color-text-secondary;
        width: 140rpx;
      }
      
      .val {
        color: $color-text-main;
        flex: 1;
      }
      
      .service-tag {
        font-size: 22rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        &.FEEDING { background: $color-primary-light; color: $color-primary; }
        &.WALKING { background: #E6F7FF; color: $color-blue; }
      }
      
      .status-text {
        font-weight: 600;
        &.pending { color: $color-primary; }
        &.accepted { color: $color-blue; }
        &.in_service { color: $color-success; }
        &.completed { color: $color-text-main; }
        &.reviewed { color: $color-text-secondary; }
        &.cancelled { color: $color-text-secondary; }
      }
    }
  }
}

</style>

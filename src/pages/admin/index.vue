<template>
  <view class="admin-dashboard">
    <!-- 顶部导航栏 -->
    <view class="admin-header">
      <view class="header-left">
        <image class="logo" src="/static/logo.png" mode="aspectFit" />
        <text class="title">管理后台</text>
      </view>
      <view class="header-right">
        <text class="admin-name">{{ adminInfo?.username || '管理员' }}</text>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </view>
    </view>
    
    <!-- 侧边栏导航 -->
    <view class="admin-container">
      <view class="sidebar">
        <view 
          v-for="menu in menuItems" 
          :key="menu.key"
          class="menu-item"
          :class="{ active: currentMenu === menu.key }"
          @click="switchMenu(menu.key)"
        >
          <text class="menu-icon">{{ menu.icon }}</text>
          <text class="menu-text">{{ menu.label }}</text>
        </view>
      </view>
      
      <!-- 主内容区域 -->
      <view class="main-content">
        <!-- 用户管理 -->
        <view v-if="currentMenu === 'users'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">用户管理</text>
            <view class="panel-actions">
              <input 
                v-model="searchKeyword" 
                placeholder="搜索用户..." 
                class="search-input"
                @input="handleSearch"
              />
              <button class="action-btn" @click="refreshUsers">刷新</button>
            </view>
          </view>
          
          <view class="data-table">
            <view class="table-header">
              <view class="table-row">
                <text class="table-cell">用户ID</text>
                <text class="table-cell">昵称</text>
                <text class="table-cell">手机号</text>
                <text class="table-cell">角色</text>
                <text class="table-cell">状态</text>
                <text class="table-cell">注册时间</text>
                <text class="table-cell">操作</text>
              </view>
            </view>
            <view class="table-body">
              <view 
                v-for="user in filteredUsers" 
                :key="user.id"
                class="table-row"
              >
                <text class="table-cell">{{ user.id.substring(0, 8) }}...</text>
                <text class="table-cell">{{ user.nickname || '未设置' }}</text>
                <text class="table-cell">{{ user.phone }}</text>
                <text class="table-cell">
                  <view class="role-badge" :class="user.role">
                    {{ user.role === 'owner' ? '铲屎官' : user.role === 'sitter' ? '宠托师' : '管理员' }}
                  </view>
                </text>
                <text class="table-cell">
                  <view class="status-badge" :class="user.status || 'active'">
                    {{ user.status === 'banned' ? '已禁用' : '正常' }}
                  </view>
                </text>
                <text class="table-cell">{{ formatDate(user.created_at) }}</text>
                <view class="table-cell">
                  <button 
                    class="btn-small" 
                    @click="toggleUserStatus(user)"
                    :class="user.status === 'banned' ? 'btn-success' : 'btn-danger'"
                  >
                    {{ user.status === 'banned' ? '解禁' : '禁用' }}
                  </button>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 订单管理 -->
        <view v-if="currentMenu === 'orders'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">订单管理</text>
            <view class="panel-actions">
              <picker 
                :value="orderStatusFilter" 
                :range="orderStatusOptions"
                @change="onOrderStatusChange"
                class="filter-picker"
              >
                <view class="picker-text">{{ orderStatusOptions[orderStatusFilter] || '全部状态' }}</view>
              </picker>
              <button class="action-btn" @click="refreshOrders">刷新</button>
            </view>
          </view>
          
          <view class="stats-cards">
            <view class="stat-card">
              <text class="stat-number">{{ orderStats.total }}</text>
              <text class="stat-label">总订单</text>
            </view>
            <view class="stat-card">
              <text class="stat-number">{{ orderStats.pending }}</text>
              <text class="stat-label">待接单</text>
            </view>
            <view class="stat-card">
              <text class="stat-number">{{ orderStats.processing }}</text>
              <text class="stat-label">进行中</text>
            </view>
            <view class="stat-card">
              <text class="stat-number">{{ orderStats.completed }}</text>
              <text class="stat-label">已完成</text>
            </view>
          </view>
          
          <view class="data-table">
            <view class="table-header">
              <view class="table-row">
                <text class="table-cell">订单号</text>
                <text class="table-cell">服务类型</text>
                <text class="table-cell">金额</text>
                <text class="table-cell">状态</text>
                <text class="table-cell">用户</text>
                <text class="table-cell">宠托师</text>
                <text class="table-cell">创建时间</text>
                <text class="table-cell">操作</text>
              </view>
            </view>
            <view class="table-body">
              <view 
                v-for="order in filteredOrders" 
                :key="order.id"
                class="table-row"
              >
                <text class="table-cell">{{ order.order_number }}</text>
                <text class="table-cell">{{ getServiceTypeName(order.service_type) }}</text>
                <text class="table-cell">¥{{ order.amount }}</text>
                <text class="table-cell">
                  <view class="status-badge" :class="order.status">
                    {{ getOrderStatusName(order.status) }}
                  </view>
                </text>
                <text class="table-cell">{{ order.owner_name || order.owner_phone }}</text>
                <text class="table-cell">{{ order.sitter_name || '-' }}</text>
                <text class="table-cell">{{ formatDate(order.created_at) }}</text>
                <view class="table-cell">
                  <button class="btn-small btn-info" @click="viewOrderDetail(order)">详情</button>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 系统公告 -->
        <view v-if="currentMenu === 'announcements'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">系统公告</text>
            <button class="action-btn primary" @click="showAnnouncementForm">发布公告</button>
          </view>
          
          <view class="announcement-list">
            <view 
              v-for="announcement in announcements" 
              :key="announcement.id"
              class="announcement-item"
            >
              <view class="announcement-header">
                <text class="announcement-title">{{ announcement.title }}</text>
                <view class="announcement-actions">
                  <button class="btn-small btn-warning" @click="editAnnouncement(announcement)">编辑</button>
                  <button class="btn-small btn-danger" @click="deleteAnnouncement(announcement)">删除</button>
                </view>
              </view>
              <text class="announcement-content">{{ announcement.content }}</text>
              <view class="announcement-meta">
                <text class="meta-text">发布时间: {{ formatDate(announcement.created_at) }}</text>
                <text class="meta-text">发布者: {{ announcement.created_by }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 数据统计 -->
        <view v-if="currentMenu === 'stats'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">数据统计</text>
            <button class="action-btn" @click="refreshStats">刷新数据</button>
          </view>
          
          <view class="stats-grid">
            <view class="stat-card large">
              <text class="stat-number">{{ stats.totalUsers }}</text>
              <text class="stat-label">总用户数</text>
            </view>
            <view class="stat-card large">
              <text class="stat-number">{{ stats.totalOrders }}</text>
              <text class="stat-label">总订单数</text>
            </view>
            <view class="stat-card large">
              <text class="stat-number">¥{{ stats.totalRevenue }}</text>
              <text class="stat-label">总收入</text>
            </view>
          </view>
          
          <view class="chart-container">
            <text class="chart-title">近7日订单趋势</text>
            <view class="chart-placeholder">
              <text class="chart-text">图表功能开发中...</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import adminAuthMiddleware from '@/middleware/admin';

const userStore = useUserStore();
const currentMenu = ref('users');
const searchKeyword = ref('');
const orderStatusFilter = ref(0);

const adminInfo = computed(() => userStore.adminInfo);
const users = ref<any[]>([]);
const orders = ref<any[]>([]);
const announcements = ref<any[]>([]);

const menuItems = [
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'orders', label: '订单管理', icon: '📦' },
  { key: 'announcements', label: '系统公告', icon: '📢' },
  { key: 'stats', label: '数据统计', icon: '📊' }
];

const orderStatusOptions = ['全部状态', '待接单', '已接单', '服务中', '已完成', '已取消'];

const orderStats = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0
});

const stats = reactive({
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0
});

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value;
  return users.value.filter(user => 
    user.nickname?.includes(searchKeyword.value) ||
    user.phone?.includes(searchKeyword.value)
  );
});

const filteredOrders = computed(() => {
  if (orderStatusFilter.value === 0) return orders.value;
  const statusMap = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
  const targetStatus = statusMap[orderStatusFilter.value - 1];
  return orders.value.filter(order => order.status === targetStatus);
});

const switchMenu = (menu: string) => {
  currentMenu.value = menu;
  loadDataForMenu(menu);
};

const loadDataForMenu = async (menu: string) => {
  try {
    switch (menu) {
      case 'users':
        await loadUsers();
        break;
      case 'orders':
        await loadOrders();
        break;
      case 'announcements':
        await loadAnnouncements();
        break;
      case 'stats':
        await loadStats();
        break;
    }
  } catch (error) {
    console.error(`加载${menu}数据失败:`, error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none'
    });
  }
};

const loadUsers = async () => {
  const result = await userStore.getAdminUsers();
  if (result.success && 'data' in result) {
    users.value = result.data || [];
  }
};

const loadOrders = async () => {
  const result = await userStore.getAdminOrders();
  if (result.success && 'data' in result) {
    orders.value = result.data || [];
    updateOrderStats();
  }
};

const loadAnnouncements = async () => {
  const result = await userStore.getAdminAnnouncements();
  if (result.success && 'data' in result) {
    announcements.value = result.data || [];
  }
};

const loadStats = async () => {
  const result = await userStore.getAdminStats();
  if (result.success && 'data' in result) {
    Object.assign(stats, result.data);
  }
};

const updateOrderStats = () => {
  orderStats.total = orders.value.length;
  orderStats.pending = orders.value.filter(o => o.status === 'pending').length;
  orderStats.processing = orders.value.filter(o => ['accepted', 'in_progress'].includes(o.status)).length;
  orderStats.completed = orders.value.filter(o => o.status === 'completed').length;
};

const toggleUserStatus = async (user: any) => {
  // 验证管理员权限
  const hasPermission = await adminAuthMiddleware.checkAdminOperation('禁用/解禁用户');
  if (!hasPermission) return;
  
  const action = user.status === 'banned' ? '解禁' : '禁用';
  
  uni.showModal({
    title: '确认操作',
    content: `确定要${action}用户 "${user.nickname || user.phone}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        const result = await userStore.toggleUserStatus(user.id, user.status !== 'banned');
        if (result.success) {
          uni.showToast({ title: `${action}成功`, icon: 'success' });
          await loadUsers();
        } else {
          uni.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    }
  });
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const getServiceTypeName = (type: string) => {
  const map: Record<string, string> = {
    'FEEDING': '上门喂养',
    'WALKING': '遛狗服务',
    'GROOMING': '宠物美容',
    'BOARDING': '宠物寄养',
    'DAYCARE': '日托服务',
    'TRAINING': '宠物训练',
    'HEALTH': '健康检查',
    'OTHER': '其他服务'
  };
  return map[type] || type;
};

const getOrderStatusName = (status: string) => {
  const map: Record<string, string> = {
    'pending': '待接单',
    'accepted': '已接单',
    'in_progress': '服务中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return map[status] || status;
};

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出管理后台吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.adminLogout();
        uni.redirectTo({ url: '/pages/admin/login' });
      }
    }
  });
};

const refreshUsers = () => loadUsers();
const refreshOrders = () => loadOrders();
const refreshStats = () => loadStats();

const onOrderStatusChange = (e: any) => {
  orderStatusFilter.value = e.detail.value;
};

const handleSearch = () => {
  // 搜索逻辑已通过computed属性实现
};

const viewOrderDetail = (order: any) => {
  // 跳转到订单详情页或显示详情弹窗
  uni.showModal({
    title: '订单详情',
    content: `订单号: ${order.order_number}\n服务类型: ${getServiceTypeName(order.service_type)}\n金额: ¥${order.amount}\n状态: ${getOrderStatusName(order.status)}`,
    showCancel: false
  });
};

const showAnnouncementForm = () => {
  uni.showModal({
    title: '发布公告',
    editable: true,
    placeholderText: '请输入公告内容...',
    success: async (res) => {
      if (res.confirm && res.content) {
        // 验证管理员权限
        const hasPermission = await adminAuthMiddleware.checkAdminOperation('发布公告');
        if (!hasPermission) return;
        
        const result = await userStore.createAnnouncement({
          title: '系统公告',
          content: res.content
        });
        if (result.success) {
          uni.showToast({ title: '发布成功', icon: 'success' });
          await loadAnnouncements();
        }
      }
    }
  });
};

const editAnnouncement = (announcement: any) => {
  uni.showModal({
    title: '编辑公告',
    content: announcement.content,
    editable: true,
    success: async (res) => {
      if (res.confirm && res.content) {
        // 验证管理员权限
        const hasPermission = await adminAuthMiddleware.checkAdminOperation('编辑公告');
        if (!hasPermission) return;
        
        const result = await userStore.updateAnnouncement(announcement.id, {
          content: res.content
        });
        if (result.success) {
          uni.showToast({ title: '更新成功', icon: 'success' });
          await loadAnnouncements();
        }
      }
    }
  });
};

const deleteAnnouncement = (announcement: any) => {
  uni.showModal({
    title: '删除确认',
    content: '确定要删除这条公告吗？',
    success: async (res) => {
      if (res.confirm) {
        // 验证管理员权限
        const hasPermission = await adminAuthMiddleware.checkAdminOperation('删除公告');
        if (!hasPermission) return;
        
        const result = await userStore.deleteAnnouncement(announcement.id);
        if (result.success) {
          uni.showToast({ title: '删除成功', icon: 'success' });
          await loadAnnouncements();
        }
      }
    }
  });
};

onMounted(async () => {
  // 使用中间件验证管理员权限
  const hasPermission = await adminAuthMiddleware.checkAdminOperation('访问管理后台');
  if (!hasPermission) return;
  
  // 加载初始数据
  await loadUsers();
});
</script>

<style lang="scss" scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background: #2c3e50;
  color: white;
  padding: 0 40rpx;
  height: 88rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .logo {
      width: 48rpx;
      height: 48rpx;
      border-radius: 8rpx;
    }
    
    .title {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 24rpx;
    
    .admin-name {
      font-size: 28rpx;
      opacity: 0.9;
    }
    
    .logout-btn {
      background: rgba(255,255,255,0.2);
      border: 1rpx solid rgba(255,255,255,0.3);
      color: white;
      padding: 12rpx 24rpx;
      border-radius: 8rpx;
      font-size: 24rpx;
      
      &:active {
        background: rgba(255,255,255,0.1);
      }
    }
  }
}

.admin-container {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 240rpx;
  background: white;
  border-right: 1rpx solid #e8e8e8;
  padding: 20rpx 0;
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 32rpx;
    cursor: pointer;
    transition: all 0.3s ease;
    border-left: 4rpx solid transparent;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &.active {
      background: #e3f2fd;
      border-left-color: #2196f3;
      color: #2196f3;
    }
    
    .menu-icon {
      font-size: 32rpx;
      width: 32rpx;
      text-align: center;
    }
    
    .menu-text {
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.main-content {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.content-panel {
  background: white;
  border-radius: 12rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  .panel-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  
  .panel-actions {
    display: flex;
    gap: 16rpx;
    align-items: center;
  }
}

.search-input {
  padding: 12rpx 20rpx;
  border: 1rpx solid #d9d9d9;
  border-radius: 8rpx;
  font-size: 26rpx;
  min-width: 240rpx;
  
  &:focus {
    border-color: #2196f3;
    outline: none;
  }
}

.action-btn {
  padding: 12rpx 24rpx;
  background: #f0f0f0;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  
  &.primary {
    background: #2196f3;
    color: white;
  }
  
  &:active {
    opacity: 0.8;
  }
}

.data-table {
  .table-header {
    background: #fafafa;
    border-radius: 8rpx 8rpx 0 0;
    
    .table-row {
      font-weight: 600;
      color: #333;
    }
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1.2fr 0.8fr 0.8fr 1.2fr 1fr;
    gap: 16rpx;
    padding: 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
    align-items: center;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .table-cell {
    font-size: 26rpx;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.role-badge {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  
  &.owner { background: #e8f5e8; color: #4caf50; }
  &.sitter { background: #fff3e0; color: #ff9800; }
  &.admin { background: #e3f2fd; color: #2196f3; }
}

.status-badge {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  
  &.active { background: #e8f5e8; color: #4caf50; }
  &.banned { background: #ffebee; color: #f44336; }
  &.pending { background: #fff3e0; color: #ff9800; }
  &.accepted { background: #e3f2fd; color: #2196f3; }
  &.in_progress { background: #e8f5e8; color: #4caf50; }
  &.completed { background: #f3e5f5; color: #9c27b0; }
  &.cancelled { background: #ffebee; color: #f44336; }
}

.btn-small {
  padding: 8rpx 16rpx;
  border: none;
  border-radius: 6rpx;
  font-size: 22rpx;
  cursor: pointer;
  
  &.btn-success { background: #4caf50; color: white; }
  &.btn-danger { background: #f44336; color: white; }
  &.btn-info { background: #2196f3; color: white; }
  &.btn-warning { background: #ff9800; color: white; }
  
  &:active {
    opacity: 0.8;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32rpx;
  border-radius: 12rpx;
  text-align: center;
  
  &.large {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  .stat-number {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    margin-bottom: 8rpx;
  }
  
  .stat-label {
    font-size: 24rpx;
    opacity: 0.9;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.announcement-list {
  .announcement-item {
    background: #f8f9fa;
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    border-left: 4rpx solid #2196f3;
  }
  
  .announcement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }
  
  .announcement-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
  }
  
  .announcement-content {
    font-size: 26rpx;
    color: #666;
    line-height: 1.6;
    margin-bottom: 16rpx;
  }
  
  .announcement-meta {
    display: flex;
    gap: 32rpx;
    font-size: 22rpx;
    color: #999;
  }
  
  .announcement-actions {
    display: flex;
    gap: 12rpx;
  }
}

.chart-container {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 32rpx;
  text-align: center;
  
  .chart-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
  }
  
  .chart-placeholder {
    height: 300rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 8rpx;
    border: 2rpx dashed #ddd;
  }
  
  .chart-text {
    color: #999;
    font-size: 24rpx;
  }
}

.filter-picker {
  .picker-text {
    padding: 12rpx 20rpx;
    background: #f0f0f0;
    border-radius: 8rpx;
    font-size: 26rpx;
    color: #333;
    min-width: 160rpx;
    text-align: center;
  }
}
</style>
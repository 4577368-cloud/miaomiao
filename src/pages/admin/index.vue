<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { AdminAPI } from '@/utils/admin-api';

const userStore = useUserStore();
const adminInfo = computed(() => userStore.userInfo);

// 菜单配置
const menuItems = [
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'certifications', label: '认证管理', icon: 'verify_icon' }, // 替换为图标字符或组件
  { key: 'orders', label: '订单管理', icon: '📦' },
  { key: 'services', label: '服务管理', icon: '💰' },
  { key: 'announcements', label: '系统公告', icon: '📢' },
  { key: 'stats', label: '数据统计', icon: '📊' },
];

const currentMenu = ref('users');
const searchKeyword = ref('');

// --- 用户管理状态 ---
const users = ref<any[]>([]);
const showEditUserModal = ref(false);
const editingUser = ref<any>({});
const editForm = ref({
  balance: 0,
  points: 0
});

// --- 订单管理状态 ---
const orders = ref<any[]>([]);
const orderStatusFilter = ref(0);
const orderStatusOptions = ['全部状态', '待接单', '进行中', '已完成', '已取消'];
const orderStats = ref({ total: 0, pending: 0, processing: 0, completed: 0 });

// --- 认证管理状态 ---
const certifications = ref<any[]>([]);
const certFilter = ref('pending'); // pending, approved, rejected

// --- 服务管理状态 ---
const services = ref<any[]>([]);
const showPriceModal = ref(false);
const editingService = ref<any>({});
const priceForm = ref({
  price: 0,
  discount: 100
});

// --- 公告管理状态 ---
const announcements = ref<any[]>([]);
const showAnnouncementModal = ref(false);
const announcementForm = ref({
  title: '',
  content: ''
});

// --- 初始化与加载 ---
onMounted(() => {
  loadData();
});

const loadData = () => {
  switch (currentMenu.value) {
    case 'users':
      fetchUsers();
      break;
    case 'orders':
      fetchOrders();
      break;
    case 'certifications':
      fetchCertifications();
      break;
    case 'services':
      fetchServices();
      break;
    case 'announcements':
      fetchAnnouncements();
      break;
    case 'stats':
      // fetchStats();
      break;
  }
};

const switchMenu = (key: string) => {
  currentMenu.value = key;
  loadData();
};

const handleLogout = () => {
  userStore.clearUser();
  uni.redirectTo({ url: '/pages/admin/login' });
};

// --- 用户管理逻辑 ---
const fetchUsers = async () => {
  const result = await AdminAPI.getUsers();
  if (result.success) {
    users.value = result.data || [];
  }
};

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value;
  const keyword = searchKeyword.value.toLowerCase();
  return users.value.filter(u => 
    (u.nickname && u.nickname.toLowerCase().includes(keyword)) ||
    (u.phone && u.phone.includes(keyword)) ||
    (u.id && u.id.includes(keyword))
  );
});

const toggleUserStatus = async (user: any) => {
  const newStatus = user.status === 'banned' ? 'active' : 'banned';
  const result = await AdminAPI.updateUserStatus(user.id, newStatus);
  if (result.success) {
    user.status = newStatus;
    uni.showToast({ title: '状态已更新', icon: 'success' });
  } else {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const openEditUser = (user: any) => {
  editingUser.value = user;
  editForm.value = {
    balance: user.balance || 0,
    points: user.points || 0
  };
  showEditUserModal.value = true;
};

const saveUserAssets = async () => {
  const result = await AdminAPI.updateUserAssets(
    editingUser.value.id,
    editForm.value.balance,
    editForm.value.points
  );
  
  if (result.success) {
    uni.showToast({ title: '保存成功', icon: 'success' });
    showEditUserModal.value = false;
    fetchUsers(); // 刷新列表
  } else {
    uni.showToast({ title: '保存失败: ' + result.error, icon: 'none' });
  }
};

// --- 订单管理逻辑 ---
const fetchOrders = async () => {
  const result = await AdminAPI.getOrders();
  if (result.success) {
    orders.value = result.data || [];
    calculateOrderStats();
  }
};

const calculateOrderStats = () => {
  const list = orders.value;
  orderStats.value = {
    total: list.length,
    pending: list.filter(o => o.status === 'PENDING').length,
    processing: list.filter(o => ['ACCEPTED', 'IN_SERVICE'].includes(o.status)).length,
    completed: list.filter(o => o.status === 'COMPLETED').length
  };
};

const filteredOrders = computed(() => {
  let list = orders.value;
  if (orderStatusFilter.value > 0) {
    const statusMap = ['', 'PENDING', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'];
    // 注意：这里简化了状态映射，实际可能需要更精确的匹配
    const target = statusMap[orderStatusFilter.value];
    if (target === 'IN_SERVICE') {
       list = list.filter(o => ['ACCEPTED', 'IN_SERVICE'].includes(o.status));
    } else {
       list = list.filter(o => o.status === target);
    }
  }
  return list;
});

const onOrderStatusChange = (e: any) => {
  orderStatusFilter.value = e.detail.value;
};

const getServiceTypeName = (type: string) => {
  const map: Record<string, string> = {
    'FEEDING': '上门喂养',
    'WALKING': '上门遛宠',
    'FOSTER': '家庭寄养'
  };
  return map[type] || type;
};

const getOrderStatusName = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': '待接单',
    'ACCEPTED': '已接单',
    'IN_SERVICE': '服务中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'REVIEWED': '已评价'
  };
  return map[status] || status;
};

// --- 认证管理逻辑 ---
const fetchCertifications = async () => {
  const result = await AdminAPI.getSitterCertifications(certFilter.value);
  if (result.success) {
    certifications.value = result.data || [];
  }
};

const handleVerifySitter = async (sitterId: string, status: string) => {
  const result = await AdminAPI.verifySitter(sitterId, status);
  if (result.success) {
    uni.showToast({ title: '操作成功', icon: 'success' });
    fetchCertifications();
  } else {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

// --- 服务管理逻辑 ---
const fetchServices = async () => {
  const result = await AdminAPI.getServices();
  if (result.success) {
    services.value = result.data || [];
  }
};

const openPriceModal = (service: any) => {
  editingService.value = service;
  priceForm.value = {
    price: service.base_price,
    discount: service.discount_percent || 100
  };
  showPriceModal.value = true;
};

const saveServicePrice = async () => {
  const result = await AdminAPI.updateServicePrice(
    editingService.value.id,
    parseFloat(priceForm.value.price as any),
    parseInt(priceForm.value.discount as any)
  );
  
  if (result.success) {
    uni.showToast({ title: '修改成功', icon: 'success' });
    showPriceModal.value = false;
    fetchServices();
  } else {
    uni.showToast({ title: '修改失败', icon: 'none' });
  }
};

// --- 公告管理逻辑 ---
const fetchAnnouncements = async () => {
  const result = await AdminAPI.getAnnouncements();
  if (result.success) {
    announcements.value = result.data || [];
  }
};

const showAnnouncementForm = () => {
  announcementForm.value = { title: '', content: '' };
  showAnnouncementModal.value = true;
};

const submitAnnouncement = async () => {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  
  const result = await AdminAPI.createAnnouncement({
    title: announcementForm.value.title,
    content: announcementForm.value.content,
    created_by: adminInfo.value?.username || 'admin'
  });
  
  if (result.success) {
    uni.showToast({ title: '发布成功', icon: 'success' });
    showAnnouncementModal.value = false;
    fetchAnnouncements();
  } else {
    uni.showToast({ title: '发布失败', icon: 'none' });
  }
};

const deleteAnnouncement = async (item: any) => {
  const confirm = await uni.showModal({
    title: '确认删除',
    content: '确定要删除这条公告吗？',
    confirmText: '删除',
    confirmColor: '#ff4d4f'
  });
  
  if (confirm.confirm) {
    const result = await AdminAPI.deleteAnnouncement(item.id);
    if (result.success) {
      uni.showToast({ title: '删除成功', icon: 'success' });
      fetchAnnouncements();
    } else {
      uni.showToast({ title: '删除失败', icon: 'none' });
    }
  }
};

// 通用格式化
const formatDate = (str: string) => {
  if (!str) return '-';
  return new Date(str).toLocaleString();
};

const refreshData = () => {
  loadData();
};
</script>

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
        <!-- 1. 用户管理 -->
        <view v-if="currentMenu === 'users'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">用户管理</text>
            <view class="panel-actions">
              <input 
                v-model="searchKeyword" 
                placeholder="搜索用户..." 
                class="search-input"
              />
              <button class="action-btn" @click="fetchUsers">刷新</button>
            </view>
          </view>
          
          <view class="data-table">
            <view class="table-header">
              <view class="table-row">
                <text class="table-cell">用户</text>
                <text class="table-cell">角色</text>
                <text class="table-cell">余额/积分</text>
                <text class="table-cell">状态</text>
                <text class="table-cell">注册时间</text>
                <text class="table-cell">操作</text>
              </view>
            </view>
            <view class="table-body">
              <view v-for="user in filteredUsers" :key="user.id" class="table-row">
                <view class="table-cell user-info-cell">
                   <text class="cell-main">{{ user.nickname || '未设置' }}</text>
                   <text class="cell-sub">{{ user.phone }}</text>
                </view>
                <text class="table-cell">
                  <view class="role-badge" :class="user.role">
                    {{ user.role === 'owner' ? '铲屎官' : user.role === 'sitter' ? '宠托师' : '管理员' }}
                  </view>
                </text>
                <view class="table-cell">
                   <text class="money">¥{{ user.balance || 0 }}</text>
                   <text class="points">pts: {{ user.points || 0 }}</text>
                </view>
                <text class="table-cell">
                  <view class="status-badge" :class="user.status || 'active'">
                    {{ user.status === 'banned' ? '已禁用' : '正常' }}
                  </view>
                </text>
                <text class="table-cell date-cell">{{ formatDate(user.created_at) }}</text>
                <view class="table-cell actions">
                  <button class="btn-small btn-primary" @click="openEditUser(user)">编辑</button>
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
        
        <!-- 2. 认证管理 -->
        <view v-if="currentMenu === 'certifications'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">宠托师认证</text>
            <view class="filter-tabs">
               <text :class="{active: certFilter === 'pending'}" @click="certFilter='pending'; fetchCertifications()">待审核</text>
               <text :class="{active: certFilter === 'approved'}" @click="certFilter='approved'; fetchCertifications()">已通过</text>
            </view>
          </view>
          
          <view class="data-table">
            <view class="table-header">
               <view class="table-row">
                  <text class="table-cell">申请人</text>
                  <text class="table-cell">经验/等级</text>
                  <text class="table-cell">实名信息</text>
                  <text class="table-cell">申请时间</text>
                  <text class="table-cell">操作</text>
               </view>
            </view>
            <view class="table-body">
               <view v-for="cert in certifications" :key="cert.id" class="table-row">
                  <view class="table-cell">
                     <text class="cell-main">{{ cert.nickname }}</text>
                     <text class="cell-sub">{{ cert.phone }}</text>
                  </view>
                  <view class="table-cell">
                     <text>{{ cert.experience_years || 0 }}年经验</text>
                     <text class="tag">{{ cert.level || '初级' }}</text>
                  </view>
                  <view class="table-cell">
                     <text class="cell-main">{{ cert.real_name }}</text>
                     <text class="cell-sub">{{ cert.id_card }}</text>
                  </view>
                  <text class="table-cell date-cell">{{ formatDate(cert.submitted_at) }}</text>
                  <view class="table-cell actions" v-if="cert.status === 'pending'">
                     <button class="btn-small btn-success" @click="handleVerifySitter(cert.id, 'approved')">通过</button>
                     <button class="btn-small btn-danger" @click="handleVerifySitter(cert.id, 'rejected')">拒绝</button>
                  </view>
                  <text class="table-cell" v-else>
                     {{ cert.status === 'approved' ? '已通过' : '已拒绝' }}
                  </text>
               </view>
               <view v-if="certifications.length === 0" class="empty-tip">暂无数据</view>
            </view>
          </view>
        </view>

        <!-- 3. 订单管理 -->
        <view v-if="currentMenu === 'orders'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">订单管理</text>
            <picker 
              :value="orderStatusFilter" 
              :range="orderStatusOptions"
              @change="onOrderStatusChange"
            >
              <view class="picker-btn">{{ orderStatusOptions[orderStatusFilter] }} ▼</view>
            </picker>
          </view>
          
          <view class="stats-cards">
            <view class="stat-card">
              <text class="stat-num">{{ orderStats.total }}</text>
              <text class="stat-lbl">总订单</text>
            </view>
            <view class="stat-card">
              <text class="stat-num">{{ orderStats.pending }}</text>
              <text class="stat-lbl">待接单</text>
            </view>
            <view class="stat-card">
              <text class="stat-num">{{ orderStats.processing }}</text>
              <text class="stat-lbl">进行中</text>
            </view>
          </view>
          
          <view class="data-table">
            <view class="table-header">
              <view class="table-row">
                <text class="table-cell">订单号</text>
                <text class="table-cell">类型</text>
                <text class="table-cell">金额</text>
                <text class="table-cell">状态</text>
                <text class="table-cell">时间</text>
              </view>
            </view>
            <view class="table-body">
              <view v-for="order in filteredOrders" :key="order.id" class="table-row">
                <text class="table-cell">{{ order.id.slice(0, 8) }}...</text>
                <text class="table-cell">{{ getServiceTypeName(order.service_type) }}</text>
                <text class="table-cell">¥{{ order.total_price }}</text>
                <text class="table-cell">
                  <text class="status-tag" :class="order.status">{{ getOrderStatusName(order.status) }}</text>
                </text>
                <text class="table-cell date-cell">{{ formatDate(order.created_at) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 4. 服务管理 -->
        <view v-if="currentMenu === 'services'" class="content-panel">
           <view class="panel-header">
              <text class="panel-title">服务定价管理</text>
              <button class="action-btn" @click="fetchServices">刷新</button>
           </view>
           <view class="data-table">
              <view class="table-header">
                 <view class="table-row">
                    <text class="table-cell">服务名称</text>
                    <text class="table-cell">基础价格</text>
                    <text class="table-cell">当前折扣</text>
                    <text class="table-cell">折后价</text>
                    <text class="table-cell">操作</text>
                 </view>
              </view>
              <view class="table-body">
                 <view v-for="svc in services" :key="svc.id" class="table-row">
                    <text class="table-cell">{{ svc.name }}</text>
                    <text class="table-cell">¥{{ svc.base_price }}</text>
                    <text class="table-cell highlight">{{ svc.discount_percent }}%</text>
                    <text class="table-cell">¥{{ (svc.base_price * svc.discount_percent / 100).toFixed(1) }}</text>
                    <view class="table-cell">
                       <button class="btn-small btn-primary" @click="openPriceModal(svc)">修改定价</button>
                    </view>
                 </view>
              </view>
           </view>
        </view>

        <!-- 5. 系统公告 -->
        <view v-if="currentMenu === 'announcements'" class="content-panel">
          <view class="panel-header">
            <text class="panel-title">系统公告</text>
            <button class="action-btn primary" @click="showAnnouncementForm">发布新公告</button>
          </view>
          
          <view class="announcement-list">
            <view v-for="ann in announcements" :key="ann.id" class="ann-card">
               <view class="ann-header">
                  <text class="ann-title">{{ ann.title }}</text>
                  <text class="ann-time">{{ formatDate(ann.created_at) }}</text>
               </view>
               <text class="ann-content">{{ ann.content }}</text>
               <view class="ann-footer">
                  <text class="ann-author">发布者: {{ ann.created_by }}</text>
               </view>
            </view>
          </view>
        </view>

        <!-- 6. 统计 (占位) -->
        <view v-if="currentMenu === 'stats'" class="content-panel">
           <view class="empty-state">
              <text>数据统计功能开发中...</text>
           </view>
        </view>

      </view>
    </view>
    
    <!-- 弹窗：编辑用户 -->
    <view class="modal-mask" v-if="showEditUserModal">
       <view class="modal-content">
          <view class="modal-header">
             <text class="modal-title">编辑用户: {{ editingUser.nickname }}</text>
             <text class="close-btn" @click="showEditUserModal = false">×</text>
          </view>
          <view class="modal-body">
             <view class="form-item">
                <text class="label">账户余额 (¥)</text>
                <input type="digit" v-model="editForm.balance" class="input" />
             </view>
             <view class="form-item">
                <text class="label">积分 (pts)</text>
                <input type="number" v-model="editForm.points" class="input" />
             </view>
          </view>
          <view class="modal-footer">
             <button class="btn cancel" @click="showEditUserModal = false">取消</button>
             <button class="btn confirm" @click="saveUserAssets">保存</button>
          </view>
       </view>
    </view>

    <!-- 弹窗：修改服务价格 -->
    <view class="modal-mask" v-if="showPriceModal">
       <view class="modal-content">
          <view class="modal-header">
             <text class="modal-title">修改定价: {{ editingService.name }}</text>
             <text class="close-btn" @click="showPriceModal = false">×</text>
          </view>
          <view class="modal-body">
             <view class="form-item">
                <text class="label">基础价格 (¥)</text>
                <input type="digit" v-model="priceForm.price" class="input" />
             </view>
             <view class="form-item">
                <text class="label">折扣百分比 (1-100)</text>
                <input type="number" v-model="priceForm.discount" class="input" />
             </view>
          </view>
          <view class="modal-footer">
             <button class="btn cancel" @click="showPriceModal = false">取消</button>
             <button class="btn confirm" @click="saveServicePrice">保存</button>
          </view>
       </view>
    </view>

    <!-- 弹窗：发布公告 -->
    <view class="modal-mask" v-if="showAnnouncementModal">
       <view class="modal-content large">
          <view class="modal-header">
             <text class="modal-title">发布系统公告</text>
             <text class="close-btn" @click="showAnnouncementModal = false">×</text>
          </view>
          <view class="modal-body">
             <view class="form-item">
                <text class="label">公告标题</text>
                <input v-model="announcementForm.title" class="input" placeholder="请输入标题" />
             </view>
             <view class="form-item">
                <text class="label">公告内容</text>
                <textarea v-model="announcementForm.content" class="textarea" placeholder="请输入详细内容" />
             </view>
          </view>
          <view class="modal-footer">
             <button class="btn cancel" @click="showAnnouncementModal = false">取消</button>
             <button class="btn confirm" @click="submitAnnouncement">发布</button>
          </view>
       </view>
    </view>

  </view>
</template>

<style lang="scss" scoped>
.admin-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.admin-header {
  height: 60px;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  z-index: 10;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .logo {
      width: 32px;
      height: 32px;
    }
    
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .admin-name {
      font-size: 14px;
      color: #666;
    }
    
    .logout-btn {
      font-size: 12px;
      padding: 4px 12px;
      background: #f5f5f5;
      color: #666;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        background: #e0e0e0;
      }
    }
  }
}

.admin-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background-color: #304156;
  color: #bfcbd9;
  display: flex;
  flex-direction: column;
  
  .menu-item {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: #263445;
      color: #fff;
    }
    
    &.active {
      background-color: #1890ff;
      color: #fff;
    }
    
    .menu-icon {
      font-size: 18px;
    }
    
    .menu-text {
      font-size: 14px;
    }
  }
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-panel {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .panel-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
  
  .panel-actions {
    display: flex;
    gap: 12px;
  }
}

.search-input {
  width: 240px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
}

.action-btn {
  height: 36px;
  padding: 0 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background-color: #ecf5ff;
  }
  
  &.primary {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
    
    &:hover {
      background: #40a9ff;
    }
  }
}

/* Data Table Styles */
.data-table {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  
  .table-header {
    background-color: #f5f7fa;
    font-weight: 500;
    color: #909399;
  }
  
  .table-row {
    display: flex;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .table-cell {
    flex: 1;
    padding: 12px;
    font-size: 14px;
    color: #606266;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    &.actions {
      flex-direction: row;
      gap: 8px;
      justify-content: flex-start;
    }

    &.user-info-cell {
       .cell-main { font-weight: 500; color: #333; }
       .cell-sub { font-size: 12px; color: #999; margin-top: 4px; }
    }

    &.date-cell {
       font-size: 12px;
       color: #999;
    }
    
    .money { color: #f56c6c; font-weight: 500; }
    .points { font-size: 12px; color: #67c23a; }
    .highlight { color: #f56c6c; font-weight: bold; }
  }
}

.role-badge, .status-badge, .tag, .status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-block;
  text-align: center;
}

.role-badge {
  &.owner { background: #e6f7ff; color: #1890ff; }
  &.sitter { background: #f6ffed; color: #52c41a; }
  &.admin { background: #fff0f6; color: #eb2f96; }
}

.status-badge {
  &.active { background: #f6ffed; color: #52c41a; }
  &.banned { background: #fff1f0; color: #f5222d; }
}

.status-tag {
  &.PENDING { color: #e6a23c; background: #fdf6ec; }
  &.ACCEPTED { color: #409eff; background: #ecf5ff; }
  &.IN_SERVICE { color: #67c23a; background: #f0f9eb; }
  &.COMPLETED { color: #909399; background: #f4f4f5; }
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  
  &.btn-primary { background: #ecf5ff; color: #409eff; border: 1px solid #d9ecff; }
  &.btn-success { background: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }
  &.btn-danger { background: #fef0f0; color: #f56c6c; border: 1px solid #fde2e2; }
}

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  
  .stat-card {
    flex: 1;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
    
    .stat-num {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 8px;
    }
    
    .stat-lbl {
      font-size: 14px;
      color: #909399;
    }
  }
}

.ann-card {
   border: 1px solid #ebeef5;
   border-radius: 6px;
   padding: 16px;
   margin-bottom: 16px;
   
   .ann-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      
      .ann-title { font-weight: 600; font-size: 16px; }
      .ann-time { font-size: 12px; color: #999; }
   }
   
   .ann-content {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      display: block;
      margin-bottom: 10px;
   }
   
   .ann-footer {
      text-align: right;
      font-size: 12px;
      color: #999;
   }
}

/* Modal Styles */
.modal-mask {
   position: fixed;
   top: 0;
   left: 0;
   right: 0;
   bottom: 0;
   background: rgba(0,0,0,0.5);
   display: flex;
   align-items: center;
   justify-content: center;
   z-index: 100;
}

.modal-content {
   background: #fff;
   width: 400px;
   border-radius: 8px;
   padding: 20px;
   
   &.large { width: 600px; }
   
   .modal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      
      .modal-title { font-size: 18px; font-weight: 600; }
      .close-btn { font-size: 24px; cursor: pointer; color: #999; }
   }
   
   .modal-body {
      .form-item {
         margin-bottom: 16px;
         
         .label { display: block; margin-bottom: 8px; font-size: 14px; color: #606266; }
         .input, .textarea {
            width: 100%;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            padding: 8px;
            font-size: 14px;
            box-sizing: border-box;
         }
         .textarea { height: 100px; }
      }
   }
   
   .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      
      .btn {
         padding: 8px 20px;
         border-radius: 4px;
         border: none;
         cursor: pointer;
         font-size: 14px;
         
         &.cancel { background: #f4f4f5; color: #909399; }
         &.confirm { background: #409eff; color: #fff; }
      }
   }
}

.filter-tabs {
   display: flex;
   gap: 20px;
   font-size: 14px;
   color: #666;
   
   text {
      cursor: pointer;
      padding-bottom: 4px;
      &.active {
         color: #409eff;
         border-bottom: 2px solid #409eff;
      }
   }
}
</style>

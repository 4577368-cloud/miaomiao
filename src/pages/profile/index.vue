<template>
  <view class="container">
    <!-- 顶部背景装饰 -->
    <view class="bg-decoration"></view>
    
    <!-- 个人信息卡片 -->
    <view class="header-section">
      <view class="user-card">
        <view class="user-info">
          <view class="avatar-box" @click="handleAvatarClick">
            <image v-if="userInfo?.avatar" :src="userInfo.avatar" class="avatar-img" mode="aspectFill" />
            <view v-else class="avatar"></view>
          </view>
          <view class="info-content">
            <view class="name-row">
              <text class="name">{{ userInfo?.nickname || '未登录' }}</text>
              <view class="role-badge" :class="currentRole">
                <text>{{ roleLabel }}</text>
              </view>
            </view>
            <view class="join-days" v-if="userInfo?.joinDate">
               <text>已加入 {{ joinedDays }} 天</text>
            </view>
            <text class="bio">还没有填写个人简介...</text>
          </view>
        </view>
        
        <view class="stats-row">
          <view class="stat-item" @click="navigateTo('/pages/wallet/index')">
             <view class="num-row">
               <text class="symbol">¥</text>
               <text class="num">{{ userInfo?.balance?.toFixed(2) || '0.00' }}</text>
             </view>
             <text class="label">余额</text>
          </view>
          <view class="stat-item" @click="navigateTo('/pages/wallet/index')">
            <text class="num">{{ userInfo?.coupons?.length || 0 }}</text>
            <text class="label">优惠券</text>
          </view>
          <view class="stat-item">
            <text class="num">{{ userInfo?.points || 0 }}</text>
            <text class="label">积分</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 我的爱宠 -->
    <view class="section-title" v-if="currentRole === 'owner'">我的爱宠</view>
    <view class="pets-section" v-if="currentRole === 'owner'">
      <view class="pet-card-long" v-for="pet in userInfo?.pets" :key="pet.id" @click="navigateTo('/pages/pet/index')">
        <image :src="pet.avatar || '/static/default-pet.png'" class="pet-avatar" mode="aspectFill" />
        <view class="pet-info">
          <view class="pet-header">
            <text class="pet-name">{{ pet.name }}</text>
            <text class="pet-gender">{{ pet.gender === 'male' ? '♂' : '♀' }}</text>
          </view>
          <view class="pet-details">
            <text class="detail-tag">{{ pet.breed || (pet.type === 'cat' ? '猫咪' : '狗狗') }}</text>
            <text class="detail-tag">{{ pet.age }}岁</text>
          </view>
        </view>
        <view class="pet-arrow">></view>
      </view>
      
      <view class="add-pet-btn" @click="navigateTo('/pages/pet/index')">
        <text class="plus">+</text>
        <text class="text">添加爱宠</text>
      </view>
    </view>

    <!-- 常用功能 (Bento Grid 风格) -->
    <view class="section-title">我的服务</view>
    <view class="grid-menu">
      <view class="grid-item medium blue" @click="navigateTo('/pages/address/index')">
        <view class="grid-content">
          <text class="grid-label">地址管理</text>
        </view>
        <text class="grid-icon">📍</text>
      </view>
      
      <view class="grid-item medium pink" @click="navigateTo('/pages/wallet/index')">
        <view class="grid-content">
          <text class="grid-label">我的钱包</text>
        </view>
        <text class="grid-icon">👛</text>
      </view>

      <view class="grid-item medium blue" @click="navigateTo('/pages/message/index')">
        <view class="grid-content">
          <text class="grid-label">我的消息</text>
          <text class="grid-sub">评价/通知</text>
        </view>
        <text class="grid-icon">🔔</text>
      </view>
    </view>
    
    <view class="section-title">更多功能</view>
    <view class="menu-list">
      <!-- 宠托师认证入口 -->
      <view class="menu-item" @click="handleCertificationClick">
        <view class="item-left">
          <text class="icon">🎓</text>
          <text class="label">{{ isSitter ? '宠托师中心' : '成为宠托师' }}</text>
        </view>
        <view class="item-right">
          <text class="status-tag" v-if="certificationStatus === 'verified'">已认证</text>
          <text class="status-tag pending" v-else-if="certificationStatus === 'pending'">审核中</text>
          <text class="status-tag gray" v-else>去认证</text>
          <text class="arrow">></text>
        </view>
      </view>

      <view class="menu-item" @click="navigateTo('/pages/settings/index')">
        <view class="item-left">
          <text class="icon">⚙️</text>
          <text class="label">设置</text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- Brand Footer -->
    <view class="brand-footer">
       <image src="https://imgus.tangbuy.com/static/images/2026-02-07/fb3eeeb726ef43ea9a0020b18da5290e-177045207976112019662246898497843.jpeg" class="footer-logo" mode="heightFix" />
       <text class="footer-text">宠乐到家 · 您的贴心宠托伙伴</text>
    </view>
    <view style="height: 50px;"></view>
    <CustomTabBar current-path="pages/profile/index" />
  </view>
</template>

<script setup lang="ts">
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

const currentRole = computed(() => userInfo.value?.role || 'owner');
const isSitter = computed(() => userInfo.value?.sitterProfile?.isCertified);
const certificationStatus = computed(() => userInfo.value?.sitterProfile?.certificationStatus || 'none');

const roleLabel = computed(() => {
  if (currentRole.value === 'sitter') return '宠托师';
  return '铲屎官';
});

const joinedDays = computed(() => {
  if (!userInfo.value?.joinDate) return 0;
  const now = Date.now();
  const diff = now - userInfo.value.joinDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

const handleAvatarClick = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' });
  }
};

const handleCertificationClick = () => {
  uni.navigateTo({ url: '/pages/profile/certification' });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding-bottom: 40rpx;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: -200rpx;
  right: -100rpx;
  width: 600rpx;
  height: 600rpx;
  background: radial-gradient(circle, rgba(255, 142, 60, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.header-section {
  padding: 40rpx $spacing-lg $spacing-lg;
}

.user-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-float;
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-xl;
    
    .avatar-box {
      width: 160rpx;
      height: 160rpx;
      margin-right: 24rpx;
      border-radius: 50%;
      background: #fff;
      padding: 4rpx;
      box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
      position: relative;
      
      .avatar-img, .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #eee;
      }
    }
    
    .info-content {
      flex: 1;
      
      .name-row {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .name {
          font-size: 40rpx;
          font-weight: 800;
          color: $color-text-main;
          margin-right: 16rpx;
        }
        
        .role-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(90deg, #FF8E3C 0%, #FF6B6B 100%);
          padding: 4rpx 16rpx;
          border-radius: $radius-full;
          
          &.sitter {
            background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          }
          
          text {
            color: #FFFFFF;
            font-size: 20rpx;
            font-weight: 600;
            line-height: 1;
          }
        }
      }
      
      .join-days {
        font-size: 22rpx;
        color: #999;
        margin-bottom: 12rpx;
        background: rgba(0,0,0,0.03);
        display: inline-flex;
        align-items: center;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }

      .bio {
        font-size: 26rpx;
        color: $color-text-secondary;
      }
    }
  }
  
  .stats-row {
    display: flex;
    justify-content: space-around;
    padding-top: $spacing-md;
    border-top: 1px solid rgba(0, 0, 0, 0.03);
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .num-row {
        display: flex;
        align-items: baseline;
        
        .symbol {
          font-size: 24rpx;
          font-weight: bold;
          margin-right: 2rpx;
        }
      }
      
      .num {
        font-size: 36rpx;
        font-weight: bold;
        color: $color-text-main;
        margin-bottom: 4rpx;
      }
      
      .label {
        font-size: 24rpx;
        color: $color-text-secondary;
      }
    }
  }
}

.section-title {
  padding: 0 $spacing-lg;
  font-size: 34rpx;
  font-weight: 700;
  color: $color-text-main;
  margin-bottom: $spacing-md;
}

.grid-menu {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  padding: 0 $spacing-lg $spacing-xl;
  
  .grid-item {
    background: #FFFFFF;
    border-radius: $radius-lg;
    padding: $spacing-md;
    position: relative;
    overflow: hidden;
    min-height: 180rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: $shadow-sm;
    transition: transform 0.2s;
    
    &:active {
      transform: scale(0.98);
    }
    
    &.large {
      grid-column: span 2;
      background: linear-gradient(135deg, #FFF0E5 0%, #FFFFFF 100%);
      
      .grid-icon {
        font-size: 64rpx;
        position: absolute;
        bottom: -10rpx;
        right: 20rpx;
        opacity: 0.8;
      }
    }
    
    &.medium {
      .grid-icon {
        font-size: 48rpx;
        align-self: flex-end;
      }
    }
    
    &.blue {
      background: linear-gradient(135deg, #E6F7FF 0%, #FFFFFF 100%);
    }
    
    &.pink {
      background: linear-gradient(135deg, #FFF0F6 0%, #FFFFFF 100%);
    }
    
    .grid-label {
      font-size: 30rpx;
      font-weight: 700;
      color: $color-text-main;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .grid-sub {
      font-size: 24rpx;
      color: $color-text-secondary;
    }
  }
}

  /* Pets Section */
  .pets-section {
    padding: 0 $spacing-lg;
    margin-bottom: $spacing-xl;
    
    .pet-card-long {
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border-radius: $radius-lg;
      padding: $spacing-md;
      margin-bottom: $spacing-md;
      box-shadow: $shadow-sm;
      position: relative;
      
      .pet-avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        margin-right: $spacing-md;
        background: #F5F6F8;
      }
      
      .pet-info {
        flex: 1;
        
        .pet-header {
          display: flex;
          align-items: center;
          margin-bottom: 8rpx;
          
          .pet-name {
            font-size: 32rpx;
            font-weight: 600;
            color: $color-text-main;
            margin-right: 12rpx;
          }
          
          .pet-gender {
            font-size: 24rpx;
            color: $color-text-secondary;
            background: #F5F6F8;
            padding: 2rpx 10rpx;
            border-radius: 20rpx;
          }
        }
        
        .pet-details {
          display: flex;
          align-items: center;
          
          .detail-tag {
            font-size: 24rpx;
            color: $color-text-secondary;
            background: #F9FAFB;
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
            margin-right: 12rpx;
          }
        }
      }
      
      .pet-arrow {
        color: #BFBFBF;
        font-size: 24rpx;
      }
    }
    
    .add-pet-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      border-radius: $radius-lg;
      padding: $spacing-md;
      border: 2rpx dashed #E5E7EB;
      
      .plus {
        font-size: 32rpx;
        color: $color-primary;
        margin-right: 8rpx;
        font-weight: bold;
      }
      
      .text {
        font-size: 28rpx;
        color: $color-text-main;
      }
    }
  }

.menu-list {
  margin: 0 $spacing-lg;
  background: #FFFFFF;
  border-radius: $radius-lg;
  padding: 0 $spacing-md;
  box-shadow: $shadow-sm;
  
  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    
    &:last-child {
      border-bottom: none;
    }
    
    .item-left {
      display: flex;
      align-items: center;
      
      .icon {
        font-size: 36rpx;
        margin-right: 24rpx;
      }
      
      .label {
        font-size: 30rpx;
        color: $color-text-main;
      }
    }
    
    .item-right {
      display: flex;
      align-items: center;
      
      .arrow {
        color: #BFBFBF;
        font-size: 24rpx;
        margin-left: 12rpx;
      }
      
      .status-tag {
        font-size: 22rpx;
        color: $color-success;
        background: rgba(82, 196, 26, 0.1);
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        
        &.pending {
          color: $color-warning;
          background: rgba(250, 173, 20, 0.1);
        }
        
        &.gray {
          color: $color-text-secondary;
          background: rgba(0, 0, 0, 0.05);
        }
      }
    }
  }
}

.brand-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0 40rpx;
  opacity: 0.6;
  
  .footer-logo {
    height: 60rpx;
    margin-bottom: 12rpx;
  }
  
  .footer-text {
    font-size: 20rpx;
    color: $color-text-secondary;
  }
}
</style>

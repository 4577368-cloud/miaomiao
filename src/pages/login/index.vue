<template>
  <view class="login-container">
    <view class="glass-card">
      <view class="header">
        <text class="title">欢迎来到喵汪管家</text>
        <text class="subtitle">选择您的身份开始旅程</text>
      </view>

      <view class="form-item">
        <view class="avatar-wrapper" @click="mockUploadAvatar">
          <image :src="userInfo.avatar" class="avatar" mode="aspectFill" />
          <view class="avatar-edit">
            <text class="icon-camera">📷</text>
          </view>
        </view>
        <input 
          class="input-nickname" 
          type="nickname" 
          v-model="userInfo.nickname" 
          placeholder="请输入昵称" 
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="role-selection">
        <text class="section-label">请选择身份</text>
        <view class="role-cards">
          <view 
            class="role-card" 
            :class="{ active: userInfo.role === 'owner' }"
            @click="userInfo.role = 'owner'"
          >
            <text class="role-icon">🏠</text>
            <text class="role-name">我是铲屎官</text>
            <text class="role-desc">发布需求，寻找伙伴</text>
          </view>
          
          <view 
            class="role-card" 
            :class="{ active: userInfo.role === 'sitter' }"
            @click="userInfo.role = 'sitter'"
          >
            <text class="role-icon">🎒</text>
            <text class="role-name">我是宠托师</text>
            <text class="role-desc">接单赚钱，陪伴萌宠</text>
          </view>
        </view>
      </view>

      <button class="btn-primary" @click="handleLogin">进入喵汪世界</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useUserStore, type UserInfo, type SitterProfile } from '@/stores/user';

const userStore = useUserStore();

const userInfo = reactive<UserInfo>({
  id: 'user_' + Date.now(), // 简单的 mock ID
  nickname: '铲屎官_' + Math.floor(Math.random() * 1000),
  avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
  role: 'owner'
});

const mockUploadAvatar = () => {
  uni.showToast({ title: '模拟上传头像', icon: 'none' });
};

const handleLogin = () => {
  if (!userInfo.nickname) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }

  // 如果选择我是宠托师，生成模拟的宠托师档案
  if (userInfo.role === 'sitter') {
    const levels: ('GOLD' | 'SILVER' | 'BRONZE')[] = ['GOLD', 'SILVER', 'BRONZE'];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    
    const mockProfile: SitterProfile = {
      level: randomLevel,
      completedOrders: Math.floor(Math.random() * 200),
      rating: Number((4 + Math.random()).toFixed(1)),
      experienceYears: Math.floor(Math.random() * 5) + 1,
      tags: ['实名认证', '专业培训', '有爱心'],
      bio: '我是一名热爱动物的宠托师，拥有丰富的养宠经验，期待为您服务！',
      isCertified: true
    };
    userInfo.sitterProfile = mockProfile;
    
    // 修改昵称前缀，方便区分
    if (userInfo.nickname.startsWith('铲屎官')) {
      userInfo.nickname = userInfo.nickname.replace('铲屎官', '宠托师');
    }
  }
  
  userStore.login({ ...userInfo });
  
  uni.showToast({
    title: '登录成功',
    icon: 'success',
    mask: true
  });
  
  setTimeout(() => {
    uni.switchTab({ url: '/pages/home/index' });
  }, 1500);
};
</script>

<style lang="scss" scoped>
@import '@/styles/vars.scss';

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBF5 0%, #FFF0E5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.glass-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  border-radius: 40rpx;
  border: 1px solid rgba(255, 255, 255, 0.8);
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.05);
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  
  .title {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    color: #333;
    margin-bottom: 16rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #999;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.avatar-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 30rpx;
  
  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6rpx solid #fff;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  }
  
  .avatar-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 48rpx;
    height: 48rpx;
    background: $color-primary;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid #fff;
    
    .icon-camera {
      font-size: 24rpx;
    }
  }
}

.input-nickname {
  width: 80%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 44rpx;
  text-align: center;
  font-size: 32rpx;
  color: #333;
  border: 1px solid transparent;
  transition: all 0.3s;
  
  &:focus {
    border-color: $color-primary;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(255, 142, 60, 0.1);
  }
}

.role-selection {
  margin-bottom: 60rpx;
  
  .section-label {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 24rpx;
    text-align: center;
  }
  
  .role-cards {
    display: flex;
    gap: 24rpx;
  }
  
  .role-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 24rpx;
    padding: 30rpx 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s;
    
    &.active {
      background: rgba(255, 142, 60, 0.1);
      border-color: $color-primary;
      transform: translateY(-4rpx);
      box-shadow: 0 12rpx 30rpx rgba(255, 142, 60, 0.15);
      
      .role-name {
        color: $color-primary;
        font-weight: 700;
      }
    }
    
    .role-icon {
      font-size: 48rpx;
      margin-bottom: 16rpx;
    }
    
    .role-name {
      font-size: 30rpx;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .role-desc {
      font-size: 22rpx;
      color: #999;
      text-align: center;
    }
  }
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #FF8E3C 0%, #FF6B6B 100%);
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 12rpx 30rpx rgba(255, 107, 107, 0.3);
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 6rpx 16rpx rgba(255, 107, 107, 0.2);
  }
}
</style>

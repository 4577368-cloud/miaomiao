<template>
  <view class="login-container">
    <view class="glass-card">
      <view class="header">
        <image src="https://imgus.tangbuy.com/static/images/2026-02-07/fb3eeeb726ef43ea9a0020b18da5290e-177045207976112019662246898497843.jpeg" class="brand-logo" mode="heightFix" />
        <text class="title">您的贴心宠托伙伴</text>
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

      <button class="btn-primary" @click="handleLogin">进入宠乐世界</button>
    </view>

    <!-- 头像选择弹窗 -->
    <view class="avatar-popup-mask" v-if="showAvatarPopup" @click="showAvatarPopup = false">
      <view class="avatar-popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择默认头像</text>
          <text class="popup-close" @click="showAvatarPopup = false">×</text>
        </view>
        <scroll-view scroll-y class="avatar-grid-scroll">
          <view class="avatar-grid">
            <view 
              class="avatar-item" 
              v-for="(avatar, index) in defaultAvatars" 
              :key="index"
              @click="selectAvatar(avatar)"
            >
              <image :src="avatar" mode="aspectFill" class="avatar-img" />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useUserStore, type UserInfo, type SitterProfile } from '@/stores/user';
import { getRandomNickname } from '@/utils/nickname';

const userStore = useUserStore();

const userInfo = reactive<UserInfo>({
  id: 'user_' + Date.now(), // 简单的 mock ID
  nickname: getRandomNickname(),
  avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
  role: 'owner'
});

const showAvatarPopup = ref(false);

const defaultAvatars = [
  // Cats
  '/static/avatars/cat-american.jpg',
  '/static/avatars/cat-bengal.jpg',
  '/static/avatars/cat-british.jpg',
  '/static/avatars/cat-mainecoon.jpg',
  '/static/avatars/cat-orange.jpg',
  '/static/avatars/cat-persian.jpg',
  '/static/avatars/cat-ragdoll.jpg',
  '/static/avatars/cat-russian.jpg',
  '/static/avatars/cat-siamese.jpg',
  '/static/avatars/cat-sphynx.jpg',
  '/static/avatars/cat-tabby.jpg',
  // Dogs
  '/static/avatars/dog-akita.jpg',
  '/static/avatars/dog-beagle.jpg',
  '/static/avatars/dog-bulldog.jpg',
  '/static/avatars/dog-chihuahua.jpg',
  '/static/avatars/dog-corgi.jpg',
  '/static/avatars/dog-doberman.jpg',
  '/static/avatars/dog-golden.jpg',
  '/static/avatars/dog-husky.jpg',
  '/static/avatars/dog-labrador.jpg',
  '/static/avatars/dog-pomeranian.jpg',
  '/static/avatars/dog-poodle.jpg',
  '/static/avatars/dog-pug.jpg',
  '/static/avatars/dog-rottweiler.jpg',
  '/static/avatars/dog-samoyed.jpg',
  '/static/avatars/dog-schnauzer.jpg',
  '/static/avatars/dog-shepherd.jpg',
  '/static/avatars/dog-shiba.jpg',
  '/static/avatars/dog-yorkshire.jpg'
];

const mockUploadAvatar = () => {
  showAvatarPopup.value = true;
};

const selectAvatar = (avatar: string) => {
  userInfo.avatar = avatar;
  showAvatarPopup.value = false;
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
  
  .brand-logo {
    height: 180rpx;
    margin-bottom: 24rpx;
  }
  
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
  padding: 0 40rpx;
  font-size: 32rpx;
  text-align: center;
}

.input-placeholder {
  color: #999;
}

.role-selection {
  width: 100%;
  margin-bottom: 60rpx;
  
  .section-label {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 30rpx;
    text-align: center;
  }
}

.role-cards {
  display: flex;
  justify-content: space-between;
  gap: 30rpx;
}

.role-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 24rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
  transition: all 0.3s;
  
  &.active {
    background: #fff;
    border-color: $color-primary;
    box-shadow: 0 8rpx 24rpx rgba(255, 142, 60, 0.15);
    transform: translateY(-4rpx);
  }
  
  .role-icon {
    font-size: 64rpx;
    margin-bottom: 16rpx;
  }
  
  .role-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 8rpx;
  }
  
  .role-desc {
    font-size: 22rpx;
    color: #999;
    text-align: center;
  }
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(90deg, #FF8E3C 0%, #FF6B6B 100%);
  border-radius: 48rpx;
  color: #fff;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 16rpx 32rpx rgba(255, 107, 107, 0.2);
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

// Avatar Popup Styles
.avatar-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-popup-content {
  width: 600rpx;
  max-height: 70vh;
  background: #fff;
  border-radius: 32rpx;
  display: flex;
  flex-direction: column;
  padding: 30rpx;
  box-sizing: border-box;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    flex-shrink: 0;
    
    .popup-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
    }
    
    .popup-close {
      font-size: 44rpx;
      color: #999;
      padding: 0 10rpx;
      line-height: 1;
    }
  }
  
  .avatar-grid-scroll {
    flex: 1;
    height: 0;
    min-height: 500rpx;
  }
  
  .avatar-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
    padding: 10rpx 10rpx 30rpx;
    justify-content: center;
    
    .avatar-item {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      overflow: hidden;
      border: 4rpx solid #f0f0f0;
      position: relative;
      
      .avatar-img {
        width: 100%;
        height: 100%;
      }
      
      &:active {
        transform: scale(0.95);
        border-color: $color-primary;
      }
    }
  }
}
</style>

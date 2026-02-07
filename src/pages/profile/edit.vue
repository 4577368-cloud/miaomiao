<template>
  <view class="container">
    <view class="form-card">
      <view class="avatar-section" @click="chooseAvatar">
        <image :src="form.avatar || defaultAvatar" class="avatar" mode="aspectFill" />
        <view class="camera-icon">📷</view>
      </view>
      <text class="hint">点击修改头像</text>
      
      <view class="form-item">
        <text class="label">昵称</text>
        <input class="input" v-model="form.nickname" placeholder="请输入昵称" />
      </view>

      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-options">
          <view 
            class="gender-opt male" 
            :class="{ active: form.gender === 'male' }"
            @click="form.gender = 'male'"
          >
            <text class="icon">♂</text>
            <text>男生</text>
          </view>
          <view 
            class="gender-opt female" 
            :class="{ active: form.gender === 'female' }"
            @click="form.gender = 'female'"
          >
            <text class="icon">♀</text>
            <text>女生</text>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">简介</text>
        <textarea class="textarea" v-model="form.bio" placeholder="介绍一下你自己..." auto-height />
      </view>
    </view>
    
    <view class="btn-group">
      <button class="save-btn" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const defaultAvatar = 'https://img.yzcdn.cn/vant/cat.jpeg';

const form = ref({
  nickname: '',
  avatar: '',
  bio: '',
  gender: '' as 'male' | 'female' | 'other' | ''
});

onMounted(() => {
  if (userStore.userInfo) {
    form.value.nickname = userStore.userInfo.nickname || '';
    form.value.avatar = userStore.userInfo.avatar || '';
    form.value.bio = userStore.userInfo.bio || '';
    form.value.gender = userStore.userInfo.gender || '';
  }
});

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      // In a real app, upload this file to storage and get URL
      // For now, we use the local path
      form.value.avatar = res.tempFilePaths[0];
    }
  });
};

const handleSave = async () => {
  if (!form.value.nickname) return uni.showToast({ title: '请输入昵称', icon: 'none' });
  
  uni.showLoading({ title: '保存中...' });
  
  try {
    await userStore.updateProfile({
      nickname: form.value.nickname,
      avatar: form.value.avatar,
      bio: form.value.bio,
      gender: form.value.gender || undefined
    });
    
    uni.hideLoading();
    uni.showToast({ title: '保存成功', icon: 'success' });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e: any) {
    uni.hideLoading();
    console.error(e);
    const msg = e.message || '保存失败，请稍后重试';
    uni.showToast({ title: msg, icon: 'none', duration: 3000 });
  }
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 30rpx;
}

.form-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: $shadow-sm;
}

.avatar-section {
  width: 160rpx;
  height: 160rpx;
  position: relative;
  margin-bottom: 20rpx;
  
  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #f5f5f5;
    border: 4rpx solid #fff;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  }
  
  .camera-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    background: $color-primary;
    color: #fff;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    border: 2rpx solid #fff;
  }
}

.hint {
  font-size: 24rpx;
  color: $color-text-secondary;
  margin-bottom: 40rpx;
}

.form-item {
  width: 100%;
  margin-bottom: 30rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: $color-text-main;
    margin-bottom: 16rpx;
    font-weight: bold;
  }
  
  .input {
    width: 100%;
    height: 88rpx;
    background: #F9FAFB;
    border-radius: $radius-md;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: $color-text-main;
  }
  
  .textarea {
    width: 100%;
    min-height: 160rpx;
    background: #F9FAFB;
    border-radius: $radius-md;
    padding: 24rpx;
    font-size: 28rpx;
    color: $color-text-main;
  }
  
  .gender-options {
    display: flex;
    gap: 30rpx;
    
    .gender-opt {
      flex: 1;
      height: 88rpx;
      background: #F9FAFB;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx solid transparent;
      transition: all 0.3s;
      
      .icon {
        font-size: 32rpx;
        margin-right: 12rpx;
        font-weight: bold;
      }
      
      text {
        font-size: 28rpx;
        color: $color-text-secondary;
      }
      
      &.active {
        background: #fff;
        box-shadow: $shadow-sm;
        
        &.male {
          border-color: #1890ff;
          .icon { color: #1890ff; }
          text { color: #1890ff; font-weight: bold; }
        }
        
        &.female {
          border-color: #eb2f96;
          .icon { color: #eb2f96; }
          text { color: #eb2f96; font-weight: bold; }
        }
      }
    }
  }
}

.btn-group {
  margin-top: 60rpx;
  
  .save-btn {
    background: $color-primary;
    color: #fff;
    border-radius: $radius-full;
    font-size: 32rpx;
    font-weight: bold;
    height: 88rpx;
    line-height: 88rpx;
    box-shadow: 0 8rpx 20rpx rgba(255, 142, 60, 0.3);
    
    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
  }
}
</style>

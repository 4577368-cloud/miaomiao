<template>
  <view class="container">
    <view class="form-card">
      <view class="avatar-section" @click="showAvatarPopup = true">
        <image :src="form.avatar || defaultAvatar" class="avatar" mode="aspectFill" />
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

    <!-- Avatar Selection Popup -->
    <view class="popup-mask" v-if="showAvatarPopup" @click="showAvatarPopup = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择头像</text>
          <text class="close-icon" @click="showAvatarPopup = false">×</text>
        </view>
        <scroll-view scroll-y class="avatar-grid">
           <view 
             class="grid-item" 
             v-for="(img, index) in defaultAvatars" 
             :key="index"
             @click="selectAvatar(img)"
           >
             <image :src="img" class="grid-img" mode="aspectFill" />
             <view class="selected-mark" v-if="form.avatar === img">✓</view>
           </view>
           <view class="grid-item upload-btn" @click="chooseImage">
             <text class="plus">+</text>
             <text class="text">上传</text>
           </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const defaultAvatar = 'https://img.yzcdn.cn/vant/cat.jpeg';
const showAvatarPopup = ref(false);

const defaultAvatars = [
  '/static/avatars/cat-british.jpg',
  '/static/avatars/cat-american.jpg',
  '/static/avatars/cat-siamese.jpg',
  '/static/avatars/dog-corgi.jpg',
  '/static/avatars/dog-golden.jpg',
  '/static/avatars/dog-shiba.jpg',
  '/static/avatars/dog-husky.jpg',
  '/static/avatars/dog-poodle.jpg'
];

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

const selectAvatar = (url: string) => {
  form.value.avatar = url;
  showAvatarPopup.value = false;
};

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      form.value.avatar = res.tempFilePaths[0];
      showAvatarPopup.value = false;
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
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.02);
}

.avatar-section {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
  
  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 4rpx solid #fff;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  }
  
  .camera-badge {
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
    color: #fff;
    font-size: 24rpx;
    border: 4rpx solid #fff;
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
    font-size: 28rpx;
    color: $color-text-main;
    font-weight: bold;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .input {
    width: 100%;
    height: 88rpx;
    background: #F9F9F9;
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
  
  .textarea {
    width: 100%;
    min-height: 160rpx;
    background: #F9F9F9;
    border-radius: 12rpx;
    padding: 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }
}

.gender-options {
  display: flex;
  gap: 20rpx;
  
  .gender-opt {
    flex: 1;
    height: 80rpx;
    background: #F9F9F9;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-size: 28rpx;
    color: $color-text-secondary;
    border: 2rpx solid transparent;
    transition: all 0.3s;
    
    &.active {
      background: rgba(255, 142, 60, 0.1);
      border-color: $color-primary;
      color: $color-primary;
    }
    
    .icon {
      font-weight: bold;
    }
  }
}

.btn-group {
  margin-top: 60rpx;
  
  .save-btn {
    width: 100%;
    height: 88rpx;
    background: $color-primary;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 20rpx rgba(255, 142, 60, 0.3);
  }
}

// Popup Styles
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.popup-content {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .popup-title {
      font-size: 32rpx;
      font-weight: bold;
      color: $color-text-main;
    }
    
    .close-icon {
      font-size: 40rpx;
      color: $color-text-secondary;
      padding: 10rpx;
    }
  }
  
  .avatar-grid {
    max-height: 600rpx;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    
    // Use flex-flow for scroll-view content if needed, but grid is better on the container
    // Since scroll-view has specific behavior, we put a wrapper inside if needed
    // But flex wrap works if we style the inner content
  }
  
  // Actually scroll-view content needs to be styled directly or via inner view
  // Let's use a grid container inside scroll-view
}

.avatar-grid {
  /* This targets the scroll-view component */
  white-space: normal;
  
  :deep(.uni-scroll-view-content) {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    justify-content: flex-start;
  }
  
  /* Fallback for H5/standard */
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.grid-item {
  width: 150rpx;
  height: 150rpx;
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
  
  .grid-img {
    width: 100%;
    height: 100%;
  }
  
  .selected-mark {
    position: absolute;
    top: 10rpx;
    right: 10rpx;
    width: 36rpx;
    height: 36rpx;
    background: $color-primary;
    border-radius: 50%;
    color: #fff;
    font-size: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid #fff;
  }
  
  &.upload-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2rpx dashed $color-text-secondary;
    background: #fff;
    
    .plus {
      font-size: 48rpx;
      color: $color-text-secondary;
      line-height: 1;
      margin-bottom: 10rpx;
    }
    
    .text {
      font-size: 24rpx;
      color: $color-text-secondary;
    }
  }
}
</style>

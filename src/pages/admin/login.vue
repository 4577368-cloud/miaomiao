<template>
  <view class="admin-login-container">
    <view class="login-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">管理员登录</text>
      <text class="subtitle">宠乐到家管理后台</text>
    </view>
    
    <view class="login-form">
      <view class="form-item">
        <text class="label">管理员账号</text>
        <input 
          v-model="adminForm.username" 
          type="text" 
          placeholder="请输入管理员账号"
          class="input"
          @input="clearError"
        />
      </view>
      
      <view class="form-item">
        <text class="label">登录密码</text>
        <input 
          v-model="adminForm.password" 
          type="password" 
          placeholder="请输入登录密码"
          class="input"
          @input="clearError"
          @confirm="handleLogin"
        />
      </view>
      
      <view v-if="errorMessage" class="error-message">
        <text class="error-text">{{ errorMessage }}</text>
      </view>
      
      <button 
        class="login-btn" 
        @click="handleLogin"
        :disabled="loading"
        :loading="loading"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </view>
    
    <view class="login-footer">
      <text class="footer-text">© 2024 宠乐到家 - 专业宠物服务平台</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const loading = ref(false);
const errorMessage = ref('');

const adminForm = reactive({
  username: '',
  password: ''
});

const clearError = () => {
  errorMessage.value = '';
};

const handleLogin = async () => {
  if (!adminForm.username.trim()) {
    errorMessage.value = '请输入管理员账号';
    return;
  }
  
  if (!adminForm.password.trim()) {
    errorMessage.value = '请输入登录密码';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    // 调用管理员登录API
    const result = await userStore.adminLogin(adminForm.username, adminForm.password);
    
    if (result.success) {
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 跳转到管理后台首页
      setTimeout(() => {
        uni.redirectTo({
          url: '/pages/admin/index'
        });
      }, 1500);
    } else {
      errorMessage.value = result.message || '登录失败，请检查账号密码';
    }
  } catch (error) {
    console.error('管理员登录失败:', error);
    errorMessage.value = '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.admin-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 80rpx 60rpx 40rpx;
  color: #fff;
}

.login-header {
  text-align: center;
  margin-bottom: 80rpx;
  
  .logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 32rpx;
    border-radius: 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.2);
  }
  
  .title {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    margin-bottom: 16rpx;
    letter-spacing: 2rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    opacity: 0.9;
    font-weight: 300;
  }
}

.login-form {
  flex: 1;
  max-width: 600rpx;
  width: 100%;
  margin: 0 auto;
  
  .form-item {
    margin-bottom: 40rpx;
    
    .label {
      display: block;
      font-size: 28rpx;
      margin-bottom: 16rpx;
      font-weight: 500;
      opacity: 0.95;
    }
    
    .input {
      width: 100%;
      height: 88rpx;
      background: rgba(255, 255, 255, 0.15);
      border: 2rpx solid rgba(255, 255, 255, 0.2);
      border-radius: 12rpx;
      padding: 0 24rpx;
      color: #fff;
      font-size: 30rpx;
      transition: all 0.3s ease;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
        font-size: 28rpx;
      }
      
      &:focus {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        outline: none;
      }
    }
  }
  
  .error-message {
    background: rgba(255, 77, 79, 0.2);
    border: 2rpx solid rgba(255, 77, 79, 0.4);
    border-radius: 8rpx;
    padding: 16rpx 20rpx;
    margin-bottom: 24rpx;
    
    .error-text {
      font-size: 26rpx;
      color: #ffcccc;
      display: block;
    }
  }
  
  .login-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #FF8E3C 0%, #FF6B35 100%);
    color: #fff;
    border: none;
    border-radius: 12rpx;
    font-size: 32rpx;
    font-weight: 600;
    letter-spacing: 2rpx;
    box-shadow: 0 8rpx 24rpx rgba(255, 142, 60, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      transform: translateY(2rpx);
      box-shadow: 0 4rpx 16rpx rgba(255, 142, 60, 0.2);
    }
    
    &:disabled {
      opacity: 0.7;
      transform: none;
      box-shadow: none;
    }
  }
}

.login-footer {
  text-align: center;
  margin-top: 60rpx;
  
  .footer-text {
    font-size: 24rpx;
    opacity: 0.7;
    font-weight: 300;
  }
}
</style>
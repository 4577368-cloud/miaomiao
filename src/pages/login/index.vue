<template>
  <view class="login-container">
    <view class="glass-card">
      <view class="header">
        <image src="/static/logo.png" class="brand-logo" mode="heightFix" @error="onLogoError" />
        <text class="title">您的贴心宠托伙伴</text>
        <text class="subtitle">{{ isRegister ? '创建新账号' : '欢迎回来' }}</text>
      </view>

      <!-- 登录方式切换 (仅在登录模式显示) -->
      <view class="auth-tabs" v-if="!isRegister">
        <text 
          class="tab-item" 
          :class="{ active: loginMethod === 'phone' }"
          @click="loginMethod = 'phone'"
        >手机登录</text>
        <text class="tab-divider">|</text>
        <text 
          class="tab-item" 
          :class="{ active: loginMethod === 'email' }"
          @click="loginMethod = 'email'"
        >邮箱登录</text>
      </view>
      
      <!-- 注册方式切换 (仅在注册模式显示) -->
      <view class="auth-tabs" v-if="isRegister">
         <text 
          class="tab-item" 
          :class="{ active: loginMethod === 'phone' }"
          @click="loginMethod = 'phone'"
        >手机注册</text>
        <text class="tab-divider">|</text>
        <text 
          class="tab-item" 
          :class="{ active: loginMethod === 'email' }"
          @click="loginMethod = 'email'"
        >邮箱注册</text>
      </view>

      <view class="form-item">
        <!-- 手机号输入 -->
        <block v-if="loginMethod === 'phone'">
          <view class="input-group">
            <input 
              class="input-field" 
              type="number" 
              v-model="phone" 
              placeholder="请输入手机号" 
              placeholder-class="input-placeholder"
              maxlength="11"
            />
          </view>
          
          <!-- 验证码输入 (仅注册时需要) -->
          <view class="input-group verify-code-group" v-if="isRegister">
            <input 
              class="input-field code-input" 
              type="number" 
              v-model="verifyCode" 
              placeholder="请输入验证码" 
              placeholder-class="input-placeholder"
              maxlength="6"
            />
            <button 
              class="btn-code" 
              :disabled="isCountingDown" 
              @click="handleSendCode"
            >
              {{ isCountingDown ? `${countdown}s后重发` : '获取验证码' }}
            </button>
          </view>
        </block>

        <!-- 邮箱输入 -->
        <block v-else>
          <view class="input-group">
            <input 
              class="input-field" 
              type="text" 
              v-model="email" 
              placeholder="请输入邮箱" 
              placeholder-class="input-placeholder"
            />
          </view>
        </block>

        <!-- 密码输入 (通用) -->
        <view class="input-group">
          <input 
            class="input-field" 
            type="password" 
            v-model="password" 
            placeholder="请输入密码" 
            placeholder-class="input-placeholder"
          />
        </view>

        <!-- 仅注册时显示：昵称、头像、角色选择 -->
        <block v-if="isRegister">
          <view class="divider"></view>
          
          <view class="avatar-wrapper" @click="mockUploadAvatar">
            <image :src="userInfo.avatar" class="avatar" mode="aspectFill" />
            <view class="avatar-edit">
              <text class="icon-camera">📷</text>
            </view>
          </view>
          
          <input 
            class="input-field" 
            type="nickname" 
            v-model="userInfo.nickname" 
            placeholder="请输入昵称" 
            placeholder-class="input-placeholder"
          />

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
                <text class="role-desc">发布需求</text>
              </view>
              
              <view 
                class="role-card" 
                :class="{ active: userInfo.role === 'sitter' }"
                @click="userInfo.role = 'sitter'"
              >
                <text class="role-icon">🎒</text>
                <text class="role-name">我是宠托师</text>
                <text class="role-desc">接单赚钱</text>
              </view>
            </view>
          </view>
        </block>
      </view>

      <button class="btn-primary" :loading="isLoading" @click="handleAction">
        {{ isRegister ? '立即注册' : '登录' }}
      </button>
      
      <view class="switch-mode" @click="toggleMode">
        <text>{{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}</text>
      </view>
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
    <!-- 角色选择弹窗 (登录后显示) -->
    <view class="role-select-mask" v-if="showRoleSelection">
      <view class="role-select-card">
        <view class="select-header">
          <text class="select-title">请选择登录身份</text>
          <text class="select-desc">您希望以什么身份进入？</text>
        </view>
        
        <view class="role-options">
          <view class="role-option" @click="selectLoginRole('owner')">
            <view class="option-icon owner">🏠</view>
            <view class="option-info">
              <text class="option-title">我是铲屎官</text>
              <text class="option-desc">发布需求，寻找服务</text>
            </view>
            <view class="check-icon" v-if="userStore.userInfo?.role === 'owner'">✓</view>
          </view>
          
          <view class="role-option" @click="selectLoginRole('sitter')">
            <view class="option-icon sitter">🎒</view>
            <view class="option-info">
              <text class="option-title">我是宠托师</text>
              <text class="option-desc">接单赚钱，专业服务</text>
            </view>
            <view class="check-icon" v-if="userStore.userInfo?.role === 'sitter'">✓</view>
          </view>
        </view>
      </view>
    </view>
  </view>
  <view style="height: 100px;"></view>
  <CustomTabBar current-path="pages/login/index" />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { useUserStore, type UserInfo, type SitterProfile } from '@/stores/user';
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { getRandomNickname } from '@/utils/nickname';
import { supabase } from '@/utils/supabase';
import { sendSmsCode, verifySmsCode } from '@/utils/sms';

const userStore = useUserStore();

const isRegister = ref(false);
const showRoleSelection = ref(false);
const loginMethod = ref<'phone' | 'email'>('phone'); // 默认手机号
const email = ref('');
const phone = ref('');
const password = ref('');
const verifyCode = ref('');
const isLoading = ref(false);

// 倒计时相关
const isCountingDown = ref(false);
const countdown = ref(60);
let timer: any = null;

const userInfo = reactive<UserInfo>({
  id: '',
  nickname: getRandomNickname(),
  avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
  role: 'owner',
  joinDate: Date.now()
});

// Logo错误处理
const onLogoError = (event: any) => {
  console.log('Logo加载失败，使用备用图片');
  event.target.src = 'https://via.placeholder.com/200x200/FF8E3C/FFFFFF?text=宠乐到家';
};

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
  '/static/avatars/dog-small.jpg',
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

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  // 切换模式时重置表单
  verifyCode.value = '';
  password.value = '';
  // 默认切回手机
  loginMethod.value = 'phone';
};

const handleSendCode = async () => {
  if (!phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    uni.showToast({ title: '手机号格式错误', icon: 'none' });
    return;
  }
  
  try {
    const success = await sendSmsCode(phone.value);
    if (success) {
      startCountdown();
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '发送失败', icon: 'none' });
  }
};

const startCountdown = () => {
  isCountingDown.value = true;
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      isCountingDown.value = false;
    }
  }, 1000);
};

// 构造虚拟邮箱
const getVirtualEmail = (phoneNum: string) => {
  return `${phoneNum}@phone.miaomiao.com`;
};

const handleAction = async () => {
  // 1. 基础校验
  if (loginMethod.value === 'email' && !email.value) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' });
    return;
  }
  if (loginMethod.value === 'phone' && !phone.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' });
    return;
  }
  if (!password.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }
  
  if (isRegister.value) {
    if (!userInfo.nickname) {
      uni.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    // 手机号注册需要校验验证码
    if (loginMethod.value === 'phone') {
       if (!verifyCode.value) {
         uni.showToast({ title: '请输入验证码', icon: 'none' });
         return;
       }
       if (!verifySmsCode(phone.value, verifyCode.value)) {
         uni.showToast({ title: '验证码错误或已过期', icon: 'none' });
         return;
       }
    }
  }

  isLoading.value = true;

  try {
    const targetEmail = loginMethod.value === 'phone' ? getVirtualEmail(phone.value) : email.value;

    if (isRegister.value) {
      // --- 注册流程 ---
      
      // 1. Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: password.value,
      });

      if (error) throw error;

      if (data.user) {
        // Check if session is missing (implies email confirmation is on)
        if (!data.session && loginMethod.value === 'phone') {
           uni.showModal({
             title: '配置提示',
             content: '检测到 Supabase 开启了邮箱验证。由于当前使用模拟手机号注册（虚拟邮箱），请务必在 Supabase 后台关闭 "Enable Email Confirmations" 选项，否则将无法登录。\n\n路径: Authentication -> Providers -> Email',
             showCancel: false,
             confirmText: '我知道了'
           });
        } else if (!data.session && loginMethod.value === 'email') {
           uni.showToast({ title: '注册成功，请前往邮箱激活账号', icon: 'none', duration: 3000 });
           isRegister.value = false;
           return;
        }

        // 2. Create Profile
        const profileData: any = {
          id: data.user.id,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          role: userInfo.role
        };
        
        // 如果是手机注册，原本想保存手机号，但 Schema 可能不支持，先注释掉
        // if (loginMethod.value === 'phone') {
        //   profileData.phone = phone.value;
        // }

        const { error: profileError } = await supabase.from('profiles').insert(profileData);

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          // 这里可以考虑回滚 Auth 注册，但为了 MVP 简单起见暂时忽略
        }
        
        if (data.session || loginMethod.value === 'phone') {
           uni.showToast({ title: '注册成功，请登录', icon: 'success' });
           // 自动切换到登录模式
           isRegister.value = false; 
           password.value = ''; 
        }
      }
    } else {
      // --- 登录流程 ---
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password.value,
      });

      if (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('Invalid login credentials')) {
           throw new Error('账号或密码错误');
        }
        
        // 处理 Supabase 邮箱验证未关闭的情况
        if (error.message.includes('Email not confirmed')) {
           if (loginMethod.value === 'phone') {
             uni.showModal({
               title: '需关闭邮箱验证',
               content: '手机号注册使用的是虚拟邮箱，无法接收验证邮件。\n\n为了测试手机号登录，请在 Supabase 后台关闭 "Enable Email Confirmations"。\n\n或者手动在 Auth 表中将该用户设为已验证。',
               showCancel: false,
               confirmText: '我知道了'
             });
             return;
           } else {
             // 真实邮箱注册，提示去激活
             uni.showToast({ title: '账号未激活，请前往邮箱查收验证邮件', icon: 'none', duration: 4000 });
             return;
           }
        }
        
        // 检查是否触发了 Captcha (虽然概率小)
        if (error.message.includes('captcha')) {
           uni.showModal({
             title: '安全验证',
             content: '系统检测到频繁操作，触发了安全验证。请稍后重试，或在 Supabase 后台 Security 设置中关闭 Captcha 保护。',
             showCancel: false
           });
           return;
        }

        throw error;
      }
      
      if (data.user) {
        // Fetch profile and update store
        await userStore.fetchProfile(data.user.id, data.user.email);
        
        uni.showToast({ title: '登录成功', icon: 'success' });
        
        // 登录成功后，弹出身份选择
        showRoleSelection.value = true;
      }
    }
  } catch (e: any) {
    console.error(e);
    uni.showToast({ title: e.message || '操作失败', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

const selectLoginRole = async (role: 'owner' | 'sitter') => {
  // 如果选择的身份与当前不同，则切换
  if (userStore.userInfo?.role !== role) {
    await userStore.switchRole(role);
  } else {
    // 相同则直接跳转
    uni.reLaunch({ url: '/pages/home/index' });
  }
  showRoleSelection.value = false;
};

onShow(() => {
  if (userStore.isLoggedIn && !showRoleSelection.value) {
    uni.reLaunch({ url: '/pages/home/index' });
  }
});
</script>

<style lang="scss" scoped>
@import '@/styles/vars.scss';

.login-container {
  min-height: 100vh;
  background-color: #FFFBF5;
  background-image: 
    radial-gradient(at 10% 10%, rgba(255, 142, 60, 0.1) 0px, transparent 50%),
    radial-gradient(at 90% 90%, rgba(255, 107, 107, 0.1) 0px, transparent 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.glass-card {
  width: 100%;
  background: #ffffff;
  border-radius: 40rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.header {
  text-align: center;
  margin-bottom: 50rpx;
  
  .brand-logo {
    height: 140rpx;
    margin-bottom: 30rpx;
    border-radius: 24rpx;
    box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.05);
  }
  
  .title {
    display: block;
    font-size: 44rpx;
    font-weight: 800;
    color: #333;
    margin-bottom: 16rpx;
    letter-spacing: 2rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #999;
    letter-spacing: 1rpx;
  }
}

.auth-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 50rpx;
  
  .tab-item {
    font-size: 30rpx;
    color: #999;
    padding: 10rpx 30rpx;
    transition: all 0.3s;
    position: relative;
    
    &.active {
      color: #333;
      font-weight: 700;
      font-size: 32rpx;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -6rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 32rpx;
        height: 6rpx;
        background: $color-primary;
        border-radius: 6rpx;
      }
    }
  }
  
  .tab-divider {
    color: #eee;
    margin: 0 10rpx;
    font-size: 24rpx;
    font-weight: 300;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50rpx;
  width: 100%;
}

.input-group {
  width: 100%;
  margin-bottom: 30rpx;
}

.input-field {
  width: 100%;
  height: 100rpx;
  background: #F7F8FA;
  border-radius: 50rpx;
  padding: 0 50rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
  border: 2rpx solid transparent;
  transition: all 0.3s;
  
  &:focus {
    background: #fff;
    border-color: $color-primary;
    box-shadow: 0 0 0 6rpx rgba(255, 142, 60, 0.1);
  }
}

.verify-code-group {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  
  .code-input {
    padding-right: 240rpx; // Space for button
  }
  
  .btn-code {
    position: absolute;
    right: 12rpx;
    top: 50%;
    transform: translateY(-50%);
    height: 72rpx;
    line-height: 72rpx;
    font-size: 26rpx;
    font-weight: 500;
    color: $color-primary;
    background: #FFF0E5;
    border-radius: 36rpx;
    padding: 0 30rpx;
    border: none;
    z-index: 10;
    
    &[disabled] {
      color: #ccc;
      background: #f5f5f5;
    }
    
    &::after {
      border: none;
    }
    
    &:active {
      opacity: 0.8;
    }
  }
}

.input-placeholder {
  color: #bbb;
}

.divider {
  width: 100%;
  height: 2rpx;
  background: #f0f0f0;
  margin: 30rpx 0 50rpx;
}

.avatar-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
  
  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6rpx solid #fff;
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.1);
  }
  
  .avatar-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 56rpx;
    height: 56rpx;
    background: $color-primary;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid #fff;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
    
    .icon-camera {
      font-size: 28rpx;
    }
  }
}

.role-selection {
  width: 100%;
  margin-top: 10rpx;
  
  .section-label {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #666;
    margin-bottom: 24rpx;
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
  background: #F7F8FA;
  border-radius: 24rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
  transition: all 0.3s;
  
  &.active {
    background: #FFF0E5;
    border-color: $color-primary;
    box-shadow: 0 12rpx 24rpx rgba(255, 142, 60, 0.15);
    transform: translateY(-4rpx);
    
    .role-name {
      color: $color-primary;
    }
  }
  
  .role-icon {
    font-size: 56rpx;
    margin-bottom: 16rpx;
  }
  
  .role-name {
    font-size: 28rpx;
    font-weight: 700;
    color: #666;
    margin-bottom: 8rpx;
  }
  
  .role-desc {
    font-size: 22rpx;
    color: #999;
  }
}

.btn-primary {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background: linear-gradient(90deg, #FF8E3C 0%, #FF6B6B 100%);
  border-radius: 50rpx;
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  box-shadow: 0 20rpx 40rpx rgba(255, 107, 107, 0.25);
  margin-bottom: 40rpx;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.switch-mode {
  text-align: center;
  padding: 20rpx;
  
  text {
    font-size: 28rpx;
    color: #666;
    position: relative;
    padding-bottom: 4rpx;
    border-bottom: 2rpx solid transparent;
    transition: all 0.3s;
    
    &:active {
      color: $color-primary;
      border-bottom-color: $color-primary;
    }
  }
}

// Avatar Popup Styles
.avatar-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.avatar-popup-content {
  width: 640rpx;
  max-height: 75vh;
  background: #fff;
  border-radius: 40rpx;
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  box-sizing: border-box;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.2);
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
    flex-shrink: 0;
    
    .popup-title {
      font-size: 36rpx;
      font-weight: 800;
      color: #333;
    }
    
    .popup-close {
      font-size: 50rpx;
      color: #999;
      padding: 10rpx;
      line-height: 0.8;
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
    gap: 30rpx;
    padding: 10rpx 10rpx 30rpx;
    justify-content: center;
    
    .avatar-item {
      width: 130rpx;
      height: 130rpx;
      border-radius: 50%;
      overflow: hidden;
      border: 6rpx solid #F7F8FA;
      position: relative;
      transition: all 0.2s;
      
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

.role-select-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.role-select-card {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 40rpx;
  padding: 60rpx 40rpx;
  animation: slideUp 0.3s ease-out;

  .select-header {
    text-align: center;
    margin-bottom: 50rpx;

    .select-title {
      font-size: 40rpx;
      font-weight: 600;
      color: #333;
      display: block;
      margin-bottom: 16rpx;
    }

    .select-desc {
      font-size: 28rpx;
      color: #999;
    }
  }

  .role-options {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
  }

  .role-option {
    display: flex;
    align-items: center;
    padding: 30rpx;
    background: #f9f9f9;
    border: 2rpx solid transparent;
    border-radius: 24rpx;
    transition: all 0.3s;

    &:active {
      transform: scale(0.98);
      background: #fffbf5;
      border-color: $color-primary;
    }

    .option-icon {
      width: 100rpx;
      height: 100rpx;
      background: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48rpx;
      margin-right: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);

      &.owner { background: #E3F2FD; }
      &.sitter { background: #FFF3E0; }
    }

    .option-info {
      flex: 1;
      
      .option-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .option-desc {
        font-size: 24rpx;
        color: #999;
      }
    }

    .check-icon {
      font-size: 32rpx;
      color: $color-primary;
      font-weight: bold;
    }
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
